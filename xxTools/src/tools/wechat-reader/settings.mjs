export const READER_KEY = "wechatReader";
export const readerDefaults = Object.freeze({
  enabled: true,
  toc: true,
  images: true,
  links: true,
  hideBottomBar: false,
  tocFontSize: 14,
  articleFontSize: 0,
});
/** @returns {{enabled: boolean, toc: boolean, images: boolean, links: boolean, hideBottomBar: boolean, tocFontSize: number, articleFontSize: number}} */
export function normalizeReaderSettings(value) {
  const settings = Object.fromEntries(
    Object.entries(readerDefaults)
      .filter(([, fallback]) => typeof fallback === "boolean")
      .map(([key, fallback]) => [
        key,
        typeof value?.[key] === "boolean" ? value[key] : fallback,
      ]),
  );
  const size = (key, min, max) =>
    typeof value?.[key] === "number" && Number.isFinite(value[key])
      ? Math.min(max, Math.max(min, Math.round(value[key])))
      : readerDefaults[key];
  settings.tocFontSize = size("tocFontSize", 12, 24);
  settings.articleFontSize =
    value?.articleFontSize === 0 ? 0 : size("articleFontSize", 12, 32);
  return settings;
}

export function findTextLinks(text) {
  const matches = [];
  const pattern = /https?:\/\/[^\s<>"'\u3000-\u303f\uff00-\uffef]+/gi;
  for (const match of text.matchAll(pattern)) {
    let value = match[0].replace(/[.,;:!?]+$/, "");
    // 保留 URL 内配对括号，仅去掉包围链接的右括号。
    for (const [left, right] of [
      ["(", ")"],
      ["[", "]"],
      ["{", "}"],
    ]) {
      while (
        value.endsWith(right) &&
        value.split(right).length > value.split(left).length
      )
        value = value.slice(0, -1);
    }
    try {
      const url = new URL(value);
      if (["http:", "https:"].includes(url.protocol) && url.hostname)
        matches.push({ index: match.index, text: value, href: url.href });
    } catch {
      /* 无效网址保留原文。 */
    }
  }
  return matches;
}

export function imageSource(image) {
  for (const value of [
    image.getAttribute("data-src"),
    image.currentSrc,
    image.getAttribute("src"),
  ]) {
    if (!value) continue;
    try {
      const url = new URL(value, document.baseURI);
      if (["https:", "http:"].includes(url.protocol)) return url.href;
    } catch {
      /* 尝试下一来源。 */
    }
  }
  return null;
}
