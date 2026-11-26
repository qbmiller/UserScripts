import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeZhihuSettings } from "../src/tools/zhihu-toc/settings.mjs";
import { normalizeGitHubSelectionSettings } from "../src/tools/github-download/settings.mjs";
import { registerZhihuReader } from "../src/features/zhihu-reader.mjs";
import { registerGitHubSelectionSettings } from "../src/features/github-selection.mjs";

test("网页增强默认开启，明确关闭可保留，忽略非布尔值和其他数据", () => {
  for (const normalize of [
    normalizeZhihuSettings,
    normalizeGitHubSelectionSettings,
  ]) {
    for (const input of [null, {}, { enabled: "false" }])
      assert.deepEqual(normalize(input), { enabled: true });
    assert.deepEqual(normalize({ enabled: false, token: "secret" }), {
      enabled: false,
    });
  }
});

for (const [register, type, origin, key] of [
  [
    registerZhihuReader,
    "zhihu-reader",
    "https://zhuanlan.zhihu.com",
    "zhihuReader",
  ],
  [
    registerGitHubSelectionSettings,
    "github-selection",
    "https://github.com",
    "githubSelection",
  ],
]) {
  test(`${type} 设置桥限制网页来源且只返回本工具开关`, async () => {
    let listener;
    let fail = false;
    const api = {
      runtime: {
        id: "own",
        onMessage: {
          addListener(fn) {
            listener = fn;
          },
        },
      },
      storage: {
        local: {
          async get(requested) {
            assert.equal(requested, key);
            if (fail) throw new Error("storage error");
            return { [key]: { enabled: false }, githubToken: "secret" };
          },
        },
      },
    };
    register(api);
    const message = { type: `toolbox.${type}-settings` };
    for (const sender of [
      { id: "other", url: origin },
      { id: "own", url: "https://example.com" },
    ])
      assert.equal(
        listener(message, sender, () => assert.fail()),
        undefined,
      );
    const request = () =>
      new Promise((resolve) => {
        assert.equal(
          listener(message, { id: "own", url: `${origin}/p/123` }, resolve),
          true,
        );
      });
    assert.deepEqual(await request(), {
      ok: true,
      settings: { enabled: false },
    });
    fail = true;
    assert.deepEqual(await request(), { ok: false });
  });
}
