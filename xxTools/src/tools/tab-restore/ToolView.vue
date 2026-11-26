<script setup lang="ts">
import { computed, ref } from "vue";
import { getOriginalUrl } from "../../core/transforms.mjs";
import ResultPanel from "../../components/ResultPanel.vue";
const input = ref("");
const target = computed(() => getOriginalUrl(input.value.trim()) || "");
const busy = ref(false);
const message = ref("");
const error = ref("");
async function restoreCurrent() {
  busy.value = true;
  error.value = "";
  message.value = "";
  try {
    if (typeof chrome === "undefined" || !chrome.runtime?.id)
      throw new Error("请在已安装扩展的侧边栏中使用此功能。");
    const currentWindow = await chrome.windows.getCurrent();
    const result = await chrome.runtime.sendMessage({
      type: "toolbox.restore-current",
      requestId: crypto.randomUUID(),
      windowId: currentWindow.id,
    });
    if (!result?.ok) throw new Error(result?.error || "恢复失败，请重试。");
    message.value = "已恢复当前标签。";
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "恢复失败。";
  } finally {
    busy.value = false;
  }
}
async function openTarget() {
  if (!target.value) return;
  try {
    await chrome.tabs.create({ url: target.value });
    error.value = "";
  } catch {
    error.value = "打开失败，请复制下方网址手动打开。";
  }
}
</script>
<template>
  <div class="callout">
    <span class="callout-icon">↗</span>
    <div>
      <strong>只找回眼前这个标签</strong>
      <p>其他后台标签继续保持挂起，不会一起加载。</p>
    </div>
  </div>
  <button
    class="primary-button full-width"
    :disabled="busy"
    @click="restoreCurrent"
  >
    {{ busy ? "正在恢复…" : "恢复当前标签" }}
  </button>
  <p v-if="message" role="status" class="success-message">{{ message }}</p>
  <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  <div class="section-divider"></div>
  <label for="suspended-input" class="input-label">或粘贴一个挂起链接</label>
  <textarea
    id="suspended-input"
    v-model="input"
    spellcheck="false"
    placeholder="chrome-extension://…/suspended.html#…&uri=https://…"
  />
  <p v-if="input.trim() && !target" role="alert" class="error-message">
    未找到有效的原始网址，请粘贴包含 uri= 的完整挂起链接。
  </p>
  <ResultPanel :value="target" label="原始网址" />
  <button
    class="secondary-button full-width"
    :disabled="!target"
    @click="openTarget"
  >
    在新标签中打开原网址 ↗
  </button>
</template>
