<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { preferences } from "../core/storage";
import { trashRequest } from "./trash-client.mjs";
import {
  deletionSize,
  editBookmark,
  indexBookmarks,
  moveFolders,
} from "./edit.mjs";
type Node = chrome.bookmarks.BookmarkTreeNode;
const props = defineProps<{
  node: Node;
  tree: Node[];
  initialAction?: "rename" | "delete";
}>();
const emit = defineEmits<{ close: []; saved: [message: string] }>();
const dialog = ref<HTMLDialogElement | null>(null);
const action = ref<"rename" | "move" | "delete">(
  props.initialAction || "rename",
);
const title = ref(props.node.title);
const url = ref(props.node.url || "");
const parentId = ref(props.node.parentId || "");
const beforeId = ref("");
const busy = ref(false);
const error = ref("");
const snapshot = JSON.stringify(props.node);
const size = deletionSize(props.node);
const folders = computed(() => moveFolders(props.tree, props.node.id));
const positions = computed(() =>
  (indexBookmarks(props.tree).get(parentId.value)?.children || []).filter(
    (node: Node) => node.id !== props.node.id,
  ),
);
// 初始位置为当前后一个节点，原样保存移动不会改变顺序。
const siblings =
  indexBookmarks(props.tree).get(props.node.parentId)?.children || [];
beforeId.value =
  siblings[siblings.findIndex((node: Node) => node.id === props.node.id) + 1]
    ?.id || "";
watch(parentId, () => {
  beforeId.value = "";
});
watch(action, () => {
  error.value = "";
});
async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    const operation = {
      type: action.value,
      id: props.node.id,
      title: title.value,
      url: url.value,
      parentId: parentId.value,
      beforeId: beforeId.value,
      snapshot,
    };
    if (action.value === "delete") await trashRequest("delete", operation);
    else await editBookmark(chrome.bookmarks, operation);
    emit(
      "saved",
      action.value === "delete"
        ? "已移入回收站，可在 30 天内恢复。"
        : action.value === "move"
          ? "已移动，浏览器书签已同步。"
          : "已保存，浏览器书签已同步。",
    );
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "操作失败，请重试。";
  } finally {
    busy.value = false;
  }
}
function selectAction(value: "rename" | "move" | "delete") {
  if (busy.value) return;
  action.value = value;
  if (value === "delete" && preferences.skipBookmarkDeleteConfirm)
    void submit();
}
function cancel(event: Event) {
  event.preventDefault();
  if (!busy.value) emit("close");
}
onMounted(() => dialog.value?.showModal());
onUnmounted(() => dialog.value?.close());
</script>
<template>
  <dialog
    ref="dialog"
    class="bookmark-editor"
    aria-labelledby="bookmark-editor-title"
    @cancel="cancel"
  >
    <form @submit.prevent="submit">
      <div class="editor-header">
        <h2 id="bookmark-editor-title">
          管理{{ node.url ? "书签" : "文件夹" }}
        </h2>
        <button
          type="button"
          aria-label="关闭书签编辑"
          :disabled="busy"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
      <p class="editing-name">{{ node.title || node.url || "未命名文件夹" }}</p>
      <nav class="category-tabs" aria-label="书签编辑操作">
        <button
          v-for="(label, key) in {
            rename: '编辑',
            move: '移动',
            delete: '删除',
          }"
          :key="key"
          type="button"
          :class="{ active: action === key }"
          :disabled="busy"
          @click="selectAction(key)"
        >
          {{ label }}
        </button>
      </nav>
      <template v-if="action === 'rename'"
        ><label for="bookmark-name">名称</label
        ><input
          id="bookmark-name"
          v-model="title"
          :disabled="busy"
          required
        /><template v-if="node.url"
          ><label for="bookmark-url">网址</label
          ><input
            id="bookmark-url"
            v-model="url"
            :disabled="busy"
            required
            spellcheck="false"
        /></template>
        <p class="editor-hint">
          保存后会同步修改浏览器里的{{ node.url ? "书签" : "文件夹" }}。
        </p></template
      >
      <template v-else-if="action === 'move'"
        ><label for="bookmark-destination">目标文件夹</label
        ><select id="bookmark-destination" v-model="parentId" :disabled="busy">
          <option v-for="folder in folders" :key="folder.id" :value="folder.id">
            {{ folder.title }}
          </option></select
        ><label for="bookmark-position">放置位置</label
        ><select id="bookmark-position" v-model="beforeId" :disabled="busy">
          <option value="">放在末尾</option>
          <option v-for="item in positions" :key="item.id" :value="item.id">
            放在「{{ item.title || item.url || "未命名文件夹" }}」之前
          </option>
        </select>
        <p class="editor-hint">
          可以移动到其他文件夹，也可以在原文件夹里调整顺序。
        </p></template
      >
      <div v-else class="delete-warning">
        <strong>确认删除「{{ node.title || "未命名书签" }}」？</strong>
        <p v-if="!node.url">
          将删除此文件夹及其中 {{ size.bookmarks }} 个书签、{{
            size.folders - 1
          }}
          个子文件夹。
        </p>
        <p v-else>将从浏览器收藏夹中删除这个书签。</p>
        <p>先移入本机回收站，可在 30 天内恢复；超过 30 天的记录会自动清理。</p>
      </div>
      <p v-if="error" role="alert" class="error-message">{{ error }}</p>
      <div class="actions editor-actions">
        <button
          type="button"
          class="secondary-button"
          :disabled="busy"
          @click="emit('close')"
        >
          取消</button
        ><button
          type="submit"
          :class="action === 'delete' ? 'delete-button' : 'primary-button'"
          :disabled="busy"
        >
          {{
            busy
              ? "正在处理…"
              : action === "delete"
                ? "确认删除"
                : action === "move"
                  ? "移动到这里"
                  : "保存修改"
          }}
        </button>
      </div>
    </form>
  </dialog>
