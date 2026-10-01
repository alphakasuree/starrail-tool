package com.example.honkai.service;
import com.example.honkai.entity.*;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.util.*;
import java.util.function.DoubleSupplier;
@Component
public class DrawEngine {
    private final DoubleSupplier random;
    public DrawEngine() { SecureRandom source=new SecureRandom(); this.random=source::nextDouble; }
    public DrawEngine(DoubleSupplier random) { this.random=random; }
    public BannerPool draw(PityState s, WarpBanner b, List<BannerPool> pool) {
        boolean cone=b.getPityGroup().startsWith("lightcone");
        int max=cone ? 80 : 90, soft=cone ? 63 : 73;
        double five=cone ? .008 : .006;
        if (s.getPity5()>=soft) five+=(cone ? .07 : .06)*(s.getPity5()-soft+1);
        if (s.getPity5()>=max-1) five=1;
        five=Math.min(1,Math.max(0,five));
        double four=Math.min(1-five,s.getPity4()>=9 ? 1 : cone ? .066 : .051);
        double roll=random.getAsDouble();
        BannerPool result;
        if (roll<five) {
            boolean featured=s.isGuaranteed5() || random.getAsDouble()<(cone ? .75 : .5);
            result=pick(pool,5,featured);
            s.setPity5(0); s.setPity4(0); s.setGuaranteed5(!featured);
        } else if (roll<five+four || s.getPity4()>=9) {
            boolean featured=b.isFeaturedFour() && (s.isGuaranteed4() || random.getAsDouble()<(cone ? .75 : .5));
            result=pick(pool,4,featured);
            s.setPity5(s.getPity5()+1); s.setPity4(0); s.setGuaranteed4(b.isFeaturedFour() && !featured);
        } else {
            result=pick(pool,3,false);
            s.setPity5(s.getPity5()+1); s.setPity4(s.getPity4()+1);
        }
        return result;
    }
    private BannerPool pick(List<BannerPool> pool,int rarity,boolean featured) {
        List<BannerPool> candidates=pool.stream().filter(p->p.getItem().getRarity()==rarity && p.isFeatured()==featured).toList();
        if (candidates.isEmpty()) throw new IllegalStateException("배너 아이템 풀이 비어 있습니다.");
        return candidates.get((int)(random.getAsDouble()*candidates.size()));
    }
}
