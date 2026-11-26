import { test } from "node:test";
import assert from "node:assert/strict";
import { convertColor } from "../src/tools/color-picker/color.mjs";
import { transformCode } from "../src/tools/html-format/format.mjs";
import QRCode from "qrcode";
test("颜色格式转换保留中文工具常用格式与透明度", () => {
  assert.equal(convertColor("rgb(49,95,69)").hex, "#315f45");
  assert.equal(convertColor("hsl(0,100%,50%)").hex, "#ff0000");
  assert.equal(convertColor("#abc").hex, "#aabbcc");
  assert.equal(convertColor("rgba(255,0,0,0.5)").alpha, 0.5);
  assert.throws(() => convertColor("bad input"));
});
test("二维码包含中文、链接和纠错配置，可导出有效 SVG", async () => {
  for (const errorCorrectionLevel of ["L", "M", "Q", "H"]) {
    const result = await QRCode.toString(
      "中文😀 https://example.com/?a=1&b=2",
      { type: "svg", errorCorrectionLevel },
    );
    assert.match(result, /<svg/);
    assert.match(result, /<path/);
  }
  await assert.rejects(QRCode.toString("a".repeat(10000)));
});
test("HTML 美化压缩保留 pre 内容、注释与行内元素间空格", async () => {
  const source =
    "<div> <span>hello</span> <span>world</span> </div><pre> a  b\n c</pre><!-- keep -->";
  assert.match(await transformCode(source, "html"), /\n/);
  const result = await transformCode(source, "html", true);
  assert.match(result, /<\/span> <span>/);
  assert.match(result, /<pre> a  b\n c<\/pre>/);
  assert.match(result, /<!-- keep -->/);
});
test("CSS 压缩不破坏字符串、calc 及自定义属性", async () => {
  const source = 'a { --gap: 2px; width: calc(100% - 2px); content: "a  b"; }';
  assert.match(await transformCode(source, "css"), /\n/);
  const result = await transformCode(source, "css", true);
  assert.match(result, /calc\(100% - 2px\)/);
  assert.match(result, /a  b/);
});
test("JS 压缩保留正则、模板字符串、ASI 及变量名，错误代码报错", async () => {
  const source =
    "function getValue() { return\n {a: 1}; }\nconst pattern = /a b/g; const message = `a  b`;";
  const result = await transformCode(source, "js", true);
  assert.match(result, /getValue/);
  assert.match(result, /\/a b\/g/);
  assert.match(result, /return;/);
  await assert.rejects(transformCode("const = ;", "js", true));
  await assert.rejects(transformCode("a { color: } }", "css"));
});
