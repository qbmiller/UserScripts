const RECORD_TYPES = [
  ["A", 1],
  ["AAAA", 28],
  ["CNAME", 5],
  ["MX", 15],
  ["TXT", 16],
];

export function normalizeDomain(input) {
  const value = input
    .trim()
    .replace(/[。．｡]/g, ".")
    .replace(/\.$/, "");
  const invalid = () =>
    new Error("请输入有效域名，例如 baidu.com（无需协议、端口或路径）。");
  if (!value || /[\s/:@?#%\\]/u.test(value)) throw invalid();
  let domain;
  try {
    domain = new URL(`https://${value}`).hostname;
  } catch {
    throw invalid();
  }
  if (
    domain.length > 253 ||
    !domain.includes(".") ||
    /^[\d.]+$/.test(domain) ||
    domain
      .split(".")
      .some((label) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label))
  )
    throw invalid();
  return domain;
}

function errorMessage(error) {
  if (error?.name === "TimeoutError") return "查询超时，请稍后重试。";
  if (error instanceof TypeError)
    return "无法连接 Cloudflare DNS，请检查网络或扩展的网站访问权限。";
  if (error instanceof SyntaxError) return "DNS 服务返回的数据格式不正确。";
  return error instanceof Error ? error.message : "查询失败，请稍后重试。";
}

async function queryRecord(domain, type, code, signal) {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", domain);
  url.searchParams.set("type", type);
  const response = await fetch(url.href, {
    headers: { Accept: "application/dns-json" },
    credentials: "omit",
    referrerPolicy: "no-referrer",
    cache: "no-store",
    signal,
  });
  if (!response.ok)
    throw new Error(`DNS 查询失败（HTTP ${response.status}）。`);
  const data = await response.json();
  if (
    !data ||
    !Number.isInteger(data.Status) ||
    (data.Answer !== undefined &&
      (!Array.isArray(data.Answer) ||
        data.Answer.some(
          (record) =>
            !record ||
            !Number.isInteger(record.type) ||
            typeof record.data !== "string",
        )))
  )
    throw new Error("DNS 服务返回的数据格式不正确。");
  if (data.Status === 3) throw new Error("域名不存在（NXDOMAIN）。");
  if (data.Status !== 0) {
    const reason = {
      1: "请求格式错误",
      2: "解析服务失败（SERVFAIL）",
      4: "服务不支持此查询",
      5: "服务拒绝查询",
    }[data.Status];
    throw new Error(reason || `DNS 查询失败（状态码 ${data.Status}）。`);
  }
  const records = [
    ...new Set(
      (data.Answer || [])
        .filter((record) => record.type === code)
        .map((record) => record.data),
    ),
  ];
  if (type === "MX") records.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  return { type, records, error: "" };
}

export async function queryDns(input, { signal } = {}) {
  const domain = normalizeDomain(input);
  const timeout = AbortSignal.timeout(15000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const results = await Promise.allSettled(
    RECORD_TYPES.map(([type, code]) =>
      queryRecord(domain, type, code, combined),
    ),
  );
  signal?.throwIfAborted();
  if (results.every((result) => result.status === "rejected")) {
    throw new Error(errorMessage(results[0].reason));
  }
  return {
    domain,
    groups: results.map((result, index) =>
      result.status === "fulfilled"
        ? result.value
        : {
            type: RECORD_TYPES[index][0],
            records: [],
            error: errorMessage(result.reason),
          },
    ),
  };
}
