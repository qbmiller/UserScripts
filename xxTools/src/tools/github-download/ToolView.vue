<script setup lang="ts">
import { ref } from "vue";
import TokenSettings from "./TokenSettings.vue";
import SelectionSwitch from "./SelectionSwitch.vue";
const error = ref("");
async function openGitHub() {
  try {
    await chrome.tabs.create({ url: "https://github.com/" });
  } catch {
    error.value = "请在浏览器中打开 github.com 上的仓库页面。";
  }
}
</script>
<template>
  <SelectionSwitch />
  <div class="callout">
    <span class="callout-icon">↓</span>
    <div>
      <strong>只下载你需要的那一部分</strong>
      <p>在 GitHub 仓库中勾选文件或文件夹，打包为 ZIP，无需克隆整个仓库。</p>
    </div>
  </div>
  <ol class="github-instructions">
    <li>打开或刷新一个 GitHub 仓库文件列表。</li>
    <li>勾选文件或文件夹图标左侧的复选框，可多选，也可全选当前页。</li>
    <li>点击左下方的「下载 ZIP」，在下载任务页查看进度。</li>
  </ol>
  <p class="tool-intro">
    支持子目录与单文件页，ZIP
    保留仓库内的目录结构。切换目录或分支会清空当前选择，避免混入其他路径。
  </p>
  <button class="secondary-button full-width" @click="openGitHub">
    打开 GitHub ↗
  </button>
  <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  <TokenSettings />
</template>
<style scoped>
.github-instructions {
  padding-left: 20px;
  color: #607354;
  font-size: 12px;
  line-height: 2.2;
  margin: 22px 0;
}
</style>
