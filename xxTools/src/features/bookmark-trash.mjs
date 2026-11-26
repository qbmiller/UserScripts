import { editBookmark, indexBookmarks } from "../bookmarks/edit.mjs";

export const TRASH_KEY = "toolbox.bookmark-trash";
export const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const ALARM = "toolbox.bookmark-trash-cleanup";

// 全部窗口通过后台队列写入，避免并发删除/恢复覆盖记录。
export function createBookmarkTrash(api, now = Date.now) {
  let queue = Promise.resolve();
  const write = (entries) => api.storage.local.set({ [TRASH_KEY]: entries });
  async function read() {
    const data = await api.storage.local.get(TRASH_KEY);
    return Array.isArray(data[TRASH_KEY]) ? data[TRASH_KEY] : [];
  }
  async function clean() {
    const entries = await read();
    const nodes = indexBookmarks(await api.bookmarks.getTree());
    const kept = entries.filter(
      (entry) =>
        // 保存后、浏览器删除前中断的记录不视为已删除。
        !(entry.pending && nodes.has(entry.node.id)) &&
        entry.deletedAt > now() - RETENTION_MS,
    );
    if (kept.length !== entries.length) await write(kept);
    return kept;
  }
  async function run(action, details) {
    const entries = await clean();
    if (action === "list" || action === "cleanup") return { entries };
    if (action === "delete") {
      return editBookmark(
        api.bookmarks,
        {
          type: "delete",
          id: details.id,
          snapshot: details.snapshot,
        },
        async (node) => {
          const tree = await api.bookmarks.getTree();
          const nodes = indexBookmarks(tree);
          const ancestors = [];
          let parent = nodes.get(node.parentId);
          while (parent) {
            ancestors.push({ id: parent.id, title: parent.title });
            parent = nodes.get(parent.parentId);
          }
          const siblings = nodes.get(node.parentId)?.children || [];
          const entry = {
            id: crypto.randomUUID(),
            deletedAt: now(),
            node: structuredClone(node),
            index: siblings.findIndex((item) => item.id === node.id),
            ancestors,
            pending: true,
          };
          // 必须先持久化完整子树；存储失败时绝不删除浏览器书签。
          await write([...entries, entry]);
          try {
            const fresh = indexBookmarks(await api.bookmarks.getTree()).get(
              node.id,
            );
            if (JSON.stringify(fresh) !== details.snapshot)
              throw new Error("此项在确认期间发生变化，请重新确认删除。");
            if (node.url) await api.bookmarks.remove(node.id);
            else await api.bookmarks.removeTree(node.id);
          } catch (error) {
            // 删除失败时保留原书签，不留下重复的回收站记录。
            if (indexBookmarks(await api.bookmarks.getTree()).has(node.id))
              await write(entries);
            throw error;
          }
          // pending 记录也可恢复：下一次读取会依据源 ID 判断删除是否成功。
          return { id: entry.id };
        },
      );
    }
    const entry = entries.find((item) => item.id === details.id);
    if (!entry) throw new Error("回收站记录已过期或已处理，请刷新。");
    if (action !== "restore") throw new Error("未知的回收站操作。");
    const nodes = indexBookmarks(await api.bookmarks.getTree());
    const writable = (node) =>
      node && !node.url && !node.unmodifiable && node.parentId;
    const parent =
      entry.ancestors.map((item) => nodes.get(item.id)).find(writable) ||
      [...nodes.values()].find(
        (node) => writable(node) && node.parentId === "0",
      );
    if (!parent)
      throw new Error("没有可写的恢复目录，请先创建一个收藏夹文件夹。");
    entry.restoredIds ||= {};
    async function restore(node, parentId, index) {
      let created = nodes.get(entry.restoredIds[node.id]);
      if (!created) {
        created = await api.bookmarks.create({
          parentId,
          title: node.title,
          ...(node.url ? { url: node.url } : {}),
          ...(Number.isInteger(index) ? { index } : {}),
        });
        entry.restoredIds[node.id] = created.id;
        try {
          await write(entries);
        } catch (error) {
          delete entry.restoredIds[node.id];
          // 检查点保存失败，撤销本次创建；原快照仍在回收站。
          if (node.url) await api.bookmarks.remove(created.id);
          else await api.bookmarks.removeTree(created.id);
          throw error;
        }
        nodes.set(created.id, created);
      }
      for (const child of node.children || []) await restore(child, created.id);
      return created;
    }
    const restored = await restore(
      entry.node,
      parent.id,
      Math.max(0, Math.min(entry.index, parent.children?.length || 0)),
    );
    await write(entries.filter((item) => item.id !== entry.id));
    return { restoredId: restored.id, parentTitle: parent.title };
  }
  return (action, details = {}) => {
    const result = queue.catch(() => {}).then(() => run(action, details));
    queue = result;
    return result;
  };
}

export function registerBookmarkTrash(api) {
  const request = createBookmarkTrash(api);
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (
      message?.type !== "toolbox.bookmark-trash" ||
      sender.id !== api.runtime.id ||
      sender.tab ||
      !sender.url?.startsWith(api.runtime.getURL(""))
    )
      return;
    request(message.action, message).then(
      (result) => respond({ ok: true, ...result }),
      (error) =>
        respond({ ok: false, error: error.message || "回收站操作失败。" }),
    );
    return true;
  });
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM) void request("cleanup").catch(() => {});
  });
  // 每次后台启动兜底清理；每天检查，浏览器关闭期间的数据在下次启动处理。
  void request("cleanup").catch(() => {});
  void api.alarms.create(ALARM, { periodInMinutes: 60 * 24 });
}
