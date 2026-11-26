const graphemes = new Intl.Segmenter("zh-CN", { granularity: "grapheme" });

export function countText(text) {
  const normalized = text.replace(/\r\n?/g, "\n");
  let characters = 0;
  let nonWhitespace = 0;
  for (const { segment } of graphemes.segment(normalized)) {
    characters++;
    if (!/^\s+$/u.test(segment)) nonWhitespace++;
  }
  return {
    characters,
    nonWhitespace,
    chinese: (normalized.match(/\p{Script=Han}/gu) || []).length,
    englishWords: (normalized.match(/[A-Za-z]+(?:['’\-][A-Za-z]+)*/g) || []).length,
    digits: (normalized.match(/\p{Nd}/gu) || []).length,
    lines: normalized ? normalized.split("\n").length : 0,
  };
}
