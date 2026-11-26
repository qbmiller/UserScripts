<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ZHIHU_KEY, normalizeZhihuSettings } from "./settings.mjs";
const settings = ref(normalizeZhihuSettings(null));
const ready = ref(false);
const busy = ref(false);
const status = ref("");
const error = ref("");
const pageStatus = ref("正在检查当前文章…");
const checking = ref(false);
const canRefresh = ref(false);
const options = [
  {
    key: "enabled",
    title: "启用知乎阅读增强",
    description: "在知乎专栏文章页自动显示目录、跳转与阅读位置高亮",
  },
] as const;
onMounted(async () => {
  try {
    const data = await chrome.storage.local.get(ZHIHU_KEY);
    settings.value = normalizeZhihuSettings(data[ZHIHU_KEY]);
    ready.value = true;
    await checkPage();
  } catch {
    error.value = "请在已安装扩展的侧栏中打开此工具。";
  }
});
async function checkPage(refresh = false) {
  checking.value = true;
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    canRefresh.value =
      !!tab?.id &&
      !!tab.url?.match(/^https:\/\/zhuanlan\.zhihu\.com\/(?:[^/]+\/)?p\//);
    if (!canRefresh.value) {
      pageStatus.value = "请切换到知乎专栏文章，再点击检查。";
      return;
    }
    if (refresh) {
      pageStatus.value = "正在刷新文章并检查…";
      await chrome.tabs.reload(tab.id!);
    }
    for (let attempt = 0; attempt < (refresh ? 15 : 1); attempt++) {
      if (refresh) await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        const result = await chrome.tabs.sendMessage(tab.id!, {
          type: "toolbox.zhihu-reader-status",
        });
        if (!result) throw new Error("无状态响应");
        if (result.state === "loading" && refresh) continue;
        if (result.state === "error")
          pageStatus.value = `启动失败：${result.error}`;
        else if (result.state === "disabled")
          pageStatus.value = "当前文章的阅读增强已关闭。";
        else if (result.state === "loading")
          pageStatus.value = "阅读增强正在启动，请稍后检查。";
        else if (result.nativeToc)
          pageStatus.value =
            "文章已有知乎原生目录，已自动跳过插件目录，避免重叠。";
        else if (!result.article)
          pageStatus.value = "脚本已运行，但当前页面未检测到文章正文。";
        else if (!result.installed)
          pageStatus.value =
            "脚本已运行，正文需要至少两个可见的 h1–h4 标题才显示目录。";
        else
          pageStatus.value = result.headings
            ? `当前文章已生效，识别到 ${result.headings} 个章节。`
            : "当前文章已生效，但没有可识别的章节标题。";
        return;
      } catch {
        /* 文章刷新期间接收端可能暂时不存在。 */
      }
    }
    pageStatus.value =
      "当前页面未加载新版阅读脚本。请在扩展管理页重新加载xxTools、允许访问知乎网站，再刷新文章。";
  } catch {
    pageStatus.value = "无法检查当前页面，请确认扩展已启用并允许访问知乎网站。";
  } finally {
    checking.value = false;
  }
}
async function save(key: string, event: Event) {
  const previous = settings.value;
  const input = event.target as HTMLInputElement | HTMLSelectElement;
  const next = normalizeZhihuSettings({
    ...previous,
    [key]:
      input instanceof HTMLInputElement && input.type === "checkbox"
        ? input.checked
        : Number(input.value),
  });
  settings.value = next;
  busy.value = true;
  status.value = "";
  error.value = "";
  try {
    await chrome.storage.local.set({ [ZHIHU_KEY]: next });
  } catch {
    settings.value = previous;
    error.value = "保存失败，请重试。";
    busy.value = false;
    return;
  }
  try {
    const tabs = await chrome.tabs.query({
      url: "https://zhuanlan.zhihu.com/*",
    });
    await Promise.allSettled(
      tabs
        .filter((tab) => tab.id !== undefined)
        .map((tab) =>
          chrome.tabs.sendMessage(tab.id!, {
            type: "toolbox.zhihu-reader-update",
            settings: next,
          }),
        ),
    );
    status.value = "已保存。已有文章若未生效，请刷新页面。";
  } catch {
    status.value = "已保存，刷新知乎文章后生效。";
  } finally {
    busy.value = false;
  }
  await checkPage();
}
</script>
<template>
  <div class="callout">
    <span class="callout-icon">☷</span>
    <div>
      <strong>知乎，读起来更顺手</strong>
      <p>在知乎专栏文章页自动提供目录、章节跳转与阅读位置高亮。</p>
    </div>
  </div>
  <div class="reader-status">
    <strong>当前页面</strong>
    <p role="status">{{ pageStatus }}</p>
    <div class="reader-status-actions">
      <button
        class="secondary-button"
        :disabled="!ready || checking || busy"
        @click="checkPage()"
      >
        检查是否生效
      </button>
      <button
        v-if="canRefresh"
        class="secondary-button"
        :disabled="!ready || checking || busy"
        @click="checkPage(true)"
      >
        刷新文章并检查
      </button>
    </div>
  </div>
  <div class="reader-options">
    <label v-for="option in options" :key="option.key" class="reader-option">
      <span
        ><strong>{{ option.title }}</strong
        ><small>{{ option.description }}</small></span
      >
      <input
        type="checkbox"
        :checked="settings[option.key]"
        :disabled="
          !ready || busy || (option.key !== 'enabled' && !settings.enabled)
        "
        @change="save(option.key, $event)"
      />
    </label>
  </div>
  <p v-if="status" role="status" class="success-message">{{ status }}</p>
  <p v-if="error" role="alert" class="error-message">{{ error }}</p>
  <p class="reader-help">
    专栏正文至少有两个可见的 h1–h4
    标题时显示目录，窄窗口可折叠。设置仅保存在本机。安装或更新扩展后，请刷新已打开的文章。
  </p>
</template>
<style scoped>
.reader-status {
  padding: 14px;
  margin: 16px 0;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  font-size: 13px;
}
.reader-status p {
  line-height: 1.7;
  margin: 6px 0 12px;
}
.reader-status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.reader-options {
  display: grid;
  gap: 0;
}
.reader-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 0;
  border-bottom: 1px solid var(--border, #e5e7eb);
  cursor: pointer;
}
.reader-option strong {
  font-size: 14px;
}
.reader-option small {
  display: block;
  font-size: 12px;
  line-height: 1.6;
  opacity: 0.65;
  margin-top: 4px;
}
.reader-option input {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  accent-color: #315f45;
}
.reader-option select {
  width: 112px;
  flex-shrink: 0;
  padding: 8px;
  border: 1px solid var(--border, #dce5dd);
  border-radius: 8px;
  background: white;
  color: inherit;
  font: inherit;
}
.reader-help {
  font-size: 12px;
  line-height: 1.8;
  opacity: 0.65;
  margin-top: 20px;
}
</style>
