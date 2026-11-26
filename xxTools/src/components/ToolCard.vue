<script setup lang="ts">
import type { ToolDefinition } from "../core/registry";
defineProps<{ tool: ToolDefinition; favorite: boolean }>();
defineEmits<{ open: [id: string]; favorite: [id: string] }>();
</script>
<template>
  <article class="tool-card">
    <button class="tool-open" @click="$emit('open', tool.id)">
      <span class="tool-icon" :class="tool.id">{{ tool.icon }}</span
      ><span class="tool-copy"
        ><strong>{{ tool.title }}</strong
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
