package com.example.honkai;
import com.example.honkai.entity.*;
import com.example.honkai.service.DrawEngine;
import org.junit.jupiter.api.Test;
import java.util.*;
import java.util.function.DoubleSupplier;
import static org.assertj.core.api.Assertions.*;
class DrawEngineTest {
    private BannerPool item(int rarity,boolean featured) {
        WarpItem item=new WarpItem(); item.setRarity(rarity);
        BannerPool pool=new BannerPool(); pool.setItem(item); pool.setFeatured(featured); return pool;
    }
    private final List<BannerPool> pool=List.of(item(3,false),item(4,false),item(4,true),item(5,false),item(5,true));
    private WarpBanner banner(String group,boolean featuredFour) { WarpBanner b=new WarpBanner(); b.setPityGroup(group); b.setFeaturedFour(featuredFour); return b; }
    private DrawEngine random(double... values) { Iterator<Double> sequence=Arrays.stream(values).boxed().iterator(); return new DrawEngine(sequence::next); }
    @Test void hardPityAndFiveStarGuaranteeOverrideRandomRoll() {
        PityState state=new PityState(); state.setPity5(89); state.setPity4(9); state.setGuaranteed5(true); state.setGuaranteed4(true);
        BannerPool result=random(.99,.2).draw(state,banner("character",true),pool);
        assertThat(result.getItem().getRarity()).isEqualTo(5); assertThat(result.isFeatured()).isTrue();
        assertThat(state.getPity5()).isZero(); assertThat(state.getPity4()).isZero();
        assertThat(state.isGuaranteed5()).isFalse(); assertThat(state.isGuaranteed4()).isTrue();
    }
    @Test void fourthStarGuaranteeAndCollaborationRulesArePreserved() {
        PityState normal=new PityState(); normal.setPity4(9); normal.setGuaranteed4(true);
        assertThat(random(.9,.1).draw(normal,banner("character",true),pool).isFeatured()).isTrue();
        assertThat(normal.isGuaranteed4()).isFalse(); assertThat(normal.getPity5()).isEqualTo(1);
        PityState collaboration=new PityState(); collaboration.setPity4(9); collaboration.setGuaranteed4(true);
        assertThat(random(.9,.1).draw(collaboration,banner("characterCollaboration",false),pool).isFeatured()).isFalse();
        assertThat(collaboration.isGuaranteed4()).isFalse();
    }
    @Test void offBannerFiveStarActivatesNextGuarantee() {
        PityState state=new PityState();
        assertThat(random(0,.99,.1).draw(state,banner("lightcone",true),pool).isFeatured()).isFalse();
        assertThat(state.isGuaranteed5()).isTrue();
        assertThat(random(0,.1).draw(state,banner("lightcone",true),pool).isFeatured()).isTrue();
        assertThat(state.isGuaranteed5()).isFalse();
    }
}
