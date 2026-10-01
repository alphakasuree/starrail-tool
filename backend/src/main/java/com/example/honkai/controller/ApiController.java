package com.example.honkai.controller;
import com.example.honkai.dto.ApiDtos.*;
import com.example.honkai.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import java.util.Map;
@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class ApiController {
    private final TokenService tokens;
    private final WarpService warp;
    @GetMapping("/health") public Map<String,String> health() { return Map.of("status","ok"); }
    @PostMapping("/profiles") @ResponseStatus(HttpStatus.CREATED)
    public ProfileToken create(@Valid @RequestBody CreateProfile request) {
        throw new org.springframework.web.server.ResponseStatusException(HttpStatus.GONE,"새 프로필은 회원가입으로 생성하세요. 기존 토큰은 계정 전환에 사용할 수 있습니다.");
    }
    @GetMapping("/warp/progress") public Progress progress(@AuthenticationPrincipal Long profileId) { return warp.progress(profileId); }
    @PostMapping("/warp/pull") public PullResponse pull(@AuthenticationPrincipal Long profileId,@Valid @RequestBody PullRequest request) { return warp.pull(profileId,request); }
    @PutMapping("/warp/selection") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void selection(@AuthenticationPrincipal Long profileId,@Valid @RequestBody Selection request) { warp.selection(profileId,request); }
}
