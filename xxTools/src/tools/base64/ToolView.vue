<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { methods, convertEncoding } from "./methods.mjs";
const input = ref("");
const result = ref("");
const error = ref("");
const method = ref("base64");
const urlSafe = ref(false);
const base = ref("58");
const current = computed(() =>
  methods.find((item) => item.id === method.value)!,
);
const showUrlSafe = computed(
  () =>
    method.value === "base64" ||
    (method.value === "base" && base.value === "64"),
);
watch([method, base, urlSafe], () => {
  result.value = "";
  error.value = "";
});
function run(decode: boolean) {
  try {
    result.value = convertEncoding(input.value, method.value, decode, {
      urlSafe: urlSafe.value,
      base: base.value,
    });
    error.value = "";
  } catch (cause) {
    result.value = "";
    error.value = cause instanceof Error ? cause.message : "转换失败。";
  }
}
</script>
<template>
  <p class="tool-intro">选择编解码方式，支持中文和表情，全部在本地处理。</p>
  <div class="encoding-methods" role="group" aria-label="编解码方式">
    <button
      v-for="item in methods"
      :key="item.id"
      :class="{ selected: method === item.id }"
      :aria-pressed="method === item.id"
      @click="method = item.id"
    >
      {{ item.label }}
    </button>
  </div>
  <p class="tool-intro method-hint">{{ current.hint }}</p>
  <label v-if="method === 'base'" class="base-select"
    >BASE 类型
    <select v-model="base" aria-label="BASE 类型">
      <option
        v-for="radix in ['16', '32', '58', '62', '64']"
        :key="radix"
        :value="radix"
      >
        Base{{ radix }}
      </option>
    </select>
  </label>
  <p
    v-if="method === 'base' && (base === '58' || base === '62')"
    class="tool-intro"
  >
    {{
      base === "58"
        ? "Base58 使用 Bitcoin 字符表，不含 0、O、I、l。"
        : "Base62 字符表：0–9、A–Z、a–z（顺序固定）。"
    }}
  </p>
  <label class="input-label" for="base64-input">输入文本或编码内容</label>
  <textarea
    id="base64-input"
    v-model="input"
    spellcheck="false"
    placeholder="粘贴需要编码或解码的内容…"
  />
  <label v-if="showUrlSafe" class="base64-option"
    ><input v-model="urlSafe" type="checkbox" /> 编码为 Base64URL（省略末尾
    =）</label
  >
  <div class="actions encoding-actions">
    <button class="primary-button" @click="run(false)">编码</button>
    <button class="secondary-button" @click="run(true)">解码</button>
    <button
      class="text-button"
      :disabled="!result"
      @click="
        input = result;
        result = '';
        error = '';
      "
    >
      结果作输入
    </button>
    <button
      class="text-button"
      @click="
        input = '';
        result = '';
        error = '';
      "
    >
      清空
    </button>
  </div>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <ResultPanel :value="result" />
</template>
<style scoped>
.encoding-methods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  margin-bottom: 14px;
}
.encoding-methods button {
  padding: 10px 5px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  background: #fff;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.encoding-methods button.selected {
  background: #315f45;
  border-color: #315f45;
  color: #fff;
}
.encoding-methods button:hover:not(.selected) {
  background: #edf2e6;
}
.method-hint {
  min-height: 44px;
}
.encoding-actions {
  flex-wrap: wrap;
}
.base-select {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  margin-bottom: 16px;
}
.base-select select {
  padding: 8px 12px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  background: #fff;
  color: inherit;
  font: inherit;
}
.base-select select:focus-visible {
  outline: 2px solid #428765;
  outline-offset: 3px;
}
.base64-option {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #637257;
}
</style>
