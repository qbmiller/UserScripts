import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fitSize,
  inspectImage,
  outputName,
} from "../src/tools/image-compress/model.mjs";

test("缩放保持比例、不放大小图并校验尺寸", () => {
  assert.deepEqual(fitSize(4000, 3000, 1600), { width: 1600, height: 1200 });
  assert.deepEqual(fitSize(80, 40, 1600), { width: 80, height: 40 });
  assert.deepEqual(fitSize(4000, 3000, 0), { width: 4000, height: 3000 });
  assert.throws(() => fitSize(0, 10, 0));
  assert.throws(() => fitSize(10000, 10000, 0), /像素/);
});
function png(animated = false) {
  return Uint8Array.from([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    0,
    0,
    0,
    0,
    ...(animated ? [97, 99, 84, 76] : [73, 69, 78, 68]),
    0,
    0,
    0,
    0,
  ]).buffer;
}
test("按文件内容识别静态图片，拒绝动画和伪造文件类型", () => {
  assert.equal(inspectImage(png()), "png");
  assert.equal(
    inspectImage(Uint8Array.from([255, 216, 255, 224]).buffer),
    "jpeg",
  );
  assert.throws(() => inspectImage(png(true)), /动画/);
  const webp = new Uint8Array(30);
  webp.set(new TextEncoder().encode("RIFF"));
  webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
  webp[20] = 2;
  assert.throws(() => inspectImage(webp.buffer), /动画/);
  webp[20] = 0;
  assert.equal(inspectImage(webp.buffer), "webp");
  assert.throws(
    () => inspectImage(new TextEncoder().encode("GIF89a").buffer),
    /JPG/,
  );
});
test("下载文件名使用实际格式、移除路径并避免同名 ZIP 覆盖", () => {
  assert.equal(outputName("截图.png", "jpeg", 1), "截图-compressed-1.jpg");
  assert.notEqual(
    outputName("a.jpg", "webp", 1),
    outputName("a.jpg", "webp", 2),
  );
  assert.equal(outputName("../bad/name.png", "png", 3).includes("/"), false);
});

test("解码前读取 PNG/JPEG/WebP 尺寸，拒绝截断文件与压缩体积很小的超大图", async () => {
  const { imageDimensions } =
    await import("../src/tools/image-compress/model.mjs");
  const png = new Uint8Array(33);
  png.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]);
  const view = new DataView(png.buffer);
  view.setUint32(16, 1200);
  view.setUint32(20, 800);
  assert.deepEqual(imageDimensions(png.buffer), { width: 1200, height: 800 });
  view.setUint32(16, 100000);
  view.setUint32(20, 100000);
  assert.throws(() => imageDimensions(png.buffer), /像素/);
  assert.throws(() => imageDimensions(png.slice(0, 20).buffer), /损坏/);
  const jpeg = Uint8Array.from([
    255, 216, 255, 192, 0, 11, 8, 3, 32, 4, 176, 1, 1, 17, 0,
  ]);
  assert.deepEqual(imageDimensions(jpeg.buffer), { width: 1200, height: 800 });
  const webp = new Uint8Array(30);
  webp.set(new TextEncoder().encode("RIFF"));
  webp.set(new TextEncoder().encode("WEBPVP8X"), 8);
  new DataView(webp.buffer).setUint32(16, 10, true);
  webp[25] = 3;
  webp[28] = 1;
  assert.deepEqual(imageDimensions(webp.buffer), { width: 769, height: 257 });
});

test("WebP 有损 VP8、无损 VP8L 头部及 JPEG 元数据段均可读取尺寸", async () => {
  const { imageDimensions } =
    await import("../src/tools/image-compress/model.mjs");
  const webp = new Uint8Array(30);
  webp.set(new TextEncoder().encode("RIFF"));
  webp.set(new TextEncoder().encode("WEBPVP8 "), 8);
  const view = new DataView(webp.buffer);
  view.setUint32(16, 10, true);
  webp.set([0x9d, 1, 0x2a], 23);
  view.setUint16(26, 1200, true);
  view.setUint16(28, 800, true);
  assert.deepEqual(imageDimensions(webp.buffer), { width: 1200, height: 800 });
  webp[15] = 0x4c;
  view.setUint32(16, 5, true);
  webp[20] = 0x2f;
  view.setUint32(21, 1199 | (799 << 14), true);
  assert.deepEqual(imageDimensions(webp.buffer), { width: 1200, height: 800 });
  const jpeg = Uint8Array.from([
    255, 216, 255, 224, 0, 4, 0, 0, 255, 194, 0, 11, 8, 3, 32, 4, 176, 1, 1, 17,
    0,
  ]);
  assert.deepEqual(imageDimensions(jpeg.buffer), { width: 1200, height: 800 });
});
