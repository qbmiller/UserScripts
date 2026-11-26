import { parseDocument, stringify } from "yaml";

const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// Restrict values to JSON-compatible data and detect cycles/unsafe numbers before serialization.
function normalize(value, ancestors = new Set(), depth = 0, relaxed = false) {
  if (depth > 100) throw new Error("配置嵌套过深（最多 100 层）。");
  if (typeof value === "bigint") {
    if (
      value > BigInt(Number.MAX_SAFE_INTEGER) ||
      value < BigInt(Number.MIN_SAFE_INTEGER)
    ) {
      if (relaxed) return String(value);
      throw new Error("存在超出安全整数范围的数字，请用引号将其保存为字符串。");
    }
    return Number(value);
  }
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) ||
      (Number.isInteger(value) && !Number.isSafeInteger(value)))
  ) {
    if (relaxed) return String(value);
    throw new Error("存在非有限数字或超出安全整数范围的数字，请改为字符串。");
  }
  if (value === null || typeof value !== "object") return value;
  if (ancestors.has(value))
    throw new Error("循环引用无法转换为 JSON 或 Properties。");
  ancestors.add(value);
  let result;
  if (Array.isArray(value))
    result = value.map((item) =>
      normalize(item, ancestors, depth + 1, relaxed),
    );
  else {
    result = Object.create(null);
    const entries = value instanceof Map ? [...value] : Object.entries(value);
    for (const [key, item] of entries) {
      if (typeof key !== "string" && !relaxed)
        throw new Error("YAML 对象键必须是字符串，请为数字等键加引号。");
      result[String(key)] = normalize(item, ancestors, depth + 1, relaxed);
    }
  }
  ancestors.delete(value);
  return result;
}

function unescapeProperty(value) {
  return value.replace(/\\(u[\s\S]{0,4}|[\s\S])/g, (_match, escaped) => {
    if (escaped[0] === "u") {
      if (!/^u[\da-f]{4}$/i.test(escaped)) return `\\${escaped}`;
      return String.fromCharCode(parseInt(escaped.slice(1), 16));
    }
    return { t: "\t", n: "\n", r: "\r", f: "\f" }[escaped] ?? escaped;
  });
}

function propertyEntries(input) {
  const entries = [];
  const lines = input.replace(/^\uFEFF/, "").split(/\r\n|\n|\r/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/^[ \t\f]+/, "");
    if (!line || /^[#!]/.test(line)) continue;
    while ((line.match(/\\+$/)?.[0].length || 0) % 2) {
      line = line.slice(0, -1);
      if (++i >= lines.length) break;
      line += lines[i].replace(/^[ \t\f]+/, "");
    }
    let end = 0;
    for (; end < line.length; end++) {
      if (line[end] === "\\") {
        end++;
        continue;
      }
      if (/[=: \t\f]/.test(line[end])) break;
    }
    let start = end;
    while (/[ \t\f]/.test(line[start] || "\0")) start++;
    if (line[start] === "=" || line[start] === ":") start++;
    while (/[ \t\f]/.test(line[start] || "\0")) start++;
    entries.push([
      unescapeProperty(line.slice(0, end)),
      unescapeProperty(line.slice(start)),
    ]);
  }
  return entries;
}

function parsePath(key) {
  if (!/^[^.[\]]+(?:\[\d+\]|\.[^.[\]]+)*$/.test(key)) return [key];
  const parts = [...key.matchAll(/([^.[\]]+)|\[(\d+)\]/g)].map((match) => {
    if (match[2] === undefined) return match[1];
    const index = Number(match[2]);
    return index;
  });
  if (parts.some((part) => typeof part === "number" && part > 10000))
    return [key];
  if (parts.length > 100) throw new Error("配置嵌套过深（最多 100 层）。");
  return parts;
}

export function parseProperties(input) {
  const root = Object.create(null);
  for (const [key, value] of propertyEntries(input)) {
    const parts = parsePath(key);
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        node[part] = value;
      } else {
        const needsArray = typeof parts[i + 1] === "number";
        if (
          !own(node, part) ||
          !node[part] ||
          typeof node[part] !== "object" ||
          Array.isArray(node[part]) !== needsArray
        )
          node[part] = needsArray ? [] : Object.create(null);
        node = node[part];
      }
    }
  }
  function fillArrays(node) {
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) if (!own(node, i)) node[i] = null;
    }
    if (node && typeof node === "object")
      Object.values(node).forEach(fillArrays);
  }
  fillArrays(root);
  return root;
}

function escapeProperty(value, key = false) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f")
    .replace(key ? /[ =:#!]/g : /^ /g, (char) => `\\${char}`);
}

export function stringifyProperties(value) {
  const lines = [];
  function visit(node, path) {
    if (
      node === null ||
      typeof node !== "object" ||
      !Object.keys(node).length
    ) {
      const text =
        node === null
          ? "null"
          : Array.isArray(node)
            ? "[]"
            : typeof node === "object"
              ? "{}"
              : String(node);
      lines.push(
        `${escapeProperty(path || "value", true)}=${escapeProperty(text)}`,
      );
      return;
    }
    const entries = Object.entries(node);
    for (const [key, item] of entries) {
      visit(
        item,
        Array.isArray(node) ? `${path}[${key}]` : path ? `${path}.${key}` : key,
      );
    }
  }
  visit(value, Array.isArray(value) && value.length ? "items" : "");
  return lines.join("\n");
}

export function convertConfig(input, from, to) {
  if (
    !["json", "yaml", "properties"].includes(from) ||
    !["json", "yaml", "properties"].includes(to)
  )
    throw new Error("不支持的配置格式。");
  let data;
  const relaxed = from === "properties" || to === "properties";
  if (from === "json" || from === "yaml") {
    // JSON.parse checks JSON syntax; the YAML AST additionally rejects duplicate keys
    // and keeps integer precision until normalize can validate the value.
    if (from === "json") JSON.parse(input);
    if (!input.trim()) throw new Error("请输入 YAML 内容。");
    const document = parseDocument(input, {
      intAsBigInt: true,
      uniqueKeys: !relaxed,
    });
    if (document.errors.length || (!relaxed && document.warnings.length))
      throw new Error((document.errors[0] || document.warnings[0]).message);
    data = document.toJS({ mapAsMap: true, maxAliasCount: 100 });
  } else data = parseProperties(input);
  data = normalize(data, new Set(), 0, relaxed);
  if (to === "json") return JSON.stringify(data, null, 2);
  if (to === "yaml") return stringify(data, { lineWidth: 0 });
  return stringifyProperties(data);
}
