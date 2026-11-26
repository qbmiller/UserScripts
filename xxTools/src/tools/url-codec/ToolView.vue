<script setup lang="ts">
import { ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { convertUrl } from "../../core/transforms.mjs";
const input = ref("");
const result = ref("");
const error = ref("");
function run(mode: "encode" | "decode") {
  try {
    result.value = convertUrl(input.value, mode);
    error.value = "";
  } catch {
    result.value = "";
    error.value = "无法解码：请检查百分号后是否为有效的十六进制编码。";
  }
}
</script>
<template>
  <p class="tool-intro">
    对链接参数或任意文字进行编码、解码。使用 URI
    组件编码，保留解码内容里的加号。
  </p>
  <label class="input-label" for="url-input">输入链接或文字</label>
  <textarea
    id="url-input"
    v-model="input"
    spellcheck="false"
    placeholder="粘贴需要转换的内容…"
  />
  <div class="actions">
    <button class="primary-button" @click="run('encode')">编码</button
    ><button class="secondary-button" @click="run('decode')">解码</button
    ><button
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
  </div>
  <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  <ResultPanel :value="result" />
</template>
