package com.example.honkai.controller;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;
@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> duplicate(org.springframework.dao.DataIntegrityViolationException error) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,"요청이 기존 데이터와 충돌합니다. 다시 확인하세요."));
    }
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ProblemDetail> status(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(ProblemDetail.forStatusAndDetail(error.getStatusCode(),error.getReason()==null ? "요청 실패" : error.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> validation(MethodArgumentNotValidException error) {
        return ResponseEntity.badRequest().body(ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,"요청 데이터 형식이 잘못되었습니다."));
    }
}
