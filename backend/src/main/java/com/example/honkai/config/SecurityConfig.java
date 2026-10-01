package com.example.honkai.config;
import com.example.honkai.service.TokenService;
import org.springframework.context.annotation.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
@Configuration
public class SecurityConfig {
    @Bean SecurityFilterChain security(HttpSecurity http,TokenService tokens) throws Exception {
        return http.cors(Customizer.withDefaults()).csrf(csrf->csrf.disable())
            .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a.requestMatchers(HttpMethod.POST,"/api/profiles").permitAll().requestMatchers("/api/health").permitAll().anyRequest().authenticated())
            .exceptionHandling(e->e.authenticationEntryPoint((req,res,error)->res.sendError(401,"로그인이 필요합니다.")))
            .addFilterBefore(new BearerFilter(tokens),UsernamePasswordAuthenticationFilter.class).build();
    }
}
