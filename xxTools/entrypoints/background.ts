import { registerUnsuspend } from "../src/features/unsuspend.mjs";
import { registerPreferences } from "../src/features/preferences.mjs";

export default defineBackground(() => {
  registerUnsuspend(chrome);
  registerPreferences(chrome);
  // 图标直接打开原生侧栏，不再承担恢复动作。
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
