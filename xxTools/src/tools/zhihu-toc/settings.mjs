export const ZHIHU_KEY = "zhihuReader";

export function normalizeZhihuSettings(value) {
  return { enabled: typeof value?.enabled === "boolean" ? value.enabled : true };
}
