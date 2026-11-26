// 直接由扩展页面请求，不经过后台代理，不手动伪造浏览器请求头。
export async function fetchRequestHeaders({ signal } = {}) {
  const timeout = AbortSignal.timeout(15000);
  const response = await fetch("https://httpbin.org/headers", {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  if (!response.ok) {
    throw new Error(`查询失败（HTTP ${response.status}），请稍后重试。`);
  }
  const data = await response.json();
  const headers = data?.headers;
  if (
    !headers ||
    typeof headers !== "object" ||
    Array.isArray(headers) ||
    !Object.keys(headers).length ||
    Object.values(headers).some((value) => typeof value !== "string")
  ) {
    throw new Error("服务返回的请求头格式不正确，请稍后重试。");
  }
  return Object.entries(headers).sort(([left], [right]) =>
    left.localeCompare(right),
  );
}
