const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, imports, globals={}) {
  const module = { exports:{} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText, { module, exports:module.exports, require:n=>{assert.ok(n in imports,n);return imports[n]}, ...globals });
  return module.exports;
}
test('admin backend authenticates as the configured Firebase owner and paginates every record', async()=>{
  const requests=[]; let missing = false;
  const api=load('lib/ride-backend.ts', {
    react:{cache:f=>f},
    './admin-auth':{requireAdmin:async()=>({uid:'owner'}),adminAuth:()=>({createCustomToken:async uid=>{assert.equal(uid,'demo-owner');return 'custom-token'}})},
  }, {process:{env:{RIDE_BACKEND_URL:'http://localhost:18000',BACKEND_OWNER_UID:'demo-owner',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:19099'}},URL,AbortSignal,fetch:async(url,options)=>{
    requests.push({url,options});
    if(url.includes('signInWithCustomToken')) { assert.equal(JSON.parse(options.body).token,'custom-token');return {ok:true,json:async()=>({idToken:'real-id-token'})}; }
    if (missing) return {ok:false,status:404,json:async()=>({error:'profile_not_found'})};
    assert.equal(options.cache,'no-store');assert.equal(options.headers.Authorization,'Bearer real-id-token');
    const last=url.includes('after=next');
    return {ok:true,json:async()=>({items:[{id:last?'second':'first'}],nextCursor:last?null:'next'})};
  }});
  assert.deepEqual(Array.from(await api.backendList('/v1/admin/profiles?role=rider'),x=>x.id),['first','second']);
  assert.ok(requests.some(r=>r.url.includes('role=rider&limit=200&after=next')));
  missing = true;
  await assert.rejects(api.backendRequest('/v1/admin/riders/missing/status', 'POST', {status:'active'}), /profile not found/);
});
test('backend mode maps receipt amounts for existing admin pages and routes mutations through the API',async()=>{
  const calls=[];
  const api=load('lib/db.ts',{
    './firebase-admin':{getAdminDb:()=>{throw Error('Legacy database must not be accessed')}},
    './ride-backend':{backendEnabled:()=>true,backendList:async()=>[{id:'ride',pickup:{latitude:8.5,longitude:8.5,address:'A'},dropoff:{latitude:8.6,longitude:8.6,address:'B'},customer:{name:'Customer'},rider:{name:'Rider'},createdAt:1000,status:'ended',vehicleType:'Motorcycle',fareMinor:139200,receipt:{fareMinor:139200,voucherMinor:50000,cashMinor:89200}}],backendRequest:async(...args)=>{calls.push(args);return {status:'active'}}},
  });
  const [ride]=await api.getRideRequests();
  assert.equal(ride.fareAmount,'1392');assert.equal(ride.cashAmountDue,'892');assert.equal(ride.userName,'Customer');
  await api.updateRiderStatus('uid','active');
  assert.equal(calls[0][0],'/v1/admin/riders/uid/status');assert.equal(calls[0][1],'POST');
});
