package com.example.honkai.config;
import com.example.honkai.service.AccountService.Issued;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.*;
import java.time.*;
import java.util.*;
@Component
public class SessionCookies {
    public static final String NAME="honkai_session";
    @Value("${app.session.cookie-secure:true}") private boolean secure;
    @Value("${app.session.same-site:Lax}") private String sameSite;
    @PostConstruct void validate() {
        if (!Set.of("Lax","Strict","None").contains(sameSite) || (!secure && sameSite.equals("None")))
            throw new IllegalStateException("SameSite must be Lax/Strict/None; None requires Secure cookies.");
    }
    public String read(HttpServletRequest request) {
        if (request.getCookies()==null) return null;
        return Arrays.stream(request.getCookies()).filter(c->NAME.equals(c.getName())).map(Cookie::getValue).findFirst().orElse(null);
    }
    public void write(HttpServletRequest request,HttpServletResponse response,Issued issued) {
        if (!secure && !Set.of("localhost","127.0.0.1","[::1]","::1").contains(request.getServerName()))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST,"HTTP 쿠키는 localhost에서만 허용됩니다.");
        long seconds=Math.max(1,Duration.between(Instant.now(),issued.account().expiresAt()).getSeconds());
        response.addHeader(HttpHeaders.SET_COOKIE,cookie(issued.token()).maxAge(seconds).build().toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL,"no-store");
    }
    public void clear(HttpServletResponse response) { response.addHeader(HttpHeaders.SET_COOKIE,cookie("").maxAge(0).build().toString()); }
    private ResponseCookie.ResponseCookieBuilder cookie(String token) { return ResponseCookie.from(NAME,token).httpOnly(true).secure(secure).sameSite(sameSite).path("/api"); }
}
