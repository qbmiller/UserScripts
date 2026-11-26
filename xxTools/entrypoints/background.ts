import { registerUnsuspend } from "../src/features/unsuspend.mjs";
import { registerPreferences } from "../src/features/preferences.mjs";
import { registerGitHubDownload } from "../src/features/github-download.mjs";

export default defineBackground(() => {
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  registerUnsuspend(chrome);
  registerPreferences(chrome);
  registerGitHubDownload(chrome);
  // 图标直接打开原生侧栏，不再承担恢复动作。
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
