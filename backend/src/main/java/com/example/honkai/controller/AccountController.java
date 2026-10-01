package com.example.honkai.controller;
import com.example.honkai.dto.AccountDtos.*;
import com.example.honkai.service.AccountService;
import com.example.honkai.config.SessionCookies;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AccountController {
    private final AccountService accounts;
    private final SessionCookies cookies;
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public Account register(@Valid @RequestBody Register body,HttpServletRequest request,HttpServletResponse response) {
        var issued=accounts.register(body); cookies.write(request,response,issued); return issued.account();
    }
    @PostMapping("/login")
    public Account login(@Valid @RequestBody Login body,HttpServletRequest request,HttpServletResponse response) {
        var issued=accounts.login(body,request.getRemoteAddr()); cookies.write(request,response,issued); return issued.account();
    }
    @PostMapping("/upgrade") @ResponseStatus(HttpStatus.CREATED)
    public Account upgrade(@Valid @RequestBody Register body,HttpServletRequest request,HttpServletResponse response) {
        String header=request.getHeader("Authorization");
        if (header==null || !header.startsWith("Bearer ")) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"기존 프로필 토큰이 필요합니다.");
        var issued=accounts.upgrade(body,header.substring(7)); cookies.write(request,response,issued); return issued.account();
    }
    @GetMapping("/me")
    public Account me(@AuthenticationPrincipal Long id,HttpServletRequest request) {
        String token=cookies.read(request);
        if (token==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"계정 로그인이 필요합니다.");
        return accounts.me(id,token);
    }
    @PostMapping("/refresh")
    public Account refresh(HttpServletRequest request,HttpServletResponse response) {
        String token=cookies.read(request);
        if (token==null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"계정 로그인이 필요합니다.");
        var issued=accounts.refresh(token); cookies.write(request,response,issued); return issued.account();
    }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request,HttpServletResponse response) { accounts.logout(cookies.read(request)); cookies.clear(response); }
}
