export function getOriginalUrl(value) {
  if (typeof value !== "string") return null;

  try {
    const suspended = new URL(value);
    if (
      suspended.protocol !== "chrome-extension:" ||
      !["/html/suspended.html", "/suspended.html"].includes(suspended.pathname)
    ) {
      return null;
    }

    // 挂起扩展通常把 uri 放在最后；不能用 URLSearchParams，
    // 否则原始网址未编码的 &、+ 和 # 可能被拆分或改变。
    const match = suspended.hash.slice(1).match(/(?:^|&)uri=(.+)$/);
    if (!match) return null;

    let target = match[1];
    if (!/^https?(?:\\)?:\/\//i.test(target)) {
      target = decodeURIComponent(target);
    }
    target = target.replace(/^(https?)\\:/i, "$1:");
    const original = new URL(target);
    return ["https:", "http:"].includes(original.protocol)
      ? original.href
      : null;
  } catch {
    return null;
  }
}

export function formatJson(input, compact = false) {
  // 仅用解析器校验；排版基于原始 token，避免大整数、负零、指数和重复键丢失。
  JSON.parse(input);
  const tokens =
    input.match(
      /"(?:[^"\\]|\\.)*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g,
    ) || [];
  if (compact) return tokens.join("");
  let indent = 0;
  let result = "";
  const newline = () => "\n" + "  ".repeat(indent);
  tokens.forEach((token, index) => {
    if (token === "{" || token === "[") {
      result += token;
      if (tokens[index + 1] !== (token === "{" ? "}" : "]")) {
        indent++;
        result += newline();
      }
    } else if (token === "}" || token === "]") {
      if (tokens[index - 1] !== (token === "}" ? "{" : "[")) {
        indent--;
        result += newline();
      }
      result += token;
    } else if (token === ",") result += "," + newline();
    else if (token === ":") result += ": ";
    else result += token;
  });
  return result;
}
export function convertUrl(input, mode) {
  return mode === "encode"
    ? encodeURIComponent(input)
    : decodeURIComponent(input);
}
