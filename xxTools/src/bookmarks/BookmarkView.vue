<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import {
  bookmarkTarget,
  flattenBookmarks,
  groupByWebsite,
  searchBookmarks,
  websiteOf,
} from "./model.mjs";
type Node = chrome.bookmarks.BookmarkTreeNode;
const tree = ref<Node[]>([]);
const query = ref("");
const mode = ref("folders");
const folderId = ref("0");
const website = ref("");
const limit = ref(100);
const loading = ref(true);
const error = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let revision = 0;
const all = computed(() => flattenBookmarks(tree.value));
const filtered = computed(() => searchBookmarks(all.value, query.value));
const groups = computed(() => groupByWebsite(filtered.value));
const nodes = computed(() => {
  const index = new Map<string, Node>();
  function walk(items: Node[]) {
    for (const node of items) {
      index.set(node.id, node);
      if (node.children) walk(node.children);
    }
  }
  walk(tree.value);
  return index;
});
const current = computed(() => nodes.value.get(folderId.value));
const breadcrumbs = computed(() => {
  const result: Node[] = [];
  let node = current.value;
  while (node) {
    result.unshift(node);
    node = node.parentId ? nodes.value.get(node.parentId) : undefined;
  }
  return result;
});
const entries = computed<Node[]>(() => {
  if (query.value.trim()) return filtered.value;
  return current.value?.children || [];
});
const chosenGroup = computed(() =>
  groups.value.find((group) => group.id === website.value),
);
const displayed = computed(() =>
  mode.value === "folders" ? entries.value : chosenGroup.value?.items || [],
);
const showGroups = computed(() => mode.value === "sites" && !website.value);
watch([query, mode, folderId, website], () => {
  limit.value = 100;
});
async function reload() {
  const request = ++revision;
  try {
    if (typeof chrome === "undefined" || !chrome.bookmarks?.getTree)
      throw new Error(
        "请重新加载 xxTools 并允许读取书签，然后重新打开侧边栏。",
      );
    const data = await chrome.bookmarks.getTree();
    if (disposed || request !== revision) return;
    tree.value = data;
    error.value = "";
    if (!nodes.value.has(folderId.value)) folderId.value = data[0]?.id || "0";
    if (
      website.value &&
      !groups.value.some((group) => group.id === website.value)
    )
      website.value = "";
  } catch (cause) {
    if (!disposed && request === revision)
      error.value =
        cause instanceof Error ? cause.message : "无法读取收藏夹，请重试。";
  } finally {
    if (!disposed && request === revision) loading.value = false;
  }
}
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void reload();
  }, 150);
}
function chooseMode(value: string) {
  mode.value = value;
  website.value = "";
}
async function open(node: Node) {
  if (!node.url) {
    folderId.value = node.id;
    return;
  }
  const target = bookmarkTarget(node.url);
  if (!target) {
    error.value =
      "这个书签使用不支持直接打开的协议。脚本书签不会在工具箱中执行。";
    return;
  }
  try {
    await chrome.tabs.create({ url: target });
    error.value = "";
  } catch {
    error.value = "浏览器未能打开这个书签，请检查网址或访问限制。";
  }
}
const events =
  typeof chrome !== "undefined" && chrome.bookmarks
    ? [
        chrome.bookmarks.onCreated,
        chrome.bookmarks.onRemoved,
        chrome.bookmarks.onChanged,
        chrome.bookmarks.onMoved,
        chrome.bookmarks.onChildrenReordered,
        chrome.bookmarks.onImportEnded,
      ]
    : [];
