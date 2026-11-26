import { test } from "node:test";
import assert from "node:assert/strict";
import { registerPreferences } from "../src/features/preferences.mjs";
import { normalizePreferences } from "../src/core/preferences.mjs";

test("不同侧栏并发更新按操作合并，其他字段保持不变", async () => {
  let listener;
  let stored = normalizePreferences(null);
  const api = {
    runtime: {
      id: "own",
      getURL: (path) => "chrome-extension://own/" + path,
      onMessage: {
        addListener(fn) {
          listener = fn;
        },
      },
    },
    storage: {
      local: {
        get: async () => ({ "toolbox.preferences": structuredClone(stored) }),
        set: async (value) => {
          await new Promise((resolve) => setImmediate(resolve));
          stored = value["toolbox.preferences"];
        },
      },
    },
  };
  registerPreferences(api);
  const sender = { id: "own", url: "chrome-extension://own/sidepanel.html" };
  const request = (change) =>
    new Promise((resolve) => {
      assert.equal(
        listener(
          { type: "toolbox.preferences.update", change },
          sender,
          resolve,
        ),
        true,
      );
    });
  const results = await Promise.all([
    request({ type: "favorite", id: "json" }),
    request({ type: "favorite", id: "url-codec" }),
    request({ type: "autoRestore", value: false }),
    request({ type: "recent", id: "json" }),
  ]);
  assert.ok(results.every((result) => result.ok));
  assert.deepEqual(stored.favorites, ["json", "url-codec"]);
  assert.deepEqual(stored.recent, ["json"]);
  assert.equal(stored.autoRestore, false);
  assert.equal(
    listener(
      {
        type: "toolbox.preferences.update",
        change: { type: "autoRestore", value: "bad" },
      },
      sender,
      () => assert.fail(),
    ),
    undefined,
  );
});