</template>
<style scoped>
.bookmark-editor {
  width: calc(100vw - 28px);
  max-width: 430px;
  max-height: calc(100vh - 40px);
  overflow: auto;
  border: 1px solid #dce4d5;
  border-radius: 16px;
  padding: 22px;
  background: #f8f9f6;
  color: #252b29;
  box-shadow: 0 15px 65px #16271340;
}
.bookmark-editor::backdrop {
  background: #16251966;
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.editor-header h2 {
  font-size: 17px;
}
.editor-header button {
  font-size: 24px;
  color: #7f8a78;
  line-height: 1;
}
.editing-name {
  font-size: 12px;
  color: #829277;
  margin-top: 9px;
  overflow-wrap: anywhere;
}
.category-tabs {
  margin: 18px 0;
}
.bookmark-editor label {
  display: block;
  font-size: 12px;
  margin: 16px 0 8px;
}
.bookmark-editor input,
.bookmark-editor select {
  width: 100%;
  min-width: 0;
  padding: 11px;
  border: 1px solid #d7e0cf;
  border-radius: 8px;
  background: white;
  color: #42523a;
  font-size: 12px;
}
.editor-hint {
  font-size: 11px;
  color: #8a997f;
  line-height: 1.8;
  margin-top: 13px;
}
.delete-warning {
  padding: 14px;
  background: #fbefe9;
  border: 1px solid #efd6cb;
  border-radius: 9px;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.delete-warning strong {
  color: #994b3c;
}
.delete-warning p {
  font-size: 11px;
  color: #aa7162;
  line-height: 1.8;
  margin-top: 9px;
}
.delete-button {
  background: #a94f3f;
  color: white;
  border-radius: 8px;
  padding: 10px 17px;
  font-size: 12px;
}
.editor-actions {
  justify-content: flex-end;
  margin: 22px 0 0;
}
</style>
