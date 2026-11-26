import { getOriginalUrl } from "../core/transforms.mjs";
import { PREFERENCES_KEY, normalizePreferences } from "../core/preferences.mjs";

export function registerUnsuspend(api) {
  const restoring = new Set();
  async function restore(tabId, manual = false) {
    if (restoring.has(tabId))
      return { ok: false, error: "此标签正在恢复，请稍后。" };
    restoring.add(tabId);
    try {
      const stored = await api.storage.local.get(PREFERENCES_KEY);
      if (!manual && !normalizePreferences(stored[PREFERENCES_KEY]).autoRestore)
        return { ok: true, skipped: true };
      const tab = await api.tabs.get(tabId);
      if (!tab.active) return { ok: false, error: "请先选中要恢复的标签。" };
      const url = getOriginalUrl(tab.pendingUrl || tab.url);
      if (!url) return { ok: false, error: "当前标签不是可恢复的挂起链接。" };
      await api.tabs.update(tabId, { url });
      return { ok: true, url };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "恢复失败，请重试。",
      };
    } finally {
      restoring.delete(tabId);
    }
  }
  // 必须同步注册，service worker 冷启动时才能捕获唤醒事件。
  api.tabs.onCreated.addListener((tab) => {
    if (tab.active) void restore(tab.id);
  });
  api.tabs.onUpdated.addListener((id, info, tab) => {
    if (tab.active && (info.url || info.status === "loading")) void restore(id);
  });
  api.tabs.onActivated.addListener(({ tabId }) => {
    void restore(tabId);
  });

  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (
      sender.id !== api.runtime.id ||
      sender.tab ||
      !sender.url?.startsWith(api.runtime.getURL(""))
    )
      return;
    if (
      message?.type !== "toolbox.restore-current" ||
      typeof message.requestId !== "string" ||
      !Number.isInteger(message.windowId) ||
      message.windowId < 0
    )
      return;
    (async () => {
      const tabs = await api.tabs.query({
        active: true,
        windowId: message.windowId,
      });
      const result =
        tabs[0]?.id != null
          ? await restore(tabs[0].id, true)
          : { ok: false, error: "未找到当前标签。" };
      respond({ ...result, requestId: message.requestId });
    })().catch(() =>
      respond({
        ok: false,
        error: "无法读取当前标签。",
        requestId: message.requestId,
      }),
    );
    return true;
  });
  return { restore };
}
