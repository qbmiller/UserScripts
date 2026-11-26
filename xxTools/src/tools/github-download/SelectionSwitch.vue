<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import {
  GITHUB_SELECTION_KEY,
  normalizeGitHubSelectionSettings,
} from "./settings.mjs";
const enabled = ref(true);
const ready = ref(false);
const busy = ref(false);
const error = ref("");
function changed(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area === "local" && changes[GITHUB_SELECTION_KEY])
    enabled.value = normalizeGitHubSelectionSettings(
      changes[GITHUB_SELECTION_KEY].newValue,
    ).enabled;
}
onMounted(async () => {
  try {
    chrome.storage.onChanged.addListener(changed);
    const data = await chrome.storage.local.get(GITHUB_SELECTION_KEY);
    enabled.value = normalizeGitHubSelectionSettings(
      data[GITHUB_SELECTION_KEY],
    ).enabled;
    ready.value = true;
  } catch {
    error.value = "无法读取设置，请在已安装扩展的侧栏中使用。";
  }
});
onUnmounted(() => {
  if (typeof chrome !== "undefined")
    chrome.storage?.onChanged.removeListener(changed);
});
async function save(event: Event) {
  const previous = enabled.value;
  const settings = { enabled: (event.target as HTMLInputElement).checked };
  busy.value = true;
  error.value = "";
  try {
    await chrome.storage.local.set({ [GITHUB_SELECTION_KEY]: settings });
    enabled.value = settings.enabled;
  } catch {
    enabled.value = previous;
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
            settings,
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
      :checked="enabled"
      :disabled="!ready || busy"
      @change="save"
    />
  </div>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
</template>
