import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getOriginalUrl,
  formatJson,
  convertUrl,
} from "../src/core/transforms.mjs";
import {
  normalizePreferences,
  updateRecent,
} from "../src/core/preferences.mjs";

const prefix =
  "chrome-extension://ahmkjjgdligadogjedmnogbpbcpofeeo/html/suspended.html#ttl=test&pos=992&uri=";
test("原始及编码 URL 保留查询、加号、百分号和锚点", () => {
  const url = "https://example.com/?q=a+b&next=%2Fhello#section";
  assert.equal(getOriginalUrl(prefix + url), url);
  assert.equal(getOriginalUrl(prefix + encodeURIComponent(url)), url);
  assert.equal(
    getOriginalUrl(prefix + "https\\://example.com"),
    "https://example.com/",
  );
});
test("拒绝无关页面、无效编码和可执行协议", () => {
  for (const url of [
    null,
    "bad",
    prefix + "%ZZ",
    prefix + "javascript:alert(1)",
    prefix + "file:///tmp/a",
    "https://example.com/#uri=https://github.com",
  ]) {
    assert.equal(getOriginalUrl(url), null);
  }
});
test("JSON 支持顶层基本值、格式化、压缩和错误反馈", () => {
  assert.equal(
    formatJson('{"中文":[1,true]}', false),
    '{\n  "中文": [\n    1,\n    true\n  ]\n}',
  );
  assert.equal(formatJson(" null ", true), "null");
  assert.throws(() => formatJson("{bad", false));
});
test("JSON 美化和压缩保留大整数、指数、负零及重复键原始数据", () => {
  const input =
    '{"id":9223372036854775807,"n":9007199254740993,"exponent":1e400,"zero":-0,"id":1}';
  assert.equal(formatJson(input, true), input);
  assert.equal(formatJson(formatJson(input, false), true), input);
});
test("URL 编解码支持 Unicode，错误输入不被静默改变", () => {
  const input = "中文 &+=/#";
  assert.equal(convertUrl(convertUrl(input, "encode"), "decode"), input);
  assert.equal(convertUrl("a+b", "decode"), "a+b");
  assert.throws(() => convertUrl("%ZZ", "decode"));
});
test("损坏存储被规范化，最近使用去重并限制数量", () => {
  assert.equal(normalizePreferences(null).autoRestore, true);
  assert.deepEqual(
    normalizePreferences({
      favorites: [null, "json", "json"],
      recent: "bad",
      autoRestore: false,
    }).favorites,
    ["json"],
  );
  assert.equal(normalizePreferences({ autoRestore: false }).autoRestore, false);
  assert.deepEqual(updateRecent(["json", "url-codec"], "url-codec"), [
    "url-codec",
    "json",
  ]);
  assert.equal(
    updateRecent(
      Array.from({ length: 20 }, (_, i) => String(i)),
      "new",
    ).length,
    6,
  );
});
