export function encodeBase64(text, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  const result = btoa(binary);
  return urlSafe
    ? result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : result;
}

export function decodeBase64(text) {
  const value = text.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (
    !/^[A-Za-z0-9+/]*={0,2}$/.test(value) ||
    value.length % 4 === 1 ||
    (value.includes("=") && value.length % 4 !== 0)
  ) {
    throw new Error("Base64 格式不正确，请检查字符和末尾填充。");
  }
  const unpadded = value.replace(/=+$/, "");
  const binary = atob(unpadded);
  if (btoa(binary).replace(/=+$/, "") !== unpadded)
    throw new Error("Base64 格式不正确：存在无效的末尾编码位。");
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    );
  } catch {
    throw new Error("解码结果不是有效的 UTF-8 文本；本工具用于文本编解码。");
  }
}
