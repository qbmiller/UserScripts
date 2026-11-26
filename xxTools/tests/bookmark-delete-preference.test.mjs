import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizePreferences,
  applyPreferenceChange,
  isPreferenceChange,
} from "../src/core/preferences.mjs";
test("删除免确认默认关闭，旧设置及非法值不启用", () => {
  for (const data of [
    null,
    {},
    { autoRestore: false },
    { skipBookmarkDeleteConfirm: "true" },
    { skipBookmarkDeleteConfirm: 1 },
  ])
    assert.equal(normalizePreferences(data).skipBookmarkDeleteConfirm, false);
});
test("开关可以保存和关闭，修改其他偏好不会重置开关", () => {
  let data = applyPreferenceChange(
    { favorites: ["json"] },
    { type: "skipBookmarkDeleteConfirm", value: true },
  );
  assert.equal(data.skipBookmarkDeleteConfirm, true);
  assert.deepEqual(data.favorites, ["json"]);
  data = applyPreferenceChange(data, { type: "recent", id: "json" });
  assert.equal(data.skipBookmarkDeleteConfirm, true);
  data = applyPreferenceChange(data, {
    type: "skipBookmarkDeleteConfirm",
    value: false,
  });
  assert.equal(data.skipBookmarkDeleteConfirm, false);
  assert.equal(
    isPreferenceChange({ type: "skipBookmarkDeleteConfirm", value: "true" }),
    false,
  );
});
