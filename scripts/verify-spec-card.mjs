import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const elements = new Map(), events = new Map(), images = [], painted = [], downloads = [], drawnImages = [], imageStates = [], fills = [], alphaStack = [], imageRects = [], textRects = [];
const ctx = {createLinearGradient:()=>({addColorStop(){}}),fillRect(){},strokeRect(){},
    save(){alphaStack.push(this.globalAlpha ?? 1);},restore(){this.globalAlpha=alphaStack.pop();},beginPath(){},roundRect(){},clip(){},arc(){},fill(){fills.push(this.fillStyle);},stroke(){},moveTo(){},lineTo(){},closePath(){},
    measureText:text=>({width:String(text).length*12}),
    drawImage(img,x,y,width,height){drawnImages.push(img.source);imageStates.push({source:img.source,alpha:this.globalAlpha ?? 1});imageRects.push({source:img.source,x,y,width,height,ratio:img.width/img.height});},fillText(text,x,y){painted.push(text);textRects.push({text,x,y});}};
const element = () => ({children:[],dataset:{},hidden:false,disabled:false,checked:true,open:false,textContent:'',innerHTML:'',listeners:{},
    addEventListener(type, fn){this.listeners[type]=fn;},setAttribute(key,value){this[key]=value;},
    replaceChildren(){this.children=[];},append(child){this.children.push(child);},prepend(child){this.children.unshift(child);},
    showModal(){this.open=true;},close(){this.open=false;this.listeners.close?.();},remove(){},focus(){this.focused=true;},
    click(){if(this.download) downloads.push(this.download);else return this.listeners.click?.();},
    getContext:()=>ctx,toBlob(fn){fn({type:'image/png'});}
});
const get = id => {if(!elements.has(id)) elements.set(id,element());return elements.get(id);};
let sampleColor = [180,50,70], failPalette = false;
const sampleCtx = {drawImage(){},getImageData(){
    if (failPalette) throw new Error('Unreadable artwork');
    return {data:Array.from({length:1024}, () => [...sampleColor,255]).flat()};
}};
const c = {id:'1308',name:'아케론',level:80,rank:2,lightCone:{id:'23024',name:'장착 광추',rank:3,level:80},
    stats:[{name:'공격력',field:'atk',value:3200,percent:false,display:'3,200'},{name:'치명타 확률',field:'crit_rate',value:.8,percent:true,display:'80.0%'}],
    relics:[{id:'51011',rarity:5,name:'<유물>',level:15,main:{name:'HP',field:'hp',value:705,percent:false,display:'705'},sub:[]}]};
