import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  vite: () => ({
    worker: { format: "es" },
    optimizeDeps: {
      exclude: ["@jsquash/jpeg", "@jsquash/webp", "@jsquash/oxipng"],
    },
  }),
  manifest: {
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    name: "xxTools",
    description:
      "侧边栏工具箱：知乎文章目录、公众号阅读增强、GitHub 勾选下载、挂起标签恢复、JSON 格式化、加解码。",
    minimum_chrome_version: "116",
    permissions: [
      "tabs",
      "storage",
      "sidePanel",
      "downloads",
      "bookmarks",
      "alarms",
    ],
    host_permissions: [
      "https://api.github.com/*",
      "https://httpbin.org/*",
      "https://cloudflare-dns.com/*",
      "https://cf.xiaomi318.com/*",
    ],
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    action: {
      default_title: "打开xxTools工具箱",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        128: "icon/128.png",
      },
    },
  },
});
