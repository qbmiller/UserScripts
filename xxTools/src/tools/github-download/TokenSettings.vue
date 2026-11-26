<script setup lang="ts">
import { onMounted, ref } from "vue";
import { TOKEN_KEY } from "./engine.mjs";
const token = ref("");
const status = ref("");
const saved = ref(false);
onMounted(async () => {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;
  try {
    const data = await chrome.storage.local.get(TOKEN_KEY);
    saved.value = !!data[TOKEN_KEY];
  } catch {
    status.value = "无法读取 Token 设置，请重试。";
  }
});
async function save() {
  try {
    const value = token.value.trim();
    if (!value || /\s/.test(value))
      throw new Error("请输入有效的 Token，不要包含空白字符。");
    await chrome.storage.local.set({ [TOKEN_KEY]: value });
    token.value = "";
    saved.value = true;
    status.value = "已保存，仅用于访问 GitHub API。";
  } catch (error) {
    status.value =
      error instanceof Error ? error.message : "保存失败，请在扩展中操作。";
  }
}
async function remove() {
  try {
    await chrome.storage.local.remove(TOKEN_KEY);
    token.value = "";
    saved.value = false;
    status.value = "已删除 Token。";
  } catch {
    status.value = "删除失败，请重试。";
  }
}
</script>
<template>
  <details class="github-token-settings">
    <summary>GitHub Token（可选）<span v-if="saved"> · 已设置</span></summary>
    <p>
      公开仓库通常无需设置。私有仓库需有该仓库 Contents 读取权限的
      Token，登录网页本身不代表 API 已获授权。
    </p>
    <p>Token 只保存在扩展本地，不进入同步存储，不传给网页或第三方。</p>
    <a
      class="secondary-button github-token-link"
      href="https://github.com/settings/personal-access-tokens/new"
      target="_blank"
      rel="noopener noreferrer"
      >创建 GitHub Token ↗</a
    >
    <label for="github-token">Personal access token</label
    ><input
      id="github-token"
      v-model="token"
      type="password"
      autocomplete="off"
      placeholder="输入新的 Token，已保存的不会回显"
    />
    <div class="actions">
      <button class="secondary-button" @click="save">保存 Token</button
      ><button class="text-button" :disabled="!saved" @click="remove">
        删除已保存 Token
      </button>
    </div>
    <p v-if="status" role="status">{{ status }}</p>
  </details>
</template>
<style scoped>
.github-token-settings {
  border: 1px solid #dce4d5;
  border-radius: 10px;
  padding: 15px;
  margin-top: 24px;
  background: #fff;
  font-size: 12px;
}
.github-token-settings summary {
  cursor: pointer;
  font-weight: 600;
}
.github-token-settings p {
  color: #7b8973;
  line-height: 1.8;
  margin: 12px 0;
}
.github-token-settings label {
  display: block;
  margin-top: 15px;
}
.github-token-settings input {
  width: 100%;
  padding: 11px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  margin-top: 8px;
  background: #fafbf8;
}
.actions {
  margin-bottom: 0;
}
.github-token-link {
  display: inline-block;
  text-decoration: none;
}
</style>
