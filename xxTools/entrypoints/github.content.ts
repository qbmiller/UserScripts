import { installGitHubSelection } from "../src/tools/github-download/selection.mjs";
import { normalizeGitHubSelectionSettings } from "../src/tools/github-download/settings.mjs";

export default defineContentScript({
  matches: ["https://github.com/*"],
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
        dispose = normalizeGitHubSelectionSettings(settings).enabled
          ? installGitHubSelection({
              sendMessage: (message: object) =>
                chrome.runtime.sendMessage(message),
            })
          : () => {};
        state = normalizeGitHubSelectionSettings(settings).enabled
          ? "ready"
          : "disabled";
        error = "";
      }
    };
    const listener = (message: { type?: string; settings?: object }) => {
      if (
        message?.type === "toolbox.github-selection-update" &&
        message.settings
      )
        update(message.settings);
    };
    // 先监听，避免初始化请求覆盖较新的设置。
    let updated = false;
    const onMessage = (
      message: { type?: string; settings?: object },
      _sender: chrome.runtime.MessageSender,
      respond: (response: object) => void,
    ) => {
      if (message?.type === "toolbox.github-selection-update") updated = true;
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
        type: "toolbox.github-selection-settings",
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
