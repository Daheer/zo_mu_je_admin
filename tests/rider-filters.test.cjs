const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function nodes(node, match) {
  if (Array.isArray(node)) return node.flatMap(n => nodes(n, match));
  if (!node || typeof node !== 'object') return [];
  return [...(match(node) ? [node] : []), ...nodes(node.props?.children, match)];
}
function text(node) {
  if (Array.isArray(node)) return node.map(text).join('');
  return node && typeof node === 'object' ? text(node.props?.children) : typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
test('rider status shortcuts combine with search, update counts on refresh and clear together', () => {
  let cursor = 0;
  const state = [], module = { exports: {} }, jsx = (type, props) => ({type, props});
  const imports = {
    react: { useState(value) { const i = cursor++; if (!(i in state)) state[i] = value; return [state[i], next => { state[i] = next; }]; }, useMemo: fn => fn() },
    'next/link': {default:'a'}, '@/components/StatusBadge': {StatusBadge:() => null}, 'react/jsx-runtime': {jsx, jsxs:jsx},
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/riders/RidersTableWithSearch.tsx','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText, {module,exports:module.exports,require:name => {assert.ok(name in imports, name);return imports[name];}});
  const riders = [{id:'alice',name:'Alice',email:'alice@example.test',phone:'+2341111111111',status:'pending'}, {id:'bob',name:'Bob',status:'active'}, {id:'chris',name:'Chris',status:'inactive'}, {id:'dana',name:'Dana',status:'pending'}];
  const render = () => { cursor = 0; return module.exports.RidersTableWithSearch({riders}); };
  const button = label => nodes(render(), n => n.type === 'button' && text(n).startsWith(label))[0];
  const search = value => nodes(render(), n => n.type === 'input')[0].props.onChange({target:{value}});
  const rows = () => nodes(render(), n => n.type === 'tbody')[0]?.props.children || [];
  button('Pending').props.onClick();
  assert.equal(button('Pending').props['aria-pressed'], true);
  assert.deepEqual(Array.from(rows(), n => text(n)).map(t => /Alice/.test(t) ? 'Alice' : 'Dana'), ['Alice','Dana']);
  search(' ALICE@EXAMPLE.TEST ');
  assert.equal(rows().length, 1);
  assert.match(text(rows()[0]), /Alice/);
  search('+234111');
  assert.equal(rows().length, 1);
  riders.push({id:'ellie',name:'Ellie',status:'pending'});
  assert.match(text(button('Pending')), /\(3\)/);
  assert.equal(rows().length, 1); // Refresh preserves the active search and status.
  button('Clear filters').props.onClick();
  assert.equal(rows().length, 5);
  assert.equal(button('All').props['aria-pressed'], true);
  button('Inactive').props.onClick();
  search('Alice');
  assert.equal(rows().length, 0);
  assert.match(text(render()), /No riders match your search and status filter/);
});
