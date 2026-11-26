import { installZhihuToc } from "../src/tools/zhihu-toc/toc.mjs";
import { normalizeZhihuSettings } from "../src/tools/zhihu-toc/settings.mjs";
import { hasNativeZhihuToc } from "../src/tools/zhihu-toc/native-toc.mjs";

export default defineContentScript({
  matches: [
    "https://zhuanlan.zhihu.com/p/*",
    "https://zhuanlan.zhihu.com/*/p/*",
  ],
  runAt: "document_idle",
  async main(ctx) {
    let stopped = false;
    let state = "loading";
    let error = "";
    let dispose = () => {};
    ctx.onInvalidated(() => {
      stopped = true;
      dispose();
    });
    const update = (settings: object) => {
      dispose();
      if (!stopped) {
        dispose = normalizeZhihuSettings(settings).enabled
          ? installZhihuToc()
          : () => {};
        state = normalizeZhihuSettings(settings).enabled ? "ready" : "disabled";
        error = "";
      }
    };
    const listener = (message: { type?: string; settings?: object }) => {
      if (message?.type === "toolbox.zhihu-reader-update" && message.settings)
        update(message.settings);
    };
    // 先监听，避免初始化请求覆盖较新的设置。
    let updated = false;
    const onMessage = (
      message: { type?: string; settings?: object },
      _sender: chrome.runtime.MessageSender,
      respond: (response: object) => void,
    ) => {
      if (message?.type === "toolbox.zhihu-reader-status") {
        const host = document.getElementById("zhihu-left-toc-panel");
        respond({
          state,
          error,
          nativeToc: hasNativeZhihuToc(),
          article: !!document.querySelector(
            ".Post-RichText, article .RichText, article",
          ),
          installed: !!host,
          headings: host?.querySelectorAll(".zlt-link").length || 0,
        });
        return;
      }
      if (message?.type === "toolbox.zhihu-reader-update") updated = true;
      try {
        listener(message);
      } catch (cause) {
        state = "error";
        error = cause instanceof Error ? cause.message : "阅读增强启动失败";
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    ctx.onInvalidated(() => chrome.runtime.onMessage.removeListener(onMessage));
    try {
      const result = await chrome.runtime.sendMessage({
        type: "toolbox.zhihu-reader-settings",
      });
      if (!updated) {
        if (!result?.ok)
          throw new Error("无法读取阅读设置，请重新加载扩展后刷新文章。");
        update(result.settings);
      }
    } catch (cause) {
      if (!updated) {
        state = "error";
        error = cause instanceof Error ? cause.message : "阅读增强启动失败";
      }
    }
  },
});
