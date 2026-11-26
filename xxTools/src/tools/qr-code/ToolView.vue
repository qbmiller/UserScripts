<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import QRCodeStyling, { type Options } from "qr-code-styling";
import {
  qrStyles,
  normalizeQrStyle,
  buildQrOptions,
  dotShapes,
  cornerShapes,
  centerShapes,
} from "./styles.mjs";
const input = ref("");
const correction = ref("M");
const size = ref(512);
const style = reactive(normalizeQrStyle(qrStyles[0].config));
const activePreset = ref("classic");
const savedStyle = ref<ReturnType<typeof normalizeQrStyle> | null>(null);
const savedMessage = ref("");
const result = ref("");
const svgResult = ref("");
const error = ref("");
const busy = ref(false);
const hasGenerated = ref(false);
let revision = 0;
let previewTimer: ReturnType<typeof setTimeout> | undefined;
let presetChange = false;
const storageKey = "toolbox.qrCustomStyle";
const hasStorage = typeof chrome !== "undefined" && !!chrome.storage?.local;
onMounted(async () => {
  try {
    const value = hasStorage
      ? (await chrome.storage.local.get(storageKey))[storageKey]
      : JSON.parse(localStorage.getItem(storageKey) || "null");
    if (value) savedStyle.value = normalizeQrStyle(value);
  } catch {
    savedMessage.value = "保存的样式暂时无法读取，仍可自由调配。";
  }
});
function usePreset(id: string, config: ReturnType<typeof normalizeQrStyle>) {
  presetChange = true;
  Object.assign(style, config);
  activePreset.value = id;
  savedMessage.value = "";
  presetChange = false;
}
watch(
  style,
  () => {
    if (!presetChange) activePreset.value = "custom";
    savedMessage.value = "";
  },
  { flush: "sync" },
);
watch(
  [input, correction, size, style],
  () => {
    revision++;
    busy.value = false;
    result.value = "";
    svgResult.value = "";
    error.value = "";
    clearTimeout(previewTimer);
    if (hasGenerated.value && input.value.trim())
      previewTimer = setTimeout(() => {
        void generate();
      }, 350);
  },
  { deep: true, flush: "sync" },
);
function blobUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("无法生成二维码图片。"));
    reader.readAsDataURL(blob);
  });
}
async function generate() {
  clearTimeout(previewTimer);
  const current = ++revision;
  result.value = "";
  svgResult.value = "";
  error.value = "";
  if (!input.value.trim()) {
    busy.value = false;
    error.value = "请输入文字或链接。";
    return;
  }
  hasGenerated.value = true;
  busy.value = true;
  try {
    const qr = new QRCodeStyling(
      buildQrOptions(
        input.value,
        style,
        size.value,
        correction.value,
      ) as Options,
    );
    const [png, svg] = await Promise.all([
      qr.getRawData("png"),
      qr.getRawData("svg"),
    ]);
    if (!(png instanceof Blob) || !(svg instanceof Blob))
      throw new Error("二维码图片生成失败。");
    const [pngUrl, svgUrl] = await Promise.all([blobUrl(png), blobUrl(svg)]);
    if (current === revision) {
      result.value = pngUrl;
      svgResult.value = svgUrl;
    }
  } catch {
    if (current === revision)
      error.value = "生成失败，内容可能过长，请减少文字或降低纠错等级。";
  } finally {
    if (current === revision) busy.value = false;
  }
}
async function saveStyle() {
  const value = normalizeQrStyle(style);
  try {
    if (hasStorage) await chrome.storage.local.set({ [storageKey]: value });
    else localStorage.setItem(storageKey, JSON.stringify(value));
    savedStyle.value = value;
    savedMessage.value = "已保存，可通过“我的样式”再次使用。";
  } catch {
    savedMessage.value = "保存失败，请重试。";
  }
}
onBeforeUnmount(() => {
  revision++;
  clearTimeout(previewTimer);
});
</script>
<template>
  <p class="tool-intro">
    本地生成二维码，支持中文。可选预设或自由调配，生成后修改设置会自动更新预览。
  </p>
  <label class="input-label" for="qr-input">二维码内容</label
  ><textarea
    id="qr-input"
    v-model="input"
    placeholder="输入文字或粘贴链接…"
    spellcheck="false"
  />
  <section class="qr-style-section" aria-label="二维码样式">
    <h2>选择样式</h2>
    <div class="qr-presets">
      <button
        v-for="preset in qrStyles"
        :key="preset.id"
        :aria-pressed="activePreset === preset.id"
        :class="{ selected: activePreset === preset.id }"
        @click="usePreset(preset.id, preset.config)"
      >
        <span
          class="preset-swatch"
          :style="{
            background: preset.config.gradient
              ? `linear-gradient(135deg, ${preset.config.color}, ${preset.config.color2})`
              : preset.config.color,
          }"
          >▦</span
        >{{ preset.name }}
      </button>
      <button
        v-if="savedStyle"
        :aria-pressed="activePreset === 'saved'"
        :class="{ selected: activePreset === 'saved' }"
        @click="usePreset('saved', savedStyle)"
      >
        <span class="preset-swatch" :style="{ background: savedStyle.color }"
          >★</span
        >我的样式
      </button>
    </div>
  </section>
  <details class="qr-custom">
    <summary>
      自由调配{{ activePreset === "custom" ? " · 自定义" : "" }}
    </summary>
    <div class="qr-options">
      <label
        >码点形状<select v-model="style.dots" aria-label="码点形状">
          <option v-for="[key, label] in dotShapes" :key="key" :value="key">
            {{ label }}
          </option>
        </select></label
      ><label
        >定位框<select v-model="style.corner" aria-label="定位框">
          <option v-for="[key, label] in cornerShapes" :key="key" :value="key">
            {{ label }}
          </option>
        </select></label
      ><label
        >定位中心<select v-model="style.center" aria-label="定位中心">
          <option v-for="[key, label] in centerShapes" :key="key" :value="key">
            {{ label }}
          </option>
        </select></label
      >
    </div>
    <div class="qr-options color-options">
      <label
        >前景色<input
          v-model="style.color"
          type="color"
          aria-label="前景色" /></label
      ><label
        >背景色<input
          v-model="style.background"
          type="color"
          aria-label="背景色" /></label
      ><label class="gradient-toggle"
        ><input v-model="style.gradient" type="checkbox" />启用渐变</label
      >
    </div>
    <div v-if="style.gradient" class="qr-options">
      <label
        >渐变终点色<input
          v-model="style.color2"
          type="color"
          aria-label="渐变终点色" /></label
      ><label
        >渐变方向 {{ style.rotation }}°<input
          v-model.number="style.rotation"
          type="range"
          min="0"
          max="360"
          step="15"
          aria-label="渐变方向"
      /></label>
    </div>
    <p class="qr-hint">
      建议深色码点搭配浅色背景，下载后用手机确认能正常扫码。
    </p>
    <button class="secondary-button" @click="saveStyle">保存我的样式</button>
    <p v-if="savedMessage" class="qr-hint" role="status">{{ savedMessage }}</p>
  </details>
  <div class="qr-options">
    <label
      >纠错等级<select v-model="correction" aria-label="纠错等级">
        <option value="L">L · 7%</option>
        <option value="M">M · 15%</option>
        <option value="Q">Q · 25%</option>
        <option value="H">H · 30%</option>
      </select></label
    ><label
      >图片尺寸<select v-model="size" aria-label="图片尺寸">
        <option :value="256">256 × 256</option>
        <option :value="512">512 × 512</option>
        <option :value="1024">1024 × 1024</option>
      </select></label
    >
  </div>
  <button class="primary-button full-width" :disabled="busy" @click="generate">
    {{ busy ? "正在生成…" : "生成二维码" }}
  </button>
  <p v-if="error" class="error-message" role="alert">{{ error }}</p>
  <section v-if="result" class="qr-result" aria-label="二维码结果">
    <img :src="result" alt="生成的二维码" />
    <div class="qr-downloads">
      <a class="secondary-button" :href="result" download="xxtools-qrcode.png"
        >下载 PNG</a
      ><a
        class="secondary-button"
        :href="svgResult"
        download="xxtools-qrcode.svg"
        >下载 SVG</a
      >
    </div>
  </section>
