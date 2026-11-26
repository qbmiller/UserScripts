import type { Component } from "vue";

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  keywords: string[];
  processing: "local";
  load: () => Promise<{ default: Component }>;
}
export const tools: ToolDefinition[] = [
  {
    id: "zhihu-reader",
    title: "知乎阅读增强",
    description: "专栏文章目录、章节跳转与阅读位置高亮",
    category: "浏览器",
    icon: "☷",
    keywords: ["知乎", "zhihu", "专栏", "阅读", "目录", "章节"],
    processing: "local",
    load: () => import("../tools/zhihu-toc/ToolView.vue"),
  },
  {
    id: "wechat-reader",
    title: "公众号阅读增强",
    description: "文章目录、图片放大，让公众号更好读",
    category: "浏览器",
    icon: "☷",
    keywords: ["微信", "公众号", "wechat", "阅读", "目录", "图片", "链接"],
    processing: "local",
    load: () => import("../tools/wechat-reader/ToolView.vue"),
  },
  {
    id: "github-download",
    title: "GitHub 勾选下载",
    description: "选中文件与文件夹，打包下载 ZIP",
    category: "开发",
    icon: "↓",
    keywords: ["github", "gitzip", "zip", "下载", "文件夹", "仓库"],
    processing: "local",
    load: () => import("../tools/github-download/ToolView.vue"),
  },
  {
    id: "tab-restore",
    title: "挂起标签恢复",
    description: "找回被挂起链接藏住的网页",
    category: "浏览器",
    icon: "↗",
    keywords: ["session", "buddy", "标签", "恢复", "tab"],
    processing: "local",
    load: () => import("../tools/tab-restore/ToolView.vue"),
  },
  {
    id: "json",
    title: "JSON 格式化",
    description: "美化、压缩与校验，一目了然",
    category: "开发",
    icon: "{}",
    keywords: ["json", "format", "格式化", "压缩", "校验"],
    processing: "local",
    load: () => import("../tools/json/ToolView.vue"),
  },
  {
    id: "url-codec",
    title: "URL 编解码",
    description: "让链接与文字自由转换",
    category: "开发",
    icon: "%",
    keywords: ["url", "encode", "decode", "链接", "编码", "解码"],
    processing: "local",
    load: () => import("../tools/url-codec/ToolView.vue"),
  },
];
export function searchTools(query: string, category = "全部") {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return tools.filter(
    (tool) =>
      (category === "全部" || tool.category === category) &&
      terms.every((term) =>
        [tool.title, tool.description, ...tool.keywords]
          .join(" ")
          .toLocaleLowerCase()
          .includes(term),
      ),
  );
}
