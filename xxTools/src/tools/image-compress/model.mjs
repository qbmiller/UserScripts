export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_PIXELS = 32_000_000;
export const MIME_TYPES = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function fitSize(width, height, maxEdge = 0) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new Error("图片尺寸无效。");
  if (width * height > MAX_PIXELS)
    throw new Error("图片超过 3200 万像素，请先缩小原图。");
  if (!Number.isFinite(maxEdge) || maxEdge < 0)
    throw new Error("最长边必须是非负数。");
  const scale =
    maxEdge > 0 ? Math.min(1, maxEdge / Math.max(width, height)) : 1;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function inspectImage(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const tag = (offset, value) =>
    [...value].every((c, i) => bytes[offset + i] === c.charCodeAt(0));
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "jpeg";
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) {
    for (let offset = 8; offset + 12 <= bytes.length;) {
      const size = view.getUint32(offset);
      if (tag(offset + 4, "acTL"))
        throw new Error("暂不支持动画 PNG，请选择静态图片。");
      offset += 12 + size;
    }
    return "png";
  }
  if (tag(0, "RIFF") && tag(8, "WEBP")) {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const size = view.getUint32(offset + 4, true);
      if (tag(offset, "ANIM") || (tag(offset, "VP8X") && bytes[offset + 8] & 2))
        throw new Error("暂不支持动画 WebP，请选择静态图片。");
      offset += 8 + size + (size % 2);
    }
    return "webp";
  }
  throw new Error("仅支持静态 JPG、PNG、WebP 图片。");
}

export function outputName(name, format, index) {
  if (!(format in MIME_TYPES)) throw new Error("不支持的输出格式。");
  const base =
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_")
      .slice(0, 120) || "image";
  return `${base}-compressed-${index}.${format === "jpeg" ? "jpg" : format}`;
}

// 在浏览器解码/预览前检查尺寸，避免高度压缩的大图先分配巨量像素内存。
export function imageDimensions(buffer) {
  const format = inspectImage(buffer);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const damaged = () => {
    throw new Error("图片头部已损坏，无法读取尺寸。");
  };
  const checked = (width, height) => fitSize(width, height, 0);
  if (format === "png") {
    if (
      bytes.length < 33 ||
      view.getUint32(8) !== 13 ||
      view.getUint32(12) !== 0x49484452
    )
      return damaged();
    return checked(view.getUint32(16), view.getUint32(20));
  }
  if (format === "jpeg") {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset++] !== 255) return damaged();
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) return damaged();
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) return damaged();
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        if (length < 8) return damaged();
        return checked(view.getUint16(offset + 5), view.getUint16(offset + 3));
      }
      offset += length;
    }
  } else {
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const length = view.getUint32(offset + 4, true);
      const start = offset + 8;
      if (start + length > bytes.length) return damaged();
      const tag = view.getUint32(offset);
      if (tag === 0x56503858 && length >= 10) {
        // VP8X
        const u24 = (at) =>
          bytes[at] | (bytes[at + 1] << 8) | (bytes[at + 2] << 16);
        return checked(u24(start + 4) + 1, u24(start + 7) + 1);
      }
      if (tag === 0x5650384c && length >= 5 && bytes[start] === 0x2f) {
        // VP8L
        const bits = view.getUint32(start + 1, true);
        return checked((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
      }
      if (
        tag === 0x56503820 &&
        length >= 10 &&
        bytes[start + 3] === 0x9d &&
        bytes[start + 4] === 1 &&
        bytes[start + 5] === 0x2a
      ) {
        // VP8
        return checked(
          view.getUint16(start + 6, true) & 0x3fff,
          view.getUint16(start + 8, true) & 0x3fff,
        );
      }
      offset = start + length + (length % 2);
    }
  }
  return damaged();
}
