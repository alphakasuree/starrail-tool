package com.example.honkai.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;
import java.util.Arrays;
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${app.allowed-origins}") private String origins;
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(Arrays.stream(origins.split(",")).map(String::trim).toArray(String[]::new))
            .allowedMethods("GET","POST","PUT","OPTIONS").allowedHeaders("Authorization","Content-Type","X-Honkai-Client","X-Honkai-Account").allowCredentials(true).maxAge(3600);
    }
}
