package com.example.honkai.service;
import com.example.honkai.dto.AccountDtos.*;
import com.example.honkai.entity.*;
import com.example.honkai.repository.*;
import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ArrayNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;

@Service @RequiredArgsConstructor
public class DocumentService {
    private final ProfileRepository profiles;
    private final AccountService accounts;
    private final DocumentRepository documents;
    private final ImportRepository imports;
    private final ObjectMapper json;
    private final jakarta.persistence.EntityManager entityManager;
    private static final Set<String> SECTIONS=Set.of("relic","teams");
    private static final Set<String> STATS=Set.of("cr","cd","spd","atk","hp","def","break","ehr","res","flatAtk","flatHp","flatDef");
    private static final Set<String> PRESETS=Set.of("pdf","crit","hpCrit","defCrit","dot","break","support","critSupport","atkSupport","atkHeal","defSupport","hpSupport","debuff");
    @Transactional
    public Map<String,Document> all(Long id) { lock(id); return snapshot(id); }
    @Transactional
    public Document save(Long id,String section,SaveDocument request) {
        lock(id); validate(section,request.entries());
        AccountDocument document=load(id,section);
        if (document.getRevision()!=request.expectedRevision()) throw fail(HttpStatus.CONFLICT,"다른 기기에서 저장 내용이 변경되었습니다. 새로 불러온 뒤 다시 저장하세요.");
        document.setPayload(encode(request.entries())); document.setRevision(document.getRevision()+1); documents.save(document);
        return view(document);
    }
    @Transactional
    public ImportResult importData(Long id,ImportData request) {
        lock(id); validate("relic",request.relic()); validate("teams",request.teams());
        String digest=TokenService.hash(encode(canonical(json.valueToTree(request))));
        if (imports.existsByProfileIdAndPayloadHash(id,digest)) return new ImportResult(true,0,0,snapshot(id));
        int relics=merge(id,"relic",request.relic()),teams=merge(id,"teams",request.teams());
        AccountImport receipt=new AccountImport(); receipt.setProfileId(id); receipt.setPayloadHash(digest); receipt.setCreatedAt(Instant.now()); imports.save(receipt);
        return new ImportResult(false,relics,teams,snapshot(id));
    }
    private void lock(Long id) { profiles.lock(id).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"계정이 없습니다.")); accounts.requireAccount(id); }
    private AccountDocument load(Long id,String section) {
        if (!SECTIONS.contains(section)) throw fail(HttpStatus.BAD_REQUEST,"저장 영역이 잘못되었습니다.");
        return documents.findByProfileIdAndSection(id,section).orElseGet(()->{
            AccountDocument d=new AccountDocument(); d.setProfileId(id); d.setSection(section); d.setPayload("[]"); return d;
        });
    }
    private Map<String,Document> snapshot(Long id) { return Map.of("relic",view(load(id,"relic")),"teams",view(load(id,"teams"))); }
    private Document view(AccountDocument d) {
        try { return new Document(json.readTree(d.getPayload()),d.getRevision()); }
        catch (com.fasterxml.jackson.core.JsonProcessingException e) { throw new IllegalStateException("Invalid stored document"); }
    }
    private int merge(Long id,String section,JsonNode additions) {
        AccountDocument d=load(id,section); ArrayNode next=(ArrayNode)view(d).entries().deepCopy();
        Set<String> keys=new HashSet<>(); next.forEach(entry->keys.add(entryKey(section,entry)));
        int count=0;
        for (JsonNode entry:additions) if (keys.add(entryKey(section,entry))) { next.add(entry); count++; }
        if (count>0) { validate(section,next); d.setPayload(encode(next)); d.setRevision(d.getRevision()+1); documents.saveAndFlush(d); }
        return count;
    }
    private String entryKey(String section,JsonNode entry) {
        if (section.equals("relic")) return entry.get("id").asText();
        List<String> ids=new ArrayList<>(); entry.get("ids").forEach(i->ids.add(i.asText())); return String.join(":",ids);
    }
    private String encode(JsonNode value) {
        String text=value.toString();
        if (text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>262144) throw fail(HttpStatus.PAYLOAD_TOO_LARGE,"저장 데이터는 256KB 이하여야 합니다.");
        return text;
    }
    private JsonNode canonical(JsonNode value) {
        if (value.isObject()) { var result=json.createObjectNode(); List<String> names=new ArrayList<>(); value.fieldNames().forEachRemaining(names::add); Collections.sort(names); names.forEach(name->result.set(name,canonical(value.get(name)))); return result; }
        if (value.isArray()) { var result=json.createArrayNode(); value.forEach(v->result.add(canonical(v))); return result; }
        return value;
    }
    private void validate(String section,JsonNode entries) {
        if (!SECTIONS.contains(section) || entries==null || !entries.isArray() || entries.size()>200) throw bad();
        encode(entries); Set<String> keys=new HashSet<>();
        for (JsonNode entry:entries) {
            if (!entry.isObject()) throw bad();
            if (section.equals("relic")) validateRelic(entry); else validateTeam(entry);
            if (!keys.add(entryKey(section,entry))) throw fail(HttpStatus.BAD_REQUEST,"중복된 저장 항목이 있습니다.");
        }
    }
    private void validateRelic(JsonNode e) {
        fields(e,Set.of("id","name","characterId","mode","savedAt","buildGoalsEdited","targets","profile","rows","weights"));
        text(e,"id",1,100); text(e,"name",1,60); text(e,"characterId",1,30);
        if (!e.get("id").asText().matches("[a-zA-Z0-9_-]+") || !character(e.get("characterId").asText())) throw bad();
        if (!Set.of("build","item").contains(e.path("mode").asText()) || !PRESETS.contains(e.path("profile").asText())) throw bad();
        timestamp(e); if (!e.path("buildGoalsEdited").isBoolean()) throw bad();
        JsonNode targets=e.path("targets"),rows=e.path("rows"),weights=e.path("weights");
        if (!targets.isArray() || targets.size()>STATS.size() || !rows.isArray() || rows.size()!=4 || !weights.isObject()) throw bad();
        Set<String> used=new HashSet<>();
        for (JsonNode t:targets) {
            fields(t,Set.of("id","value","endValue","current","mode"));
            if (!STATS.contains(t.path("id").asText()) || !used.add(t.path("id").asText()) || !Set.of("min","max","lt").contains(t.path("mode").asText())) throw bad();
            for (String key:List.of("value","endValue","current")) numeric(t.path(key),1_000_000,true);
        }
        for (JsonNode row:rows) { fields(row,Set.of("id","value")); if (!STATS.contains(row.path("id").asText())) throw bad(); numeric(row.path("value"),1_000_000,true); }
        fields(weights,STATS); for (String stat:STATS) numeric(weights.path(stat),1,true);
    }
    private void validateTeam(JsonNode e) {
        fields(e,Set.of("ids","savedAt","ownedOnly","fourStarOnly","acheronE2","offensive"));
        JsonNode ids=e.path("ids"); if (!ids.isArray() || ids.size()!=4) throw bad();
        Set<String> used=new HashSet<>();
        for (JsonNode id:ids) {
            String value=id.asText(),entity=value.matches("80\\d\\d") ? "trailblazer" : Set.of("1001","1224").contains(value) ? "march7" : value;
            if (!id.isTextual() || value.equals("reference-aha") || !character(value) || !used.add(entity)) throw bad();
        }
        timestamp(e); for (String key:List.of("ownedOnly","fourStarOnly","acheronE2","offensive")) if (!e.path(key).isBoolean()) throw bad();
    }
    private boolean character(String id) {
        return id.equals("reference-aha") || !entityManager.createQuery("select i.itemKey from WarpItem i where i.itemKey=:key",String.class).setParameter("key","character:"+id).setMaxResults(1).getResultList().isEmpty();
    }
    private static void fields(JsonNode e,Set<String> allowed) {
        if (!e.isObject()) throw bad(); e.fieldNames().forEachRemaining(k->{ if (!allowed.contains(k)) throw bad(); });
    }
    private static void text(JsonNode e,String key,int min,int max) {
        JsonNode v=e.path(key); if (!v.isTextual() || v.asText().strip().length()<min || v.asText().length()>max || v.asText().chars().anyMatch(Character::isISOControl)) throw bad();
    }
    private static void timestamp(JsonNode e) { if (!e.path("savedAt").isIntegralNumber() || e.get("savedAt").asLong()<0 || e.get("savedAt").asLong()>Instant.now().toEpochMilli()+86_400_000) throw bad(); }
    private static void numeric(JsonNode node,double max,boolean emptyAllowed) {
        if (emptyAllowed && node.isTextual() && node.asText().isEmpty()) return;
        if (!node.isTextual() && !node.isNumber()) throw bad();
        try { double v=Double.parseDouble(node.asText()); if (!Double.isFinite(v) || v<0 || v>max) throw bad(); } catch (NumberFormatException error) { throw bad(); }
    }
    private static ResponseStatusException bad() { return fail(HttpStatus.BAD_REQUEST,"유물 또는 파티 저장 데이터 형식이 잘못되었습니다."); }
    private static ResponseStatusException fail(HttpStatus status,String message) { return new ResponseStatusException(status,message); }
}
