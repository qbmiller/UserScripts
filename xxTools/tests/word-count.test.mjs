import test from "node:test";
import assert from "node:assert/strict";
import { countText } from "../src/tools/word-count/count.mjs";

test("空文本的所有统计为零", () => {
  assert.deepEqual(countText(""), {
    characters: 0, nonWhitespace: 0, chinese: 0,
    englishWords: 0, digits: 0, lines: 0,
  });
});

test("中英文、数字与空白分别统计，并统一不同平台换行", () => {
  assert.deepEqual(countText("你好 hello-world don't 123\r\n\t再见\r"), {
    characters: 29, nonWhitespace: 23, chinese: 4,
    englishWords: 2, digits: 3, lines: 3,
  });
});

test("组合表情、组合重音和扩展汉字不按 UTF-16 长度重复计数", () => {
  const result = countText("👨‍👩‍👧‍👦👍🏽e\u0301𠮷");
  assert.equal(result.characters, 4);
  assert.equal(result.nonWhitespace, 4);
  assert.equal(result.chinese, 1);
});

test("仅空白文本保留行数，去空白字符数为零", () => {
  const result = countText(" \t\r\n\u3000\n");
  assert.equal(result.nonWhitespace, 0);
  assert.equal(result.lines, 3);
});
