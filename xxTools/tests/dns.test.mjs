import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeDomain, queryDns } from "../src/tools/dns/query.mjs";

test("域名支持大小写、尾点及 IDN，拒绝 URL、IP 和非法标签", () => {
  assert.equal(normalizeDomain(" Baidu.COM. "), "baidu.com");
  assert.equal(normalizeDomain("例子。中国"), "xn--fsqu00a.xn--fiqs8s");
  for (const value of [
    "",
    "https://baidu.com",
    "baidu.com/path",
    "baidu.com:443",
    "a@b.com",
    "a..com",
    "-a.com",
    "a_.com",
    "127.0.0.1",
    "[::1]",
    "a%2ecom",
    "a com",
    `${"a".repeat(64)}.com`,
  ]) {
    assert.throws(() => normalizeDomain(value), /有效域名/);
  }
});

test("五类查询过滤伴随 CNAME、去重，保留 TXT 原文，按优先级展示 MX", async (t) => {
  const seen = [];
  t.mock.method(globalThis, "fetch", async (input, options) => {
    const url = new URL(input);
    assert.equal(
      url.origin + url.pathname,
      "https://cloudflare-dns.com/dns-query",
    );
    assert.equal(url.searchParams.get("name"), "example.com");
    assert.equal(options.headers.Accept, "application/dns-json");
    assert.equal(options.credentials, "omit");
    const type = url.searchParams.get("type");
    seen.push(type);
    const Answer = {
      A: [
        { type: 5, data: "alias.example.com." },
        { type: 1, data: "192.0.2.1" },
        { type: 1, data: "192.0.2.1" },
      ],
      AAAA: [],
      CNAME: [{ type: 5, data: "alias.example.com." }],
      MX: [
        { type: 15, data: "20 backup.example.com." },
        { type: 15, data: "10 mail.example.com." },
      ],
      TXT: [{ type: 16, data: '"<script>原文</script>" "second"' }],
    }[type];
    return Response.json({ Status: 0, Answer });
  });
  const result = await queryDns("example.com");
  assert.deepEqual(seen, ["A", "AAAA", "CNAME", "MX", "TXT"]);
  assert.deepEqual(
    result.groups.map((group) => group.records),
    [
      ["192.0.2.1"],
      [],
      ["alias.example.com."],
      ["10 mail.example.com.", "20 backup.example.com."],
      ['"<script>原文</script>" "second"'],
    ],
  );
});

test("单类网络失败保留其他结果，空记录与失败明确区分", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    if (new URL(url).searchParams.get("type") === "AAAA")
      throw new TypeError("offline");
    return Response.json({ Status: 0 });
  });
  const { groups } = await queryDns("example.com");
  assert.match(groups[1].error, /无法连接/);
  assert.equal(groups[0].error, "");
  assert.deepEqual(groups[0].records, []);
});

test("NXDOMAIN、SERVFAIL、HTTP 和异常响应均不能误报为无记录", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [make, expected] of [
    [() => Response.json({ Status: 3 }), /NXDOMAIN/],
    [() => Response.json({ Status: 2 }), /SERVFAIL/],
    [() => new Response("error", { status: 429 }), /HTTP 429/],
    [() => Response.json({}), /格式不正确/],
    [() => Response.json({ Status: 0, Answer: {} }), /格式不正确/],
    [
      () => Response.json({ Status: 0, Answer: [{ type: 1, data: null }] }),
      /格式不正确/,
    ],
    [() => new Response("invalid json"), /格式不正确/],
  ]) {
    mock.mock.mockImplementation(async () => make());
    await assert.rejects(queryDns("example.com"), expected);
  }
});

test("校验失败不请求网络，调用者取消和超时能够结束查询", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ Status: 0 }),
  );
  await assert.rejects(queryDns("bad/url"));
  assert.equal(mock.mock.callCount(), 0);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(queryDns("example.com", { signal: controller.signal }), {
    name: "AbortError",
  });
  mock.mock.mockImplementation(async () => {
    throw new DOMException("timeout", "TimeoutError");
  });
  await assert.rejects(queryDns("example.com"), /超时/);
});
