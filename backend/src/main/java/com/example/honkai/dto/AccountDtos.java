package com.example.honkai.dto;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.Map;
public final class AccountDtos {
    private AccountDtos() {}
    public record Register(@NotBlank @Size(min=3,max=30) String loginId,
        @NotBlank @Size(max=30) String displayName, @NotNull @Size(min=10,max=72) String password) {
        @Override public String toString() { return "Register[redacted]"; }
    }
    public record Login(@NotBlank @Size(min=3,max=30) String loginId, @NotNull @Size(min=1,max=72) String password) {
        @Override public String toString() { return "Login[redacted]"; }
    }
    public record Account(String profileId,String loginId,String displayName,Instant expiresAt,Instant absoluteExpiresAt) {
        @Override public String toString() { return "Account[redacted]"; }
    }
    public record Document(JsonNode entries,long revision) {}
    public record SaveDocument(@NotNull JsonNode entries,@PositiveOrZero long expectedRevision) {}
    public record ImportData(@NotNull JsonNode relic,@NotNull JsonNode teams) {}
    public record ImportResult(boolean alreadyImported,int addedRelics,int addedTeams,Map<String,Document> documents) {}
}
