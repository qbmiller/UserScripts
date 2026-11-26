import { registerUnsuspend } from "../src/features/unsuspend.mjs";
import { registerPreferences } from "../src/features/preferences.mjs";
import { registerGitHubDownload } from "../src/features/github-download.mjs";
import { registerWeChatReader } from "../src/features/wechat-reader.mjs";
import { registerZhihuReader } from "../src/features/zhihu-reader.mjs";
import { registerGitHubSelectionSettings } from "../src/features/github-selection.mjs";
import { registerBookmarkTrash } from "../src/features/bookmark-trash.mjs";
import { registerLocalBuildReload } from "../src/features/local-build-reload.mjs";

export default defineBackground(() => {
  if (import.meta.env.VITE_XXTOOLS_LOCAL_BUILD_ID) {
    registerLocalBuildReload(chrome, import.meta.env.VITE_XXTOOLS_LOCAL_BUILD_ID);
  }
  void chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  registerUnsuspend(chrome);
  registerPreferences(chrome);
  registerGitHubDownload(chrome);
  registerWeChatReader(chrome);
  registerZhihuReader(chrome);
  registerGitHubSelectionSettings(chrome);
  registerBookmarkTrash(chrome);
  // 图标直接打开原生侧栏，不再承担恢复动作。
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
