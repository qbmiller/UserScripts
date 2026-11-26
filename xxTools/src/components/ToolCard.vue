<script setup lang="ts">
import type { ToolDefinition } from "../core/registry";
defineProps<{ tool: ToolDefinition; favorite: boolean }>();
defineEmits<{ open: [id: string]; favorite: [id: string] }>();
</script>
<template>
  <article class="tool-card">
    <button class="tool-open" @click="$emit('open', tool.id)">
      <span class="tool-icon" :class="tool.id">{{ tool.icon }}</span><span
        class="tool-copy"
        ><strong
          >{{ tool.title
          }}<span v-if="tool.comingSoon" class="coming-soon-badge"
            >开发中</span
          ></strong
        ><small>{{ tool.description }}</small></span
      >
    </button>
    <button
      class="favorite-button"
      :class="{ selected: favorite }"
      :aria-label="`${favorite ? '取消收藏' : '收藏'}${tool.title}`"
      :aria-pressed="favorite"
      @click="$emit('favorite', tool.id)"
    >
      {{ favorite ? "★" : "☆" }}
    </button>
  </article>
</template>
<style scoped>
.coming-soon-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 9px;
  font-weight: 400;
  color: #97a08f;
  vertical-align: middle;
}
</style>
