<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import JSZip from "jszip";
import {
  createCompressor,
  type CompressionOptions,
  type CompressionResult,
} from "./client";
import { MAX_FILE_BYTES, outputName, imageDimensions } from "./model.mjs";

type Item = {
  id: number;
  file: File;
  originalUrl: string;
  outputUrl?: string;
  result?: CompressionResult;
  status: "ready" | "working" | "done" | "error" | "cancelled";
  message: string;
};
const items = ref<Item[]>([]);
const options = ref<CompressionOptions>({
  format: "original",
  quality: 80,
  maxEdge: 0,
});
const selectedId = ref<number>();
const selected = computed(() =>
  items.value.find((item) => item.id === selectedId.value),
);
const busy = ref(false);
const adding = ref(false);
const zipping = ref(false);
const dragging = ref(false);
const notice = ref("");
const completed = ref(0);
const input = ref<HTMLInputElement>();
const results = computed(() => items.value.filter((item) => item.result));
const compressor = createCompressor();
let nextId = 0;
let revision = 0;
let disposed = false;
const downloadUrls = new Map<string, ReturnType<typeof setTimeout>>();
const bytes = (value: number) =>
  value < 1024
    ? `${value} B`
    : value < 1024 * 1024
      ? `${(value / 1024).toFixed(1)} KiB`
      : `${(value / 1024 / 1024).toFixed(2)} MiB`;
