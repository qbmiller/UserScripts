export function flattenBookmarks(nodes, folders = []) {
  const result = [];
  for (const node of nodes) {
    if (node.url)
      result.push({
        id: node.id,
        title: node.title || node.url,
        url: node.url,
        folders: [...folders],
      });
    else if (node.children)
      result.push(
        ...flattenBookmarks(
          node.children,
          node.title ? [...folders, node.title] : folders,
        ),
      );
  }
  return result;
}
export function websiteOf(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol)
      ? url.hostname.toLowerCase().replace(/^www\./, "")
      : "其他地址";
  } catch {
    return "其他地址";
  }
}
export function groupByWebsite(bookmarks) {
  const groups = new Map();
  for (const item of bookmarks) {
    const id = websiteOf(item.url);
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(item);
  }
  return [...groups]
    .map(([id, items]) => ({ id, items }))
    .sort(
      (a, b) => b.items.length - a.items.length || a.id.localeCompare(b.id),
    );
}
export function searchBookmarks(bookmarks, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return bookmarks.filter((item) =>
    terms.every((term) =>
      [item.title, item.url, ...item.folders]
        .join(" ")
        .toLowerCase()
        .includes(term),
    ),
  );
}
export function bookmarkTarget(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:", "ftp:", "file:", "chrome:", "edge:"].includes(
      url.protocol,
    )
      ? url.href
      : null;
  } catch {
    return null;
  }
}
