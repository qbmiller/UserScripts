<script setup lang="ts">
import { ref, watch } from "vue";
import ResultPanel from "../../components/ResultPanel.vue";
import { convertConfig } from "./convert.mjs";
const formats = [
  { id: "json", label: "JSON" },
  { id: "yaml", label: "YAML / YML" },
  { id: "properties", label: "Java Properties" },
];
const from = ref("json");
const to = ref("yaml");
const input = ref("");
const result = ref("");
const error = ref("");
watch([from, to], () => {
  result.value = "";
  error.value = "";
});
function run() {
  try {
    result.value = convertConfig(input.value, from.value, to.value);
    error.value = "";
  } catch (cause) {
    result.value = "";
    error.value =
      cause instanceof Error ? cause.message : "转换失败，请检查格式。";
  }
}
function swap() {
  if (result.value) input.value = result.value;
  [from.value, to.value] = [to.value, from.value];
  result.value = "";
  error.value = "";
}
function example() {
  input.value =
    from.value === "json"
      ? '{"server":{"port":8080},"app":{"name":"示例应用","enabled":true},"hosts":["localhost","example.com"]}'
      : from.value === "yaml"
        ? "server:\n  port: 8080\napp:\n  name: 示例应用\n  enabled: true\nhosts:\n  - localhost\n  - example.com\n"
        : "server.port=8080\napp.name=示例应用\napp.enabled=true\nhosts[0]=localhost\nhosts[1]=example.com";
  result.value = "";
  error.value = "";
}
</script>
<template>
  <p class="tool-intro">
    JSON、YAML / YML、Java Properties 任意互转，全部在本地处理。
  </p>
  <div class="config-formats">
    <label
      >输入格式<select v-model="from" aria-label="输入格式">
        <option v-for="format in formats" :key="format.id" :value="format.id">
          {{ format.label }}
        </option>
      </select></label
    >
    <label
      >输出格式<select v-model="to" aria-label="输出格式">
        <option v-for="format in formats" :key="format.id" :value="format.id">
          {{ format.label }}
        </option>
      </select></label
    >
  </div>
  <div class="field-heading">
    <label for="config-input">输入配置</label
    ><button class="text-button" @click="example">试试示例</button>
  </div>
  <textarea
    id="config-input"
    v-model="input"
    spellcheck="false"
    placeholder="粘贴需要转换的配置…"
  />
  <div class="actions config-actions">
    <button class="primary-button" @click="run">转换</button>
    <button class="secondary-button" @click="swap">交换格式</button>
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
  <p v-if="from === 'properties' || to === 'properties'" class="tool-intro">
    Properties 按宽松模式转换：空数组、空对象、null 分别保留为 []、{}、null
    文本。 点号和 [0]
    尽量还原嵌套结构，重复键或路径冲突以后面的值为准；转回时值默认是字符串。
  </p>
  <p v-else class="tool-intro">
    转换会移除注释和原始排版。超出安全范围的整数请用引号保存为字符串。
  </p>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <ResultPanel :value="result" />
</template>
<style scoped>
.config-formats {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
.config-formats label {
  flex: 1;
  min-width: 0;
  font-size: 12px;
}
.config-formats select {
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 10px 6px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  background: white;
  color: #3d4a38;
  font: inherit;
}
.config-formats select:focus-visible {
  outline: 2px solid #428765;
  outline-offset: 3px;
}
.config-actions {
  flex-wrap: wrap;
}
</style>
