<script setup lang="ts">
import { ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { encodeBase64, decodeBase64 } from "./codec.mjs";
const input = ref("");
const result = ref("");
const error = ref("");
const urlSafe = ref(false);
function run(decode: boolean) {
  try {
    result.value = decode
      ? decodeBase64(input.value)
      : encodeBase64(input.value, urlSafe.value);
    error.value = "";
  } catch (cause) {
    result.value = "";
    error.value = cause instanceof Error ? cause.message : "转换失败。";
  }
}
</script>
<template>
  <p class="tool-intro">
    UTF-8 文本与 Base64 互转，支持中文和表情。解码自动兼容
    Base64URL；全部在本地处理。
  </p>
  <label class="input-label" for="base64-input">输入文本或 Base64</label>
  <textarea
    id="base64-input"
    v-model="input"
    spellcheck="false"
    placeholder="粘贴需要编码或解码的内容…"
  />
  <label class="base64-option"
    ><input v-model="urlSafe" type="checkbox" /> 编码为 Base64URL（省略末尾
    =）</label
  >
  <div class="actions">
    <button class="primary-button" @click="run(false)">编码</button>
    <button class="secondary-button" @click="run(true)">解码</button>
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
.base64-option {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #637257;
}
</style>
