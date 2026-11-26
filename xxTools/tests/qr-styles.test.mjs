import jsQR from "jsqr";
import qrGenerator from "qrcode-generator";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  qrStyles,
  normalizeQrStyle,
  buildQrOptions,
} from "../src/tools/qr-code/styles.mjs";
test("六种预设可独立配置，前景定位框共享渐变且保留静区", () => {
  assert.equal(qrStyles.length, 6);
  assert.equal(new Set(qrStyles.map((style) => style.id)).size, 6);
  for (const preset of qrStyles) {
    const options = buildQrOptions(
      "中文 https://example.com",
      preset.config,
      512,
      "H",
    );
    assert.equal(options.width, 512);
    assert.equal(options.qrOptions.errorCorrectionLevel, "H");
    assert.ok(options.margin >= (512 * 4) / 29);
    assert.equal(options.dotsOptions.color, preset.config.color);
    assert.deepEqual(
      options.cornersSquareOptions.gradient,
      options.dotsOptions.gradient,
    );
    assert.equal(!!options.dotsOptions.gradient, preset.config.gradient);
  }
});
test("自定义配置可保存往返，坏配置回退默认值", () => {
  const style = normalizeQrStyle({
    dots: "classy",
    corner: "dot",
    center: "dot",
    color: "#113355",
    background: "#eeeeee",
    gradient: true,
    color2: "#552288",
    rotation: 90,
  });
  assert.deepEqual(normalizeQrStyle(JSON.parse(JSON.stringify(style))), style);
  assert.equal(
    buildQrOptions("text", style).dotsOptions.gradient.rotation,
    Math.PI / 2,
  );
  const broken = normalizeQrStyle({
    dots: "bad",
    color: "url(javascript:bad)",
    background: null,
    rotation: Infinity,
  });
  assert.equal(broken.color, "#111111");
  assert.equal(broken.dots, "square");
  assert.equal(broken.background, "#ffffff");
});

test("样式编码器收到 UTF-8 原始字节，中文和表情不截断", () => {
  const text = "https://example.com/二维码?text=你好😀";
  const options = buildQrOptions(text, qrStyles[1].config);
  assert.equal(options.qrOptions.mode, "Byte");
  assert.deepEqual(
    [...options.data].map((char) => char.charCodeAt(0)),
    [...new TextEncoder().encode(text)],
  );
});

test("样式库的 Byte 编码链路能被独立解码器读回中文表情", () => {
  const text = "https://example.com/二维码?text=你好😀";
  const options = buildQrOptions(text, qrStyles[1].config);
  const qr = qrGenerator(0, "M");
  qr.addData(options.data, options.qrOptions.mode);
  qr.make();
  const count = qr.getModuleCount();
  const scale = 6;
  const side = (count + 8) * scale;
  const pixels = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < count; y++)
    for (let x = 0; x < count; x++) {
      if (!qr.isDark(y, x)) continue;
      for (let py = 0; py < scale; py++)
        for (let px = 0; px < scale; px++) {
          const at = (((y + 4) * scale + py) * side + (x + 4) * scale + px) * 4;
          pixels[at] = pixels[at + 1] = pixels[at + 2] = 0;
        }
    }
  assert.equal(jsQR(pixels, side, side)?.data, text);
});
