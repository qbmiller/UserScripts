import { bookmarkTarget } from "./model.mjs";

export function indexBookmarks(tree) {
  const nodes = new Map();
  function walk(items) {
    for (const item of items) {
      nodes.set(item.id, item);
      if (item.children) walk(item.children);
    }
  }
  walk(tree);
  return nodes;
}
export function canEditBookmark(node) {
  return (
    !!node?.parentId &&
    node.parentId !== "0" &&
    !node.unmodifiable &&
    !node.folderType
  );
}
export function moveFolders(tree, sourceId) {
  const result = [];
  function walk(items, path = []) {
    for (const node of items) {
      if (node.id === sourceId || node.url || node.unmodifiable) continue;
      const next = node.title ? [...path, node.title] : path;
      if (node.parentId)
        result.push({ id: node.id, title: next.join(" / ") || "未命名文件夹" });
      if (node.children) walk(node.children, next);
    }
  }
  walk(tree);
  return result;
}
export function deletionSize(node) {
  let bookmarks = 0,
    folders = 0;
  function walk(item) {
    if (item.url) bookmarks++;
    else {
      folders++;
      for (const child of item.children || []) walk(child);
    }
  }
  walk(node);
  return { bookmarks, folders };
}
export async function editBookmark(api, operation) {
  const tree = await api.getTree();
  const nodes = indexBookmarks(tree);
  const node = nodes.get(operation.id);
  if (!node) throw new Error("此书签已被删除，请刷新后重试。");
  if (!canEditBookmark(node))
    throw new Error("浏览器内置或受管理的文件夹不支持此操作。");
  if (operation.type === "rename") {
    const title = operation.title.trim();
    if (!title) throw new Error("名称不能为空。");
    const changes = { title };
    if (node.url && operation.url !== node.url) {
      const url = bookmarkTarget(operation.url.trim());
      if (!url) throw new Error("请输入有效的网址，不支持脚本或数据地址。");
      changes.url = url;
    }
    return api.update(node.id, changes);
  }
  if (operation.type === "move") {
    if (
      !moveFolders(tree, node.id).some(
        (folder) => folder.id === operation.parentId,
      )
    )
      throw new Error("不能移入自身、子文件夹或受管理的文件夹。");
    const parent = nodes.get(operation.parentId);
    const children = parent.children || [];
    const before = operation.beforeId
      ? children.find(
          (child) => child.id === operation.beforeId && child.id !== node.id,
        )
      : null;
    if (operation.beforeId && !before)
      throw new Error("目标位置已改变，请重新选择。");
    // Chrome 的 index 以移动前的目标列表为准，同目录移除造成的偏移由浏览器处理。
    const index = before ? children.indexOf(before) : children.length;
    return api.move(node.id, { parentId: parent.id, index });
  }
  if (operation.type === "delete") {
    // 确认后重新比较快照，避免确认期间新增的子书签一并被删。
    if (JSON.stringify(node) !== operation.snapshot)
      throw new Error("此项在确认期间发生变化，请取消后重新确认删除。");
    return node.url ? api.remove(node.id) : api.removeTree(node.id);
  }
  throw new Error("未知的书签操作。");
}
