package com.example.honkai.dto;
import com.example.honkai.entity.*;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
public final class ApiDtos {
    private ApiDtos() {}
    public record CreateProfile(@NotBlank @Size(max=30) String displayName) {}
    public record ProfileToken(String profileId, String token, Instant expiresAt) {
        @Override public String toString() { return "ProfileToken[redacted]"; }
    }
    public record PullRequest(@NotNull UUID requestId, @NotBlank @Size(max=64) String bannerKey,
        @Min(1) @Max(10) int count, @PositiveOrZero long expectedRevision) {}
    public record Selection(@NotBlank @Size(max=30) String character, @NotBlank @Size(max=30) String lightcone) {}
    public record State(int pity4, int pity5, boolean guaranteed4, boolean guaranteed5, long revision) {
        public static State from(PityState s) { return new State(s.getPity4(),s.getPity5(),s.isGuaranteed4(),s.isGuaranteed5(),s.getRevision()); }
    }
    public record Result(Long historyId, String id, String name, int rarity, String type,
        String bannerId, String bannerTitle, boolean featured, Instant time) {
        public static Result from(WarpHistory h) {
            WarpItem i=h.getItem(); WarpBanner b=h.getBatch().getBanner();
            return new Result(h.getId(),i.getCatalogId(),i.getName(),i.getRarity(),i.getItemType(),b.getFeaturedItem().getCatalogId(),b.getTitle(),h.isFeatured(),h.getPulledAt());
        }
    }
    public record PullResponse(UUID requestId, String pityGroup, List<Result> results, State state) {}
    public record Progress(int version, Map<String,State> bannerStates, Map<String,String> selectedPickups,
        Map<String,List<Result>> history, Map<String,Integer> inventory) {}
}
