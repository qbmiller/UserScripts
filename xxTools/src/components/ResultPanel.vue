<script setup lang="ts">
import { ref } from "vue";
defineProps<{ value: string; label?: string }>();
const copied = ref(false);
const copyError = ref("");
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    copied.value = true;
    copyError.value = "";
    setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch {
    copyError.value = "复制失败，请选择结果手动复制。";
  }
}
</script>
<template>
  <section class="result-panel">
    <div class="field-heading">
      <label>{{ label || "处理结果" }}</label
      ><button class="text-button" :disabled="!value" @click="copy(value)">
        {{ copied ? "已复制 ✓" : "复制结果" }}
      </button>
    </div>
    <textarea
      :value="value"
      readonly
      spellcheck="false"
      aria-label="处理结果"
      placeholder="结果会显示在这里…"
    />
    <p v-if="copyError" role="alert" class="error-message">{{ copyError }}</p>
  </section>
</template>
