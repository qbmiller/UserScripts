import { convertColor } from "./color.mjs";

export const COLOR_HISTORY_KEY = "toolbox.colorHistory";
export function normalizeColorHistory(value) {
  const result = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (typeof item !== "string") continue;
    try {
      const canonical = convertColor(item).rgb;
      if (!result.includes(canonical)) result.push(canonical);
    } catch {
      /* Ignore invalid stored colors. */
    }
    if (result.length === 10) break;
  }
  return result;
}
export function rememberColor(history, value) {
  return normalizeColorHistory([value, ...normalizeColorHistory(history)]);
}
