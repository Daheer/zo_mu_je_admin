const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, imports, globals = {}) {
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    module, exports: module.exports, ...globals,
    require: (name) => {
      assert.ok(name in imports, `Unexpected import: ${name}`);
      return imports[name];
    },
  });
  return module.exports;
}

test("admin refreshes visible pages, resumes on focus, and cleans up on login", () => {
  let effect, tick, cleanup, refreshes = 0, pathname = "/riders";
  const events = new Map();
  const target = (prefix) => ({
    addEventListener: (name, fn) => events.set(prefix + name, fn),
    removeEventListener: (name, fn) => {
      assert.equal(events.get(prefix + name), fn);
      events.delete(prefix + name);
    },
  });
  const document = { ...target("document:"), visibilityState: "visible" };
  const { LayoutSwitcher } = load("components/LayoutSwitcher.tsx", {
    react: { useEffect: (fn) => { effect = fn; } },
    "next/navigation": {
      usePathname: () => pathname,
      useRouter: () => ({ refresh: () => refreshes++ }),
    },
    "./Sidebar": { Sidebar: () => null },
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null },
  }, {
    document,
    window: {
      ...target("window:"),
      setInterval: (fn, ms) => { assert.equal(ms, 30_000); tick = fn; return 1; },
      clearInterval: (id) => { assert.equal(id, 1); tick = null; },
    },
  });
  LayoutSwitcher({ children: null });
  cleanup = effect();
  tick();
  assert.equal(refreshes, 1);
  document.visibilityState = "hidden";
  tick();
  events.get("window:focus")();
  assert.equal(refreshes, 1);
  document.visibilityState = "visible";
  events.get("document:visibilitychange")();
  events.get("window:focus")();
  assert.equal(refreshes, 3);
  cleanup();
  assert.equal(tick, null);
  assert.equal(events.size, 0);
  pathname = "/login";
  LayoutSwitcher({ children: null });
  assert.equal(effect(), undefined);
  assert.equal(tick, null);
  assert.equal(events.size, 0);
});

test("riders are read again and sorted newest first, including pending accounts", async () => {
  let data = {
    older: { name: "Older", createdAt: 10 },
    legacy: { name: "Legacy" },
    newest: { name: "Newest", createdAt: 20, status: "pending" },
    earnings: "0",
    invalid: ["not a rider"],
  };
  const { getRiders } = load("lib/db.ts", {
    "./firebase-admin": { getAdminDb: () => ({ ref: (path) => {
      assert.equal(path, "riders");
      return { get: async () => ({ val: () => data }) };
    } }) },
  }, { process: { env: { FIREBASE_SERVICE_ACCOUNT_KEY: "test" } } });
  assert.deepEqual(Array.from(await getRiders(), (rider) => rider.id), ["newest", "older", "legacy"]);
  data.latest = { name: "Just registered", createdAt: 30 };
  assert.equal((await getRiders())[0].id, "latest");
});
