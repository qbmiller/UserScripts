export const characterGroups = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/~",
};

export function passwordGroups(options) {
  return Object.entries(characterGroups)
    .filter(([key]) => options[key])
    .map(([, characters]) => options.excludeAmbiguous
      ? characters.replace(/[Il1O0o|]/g, "") : characters);
}

function randomIndex(size) {
  const value = new Uint32Array(1);
  const limit = 2 ** 32 - (2 ** 32 % size);
  do { globalThis.crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % size;
}

export function generatePasswords(length, options, count = 4) {
  if (!Number.isInteger(length) || length < 8 || length > 128) {
    throw new Error("密码长度须为 8–128 位。");
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error("生成数量须为 1–100 个。");
  }
  const groups = passwordGroups(options);
  if (!groups.length) throw new Error("请至少选择一种字符类型。");
  const alphabet = groups.join("");
  return Array.from({ length: count }, () => {
    // 拒绝缺少所选类型的候选，保持有效密码空间内均匀分布。
    let password;
    do {
      password = Array.from({ length }, () => alphabet[randomIndex(alphabet.length)]).join("");
    } while (!groups.every((group) => [...password].some((character) => group.includes(character))));
    return password;
  });
}
