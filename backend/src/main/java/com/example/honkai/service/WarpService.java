package com.example.honkai.service;
import com.example.honkai.dto.ApiDtos.*;
import com.example.honkai.entity.*;
import com.example.honkai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.time.Instant;
import java.util.*;
@Service @RequiredArgsConstructor
public class WarpService {
    private final ProfileRepository profiles;
    private final BannerRepository banners;
    private final PoolRepository pools;
    private final StateRepository states;
    private final BatchRepository batches;
    private final HistoryRepository histories;
    private final DrawEngine engine;
    private static final List<String> GROUPS=List.of("character","lightcone","characterCollaboration","lightconeCollaboration");
    @Transactional
    public PullResponse pull(Long profileId,PullRequest request) {
        if (request.count()!=1 && request.count()!=10) throw fail(HttpStatus.BAD_REQUEST,"1회 또는 10회만 가능합니다.");
        Profile profile=lock(profileId);
        String requestId=request.requestId().toString();
        String hash=TokenService.hash(request.bannerKey()+"|"+request.count()+"|"+request.expectedRevision());
        Optional<PullBatch> previous=batches.findByProfileIdAndRequestId(profileId,requestId);
        if (previous.isPresent()) {
            if (!previous.get().getRequestHash().equals(hash)) throw fail(HttpStatus.CONFLICT,"requestId가 다른 요청에 사용되었습니다.");
            return response(previous.get());
        }
        WarpBanner banner=banners.findById(request.bannerKey()).filter(WarpBanner::isEnabled).orElseThrow(()->fail(HttpStatus.BAD_REQUEST,"배너가 없습니다."));
        PityState state=states.findByProfileIdAndPityGroup(profileId,banner.getPityGroup()).orElseGet(()->{
            PityState created=new PityState(); created.setProfileId(profileId); created.setPityGroup(banner.getPityGroup()); return states.save(created);
        });
        if (state.getRevision()!=request.expectedRevision()) throw fail(HttpStatus.CONFLICT,"천장 상태가 변경되었습니다. 다시 동기화하세요.");
        List<BannerPool> pool=pools.findPool(banner.getBannerKey());
        List<BannerPool> results=new ArrayList<>();
        for (int i=0;i<request.count();i++) results.add(engine.draw(state,banner,pool));
        state.setRevision(state.getRevision()+1);
        if (banner.getPityGroup().startsWith("character")) profile.setSelectedCharacter(banner.getFeaturedItem().getCatalogId());
        else profile.setSelectedLightcone(banner.getFeaturedItem().getCatalogId());
        PullBatch batch=new PullBatch(); batch.setProfileId(profileId); batch.setRequestId(requestId); batch.setRequestHash(hash);
        batch.setBanner(banner); batch.setPullCount(request.count()); batch.setCreatedAt(Instant.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        batch.setEndPity4(state.getPity4()); batch.setEndPity5(state.getPity5());
        batch.setEndGuaranteed4(state.isGuaranteed4()); batch.setEndGuaranteed5(state.isGuaranteed5()); batch.setEndRevision(state.getRevision());
        batches.save(batch);
        List<WarpHistory> records=new ArrayList<>();
        for (int i=0;i<results.size();i++) {
            WarpHistory history=new WarpHistory(); history.setBatch(batch); history.setItem(results.get(i).getItem());
            history.setPullIndex(i+1); history.setFeatured(results.get(i).isFeatured()); history.setPulledAt(batch.getCreatedAt()); records.add(history);
        }
        histories.saveAll(records); histories.flush();
        return response(batch);
    }
    @Transactional
    public Progress progress(Long profileId) {
        Profile profile=lock(profileId);
        Map<String,State> stateMap=new LinkedHashMap<>(); Map<String,List<Result>> historyMap=new LinkedHashMap<>(); Map<String,Integer> inventory=new LinkedHashMap<>();
        for (String group:GROUPS) { stateMap.put(group,new State(0,0,false,false,0)); historyMap.put(group,new ArrayList<>()); }
        for (PityState state:states.findByProfileId(profileId)) stateMap.put(state.getPityGroup(),State.from(state));
        for (WarpHistory history:histories.findProgress(profileId)) {
            historyMap.get(history.getBatch().getBanner().getPityGroup()).add(Result.from(history));
            WarpItem item=history.getItem(); String key=item.getItemType().equals("character") ? "character:"+item.getCatalogId() : item.getName(); inventory.put(key,1);
        }
        return new Progress(1,stateMap,Map.of("character",profile.getSelectedCharacter(),"lightcone",profile.getSelectedLightcone()),historyMap,inventory);
    }
    @Transactional
    public void selection(Long profileId,Selection selection) {
        Profile profile=lock(profileId);
        checkSelection("character",selection.character()); checkSelection("lightcone",selection.lightcone());
        profile.setSelectedCharacter(selection.character()); profile.setSelectedLightcone(selection.lightcone());
    }
    private void checkSelection(String type,String id) {
        if (banners.findById(type+":"+id).filter(WarpBanner::isEnabled).isEmpty()) throw fail(HttpStatus.BAD_REQUEST,"선택할 수 없는 배너입니다.");
    }
    private Profile lock(Long id) { return profiles.lock(id).orElseThrow(()->fail(HttpStatus.UNAUTHORIZED,"프로필이 없습니다.")); }
    private PullResponse response(PullBatch batch) {
        return new PullResponse(UUID.fromString(batch.getRequestId()),batch.getBanner().getPityGroup(),histories.findBatch(batch.getId()).stream().map(Result::from).toList(),
            new State(batch.getEndPity4(),batch.getEndPity5(),batch.isEndGuaranteed4(),batch.isEndGuaranteed5(),batch.getEndRevision()));
    }
    private ResponseStatusException fail(HttpStatus status,String message) { return new ResponseStatusException(status,message); }
}
