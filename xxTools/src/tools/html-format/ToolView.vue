<script setup lang="ts">
import { reactive, ref } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { transformCode } from "./format.mjs";
const languages = ["html", "css", "js"] as const;
const language = ref<(typeof languages)[number]>("html");
const entries = reactive(
  Object.fromEntries(
    languages.map((key) => [key, { input: "", result: "", error: "" }]),
  ) as Record<
    (typeof languages)[number],
    { input: string; result: string; error: string }
  >,
);
const busy = ref(false);
async function run(compact: boolean) {
  if (busy.value) return;
  const entry = entries[language.value];
  busy.value = true;
  entry.error = "";
  try {
    entry.result = await transformCode(entry.input, language.value, compact);
  } catch (cause) {
    entry.result = "";
    entry.error =
      cause instanceof Error ? cause.message : "处理失败，请检查代码语法。";
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <p class="tool-intro">
    HTML / CSS / JavaScript 美化与压缩，全部在本地处理，不执行输入代码。HTML
    保守压缩并保留注释；JS 不重命名变量。
  </p>
  <div class="code-tabs" role="group" aria-label="代码类型">
    <button
      v-for="item in languages"
      :key="item"
      :aria-pressed="language === item"
      :class="{ active: language === item }"
      @click="language = item"
    >
      {{ item.toUpperCase() }}
    </button>
  </div>
  <label class="input-label" for="code-input"
    >输入 {{ language.toUpperCase() }} 代码</label
  ><textarea
    id="code-input"
    v-model="entries[language].input"
    spellcheck="false"
    :placeholder="`粘贴 ${language.toUpperCase()} 代码…`"
  />
  <div class="actions">
    <button class="primary-button" :disabled="busy" @click="run(false)">
      {{ busy ? "处理中…" : "美化" }}</button><button
      class="secondary-button"
      :disabled="busy"
      @click="run(true)"
    >
      压缩</button
    ><button
      class="text-button"
      :disabled="busy"
      @click="entries[language] = { input: '', result: '', error: '' }"
    >
      清空
    </button>
  </div>
  <p v-if="entries[language].error" class="error-message" role="alert">
    {{ entries[language].error }}
  </p>
  <ResultPanel :value="entries[language].result" />
</template>
<style scoped>
.code-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}
.code-tabs button {
  flex: 1;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  background: white;
  padding: 10px;
  font-size: 12px;
}
.code-tabs button.active {
  background: #eaf2e8;
  color: #315f45;
  border-color: #6f987a;
}
</style>
