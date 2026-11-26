<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { dateToTimestamp, parseTimestamp, relativeTime } from "./convert.mjs";

const now = ref(Date.now());
const input = ref(String(Math.floor(now.value / 1000)));
const unit = ref("auto");
const dateInput = ref("");
const dateResult = ref("");
const dateError = ref("");
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 1000);
});
onUnmounted(() => clearInterval(timer));

const parsed = computed(() => {
  if (!input.value.trim()) return { result: null, error: "" };
  try {
    return { result: parseTimestamp(input.value, unit.value), error: "" };
  } catch (cause) {
    return { result: null, error: cause instanceof Error ? cause.message : "转换失败。" };
  }
});
const formatted = computed(() => {
  const result = parsed.value.result;
  if (!result) return "";
  return `本地：${result.date.toLocaleString("zh-CN", { hour12: false })}\nUTC ：${result.date.toUTCString()}\nISO ：${result.date.toISOString()}`;
});
const relative = computed(() => parsed.value.result
  ? relativeTime(parsed.value.result.date.getTime(), now.value) : "");

function useNow() {
  now.value = Date.now();
  input.value = String(unit.value === "milliseconds" ? now.value : Math.floor(now.value / 1000));
}
function convertDate() {
  try {
    const result = dateToTimestamp(dateInput.value);
    dateResult.value = `秒：${result.seconds}\n毫秒：${result.milliseconds}`;
    dateError.value = "";
  } catch (cause) {
    dateResult.value = "";
    dateError.value = cause instanceof Error ? cause.message : "转换失败。";
  }
}
</script>

<template>
  <section class="timestamp-tool">
    <div class="current-time">
      <span>当前时间戳（秒）</span>
      <strong>{{ Math.floor(now / 1000) }}</strong>
      <button class="text-button" @click="useNow">使用当前时间</button>
    </div>

    <label class="input-label" for="timestamp-input">时间戳（秒或毫秒）</label>
    <div class="timestamp-input-row">
      <input id="timestamp-input" v-model="input" type="text" inputmode="decimal" spellcheck="false" placeholder="输入 Unix 时间戳" :aria-invalid="!!parsed.error" />
      <select v-model="unit" aria-label="时间戳单位">
        <option value="auto">自动识别</option>
        <option value="seconds">秒</option>
        <option value="milliseconds">毫秒</option>
      </select>
    </div>
    <p class="timestamp-hint">自动识别：绝对值小于 1000 亿按秒，否则按毫秒；早期毫秒值可手动选择单位。</p>
    <p v-if="parsed.error" class="error-message" role="alert">{{ parsed.error }}</p>
    <template v-if="parsed.result">
      <ResultPanel :value="formatted" :label="`转换结果 · ${parsed.result.unit === 'seconds' ? '秒' : '毫秒'}`" />
      <p class="timestamp-relative">{{ relative }}</p>
    </template>

    <form class="date-form" @submit.prevent="convertDate">
      <label class="input-label" for="timestamp-date">从日期转换（本地时间）</label>
      <p class="timestamp-hint">当前时区：{{ timezone }}</p>
      <div class="timestamp-input-row">
        <input id="timestamp-date" v-model="dateInput" type="datetime-local" step="0.001" @input="dateResult = ''; dateError = ''" />
        <button class="primary-button" type="submit">转换</button>
      </div>
      <p v-if="dateError" class="error-message" role="alert">{{ dateError }}</p>
    </form>
    <ResultPanel v-if="dateResult" :value="dateResult" label="时间戳结果" />
  </section>
</template>

<style scoped>
.current-time {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 16px;
  margin-bottom: 22px;
  border: 1px solid #e0e5dc;
  border-radius: 12px;
  background: #f8faf6;
}
.current-time span, .timestamp-hint, .timestamp-relative { color: #7a847b; }
.current-time strong { margin-left: auto; font-family: monospace; font-size: 18px; }
.timestamp-input-row { display: flex; gap: 8px; }
.timestamp-input-row input {
  flex: 1;
  width: 0;
  min-width: 0;
  padding: 12px;
  border: 1px solid #dce3d7;
  border-radius: 10px;
  background: #fff;
  color: inherit;
  font-family: monospace;
}
select {
  max-width: 110px;
  border: 1px solid #dce3d7;
  border-radius: 10px;
  background: #fff;
  color: inherit;
  padding: 0 8px;
  font: inherit;
}
select:focus-visible { outline: 2px solid #428765; outline-offset: 3px; }
.timestamp-hint { font-size: 11px; margin: 7px 0 12px; }
.timestamp-relative { font-size: 12px; margin-top: 6px; }
.date-form { margin-top: 26px; }
.date-form .primary-button { flex-shrink: 0; }
.timestamp-tool :deep(.result-panel textarea) { min-height: 114px; overflow-wrap: anywhere; }
</style>
