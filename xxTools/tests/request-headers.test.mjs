import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchRequestHeaders } from "../src/tools/request-headers/request.mjs";

test("回显服务收到的请求头，不发送 Cookie 或自行拼凑请求头", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://httpbin.org/headers");
    assert.equal(options.credentials, "omit");
    assert.equal(options.cache, "no-store");
    assert.equal(options.referrerPolicy, "no-referrer");
    assert.equal(options.headers, undefined);
    return new Response(
      JSON.stringify({
        headers: {
          "User-Agent": "实际浏览器",
          Accept: "*/*",
          "X-Test": "<script>文本</script>",
        },
      }),
    );
  });
  assert.deepEqual(await fetchRequestHeaders(), [
    ["Accept", "*/*"],
    ["User-Agent", "实际浏览器"],
    ["X-Test", "<script>文本</script>"],
  ]);
});

test("拒绝 HTTP 错误及异常响应，不显示伪造的成功结果", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  mock.mock.mockImplementation(
    async () => new Response("unavailable", { status: 503 }),
  );
  await assert.rejects(fetchRequestHeaders(), /HTTP 503/);
  for (const data of [
    null,
    {},
    { headers: [] },
    { headers: {} },
    { headers: { Accept: 1 } },
  ]) {
    mock.mock.mockImplementation(
      async () => new Response(JSON.stringify(data)),
    );
    await assert.rejects(fetchRequestHeaders(), /格式不正确/);
  }
  mock.mock.mockImplementation(async () => new Response("not json"));
  await assert.rejects(fetchRequestHeaders(), SyntaxError);
});

test("网络失败与取消请求可结束等待", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(fetchRequestHeaders(), /offline/);
  const controller = new AbortController();
  mock.mock.mockImplementation(async (_url, options) => {
    controller.abort();
    options.signal.throwIfAborted();
  });
  await assert.rejects(fetchRequestHeaders({ signal: controller.signal }), {
    name: "AbortError",
  });
});
