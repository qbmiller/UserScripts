import { test } from "node:test";
import assert from "node:assert/strict";
import { registerUnsuspend } from "../src/features/unsuspend.mjs";
const prefix =
  "chrome-extension://ahmkjjgdligadogjedmnogbpbcpofeeo/html/suspended.html#ttl=test&pos=992&uri=";
const tick = () => new Promise((resolve) => setImmediate(resolve));
function setup(tabs = [], enabled = true) {
  const listeners = {},
    updates = [],
    queries = [];
  const event = (name) => ({
    addListener(fn) {
      listeners[name] = fn;
    },
  });
  const api = {
    storage: {
      local: {
        get: async () => ({ "toolbox.preferences": { autoRestore: enabled } }),
      },
    },
    tabs: {
      get: async (id) => {
        const tab = tabs.find((tab) => tab.id === id);
        if (!tab) throw new Error("closed");
        return tab;
      },
      update: async (id, options) => updates.push({ id, ...options }),
      query: async (query) => {
        queries.push(query);
        return tabs.filter(
          (tab) => tab.active && tab.windowId === query.windowId,
        );
      },
      onCreated: event("created"),
      onUpdated: event("updated"),
      onActivated: event("activated"),
    },
    runtime: {
      id: "own-extension",
      getURL: (path) => "chrome-extension://own-extension/" + path,
      onMessage: event("message"),
    },
  };
  const feature = registerUnsuspend(api);
  return {
    api,
    listeners,
    updates,
    queries,
    feature,
    setEnabled: (value) => {
      enabled = value;
    },
  };
}
test("100 个后台标签在创建、导航和刷新时均不恢复，初始化不扫描", async () => {
  const tabs = Array.from({ length: 100 }, (_, id) => ({
    id,
    active: false,
    url: prefix + `https://example.com/${id}`,
  }));
  const { listeners, updates, queries } = setup(tabs);
  for (const tab of tabs) {
    listeners.created(tab);
    listeners.updated(tab.id, { url: tab.url, status: "loading" }, tab);
  }
  await tick();
  assert.deepEqual(updates, []);
  assert.deepEqual(queries, []);
});
test("当前标签创建、选中或刷新时只恢复该标签", async () => {
  const tab = {
    id: 1,
    active: true,
    pendingUrl: prefix + "https://example.com/a",
  };
  const { listeners, updates } = setup([
    tab,
    { id: 2, active: false, url: prefix + "https://example.com/b" },
  ]);
  for (const trigger of [
    () => listeners.created(tab),
    () => listeners.activated({ tabId: 1 }),
    () => listeners.updated(1, { status: "loading" }, tab),
  ]) {
    trigger();
    await tick();
  }
  assert.deepEqual(
    updates,
    Array.from({ length: 3 }, () => ({ id: 1, url: "https://example.com/a" })),
  );
});
test("关闭自动恢复立即生效；手工恢复仍可使用", async () => {
  const state = setup(
    [{ id: 1, active: true, url: prefix + "https://example.com" }],
    false,
  );
  state.listeners.activated({ tabId: 1 });
  await tick();
  assert.equal(state.updates.length, 0);
  assert.equal((await state.feature.restore(1, true)).ok, true);
  state.setEnabled(true);
  state.listeners.activated({ tabId: 1 });
  await tick();
  assert.equal(state.updates.length, 2);
});
test("处理期间切走的标签、重复事件和已关闭标签不会触发额外导航", async () => {
  const tab = { id: 1, active: true, url: prefix + "https://example.com" };
  const state = setup([tab]);
  state.listeners.activated({ tabId: 1 });
  tab.active = false;
  await tick();
  assert.equal(state.updates.length, 0);
  tab.active = true;
  state.listeners.activated({ tabId: 1 });
  state.listeners.activated({ tabId: 1 });
  await tick();
  assert.equal(state.updates.length, 1);
  assert.equal((await state.feature.restore(999)).ok, false);
});
test("侧栏手工恢复只查指定窗口当前标签，并拒绝网页和无效消息", async () => {
  const state = setup(
    [
      { id: 1, windowId: 7, active: true, url: prefix + "https://example.com" },
      { id: 2, windowId: 8, active: true, url: prefix + "https://other.com" },
    ],
    false,
  );
  const sender = {
    id: "own-extension",
    url: "chrome-extension://own-extension/sidepanel.html",
  };
  const message = {
    type: "toolbox.restore-current",
    windowId: 7,
    requestId: "request-1",
  };
  const response = await new Promise((resolve) =>
    assert.equal(state.listeners.message(message, sender, resolve), true),
  );
  assert.equal(response.ok, true);
  assert.equal(response.requestId, "request-1");
  assert.deepEqual(state.updates, [{ id: 1, url: "https://example.com/" }]);
  for (const bad of [
    { ...sender, tab: { id: 3 } },
    { ...sender, id: "other" },
    { ...sender, url: "https://example.com" },
  ]) {
    assert.equal(
      state.listeners.message(message, bad, () => assert.fail()),
      undefined,
    );
  }
  assert.equal(
    state.listeners.message({ ...message, windowId: -1 }, sender, () =>
      assert.fail(),
    ),
    undefined,
  );
});
