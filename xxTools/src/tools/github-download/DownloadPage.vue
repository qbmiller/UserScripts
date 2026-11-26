<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  parseRepository,
  resolveRevision,
  collectFiles,
  downloadArchive,
  githubApi,
  TOKEN_KEY,
} from "./engine.mjs";
import TokenSettings from "./TokenSettings.vue";
interface Job {
  pageUrl: string;
  items: { url: string; type: "tree" | "blob" }[];
  createdAt: number;
}
const job = ref<Job | null>(null);
const state = ref("准备中");
const progress = ref("正在读取下载任务…");
const error = ref("");
const count = ref(0);
const filename = ref("");
const downloadId = ref<number>();
let controller: AbortController | undefined;
let generation = 0;
let objectUrl = "";
let key = "";
function selectedLabel(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname);
  } catch {
    return url;
  }
}
const running = computed(() => ["准备中", "下载中"].includes(state.value));
async function start() {
  if (!job.value || state.value === "下载中") return;
  const current = ++generation;
  const taskController = new AbortController();
  controller = taskController;
  state.value = "下载中";
  error.value = "";
  count.value = 0;
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = "";
  }
  const report = (text: string) => {
    if (current === generation && !taskController.signal.aborted)
      progress.value = text;
  };
  try {
    report("正在解析分支与提交…");
    const stored = await chrome.storage.local.get(TOKEN_KEY);
    const api = githubApi(
      typeof stored[TOKEN_KEY] === "string" ? stored[TOKEN_KEY] : "",
      taskController.signal,
    );
    const repo = await resolveRevision(
      parseRepository(job.value.pageUrl),
      api.json,
    );
    const files = await collectFiles(
      repo,
      job.value.items,
      api.json,
      report,
      taskController.signal,
    );
    count.value = files.length;
    const blob = await downloadArchive(
      repo,
      files,
      api.raw,
      report,
      taskController.signal,
    );
    taskController.signal.throwIfAborted();
    filename.value = `${repo.repo}-${repo.ref.replace(/[^\w.-]/g, "_")}-${repo.sha.slice(0, 7)}-selected.zip`;
    objectUrl = URL.createObjectURL(blob);
    downloadId.value = await chrome.downloads.download({
      url: objectUrl,
      filename: filename.value,
      saveAs: false,
    });
    state.value = "已提交下载";
    progress.value = "ZIP 已交给浏览器保存，可在下载列表查看。";
  } catch (cause) {
    const cancelled = taskController.signal.aborted;
    taskController.abort();
    if (current !== generation) return;
    if (cancelled) {
      state.value = "已取消";
      progress.value = "任务已停止，没有导出不完整的 ZIP。";
    } else {
      state.value = "下载失败";
      error.value =
        cause instanceof Error ? cause.message : "下载失败，请重试。";
    }
  }
}
async function saveAgain() {
  try {
    await chrome.downloads.download({
      url: objectUrl,
      filename: filename.value,
      saveAs: true,
    });
  } catch {
    error.value = "无法再次保存，请重新下载。";
  }
}
onMounted(async () => {
  try {
    const id = new URLSearchParams(location.search).get("job");
    if (!id || !/^[\da-f-]{36}$/.test(id))
      throw new Error("下载任务不存在，请返回 GitHub 重新选择。");
    key = "github.job." + id;
    const stored = await chrome.storage.session.get(key);
    if (!stored[key]) throw new Error("任务已过期，请回到 GitHub 重新选择。");
    job.value = stored[key] as Job;
    await start();
  } catch (cause) {
    state.value = "无法开始";
    error.value =
      cause instanceof Error
        ? cause.message
        : "请在 xxTools 扩展中打开下载任务。";
  }
});
onUnmounted(() => {
  controller?.abort();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
});
window.addEventListener(
  "pagehide",
  () => {
    controller?.abort();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  },
  { once: true },
);
</script>
<template>
  <div class="download-shell">
    <header class="app-header">
      <div class="brand">
        <span class="brand-mark">↓</span
        ><span>xxTools<small>GitHub 勾选下载</small></span>
      </div>
      <span class="local-badge">本机打包 ZIP</span>
    </header>
    <main>
      <span class="eyebrow">选择所需 · 轻装下载</span>
      <h1>{{ state }}</h1>
      <p class="download-progress" role="status" aria-live="polite">
        {{ progress }}
      </p>
      <div v-if="running" class="download-indicator"></div>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <div class="actions">
        <button
          v-if="running"
          class="secondary-button"
          @click="controller?.abort()"
        >
          取消任务</button
        ><button v-if="!running && job" class="secondary-button" @click="start">
          重新下载</button
        ><button
          v-if="state === '已提交下载'"
          class="primary-button"
          @click="saveAgain"
        >
          另存 ZIP
        </button>
      </div>
      <p v-if="count" class="tool-intro">
        共 {{ count }} 个文件 · {{ filename }}
      </p>
      <section v-if="job" class="download-selection">
        <h2>已选择 {{ job.items.length }} 项</h2>
        <p>{{ job.pageUrl }}</p>
        <ul>
          <li v-for="item in job.items" :key="item.url">
            {{ selectedLabel(item.url) }}
          </li>
        </ul>
      </section>
      <TokenSettings />
      <p class="download-footnote">
        从 GitHub API
        读取原文件，在本机打包；不会上传到第三方。大目录可能耗时，请保持此页打开。单次最多
        10,000 文件 / 200 MiB；Git LFS 保存仓库中的指针文件，子模块不递归下载。
      </p>
    </main>
  </div>
</template>
<style scoped>
.download-shell {
  max-width: 800px;
  margin: 35px auto;
  background: #f8f9f6;
  border: 1px solid #e1e7db;
  border-radius: 16px;
  overflow: hidden;
}
.download-shell main {
  max-width: none;
  padding: 32px;
}
.download-progress {
  font-size: 13px;
  color: #74866a;
  margin: 20px 0;
  overflow-wrap: anywhere;
}
.download-indicator {
  height: 5px;
  background: linear-gradient(90deg, #cdddc2, #315f45, #cdddc2);
  border-radius: 5px;
  animation: pulse 1.5s ease-in-out infinite;
}
.download-selection {
  border: 1px solid #e1e7db;
  background: white;
  border-radius: 10px;
  padding: 18px;
  margin-top: 25px;
}
.download-selection p {
  font-size: 12px;
  color: #85947b;
  overflow-wrap: anywhere;
  margin-top: 10px;
}
.download-selection ul {
  font:
    12px/1.9 ui-monospace,
    monospace;
  padding-left: 18px;
  max-height: 220px;
  overflow: auto;
  overflow-wrap: anywhere;
}
.download-footnote {
  color: #93a08b;
  font-size: 11px;
  line-height: 1.9;
  margin-top: 20px;
}
@keyframes pulse {
  50% {
    opacity: 0.4;
  }
}
@media (max-width: 600px) {
  .download-shell {
    margin: 0;
    border-radius: 0;
    border: 0;
  }
  .download-shell main {
    padding: 25px 18px;
  }
}
</style>
