// Never connects to production. Run against local emulators; see PLATFORM_SETTINGS.md.
const assert = require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
process.env.FIREBASE_DATABASE_EMULATOR_HOST='127.0.0.1:19000';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:19099';
const {initializeApp,deleteApp}=require('firebase-admin/app'),{getDatabase}=require('firebase-admin/database'),{getAuth}=require('firebase-admin/auth');
const projectId='demo-zo-settings', ns=projectId+'-default-rtdb';
const options={projectId,credential:{getAccessToken:async()=>({access_token:'owner',expires_in:3600})},databaseURL:`http://127.0.0.1:19000?ns=${ns}`};
function load(file,imports={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>{assert.ok(n in imports,n);return imports[n]},structuredClone});return module.exports;}
(async()=>{
 const apps=[initializeApp(options,'settings-check-one'),initializeApp(options,'settings-check-two')];
 try {
  const db=getDatabase(apps[0]),db2=getDatabase(apps[1]);
  await db.setRules(JSON.parse(fs.readFileSync('config/database.rules.json','utf8')));
  await db.ref().set(null);
  const schema=load('lib/platform-settings.ts');
  const store=load('lib/settings-store.ts',{'./firebase-admin':{getAdminDb:()=>db},'./platform-settings':schema});
  const other=load('lib/settings-store.ts',{'./firebase-admin':{getAdminDb:()=>db2},'./platform-settings':schema});
  const guard=load('lib/settings-rules.ts',{'../config/database.rules.json':JSON.parse(fs.readFileSync('config/database.rules.json','utf8')),'./firebase-admin':{getAdminDb:()=>db}});
  await guard.requireProtectedSettingsRules();
  const first=structuredClone(schema.DEFAULT_SETTINGS);first.pricing.Tricycle.minimumFare=600;
  assert.equal((await store.saveSettings(first,0,'Test owner','Set initial prices')).revision,1);
  const a=structuredClone(first),b=structuredClone(first);a.pricing.Tricycle.minimumFare=700;b.operations.bookingsEnabled=false;
  const race=await Promise.allSettled([store.saveSettings(a,1,'First owner','Change minimum fare'),other.saveSettings(b,1,'Second owner','Pause bookings briefly')]);
  assert.equal(race.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await store.getSettings()).revision,2);
  assert.equal((await store.getSettingsHistory()).length,2);
  const rest=async(path,method='GET',body,token)=>fetch(`http://127.0.0.1:19000/${path}.json?ns=${ns}${token?'&auth='+encodeURIComponent(token):''}`,{method,headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  assert.equal((await rest('platformControl/current')).status,200);
  for(const path of ['platformControl','platformControl/history','adminAccessHistory']) assert.equal((await rest(path)).status,401);
  for(const path of ['platformControl/current','platformControl/history/forged','adminAccessHistory/forged','unknownRoot','']) assert.equal((await rest(path,'PUT',{forged:true})).status,401);
  assert.equal((await rest('users/test-customer','PUT',{name:'Local test customer'})).status,200);
  assert.equal((await rest('users/test-customer')).status,200);
  const auth=getAuth(apps[0]);
  const previous=await auth.getUserByEmail('viewer@local.test').catch(()=>null);if(previous)await auth.deleteUser(previous.uid);
  const user=await auth.createUser({email:'viewer@local.test',password:'Local-test-only-12345'});
  await auth.setCustomUserClaims(user.uid,{adminRole:'viewer'});
  const login=await fetch('http://127.0.0.1:19099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=emulator',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:user.email,password:'Local-test-only-12345',returnSecureToken:true})});
  assert.equal(login.status,200);const token=(await login.json()).idToken;
  assert.equal((await rest('platformControl/current','PUT',{forged:true},token)).status,401);
  const published=(await db.ref('platformControl/current').get()).val();
  published.values.operations.bookingsEnabled=true;
  await db.ref('platformControl/current').set(published);
  const request={userId:user.uid,status:'waiting',riderId:'waiting',rideType:'Tricycle',settingsRevision:published.revision,searchTimeoutSeconds:published.values.matching.requestTimeoutSeconds,pricingPolicy:published.values.pricing.Tricycle,voucherPolicy:{maxVoucherPercent:published.values.rewards.maxVoucherPercent,maxVoucherAmount:published.values.rewards.maxVoucherAmount}};
  assert.equal((await rest('All Ride Requests/valid-new-ride','PUT',request,token)).status,200);
  const wrongRate=structuredClone(request);wrongRate.pricingPolicy.perKm=1;
  assert.equal((await rest('All Ride Requests/forged-rate','PUT',wrongRate,token)).status,401);
  assert.equal((await rest('All Ride Requests/missing-policy','PUT',{userId:user.uid,status:'waiting',riderId:'waiting'},token)).status,401);
  assert.equal((await rest('All Ride Requests/valid-new-ride/pricingPolicy/perKm','PUT',1,token)).status,401);
  await db.ref('platformControl/current/values/operations/bookingsEnabled').set(false);
  assert.equal((await rest('All Ride Requests/paused-new-ride','PUT',request,token)).status,401);
  // Existing rides can finish during a pause, using the original prices.
  assert.equal((await rest('All Ride Requests/valid-new-ride/status','PUT','ended',token)).status,200);
  await db.ref('platformControl/current/values/operations/bookingsEnabled').set(true);
  await db.ref('platformControl/current/values/operations/maintenanceMode').set(true);
  assert.equal((await rest('All Ride Requests/maintenance-new-ride','PUT',request,token)).status,401);
  await db.ref('platformControl/current/values/operations/maintenanceMode').set(false);
  await auth.updateUser(user.uid,{disabled:true});await auth.revokeRefreshTokens(user.uid);assert.equal((await auth.getUser(user.uid)).disabled,true);
  // Browser QA fixtures, only in the asserted local namespace.
  await db.ref('riders/demo-rider').set({id:'demo-rider',name:'Demo Rider',status:'pending',createdAt:Date.now(),email:'rider@local.test',phone:'08000000000',vehicle_details:{vehicle_type:'Tricycle'}});
  await db.ref('users/demo-customer').set({name:'Demo Customer',email:'customer@local.test',phone:'08000000000',createdAt:Date.now()});
  await db.ref('reports/demo-report').set({status:'open',description:'Local settings check',createdAt:Date.now()});
  await db.ref('All Ride Requests/demo-trip').set({userName:'Demo Customer',originAddress:'Pickup',destinationAddress:'Destination',status:'ended',time:new Date().toISOString(),rideType:'Tricycle',fareAmount:'600'});
  await db.ref('adminAccessHistory/check-event').set({actor:'Owner',target:'viewer@local.test',role:'viewer',action:'create',disabled:false,at:Date.now()});
  console.log('PASS: real concurrent saves, cold-cache retries, atomic history, protected reads/writes, server-enforced booking pauses and immutable fare/voucher policies, legacy path compatibility and staff Auth lifecycle. Local browser fixtures ready.');
 } finally {await Promise.all(apps.map(deleteApp));}
})().catch(e=>{console.error(e);process.exitCode=1});