function savings(item: Item) {
  if (!item.result) return "";
  const ratio = (1 - item.result.blob.size / item.file.size) * 100;
  return ratio >= 0
    ? `减小 ${ratio.toFixed(1)}%`
    : `增大 ${(-ratio).toFixed(1)}%，建议保留原图或改用 WebP`;
}
async function add(files: File[]) {
  if (busy.value || zipping.value || adding.value) return;
  adding.value = true;
  const rejected: string[] = [];
  let total = items.value.reduce((size, item) => size + item.file.size, 0);
  try {
    for (const file of files) {
      if (items.value.length >= 50 || total + file.size > 200 * 1024 * 1024) {
        rejected.push("队列最多 50 张、原图合计不超过 200 MiB");
        break;
      }
      if (!file.size || file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name}：单张需大于 0 且不超过 40 MiB`);
        continue;
      }
      const item: Item = {
        id: ++nextId,
        file,
        originalUrl: "",
        status: "ready",
        message: "等待处理",
      };
      try {
        imageDimensions(await file.arrayBuffer());
        if (disposed) return;
        item.originalUrl = URL.createObjectURL(file);
      } catch (error) {
        if (disposed) return;
        item.status = "error";
        item.message =
          error instanceof Error ? error.message : "无法读取图片。";
      }
      items.value.push(item);
      selectedId.value ??= item.id;
      total += file.size;
    }
    notice.value = [...new Set(rejected)].join("；");
  } finally {
    adding.value = false;
  }
}
function choose(event: Event) {
  const element = event.target as HTMLInputElement;
  add(Array.from(element.files || []));
  element.value = "";
}
function drop(event: DragEvent) {
  dragging.value = false;
  add(Array.from(event.dataTransfer?.files || []));
}
function releaseOutput(item: Item) {
  if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
  item.outputUrl = undefined;
  item.result = undefined;
}
watch(
  options,
  () => {
    for (const item of items.value) {
      releaseOutput(item);
      item.status = "ready";
      item.message = "参数已更新，等待处理";
    }
    completed.value = 0;
  },
  { deep: true },
);
async function run() {
  if (busy.value || zipping.value || adding.value || !items.value.length)
    return;
  if (
    !Number.isFinite(options.value.maxEdge) ||
    options.value.maxEdge < 0 ||
    (options.value.maxEdge > 0 && options.value.maxEdge < 1)
  ) {
    notice.value = "最长边请输入正整数，或填 0 保持尺寸。";
    return;
  }
  const settings = {
    ...options.value,
    maxEdge: Math.floor(options.value.maxEdge),
  };
  busy.value = true;
  completed.value = 0;
  notice.value = "";
  const current = ++revision;
  for (const item of items.value) {
    releaseOutput(item);
    item.status = "ready";
    item.message = "等待处理";
  }
  for (const item of items.value) {
    if (current !== revision) break;
    item.status = "working";
    item.message = "准备处理";
    try {
      const result = await compressor.compress(item.file, settings, (stage) => {
        item.message = stage;
      });
      if (current !== revision) break;
      item.result = result;
      item.outputUrl = URL.createObjectURL(result.blob);
      item.status = "done";
      item.message = "已完成";
    } catch (error) {
      if (current !== revision) break;
      item.status = "error";
      item.message = error instanceof Error ? error.message : "处理失败";
    }
    completed.value++;
  }
  if (current === revision) busy.value = false;
}
function cancel() {
  revision++;
  compressor.cancel();
  busy.value = false;
  for (const item of items.value) {
    if (item.status === "ready" || item.status === "working") {
      item.status = "cancelled";
      item.message = "已取消，可重新压缩";
    }
  }
}
function remove(id: number) {
  if (busy.value || zipping.value || adding.value) return;
  const item = items.value.find((row) => row.id === id);
  if (!item) return;
  URL.revokeObjectURL(item.originalUrl);
  releaseOutput(item);
  items.value = items.value.filter((row) => row.id !== id);
  if (selectedId.value === id) selectedId.value = items.value[0]?.id;
}
function clear() {
  if (zipping.value || adding.value) return;
  cancel();
  for (const item of [...items.value]) remove(item.id);
  completed.value = 0;
  notice.value = "";
}
function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  const timer = setTimeout(() => {
    URL.revokeObjectURL(url);
    downloadUrls.delete(url);
  }, 60_000);
  downloadUrls.set(url, timer);
}
function download(item: Item) {
  if (item.result)
    save(
      item.result.blob,
      outputName(item.file.name, item.result.format, item.id),
    );
}
async function downloadZip() {
  if (zipping.value || busy.value || !results.value.length) return;
  zipping.value = true;
  notice.value = "";
  try {
    const zip = new JSZip();
    for (const item of results.value)
      zip.file(
        outputName(item.file.name, item.result!.format, item.id),
        item.result!.blob,
      );
    const blob = await zip.generateAsync({
      type: "blob",
      compression: "STORE",
    });
    if (!disposed) save(blob, "xxTools-images.zip");
  } catch {
    if (!disposed) notice.value = "ZIP 打包失败，可尝试逐张下载。";
  } finally {
    zipping.value = false;
  }
}
onBeforeUnmount(() => {
  disposed = true;
  cancel();
  for (const item of items.value) {
    URL.revokeObjectURL(item.originalUrl);
    releaseOutput(item);
  }
  for (const [url, timer] of downloadUrls) {
    clearTimeout(timer);
    URL.revokeObjectURL(url);
  }
});
</script>

<template>
  <div class="image-compressor">
    <p class="tool-intro">把图片变轻一点。所有处理都在本机完成，无需上传。</p>
    <div
      class="image-drop"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="drop"
    >
      <span class="drop-symbol" aria-hidden="true">▧</span>
      <strong>拖入图片，或选择文件</strong>
      <p>静态 JPG / PNG / WebP · 每张 ≤ 40 MiB</p>
      <button
        class="primary-button"
        :disabled="busy || zipping || adding"
        @click="input?.click()"
      >
        选择图片
      </button>
      <input
        ref="input"
        class="file-input"
        type="file"
        :disabled="busy || zipping || adding"
        multiple
        accept="image/jpeg,image/png,image/webp"
        aria-label="选择要压缩的图片"
        @change="choose"
      />
    </div>
    <fieldset class="image-settings" :disabled="busy || zipping || adding">
      <legend>压缩设置</legend>
      <label
        >输出格式
        <select v-model="options.format" aria-label="输出格式">
          <option value="original">保持原格式</option>
          <option value="webp">WebP · 体积优先</option>
          <option value="jpeg">JPG · 白色背景</option>
          <option value="png">PNG · 无损编码</option>
        </select>
      </label>
      <label
        >JPG / WebP 质量 <span>{{ options.quality }}</span>
        <input
          v-model.number="options.quality"
          type="range"
          min="1"
          max="100"
          :disabled="options.format === 'png'"
          aria-label="压缩质量"
        />
      </label>
      <label
        >最长边（像素，0 保持尺寸）
        <input
          v-model.number="options.maxEdge"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          aria-label="最长边"
        />
      </label>
      <p>
        默认保持尺寸，不放大小图。JPG / WebP 为有损编码；PNG
        原尺寸优化保留像素，质量滑块不影响 PNG。转 JPG 时透明区域填白。
      </p>
    </fieldset>
    <p v-if="adding" role="status">正在检查图片尺寸…</p>
    <p v-if="notice" class="error-message" role="alert">{{ notice }}</p>
    <div class="image-actions">
      <button
        class="primary-button"
        :disabled="!items.length || busy || zipping || adding"
        @click="run"
      >
        {{ results.length ? "重新压缩" : "开始压缩" }}
      </button>
      <button v-if="busy" class="secondary-button" @click="cancel">取消</button>
      <button
        class="secondary-button"
        :disabled="!results.length || busy || zipping || adding"
        @click="downloadZip"
      >
        {{
          zipping
            ? "正在打包…"
            : `下载 ZIP${results.length ? ` (${results.length})` : ""}`
        }}
      </button>
      <button
        class="secondary-button"
        :disabled="!items.length || busy || zipping || adding"
        @click="clear"
      >
        清空
      </button>
    </div>
    <div v-if="busy" class="image-progress" role="status" aria-live="polite">
      <span
        >正在处理 {{ Math.min(completed + 1, items.length) }} /
        {{ items.length }} 张</span
      >
      <progress
        :value="completed"
        :max="items.length"
        aria-label="批量压缩进度"
      ></progress>
    </div>
    <p v-else-if="items.length" class="queue-summary" role="status">
      {{ items.length }} 张图片 · {{ results.length }} 张已完成
    </p>
    <ul v-if="items.length" class="image-queue" aria-label="图片队列">
      <li
        v-for="item in items"
        :key="item.id"
        :class="{ selected: selectedId === item.id }"
      >
        <button
          class="image-row"
          :aria-pressed="selectedId === item.id"
          @click="selectedId = item.id"
        >
          <strong>{{ item.file.name }}</strong>
          <span
            >{{ bytes(item.file.size)
            }}<template v-if="item.result">
              → {{ bytes(item.result.blob.size) }} · {{ item.result.width }} ×
              {{ item.result.height }}</template
            ></span
          >
          <small
            :class="{
              warning: item.result && item.result.blob.size > item.file.size,
              failure: item.status === 'error',
            }"
            >{{ item.result ? savings(item) : item.message }}</small
          >
        </button>
        <div class="row-actions">
          <button
            v-if="item.result"
            class="secondary-button"
            :aria-label="`下载 ${item.file.name}`"
            @click="download(item)"
          >
            下载
          </button>
          <button
            class="icon-button"
            :disabled="busy || zipping || adding"
            :aria-label="`移除 ${item.file.name}`"
            @click="remove(item.id)"
          >
            ×
          </button>
        </div>
      </li>
    </ul>
    <section v-if="selected" class="image-preview" aria-label="图片对比预览">
      <h2>{{ selected.file.name }}</h2>
      <div class="preview-grid">
        <figure>
          <figcaption>原图 · {{ bytes(selected.file.size) }}</figcaption>
          <div class="checkerboard">
            <img
              :src="selected.originalUrl"
              v-if="selected.originalUrl"
              alt="原图预览"
            />
          </div>
        </figure>
        <figure v-if="selected.result">
          <figcaption>结果 · {{ bytes(selected.result.blob.size) }}</figcaption>
          <div class="checkerboard">
            <img :src="selected.outputUrl" alt="压缩后预览" />
          </div>
        </figure>
      </div>
    </section>
    <p class="image-footnote">
      最多 50 张、原图合计 ≤ 200 MiB，单张 ≤ 3200 万像素。暂不支持 GIF、APNG
      和动画 WebP。重新编码通常会移除 EXIF 等元数据，重要原图请保留。
    </p>
  </div>
</template>

<style scoped>
.image-compressor {
  display: grid;
  gap: 16px;
}
.image-drop {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 24px 14px;
  border: 1px dashed #a6bfb0;
  border-radius: 14px;
  background: #f4f8f5;
  text-align: center;
}
.image-drop.dragging {
  background: #e3eee6;
  border-color: #315f45;
}
.drop-symbol {
  font-size: 30px;
  color: #315f45;
}
.image-drop p,
.image-settings p,
.image-footnote,
.queue-summary {
  margin: 0;
  font-size: 12px;
  color: #68736c;
  line-height: 1.7;
}
.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}
.image-settings {
  min-width: 0;
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e1e7e2;
  border-radius: 12px;
}
.image-settings legend {
  padding: 0 6px;
  font-weight: 600;
  font-size: 13px;
}
.image-settings label {
  display: grid;
  gap: 8px;
  font-size: 13px;
}
.image-settings label span {
  font-variant-numeric: tabular-nums;
}
.image-settings input:not([type="range"]),
.image-settings select {
  width: 100%;
  min-height: 38px;
  padding: 7px 10px;
  border: 1px solid #d6ded8;
  border-radius: 7px;
  background: white;
  color: inherit;
  box-sizing: border-box;
}
input[type="range"],
progress {
  width: 100%;
  accent-color: #315f45;
}
.image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.image-progress {
  display: grid;
  gap: 8px;
  font-size: 12px;
}
.image-queue {
  display: grid;
  gap: 8px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.image-queue li {
  display: flex;
  gap: 6px;
  align-items: center;
  border: 1px solid #e0e6e1;
  border-radius: 10px;
  padding: 10px;
}
.image-queue li.selected {
  border-color: #729982;
  background: #f6f9f6;
}
.image-row {
  display: grid;
  gap: 5px;
  text-align: left;
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  color: inherit;
  cursor: pointer;
  padding: 2px;
}
.image-row strong {
  overflow-wrap: anywhere;
  font-size: 13px;
}
.image-row span,
.image-row small {
  font-size: 11px;
  color: #68736c;
}
.image-row .warning {
  color: #916011;
}
.image-row .failure {
  color: #b44237;
}
.row-actions {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}
.image-preview h2 {
  font-size: 13px;
  overflow-wrap: anywhere;
  margin: 0 0 12px;
}
.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
figure {
  margin: 0;
  min-width: 0;
}
figcaption {
  font-size: 11px;
  color: #68736c;
  margin-bottom: 8px;
}
.checkerboard {
  border: 1px solid #e1e7e2;
  border-radius: 8px;
  overflow: hidden;
  background: conic-gradient(#eee 25%, white 0 50%, #eee 0 75%, white 0) 0 0 /
    16px 16px;
  min-height: 80px;
  display: grid;
  place-items: center;
}
.checkerboard img {
  display: block;
  max-width: 100%;
  max-height: 230px;
  object-fit: contain;
}
button:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
