package com.example.honkai.config;
import com.example.honkai.service.TokenService;
import org.springframework.context.annotation.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.honkai.service.AccountService;
import com.example.honkai.repository.ProfileRepository;
@Configuration
public class SecurityConfig {
    @Bean PasswordEncoder passwords() { return new BCryptPasswordEncoder(12); }
    @Bean SecurityFilterChain security(HttpSecurity http,TokenService tokens,AccountService accounts,SessionCookies cookies,ProfileRepository profiles,@Value("${app.allowed-origins}") String origins) throws Exception {
        return http.cors(Customizer.withDefaults()).csrf(csrf->csrf.disable())
            .sessionManagement(s->s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a->a.requestMatchers(HttpMethod.POST,"/api/profiles","/api/auth/register","/api/auth/login","/api/auth/upgrade","/api/auth/logout").permitAll().requestMatchers("/api/health").permitAll().anyRequest().authenticated())
            .exceptionHandling(e->e.authenticationEntryPoint((req,res,error)->res.sendError(401,"로그인이 필요합니다.")))
            .addFilterBefore(new ApiOriginFilter(origins),UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(new BearerFilter(tokens,accounts,cookies),UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(new AccountGuardFilter(profiles),BearerFilter.class).build();
    }
}
