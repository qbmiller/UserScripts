import { test } from "node:test";
import assert from "node:assert/strict";
import { characterGroups, generatePasswords } from "../src/tools/password-generator/generate.mjs";

test("默认批量密码长度正确、包含全部所选类型且排除易混淆字符", () => {
  const options = { uppercase: true, lowercase: true, digits: true, symbols: true, excludeAmbiguous: true };
  const passwords = generatePasswords(18, options);
  assert.equal(passwords.length, 4);
  for (const password of passwords) {
    assert.equal(password.length, 18);
    assert.doesNotMatch(password, /[Il1O0o|]/);
    for (const group of Object.values(characterGroups)) {
      assert.ok([...password].some((character) => group.includes(character)));
    }
  }
});

test("支持单一字符类型、长度边界和保留易混淆字符的字符集", () => {
  for (const [key, alphabet] of Object.entries(characterGroups)) {
    for (const length of [8, 128]) {
      for (const password of generatePasswords(length, { [key]: true })) {
        assert.equal(password.length, length);
        assert.ok([...password].every((character) => alphabet.includes(character)));
      }
    }
  }
});

test("拒绝空字符集及非法长度、数量", () => {
  assert.throws(() => generatePasswords(18, {}), /至少选择/);
  for (const length of [0, 7, 129, 18.5, NaN]) {
    assert.throws(() => generatePasswords(length, { digits: true }), /长度/);
  }
  for (const count of [0, 101, 1.5]) {
    assert.throws(() => generatePasswords(18, { digits: true }, count), /数量/);
  }
});