onMounted(() => {
  void reload();
  for (const event of events) event.addListener(schedule);
});
onUnmounted(() => {
  disposed = true;
  clearTimeout(timer);
  for (const event of events) event.removeListener(schedule);
});
</script>
<template>
  <section class="bookmark-view">
    <div class="page-heading">
      <span class="eyebrow">浏览器收藏 · 随时找回</span>
      <div class="bookmark-title">
        <h1>收藏的，随手打开。</h1>
        <button class="text-button" aria-label="刷新收藏夹" @click="reload">
          刷新
        </button>
      </div>
      <p>共 {{ all.length }} 个书签，沿着目录找，或按网站看看。</p>
    </div>
    <div class="search-box">
      <span aria-hidden="true">⌕</span
      ><input
        v-model="query"
        aria-label="搜索浏览器书签"
        placeholder="搜索标题、网址或文件夹…"
      /><button
        v-if="query"
        class="text-button"
        aria-label="清空书签搜索"
        @click="query = ''"
      >
        清空
      </button>
    </div>
    <nav class="category-tabs" aria-label="收藏夹展示方式">
      <button
        :class="{ active: mode === 'folders' }"
        :aria-pressed="mode === 'folders'"
        @click="chooseMode('folders')"
      >
        原文件夹</button
      ><button
        :class="{ active: mode === 'sites' }"
        :aria-pressed="mode === 'sites'"
        @click="chooseMode('sites')"
      >
        按网站分组
      </button>
    </nav>
    <p v-if="error" role="alert" class="error-message">{{ error }}</p>
    <p v-if="loading" class="empty-state" role="status">
      正在读取浏览器收藏夹…
    </p>
    <template v-else>
      <nav
        v-if="mode === 'folders' && !query.trim()"
        class="bookmark-breadcrumb"
        aria-label="收藏夹路径"
      >
        <button
          v-for="node in breadcrumbs"
          :key="node.id"
          @click="folderId = node.id"
        >
          {{ node.title || "全部收藏" }}<span>/</span>
        </button>
      </nav>
      <div v-if="mode === 'sites' && website" class="section-heading">
        <button class="back-button" @click="website = ''">← 所有网站</button
        ><span>{{ website }}</span>
      </div>
      <div class="catalog-summary">
        <span>{{
          query.trim()
            ? "搜索结果"
            : mode === "folders"
              ? current?.title || "全部收藏"
              : website || "按域名分类"
        }}</span
        ><span>{{
          showGroups ? groups.length + " 个网站" : displayed.length + " 项"
        }}</span>
      </div>
      <template v-if="showGroups">
        <button
          v-for="group in groups.slice(0, limit)"
          :key="group.id"
          class="bookmark-row website-group"
          @click="website = group.id"
        >
          <span class="bookmark-icon">◎</span
          ><span class="bookmark-copy"
            ><strong>{{ group.id }}</strong
            ><small>{{ group.items.length }} 个书签</small></span
          ><span class="bookmark-arrow">›</span>
        </button>
        <button
          v-if="groups.length > limit"
          class="secondary-button full-width"
          @click="limit += 100"
        >
          继续显示网站
        </button>
        <div v-if="!groups.length" class="empty-state">
          <strong>{{
            query ? "没有找到匹配的书签" : "还没有浏览器书签"
          }}</strong>
          <p>在浏览器中收藏网页后，就会显示在这里。</p>
        </div>
      </template>
      <template v-else>
        <button
          v-for="node in displayed.slice(0, limit)"
          :key="node.id"
          class="bookmark-row"
          :aria-label="`${node.url ? '打开书签' : '打开文件夹'} ${node.title || '未命名文件夹'}`"
          :title="node.url || node.title"
          @click="open(node)"
        >
          <span class="bookmark-icon" :class="{ folder: !node.url }">{{
            node.url ? "↗" : "▱"
          }}</span
          ><span class="bookmark-copy"
            ><strong>{{ node.title || node.url || "未命名文件夹" }}</strong
            ><small>{{
              node.url
                ? websiteOf(node.url)
                : (node.children?.length || 0) + " 项"
            }}</small
            ><small
              v-if="node.url && (query || mode === 'sites')"
              class="source-path"
              >{{
                "folders" in node ? (node.folders as string[]).join(" / ") : ""
              }}</small
            ></span
          ><span class="bookmark-arrow">{{ node.url ? "↗" : "›" }}</span>
        </button>
        <button
          v-if="displayed.length > limit"
          class="secondary-button full-width"
          @click="limit += 100"
        >
          继续显示（剩余 {{ displayed.length - limit }} 项）
        </button>
        <div v-if="!displayed.length" class="empty-state">
          <strong>{{ query ? "没有找到匹配的书签" : "这里还没有书签" }}</strong>
          <p>
            {{
              query
                ? "试试标题、域名或文件夹名称。"
                : "可以返回上级文件夹，或在浏览器中收藏网页。"
            }}
          </p>
        </div>
      </template>
      <p class="local-note">只在本机展示和分组，不移动或修改浏览器书签</p>
    </template>
  </section>
</template>
<style scoped>
.bookmark-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.bookmark-title h1 {
  font-size: 23px;
}
.bookmark-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: -3px 0 18px;
}
.bookmark-breadcrumb button {
  font-size: 11px;
  color: #607b56;
  padding: 2px 0;
  overflow-wrap: anywhere;
}
.bookmark-breadcrumb span {
  color: #b5c0ae;
  margin: 0 6px;
}
.bookmark-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 14px 12px;
  background: #fff;
  border: 1px solid #e2e8dc;
  border-radius: 11px;
  margin-bottom: 8px;
}
.bookmark-row:hover {
  background: #f0f5ec;
  border-color: #bdcfb8;
}
.bookmark-icon {
  flex-shrink: 0;
  width: 35px;
  height: 35px;
  background: #edf3e8;
  color: #54804a;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 19px;
}
.bookmark-icon.folder {
  background: #f6f0e1;
  color: #a78945;
}
.bookmark-copy {
  min-width: 0;
  flex: 1;
}
.bookmark-copy strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 550;
}
.bookmark-copy small {
  display: block;
  color: #91a087;
  font-size: 10px;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bookmark-copy .source-path {
  font-size: 9px;
  color: #a3ad9c;
}
.bookmark-arrow {
  color: #9eb293;
  font-size: 15px;
}
.section-heading .back-button {
  margin: 0;
}
.section-heading > span {
  overflow-wrap: anywhere;
  max-width: 60%;
  text-align: right;
}
.search-box {
  margin-bottom: 20px;
}
</style>
