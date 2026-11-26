import { test } from "node:test";
import assert from "node:assert/strict";
import {
  findTextLinks,
  normalizeReaderSettings,
  readerDefaults,
} from "../src/tools/wechat-reader/settings.mjs";
import { registerWeChatReader } from "../src/features/wechat-reader.mjs";
import { headingLevel } from "../src/tools/wechat-reader/headings.mjs";

test("真实旧版公众号的整段加粗标题可生成层级目录", () => {
  for (const text of [
    "一、缘起",
    "二、检索需求的满足与架构演进",
    "三、总结",
    "四、下章预告",
  ])
    assert.equal(headingLevel({ tag: "P", text, boldText: text }), 2);
  for (const text of [
    "原始阶段-LIKE",
    "初级阶段-全文索引",
    "中级阶段-开源外置索引",
    "高级阶段-自研搜索引擎",
  ])
    assert.equal(headingLevel({ tag: "P", text, boldText: text }), 3);
  assert.equal(headingLevel({ tag: "H4", text: "标准标题", boldText: "" }), 4);
});
test("段内强调、总结列表、长句和冒号提示不误识别为标题", () => {
  for (const [text, boldText] of [
    ["能够快速满足业务需求，存在的问题也显而易见：", "存在的问题"],
    ["（1）原始阶段-LIKE", "LIKE"],
    ["提示：", "提示："],
    ["这是完整的正文句子。", "这是完整的正文句子。"],
    ["长正文".repeat(30), "长正文".repeat(30)],
    ["普通段落", ""],
  ])
    assert.equal(headingLevel({ tag: "P", text, boldText }), null);
});

test("阅读开关容错并仅保留已知布尔字段", () => {
  assert.deepEqual(normalizeReaderSettings(null), readerDefaults);
  assert.deepEqual(
    normalizeReaderSettings({
      enabled: false,
      links: "false",
      secret: "token",
    }),
    { ...readerDefaults, enabled: false },
  );
});
test("字号保存为数值并约束范围，旧设置保持原文大小", () => {
  assert.equal(normalizeReaderSettings({ enabled: true }).tocFontSize, 14);
  assert.equal(normalizeReaderSettings({ enabled: true }).articleFontSize, 0);
  const result = normalizeReaderSettings({
    tocFontSize: 18,
    articleFontSize: 22,
  });
  assert.equal(result.tocFontSize, 18);
  assert.equal(result.articleFontSize, 22);
  for (const invalid of [
    null,
    "20",
    true,
    NaN,
    Infinity,
    {},
    "18px;display:none",
  ]) {
    assert.equal(
      normalizeReaderSettings({ tocFontSize: invalid }).tocFontSize,
      14,
    );
    assert.equal(
      normalizeReaderSettings({ articleFontSize: invalid }).articleFontSize,
      0,
    );
  }
  assert.equal(normalizeReaderSettings({ tocFontSize: 500 }).tocFontSize, 24);
  assert.equal(
    normalizeReaderSettings({ articleFontSize: -1 }).articleFontSize,
    12,
  );
  assert.equal(
    normalizeReaderSettings({ articleFontSize: 0 }).articleFontSize,
    0,
  );
});
test("识别多个链接，保留查询、锚点和配对括号，排除中文标点", () => {
  const text =
    "网址：https://example.com/a_(b)?q=a+b#中文。再看 (http://example.org/x).";
  const links = findTextLinks(text);
  assert.equal(links.length, 2);
  assert.equal(links[0].text, "https://example.com/a_(b)?q=a+b#中文");
  assert.equal(links[1].text, "http://example.org/x");
  for (const link of links)
    assert.equal(
      text.slice(link.index, link.index + link.text.length),
      link.text,
    );
});
test("拒绝可执行协议及无效链接，不将域名或相对地址转为链接", () => {
  assert.deepEqual(
    findTextLinks(
      "javascript:alert(1) data:text/html,x example.com /test https://",
    ),
    [],
  );
});
test("设置桥只向本扩展的微信页面返回阅读设置，不泄露其他存储", async () => {
  let listener,
    reads = 0;
  const api = {
    runtime: {
      id: "extension-id",
      onMessage: {
        addListener(fn) {
          listener = fn;
        },
      },
    },
    storage: {
      local: {
        async get(key) {
          reads++;
          assert.equal(key, "wechatReader");
          return { wechatReader: { images: false }, githubToken: "private" };
        },
      },
    },
  };
  registerWeChatReader(api);
  const message = { type: "toolbox.wechat-reader-settings" };
  for (const sender of [
    { id: "extension-id", url: "https://example.com" },
    { id: "other", url: "https://mp.weixin.qq.com/s/test" },
    { id: "extension-id", url: "https://mp.weixin.qq.com.evil.test" },
    {},
  ])
    assert.equal(
      listener(message, sender, () => assert.fail("未授权请求")),
      undefined,
    );
  assert.equal(reads, 0);
  const result = await new Promise((resolve) => {
    assert.equal(
      listener(
        message,
        { id: "extension-id", url: "https://mp.weixin.qq.com/s/test" },
        resolve,
      ),
      true,
    );
  });
  assert.deepEqual(result, {
    ok: true,
    settings: { ...readerDefaults, images: false },
  });
  assert.equal(JSON.stringify(result).includes("private"), false);
});
test("存储读取失败时设置桥明确返回失败", async () => {
  let listener;
  registerWeChatReader({
    runtime: {
      id: "id",
      onMessage: {
        addListener(fn) {
          listener = fn;
        },
      },
    },
    storage: { local: { get: () => Promise.reject(new Error("unavailable")) } },
  });
  assert.deepEqual(
    await new Promise((resolve) =>
      listener(
        { type: "toolbox.wechat-reader-settings" },
        { id: "id", url: "https://mp.weixin.qq.com/s/x" },
        resolve,
      ),
    ),
    { ok: false },
  );
});
