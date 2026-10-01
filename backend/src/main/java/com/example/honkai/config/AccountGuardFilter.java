package com.example.honkai.config;
import com.example.honkai.repository.ProfileRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
// This optional header is a consistency check, never an authorization source.
// It prevents a stale tab from saving into another account after a cookie switch.
@RequiredArgsConstructor
public class AccountGuardFilter extends OncePerRequestFilter {
    private final ProfileRepository profiles;
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String expected=request.getHeader("X-Honkai-Account");
        var authentication=SecurityContextHolder.getContext().getAuthentication();
        if (expected!=null && authentication!=null && authentication.getPrincipal() instanceof Long id) {
            if (profiles.findById(id).filter(p->expected.equals(p.getPublicId())).isEmpty()) { response.sendError(401,"다른 탭에서 계정이 변경되었습니다. 다시 로그인하세요."); return; }
        }
        chain.doFilter(request,response);
    }
}
