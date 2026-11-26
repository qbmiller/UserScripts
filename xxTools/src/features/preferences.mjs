import {
  applyPreferenceChange,
  isPreferenceChange,
  PREFERENCES_KEY,
} from "../core/preferences.mjs";

export function registerPreferences(api) {
  let writes = Promise.resolve();
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (
      sender.id !== api.runtime.id ||
      sender.tab ||
      !sender.url?.startsWith(api.runtime.getURL(""))
    )
      return;
    if (
      message?.type !== "toolbox.preferences.update" ||
      !isPreferenceChange(message.change)
    )
      return;
    // 所有侧栏窗口的操作在后台串行合并，不覆盖其他窗口或字段。
    writes = writes
      .catch(() => {})
      .then(async () => {
        try {
          const stored = await api.storage.local.get(PREFERENCES_KEY);
          const next = applyPreferenceChange(
            stored[PREFERENCES_KEY],
            message.change,
          );
          await api.storage.local.set({ [PREFERENCES_KEY]: next });
          respond({ ok: true });
        } catch {
          respond({ ok: false, error: "设置保存失败。" });
        }
      });
    return true;
  });
}
