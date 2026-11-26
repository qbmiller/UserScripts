<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  GITHUB_SELECTION_KEY,
  normalizeGitHubSelectionSettings,
} from "./settings.mjs";
const settings = ref(normalizeGitHubSelectionSettings(null));
const ready = ref(false);
const busy = ref(false);
const error = ref("");
function changed(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area === "local" && changes[GITHUB_SELECTION_KEY])
    settings.value = normalizeGitHubSelectionSettings(
      changes[GITHUB_SELECTION_KEY].newValue,
    );
}
onMounted(async () => {
  try {
    chrome.storage.onChanged.addListener(changed);
    const data = await chrome.storage.local.get(GITHUB_SELECTION_KEY);
    settings.value = normalizeGitHubSelectionSettings(
      data[GITHUB_SELECTION_KEY],
    );
    ready.value = true;
  } catch {
    error.value = "无法读取设置，请在已安装扩展的侧栏中使用。";
  }
});
onUnmounted(() => {
  if (typeof chrome !== "undefined")
    chrome.storage?.onChanged.removeListener(changed);
});
async function save(key: keyof typeof settings.value, event: Event) {
  const input = event.target as HTMLInputElement;
  const next = { ...settings.value, [key]: input.checked };
  busy.value = true;
  error.value = "";
  try {
    await chrome.storage.local.set({ [GITHUB_SELECTION_KEY]: next });
    settings.value = next;
  } catch {
    input.checked = settings.value[key];
    error.value = "保存失败，请重试。";
    busy.value = false;
    return;
  }
  try {
    const tabs = await chrome.tabs.query({ url: "https://github.com/*" });
    await Promise.allSettled(
      tabs
        .filter((tab) => tab.id !== undefined)
        .map((tab) =>
          chrome.tabs.sendMessage(tab.id!, {
            type: "toolbox.github-selection-update",
            settings: next,
          }),
        ),
    );
  } catch {
    error.value = "设置已保存，请刷新 GitHub 页面使其生效。";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div class="setting-card">
    <label for="github-selection-enabled">
      <strong>启用 GitHub 勾选下载</strong>
      <small
        >关闭后移除网页上的勾选框和下载浮栏。更新扩展后请刷新仓库页。</small
      >
    </label>
    <input
      id="github-selection-enabled"
      type="checkbox"
      role="switch"
      :checked="settings.enabled"
      :disabled="!ready || busy"
      @change="save('enabled', $event)"
    />
  </div>
  <div class="setting-card">
    <label for="github-selection-only-checked">
      <strong>仅在选中项目时显示浮窗</strong>
      <small
        >勾选文件后显示下载浮窗，清空选择后隐藏。关闭此项后浮窗常驻。</small
      >
    </label>
    <input
      id="github-selection-only-checked"
      type="checkbox"
      role="switch"
      :checked="settings.onlyWhenSelected"
      :disabled="!ready || busy"
      @change="save('onlyWhenSelected', $event)"
    />
  </div>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
</template>
