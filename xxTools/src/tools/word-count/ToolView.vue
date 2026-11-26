<script setup lang="ts">
import { computed, ref } from "vue";
import { countText } from "./count.mjs";

const input = ref("");
const stats = computed(() => countText(input.value));
const metrics = [
  ["characters", "总字符数"],
  ["nonWhitespace", "不含空白"],
  ["chinese", "汉字"],
  ["englishWords", "英文单词"],
  ["digits", "数字字符"],
  ["lines", "行数"],
] as const;
</script>

<template>
  <p class="tool-intro">输入或粘贴文字，即时统计字数。所有内容仅在本地处理。</p>
  <label class="input-label" for="word-count-input">需要统计的文本</label>
  <textarea
    id="word-count-input"
    v-model="input"
    spellcheck="false"
    placeholder="在这里输入或粘贴文字…"
  />
  <div class="actions">
    <button class="secondary-button" :disabled="!input" @click="input = ''">清空文本</button>
  </div>
  <dl class="word-count-stats" aria-label="文本统计结果">
    <div v-for="[key, label] in metrics" :key="key" class="word-count-stat">
      <dt>{{ label }}</dt>
      <dd>{{ stats[key].toLocaleString('zh-CN') }}</dd>
    </div>
  </dl>
  <p class="count-note">
    总字符数包含空格与换行，组合表情计为一个字符；不含空白会排除空格、制表符与换行。
    英文单词按字母统计，词内的连字符和撇号不拆分；数字逐个计数，空文本为 0 行。
  </p>
</template>

<style scoped>
.word-count-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.word-count-stat {
  padding: 16px;
  border: 1px solid #dce4d5;
  border-radius: 12px;
  background: #fff;
}
dt, .count-note {
  color: #637257;
  font-size: 13px;
  line-height: 1.7;
}
dd {
  margin: 6px 0 0;
  font-size: 26px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
</style>
