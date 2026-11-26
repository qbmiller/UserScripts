<script setup lang="ts">
import { ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { formatJson } from "../../core/transforms.mjs";
const input = ref("");
const result = ref("");
const error = ref("");
function run(compact: boolean) {
  try {
    result.value = formatJson(input.value, compact);
    error.value = "";
  } catch (cause) {
    result.value = "";
    error.value =
      cause instanceof Error ? cause.message : "请输入有效的 JSON。";
  }
}
</script>
<template>
  <p class="tool-intro">
    整理接口数据、检查语法，或压缩成一行。所有处理都在本地完成。
  </p>
  <div class="field-heading">
    <label for="json-input">输入 JSON</label
    ><button
      class="text-button"
      @click="
        input =
          '{&quot;message&quot;: &quot;你好，世界&quot;, &quot;ready&quot;: true}';
        error = '';
      "
    >
      试试示例
    </button>
  </div>
  <textarea
    id="json-input"
    v-model="input"
    spellcheck="false"
    placeholder='粘贴 JSON，例如 {"hello": "world"}'
  />
  <div class="actions">
    <button class="primary-button" @click="run(false)">格式化</button
    ><button class="secondary-button" @click="run(true)">压缩</button
    ><button
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
  <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  <ResultPanel :value="result" />
</template>
