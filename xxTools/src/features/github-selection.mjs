import {
  GITHUB_SELECTION_KEY,
  normalizeGitHubSelectionSettings,
} from "../tools/github-download/settings.mjs";

// 仅返回阅读选项；内容脚本无法读取含 GitHub Token 的 local 存储。
export function registerGitHubSelectionSettings(api) {
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "toolbox.github-selection-settings") return;
    let allowed = false;
    try {
      allowed = new URL(sender.url).origin === "https://github.com";
    } catch {}
    if (sender.id !== api.runtime.id || !allowed) return;
    api.storage.local.get(GITHUB_SELECTION_KEY).then(
      (data) =>
        respond({
          ok: true,
          settings: normalizeGitHubSelectionSettings(
            data[GITHUB_SELECTION_KEY],
          ),
        }),
      () => respond({ ok: false }),
    );
    return true;
  });
}
