const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, imports, globals={}) {
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>{assert.ok(n in imports,n);return imports[n]},structuredClone,...globals});
 return module.exports;
}
function nodes(node, match) {if(Array.isArray(node))return node.flatMap(n=>nodes(n,match));if(!node||typeof node!=='object')return [];return [...(match(node)?[node]:[]),...[].concat(node.props?.children||[]).flatMap(n=>nodes(n,match))];}
function fixture() {
 let cursor=0, active='general', payload, changes=[];
 const states=[], jsx=(type,props)=>({type,props});
 const policy=load('lib/platform-settings.ts',{});
 const initial={schemaVersion:1,revision:3,values:structuredClone(policy.DEFAULT_SETTINGS),updatedAt:Date.now(),updatedBy:'Owner'};
 const {SettingsForm}=load('app/settings/SettingsForm.tsx',{
  react:{useState:value=>{const i=cursor++;if(!(i in states))states[i]=typeof value==='function'?value():value;return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next}]},useRef:value=>{const i=cursor++;return states[i] ||= {current:value}},useEffect:fn=>fn()},
  'next/navigation':{useRouter:()=>({refresh:()=>{}})},
  './actions':{saveSettingsAction:async(values,revision,reason)=>{payload={values,revision,reason};return {ok:true,version:{...initial,values,revision:4}}}},
  '@/lib/platform-settings':policy,
  'react/jsx-runtime':{jsx,jsxs:jsx},
 },{requestAnimationFrame:fn=>fn()});
 const render=()=>{cursor=0;return SettingsForm({initial,canEdit:true,activeSection:active,onSectionChange:s=>{active=s;changes.push(s)},onDirtyChange:()=>{},heading:{label:active,description:''}})};
 const field=(label)=>nodes(render(),n=>n.props?.label===label)[0];
 const input=(label)=>nodes(field(label),n=>n.type==='input'||n.type==='textarea')[0];
 return {render,input,set active(v){active=v},get active(){return active},get payload(){return payload},changes};
}
test('drafts survive category switches and save together in one revision',async()=>{
 const f=fixture();
 f.input('Support phone').props.onChange({target:{value:'+2348012345678'}});
 f.active='pricing';f.input('Minimum fare (₦)').props.onChange({target:{valueAsNumber:777}});
 f.active='matching';f.input('Request timeout (seconds)').props.onChange({target:{valueAsNumber:80}});
 f.active='general';assert.equal(f.input('Support phone').props.value,'+2348012345678');
 f.input('Reason for this change').props.onChange({target:{value:'Update fares and matching limits'}});
 await f.render().props.onSubmit({preventDefault(){},currentTarget:{querySelector:()=>null}});
 assert.equal(f.payload.values.pricing.Tricycle.minimumFare,777);
 assert.equal(f.payload.values.matching.requestTimeoutSeconds,80);
 assert.equal(f.payload.values.operations.supportPhone,'+2348012345678');
 assert.equal(f.payload.revision,3);
 assert.equal(nodes(f.render(),n=>n.type==='button'&&n.props.children==='Save changes')[0].props.disabled,true);
});
test('invalid fields in another category reveal that category before reporting validity',async()=>{
 const f=fixture();let focused=false,reported=false;
 const invalid={closest:()=>({dataset:{settingsSection:'service'}}),focus:()=>{focused=true},reportValidity:()=>{reported=true}};
 await f.render().props.onSubmit({preventDefault(){},currentTarget:{querySelector:()=>invalid}});
 assert.equal(f.active,'service');assert.equal(focused,true);assert.equal(reported,true);assert.equal(f.payload,undefined);
});
