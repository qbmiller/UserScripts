import { decodeBase64 } from "../base64/codec.mjs";

export function parseJwt(input) {
  const token = input.trim().replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (
    parts.length !== 3 ||
    !parts[0] ||
    !parts[1] ||
    parts.some((part) => !/^[A-Za-z0-9_-]*$/.test(part))
  ) {
    throw new Error(
      "请输入三段式 JWT（Header.Payload.Signature），支持 Bearer 前缀。",
    );
  }
  function parse(part, label) {
    try {
      const value = JSON.parse(decodeBase64(part));
      if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error();
      return value;
    } catch {
      throw new Error(`${label} 不是有效的 Base64URL JSON 对象。`);
    }
  }
  const header = parse(parts[0], "Header");
  const payload = parse(parts[1], "Payload");
  for (const key of ["exp", "nbf", "iat"]) {
    if (
      payload[key] !== undefined &&
      (typeof payload[key] !== "number" ||
        !Number.isFinite(payload[key]) ||
        Math.abs(payload[key] * 1000) > 8640000000000000)
    ) {
      throw new Error(`${key} 必须是有效的 Unix 秒时间戳。`);
    }
  }
  return { header, payload };
}

export function jwtValidity(payload, now = Date.now()) {
  if (payload.exp !== undefined && now >= payload.exp * 1000) return "已过期";
  if (payload.nbf !== undefined && now < payload.nbf * 1000) return "尚未生效";
  return payload.exp === undefined ? "未设置过期时间" : "未过期";
}
