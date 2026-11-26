import {
  parse,
  converter,
  formatHex,
  formatRgb,
  formatHsl,
  clampRgb,
} from "culori";
export function convertColor(input) {
  const parsed = parse(input.trim());
  if (!parsed)
    throw new Error(
      "请输入有效颜色，例如 #315f45、rgb(49, 95, 69) 或 hsl(146, 32%, 28%)。",
    );
  const rgb = converter("rgb")(parsed);
  if (![rgb.r, rgb.g, rgb.b, rgb.alpha ?? 1].every(Number.isFinite))
    throw new Error("颜色值不完整，请填写完整的颜色分量。");
  const color = clampRgb(rgb);
  return {
    hex: formatHex(color),
    rgb: formatRgb(color),
    hsl: formatHsl(color),
    alpha: color.alpha ?? 1,
  };
}
