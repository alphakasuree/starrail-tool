(() => {
    'use strict';
    const finite = (value,min,max) => {const n=Number(value);if(!Number.isFinite(n)||n<min||n>max) throw new Error('입력 범위를 확인하세요.');return n;};
    function forecast(input) {
        const days=finite(input.days,0,365), monthlyDays=finite(input.monthlyDays,0,365);
        if(!Number.isInteger(days)||!Number.isInteger(monthlyDays)) throw new Error('일수는 정수로 입력하세요.');
        return Math.floor(days*(input.daily ? 60 : 0)+Math.min(days,monthlyDays)*(input.monthly ? 90 : 0)+finite(input.events,0,1000000)+finite(input.other,0,1000000));
    }
    function speed(input) {
        const spd=finite(input.speed,1,500),base=finite(input.base,1,300),buff=finite(input.buff,0,200),flat=finite(input.flat,0,200),advance=finite(input.advance,0,100)/100;
        const cycles=finite(input.cycles,0,20);if(!Number.isInteger(cycles)) throw new Error('사이클은 정수로 입력하세요.');
        const effective=spd+base*buff/100+flat, horizon=150+100*cycles;
        // One advance at battle start, then no further advance or downtime.
        const actions=Math.floor((horizon*effective/10000+advance)+1e-9);
        const target=(actions+1-advance)*10000/horizon;
        return {effective,horizon,actions,target,needed:Math.max(0,target-effective),firstAV:10000/effective*(1-advance),av:10000/effective};
    }
    globalThis.HonkaiPlannerMath=Object.freeze({forecast,speed});
})();
