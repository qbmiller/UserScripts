const compactText = (value) => value.replace(/\s+/g, "").trim();

// 微信编辑器常以整段加粗代替 h 标签。仅接受短、完整加粗的独立段落。
export function headingLevel({ tag, text, boldText }) {
  if (/^H[1-6]$/.test(tag)) return Number(tag[1]);
  const title = compactText(text);
  if (
    !title ||
    title.length > 48 ||
    compactText(boldText) !== title ||
    /[。！？；：.!?;:]$/.test(title) ||
    /^[（(]\d+[）)]/.test(title)
  )
    return null;
  return /^[一二三四五六七八九十百]+[、．.]/.test(title) ? 2 : 3;
}

export function collectArticleHeadings(article) {
  return [...article.querySelectorAll("h1,h2,h3,h4,h5,h6,p,section")].flatMap(
    (node) => {
      if (
        !/^H[1-6]$/.test(node.tagName) &&
        (node.closest("h1,h2,h3,h4,h5,h6,pre,code,blockquote") ||
          node.querySelector("p,section,h1,h2,h3,h4,h5,h6,img,video,iframe,br"))
      )
        return [];
      if (
        !node.getClientRects().length ||
        getComputedStyle(node).visibility === "hidden"
      )
        return [];
      const text = node.textContent.trim();
      if (!text) return [];
      // 不重复计算嵌套 strong（旧版微信正文经常嵌套多个）。
      const boldText = [...node.querySelectorAll("strong,b")]
        .filter((bold) => !bold.parentElement.closest("strong,b"))
        .map((bold) => bold.textContent)
        .join("");
      const level = headingLevel({ tag: node.tagName, text, boldText });
      return level ? [{ node, level }] : [];
    },
  );
}
