import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeBase64, decodeBase64 } from "../src/tools/base64/codec.mjs";
import { parseJwt, jwtValidity } from "../src/tools/jwt/parse.mjs";
import {
  convertConfig,
  parseProperties,
} from "../src/tools/config-convert/convert.mjs";

test("Base64 UTF-8、空文本、长文本及 URL 安全编码往返", () => {
  for (const input of ["", "你好，世界😀\n", "a".repeat(100000), "ÿÿ?"]) {
    assert.equal(decodeBase64(encodeBase64(input)), input);
    assert.equal(decodeBase64(encodeBase64(input, true)), input);
  }
  assert.equal(decodeBase64(" YQ==\n"), "a");
  for (const input of ["a", "a===", "YQ=", "Y@==", "YR==", "/w=="])
    assert.throws(() => decodeBase64(input));
});

const jwt = (payload, header = { alg: "HS256", typ: "JWT" }) =>
  `${encodeBase64(JSON.stringify(header), true)}.${encodeBase64(JSON.stringify(payload), true)}.c2ln`;
test("JWT 解析中文内容及 Bearer 前缀，秒级边界与 nbf 状态正确", () => {
  const { header, payload } = parseJwt(
    `Bearer ${jwt({ sub: "中文😀", exp: 200, nbf: 100, iat: 90 })}`,
  );
  assert.equal(header.alg, "HS256");
  assert.equal(payload.sub, "中文😀");
  assert.equal(jwtValidity(payload, 99999), "尚未生效");
  assert.equal(jwtValidity(payload, 100000), "未过期");
  assert.equal(jwtValidity(payload, 200000), "已过期");
  assert.equal(jwtValidity({}, 0), "未设置过期时间");
  assert.equal(jwtValidity({ exp: 0 }, 0), "已过期");
});
test("JWT 拒绝错误段数、非法对象及无效时间声明", () => {
  for (const input of [
    "",
    "a.b",
    "a.b.c.d.e",
    "a.?.c",
    jwt([]),
    jwt({ exp: "123" }),
    jwt({ exp: 1e99 }),
    jwt({}, null),
  ])
    assert.throws(() => parseJwt(input));
});

test("JSON/YAML 保留数组、布尔、null、多行及易混淆字符串", () => {
  const data = {
    app: { name: "中文😀", enabled: true, port: 8080 },
    list: [1, false, null],
    text: "line1\nline2",
    leading: "001",
    bool: "true",
  };
  const yaml = convertConfig(JSON.stringify(data), "json", "yaml");
  assert.deepEqual(JSON.parse(convertConfig(yaml, "yaml", "json")), data);
  assert.deepEqual(
    JSON.parse(
      convertConfig(
        "defaults: &base\n  name: test\ncopy: *base\n",
        "yaml",
        "json",
      ),
    ),
    { defaults: { name: "test" }, copy: { name: "test" } },
  );
});

test("Properties 注释、分隔符、续行、Java 转义、Unicode 及字符串值", () => {
  const input =
    "# 注释\n! 注释\nserver.port: 8080\napp.name = \\u4e2d\\u6587\nmessage=first\\\n  second\nkey\\ with\\ space : a\\=b\\:c\ntext=line1\\nline2\\tend\nempty\n";
  const data = JSON.parse(convertConfig(input, "properties", "json"));
  assert.equal(data.server.port, "8080");
  assert.equal(data.app.name, "中文");
  assert.equal(data.message, "firstsecond");
  assert.equal(data["key with space"], "a=b:c");
  assert.equal(data.text, "line1\nline2\tend");
  assert.equal(data.empty, "");
  assert.deepEqual(
    JSON.parse(
      convertConfig(convertConfig(input, "properties", "yaml"), "yaml", "json"),
    ),
    data,
  );
});

test("JSON/YAML 到 Properties 扁平路径、数组、特殊字符往返", () => {
  const data = {
    server: { port: 8080, enabled: true },
    hosts: [{ name: "中文" }, { name: "test" }],
    text: "  lead\nline\\end",
    "key space:": "#=value",
  };
  const properties = convertConfig(JSON.stringify(data), "json", "properties");
  assert.match(properties, /hosts\[0\].name=中文/);
  const expected = { ...data, server: { port: "8080", enabled: "true" } };
  assert.deepEqual(
    JSON.parse(convertConfig(properties, "properties", "json")),
    expected,
  );
  const yaml = convertConfig(JSON.stringify(data), "json", "yaml");
  assert.equal(convertConfig(yaml, "yaml", "properties"), properties);
});

test("Properties 宽松输出空容器、null、特殊键名和顶层数组", () => {
  assert.equal(
    convertConfig(
      "sss:\n  LogDetails: []\n  extra: {}\n  empty: null",
      "yaml",
      "properties",
    ),
    "sss.LogDetails=[]\nsss.extra={}\nsss.empty=null",
  );
  assert.equal(
    convertConfig('[{"Id":"123","LogDetails":[]}]', "json", "properties"),
    "items[0].Id=123\nitems[0].LogDetails=[]",
  );
  assert.equal(
    convertConfig('{"a.b":1,"special[key]":2}', "json", "properties"),
    "a.b=1\nspecial[key]=2",
  );
  assert.equal(convertConfig('"text"', "json", "properties"), "value=text");
  assert.equal(convertConfig("[]", "json", "properties"), "value=[]");
  assert.equal(
    convertConfig("id: 9223372036854775807\n1: value", "yaml", "properties"),
    "1=value\nid=9223372036854775807",
  );
});

test("Properties 宽松解析重复键、路径覆盖、缺失索引及非标准键", () => {
  const parse = (input) =>
    JSON.parse(convertConfig(input, "properties", "json"));
  assert.deepEqual(parse("a=1\na=2"), { a: "2" });
  assert.deepEqual(parse("a=1\na.b=2"), { a: { b: "2" } });
  assert.deepEqual(parse("a.b=1\na=2"), { a: "2" });
  assert.deepEqual(parse("a[1]=x"), { a: [null, "x"] });
  assert.deepEqual(parse("a[01]=x"), { a: [null, "x"] });
  assert.deepEqual(parse("a[0]=x\na.b=y"), { a: { b: "y" } });
  assert.deepEqual(parse("a..b=1\na[999999]=x"), {
    "a..b": "1",
    "a[999999]": "x",
  });
  assert.equal(parse(String.raw`a=\u12xx`).a, String.raw`\u12xx`);
  assert.equal(parse("LogDetails=[]").LogDetails, "[]");
});

test("拒绝 YAML 重复键、非字符串键、非有限数字、循环别名及不安全整数", () => {
  for (const input of [
    "a: 1\na: 2",
    "1: text",
    "a: .nan",
    "a: &x [*x]",
    "a: 9223372036854775807",
    "a: !unknown value",
  ])
    assert.throws(() => convertConfig(input, "yaml", "json"));
  assert.throws(() =>
    convertConfig('{"id":9223372036854775807}', "json", "yaml"),
  );
  assert.throws(() => convertConfig("{bad", "json", "yaml"));
  assert.throws(() => convertConfig('{"a":1,"a":2}', "json", "yaml"));
  assert.throws(() => convertConfig("a: [", "yaml", "json"));
});

test("配置中的原型相关键作为普通数据，不污染对象原型", () => {
  const result = JSON.parse(
    convertConfig(
      "__proto__.polluted=yes\nconstructor.prototype.value=ok",
      "properties",
      "json",
    ),
  );
  assert.equal(result.__proto__.polluted, "yes");
  assert.equal({}.polluted, undefined);
  assert.equal({}.value, undefined);
});
