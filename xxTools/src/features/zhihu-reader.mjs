import {
  ZHIHU_KEY,
  normalizeZhihuSettings,
} from "../tools/zhihu-toc/settings.mjs";

// 仅返回阅读选项；内容脚本无法读取含 GitHub Token 的 local 存储。
export function registerZhihuReader(api) {
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "toolbox.zhihu-reader-settings") return;
    let allowed = false;
    try {
      allowed = new URL(sender.url).origin === "https://zhuanlan.zhihu.com";
    } catch {}
    if (sender.id !== api.runtime.id || !allowed) return;
    api.storage.local.get(ZHIHU_KEY).then(
      (data) =>
        respond({
          ok: true,
          settings: normalizeZhihuSettings(data[ZHIHU_KEY]),
        }),
      () => respond({ ok: false }),
    );
    return true;
  });
}
