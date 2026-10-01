package com.example.honkai.service;
import com.example.honkai.dto.AccountDtos.*;
import com.example.honkai.entity.*;
import com.example.honkai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.text.Normalizer;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class AccountService {
    private final ProfileRepository profiles;
    private final SessionRepository legacySessions;
    private final AccountSessionRepository sessions;
    private final TokenService legacyTokens;
    private final PasswordEncoder passwords;
    private final JdbcTemplate jdbc;
    private final SecureRandom random=new SecureRandom();
    @Value("${app.session.hours:12}") private long sessionHours;
    @Value("${app.session.absolute-days:30}") private long absoluteDays;
    @jakarta.annotation.PostConstruct void validateLifetime() {
        if (sessionHours<1 || sessionHours>8760 || absoluteDays<1 || absoluteDays>365) throw new IllegalStateException("Session lifetime must be between 1 hour and 365 days.");
    }
    // Valid bcrypt hash; unknown IDs still perform bcrypt verification.
    private static final String DUMMY_HASH="$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
    private record Throttle(Instant started,Instant blocked) {}
    private static LocalDateTime sqlTime(Instant instant) { return LocalDateTime.ofInstant(instant,ZoneOffset.UTC); }
    public record Issued(Account account,String token) {
        @Override public String toString() { return "Issued[redacted]"; }
    }
    public static String normalizeLogin(String value) {
        String id=Normalizer.normalize(value.trim(),Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        if (!id.matches("[a-z0-9_.-]{3,30}")) throw fail(HttpStatus.BAD_REQUEST,"로그인 아이디는 3~30자의 영문·숫자·밑줄·점·하이픈입니다.");
        return id;
    }
    private static void validatePassword(String value) {
        if (value==null || value.length()<10 || value.getBytes(StandardCharsets.UTF_8).length>72)
            throw fail(HttpStatus.BAD_REQUEST,"비밀번호는 10자 이상, UTF-8 기준 72바이트 이하여야 합니다.");
    }
    @Transactional
    public Issued register(Register request) { return registerProfile(request,null); }
    @Transactional
    public Issued upgrade(Register request,String token) {
        Long id=legacyTokens.authenticate(token).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"기존 프로필의 유효한 토큰이 필요합니다."));
        Profile profile=profiles.lock(id).orElseThrow();
        if (profile.getLoginId()!=null || legacyTokens.authenticate(token).isEmpty()) throw fail(HttpStatus.CONFLICT,"이미 전환되었거나 만료된 프로필입니다.");
        return registerProfile(request,profile);
    }
    private Issued registerProfile(Register request,Profile previous) {
        String login=normalizeLogin(request.loginId()); validatePassword(request.password());
        String display=Normalizer.normalize(request.displayName().strip(),Normalizer.Form.NFC);
        if (display.isEmpty() || display.length()>30 || display.chars().anyMatch(Character::isISOControl)) throw fail(HttpStatus.BAD_REQUEST,"표시 이름은 1~30자로 입력하세요.");
        if (profiles.findByLoginId(login).isPresent()) throw fail(HttpStatus.CONFLICT,"사용할 수 없는 로그인 아이디입니다.");
        Profile profile=previous==null ? new Profile() : previous;
        if (previous==null) { profile.setPublicId(UUID.randomUUID().toString()); profile.setCreatedAt(Instant.now()); }
        profile.setLoginId(login); profile.setDisplayName(display); profile.setPasswordHash(passwords.encode(request.password()));
        profiles.saveAndFlush(profile);
        if (previous!=null) legacySessions.deleteByProfileId(profile.getId());
        return issue(profile,Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS).plus(Duration.ofDays(absoluteDays)));
    }
    @Transactional(noRollbackFor=ResponseStatusException.class)
    public Issued login(Login request,String ip) {
        String login=normalizeLogin(request.loginId());
        if (request.password().getBytes(StandardCharsets.UTF_8).length>72) throw fail(HttpStatus.BAD_REQUEST,"비밀번호가 너무 깁니다.");
        Instant now=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
        // Always lock the IP bucket before the login bucket. A blocked IP cannot
        // create an unlimited number of new login buckets.
        String userKey=TokenService.hash("login:"+login),ipKey=TokenService.hash("ip:"+ip);
        List<String> keys=List.of(ipKey,userKey);
        for (String key:keys) {
            jdbc.update("INSERT INTO login_throttle(bucket_key,failures,window_started_at) VALUES (?,0,?) ON DUPLICATE KEY UPDATE bucket_key=bucket_key",key,sqlTime(now));
            Throttle row=jdbc.queryForObject("SELECT window_started_at,blocked_until FROM login_throttle WHERE bucket_key=? FOR UPDATE",(rs,n)->{
                LocalDateTime started=rs.getObject("window_started_at",LocalDateTime.class),blocked=rs.getObject("blocked_until",LocalDateTime.class);
                return new Throttle(started.toInstant(ZoneOffset.UTC),blocked==null ? null : blocked.toInstant(ZoneOffset.UTC));
            },key);
            if (row.blocked()!=null && row.blocked().isAfter(now)) throw fail(HttpStatus.TOO_MANY_REQUESTS,"로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.");
            if (!row.started().plus(Duration.ofMinutes(15)).isAfter(now) || row.blocked()!=null)
                jdbc.update("UPDATE login_throttle SET failures=0,window_started_at=?,blocked_until=NULL WHERE bucket_key=?",sqlTime(now),key);
        }
        Profile profile=profiles.findByLoginId(login).orElse(null);
        boolean matched=passwords.matches(request.password(),profile==null ? DUMMY_HASH : profile.getPasswordHash());
        if (profile==null || !matched) {
            for (String key:keys) {
                int limit=key.equals(userKey) ? 5 : 20;
                jdbc.update("UPDATE login_throttle SET failures=failures+1 WHERE bucket_key=?",key);
                int failures=jdbc.queryForObject("SELECT failures FROM login_throttle WHERE bucket_key=?",Integer.class,key);
                if (failures>=limit) jdbc.update("UPDATE login_throttle SET blocked_until=? WHERE bucket_key=?",sqlTime(now.plus(Duration.ofMinutes(15))),key);
            }
            throw fail(HttpStatus.UNAUTHORIZED,"아이디 또는 비밀번호가 잘못되었습니다.");
        }
        jdbc.update("UPDATE login_throttle SET failures=0,blocked_until=NULL WHERE bucket_key=?",userKey);
        return issue(profile,now.plus(Duration.ofDays(absoluteDays)));
    }
    private Issued issue(Profile profile,Instant absoluteExpiry) {
        Instant now=Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS); byte[] bytes=new byte[32]; random.nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        AccountSession session=new AccountSession(); session.setTokenHash(TokenService.hash(token)); session.setProfileId(profile.getId());
        session.setCreatedAt(now); session.setAbsoluteExpiresAt(absoluteExpiry);
        Instant expiry=now.plus(Duration.ofHours(sessionHours)); session.setExpiresAt(expiry.isBefore(absoluteExpiry) ? expiry : absoluteExpiry);
        sessions.save(session); return new Issued(view(profile,session),token);
    }
    private static boolean valid(AccountSession session) {
        Instant now=Instant.now(); return session.getExpiresAt().isAfter(now) && session.getAbsoluteExpiresAt().isAfter(now);
    }
    @Transactional(readOnly=true)
    public Optional<Long> authenticate(String token) {
        if (token==null || !token.matches("[A-Za-z0-9_-]{43}")) return Optional.empty();
        return sessions.findById(TokenService.hash(token)).filter(AccountService::valid).map(AccountSession::getProfileId);
    }
    @Transactional(readOnly=true)
    public Account me(Long id,String token) {
        AccountSession session=sessions.findById(TokenService.hash(token)).filter(s->s.getProfileId().equals(id) && valid(s)).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"세션이 만료되었습니다."));
        return view(requireAccount(id),session);
    }
    @Transactional
    public Issued refresh(String token) {
        AccountSession old=sessions.lock(TokenService.hash(token)).filter(AccountService::valid).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"세션이 만료되었습니다. 다시 로그인하세요."));
        Profile profile=requireAccount(old.getProfileId());
        sessions.delete(old); sessions.flush();
        return issue(profile,old.getAbsoluteExpiresAt());
    }
    @Transactional
    public void logout(String token) {
        if (token!=null && token.matches("[A-Za-z0-9_-]{43}")) sessions.lock(TokenService.hash(token)).ifPresent(sessions::delete);
    }
    public Profile requireAccount(Long id) {
        return profiles.findById(id).filter(p->p.getLoginId()!=null).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"계정 로그인이 필요합니다."));
    }
    private static Account view(Profile p,AccountSession s) { return new Account(p.getPublicId(),p.getLoginId(),p.getDisplayName(),s.getExpiresAt(),s.getAbsoluteExpiresAt()); }
    private static ResponseStatusException fail(HttpStatus status,String message) { return new ResponseStatusException(status,message); }
}
