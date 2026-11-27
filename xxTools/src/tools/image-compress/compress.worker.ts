/// <reference lib="webworker" />
import {
  fitSize,
  inspectImage,
  imageDimensions,
  MAX_FILE_BYTES,
  MIME_TYPES,
} from "./model.mjs";
import type { CompressionOptions } from "./client";

const worker = self as unknown as DedicatedWorkerGlobalScope;
worker.onmessage = async ({
  data,
}: MessageEvent<{ file: File; options: CompressionOptions }>) => {
  let bitmap: ImageBitmap | undefined;
  try {
    const { file, options } = data;
    if (file.size > MAX_FILE_BYTES)
      throw new Error("单张图片不能超过 40 MiB。");
    const input = await file.arrayBuffer();
    const sourceFormat = inspectImage(input);
    imageDimensions(input);
    const format =
      options.format === "original" ? sourceFormat : options.format;
    const stage = (message: string) => worker.postMessage({ stage: message });
    stage("读取图片");
    try {
      bitmap = await createImageBitmap(
        new Blob([input], { type: MIME_TYPES[sourceFormat] }),
      );
    } catch {
      throw new Error("无法读取图片，文件可能已损坏或格式不受支持。");
    }
    const { width, height } = fitSize(
      bitmap.width,
      bitmap.height,
      options.maxEdge,
    );
    const unchangedPng =
      sourceFormat === "png" &&
      format === "png" &&
      width === bitmap.width &&
      height === bitmap.height;
    let pixels: ImageData | undefined;
    if (!unchangedPng) {
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("浏览器无法创建图片画布。");
      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(bitmap, 0, 0, width, height);
      pixels = ctx.getImageData(0, 0, width, height);
    }
    bitmap.close();
    bitmap = undefined;
    stage("加载压缩器");
    let output: ArrayBuffer;
    if (format === "jpeg") {
      const [{ default: encode, init }, { default: wasmUrl }] =
        await Promise.all([
          import("@jsquash/jpeg/encode.js"),
          import("@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm?url"),
        ]);
      await init({ locateFile: () => wasmUrl });
      stage("压缩 JPG");
      output = await encode(pixels!, { quality: options.quality });
    } else if (format === "webp") {
      const [
        { default: encode, init },
        { default: wasmUrl },
        { default: simdUrl },
      ] = await Promise.all([
        import("@jsquash/webp/encode.js"),
        import("@jsquash/webp/codec/enc/webp_enc.wasm?url"),
        import("@jsquash/webp/codec/enc/webp_enc_simd.wasm?url"),
      ]);
      await init({
        locateFile: (name: string) =>
          name.includes("simd") ? simdUrl : wasmUrl,
      });
      stage("压缩 WebP");
      output = await encode(pixels!, { quality: options.quality });
    } else {
      // 明确使用单线程入口，外层 Worker 负责隔离耗时工作，无需 SharedArrayBuffer。
      const [{ default: init, optimise, optimise_raw }, { default: wasmUrl }] =
        await Promise.all([
          import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js"),
          import("@jsquash/oxipng/codec/pkg/squoosh_oxipng_bg.wasm?url"),
        ]);
      await init(wasmUrl);
      stage("优化 PNG");
      const bytes = unchangedPng
        ? optimise(new Uint8Array(input), 2, false, false)
        : optimise_raw(pixels!.data, width, height, 2, false, false);
      output = bytes.slice().buffer as ArrayBuffer;
    }
    const blob = new Blob([output], { type: MIME_TYPES[format] });
    worker.postMessage({ result: { blob, width, height, format } });
  } catch (error) {
    worker.postMessage({
      error:
        error instanceof Error
          ? error.message
          : "图片处理失败，请换一张图片重试。",
    });
  } finally {
    bitmap?.close();
  }
};
