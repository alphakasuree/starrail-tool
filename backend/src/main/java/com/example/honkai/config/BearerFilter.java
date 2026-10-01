package com.example.honkai.config;
import com.example.honkai.service.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
@RequiredArgsConstructor
public class BearerFilter extends OncePerRequestFilter {
    private final TokenService tokens;
    @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain) throws ServletException,IOException {
        String header=request.getHeader("Authorization");
        if (header!=null && header.startsWith("Bearer ")) tokens.authenticate(header.substring(7)).ifPresent(id->
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id,null,List.of())));
        chain.doFilter(request,response);
    }
}
