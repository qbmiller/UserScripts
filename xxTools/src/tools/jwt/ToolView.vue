<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { parseJwt, jwtValidity } from "./parse.mjs";
const input = ref("");
const error = ref("");
const result = ref<ReturnType<typeof parseJwt> | null>(null);
const now = ref(Date.now());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});
onUnmounted(() => clearInterval(timer));
const status = computed(() =>
  result.value ? jwtValidity(result.value.payload, now.value) : "",
);
const times = computed(() =>
  result.value
    ? [
        ["iat", "签发时间"],
        ["nbf", "生效时间"],
        ["exp", "过期时间"],
      ]
        .filter(([key]) => result.value!.payload[key] !== undefined)
        .map(([key, label]) => ({
          key,
          label,
          value: result.value!.payload[key],
          date: new Date(result.value!.payload[key] * 1000).toLocaleString(
            "zh-CN",
          ),
        }))
    : [],
);
function run() {
  try {
    result.value = parseJwt(input.value);
    now.value = Date.now();
    error.value = "";
  } catch (cause) {
    result.value = null;
    error.value = cause instanceof Error ? cause.message : "解析失败。";
  }
}
</script>
<template>
  <p class="tool-intro">
    本地解析 JWT 的 Header、Payload
    与时间信息。仅解码，不验证签名；时间状态不代表令牌可信或可用。
  </p>
  <label class="input-label" for="jwt-input">JWT</label>
  <textarea
    id="jwt-input"
    v-model="input"
    spellcheck="false"
    placeholder="eyJ… . eyJ… . 签名"
  />
  <div class="actions">
    <button class="primary-button" @click="run">解析 JWT</button>
    <button
      class="text-button"
      @click="
        input = '';
        result = null;
        error = '';
      "
    >
      清空
    </button>
  </div>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <section v-if="result" aria-label="JWT 解析结果" aria-live="polite">
    <p
      :class="
        status === '已过期' || status === '尚未生效'
          ? 'error-message'
          : 'success-message'
      "
    >
      时间状态：{{ status }}（未验证签名）
    </p>
    <dl v-if="times.length" class="jwt-times">
      <template v-for="time in times" :key="time.key">
        <dt>{{ time.label }}（{{ time.key }}）</dt>
        <dd>
          {{ time.date }}<br /><small>Unix 秒：{{ time.value }}</small>
        </dd>
      </template>
    </dl>
    <ResultPanel
      :value="JSON.stringify(result.header, null, 2)"
      label="Header"
    />
    <ResultPanel
      :value="JSON.stringify(result.payload, null, 2)"
      label="Payload"
    />
  </section>
</template>
<style scoped>
.jwt-times {
  font-size: 12px;
  overflow-wrap: anywhere;
}
.jwt-times dt {
  margin-top: 12px;
  color: #7a8874;
}
.jwt-times dd {
  margin: 4px 0 0;
}
.jwt-times small {
  color: #8c9786;
}
</style>
