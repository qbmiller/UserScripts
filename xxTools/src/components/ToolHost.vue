<script setup lang="ts">
import { defineAsyncComponent, onErrorCaptured, ref, shallowRef } from "vue";
import { tools } from "../core/registry";
const props = defineProps<{ id: string }>();
const failed = ref(false);
const component = shallowRef();
function load() {
  failed.value = false;
  component.value = defineAsyncComponent({
    loader: tools.find((tool) => tool.id === props.id)!.load,
    timeout: 15000,
  });
}
onErrorCaptured(() => {
  failed.value = true;
  return false;
});
load();
</script>
<template>
  <div v-if="failed" class="empty-state" role="alert">
    <strong>这个工具暂时未能打开</strong>
    <p>其他工具仍可正常使用。</p>
    <button class="secondary-button" @click="load">重新加载</button>
  </div>
  <component :is="component" v-else />
</template>
