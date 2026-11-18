const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');

function nodes(node, match) {
 if (Array.isArray(node)) return node.flatMap(n => nodes(n, match));
 if (!node || typeof node !== 'object') return [];
 return [...(match(node) ? [node] : []), ...[].concat(node.props?.children || []).flatMap(n => nodes(n, match))];
}
function fixture(enabled, configured) {
 let cursor = 0, payload;
 const states = [], jsx = (type, props) => ({ type, props });
 const module = { exports: {} };
 const initial = { schemaVersion: 1, revision: 2, emailConfigured: configured, values: { enabled, pricing: { perKm: 116, perMinute: 116, minimumFare: 400 }, sizes: Object.fromEntries(['small','medium','large'].map(s => [s, { maxWeightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10, surcharge: 0 }])), prohibitedItems: 'No illegal or hazardous packages.' } };
 const imports = {
  react: { useState: value => { const i = cursor++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value; return [states[i], next => { states[i] = typeof next === 'function' ? next(states[i]) : next; }]; }, useRef: value => { const i = cursor++; return states[i] ||= { current: value }; } },
  'next/navigation': { useRouter: () => ({ refresh() {} }) },
  './actions': { saveCourierSettingsAction: async (values, revision, reason) => { payload = { values, revision, reason }; return { ok: false, error: 'Settings changed. Reload.' }; } },
  'react/jsx-runtime': { jsx, jsxs: jsx },
 };
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/settings/CourierForm.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module, exports: module.exports, require: n => { assert.ok(n in imports, n); return imports[n]; }, structuredClone });
 const render = () => { cursor = 0; return module.exports.CourierForm({ initial, canEdit: true }); };
 return { render, get payload() { return payload; } };
}
test('courier activation needs email, but an enabled courier can still be paused after SMTP is removed', () => {
 const off = fixture(false, false), on = fixture(true, false);
 assert.equal(nodes(off.render(), n => n.props?.role === 'switch')[0].props.disabled, true);
 const toggle = nodes(on.render(), n => n.props?.role === 'switch')[0];
 assert.equal(toggle.props.disabled, false);
 toggle.props.onChange({ target: { checked: false } });
 assert.equal(nodes(on.render(), n => n.props?.role === 'switch')[0].props.checked, false);
});
test('a courier revision conflict retains edited prices and the support reason', async () => {
 const f = fixture(false, true);
 nodes(f.render(), n => n.type === 'input' && n.props.type === 'number')[0].props.onChange({ target: { valueAsNumber: 200 } });
 const reason = nodes(f.render(), n => n.type === 'textarea' && n.props.maxLength === 300)[0];
 reason.props.onChange({ target: { value: 'Review delivery launch rates' } });
 await f.render().props.onSubmit({ preventDefault() {} });
 assert.equal(f.payload.revision, 2);
 assert.equal(f.payload.values.pricing.perKm, 200);
 assert.equal(nodes(f.render(), n => n.type === 'input' && n.props.type === 'number')[0].props.value, 200);
 assert.equal(nodes(f.render(), n => n.type === 'textarea' && n.props.maxLength === 300)[0].props.value, 'Review delivery launch rates');
 assert.equal(nodes(f.render(), n => n.props?.role === 'alert')[0].props.children, 'Settings changed. Reload.');
});
