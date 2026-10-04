import {chatInstructions, validateMessages} from './character-chat.mjs';

export const chatModel = 'gemini-3.1-flash-lite';
export function nextDailyReset(now = Date.now()) {
    const format = new Intl.DateTimeFormat('en-US', {timeZone:'America/Los_Angeles', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23'});
    const parts = time => Object.fromEntries(format.formatToParts(time).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
    const today = parts(now), target = Date.UTC(today.year, today.month - 1, today.day + 1);
    let guess = target + 8 * 3600000;
    for (let i = 0; i < 3; i++) {
        const p = parts(guess);
        guess += target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    }
    return guess;
}
const result = (status, body) => ({status, body});
export class FreeChat {
    constructor(env, storage = null, fetchImpl = fetch, clock = Date.now) {
        this.env = env; this.storage = storage; this.fetchImpl = fetchImpl; this.clock = clock;
        this.state = {}; this.busy = false;
    }
    async load() { if (this.storage) this.state = await this.storage.get('quota') || {}; }
    async save() { if (this.storage) await this.storage.put('quota', this.state); }
    configured() { return Boolean(this.env.GEMINI_API_KEY && this.env.GEMINI_FREE_TIER_CONFIRMED === '1'); }
    status() {
        if (!this.configured()) return result(200, {available:false, message:'대화 서비스를 준비 중이에요. 잠시 뒤 다시 찾아와 주세요.'});
        if (this.state.retryAt > this.clock()) return result(200, {available:false, retryAt:this.state.retryAt, reason:this.state.reason});
        return result(200, {available:true});
    }
    async answer(payload, signal) {
        const messages = validateMessages(payload);
        if (!messages || messages.length > 7 || messages.some(m => m.role === 'user' && m.content.length > 1000) || messages.reduce((n,m) => n + m.content.length, 0) > 6000) return result(400, {error:'이야기를 조금 짧게 적어 주세요.'});
        if (!this.configured()) return result(503, {error:'대화 서비스를 준비 중이에요.'});
        const now = this.clock();
        if (this.state.retryAt > now) return result(429, {...this.status().body, error:'무료 대화 한도가 잠시 소진됐어요.'});
        if (this.busy || this.state.nextRequestAt > now) return result(429, {error:'다른 이야기를 듣고 있어요. 잠시 후 다시 보내 주세요.', retryAt:now + 5000, reason:'busy'});
        this.busy = true;
        try {
            // A single shared request at a time, with a minimum interval. No retries or paid fallback.
            this.state = {nextRequestAt:now + 6000};
            await this.save();
            const timeout = AbortSignal.timeout(45000);
            const response = await this.fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`, {
                method:'POST', headers:{'Content-Type':'application/json', 'x-goog-api-key':this.env.GEMINI_API_KEY},
                signal:signal ? AbortSignal.any([signal, timeout]) : timeout,
                body:JSON.stringify({systemInstruction:{parts:[{text:chatInstructions}]}, contents:messages.map(m => ({role:m.role === 'assistant' ? 'model' : 'user', parts:[{text:m.content}]})), generationConfig:{maxOutputTokens:1024, temperature:0.7}})
            });
            const data = await response.json().catch(() => ({}));
            if (response.status === 429) {
                const details = Array.isArray(data.error?.details) ? data.error.details : [];
                const violations = details.flatMap(d => Array.isArray(d.violations) ? d.violations : []);
                const ids = violations.map(v => `${v.quotaId || ''} ${v.quotaMetric || ''}`).join(' ');
                const daily = /day|daily/i.test(ids) || !/minute|second/i.test(ids);
                const retry = details.find(d => typeof d.retryDelay === 'string')?.retryDelay;
                const seconds = /^\d+(\.\d+)?s$/.test(retry || '') ? Number.parseFloat(retry) : 60;
                this.state.retryAt = daily ? nextDailyReset(now) : now + Math.max(60, Math.min(seconds, 3600)) * 1000;
                this.state.reason = daily ? 'daily' : 'rate';
                await this.save();
                return result(429, {...this.status().body, error:'무료 대화 한도가 소진됐어요. 초기화 후 다시 열려요.'});
            }
            if (!response.ok) return result(503, {error:'대화 서비스에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.'});
            const candidate = data.candidates?.[0];
            const reply = candidate?.content?.parts?.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
            if (!reply) return result(502, {error:'답변을 만들지 못했어요. 표현을 바꿔 다시 보내 주세요.'});
            return result(200, {reply:reply.slice(0,4000), truncated:candidate.finishReason === 'MAX_TOKENS' || reply.length > 4000});
        } catch {
            return result(503, {error:'연결이 오래 걸리거나 끊겼어요. 잠시 뒤 다시 보내 주세요.'});
        } finally { this.busy = false; }
    }
}
