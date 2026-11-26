import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    name: "拾用 · 浏览器工具箱",
    description:
      "侧边栏工具箱：GitHub 勾选下载、挂起标签恢复、JSON 格式化、URL 编解码。",
    minimum_chrome_version: "116",
    permissions: ["tabs", "storage", "sidePanel", "downloads", "bookmarks"],
    host_permissions: ["https://api.github.com/*"],
    action: { default_title: "打开拾用工具箱" },
  },
});
