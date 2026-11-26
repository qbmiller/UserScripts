import { test } from "node:test";
import assert from "node:assert/strict";
import {
  convertEncoding,
  encodeBase32,
  decodeBase32,
  methods,
} from "../src/tools/base64/methods.mjs";

test("所有方式支持中文、表情、空文本、控制字符及 BOM 往返", () => {
  for (const text of [
    "",
    "中文😀 &+=/?#",
    "\0\0abc\n\t",
    "\uFEFFhello",
    "abc".repeat(500),
  ]) {
    for (const { id } of methods.filter((item) => item.id !== "base")) {
      assert.equal(
        convertEncoding(convertEncoding(text, id), id, true),
        text,
        id,
      );
    }
    for (const base of ["16", "32", "58", "62", "64"]) {
      const options = { base };
      assert.equal(
        convertEncoding(
          convertEncoding(text, "base", false, options),
          "base",
          true,
          options,
        ),
        text,
        `base${base}`,
      );
    }
  }
});

test("Unicode、Native、UTF-8、Hex 和 URL 使用明确的标准表示", () => {
  assert.equal(
    convertEncoding("A中😀", "unicode"),
    String.raw`\u0041\u4e2d\ud83d\ude00`,
  );
  assert.equal(
    convertEncoding("A中😀", "native"),
    String.raw`A\u4e2d\ud83d\ude00`,
  );
  assert.equal(convertEncoding(String.raw`\u{1F600}`, "unicode", true), "😀");
  assert.equal(convertEncoding("中", "utf8"), String.raw`\xe4\xb8\xad`);
  assert.equal(convertEncoding("中", "hex"), "e4b8ad");
  assert.equal(convertEncoding("0xE4 0xB8 0xAD", "hex", true), "中");
  assert.equal(
    convertEncoding("a+b 中文", "url"),
    "a%2Bb%20%E4%B8%AD%E6%96%87",
  );
  assert.equal(convertEncoding("a+b", "url", true), "a+b");
});

test("Base32 RFC 4648 已知向量，支持大小写与无填充", () => {
  for (const [text, encoded] of [
    ["", ""],
    ["f", "MY======"],
    ["fo", "MZXQ===="],
    ["foo", "MZXW6==="],
    ["foob", "MZXW6YQ="],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI======"],
  ]) {
    assert.equal(encodeBase32(text), encoded);
    assert.equal(decodeBase32(encoded), text);
    assert.equal(decodeBase32(encoded.toLowerCase().replace(/=/g, "")), text);
  }
});

test("Base58 与 Base62 的字符顺序及前导零字节", () => {
  assert.equal(
    convertEncoding("Hello World", "base", false, { base: "58" }),
    "JxF12TrwUP45BMd",
  );
  assert.equal(convertEncoding("a", "base", false, { base: "62" }), "1Z");
  assert.equal(convertEncoding("\0\0", "base", false, { base: "58" }), "11");
  assert.equal(convertEncoding("\0\0", "base", false, { base: "62" }), "00");
  assert.equal(convertEncoding("11", "base", true, { base: "58" }), "\0\0");
});

test("Base64URL 兼容独立和 BASE 菜单，解码自动识别", () => {
  const options = { base: "64", urlSafe: true };
  const value = convertEncoding("中文😀", "base", false, options);
  assert.equal(value, convertEncoding("中文😀", "base64", false, options));
  assert.doesNotMatch(value, /[+/=]/);
  assert.equal(convertEncoding(value, "base", true, options), "中文😀");
});

test("非法字节、编码位、转义和不支持的方式均给出错误", () => {
  for (const [method, text] of [
    ["hex", "f"],
    ["hex", "zz"],
    ["hex", "ff"],
    ["utf8", String.raw`\xGG`],
    ["unicode", String.raw`\u12`],
    ["unicode", String.raw`\u{110000}`],
    ["url", "%ZZ"],
    ["base32", "A"],
    ["base32", "MZ======"],
    ["base32", "MY="],
    ["base32", "M0======"],
  ]) {
    assert.throws(
      () => convertEncoding(text, method, true),
      `${method}: ${text}`,
    );
  }
  assert.throws(() => convertEncoding("0OI", "base", true, { base: "58" }));
  assert.throws(() => convertEncoding("?", "base", true, { base: "62" }));
  assert.throws(() => convertEncoding("a", "base", false, { base: "99" }));
  assert.throws(() => convertEncoding("a", "unknown"));
});
