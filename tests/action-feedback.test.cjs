const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function component(file, name, props, action) {
  const state = [];
  let cursor = 0, refreshes = 0;
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const jsx = (type, props) => ({ type, props });
  const imports = {
    react: { useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    } },
    'next/navigation': { useRouter: () => ({ refresh: () => refreshes++ }) },
    './actions': action,
    'react/jsx-runtime': { jsx, jsxs: jsx },
  };
  vm.runInNewContext(outputText, { module, exports: module.exports, require(name) {
    assert.ok(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  } });
  return {
    render() { cursor = 0; return module.exports[name](props); },
    get refreshes() { return refreshes; },
  };
}
function find(node, type) {
  if (!node || typeof node !== 'object') return undefined;
  if (node.type === type) return node;
  const children = [].concat(node.props?.children ?? []);
  return children.map(child => find(child, type)).find(Boolean);
}

test('rider updates show pending/error states and allow retry without duplicate submissions', async () => {
  let attempts = 0, reject;
  let fail = true;
  const view = component('app/riders/[id]/RiderStatusToggle.tsx', 'RiderStatusToggle', {
    riderId: 'test-rider', currentStatus: 'pending',
  }, { setRiderStatus: async (id, status) => {
    attempts++;
    assert.equal(id, 'test-rider');
    assert.equal(status, 'active');
    if (fail) await new Promise((_, no) => { reject = no; });
  } });
  const pending = find(view.render(), 'button').props.onClick();
  assert.equal(find(view.render(), 'button').props.disabled, true);
  await find(view.render(), 'button').props.onClick();
  assert.equal(attempts, 1);
  reject(new Error('Network unavailable'));
  await pending;
  assert.equal(find(view.render(), 'p').props.role, 'alert');
  assert.equal(find(view.render(), 'button').props.disabled, false);
  assert.equal(view.refreshes, 0);
  fail = false;
  await find(view.render(), 'button').props.onClick();
  assert.equal(find(view.render(), 'p'), undefined);
  assert.equal(view.refreshes, 1);
});

test('a failed report save keeps the draft and announces the error', async () => {
  const view = component('app/reports/[id]/ReportUpdateForm.tsx', 'ReportUpdateForm', {
    reportId: 'test-report', currentStatus: 'open', currentAdminNotes: 'Original note',
  }, { updateReportAction: async () => { throw new Error('Network unavailable'); } });
  find(view.render(), 'textarea').props.onChange({ target: { value: 'Unsaved draft' } });
  await view.render().props.onSubmit({ preventDefault() {} });
  assert.equal(find(view.render(), 'textarea').props.value, 'Unsaved draft');
  assert.equal(find(view.render(), 'p').props.role, 'alert');
  assert.equal(find(view.render(), 'button').props.disabled, false);
  assert.equal(view.refreshes, 0);
});
