export const dotShapes = [
  ["square", "方块"],
  ["dots", "圆点"],
  ["rounded", "圆角短条"],
  ["extra-rounded", "柔和圆角"],
  ["classy", "叶片"],
  ["classy-rounded", "圆润叶片"],
];
export const cornerShapes = [
  ["square", "方框"],
  ["extra-rounded", "圆角框"],
  ["dot", "圆环"],
];
export const centerShapes = [
  ["square", "方块"],
  ["dot", "圆点"],
];
const defaults = {
  dots: "square",
  corner: "square",
  center: "square",
  color: "#111111",
  background: "#ffffff",
  gradient: false,
  color2: "#24479f",
  rotation: 45,
};
export const qrStyles = [
  { id: "classic", name: "经典黑白", config: { ...defaults } },
  {
    id: "simple-gradient",
    name: "简约渐变",
    config: {
      ...defaults,
      dots: "rounded",
      corner: "extra-rounded",
      center: "dot",
      color: "#2199ad",
      color2: "#24479f",
      gradient: true,
    },
  },
  {
    id: "blue-dots",
    name: "蓝色圆点",
    config: {
      ...defaults,
      dots: "dots",
      corner: "dot",
      center: "dot",
      color: "#2455a4",
    },
  },
  {
    id: "violet",
    name: "紫色流光",
    config: {
      ...defaults,
      dots: "extra-rounded",
      corner: "extra-rounded",
      center: "dot",
      color: "#7034a5",
      color2: "#24479f",
      gradient: true,
    },
  },
  {
    id: "forest",
    name: "森林叶片",
    config: {
      ...defaults,
      dots: "classy",
      corner: "extra-rounded",
      color: "#24543b",
      color2: "#317c68",
      gradient: true,
    },
  },
  {
    id: "warm",
    name: "暖橙方格",
    config: {
      ...defaults,
      dots: "classy",
      color: "#9b361b",
      color2: "#b15d14",
      gradient: true,
    },
  },
];
export function normalizeQrStyle(value = {}) {
  const allowed = (list, input, fallback) =>
    list.some(([key]) => key === input) ? input : fallback;
  const hex = (input, fallback) =>
    typeof input === "string" && /^#[0-9a-f]{6}$/i.test(input)
      ? input
      : fallback;
  return {
    dots: allowed(dotShapes, value?.dots, defaults.dots),
    corner: allowed(cornerShapes, value?.corner, defaults.corner),
    center: allowed(centerShapes, value?.center, defaults.center),
    color: hex(value?.color, defaults.color),
    background: hex(value?.background, defaults.background),
    gradient: value?.gradient === true,
    color2: hex(value?.color2, defaults.color2),
    rotation: Number.isFinite(value?.rotation)
      ? Math.max(0, Math.min(360, value.rotation))
      : defaults.rotation,
  };
}
export function buildQrOptions(text, config, size = 512, correction = "M") {
  const style = normalizeQrStyle(config);
  const gradient = style.gradient
    ? {
        type: "linear",
        rotation: (style.rotation * Math.PI) / 180,
        colorStops: [
          { offset: 0, color: style.color },
          { offset: 1, color: style.color2 },
        ],
      }
    : undefined;
  return {
    width: size,
    height: size,
    type: "svg",
    data: utf8ByteString(text),
    margin: Math.ceil((size * 4) / 29),
    // Reserve at least four modules of quiet zone even for the smallest (21-module) QR.
    qrOptions: { errorCorrectionLevel: correction, mode: "Byte" },
    dotsOptions: { type: style.dots, color: style.color, gradient },
    cornersSquareOptions: { type: style.corner, color: style.color, gradient },
    cornersDotOptions: { type: style.center, color: style.color, gradient },
    backgroundOptions: { color: style.background },
  };
}

// qr-code-styling 1.9.2's bundled encoder uses the low byte of each JS character.
// Pass a UTF-8 byte string in Byte mode so Chinese and emoji survive unchanged.
export function utf8ByteString(text) {
  const bytes = new TextEncoder().encode(text);
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192)
    result += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return result;
}
