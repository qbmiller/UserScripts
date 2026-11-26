<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { queryDns } from "./query.mjs";

const input = ref("");
const loading = ref(false);
const error = ref("");
const result = ref<Awaited<ReturnType<typeof queryDns>> | null>(null);
let controller: AbortController | undefined;

async function run() {
  if (loading.value) return;
  loading.value = true;
  result.value = null;
  error.value = "";
  controller = new AbortController();
  try {
    result.value = await queryDns(input.value, { signal: controller.signal });
  } catch (cause) {
    if (!controller.signal.aborted) {
      error.value =
        cause instanceof Error ? cause.message : "查询失败，请稍后重试。";
    }
  } finally {
    loading.value = false;
  }
}

onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <form @submit.prevent="run">
    <label class="input-label" for="dns-domain">域名</label>
    <input
      id="dns-domain"
      v-model="input"
      class="domain-input"
      placeholder="例如 baidu.com"
      autocomplete="off"
      autocapitalize="off"
      :spellcheck="false"
      :readonly="loading"
      :aria-invalid="!!error"
      :aria-describedby="error ? 'dns-error' : undefined"
    />
    <button
      class="primary-button full-width query-button"
      type="submit"
      :disabled="loading"
      :aria-busy="loading"
    >
      {{ loading ? "正在查询…" : "查询 DNS" }}
    </button>
  </form>
  <p v-if="loading" class="tool-intro" role="status">
    正在查询 A、AAAA、CNAME、MX、TXT 记录…
  </p>
  <p v-if="error" id="dns-error" class="error-message" role="alert">
    {{ error }}
  </p>
  <section v-if="result" aria-label="DNS 查询结果" aria-live="polite">
    <p class="result-domain">{{ result.domain }}</p>
    <div v-for="group in result.groups" :key="group.type" class="record-group">
      <h2>{{ group.type }}</h2>
      <p v-if="group.error" class="error-message">{{ group.error }}</p>
      <p v-else-if="!group.records.length" class="no-record">无此类型记录</p>
      <div v-for="record in group.records" :key="record" class="record-value">
        {{ record }}
      </div>
    </div>
  </section>
  <p class="tool-intro dns-provider">
    通过 Cloudflare DNS-over-HTTPS 查询 A / AAAA / CNAME / MX /
    TXT。仅在点击查询时发送域名；结果以公共 DNS 解析为准。
  </p>
</template>

<style scoped>
.domain-input {
  width: 100%;
  min-width: 0;
  padding: 12px 13px;
  border: 1px solid #dce4d5;
  border-radius: 10px;
  background: #fff;
  color: #3d4a38;
  font:
    13px ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
}
.query-button {
  margin: 16px 0 20px;
}
.result-domain {
  color: #8c9786;
  font-size: 12px;
  overflow-wrap: anywhere;
  margin-bottom: 16px;
}
.record-group {
  margin-bottom: 20px;
}
.record-group h2 {
  color: #7a8874;
  margin-bottom: 8px;
}
.record-value {
  padding: 11px 13px;
  margin-top: 6px;
  border: 1px solid #e1e8db;
  border-radius: 10px;
  background: #fff;
  font:
    12px/1.8 ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.no-record {
  color: #8c9786;
  font-size: 12px;
}
.dns-provider {
  margin-top: 22px;
}
</style>