let currentUid='100000999', saved=null, failLookup=false, failConeImage=false;
const p = {uid:currentUid,nickname:'<개척자>',signature:'',level:70,worldLevel:6,fetchedAt:Date.now(),achievementCount:null,characters:[c,{...c,id:'1001',name:'Mar. 7th'}]};
const context = vm.createContext({setTimeout,clearTimeout,console,
    document:{getElementById:get,createElement:tag=>tag==='canvas' ? {...element(),getContext:()=>sampleCtx} : element(),body:element(),addEventListener(){}},
    HonkaiProfileStorage:{get id(){return currentUid;},getItem:()=>saved},
    HonkaiAccount:{importUid(next){saved=JSON.stringify({uidProfile:next});events.get('honkai-account-changed')();}},
    WarpArtwork:{setSource(img,item){img.src=item.portrait;}},
    Image:class {constructor(){this.width=1200;this.height=1800;images.push(this);}set src(value){
        this.source=value;
        if(value.startsWith('assets/lightcones/') || value.startsWith('assets/lightcone-art/') || value.startsWith('assets/spec-icons/')) {
            images.splice(images.indexOf(this),1);
            queueMicrotask(()=>failConeImage && !value.startsWith('assets/spec-icons/') ? this.onerror?.() : this.onload?.());
        }
    }},
    URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},
    addEventListener(type,fn){events.set(type,fn);}
});
vm.runInContext(await fs.readFile(new URL('../assets/js/characters.js',import.meta.url),'utf8'),context);
vm.runInContext(await fs.readFile(new URL('../assets/js/spec-assets.js',import.meta.url),'utf8'),context);
vm.runInContext(await fs.readFile(new URL('../assets/js/uid-api.js',import.meta.url),'utf8'),context);
context.HonkaiUid={...context.HonkaiUid,async lookup(){if(failLookup)throw new Error('조회 실패');return p;}};
vm.runInContext(await fs.readFile(new URL('../assets/js/spec-card.js',import.meta.url),'utf8'),context);
get('spec-card-open').click();
assert.equal(get('spec-card-dialog').open,true);
assert.equal(get('spec-card-list').children.length,0);
assert.match(get('spec-card-status').textContent,/UID/);
saved=JSON.stringify({uidProfile:p}); get('spec-card-open').click();
assert.equal(get('spec-card-list').children.length,2);
assert.match(get('spec-card-list').children[0].innerHTML,/아케론/);
assert.equal(get('spec-card-preview').hidden,true);
const galleryDialog = get('spec-card-dialog');
const galleryCard = get('spec-card-list').children[0];
galleryDialog.listeners.pointerdown({target:galleryCard});
galleryDialog.listeners.click({target:galleryCard});
assert.equal(galleryDialog.open,true,'Card clicks must keep the gallery open');
galleryDialog.listeners.pointerdown({target:galleryCard});
galleryDialog.listeners.click({target:galleryDialog});
assert.equal(galleryDialog.open,true,'Dragging from a card into empty space must not dismiss');
for (const target of [galleryDialog,get('spec-card-list')]) {
    galleryDialog.listeners.pointerdown({target});
    galleryDialog.listeners.click({target});
    assert.equal(galleryDialog.open,false,'Backdrop and gaps between cards must dismiss');
    get('spec-card-open').click();
}
const first = get('spec-card-list').children[0].click();
const second = get('spec-card-list').children[1].click();
assert.equal(get('spec-card-list').hidden,true,'Selection must replace the gallery immediately');
assert.equal(get('spec-card-navigation').hidden,false,'Back navigation must be available while loading');
images[0].onload(); await first;
assert.equal(get('spec-card-preview').hidden,true,'Stale selection must not render');
images[1].onload(); await second;
assert.equal(get('spec-card-preview').hidden,false);
assert.equal(get('spec-card-download').disabled,false);
assert.equal(get('spec-card-canvas').width / get('spec-card-canvas').height, 1.6, 'Exported PNG must use a landscape 16:10 ratio');
assert(painted.some(text=>text.includes('3,200')));
assert(painted.some(text=>text.includes('UID 100000999')));
assert(drawnImages.includes('assets/character-art/1001.png'),'Character artwork must be painted');
assert(drawnImages.includes('assets/lightcone-art/23024.png'),'Full light-cone artwork must be painted');
const coneRect = imageRects.find(rect=>rect.source==='assets/lightcone-art/23024.png');
assert(Math.abs(coneRect.width/coneRect.height-coneRect.ratio)<1e-9,'Light-cone artwork must retain its original proportions');
const coneImageWidth = Math.round(Math.min(Math.round((get('spec-card-canvas').width-700)*.36)*.46,360*.7));
assert(coneRect.x>=684 && coneRect.y>=204 && coneRect.x+coneRect.width<=684+coneImageWidth && coneRect.y+coneRect.height<=564,'Complete light-cone artwork must fit inside the enlarged portrait area without cropping');
assert(coneRect.height>=300,'Light-cone artwork must be enlarged');
const attackRect = textRects.find(rect=>rect.text==='3,200');
assert(attackRect.x>coneRect.x+coneRect.width && attackRect.y>=coneRect.y && attackRect.y<coneRect.y+coneRect.height,'Stats must sit alongside the light cone on its right');
const relicRect = imageRects.find(rect=>rect.source==='assets/spec-icons/relics/101_0.png');
assert(relicRect.height>=120 && relicRect.y>coneRect.y+coneRect.height,'Enlarged relic artwork must sit below the light cone and stats');
assert(drawnImages.includes('assets/spec-icons/eidolons/1001_rank6.png'),'All six character-specific eidolons must be painted');
assert(drawnImages.includes('assets/spec-icons/elements/Ice.png'),'Element icon must be painted');
assert(drawnImages.includes('assets/spec-icons/paths/Preservation.png'),'Path icon must be painted');
assert(drawnImages.includes('assets/spec-icons/relics/101_0.png'),'Equipped relic icon must be painted');
assert.deepEqual(imageStates.filter(item=>item.source.startsWith('assets/spec-icons/eidolons/1001_')).map(item=>item.alpha),[1,1,.28,.28,.28,.28], 'Only owned eidolons must be highlighted');
assert.equal(fills.filter(color=>color==='#edc873').length,3,'S3 must light exactly three superimposition markers');
const redPanel = fills.find(color=>color==='#30202a');
assert(redPanel,'Card panels must use the warm hue sampled from the character artwork');
assert(!painted.some(text => /CHARACTER ARCHIVE|BUILD CARD|TRAILBLAZER|COMBAT STATS|EQUIPPED RELICS/.test(text)), 'Decorative labels must be removed');
assert.match(get('spec-card-text').innerHTML,/&lt;유물&gt;/);
get('spec-card-download').click();assert.equal(downloads.length,1);assert.match(downloads[0],/스펙명함\.png$/);
sampleColor=[50,90,180]; fills.length=0;
painted.length=0;get('spec-card-show-uid').checked=false;
get('spec-card-show-uid').listeners.change();images.at(-1).onload();await new Promise(resolve=>setImmediate(resolve));
assert(!painted.some(text=>text.includes('100000999')),'UID toggle must remove UID from exported canvas');
assert(fills.includes('#1b263c'),'Card panels must change to the cool hue of different artwork');
failPalette=true;
failConeImage=true;
const fallback = get('spec-card-list').children[0].click();
images.at(-1).onerror();await new Promise(resolve=>setImmediate(resolve));images.at(-1).onload();await fallback;
assert.equal(get('spec-card-preview').hidden,false);
assert.equal(get('spec-card-download').disabled,false,'Missing light-cone image must not block PNG export');
failPalette=false;
failConeImage=false;
get('spec-card-back').click();
assert.equal(get('spec-card-list').hidden,false);
assert.equal(get('spec-card-preview').hidden,true);
assert.equal(get('spec-card-list').children[0].focused,true,'Back must restore focus to the selected character');
const cancelled = get('spec-card-list').children[0].click();
let prevented = false;
galleryDialog.listeners.cancel({preventDefault(){prevented=true;}});
images.at(-1).onload(); await cancelled;
assert.equal(prevented,true,'Escape from a card must return to the gallery');
assert.equal(galleryDialog.open,true);
assert.equal(get('spec-card-list').hidden,false);
assert.equal(get('spec-card-preview').hidden,true,'Back during loading must cancel the pending card');
const pending = get('spec-card-list').children[0].click();
currentUid='other-profile';saved=null;events.get('honkai-profile-login')();images.at(-1).onload();await pending;
assert.equal(get('spec-card-preview').hidden,true);
assert.equal(get('spec-card-list').children.length,0);
get('spec-card-download').click();assert.equal(downloads.length,1);
currentUid=p.uid;saved=JSON.stringify({uidProfile:p});events.get('honkai-profile-login')();
failLookup=true;await get('spec-card-refresh').click();
assert.match(get('spec-card-status').textContent,/이전 조회/);assert.equal(get('spec-card-list').children.length,2);
failLookup=false;await get('spec-card-refresh').click();assert.equal(get('spec-card-refresh').disabled,false);
const closing=get('spec-card-list').children[0].click();get('spec-card-dialog').close();images.at(-1).onload();await closing;
assert.equal(get('spec-card-download').disabled,true);
saved=JSON.stringify({uidProfile:{...p,characters:[{...c,id:'1503',name:'펄',rank:0}]}});
get('spec-card-open').click();
assert.equal(get('spec-card-list').children.length,1);
assert.equal(get('spec-card-list').children[0].dataset.characterId,'1503');
assert.match(get('spec-card-list').children[0].innerHTML,/펄/);
assert.match(get('spec-card-list').children[0].innerHTML,/성혼 0/);
console.log('PASS: UID character gallery, spec rendering, PNG export, UID hiding, HTML escaping, artwork fallback, selection races, profile isolation, refresh recovery and close cancellation.');
