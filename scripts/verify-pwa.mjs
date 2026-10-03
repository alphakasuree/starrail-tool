import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

const workerCode=await fs.readFile(new URL('../sw.js',import.meta.url),'utf8');
const pageCode=await fs.readFile(new URL('../assets/js/pwa.js',import.meta.url),'utf8');
for(const hostname of ['localhost','127.0.0.1','[::1]','example.com']) {
    const local=hostname!=='example.com';
    const scope=`https://${hostname}/tools/`;
    const prefix='honkai-tools-_tools_-';
    const handlers=new Map(), deleted=[];
    let skipped=0, claimed=0, unregistered=0, opened=0, responded=0;
    const caches={
        async keys(){return [prefix+'old','unrelated-cache'];},
        async delete(name){deleted.push(name);},
        async open(){opened++;return {async addAll(){},async match(){return {cached:true};}};}
    };
    const registration={scope,async unregister(){unregistered++;},addEventListener(){}};
    vm.runInNewContext(workerCode,{
        URL,Request,caches,
        self:{location:{hostname},registration,clients:{async claim(){claimed++;}},
            async skipWaiting(){skipped++;},addEventListener(type,fn){handlers.set(type,fn);}}
    });
    let pending;
    handlers.get('install')({waitUntil(task){pending=task;}});await pending;
    assert.equal(skipped,local?1:0);
    assert.equal(opened,local?0:1,'Local install must not precache edited files');
    handlers.get('activate')({waitUntil(task){pending=task;}});await pending;
    assert.deepEqual(deleted,[prefix+'old']);
    assert.equal(claimed,1);
    assert.equal(unregistered,local?1:0);
    handlers.get('fetch')({request:{method:'GET',url:scope,mode:'navigate'},respondWith(task){responded++;pending=task;}});
    if(!local) await pending;
    assert.equal(responded,local?0:1,'Local requests must bypass the worker cache');

    deleted.length=0;unregistered=0;
    let reloaded=0,registered=0,finished;
    const completion=new Promise(resolve=>{finished=resolve;});
    const button={addEventListener(){}};
    vm.runInNewContext(pageCode,{
        URL,caches,console,addEventListener(){},
        location:{hostname,href:scope,protocol:'https:',reload(){reloaded++;finished();}},
        document:{getElementById(){return button;}},
        navigator:{serviceWorker:{controller:{},async getRegistrations(){return [registration,{scope:'https://example.com/other/',async unregister(){assert.fail('Unrelated registration');}}];},
            async register(){registered++;finished();return registration;}}}
    });
    await completion;
    assert.equal(registered,local?0:1);
    assert.equal(unregistered,local?1:0);
    assert.equal(reloaded,local?1:0);
    assert.deepEqual(deleted,local?[prefix+'old']:[]);
}
console.log('PASS: Local PWA cleanup, worker migration and cache bypass; production PWA preserved.');
