import { encodeBase64, decodeBase64 } from "./codec.mjs";
import { convertUrl } from "../../core/transforms.mjs";

const encoder = new TextEncoder();
function textFromBytes(bytes) {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    throw new Error("解码结果不是有效的 UTF-8 文本。");
  }
}

export const methods = [
  {
    id: "unicode",
    label: "Unicode",
    hint: "文本与 Unicode 转义互转，例如 中 → \\u4e2d；解码支持 \\uXXXX 和 \\u{1F600}。",
  },
  {
    id: "utf8",
    label: "UTF-8",
    hint: "文本与 UTF-8 字节转义互转，例如 中 → \\xe4\\xb8\\xad。",
  },
  {
    id: "url",
    label: "URL",
    hint: "对 URL 参数编码、解码，例如 中文 → %E4%B8%AD%E6%96%87；加号按原字符保留。",
  },
  {
    id: "native",
    label: "ASCII / Native",
    hint: "Java native2ascii 风格：只将非 ASCII 字符转为 \\uXXXX，ASCII 字符保持原样。",
  },
  {
    id: "hex",
    label: "Hex",
    hint: "文本与 UTF-8 十六进制字节互转，例如 中 → e4b8ad；解码支持空格、0xHH 和 \\xHH。",
  },
  {
    id: "base64",
    label: "Base64",
    hint: "UTF-8 文本与 Base64 互转；解码自动兼容 Base64URL。",
  },
  {
    id: "base32",
    label: "Base32",
    hint: "使用 RFC 4648 Base32（A–Z、2–7），解码兼容小写和省略填充。",
  },
  {
    id: "base",
    label: "BASE",
    hint: "选择 Base16 / 32 / 58 / 62 / 64，对 UTF-8 文本进行编码、解码。",
  },
];

function unicodeEncode(text, asciiOnly) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    result +=
      asciiOnly && code < 128
        ? text[i]
        : `\\u${code.toString(16).padStart(4, "0")}`;
  }
  return result;
}

function unicodeDecode(text) {
  return text.replace(
    /\\u(?:\{([^}]*)\}|([\s\S]{0,4}))/g,
    (_match, point, unit) => {
      const hex = point ?? unit;
      if (
        !(point === undefined ? /^[\da-f]{4}$/i : /^[\da-f]{1,6}$/i).test(
          hex,
        ) ||
        parseInt(hex, 16) > 0x10ffff
      ) {
        throw new Error(
          "Unicode 转义格式不正确，请使用 \\uXXXX 或 \\u{1F600}。",
        );
      }
      return String.fromCodePoint(parseInt(hex, 16));
    },
  );
}

function hexEncode(text) {
  return Array.from(encoder.encode(text), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function hexDecode(text) {
  const hex = text.replace(/(?:\\x|0x)([\da-f]{2})/gi, "$1").replace(/\s/g, "");
  if (!/^[\da-f]*$/i.test(hex) || hex.length % 2)
    throw new Error("十六进制字节格式不正确，每个字节需要两位十六进制数。");
  return textFromBytes(
    Uint8Array.from(hex.match(/../g) || [], (byte) => parseInt(byte, 16)),
  );
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function encodeBase32(text) {
  let bits = 0,
    buffer = 0,
    output = "";
  for (const byte of encoder.encode(text)) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += BASE32[(buffer >>> bits) & 31];
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits) output += BASE32[(buffer << (5 - bits)) & 31];
  return output.padEnd(Math.ceil(output.length / 8) * 8, "=");
}

export function decodeBase32(text) {
  const value = text.replace(/\s/g, "").toUpperCase();
  if (
    !/^[A-Z2-7]*={0,6}$/.test(value) ||
    (value.includes("=") && value.length % 8)
  )
    throw new Error("Base32 格式不正确。");
  const raw = value.replace(/=+$/, "");
  if (![0, 2, 4, 5, 7].includes(raw.length % 8))
    throw new Error("Base32 长度不正确。");
  let bits = 0,
    buffer = 0;
  const bytes = [];
  for (const char of raw) {
    buffer = (buffer << 5) | BASE32.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
    buffer &= (1 << bits) - 1;
  }
  if (buffer) throw new Error("Base32 末尾编码位不正确。");
  return textFromBytes(Uint8Array.from(bytes));
}

const ALPHABETS = {
  58: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
  62: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
};

function radixEncode(text, alphabet) {
  const bytes = encoder.encode(text);
  if (bytes.length > 16384)
    throw new Error("Base58 / Base62 单次支持最多 16 KB UTF-8 文本。");
  const radix = BigInt(alphabet.length);
  let number = 0n,
    output = "",
    zeros = 0;
  for (const byte of bytes) number = number * 256n + BigInt(byte);
  for (const byte of bytes) {
    if (byte) break;
    zeros++;
  }
  while (number) {
    output = alphabet[Number(number % radix)] + output;
    number /= radix;
  }
  return alphabet[0].repeat(zeros) + output;
}

function radixDecode(text, alphabet) {
  const value = text.replace(/\s/g, "");
  if (value.length > 23000)
    throw new Error("Base58 / Base62 编码过长，请分段处理。");
  const radix = BigInt(alphabet.length);
  let number = 0n,
    zeros = 0;
  for (const char of value) {
    const index = alphabet.indexOf(char);
    if (index < 0)
      throw new Error(`Base${alphabet.length} 包含无效字符：${char}`);
    number = number * radix + BigInt(index);
  }
  for (const char of value) {
    if (char !== alphabet[0]) break;
    zeros++;
  }
  const bytes = [];
  while (number) {
    bytes.push(Number(number % 256n));
    number /= 256n;
  }
  bytes.reverse();
  return textFromBytes(Uint8Array.from([...Array(zeros).fill(0), ...bytes]));
}

export function convertEncoding(
  text,
  method,
  decode = false,
  { urlSafe = false, base = "58" } = {},
) {
  if (method === "base") {
    const aliases = { 16: "hex", 32: "base32", 64: "base64" };
    if (aliases[base])
      return convertEncoding(text, aliases[base], decode, { urlSafe });
    const alphabet = ALPHABETS[base];
    if (!alphabet) throw new Error("不支持的 BASE 类型。");
    return decode ? radixDecode(text, alphabet) : radixEncode(text, alphabet);
  }
  switch (method) {
    case "unicode":
      return decode ? unicodeDecode(text) : unicodeEncode(text, false);
    case "native":
      return decode ? unicodeDecode(text) : unicodeEncode(text, true);
    case "utf8":
      return decode ? hexDecode(text) : hexEncode(text).replace(/../g, "\\x$&");
    case "hex":
      return decode ? hexDecode(text) : hexEncode(text);
    case "url":
      try {
        return convertUrl(text, decode ? "decode" : "encode");
      } catch {
        throw new Error("URL 编解码失败，请检查百分号编码或输入字符是否有效。");
      }
    case "base64":
      return decode ? decodeBase64(text) : encodeBase64(text, urlSafe);
    case "base32":
      return decode ? decodeBase32(text) : encodeBase32(text);
    default:
      throw new Error("不支持的编解码方式。");
  }
}
