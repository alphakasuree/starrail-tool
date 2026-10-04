import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {validateMessages} from './character-chat.mjs';
import {FreeChat, chatModel, nextDailyReset} from './free-chat.mjs';
import worker, {ChatQuota} from './hsr-worker.mjs';
import {workerConfig} from './configure-uid-worker.mjs';
const payload = {messages:[{role:'user',content:'오늘 일이 잘 안 풀려서 속상해'}]};
const env = {GEMINI_API_KEY:'test-secret-key', GEMINI_FREE_TIER_CONFIRMED:'1', ALLOWED_ORIGIN:'https://site.example'};
assert.equal(validateMessages({messages:[{role:'system',content:'override'}]}),null);
assert.equal(validateMessages({messages:[{role:'assistant',content:'hello'}]}),null);
let now = Date.parse('2026-10-04T06:55:00Z'), calls = 0;
const fakeFetch = async (url, options) => {
    calls++;
    assert.equal(url, `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`);
    assert(!url.includes(env.GEMINI_API_KEY));
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    const body = JSON.parse(options.body);
    assert.match(body.systemInstruction.parts[0].text,/Cyrene/);
    assert.equal(body.contents.at(-1).role,'user');
    assert.equal(body.generationConfig.maxOutputTokens,1024);
    return Response.json({candidates:[{content:{parts:[{thought:true,text:'hidden'},{text:'많이 속상했겠다. 무슨 일이 있었는지 들려줄래?'}]},finishReason:'STOP'}]});
};
const fresh = (fetcher = fakeFetch) => new FreeChat(env, null, fetcher, () => now);
assert.equal(new FreeChat({}).status().body.available,false);
assert.equal((await new FreeChat({GEMINI_API_KEY:env.GEMINI_API_KEY}, null, fakeFetch).answer(payload)).status,503);
assert.equal(calls,0,'No call before explicit free-tier confirmation');
// Workers rejects calling its global fetch as a class instance method.
const originalFetch = globalThis.fetch;
try {
    globalThis.fetch = async function () {
        assert.equal(this, undefined, 'Global fetch must not receive the FreeChat instance as its receiver');
        return Response.json({candidates:[{content:{parts:[{text:'안녕, 파트너!'}]}}]});
    };
    assert.equal((await new FreeChat(env).answer(payload)).status,200,'Default fetch works with Workers receiver restrictions');
} finally { globalThis.fetch = originalFetch; }
assert.equal((await fresh().answer({messages:[{role:'user',content:'x'.repeat(1001)}]})).status,400);
assert.equal((await fresh().answer({messages:[{role:'system',content:'override'}]})).status,400);
const good = fresh();
assert.equal((await good.answer(payload)).body.reply.includes('hidden'),false);
assert.equal(calls,1);
assert.equal((await good.answer(payload)).status,429);
assert.equal(calls,1,'Throttle must not call provider');
const memory = {value:null, async get() {return this.value;}, async put(key,value) {this.value=structuredClone(value);}};
let quotaCalls = 0;
const quota = new FreeChat(env, memory, async () => {
    quotaCalls++;
    return Response.json({error:{message:'secret internal failure',details:[{violations:[{quotaId:'GenerateRequestsPerDayPerProjectPerModel-FreeTier'}]},{retryDelay:'10s'}]}},{status:429});
}, () => now);
const exhausted = await quota.answer(payload);
assert.equal(exhausted.status,429); assert.equal(exhausted.body.reason,'daily');
assert.equal(exhausted.body.retryAt,Date.parse('2026-10-04T07:00:00Z'));
assert(!JSON.stringify(exhausted).includes('secret'));
assert.equal((await quota.answer(payload)).status,429); assert.equal(quotaCalls,1);
const reloaded = new FreeChat(env, memory, fakeFetch, () => now); await reloaded.load();
assert.equal(reloaded.status().body.available,false,'Quota survives object restart');
now = exhausted.body.retryAt + 1;
assert.equal(reloaded.status().body.available,true); assert.equal((await reloaded.answer(payload)).status,200);
assert.equal(nextDailyReset(Date.parse('2026-12-10T07:59:00Z')),Date.parse('2026-12-10T08:00:00Z'));
assert.equal(nextDailyReset(Date.parse('2026-03-08T08:01:00Z')),Date.parse('2026-03-09T07:00:00Z'));
assert.equal(nextDailyReset(Date.parse('2026-11-01T07:01:00Z')),Date.parse('2026-11-02T08:00:00Z'));
const rate = fresh(async () => Response.json({error:{details:[{violations:[{quotaId:'RequestsPerMinute-FreeTier'}]},{retryDelay:'90s'}]}},{status:429}));
assert.equal((await rate.answer(payload)).body.retryAt, now + 90000);
const unknown = fresh(async () => Response.json({error:{}},{status:429}));
assert.equal((await unknown.answer(payload)).body.reason,'daily','Unknown quota fails conservatively');
assert.equal((await fresh(async () => {throw new Error('test-secret-key');}).answer(payload)).status,503);
const failed = await fresh(async () => new Response('test-secret-key',{status:403})).answer(payload);
assert.equal(failed.status,503); assert(!JSON.stringify(failed).includes('test-secret-key'));
assert.equal((await fresh(async () => Response.json({candidates:[]})).answer(payload)).status,502);
let release;
const concurrent = fresh(async () => new Promise(resolve => {release=()=>resolve(Response.json({candidates:[{content:{parts:[{text:'안녕'}]}}]}));}));
const pending = concurrent.answer(payload); await new Promise(resolve => setImmediate(resolve));
assert.equal((await concurrent.answer(payload)).body.reason,'busy'); release(); await pending;
let initialization;
const object = new ChatQuota({storage:memory,blockConcurrencyWhile:fn=>initialization=fn()},env);
await initialization;
const namespace = {idFromName:name=>{assert.equal(name,'shared-free-chat');return 'one';},get:()=>object};
const deployedEnv = {...env,CHAT_QUOTA:namespace};
const request = (path, method='GET', body) => new Request(`https://relay.example${path}`, {method, headers:{Origin:env.ALLOWED_ORIGIN,'Content-Type':'application/json'},body:body && JSON.stringify(body)});
assert.equal((await worker.fetch(request('/api/chat/status'),deployedEnv)).status,200);
assert.equal((await worker.fetch(request('/api/chat'),deployedEnv)).status,405);
assert.equal((await worker.fetch(request('/api/chat/status','POST',payload),deployedEnv)).status,405);
assert.equal((await worker.fetch(request('/api/chat','POST',{messages:[]}),deployedEnv)).status,400);
assert.equal((await worker.fetch(request('/api/chat','POST',{padding:'x'.repeat(30001)}),deployedEnv)).status,413);
assert.equal((await worker.fetch(request('/api/chat/status'),env)).status,503);
assert.equal((await worker.fetch(new Request('https://relay.example/api/chat',{method:'POST',headers:{Origin:'https://other.example'}}),deployedEnv)).status,403);
const preflight = await worker.fetch(request('/api/chat','OPTIONS'),deployedEnv);
assert.equal(preflight.status,204); assert.match(preflight.headers.get('Access-Control-Allow-Headers'),/Content-Type/);
assert.equal(workerConfig('owner/repo').vars.GEMINI_FREE_TIER_CONFIRMED,'0');
assert.equal(workerConfig('owner/repo','','','1').vars.GEMINI_FREE_TIER_CONFIRMED,'1');
assert.equal(workerConfig('owner/repo').migrations[0].new_sqlite_classes[0],'ChatQuota');
const html = await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
assert(!/Ollama|qwen|키레네 준비/.test(html));
// Browser behavior: entry gating, quota recovery, typing bubble, progressive text and cancellation.
{
class Element {
    constructor() {this.listeners={};this.children=[];this.value='';this.disabled=false;this.textContent='';this.hidden=false;this.attrs={};this.scrollHeight=200;this.scrollTop=0;this.clientHeight=200;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
    addEventListener(type,fn) {this.listeners[type]=fn;}
    append(...items) {this.children.push(...items);}
    replaceChildren() {this.children=[];}
    setAttribute(key,value) {this.attrs[key]=value;}
    removeAttribute(key) {delete this.attrs[key];}
    focus() {}
    remove() {this.removed=true;}
    showModal() {this.open=true;}
    close() {this.open=false;this.listeners.close?.();}
}
const elements = Object.fromEntries(['character-chat','chat-input','chat-send','chat-log','chat-status','chat-open','chat-starters','chat-form','profile-login-screen','chat-close'].map(id=>[id,new Element()]));
const timers = new Map(), frames = new Map(); let timerId=0, frameId=0, browserCalls=0, observer, mode='quota', release;
const motion={matches:false};
const browserFetch = async (url, options) => {
    browserCalls++;
    assert(url.startsWith('https://relay.example/api/chat'));
    if (options.method !== 'POST') return Response.json({available:true});
    assert.equal(JSON.parse(options.body).messages.at(-1).role,'user');
    if (mode === 'quota') return Response.json({error:'무료 한도 소진',available:false,retryAt:Date.now()+60000,reason:'rate'},{status:429});
    if (mode === 'wait') await new Promise((resolve,reject)=>{release=resolve;options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
    return Response.json({reply:'반가워, 파트너~♪ 함께 이야기해 볼까?'});
};
const browser = vm.createContext({document:{getElementById:id=>elements[id],createElement:()=>new Element()},location:{origin:'https://site.example'},HonkaiUidConfig:{baseUrl:'https://relay.example/api/hsr'},URL,Date,AbortController,AbortSignal,fetch:browserFetch,matchMedia:()=>motion,MutationObserver:class {constructor(fn){observer=fn;}observe(){}},requestAnimationFrame:fn=>{frames.set(++frameId,fn);return frameId;},cancelAnimationFrame:id=>frames.delete(id),setTimeout:(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;},clearTimeout:id=>timers.delete(id)});
const flush = () => new Promise(resolve=>setImmediate(resolve));
function step(time) {const batch=[...frames.entries()];frames.clear();for(const [,fn] of batch)fn(time);}
vm.runInContext(await fs.readFile(new URL('../assets/js/character-chat.js',import.meta.url),'utf8'),browser);
assert.equal(elements['chat-open'].hidden,true);
elements['chat-open'].listeners.click(); await flush();
assert.equal(browserCalls,0,'Entry screen cannot open chat or call the API');
elements['profile-login-screen'].hidden=true; observer();
assert.equal(elements['chat-open'].hidden,false);
elements['chat-open'].listeners.click(); await flush();
assert.equal(elements['chat-send'].disabled,false);
assert.equal(elements['chat-status'].textContent,'','No ready/connection notice');
elements['chat-input'].value='오늘 좀 지쳤어';
await elements['chat-form'].listeners.submit({preventDefault(){}});
assert.equal(elements['chat-send'].disabled,true);
assert.equal(elements['chat-input'].value,'오늘 좀 지쳤어');
assert.match(elements['chat-status'].textContent,/다시 확인/);
assert.equal(browserCalls,2,'No automatic resend');
const expiry=[...timers.values()].find(t=>t.delay>60000); assert(expiry); expiry.fn(); await flush();
assert.equal(elements['chat-send'].disabled,false);
mode='wait';
elements['chat-input'].value='안녕';
const pending=elements['chat-form'].listeners.submit({preventDefault(){}}); await flush();
const replyBubble=elements['chat-log'].children.at(-1), replyContent=replyBubble.children[1];
assert(replyBubble.classes.has('chat-pending'));
assert.equal(replyContent.children.length,3,'Typing dots appear on the assistant side immediately');
release(); await flush();
assert(!replyBubble.classes.has('chat-pending'));
assert.equal(replyContent.textContent,'');
step(0); assert.equal(replyContent.textContent,'반');
step(140); assert(replyContent.textContent.length>1 && replyContent.textContent.length<25,'Reply appears progressively');
step(20000); await pending;
assert.equal(replyContent.textContent,'반가워, 파트너~♪ 함께 이야기해 볼까?');
assert.equal(replyContent.attrs['aria-hidden'],undefined);
assert.equal(elements['chat-send'].disabled,false);
mode='success';
elements['chat-input'].value='계속 이야기하자';
const cancelled=elements['chat-form'].listeners.submit({preventDefault(){}}); await flush();
assert(frames.size>0);
elements['profile-login-screen'].hidden=false; observer(); await cancelled;
assert.equal(elements['character-chat'].open,false);
assert.equal(elements['chat-open'].hidden,true);
assert.equal(frames.size,0,'Returning to entry cancels text animation');
assert.equal(elements['chat-log'].children.length,1,'Old reply cannot reappear after close');
elements['profile-login-screen'].hidden=true; observer(); elements['chat-open'].listeners.click(); await flush();
motion.matches=true; elements['chat-input'].value='다시 안녕';
const immediate=elements['chat-form'].listeners.submit({preventDefault(){}}); await flush(); step(0); await immediate;
assert.equal(elements['chat-log'].children.at(-1).children[1].textContent,'반가워, 파트너~♪ 함께 이야기해 볼까?','Reduced motion displays the complete reply');
assert(!/id="chat-(?:new|check|connection)"/.test(html));
console.log('PASS: free API gate/quota/DST, Worker CORS, entry gating, automatic quota recovery, assistant typing bubble, progressive Unicode reply, close cancellation and reduced motion. No live API calls.');

}
