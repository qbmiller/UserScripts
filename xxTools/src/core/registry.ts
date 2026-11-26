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