</template>
<style scoped>
.qr-style-section {
  margin: 20px 0;
}
.qr-style-section h2 {
  margin-bottom: 10px;
}
.qr-presets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 8px;
}
.qr-presets button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 6px;
  border: 1px solid #dce4d5;
  border-radius: 9px;
  background: white;
  font-size: 11px;
}
.qr-presets button.selected {
  border-color: #467553;
  background: #eaf2e8;
}
.preset-swatch {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: white;
  font-size: 26px;
}
.qr-custom {
  border: 1px solid #dce4d5;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}
summary {
  cursor: pointer;
  font-size: 12px;
}
.qr-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}
.qr-options label {
  flex: 1;
  min-width: 70px;
  font-size: 12px;
}
select {
  display: block;
  width: 100%;
  margin-top: 8px;
  border: 1px solid #dce4d5;
  border-radius: 8px;
  padding: 10px 6px;
  background: white;
  color: inherit;
}
input[type="color"] {
  display: block;
  width: 100%;
  height: 34px;
  padding: 2px;
  margin-top: 8px;
  border: 1px solid #dce4d5;
  border-radius: 6px;
  background: white;
}
input[type="range"] {
  display: block;
  width: 100%;
  margin-top: 12px;
}
.gradient-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
}
.qr-hint {
  color: #8c9786;
  font-size: 11px;
  margin: 12px 0;
}
.qr-result {
  text-align: center;
  margin-top: 20px;
}
.qr-result img {
  display: block;
  width: 100%;
  max-width: 320px;
  height: auto;
  margin: 0 auto 16px;
  border-radius: 10px;
}
.qr-downloads {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
a {
  display: inline-block;
  text-decoration: none;
}
</style>
