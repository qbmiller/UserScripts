<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { fetchRequestHeaders } from "./request.mjs";

const loading = ref(false);
const headers = ref<[string, string][]>([]);
const error = ref("");
let controller: AbortController | undefined;

async function run() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";
  headers.value = [];
  controller = new AbortController();
  try {
    headers.value = await fetchRequestHeaders({ signal: controller.signal });
  } catch (cause) {
    if (controller.signal.aborted) return;
    error.value =
      cause instanceof Error && cause.name === "TimeoutError"
        ? "请求超时，请检查网络后重试。"
        : cause instanceof TypeError
          ? "无法连接 httpbin.org，请检查网络或扩展的网站访问权限后重试。"
          : cause instanceof Error
            ? cause.message
            : "查询失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <p class="tool-intro">
    向 httpbin.org 发起请求，回显本次请求实际发送的 HTTP
    请求头（User-Agent、Accept、编码等）。
    结果仅代表这次扩展请求，不代表当前网页的请求。
  </p>
  <button
    class="primary-button full-width"
    :disabled="loading"
    :aria-busy="loading"
    @click="run"
  >
    {{ loading ? "正在获取请求头…" : "查看我的请求头" }}
  </button>
  <p v-if="loading" class="request-status" role="status">
    正在等待 httpbin.org 响应…
  </p>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <div
    v-if="headers.length"
    class="headers-result"
    role="region"
    aria-label="请求头结果"
    aria-live="polite"
  >
    <div v-for="[name, value] in headers" :key="name" class="header-row">
      <span class="header-name">{{ name }}</span><span>: {{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
.request-status {
  margin-top: 12px;
  color: #8c9786;
  font-size: 12px;
}
.headers-result {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid #e1e8db;
  border-radius: 10px;
  background: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.header-row + .header-row {
  margin-top: 7px;
}
.header-name {
  color: #477758;
}
</style>
