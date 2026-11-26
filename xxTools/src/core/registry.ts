import type { Component } from "vue";

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  keywords: string[];
  processing: "local" | "network";
  comingSoon?: boolean;
  load: () => Promise<{ default: Component }>;
}
export const tools: ToolDefinition[] = [
  {
    id: "color-picker",
    title: "取色器",
    description: "屏幕取色 / HEX · RGB · HSL",
    category: "设计",
    icon: "🎨",
    keywords: ["颜色", "color", "hex", "rgb", "hsl", "取色"],
    processing: "local",
    load: () => import("../tools/color-picker/ToolView.vue"),
  },
  {
    id: "qr-code",
    title: "QR Code",
    description: "本地生成二维码 / 下载 PNG",
    category: "设计",
    icon: "▦",
    keywords: ["qr", "二维码", "qrcode", "链接"],
    processing: "local",
    load: () => import("../tools/qr-code/ToolView.vue"),
  },
  {
    id: "html-format",
    title: "HTML 格式化",
    description: "HTML / CSS / JS 美化压缩",
    category: "文本",
    icon: "</>",
    keywords: ["html", "css", "js", "javascript", "美化", "压缩"],
    processing: "local",
    load: () => import("../tools/html-format/ToolView.vue"),
  },

  {
    id: "json-yaml",
    title: "JSON / YAML / Properties 互转",
    description: "三种配置格式任意互转",
    category: "开发",
    icon: "🔄",
    keywords: ["json", "yaml", "yml", "properties", "property", "配置", "互转"],
    processing: "local",
    load: () => import("../tools/config-convert/ToolView.vue"),
  },
  {
    id: "base64",
    title: "加解码",
    description: "Unicode / UTF-8 / URL / Hex / BASE 等",
    category: "开发",
    icon: "🔐",
    keywords: [
      "base64",
      "base64url",
      "base32",
      "base16",
      "base58",
      "base62",
      "unicode",
      "utf8",
      "utf-8",
      "url",
      "url 编解码",
      "url编解码",
      "url编码",
      "url解码",
      "编解码",
      "链接",
      "encode",
      "decode",
      "hex",
      "ascii",
      "native",
      "编码",
      "解码",
      "加解码",
    ],
    processing: "local",
    load: () => import("../tools/base64/ToolView.vue"),
  },
  {
    id: "jwt",
    title: "JWT 解析",
    description: "查看 Header、Payload 与过期时间",
    category: "开发",
    icon: "🪪",
    keywords: ["jwt", "token", "bearer", "令牌", "解析", "过期"],
    processing: "local",
    load: () => import("../tools/jwt/ToolView.vue"),
  },
  {
    id: "timestamp",
    title: "时间戳转换",
    description: "Unix 秒 / 毫秒与日期双向转换",
    category: "开发",
    icon: "◷",
    keywords: ["timestamp", "unix", "时间戳", "日期", "时间", "utc", "iso"],
    processing: "local",
    load: () => import("../tools/timestamp/ToolView.vue"),
  },
  {
    id: "dns",
    title: "DNS 查询",
    description: "A / AAAA / CNAME / MX / TXT",
    category: "网络",
    icon: "🌍",
    keywords: ["dns", "域名", "解析", "cloudflare", "doh", "ipv6"],
    processing: "network",
    load: () => import("../tools/dns/ToolView.vue"),
  },
  {
    id: "request-headers",
    title: "请求头查看",
    description: "查看你的请求头",
    category: "网络",
    icon: "📡",
    keywords: ["headers", "http", "请求头", "user-agent", "httpbin"],
    processing: "network",
    load: () => import("../tools/request-headers/ToolView.vue"),
  },
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
];
tools.push({
  id: "word-count",
  title: "字数统计",
  description: "字符 / 词 / 行",
  category: "文本",
  icon: "🔢",
  keywords: ["word-count", "统计字数", "字数", "字符", "单词", "行数"],
  processing: "local",
  load: () => import("../tools/word-count/ToolView.vue"),
});
tools.push({
  id: "password-generator",
  title: "密码生成",
  description: "强随机密码 / 长度与字符类型自选",
  category: "其他",
  icon: "🔑",
  keywords: ["password", "密码", "随机", "生成", "安全"],
  processing: "local",
  load: () => import("../tools/password-generator/ToolView.vue"),
});
// 只登记入口，不加载尚未实现的引擎，也不申请额外权限。
const plannedTools = [
  ["image-compress", "图片压缩", "JPG / PNG / WebP", "图片", "🖼️"],
  ["ocr", "OCR", "图片文字识别", "图片", "🔍"],
  ["image-download", "图片批量下载", "挑选网页图片批量保存", "图片", "📥"],
  ["watermark-remove", "去水印", "图片水印处理", "图片", "💧"],
  ["pdf-merge", "PDF 合并", "多个 PDF 合成一个", "PDF", "📄"],
  ["pdf-split", "PDF 拆分", "按页码范围拆分", "PDF", "✂️"],
  ["pdf-compress", "PDF 压缩", "结构优化减小体积", "PDF", "🗜️"],
  ["pdf-images", "PDF 转图片", "导出为 PNG / JPG", "PDF", "🖼️"],
  ["images-pdf", "图片转 PDF", "将多张图片合成 PDF", "PDF", "📑"],
  ["markdown-preview", "Markdown 预览", "实时渲染", "文本", "📝"],
  ["ai-summary", "AI 总结", "总结选中文本或当前页面", "AI", "🤖"],
  ["translate", "翻译", "划词 / 整页多语互译", "AI", "🌐"],
  ["text-polish", "文本润色", "清理空行与冗余空格", "AI", "✨"],
  ["screen-capture", "网页截图/录屏", "整页 / 区域截图与录屏", "设计", "📸"],
  ["unit-convert", "单位换算", "长度 / 重量 / 温度 / 数据", "其他", "📊"],
] as const;
for (const [id, title, description, category, icon] of plannedTools) {
  tools.push({
    id,
    title,
    description,
    category,
    icon,
    keywords: [id, title, description],
    processing: "local",
    comingSoon: true,
    load: () => import("../components/ComingSoon.vue"),
  });
}
tools.push({
  id: "json-compress",
  title: "JSON 压缩",
  description: "移除空白字符，保留原始数据",
  category: "开发",
  icon: "{}",
  keywords: ["json", "压缩", "minify"],
  processing: "local",
  load: () => import("../tools/json/CompactView.vue"),
});
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
