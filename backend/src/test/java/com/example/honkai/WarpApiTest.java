package com.example.honkai;
import com.example.honkai.dto.ApiDtos.*;
import com.example.honkai.service.*;
import com.example.honkai.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class WarpApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired TokenService tokens;
    @Autowired WarpService warp;
    @Autowired BannerRepository banners;
    @Autowired PoolRepository pools;
    @Test @org.springframework.transaction.annotation.Transactional
    void everyImportedBannerHasUsablePools() {
        assertThat(banners.count()).isEqualTo(116);
        assertThat(pools.findPool("character:1503").stream().map(p->p.getItem().getItemKey()).toList())
            .contains("character:1001").doesNotContain("character:1224");
        for (var banner:banners.findAll()) {
            var pool=pools.findPool(banner.getBannerKey());
            assertThat(pool.stream().filter(p->p.getItem().getRarity()==3).count()).isPositive();
            assertThat(pool.stream().filter(p->p.getItem().getRarity()==4 && !p.isFeatured()).count()).isPositive();
            assertThat(pool.stream().filter(p->p.getItem().getRarity()==5 && !p.isFeatured()).count()).isEqualTo(7);
            assertThat(pool.stream().filter(p->p.getItem().getRarity()==5 && p.isFeatured()).count()).isEqualTo(1);
            assertThat(pool.stream().anyMatch(p->p.getItem().getRarity()==4 && p.isFeatured())).isEqualTo(banner.isFeaturedFour());
        }
    }
    @Test void bannersShareNormalPityButSeparateCollaborationPity() {
        Long id=tokens.authenticate(tokens.create("groups").token()).orElseThrow();
        warp.pull(id,new PullRequest(UUID.randomUUID(),"character:1503",1,0));
        warp.pull(id,new PullRequest(UUID.randomUUID(),"character:1102",1,1));
        String collaboration=banners.findAll().stream().filter(b->b.getPityGroup().equals("characterCollaboration")).findFirst().orElseThrow().getBannerKey();
        warp.pull(id,new PullRequest(UUID.randomUUID(),collaboration,1,0));
        Progress progress=warp.progress(id);
        assertThat(progress.bannerStates().get("character").revision()).isEqualTo(2);
        assertThat(progress.bannerStates().get("characterCollaboration").revision()).isEqualTo(1);
        assertThat(progress.history().get("character")).hasSize(2);
        assertThat(progress.history().get("characterCollaboration")).hasSize(1);
    }
    @Test void requiresTokenAndAllowsConfiguredCors() throws Exception {
        mvc.perform(get("/api/warp/progress")).andExpect(status().isUnauthorized());
        mvc.perform(options("/api/warp/pull").header("Origin","https://example.github.io")
            .header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","authorization,content-type"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","https://example.github.io"));
        mvc.perform(options("/api/warp/pull").header("Origin","https://other.example")
            .header("Access-Control-Request-Method","POST")).andExpect(status().isForbidden());
    }
    @Test void savesTenAtomicallyAndDeduplicatesRetries() throws Exception {
        ProfileToken profile=tokens.create("테스트");
        PullRequest request=new PullRequest(UUID.randomUUID(),"character:1503",10,0);
        String auth="Bearer "+profile.token(),body=json.writeValueAsString(request);
        String first=mvc.perform(post("/api/warp/pull").header("Authorization",auth).contentType("application/json").content(body))
            .andExpect(status().isOk()).andExpect(jsonPath("$.results.length()").value(10)).andExpect(jsonPath("$.state.revision").value(1))
            .andReturn().getResponse().getContentAsString();
        String repeated=mvc.perform(post("/api/warp/pull").header("Authorization",auth).contentType("application/json").content(body))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(repeated)).isEqualTo(json.readTree(first));
        mvc.perform(get("/api/warp/progress").header("Authorization",auth))
            .andExpect(jsonPath("$.history.character.length()").value(10));
        PullRequest stale=new PullRequest(UUID.randomUUID(),"character:1503",1,0);
        mvc.perform(post("/api/warp/pull").header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(stale)))
            .andExpect(status().isConflict());
        PullRequest collision=new PullRequest(request.requestId(),"character:1503",1,0);
        mvc.perform(post("/api/warp/pull").header("Authorization",auth).contentType("application/json").content(json.writeValueAsString(collision)))
            .andExpect(status().isConflict());
    }
    @Test void rejectsUnsupportedCountAndSeparatesSameNamedProfiles() throws Exception {
        ProfileToken first=tokens.create("same"),second=tokens.create("same");
        assertThat(first.profileId()).isNotEqualTo(second.profileId());
        mvc.perform(post("/api/warp/pull").header("Authorization","Bearer "+first.token()).contentType("application/json")
            .content(json.writeValueAsString(new PullRequest(UUID.randomUUID(),"character:1503",2,0))))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/warp/progress").header("Authorization","Bearer "+second.token()))
            .andExpect(jsonPath("$.history.character.length()").value(0));
    }
    @Test void serializesCompetingRequestsWithoutLosingPity() throws Exception {
        Long id=tokens.authenticate(tokens.create("race").token()).orElseThrow();
        ExecutorService executor=Executors.newFixedThreadPool(2);
        CountDownLatch gate=new CountDownLatch(1);
        Callable<Boolean> task=()->{
            gate.await();
            try { warp.pull(id,new PullRequest(UUID.randomUUID(),"character:1503",10,0)); return true; }
            catch (org.springframework.web.server.ResponseStatusException e) { assertThat(e.getStatusCode().value()).isEqualTo(409); return false; }
        };
        try {
            Future<Boolean> a=executor.submit(task),b=executor.submit(task); gate.countDown();
            assertThat(List.of(a.get(15,TimeUnit.SECONDS),b.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
            Progress progress=warp.progress(id);
            assertThat(progress.history().get("character")).hasSize(10);
            assertThat(progress.bannerStates().get("character").revision()).isEqualTo(1);
        } finally { executor.shutdownNow(); }
    }
}
