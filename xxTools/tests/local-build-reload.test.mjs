import { test } from "node:test";
import assert from "node:assert/strict";
import { registerLocalBuildReload } from "../src/features/local-build-reload.mjs";

test("只对完整的新构建重载，后台闹钟可在休眠后再次检查", async () => {
  let listener;
  let reloads = 0;
  let marker = { id: "current" };
  let missing = false;
  const api = {
    runtime: { getURL: (path) => `chrome-extension://test/${path}`, reload: () => reloads++ },
    alarms: {
      create(name, options) { assert.equal(name, "xxtools-local-build-reload"); assert.equal(options.periodInMinutes, 1); },
      onAlarm: { addListener(fn) { listener = fn; } },
    },
  };
  registerLocalBuildReload(api, "current", async (url, options) => {
    assert.equal(url, "chrome-extension://test/__local_build.json");
    assert.equal(options.cache, "no-store");
    if (missing) throw new Error("构建文件暂时缺失");
    return { ok: true, json: async () => marker };
  });
  const tick = () => new Promise((resolve) => setImmediate(resolve));
  await tick();
  assert.equal(reloads, 0);
  missing = true;
  listener({ name: "xxtools-local-build-reload" });
  await tick();
  assert.equal(reloads, 0);
  missing = false;
  marker = {};
  listener({ name: "xxtools-local-build-reload" });
  await tick();
  assert.equal(reloads, 0);
  marker = { id: "next" };
  listener({ name: "other-alarm" });
  await tick();
  assert.equal(reloads, 0);
  listener({ name: "xxtools-local-build-reload" });
  await tick();
  assert.equal(reloads, 1);
});
