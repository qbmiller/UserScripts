const CACHE_KEY = "lockjobMessages";
const SOURCE_URL = "https://cf.xiaomi318.com/xxmac/lockjob.json";
const REFRESH_INTERVAL = 7 * 24 * 60 * 60 * 1000;
const FALLBACK_MESSAGES = [
  "夜月一帘幽梦，春风十里柔情。",
  "天涯地角有穷时，只有相思无尽处。",
  "一骑红尘妃子笑，无人知是荔枝来。",
];

function isMessageList(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((line) => typeof line === "string" && line.trim().length > 0)
  );
}

function randomMessage(messages: string[]) {
  return messages[Math.floor(Math.random() * messages.length)];
}

export async function loadLockjobMessage(show: (message: string) => void) {
  const storage = globalThis.chrome?.storage?.local;
  const saved = await storage?.get(CACHE_KEY).catch(() => undefined);
  const cache = saved?.[CACHE_KEY] as
    | { messages?: unknown; fetchedAt?: unknown }
    | undefined;
  const cachedMessages = isMessageList(cache?.messages) ? cache.messages : null;
  if (cachedMessages) {
    show(randomMessage(cachedMessages));
    if (typeof cache?.fetchedAt === "number") {
      const age = Date.now() - cache.fetchedAt;
      if (age >= 0 && age < REFRESH_INTERVAL) return;
    }
  }

  try {
    const response = await fetch(SOURCE_URL, {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) throw new Error("短句下载失败");
    const messages: unknown = await response.json();
    if (!isMessageList(messages)) throw new Error("短句格式无效");
    if (!cachedMessages) show(randomMessage(messages));
    await storage
      ?.set({ [CACHE_KEY]: { messages, fetchedAt: Date.now() } })
      .catch(() => undefined);
  } catch {
    if (!cachedMessages) show(randomMessage(FALLBACK_MESSAGES));
  }
}
