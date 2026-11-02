const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), crypto = require('node:crypto');
function load(file, imports = {}, globals = {}) {
 const module = {exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText, {module,exports:module.exports,require:n=>{assert.ok(n in imports,n);return imports[n]},structuredClone,...globals});
 return module.exports;
}
const schema = load('lib/platform-settings.ts');
const fresh = () => structuredClone(schema.DEFAULT_SETTINGS);
test('settings validate all trust-boundary fields and calculate precise changes', () => {
 assert.equal(schema.validateSettings(fresh()).pricing.Tricycle.minimumFare,500);
 for (const mutate of [s=>s.pricing.Tricycle.perKm=-1,s=>s.pricing.Motorcycle.minimumFare=NaN,s=>s.matching.requestTimeoutSeconds=1,s=>s.matching.maxRetries=0.5,s=>s.matching.maxRetries=5,s=>s.service.hoursEnabled='true',s=>s.service.daysOfWeek=[],s=>s.service.daysOfWeek=[1,1],s=>s.service.opensAt='24:00',s=>{s.service.hoursEnabled=true;s.service.opensAt=s.service.closesAt},s=>s.service.zones=[{name:'',latitude:0,longitude:0,radiusKm:5}],s=>s.service.zones=[{name:'Test',latitude:91,longitude:0,radiusKm:5}],s=>s.verification.allowedVehicleTypes=['Car'],s=>s.verification.allowedVehicleTypes=[],s=>s.rewards.maxVoucherPercent=101,s=>s.operations.bookingsEnabled=1,s=>s.operations.supportEmail='bad',s=>s.operations.supportPhone='javascript:evil',s=>s.operations.maintenanceMessage='',s=>s.extra=true,s=>s.pricing.Tricycle.extra=1]) {
  const value=fresh();mutate(value);assert.throws(()=>schema.validateSettings(value));
 }
 const after=fresh();after.pricing.Tricycle.minimumFare=600;after.operations.bookingsEnabled=false;
 const changes=schema.changedSettings(fresh(),after);
 assert.equal(Object.keys(changes).join(','),'pricing.Tricycle.minimumFare,operations.bookingsEnabled');
 assert.equal(changes['pricing.Tricycle.minimumFare'].before,500);
 assert.equal(changes['pricing.Tricycle.minimumFare'].after,600);
 const rider={status:'active',vehicle_details:{vehicle_type:'Tricycle'}};
 assert.equal(schema.riderVerificationError(rider,fresh()),null);
 const strict=fresh();strict.verification.requireIdPhoto=true;
 assert.match(schema.riderVerificationError(rider,strict),/ID photo/);
 strict.verification.requireVehicleDetails=true;
 assert.match(schema.riderVerificationError(rider,strict),/vehicle model/);
});
test('signed owner and staff sessions expire correctly; malformed and future cookies fail', async () => {
 const {verifySession,SESSION_SECONDS}=load('lib/admin-session.ts',{}, {crypto:crypto.webcrypto, TextEncoder,TextDecoder,atob});
 const now=Date.now(), secret='settings-test-secret';
 const sign=p=>p+'.'+crypto.createHmac('sha256',secret).update(p).digest('base64url');
 for (const p of [String(now),String(Math.floor(now/1000))]) assert.equal((await verifySession(sign(p),secret,now)).uid,'owner');
 const payload=Buffer.from(JSON.stringify({uid:'staff-id',label:'Viewer',issuedAt:now})).toString('base64url');
 assert.equal((await verifySession(sign(payload),secret,now)).uid,'staff-id');
 for (const p of [String(now-SESSION_SECONDS*1000-1),String(now+60000),'NaN','123garbage',Buffer.from('{}').toString('base64url')]) assert.equal(await verifySession(sign(p),secret,now),null);
 assert.equal(await verifySession(sign(payload)+'x',secret,now),null);
 assert.equal(await verifySession('broken.cookie.extra',secret,now),null);
});
test('settings saves are atomic, audited, reject stale revisions and handle a cold transaction cache', async () => {
 let state=null;
 const db={ref:()=>({push:()=>({key:'event-'+(state?.current.revision||0)}),transaction:async update=>{
  let next=update(null);
  if (next===undefined) return {committed:false,snapshot:snapshot(state)};
  if(state!==null) next=update(state);
  if(next===undefined)return {committed:false,snapshot:snapshot(state)};
  state=JSON.parse(JSON.stringify(next));return {committed:true,snapshot:snapshot(state)};
 }})};
 function snapshot(value){return {val:()=>value,child:path=>snapshot(path.split('/').reduce((v,k)=>v?.[k],value))}}
 const {saveSettings,readVersion}=load('lib/settings-store.ts',{'./firebase-admin':{getAdminDb:()=>db},'./platform-settings':schema});
 const a=fresh();a.pricing.Tricycle.minimumFare=650;
 assert.equal((await saveSettings(a,0,'Owner','Adjust minimum fare')).revision,1);
 assert.equal(state.history['event-0'].changes.find(c=>c.path==='pricing.Tricycle.minimumFare').after,'650');
 await assert.rejects(saveSettings(fresh(),0,'Other','Conflicting edit'),/another admin/);
 const b=structuredClone(a);b.operations.bookingsEnabled=false;
 assert.equal((await saveSettings(b,1,'Owner','Pause for maintenance')).revision,2);
 await assert.rejects(saveSettings(b,2,'Owner','No changes'),/No settings changed/);
 const withoutZones=structuredClone(state.current);delete withoutZones.values.service.zones;
 assert.equal(readVersion(withoutZones).values.service.zones.length,0);
});
test('settings mutations refuse open root rules and protect admin-only history', async () => {
 let rules=JSON.parse(fs.readFileSync('config/database.rules.json','utf8'));
 const {requireProtectedSettingsRules}=load('lib/settings-rules.ts',{'../config/database.rules.json':JSON.parse(fs.readFileSync('config/database.rules.json','utf8')),'./firebase-admin':{getAdminDb:()=>({getRulesJSON:async()=>rules})}});
 await requireProtectedSettingsRules();
 rules.rules['.write']=true;await assert.rejects(requireProtectedSettingsRules(),/locked/);
 rules=JSON.parse(fs.readFileSync('config/database.rules.json','utf8'));rules.rules['$any']={'.write':true};await assert.rejects(requireProtectedSettingsRules(),/locked/);
 rules=JSON.parse(fs.readFileSync('config/database.rules.json','utf8'));rules.rules.platformControl.current['.write']=true;await assert.rejects(requireProtectedSettingsRules(),/locked/);
});
test('mobile default fixture matches the admin defaults', () => {
 assert.deepEqual(JSON.parse(fs.readFileSync('config/default-platform-settings.json','utf8')).values,JSON.parse(JSON.stringify(schema.DEFAULT_SETTINGS)));
});
test('staff roles and version rotation are enforced on the server, including existing sessions', async () => {
 let session={uid:'owner',label:'Owner',issuedAt:Date.now()}, user={uid:'staff',email:'viewer@local.test',disabled:false,customClaims:{adminRole:'viewer',adminSessionVersion:'v1'}};
 const auth=load('lib/admin-auth.ts',{
  'next/headers':{cookies:()=>({get:()=>({value:'signed-session'})})},
  'next/navigation':{redirect:()=>{throw Error('redirect:/login')}},
  react:{cache:fn=>fn},
  'firebase-admin/auth':{getAuth:()=>({getUser:async()=>user})},
  './firebase-admin':{getAdminDb:()=>({})},
  './admin-session':{verifySession:async()=>session},
 },{process:{env:{ADMIN_COOKIE_SECRET:'test'}}});
 assert.equal((await auth.requirePermission('settings')).role,'owner');
 session={uid:'staff',label:user.email,issuedAt:Date.now(),version:'v1'};
 assert.equal((await auth.requireAdmin()).role,'viewer');
 await assert.rejects(auth.requirePermission('operate'),/permission/);
 await assert.rejects(auth.requirePermission('settings'),/permission/);
 user.customClaims.adminRole='operator';assert.equal((await auth.requirePermission('operate')).role,'operator');
 await assert.rejects(auth.requirePermission('settings'),/permission/);
 user.customClaims.adminSessionVersion='v2';await assert.rejects(auth.requireAdmin(),/redirect/);
 session.version='v2';user.disabled=true;await assert.rejects(auth.requireAdmin(),/redirect/);
 user.disabled=false;user.customClaims.adminRole=undefined;await assert.rejects(auth.requireAdmin(),/redirect/);
});

test('settings error recovery refreshes server data before resetting the boundary', () => {
 const calls=[];let pending=false;
 const jsx=(type,props)=>({type,props});
 const {default:SettingsError}=load('app/settings/error.tsx',{
  react:{useTransition:()=>[pending,fn=>fn()]},
  'next/navigation':{useRouter:()=>({refresh:()=>calls.push('refresh')})},
  'react/jsx-runtime':{jsx,jsxs:jsx},
 });
 const findButton=node=>node?.type==='button'?node:[].concat(node?.props?.children||[]).map(findButton).find(Boolean);
 let button=findButton(SettingsError({reset:()=>calls.push('reset')}));
 assert.equal(button.props.disabled,false);button.props.onClick();assert.deepEqual(calls,['refresh','reset']);
 pending=true;button=findButton(SettingsError({reset:()=>{}}));assert.equal(button.props.disabled,true);
});
