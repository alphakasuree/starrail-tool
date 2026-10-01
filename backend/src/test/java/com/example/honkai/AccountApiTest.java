package com.example.honkai;
import com.example.honkai.config.SessionCookies;
import com.example.honkai.dto.ApiDtos.*;
import com.example.honkai.dto.AccountDtos;
import com.example.honkai.service.*;
import com.example.honkai.repository.*;
import com.fasterxml.jackson.databind.*;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.*;
import org.springframework.test.util.ReflectionTestUtils;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc(print=org.springframework.boot.test.autoconfigure.web.servlet.MockMvcPrint.NONE) @ActiveProfiles("test")
class AccountApiTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired ProfileRepository profiles;
    @Autowired AccountSessionRepository sessions;
    @Autowired TokenService legacy;
    @Autowired SessionRepository legacySessions;
    @Autowired WarpService warp;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;
    static final String PASSWORD="T!"+UUID.randomUUID();
    record Browser(String login,Cookie cookie,JsonNode account) {}
    String id() { return "test"+UUID.randomUUID().toString().replace("-","").substring(0,20); }
    MockHttpServletRequestBuilder write(MockHttpServletRequestBuilder request,Object body) throws Exception {
        return request.header("X-Honkai-Client","web").header("Origin","https://example.github.io").contentType("application/json").content(json.writeValueAsString(body));
    }
    Cookie cookie(MvcResult result) {
        String header=result.getResponse().getHeader("Set-Cookie");
        assertThat(header).contains("HttpOnly","Path=/api","SameSite=Lax");
        return new Cookie(SessionCookies.NAME,header.substring(header.indexOf('=')+1,header.indexOf(';')));
    }
    Browser register(String login,String display) throws Exception {
        MvcResult result=mvc.perform(write(post("/api/auth/register"),Map.of("loginId",login,"displayName",display,"password",PASSWORD))).andExpect(status().isCreated()).andReturn();
        return new Browser(login,cookie(result),json.readTree(result.getResponse().getContentAsString()));
    }
    Browser login(String login) throws Exception {
        MvcResult result=mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr("10.10.0.1");return r;}),Map.of("loginId",login,"password",PASSWORD))).andExpect(status().isOk()).andReturn();
        return new Browser(login,cookie(result),json.readTree(result.getResponse().getContentAsString()));
    }
    Map<String,Object> pull(UUID request,long revision) { return Map.of("requestId",request,"bannerKey","character:1503","count",10,"expectedRevision",revision); }
    Map<String,Object> team() { return Map.of("ids",List.of("1310","1301","1303","1306"),"savedAt",System.currentTimeMillis(),"ownedOnly",false,"fourStarOnly",false,"acheronE2",false,"offensive",false); }
    Map<String,Object> relic() {
        Map<String,Object> weights=new LinkedHashMap<>(); for (String key:List.of("cr","cd","spd","atk","hp","def","break","ehr","res","flatAtk","flatHp","flatDef")) weights.put(key,"0");
        return Map.of("id",UUID.randomUUID().toString(),"name","펄 세팅","characterId","1503","mode","build","savedAt",System.currentTimeMillis(),"buildGoalsEdited",false,"targets",List.of(Map.of("id","spd","value","100","endValue","110","current","100","mode","min")),"profile","pdf","rows",List.of(Map.of("id","cr","value","0"),Map.of("id","cd","value","0"),Map.of("id","spd","value","0"),Map.of("id","atk","value","0")),"weights",weights);
    }
    JsonNode documents(Browser b) throws Exception { return json.readTree(mvc.perform(get("/api/account/documents").cookie(b.cookie())).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()); }

    @Test void uniqueLoginSeparateDisplayAndBcrypt() throws Exception {
        String login=id(); Browser first=register(login,"같은 표시 이름"); Browser second=register(id(),"같은 표시 이름");
        assertThat(first.account().path("profileId")).isNotEqualTo(second.account().path("profileId"));
        var profile=profiles.findByLoginId(login).orElseThrow(); assertThat(profile.getPasswordHash()).startsWith("$2a$12$"); assertThat(passwords.matches(PASSWORD,profile.getPasswordHash())).isTrue();
        assertThat(first.account().has("passwordHash")).isFalse(); assertThat(first.account().has("token")).isFalse();
        mvc.perform(write(post("/api/auth/register"),Map.of("loginId",login.toUpperCase(Locale.ROOT),"displayName","다른 이름","password",PASSWORD))).andExpect(status().isConflict());
    }
    @Test void twoBrowsersShareWarpRelicsAndTeams() throws Exception {
        Browser a=register(id(),"연동"); Browser b=login(a.login());
        mvc.perform(write(post("/api/warp/pull").cookie(a.cookie()),pull(UUID.randomUUID(),0))).andExpect(status().isOk());
        mvc.perform(get("/api/warp/progress").cookie(b.cookie())).andExpect(jsonPath("$.history.character.length()").value(10)).andExpect(jsonPath("$.bannerStates.character.revision").value(1));
        mvc.perform(write(put("/api/account/documents/relic").cookie(a.cookie()),Map.of("entries",List.of(relic()),"expectedRevision",0))).andExpect(status().isOk());
        mvc.perform(write(put("/api/account/documents/teams").cookie(b.cookie()),Map.of("entries",List.of(team()),"expectedRevision",0))).andExpect(status().isOk());
        assertThat(documents(a)).isEqualTo(documents(b)); assertThat(documents(b).path("relic").path("entries").size()).isEqualTo(1);
        mvc.perform(write(put("/api/account/documents/relic").cookie(b.cookie()),Map.of("entries",List.of(),"expectedRevision",0))).andExpect(status().isConflict());
        assertThat(documents(a).path("relic").path("entries").size()).isEqualTo(1);
    }
    @Test void suppliedAccountIdsCannotReadOrChangeAnotherAccount() throws Exception {
        Browser a=register(id(),"격리"),b=register(id(),"격리");
        mvc.perform(write(post("/api/warp/pull").cookie(a.cookie()),pull(UUID.randomUUID(),0))).andExpect(status().isOk());
        mvc.perform(write(put("/api/account/documents/relic").cookie(a.cookie()),Map.of("entries",List.of(relic()),"expectedRevision",0))).andExpect(status().isOk());
        mvc.perform(get("/api/warp/progress").param("profileId",a.account().path("profileId").asText()).cookie(b.cookie())).andExpect(jsonPath("$.history.character.length()").value(0));
        mvc.perform(get("/api/account/documents").param("profileId",a.account().path("profileId").asText()).cookie(b.cookie())).andExpect(jsonPath("$.relic.entries.length()").value(0));
        mvc.perform(write(put("/api/account/documents/relic").cookie(b.cookie()),Map.of("profileId",a.account().path("profileId").asText(),"entries",List.of(),"expectedRevision",0))).andExpect(status().isOk());
        assertThat(documents(a).path("relic").path("entries").size()).isEqualTo(1);
        mvc.perform(get("/api/account/"+a.account().path("profileId").asText()+"/documents").cookie(b.cookie())).andExpect(status().isNotFound());
        mvc.perform(get("/api/account/documents").cookie(b.cookie()).header("X-Honkai-Account",a.account().path("profileId").asText())).andExpect(status().isUnauthorized());
    }
    @Test void wrongPasswordsAndPersistentFailureLimits() throws Exception {
        Browser a=register(id(),"제한"); String ip="10.11."+(Math.abs(a.login().hashCode())%200)+".1";
        for (int i=0;i<5;i++) mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr(ip);return r;}),Map.of("loginId",a.login(),"password","wrong-password"))).andExpect(status().isUnauthorized());
        mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr(ip);return r;}),Map.of("loginId",a.login(),"password",PASSWORD))).andExpect(status().isTooManyRequests());
        assertThat(jdbc.queryForObject("SELECT failures FROM login_throttle WHERE bucket_key=?",Integer.class,TokenService.hash("login:"+a.login()))).isEqualTo(5);
        jdbc.update("UPDATE login_throttle SET blocked_until=?,window_started_at=? WHERE bucket_key=?",java.time.LocalDateTime.ofInstant(Instant.now().minusSeconds(1),java.time.ZoneOffset.UTC),java.time.LocalDateTime.ofInstant(Instant.now().minusSeconds(1800),java.time.ZoneOffset.UTC),TokenService.hash("login:"+a.login()));
        mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr(ip);return r;}),Map.of("loginId",a.login(),"password",PASSWORD))).andExpect(status().isOk());
    }
    @Test void renewalRotatesTokenLogoutRevokesOnlyCurrentBrowser() throws Exception {
        Browser a=register(id(),"세션"),b=login(a.login());
        MvcResult renewed=mvc.perform(write(post("/api/auth/refresh").cookie(a.cookie()),Map.of())).andExpect(status().isOk()).andReturn(); Cookie fresh=cookie(renewed);
        assertThat(fresh.getValue()).isNotEqualTo(a.cookie().getValue());
        assertThat(json.readTree(renewed.getResponse().getContentAsString()).path("absoluteExpiresAt")).isEqualTo(a.account().path("absoluteExpiresAt"));
        mvc.perform(get("/api/auth/me").cookie(a.cookie())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").cookie(fresh)).andExpect(status().isOk());
        mvc.perform(post("/api/auth/logout").header("X-Honkai-Client","web").cookie(fresh)).andExpect(status().isNoContent()).andExpect(header().string("Set-Cookie",org.hamcrest.Matchers.containsString("Max-Age=0")));
        mvc.perform(get("/api/warp/progress").cookie(fresh)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").cookie(b.cookie())).andExpect(status().isOk());
    }
    @Test void expiredAndAbsoluteExpiredSessionsCannotRenew() throws Exception {
        Browser a=register(id(),"만료"); var s=sessions.findById(TokenService.hash(a.cookie().getValue())).orElseThrow(); s.setExpiresAt(Instant.now().minusSeconds(1)); sessions.saveAndFlush(s);
        mvc.perform(get("/api/auth/me").cookie(a.cookie())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").header("X-Honkai-Client","web").cookie(a.cookie())).andExpect(status().isUnauthorized());
        Browser b=login(a.login()); s=sessions.findById(TokenService.hash(b.cookie().getValue())).orElseThrow(); s.setAbsoluteExpiresAt(Instant.now().minusSeconds(1)); sessions.saveAndFlush(s);
        mvc.perform(get("/api/account/documents").cookie(b.cookie())).andExpect(status().isUnauthorized());
    }
    @Test void upgradeRequiresTokenKeepsHistoryAndDoesNotMergeNames() throws Exception {
        ProfileToken original=legacy.create("same"),other=legacy.create("same"); Long internalId=legacy.authenticate(original.token()).orElseThrow();
        warp.pull(internalId,new PullRequest(UUID.randomUUID(),"character:1503",10,0));
        Map<String,Object> request=Map.of("loginId",id(),"displayName","same","password",PASSWORD);
        mvc.perform(write(post("/api/auth/upgrade"),request)).andExpect(status().isUnauthorized());
        mvc.perform(write(post("/api/auth/upgrade").header("Authorization","Bearer bad"),request)).andExpect(status().isUnauthorized());
        MvcResult result=mvc.perform(write(post("/api/auth/upgrade").header("Authorization","Bearer "+original.token()),request)).andExpect(status().isCreated()).andReturn();
        assertThat(json.readTree(result.getResponse().getContentAsString()).path("profileId").asText()).isEqualTo(original.profileId());
        mvc.perform(get("/api/warp/progress").cookie(cookie(result))).andExpect(jsonPath("$.history.character.length()").value(10)).andExpect(jsonPath("$.bannerStates.character.revision").value(1));
        mvc.perform(get("/api/warp/progress").header("Authorization","Bearer "+original.token())).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/warp/progress").header("Authorization","Bearer "+other.token())).andExpect(jsonPath("$.history.character.length()").value(0));
        assertThat(legacy.authenticate(other.token())).isPresent();
        mvc.perform(write(post("/api/auth/upgrade").header("Authorization","Bearer "+original.token()),request)).andExpect(status().isUnauthorized());
    }
    @Test void importIsAtomicDeduplicatedAndAccountScoped() throws Exception {
        Browser a=register(id(),"가져오기"),b=register(id(),"가져오기"); Map<String,Object> data=Map.of("relic",List.of(relic()),"teams",List.of(team()));
        mvc.perform(write(post("/api/account/import").cookie(a.cookie()),data)).andExpect(status().isOk()).andExpect(jsonPath("$.addedRelics").value(1)).andExpect(jsonPath("$.addedTeams").value(1));
        mvc.perform(write(post("/api/account/import").cookie(a.cookie()),data)).andExpect(jsonPath("$.alreadyImported").value(true)).andExpect(jsonPath("$.addedRelics").value(0));
        assertThat(documents(b).path("relic").path("entries").size()).isZero();
        mvc.perform(write(post("/api/account/import").cookie(b.cookie()),data)).andExpect(jsonPath("$.addedRelics").value(1));
        Map<String,Object> changed=Map.of("relic",data.get("relic"),"teams",List.of());
        mvc.perform(write(post("/api/account/import").cookie(a.cookie()),changed)).andExpect(jsonPath("$.addedRelics").value(0));
        mvc.perform(write(post("/api/account/import").cookie(a.cookie()),Map.of("relic",List.of(relic()),"teams",List.of(Map.of("ids",List.of("bad")))))).andExpect(status().isBadRequest());
        assertThat(documents(a).path("relic").path("entries").size()).isEqualTo(1);
    }
    @Test void validatesInputsAndRequiresCsrfHeaderAndTrustedOrigin() throws Exception {
        mvc.perform(write(post("/api/auth/register"),Map.of("loginId","bad space","displayName","name","password",PASSWORD))).andExpect(status().isBadRequest());
        mvc.perform(write(post("/api/auth/register"),Map.of("loginId",id(),"displayName","name","password","short"))).andExpect(status().isBadRequest());
        mvc.perform(write(post("/api/auth/register"),Map.of("loginId",id(),"displayName","name","password","한".repeat(25)))).andExpect(status().isBadRequest());
        Browser a=register(id(),"CSRF");
        mvc.perform(post("/api/auth/logout").cookie(a.cookie())).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").header("X-Honkai-Client","web").header("Origin","https://evil.example").cookie(a.cookie())).andExpect(status().isForbidden());
        mvc.perform(post("/api/warp/pull").header("Authorization","Bearer arbitrary").cookie(a.cookie()).contentType("application/json").content(json.writeValueAsString(pull(UUID.randomUUID(),0)))).andExpect(status().isForbidden());
        mvc.perform(options("/api/auth/login").header("Origin","https://example.github.io").header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","content-type,x-honkai-client"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Credentials","true"));
    }
    @Test void productionCookiesAreHttpOnlySecureAndHostScoped() {
        SessionCookies settings=new SessionCookies(); ReflectionTestUtils.setField(settings,"secure",true); ReflectionTestUtils.setField(settings,"sameSite","None");
        MockHttpServletResponse response=new MockHttpServletResponse(); var view=new AccountDtos.Account("id","login","name",Instant.now().plusSeconds(3600),Instant.now().plusSeconds(7200));
        settings.write(new MockHttpServletRequest(),response,new AccountService.Issued(view,"opaque"));
        assertThat(response.getHeader("Set-Cookie")).contains("HttpOnly","Secure","SameSite=None","Path=/api").doesNotContain("Domain=");
    }
    @Test void ipLimitAppliesAcrossDifferentLoginIds() throws Exception {
        String ip="10.21."+(Math.abs(id().hashCode())%200)+".3";
        for (int i=0;i<20;i++) mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr(ip);return r;}),Map.of("loginId",id(),"password","incorrect"))).andExpect(status().isUnauthorized());
        mvc.perform(write(post("/api/auth/login").with(r->{r.setRemoteAddr(ip);return r;}),Map.of("loginId",id(),"password","incorrect"))).andExpect(status().isTooManyRequests());
    }
    @Test void expiredLegacyTokenCannotUpgradeAndCredentialsAreRedacted() throws Exception {
        ProfileToken old=legacy.create("expired"); var session=legacySessions.findById(TokenService.hash(old.token())).orElseThrow(); session.setExpiresAt(Instant.now().minusSeconds(1)); legacySessions.saveAndFlush(session);
        mvc.perform(write(post("/api/auth/upgrade").header("Authorization","Bearer "+old.token()),Map.of("loginId",id(),"displayName","이전","password",PASSWORD))).andExpect(status().isUnauthorized());
        assertThat(new AccountDtos.Login("account",PASSWORD).toString()).doesNotContain(PASSWORD,"account");
        assertThat(new AccountService.Issued(null,old.token()).toString()).doesNotContain(old.token());
        Browser a=register(id(),"쿠키"); assertThat(sessions.findById(a.cookie().getValue())).isEmpty(); assertThat(sessions.findById(TokenService.hash(a.cookie().getValue()))).isPresent();
        mvc.perform(get("/api/warp/progress").param("token","ignored-not-a-credential")).andExpect(status().isUnauthorized());
    }
    @Test void concurrentAccountDrawsAndDuplicateRequestsDoNotDoubleSpendPity() throws Exception {
        Browser a=register(id(),"동시"),b=login(a.login()); ExecutorService pool=Executors.newFixedThreadPool(2); CountDownLatch gate=new CountDownLatch(1);
        try {
            Callable<Integer> first=()->{gate.await();return mvc.perform(write(post("/api/warp/pull").cookie(a.cookie()),pull(UUID.randomUUID(),0))).andReturn().getResponse().getStatus();};
            Callable<Integer> second=()->{gate.await();return mvc.perform(write(post("/api/warp/pull").cookie(b.cookie()),pull(UUID.randomUUID(),0))).andReturn().getResponse().getStatus();};
            Future<Integer> x=pool.submit(first),y=pool.submit(second);gate.countDown();assertThat(List.of(x.get(20,TimeUnit.SECONDS),y.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
            UUID key=UUID.randomUUID(); CountDownLatch retryGate=new CountDownLatch(1);
            Callable<String> retry=()->{retryGate.await();return mvc.perform(write(post("/api/warp/pull").cookie(b.cookie()),pull(key,1))).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();};
            Future<String> r1=pool.submit(retry),r2=pool.submit(retry);retryGate.countDown();assertThat(json.readTree(r1.get(20,TimeUnit.SECONDS))).isEqualTo(json.readTree(r2.get(20,TimeUnit.SECONDS)));
            mvc.perform(get("/api/warp/progress").cookie(a.cookie())).andExpect(jsonPath("$.history.character.length()").value(20)).andExpect(jsonPath("$.bannerStates.character.revision").value(2));
        } finally { pool.shutdownNow(); }
    }
}
