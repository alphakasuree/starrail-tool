package com.example.honkai.controller;
import com.example.honkai.dto.AccountDtos.*;
import com.example.honkai.service.DocumentService;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/account") @RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documents;
    @GetMapping("/documents") public Map<String,Document> all(@AuthenticationPrincipal Long id) { return documents.all(id); }
    @PutMapping("/documents/{section}") public Document save(@AuthenticationPrincipal Long id,@PathVariable String section,@Valid @RequestBody SaveDocument body) { return documents.save(id,section,body); }
    @PostMapping("/import") public ImportResult importData(@AuthenticationPrincipal Long id,@Valid @RequestBody ImportData body) { return documents.importData(id,body); }
}
