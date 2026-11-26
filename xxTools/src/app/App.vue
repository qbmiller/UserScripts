<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import ToolCard from "../components/ToolCard.vue";
import ToolHost from "../components/ToolHost.vue";
import BookmarkView from "../bookmarks/BookmarkView.vue";
import { tools, searchTools } from "../core/registry";
import {
  preferences,
  storageStatus,
  loadPreferences,
  setAutoRestore,
  clearRecent,
  recordUse,
  toggleFavorite,
} from "../core/storage";

const section = ref("工具箱");
const query = ref("");
const category = ref("全部");
const activeId = ref("");
const toolNotice = ref("");
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const visited = ref<string[]>([]);
const searchInput = ref<HTMLInputElement | null>(null);
const activeTool = computed(() =>
  tools.find((tool) => tool.id === activeId.value),
);
const categories = ["全部", ...new Set(tools.map((tool) => tool.category))];
const matches = computed(() =>
  searchTools(query.value, category.value).filter(
    (tool) =>
      section.value !== "我的工具" || preferences.favorites.includes(tool.id),
  ),
);
const groups = computed(() =>
  [...new Set(matches.value.map((tool) => tool.category))].map((name) => ({
    name,
    items: matches.value.filter((tool) => tool.category === name),
  })),
);
const recent = computed(() =>
  preferences.recent
    .map((id: string) => tools.find((tool) => tool.id === id))
    .filter((tool): tool is NonNullable<typeof tool> => !!tool),
);
function open(id: string) {
  const tool = tools.find((tool) => tool.id === id);
  if (!tool) return;
  clearTimeout(noticeTimer);
  if (tool.comingSoon) {
    toolNotice.value = "正在开发中，敬请期待";
    noticeTimer = setTimeout(() => {
      toolNotice.value = "";
    }, 3000);
    return;
  }
  toolNotice.value = "";
  activeId.value = id;
  if (!visited.value.includes(id)) visited.value.push(id);
  recordUse(id);
}
function navigate(value: string) {
  section.value = value;
  activeId.value = "";
  query.value = "";
  category.value = "全部";
}
function keyboard(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    activeId.value = "";
    section.value = "工具箱";
    setTimeout(() => searchInput.value?.focus(), 0);
  }
  if (event.key === "Escape") activeId.value = "";
}
function changeAutoRestore(event: Event) {
  setAutoRestore((event.target as HTMLInputElement).checked);
}
onMounted(() => {
  void loadPreferences();
  window.addEventListener("keydown", keyboard);
});
onUnmounted(() => {
  window.removeEventListener("keydown", keyboard);
  clearTimeout(noticeTimer);
});
</script>
<template>
  <div class="app-shell">
    <div v-if="toolNotice" class="tool-notice" role="status" aria-live="polite">
      {{ toolNotice }}
    </div>
    <header class="app-header">
      <button class="brand" @click="navigate('工具箱')">
        <span class="brand-mark">xx</span
        ><span>xxTools<small>让小事，顺手一点。</small></span></button
      ><button
        class="icon-button"
        aria-label="打开设置"
        @click="navigate('设置')"
      >
        ⚙
      </button>
    </header>
    <main>
      <p v-if="storageStatus.error" role="alert" class="error-message">
        {{ storageStatus.error }}
      </p>
      <div v-if="!storageStatus.ready" class="empty-state">正在准备工具…</div>
      <template v-else>
        <section v-show="!activeId && ['工具箱', '我的工具'].includes(section)">
          <div class="page-heading">
            <span class="eyebrow">日常工具 · 就在手边</span>
            <h1>
              {{
                section === "我的工具"
                  ? "常用的，都在这里。"
                  : "今天，想做点什么？"
              }}
            </h1>
            <p>
              {{
                section === "我的工具"
                  ? "收藏顺手的工具，下次更快找到。"
                  : "不用来回找，日常小工具触手可及。"
              }}
            </p>
          </div>
          <div class="search-box">
            <span aria-hidden="true">⌕</span
            ><input
              ref="searchInput"
              v-model="query"
              aria-label="搜索工具"
              placeholder="搜索工具、名称或关键词…"
            /><kbd>⌘ K</kbd>
          </div>
          <section
            v-if="section === '工具箱' && !query && category === '全部'"
            class="recent-section"
          >
            <div class="section-heading">
              <h2>最近使用</h2>
              <span>{{
                recent.length ? "随手接着用" : "从下方挑一个开始"
              }}</span>
            </div>
            <div v-if="recent.length" class="recent-grid">
              <button
                v-for="tool in recent"
                :key="tool.id"
                class="recent-card"
                @click="open(tool.id)"
              >
                <span class="mini-icon" :class="tool.id">{{
                  tool.icon
                }}</span><span>{{ tool.title }}</span
                ><span class="recent-arrow">↗</span>
              </button>
            </div>
            <div v-else class="recent-empty">
              你的常用工具，会慢慢出现在这里。
            </div>
          </section>
          <nav class="category-tabs" aria-label="工具分类">
            <button
              v-for="name in categories"
              :key="name"
              :class="{ active: category === name }"
              :aria-pressed="category === name"
              @click="category = name"
            >
              {{ name }}
            </button>
          </nav>
          <div class="catalog-summary">
            <span>{{
              query
                ? "搜索结果"
                : section === "我的工具"
                  ? "已收藏工具"
                  : "全部工具"
            }}</span><span>{{ matches.length }} 个工具</span>
          </div>
          <section v-for="group in groups" :key="group.name" class="tool-group">
            <h2>{{ group.name }}</h2>
            <ToolCard
              v-for="tool in group.items"
              :key="tool.id"
              :tool="tool"
              :favorite="preferences.favorites.includes(tool.id)"
              @open="open"
              @favorite="toggleFavorite"
            />
          </section>
          <div v-if="!matches.length" class="empty-state">
            <span class="empty-symbol">⌕</span
            ><strong>{{
              section === "我的工具" && !query
                ? "还没有收藏的工具"
                : "没有找到这个工具"
            }}</strong>
            <p>
              {{
                section === "我的工具" && !query
                  ? "点击工具右侧的星星，把常用工具留在这里。"
                  : "试试 JSON、链接、恢复，或者换个关键词。"
              }}
            </p>
          </div>
          <p class="local-note">
            <span>◉</span> 本地工具无需上传内容，联网工具会在页面说明
          </p>
        </section>
        <section v-if="activeTool" class="tool-detail-heading">
          <button class="back-button" @click="activeId = ''">
            ← 返回工具箱
          </button>
          <div class="detail-title">
            <span class="tool-icon" :class="activeTool.id">{{
              activeTool.icon
            }}</span>
            <div>
              <h1>{{ activeTool.title }}</h1>
              <span class="local-badge">{{
                activeTool.processing === "network" ? "联网查询" : "本地处理"
              }}</span>
            </div>
            <button
              class="favorite-button"
              :aria-label="
                preferences.favorites.includes(activeId)
                  ? '取消收藏当前工具'
                  : '收藏当前工具'
              "
              @click="toggleFavorite(activeId)"
            >
              {{ preferences.favorites.includes(activeId) ? "★" : "☆" }}
            </button>
          </div>
        </section>
        <section
          v-for="id in visited"
          v-show="id === activeId"
          :key="id"
          class="tool-workspace"
        >
          <ToolHost :id="id" />
        </section>
        <BookmarkView v-if="!activeId && section === '收藏夹'" />
        <section v-if="!activeId && section === '设置'" class="settings">
          <span class="eyebrow">使用偏好 · 由你决定</span>
          <h1>按你的习惯来。</h1>
          <p class="tool-intro">工具安静待命，只在你需要时帮忙。</p>
          <div class="setting-card">
            <label for="auto-restore"
              ><strong>自动恢复当前挂起标签</strong
              ><small
                >打开、选中或刷新时恢复；其他后台标签保持挂起。</small
              ></label
            ><input
              id="auto-restore"
              type="checkbox"
              role="switch"
              :checked="preferences.autoRestore"
              @change="changeAutoRestore"
            />
          </div>
          <div class="setting-card vertical">
            <strong>使用数据</strong>
            <p>
              只在本机保存收藏、最近使用和偏好。工具输入仅在侧栏会话中保留，关闭侧栏后清除。
            </p>
            <button
              class="secondary-button"
              :disabled="!preferences.recent.length"
              @click="clearRecent()"
            >
              清空最近使用
            </button>
          </div>
          <div class="about-card">
            <span class="brand-mark">xx</span
            ><strong>xxTools · 浏览器工具箱</strong
            ><span>2.3.0 · 一点点，积攒顺手的工具</span>
          </div>
        </section>
      </template>
    </main>
    <footer class="bottom-nav">
      <button
        v-for="(icon, name) in {
          工具箱: '▦',
          我的工具: '☆',
          收藏夹: '▱',
          设置: '⚙',
        }"
        :key="name"
        :class="{ active: section === name }"
        @click="navigate(String(name))"
      >
        <span>{{ icon }}</span>{{ name }}
      </button>
    </footer>
  </div>
</template>
