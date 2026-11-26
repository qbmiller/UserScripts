import { test } from "node:test";
import assert from "node:assert/strict";
import { createPreferenceClient } from "../src/core/preference-client.mjs";
import {
  normalizePreferences,
  applyPreferenceChange,
} from "../src/core/preferences.mjs";

test("早期写回不会覆盖新收藏或重启刚关闭的自动恢复", async () => {
  let stored = normalizePreferences(null);
  let notify;
  const commits = [];
  const state = normalizePreferences(null);
  const client = createPreferenceClient(state, {
    read: async () => structuredClone(stored),
    commit: (change) =>
      new Promise((resolve) =>
        commits.push(() => {
          stored = applyPreferenceChange(stored, change);
          notify(structuredClone(stored));
          resolve();
        }),
      ),
    subscribe: (listener) => {
      notify = listener;
    },
  });
  const turn = () => new Promise((resolve) => setImmediate(resolve));
  const a = client.change({ type: "favorite", id: "json" });
  const b = client.change({ type: "favorite", id: "url-codec" });
  const c = client.change({ type: "autoRestore", value: false });
  await turn();
  commits.shift()();
  await turn();
  assert.deepEqual(state.favorites, ["json", "base64"]);
  assert.equal(state.autoRestore, false);
  const d = client.change({ type: "recent", id: "json" });
  for (let i = 0; i < 3; i++) {
    commits.shift()();
    await turn();
  }
  await Promise.all([a, b, c, d]);
  assert.deepEqual(stored.favorites, ["json", "base64"]);
  assert.equal(stored.autoRestore, false);
  assert.deepEqual(state, stored);
});
