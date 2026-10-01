package com.example.honkai.config;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
// A non-simple header and a strict Origin allowlist protect all cookie writes,
// including login CSRF. HTML forms cannot send this header; cross-origin fetch
// must first pass the configured CORS preflight.
public class ApiOriginFilter extends OncePerRequestFilter {
    private final Set<String> origins;
    public ApiOriginFilter(String configured) {
        origins=new HashSet<>(Arrays.asList(configured.split(",")));
        Set<String> normalized=new HashSet<>(); origins.forEach(o->normalized.add(o.trim())); origins.clear(); origins.addAll(normalized);
        if (origins.contains("*") || origins.contains("null")) throw new IllegalArgumentException("Explicit trusted frontend origins are required.");
    }
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        if (request.getRequestURI().startsWith("/api/")) {
            response.setHeader("Cache-Control","no-store");
            if (!Set.of("GET","HEAD","OPTIONS").contains(request.getMethod())) {
                String origin=request.getHeader("Origin");
                // Legacy bearer clients do not use ambient cookies; retain their
                // existing warp API while requiring Origin checks when supplied.
                boolean hasSessionCookie=request.getCookies()!=null && Arrays.stream(request.getCookies()).anyMatch(c->SessionCookies.NAME.equals(c.getName()));
                boolean legacy=!hasSessionCookie && request.getHeader("Authorization")!=null && request.getHeader("Authorization").startsWith("Bearer ") && request.getRequestURI().startsWith("/api/warp/");
                if ((!legacy && !"web".equals(request.getHeader("X-Honkai-Client"))) || (origin!=null && !origins.contains(origin))) {
                    response.sendError(403,"요청 출처를 확인할 수 없습니다."); return;
                }
            }
        }
        chain.doFilter(request,response);
    }
}
