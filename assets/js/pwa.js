(() => {
    'use strict';
    const button=document.getElementById('pwa-install');let prompt=null;
    globalThis.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=false;});
    button.addEventListener('click',async()=>{if(!prompt)return;await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')button.hidden=true;prompt=null;});
    globalThis.addEventListener('appinstalled',()=>{button.hidden=true;prompt=null;});
    if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)) {
        navigator.serviceWorker.register('./sw.js').then(registration=>{
            const status=document.getElementById('profile-account-status');
            registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed') status.textContent=navigator.serviceWorker.controller ? '새 버전이 준비되었습니다. 모든 앱 창을 닫고 다시 열면 적용됩니다.' : '오프라인 준비 완료 · 유물 계산기와 파티 빌더를 사용할 수 있습니다.';});});
        }).catch(()=>{document.getElementById('profile-account-status').textContent='오프라인 준비를 완료하지 못했습니다. 온라인 상태에서 다시 열어주세요.';});
    }
})();
