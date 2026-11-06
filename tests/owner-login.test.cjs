const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript'), crypto = require('node:crypto');
function login(user) {
  const module = {exports:{}};
  const cookies=[];
  const imports={
    'next/headers':{cookies:async()=>({set:(...args)=>cookies.push(args)})},
    'next/navigation':{redirect:path=>{throw Error('redirect:'+path)}},
    crypto,
    '@/lib/admin-auth':{adminAuth:()=>({getUser:async()=>user}),isAdminRole:role=>['owner','operator','viewer'].includes(role)},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/login/actions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,{
    module,exports:module.exports,require:name=>{assert.ok(name in imports,name);return imports[name]},Buffer,
    process:{env:{ADMIN_COOKIE_SECRET:'synthetic-test-secret',NEXT_PUBLIC_FIREBASE_API_KEY:'test-key'}},
    fetch:async(_url,options)=>{assert.equal(JSON.parse(options.body).email,'owner@example.test');return {ok:true,json:async()=>({localId:user.uid})}},
  });
  const form={get:name=>({email:'owner@example.test',password:'synthetic-test-password'})[name]};
  return {submit:()=>module.exports.loginAction(null,form),cookies};
}
for(const role of ['owner','operator','viewer']) {
 test(`${role} email login creates a real-UID session without requiring recovery password`,async()=>{
  const check=login({uid:'firebase-user',email:'owner@example.test',disabled:false,customClaims:{adminRole:role,adminSessionVersion:'current-version'}});
  await assert.rejects(check.submit(),/redirect:\/$/);
  const cookie=check.cookies[0];
  const session=JSON.parse(Buffer.from(cookie[1].split('.')[0],'base64url').toString());
  assert.equal(session.uid,'firebase-user');assert.equal(session.version,'current-version');
  assert.equal(cookie[2].httpOnly,true);
 });
}
test('disabled and non-admin identities cannot create admin sessions',async()=>{
 for(const user of [{uid:'u',disabled:true,customClaims:{adminRole:'owner'}},{uid:'u',disabled:false,customClaims:{}}]) {
  const check=login(user);
  assert.match((await check.submit()).error,/does not have admin access/);
  assert.equal(check.cookies.length,0);
 }
});
