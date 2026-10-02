(() => {
'use strict';
const actions = {
    'ui-0': (event, element) => { goToWarpScreen('character'); },
    'ui-1': (event, element) => { goToWarpScreen('lightcone'); },
    'ui-2': (event, element) => { openWarpPrep(); },
    'ui-3': (event, element) => { openCollection(); },
    'ui-4': (event, element) => { openRelicCalculator(); },
    'ui-5': (event, element) => { openTeamBuilder(); },
    'ui-6': (event, element) => { goToLobby(); },
    'ui-7': (event, element) => { selectBanner('character'); },
    'ui-8': (event, element) => { selectBanner('lightcone'); },
    'ui-9': (event, element) => { openBannerPicker(); },
    'ui-10': (event, element) => { if(event.target===element)closeBannerPicker(); },
    'ui-11': (event, element) => { closeBannerPicker(); },
    'ui-12': (event, element) => { openWarpDetails(); },
    'ui-13': (event, element) => { doWarp(1); },
    'ui-14': (event, element) => { doWarp(10); },
    'ui-15': (event, element) => { nextReveal(); },
    'ui-16': (event, element) => { resetToWarp(); },
    'ui-17': (event, element) => { switchTab('character'); },
    'ui-18': (event, element) => { switchTab('lightcone'); },
    'ui-19': (event, element) => { renderCollection(); },
    'ui-20': (event, element) => { closeCollection(); },
    'ui-21': (event, element) => { if (event.target === element) closeWarpDetails(); },
    'ui-22': (event, element) => { closeWarpDetails(); },
    'ui-23': (event, element) => { selectWarpDetailsTab('rates'); },
    'ui-24': (event, element) => { selectWarpDetailsTab('history'); },
    'ui-25': (event, element) => { if (event.target === element) closeArtViewer(); },
    'ui-26': (event, element) => { closeArtViewer(); },
    'ui-27': (event, element) => { handleSkip(); },
    'ui-28': (event, element) => { closeRelicCalculator(); },
    'banner-search': (event, element) => renderBannerChoices(element.value),
    'history-page': (event, element) => changeHistoryPage(Number(element.dataset.step)),
    'choose-pickup': (event, element) => choosePickup(element.dataset.id),
    'collection-item': (event, element) => openCollectionItem(element.dataset.type, element.dataset.id)
};
for (const type of ['click', 'change', 'input']) document.addEventListener(type, event => {
    const element = event.target.closest('[data-' + type + '-action], [data-action]');
    if (!element || element.disabled || element.closest('[inert]')) return;
    const action = element.dataset[type + 'Action'] || (type === 'click' ? element.dataset.action : null);
    if (Object.hasOwn(actions, action)) actions[action](event, element);
});
document.getElementById('single-reveal-screen').addEventListener('keydown', event => {
    if (event.target === event.currentTarget && ['Enter', ' '].includes(event.key)) {event.preventDefault(); nextReveal();}
});
for (const group of document.querySelectorAll('[role="tablist"]')) group.addEventListener('keydown', event => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(event.target);
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[target].focus(); tabs[target].click();
});
document.getElementById('tab-character').setAttribute('aria-selected', 'true');
document.getElementById('tab-lightcone').setAttribute('aria-selected', 'false');
})();
