import { registerUnsuspend } from "../src/features/unsuspend.mjs";
import { registerPreferences } from "../src/features/preferences.mjs";
import { registerGitHubDownload } from "../src/features/github-download.mjs";
import { registerWeChatReader } from "../src/features/wechat-reader.mjs";
import { registerZhihuReader } from "../src/features/zhihu-reader.mjs";
import { registerGitHubSelectionSettings } from "../src/features/github-selection.mjs";

export default defineBackground(() => {
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  registerUnsuspend(chrome);
  registerPreferences(chrome);
  registerGitHubDownload(chrome);
  registerWeChatReader(chrome);
  registerZhihuReader(chrome);
  registerGitHubSelectionSettings(chrome);
  // 图标直接打开原生侧栏，不再承担恢复动作。
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
