package com.example.honkai;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication(exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration.class)
public class HonkaiApplication { public static void main(String[] args) { SpringApplication.run(HonkaiApplication.class, args); } }
