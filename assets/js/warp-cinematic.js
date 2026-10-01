(() => {
    'use strict';
    let frame=0, timer=0, active=false, ctx=null, canvas=null, scene=null;
    let width=0,height=0,stars=[],started=0,currentStage='',done=null,signalOpen=null,speed=.12;
    const colors={3:'#72bfff',4:'#bf8bff',5:'#ffda87'};
    const get=id=>document.getElementById(id);
    function stop({keepAudio=false}={}) {
        if(!keepAudio)globalThis.WarpAudio?.stop();
        active=false;cancelAnimationFrame(frame);clearTimeout(timer);frame=0;timer=0;done=null;
        if(signalOpen){signalOpen.hidden=true;signalOpen.onclick=null;}
        if(scene){scene.classList.remove('running');scene.dataset.stage='arrival';scene.style.removeProperty('--signal');scene.parentElement.style.opacity='1';scene.parentElement.style.pointerEvents='auto';}
        if(ctx) ctx.clearRect(0,0,width,height);
        globalThis.removeEventListener('resize',resize);
    }
    function resize() {
        if(!canvas) return;
        width=canvas.clientWidth || globalThis.innerWidth;height=canvas.clientHeight || globalThis.innerHeight;
        const ratio=Math.min(globalThis.devicePixelRatio || 1,1.75);
        canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
        ctx?.setTransform(ratio,0,0,ratio,0,0);
    }
    function stage(name,rarity,count) {
        if(currentStage===name) return;currentStage=name;scene.dataset.stage=name;
        const captions={arrival:['한 장의 표식, 새로운 항로','개척의 신호를 전송합니다'],gather:['별빛이 모이고 있습니다',`${count}개의 운명이 항로에 합류합니다`],flight:['차원의 경계 너머로','멀리서 응답이 도착합니다'],signal:[rarity===5 ? '전설의 신호를 포착했습니다' : rarity===4 ? '희귀 신호가 공명합니다' : '항로가 연결되었습니다','별빛 속에서 새로운 인연이 깨어납니다'],singularity:['시간이 멈추는 순간','황금빛 운명이 모습을 드러냅니다'],burst:['운명이 도착합니다','']};
        captions.awaiting=['봉인된 신호가 도착했습니다','화면을 클릭하면 운명이 깨어납니다'];
        const [title,subtitle]=captions[name];get('warp-cinema-title').textContent=title;get('warp-cinema-subtitle').textContent=subtitle;
        if(['signal','singularity','burst'].includes(name))scene.style.setProperty('--signal',colors[rarity]);
        if(name==='burst')globalThis.WarpAudio?.drop();
    }
    function draw(elapsed,delta,rarity,count,signalProgress=0) {
        if(!ctx) return;
        const cx=width/2,cy=height/2;
        ctx.clearRect(0,0,width,height);
        const targetSpeed=currentStage==='awaiting' ? .2 : currentStage==='singularity' ? .16 : currentStage==='arrival' ? .12 : currentStage==='gather' ? .35 : 1.8;
        speed+=(targetSpeed-speed)*(1-Math.exp(-delta/280));
        const base=[228,236,247],target={3:[114,191,255],4:[191,139,255],5:[255,218,135]}[rarity];
        const blend=Math.max(0,Math.min(1,signalProgress));
        const eased=blend*blend*(3-2*blend);
        const signal=`rgb(${base.map((v,i)=>Math.round(v+(target[i]-v)*eased)).join(',')})`;
        ctx.strokeStyle=signal;
        for(const star of stars){
            const oldZ=star.z;star.z-=delta*speed*.00032;
            if(star.z<.05){star.z=1;star.angle=Math.random()*Math.PI*2;star.distance=.03+Math.random()*.6;continue;}
            const x=cx+Math.cos(star.angle)*star.distance*width/star.z;
            const y=cy+Math.sin(star.angle)*star.distance*height/star.z;
            const oldX=cx+Math.cos(star.angle)*star.distance*width/oldZ;
            const oldY=cy+Math.sin(star.angle)*star.distance*height/oldZ;
            ctx.globalAlpha=Math.min(.8,(1-star.z)*.85+.12);ctx.lineWidth=star.size;
            ctx.beginPath();ctx.moveTo(oldX,oldY);ctx.lineTo(x+star.size,y);ctx.stroke();
        }
        // Each pull becomes a light on the constellation before the portal opens.
        if(elapsed>1100 && currentStage!=='burst') {
            const radius=Math.min(width,height)*.21;
            ctx.globalAlpha=.4;ctx.lineWidth=1;ctx.beginPath();
            for(let i=0;i<count;i++){
                const angle=i/count*Math.PI*2-Math.PI/2+elapsed*.00007;
                const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius;
                if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
            }
            if(count>2)ctx.closePath();ctx.stroke();
            for(let i=0;i<count;i++){
                const angle=i/count*Math.PI*2-Math.PI/2+elapsed*.00007;
                ctx.fillStyle=signal;ctx.globalAlpha=.8;ctx.beginPath();ctx.arc(cx+Math.cos(angle)*radius,cy+Math.sin(angle)*radius,3,0,Math.PI*2);ctx.fill();
            }
        }
        ctx.globalAlpha=1;
    }
    function start({rarity=3,count=1,featured,onComplete}) {
        stop();scene=get('warp-cinema');canvas=get('warp-space');signalOpen=get('warp-signal-open');
        rarity=[3,4,5].includes(rarity) ? rarity : 3;count=count===10 ? 10 : 1;
        ctx=canvas.getContext('2d');resize();currentStage='';speed=.12;active=true;done=onComplete;
        globalThis.WarpAudio?.prepare(featured);
        scene.dataset.rarity=String(rarity);scene.dataset.stage='arrival';
        void scene.offsetWidth;scene.classList.add('running');stage('arrival',rarity,count);
        globalThis.addEventListener('resize',resize);
        const finish=()=>{
            if(!active)return;
            active=false;cancelAnimationFrame(frame);frame=0;
            const callback=done;done=null;callback?.();
            // Reveal underneath the still-visible portal, then fade the portal away.
            const screen=scene.parentElement;screen.style.opacity='0';screen.style.pointerEvents='none';
            timer=setTimeout(()=>{stop({keepAudio:true});screen.style.display='none';},450);
        };
        const awaitClick=resume=>{
            stage('awaiting',rarity,count);signalOpen.hidden=false;
            signalOpen.onclick=()=>{
                if(!active || currentStage!=='awaiting')return;
                globalThis.WarpAudio?.click('signal');
                signalOpen.hidden=true;signalOpen.onclick=null;resume();
            };
        };
        // Keep the cinematic and timing identical across OS animation settings.
        stars=Array.from({length:width<600 ? 90 : 170},()=>({angle:Math.random()*Math.PI*2,distance:.03+Math.random()*.6,z:.12+Math.random()*.88,size:.5+Math.random()}));
        started=performance.now();let previous=started;
        const burstAt=rarity===5 ? 4300 : rarity===4 ? 3400 : 3250;
        let opened=false,waiting=false,waitingAt=0,visualElapsed=0;
        const tick=now=>{
            if(!active)return;
            const elapsed=waiting ? 2300 : now-started,delta=Math.min(40,Math.max(0,now-previous));previous=now;visualElapsed+=delta;
            if(!opened && !waiting && elapsed>=2300){
                waiting=true;waitingAt=now;
                awaitClick(()=>{
                    opened=true;waiting=false;started+=performance.now()-waitingAt;
                    stage('signal',rarity,count);
                });
            }
            if(!waiting){
                const phase=elapsed>=burstAt ? 'burst' : rarity===5 && elapsed>=3350 ? 'singularity' : elapsed>=2300 ? 'signal' : elapsed>=1500 ? 'flight' : elapsed>=850 ? 'gather' : 'arrival';
                stage(phase,rarity,count);
            }
            draw(visualElapsed,delta,rarity,count,opened ? (elapsed-2300)/1000 : 0);
            if(opened && elapsed>=burstAt+850){finish();return;}frame=requestAnimationFrame(tick);
        };
        frame=requestAnimationFrame(tick);
    }
    globalThis.WarpCinematic=Object.freeze({start,stop});
})();
