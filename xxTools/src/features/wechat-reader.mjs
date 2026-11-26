import {
  READER_KEY,
  normalizeReaderSettings,
} from "../tools/wechat-reader/settings.mjs";

// 仅返回阅读选项；内容脚本无法读取含 GitHub Token 的 local 存储。
export function registerWeChatReader(api) {
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "toolbox.wechat-reader-settings") return;
    let allowed = false;
    try {
      allowed = new URL(sender.url).origin === "https://mp.weixin.qq.com";
    } catch {}
    if (sender.id !== api.runtime.id || !allowed) return;
    api.storage.local.get(READER_KEY).then(
      (data) =>
        respond({
          ok: true,
          settings: normalizeReaderSettings(data[READER_KEY]),
        }),
      () => respond({ ok: false }),
    );
    return true;
  });
}
