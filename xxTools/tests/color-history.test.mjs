import { test } from "node:test";
import assert from "node:assert/strict";
import {
  rememberColor,
  normalizeColorHistory,
} from "../src/tools/color-picker/history.mjs";
test("历史颜色最多十个，最新在前，等价颜色去重并移到最前", () => {
  let history = [];
  for (let i = 0; i < 12; i++)
    history = rememberColor(history, `rgb(${i},0,0)`);
  assert.equal(history.length, 10);
  assert.equal(history[0], "rgb(11, 0, 0)");
  history = rememberColor(history, "#0a0000");
  assert.equal(history[0], "rgb(10, 0, 0)");
  assert.equal(history.length, 10);
  assert.equal(history.filter((value) => value === "rgb(10, 0, 0)").length, 1);
});
test("存储往返保留透明度并忽略损坏历史", () => {
  const history = rememberColor(["#ff0000"], "rgba(255,0,0,0.5)");
  assert.equal(history.length, 2);
  assert.deepEqual(
    normalizeColorHistory(JSON.parse(JSON.stringify(history))),
    history,
  );
  assert.deepEqual(
    normalizeColorHistory([null, {}, "invalid-color", "#fff", "rgb(255,255,255)"]),
    ["rgb(255, 255, 255)"],
  );
  assert.deepEqual(normalizeColorHistory(null), []);
});
