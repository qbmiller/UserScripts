<script setup lang="ts">
import { computed, ref } from "vue";
import { convertColor } from "./color.mjs";
import {
  COLOR_HISTORY_KEY,
  normalizeColorHistory,
  rememberColor,
} from "./history.mjs";
const input = ref("#315f45");
const color = ref(convertColor(input.value));
const error = ref("");
const picking = ref(false);
const copied = ref("");
const history = ref<string[]>([]);
const historyError = ref("");
const hasStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;
let historyWrites = (async () => {
  try {
    const saved = hasStorage
      ? (await chrome.storage.local.get(COLOR_HISTORY_KEY))[COLOR_HISTORY_KEY]
      : JSON.parse(localStorage.getItem(COLOR_HISTORY_KEY) || "null");
    history.value = normalizeColorHistory(saved);
  } catch {
    historyError.value = "历史颜色读取失败，本次仍可正常取色。";
  }
})();
function saveHistory(value: string) {
  historyWrites = historyWrites.then(async () => {
    history.value = rememberColor(history.value, value);
    try {
      if (hasStorage)
        await chrome.storage.local.set({ [COLOR_HISTORY_KEY]: history.value });
      else
        localStorage.setItem(COLOR_HISTORY_KEY, JSON.stringify(history.value));
      historyError.value = "";
    } catch {
      historyError.value = "历史颜色保存失败，当前记录仅在本次页面保留。";
    }
  });
}
function useHistory(value: string) {
  input.value = value;
  run();
}
const supportsPicker = typeof window !== "undefined" && "EyeDropper" in window;
const values = computed(() => [
  ["HEX", color.value.hex],
  ["RGB", color.value.rgb],
  ["HSL", color.value.hsl],
]);
function run(remember = true) {
  try {
    color.value = convertColor(input.value);
    error.value = "";
    copied.value = "";
    if (remember) saveHistory(color.value.rgb);
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "颜色转换失败。";
  }
}
function select(event: Event) {
  input.value = (event.target as HTMLInputElement).value;
  run(false);
}
async function pick() {
  if (picking.value) return;
  picking.value = true;
  error.value = "";
  try {
    const Picker = (
      window as unknown as {
        EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    const result = await new Picker().open();
    input.value = result.sRGBHex;
    run();
  } catch (cause) {
    if (!(cause instanceof DOMException && cause.name === "AbortError"))
      error.value = "无法启动屏幕取色，请重试或使用下方颜色选择器。";
  } finally {
    picking.value = false;
  }
}
async function copy(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    copied.value = label;
  } catch {
    error.value = "复制失败，请选择颜色值手动复制。";
  }
}
</script>
<template>
  <p class="tool-intro">
    从屏幕取色，或输入颜色转换 HEX、RGB、HSL。全部在本地处理。
  </p>
  <button
    class="primary-button full-width"
    :disabled="!supportsPicker || picking"
    @click="pick"
  >
    {{ picking ? "请点击屏幕上的颜色（Esc 取消）" : "屏幕取色" }}
  </button>
  <p v-if="!supportsPicker" class="tool-intro">
    当前环境不支持屏幕取色，可使用颜色选择器或手动输入。
  </p>
  <form class="color-form" @submit.prevent="run()">
    <label class="input-label" for="color-input">颜色值</label>
    <div class="color-inputs">
      <input
        type="color"
        :value="color.hex"
        aria-label="选择颜色"
        @input="select"
        @change="run()"
      /><input
        id="color-input"
        v-model="input"
        placeholder="#315f45 / rgb(...) / hsl(...)"
      />
    </div>
    <button class="secondary-button" type="submit">转换颜色</button>
  </form>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <div
    class="color-preview"
    :style="{ backgroundColor: color.rgb }"
    aria-label="颜色预览"
  ></div>
  <p v-if="color.alpha < 1" class="tool-intro">
    HEX 显示不含透明度的色值，RGB/HSL 保留透明度。
  </p>
  <div v-for="[label, value] in values" :key="label" class="color-row">
    <label :for="`color-${label}`">{{ label }}</label><input
      :id="`color-${label}`"
      :value="value"
      readonly
    /><button class="text-button" @click="copy(label, value)">
      {{ copied === label ? "已复制" : "复制" }}
    </button>
  </div>
  <section class="color-history" aria-label="历史颜色">
    <div class="history-heading">
      <h2>历史颜色</h2>
      <span>最近 {{ history.length }} / 10 个</span>
    </div>
    <p v-if="!history.length" class="history-empty">
      取色或转换颜色后，会自动保存在这里。
    </p>
    <div v-else class="history-grid">
      <button
        v-for="value in history"
        :key="value"
        class="history-item"
        :aria-label="`使用历史颜色 ${value}`"
        :title="value"
        @click="useHistory(value)"
      >
        <span class="history-swatch" :style="{ backgroundColor: value }"></span>
        <span
          >{{ convertColor(value).hex
          }}{{
            convertColor(value).alpha < 1
              ? ` · ${Math.round(convertColor(value).alpha * 100)}%`
              : ""
          }}</span
        >
      </button>
    </div>
    <p v-if="historyError" class="error-message" role="status">
      {{ historyError }}
    </p>
  </section>
</template>
<style scoped>
.color-history {
  margin-top: 28px;
  border-top: 1px solid #e1e8db;
  padding-top: 20px;
}
.history-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.history-heading span,
.history-empty {
  font-size: 11px;
  color: #8c9786;
}
.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  background: white;
  text-align: left;
  font-size: 11px;
}
.history-item:hover {
  background: #edf2e6;
}
.history-swatch {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 1px solid #dce4d5;
  border-radius: 6px;
}
.color-form {
  margin: 20px 0;
}
.color-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
input {
  min-width: 0;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  padding: 10px;
  background: white;
  font: inherit;
}
.color-inputs input:last-child {
  flex: 1;
}
input[type="color"] {
  width: 48px;
  height: 42px;
  padding: 3px;
}
.color-preview {
  height: 100px;
  border: 1px solid #dce4d5;
  border-radius: 12px;
  margin: 20px 0;
}
.color-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0;
  font-size: 12px;
}
.color-row label {
  width: 32px;
}
.color-row input {
  flex: 1;
  width: 0;
}
</style>
