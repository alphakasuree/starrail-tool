package com.example.honkai.service;
import com.example.honkai.dto.ApiDtos.*;
import com.example.honkai.entity.*;
import com.example.honkai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.text.Normalizer;
import java.util.*;
@Service @RequiredArgsConstructor
public class TokenService {
    private final ProfileRepository profiles;
    private final SessionRepository sessions;
    private final SecureRandom random = new SecureRandom();
    @Transactional
    public ProfileToken create(String displayName) {
        String name=Normalizer.normalize(displayName.trim(), Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        if (!name.matches("[\\p{L}\\p{N}_.-]{1,30}")) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"아이디 형식이 잘못되었습니다.");
        Instant now=Instant.now();
        Profile profile=new Profile(); profile.setPublicId(UUID.randomUUID().toString());
        profile.setDisplayName(name); profile.setCreatedAt(now); profiles.save(profile);
        byte[] secret=new byte[32]; random.nextBytes(secret);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        ProfileSession session=new ProfileSession(); session.setTokenHash(hash(token));
        session.setProfileId(profile.getId()); session.setExpiresAt(now.plus(Duration.ofDays(180)));
        sessions.save(session);
        return new ProfileToken(profile.getPublicId(),token,session.getExpiresAt());
    }
    @Transactional(readOnly=true)
    public Optional<Long> authenticate(String token) {
        if (!token.matches("[A-Za-z0-9_-]{43}")) return Optional.empty();
        return sessions.findById(hash(token)).filter(s->s.getExpiresAt().isAfter(Instant.now())).map(ProfileSession::getProfileId);
    }
    public static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
