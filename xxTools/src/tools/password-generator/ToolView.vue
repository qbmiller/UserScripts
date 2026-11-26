<script setup lang="ts">
import { ref, watch } from "vue";
import { generatePasswords } from "./generate.mjs";

const length = ref(18);
const options = ref({ uppercase: true, lowercase: true, digits: true, symbols: false, excludeAmbiguous: true });
const choices = [
  ["uppercase", "大写字母"], ["lowercase", "小写字母"],
  ["digits", "数字"], ["symbols", "符号"],
] as const;
const passwords = ref<string[]>([]);
const error = ref("");
const copied = ref<number | null>(null);
let copyRequest = 0;

function generate() {
  copyRequest++;
  copied.value = null;
  try {
    passwords.value = generatePasswords(length.value, options.value);
    error.value = "";
  } catch (cause) {
    passwords.value = [];
    error.value = cause instanceof Error ? cause.message : "生成失败，请重试。";
  }
}
async function copy(index: number) {
  const request = ++copyRequest;
  try {
    await navigator.clipboard.writeText(passwords.value[index]);
    if (request !== copyRequest) return;
    copied.value = index;
    error.value = "";
  } catch {
    if (request === copyRequest) error.value = "复制失败，请选择密码手动复制。";
  }
}
watch([length, options], generate, { deep: true, immediate: true });
</script>

<template>
  <p class="tool-intro">在本机生成强随机密码，密码不会保存或上传。</p>
  <div class="field-heading">
    <label for="password-length-input">密码长度</label>
    <div class="length-input">
      <input id="password-length-input" v-model.number="length" type="number" min="8" max="128" step="1" aria-label="密码长度（8–128 位）" />
      <span>位</span>
    </div>
  </div>
  <input id="password-length" v-model.number="length" type="range" min="8" max="128" aria-label="滑动调整密码长度" />
  <div class="password-options">
    <label v-for="[key, label] in choices" :key="key">
      <input v-model="options[key]" type="checkbox" />{{ label }}
    </label>
  </div>
  <label class="ambiguous-option">
    <input v-model="options.excludeAmbiguous" type="checkbox" />排除易混淆字符（I、l、1、O、0、o、|）
  </label>
  <p class="password-note">每个密码均包含所有已选类型的字符。</p>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <section class="password-results" aria-label="生成的密码">
    <div v-for="(password, index) in passwords" :key="index" class="password-result">
      <input :value="password" readonly spellcheck="false" :aria-label="`密码 ${index + 1}`" />
      <button class="text-button" :aria-label="`复制密码 ${index + 1}`" @click="copy(index)">
        {{ copied === index ? "已复制 ✓" : "复制" }}
      </button>
    </div>
  </section>
  <p class="copy-status" role="status">{{ copied !== null ? `密码 ${copied + 1} 已复制` : "" }}</p>
  <button class="primary-button regenerate" @click="generate">↻ 重新生成</button>
</template>

<style scoped>
.length-input { display: flex; align-items: center; gap: 6px; }
.length-input input { width: 76px; padding: 6px 8px; border: 1px solid #dce4d5; border-radius: 8px; background: #fff; color: inherit; text-align: right; }
#password-length { width: 100%; margin: 8px 0 22px; accent-color: #315f45; }
.password-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.password-options label { display: flex; align-items: center; gap: 8px; padding: 12px; border: 1px solid #dce4d5; border-radius: 10px; background: #fff; }
input[type="checkbox"] { accent-color: #315f45; }
.ambiguous-option { display: flex; align-items: center; gap: 8px; margin: 16px 0 8px; font-size: 12px; color: #637257; }
.password-note { font-size: 12px; color: #8c9786; margin-bottom: 18px; }
.password-results { display: grid; gap: 10px; }
.password-result { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fff; border: 1px solid #dce4d5; border-radius: 10px; }
.password-result input { width: 100%; min-width: 0; border: 0; background: transparent; color: #3d4a38; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 14px; }
.password-result button { flex-shrink: 0; }
.copy-status { min-height: 22px; font-size: 11px; color: #65805a; }
.regenerate { width: 100%; }
</style>
