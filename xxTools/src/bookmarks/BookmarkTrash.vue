<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { trashRequest } from "./trash-client.mjs";
import { deletionSize } from "./edit.mjs";
type Entry = {
  id: string;
  deletedAt: number;
  node: chrome.bookmarks.BookmarkTreeNode;
  ancestors: { id: string; title: string }[];
};
const emit = defineEmits<{ restored: [] }>();
const entries = ref<Entry[]>([]);
const loading = ref(true);
const busy = ref("");
const error = ref("");
const notice = ref("");
let disposed = false;
let timer: ReturnType<typeof setTimeout> | undefined;
async function reload() {
  try {
    const result = await trashRequest("list");
    if (!disposed)
      entries.value = result.entries.sort(
        (a: Entry, b: Entry) => b.deletedAt - a.deletedAt,
      );
  } catch (cause) {
    if (!disposed)
      error.value = cause instanceof Error ? cause.message : "无法读取回收站。";
  } finally {
    if (!disposed) loading.value = false;
  }
}
async function restore(entry: Entry) {
  if (busy.value) return;
  busy.value = entry.id;
  error.value = "";
  notice.value = "";
  try {
    const result = await trashRequest("restore", { id: entry.id });
    notice.value = `已恢复到「${result.parentTitle || "收藏夹"}」。`;
    emit("restored");
    await reload();
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "恢复失败，记录仍保留在回收站，可重试。";
  } finally {
    busy.value = "";
  }
}
function changed(
  changes: Record<string, chrome.storage.StorageChange>,
  area: string,
) {
  if (area === "local" && changes["toolbox.bookmark-trash"]) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void reload();
    }, 150);
  }
}
onMounted(() => {
  if (typeof chrome !== "undefined")
    chrome.storage?.onChanged.addListener(changed);
  void reload();
});
onUnmounted(() => {
  disposed = true;
  clearTimeout(timer);
  if (typeof chrome !== "undefined")
    chrome.storage?.onChanged.removeListener(changed);
});
</script>
<template>
  <section class="trash-view" aria-label="收藏夹回收站">
    <p class="tool-intro">
      在 xxTools 删除的书签和文件夹先保存在本机，可在 30 天内恢复。超过 30
      天的记录会自动清理；原目录不存在时恢复到可用的上级目录。
    </p>
    <button
      class="secondary-button"
      :disabled="loading || !!busy"
      @click="reload"
    >
      刷新回收站
    </button>
    <p v-if="error" role="alert" class="error-message">{{ error }}</p>
    <p v-if="notice" role="status" class="success-message">{{ notice }}</p>
    <p v-if="loading" role="status">正在读取回收站…</p>
    <p v-else-if="!entries.length" class="empty-state">回收站是空的。</p>
    <article v-for="entry in entries" :key="entry.id" class="trash-entry">
      <div>
        <strong>{{
          entry.node.title || entry.node.url || "未命名文件夹"
        }}</strong>
        <small v-if="entry.node.url">{{ entry.node.url }}</small>
        <small v-else
          >{{ deletionSize(entry.node).bookmarks }} 个书签、{{
            deletionSize(entry.node).folders - 1
          }}
          个子文件夹</small
        >
        <small
          >原位置：{{
            [...entry.ancestors]
              .reverse()
              .map((item) => item.title)
              .filter(Boolean)
              .join(" / ")
          }}</small
        >
        <small
          >删除于 {{ new Date(entry.deletedAt).toLocaleString("zh-CN") }}</small
        >
      </div>
      <button
        class="secondary-button"
        :disabled="!!busy"
        :aria-label="`恢复 ${entry.node.title || '未命名书签'}`"
        @click="restore(entry)"
      >
        {{ busy === entry.id ? "正在恢复…" : "恢复" }}
      </button>
    </article>
  </section>
</template>
<style scoped>
.trash-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 12px;
  margin-top: 10px;
  border: 1px solid #e2e8dc;
  border-radius: 11px;
  background: white;
}
.trash-entry > div {
  flex: 1;
  min-width: 0;
}
.trash-entry strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}
.trash-entry small {
  display: block;
  font-size: 11px;
  line-height: 1.7;
  color: #819176;
  overflow-wrap: anywhere;
  margin-top: 4px;
}
.trash-entry button {
  flex-shrink: 0;
}
</style>
