import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBookmarkTrash,
  TRASH_KEY,
  RETENTION_MS,
  registerBookmarkTrash,
} from "../src/features/bookmark-trash.mjs";
import { indexBookmarks } from "../src/bookmarks/edit.mjs";

function setup() {
  const tree = [
    {
      id: "0",
      title: "",
      children: [
        {
          id: "1",
          parentId: "0",
          title: "书签栏",
          children: [
            {
              id: "2",
              parentId: "1",
              title: "开发",
              children: [
                {
                  id: "3",
                  parentId: "2",
                  title: "原书签",
                  url: "https://example.com",
                },
                {
                  id: "4",
                  parentId: "2",
                  title: "子目录",
                  children: [
                    {
                      id: "5",
                      parentId: "4",
                      title: "另一个",
                      url: "https://vuejs.org",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ];
  const data = {};
  let sequence = 10,
    clock = 2000000000000;
  let failWrite = false,
    failRemove = false,
    failCreate = false;
  const nodes = () => indexBookmarks(tree);
  function remove(id) {
    if (failRemove) throw new Error("删除失败");
    const node = nodes().get(id);
    const parent = nodes().get(node.parentId);
    parent.children.splice(
      parent.children.findIndex((item) => item.id === id),
      1,
    );
  }
  const api = {
    bookmarks: {
      getTree: async () => structuredClone(tree),
      remove: async (id) => remove(id),
      removeTree: async (id) => remove(id),
      async create(details) {
        if (failCreate) throw new Error("创建失败");
        const parent = nodes().get(details.parentId);
        const node = {
          id: String(sequence++),
          parentId: parent.id,
          title: details.title,
          ...(details.url ? { url: details.url } : { children: [] }),
        };
        parent.children.splice(
          details.index ?? parent.children.length,
          0,
          node,
        );
        return structuredClone(node);
      },
    },
    storage: {
      local: {
        async get(key) {
          return { [key]: structuredClone(data[key]) };
        },
        async set(value) {
          if (failWrite) throw new Error("配额不足");
          Object.assign(data, structuredClone(value));
        },
      },
    },
  };
  const request = createBookmarkTrash(api, () => clock);
  const del = (id) =>
    request("delete", { id, snapshot: JSON.stringify(nodes().get(id)) });
  return {
    api,
    data,
    tree,
    nodes,
    request,
    del,
    remove,
    setClock(value) {
      clock = value;
    },
    getClock() {
      return clock;
    },
    failWrite(value) {
      failWrite = value;
    },
    failRemove(value) {
      failRemove = value;
    },
    failCreate(value) {
      failCreate = value;
    },
  };
}

test("文件夹删除先保存完整子树，恢复原目录层级、顺序及网址", async () => {
  const s = setup();
  await s.del("2");
  assert.equal(s.nodes().has("2"), false);
  const { entries } = await s.request("list");
  assert.equal(entries.length, 1);
  assert.equal(
    entries[0].node.children[1].children[0].url,
    "https://vuejs.org",
  );
  await s.request("restore", { id: entries[0].id });
  const folder = s.tree[0].children[0].children[0];
  assert.equal(folder.title, "开发");
  assert.deepEqual(
    folder.children.map((n) => n.title),
    ["原书签", "子目录"],
  );
  assert.equal(folder.children[1].children[0].url, "https://vuejs.org");
  assert.deepEqual((await s.request("list")).entries, []);
});

test("回收站存储失败时不删除真实书签；浏览器拒绝删除时不留下重复备份", async () => {
  const s = setup();
  s.failWrite(true);
  await assert.rejects(s.del("3"), /配额/);
  assert.equal(s.nodes().has("3"), true);
  s.failWrite(false);
  s.failRemove(true);
  await assert.rejects(s.del("3"), /删除失败/);
  assert.equal(s.nodes().has("3"), true);
  assert.deepEqual((await s.request("list")).entries, []);
});

test("删除后原父目录不存在时，恢复到最近可用上级目录", async () => {
  const s = setup();
  await s.del("3");
  const { entries } = await s.request("list");
  s.remove("2");
  const result = await s.request("restore", { id: entries[0].id });
  assert.equal(result.parentTitle, "书签栏");
  assert.equal(s.tree[0].children[0].children[0].url, "https://example.com");
});

test("清理只影响超过保留期的回收站记录，不删除现有浏览器书签", async () => {
  const s = setup();
  await s.del("3");
  const deletedAt = s.getClock();
  s.setClock(deletedAt + RETENTION_MS - 1);
  assert.equal((await s.request("cleanup")).entries.length, 1);
  s.setClock(deletedAt + RETENTION_MS);
  assert.deepEqual((await s.request("cleanup")).entries, []);
  assert.equal(s.nodes().has("4"), true);
});

test("并发删除串行保存、不丢记录；重复恢复不会创建重复书签", async () => {
  const s = setup();
  await Promise.all([s.del("3"), s.del("4")]);
  const { entries } = await s.request("list");
  assert.equal(entries.length, 2);
  const results = await Promise.allSettled([
    s.request("restore", { id: entries[0].id }),
    s.request("restore", { id: entries[0].id }),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    ["fulfilled", "rejected"],
  );
  assert.equal(
    [...s.nodes().values()].filter((n) => n.url === "https://example.com")
      .length,
    1,
  );
});

test("恢复中途失败保留快照和进度，重试不会重复创建已恢复部分", async () => {
  const s = setup();
  await s.del("2");
  const { entries } = await s.request("list");
  const create = s.api.bookmarks.create;
  let count = 0;
  s.api.bookmarks.create = async (details) => {
    if (++count === 3) throw new Error("创建失败");
    return create(details);
  };
  await assert.rejects(s.request("restore", { id: entries[0].id }), /创建失败/);
  assert.equal((await s.request("list")).entries.length, 1);
  s.api.bookmarks.create = create;
  await s.request("restore", { id: entries[0].id });
  assert.equal(
    [...s.nodes().values()].filter((n) => n.title === "开发").length,
    1,
  );
  assert.equal(
    [...s.nodes().values()].filter((n) => n.url === "https://example.com")
      .length,
    1,
  );
  assert.equal(
    [...s.nodes().values()].filter((n) => n.url === "https://vuejs.org").length,
    1,
  );
});

test("检查点存储失败时撤销刚创建节点，保留可恢复快照", async () => {
  const s = setup();
  await s.del("3");
  const { entries } = await s.request("list");
  s.failWrite(true);
  await assert.rejects(s.request("restore", { id: entries[0].id }), /配额/);
  assert.equal(
    [...s.nodes().values()].some((n) => n.url === "https://example.com"),
    false,
  );
  s.failWrite(false);
  await s.request("restore", { id: entries[0].id });
  assert.equal(
    [...s.nodes().values()].filter((n) => n.url === "https://example.com")
      .length,
    1,
  );
});

test("保存后、删除前中断的记录不会重复进入回收站", async () => {
  const s = setup();
  s.data[TRASH_KEY] = [
    {
      id: "pending",
      deletedAt: s.getClock(),
      pending: true,
      node: structuredClone(s.nodes().get("3")),
    },
  ];
  assert.deepEqual((await s.request("list")).entries, []);
  assert.equal(s.nodes().has("3"), true);
});

test("回收站消息拒绝网页来源，注册每日清理任务", async () => {
  const s = setup();
  let listener, alarmListener, created;
  s.api.runtime = {
    id: "own",
    getURL: () => "chrome-extension://own/",
    onMessage: {
      addListener(fn) {
        listener = fn;
      },
    },
  };
  s.api.alarms = {
    onAlarm: {
      addListener(fn) {
        alarmListener = fn;
      },
    },
    create(name, options) {
      created = { name, ...options };
    },
  };
  registerBookmarkTrash(s.api);
  const message = { type: "toolbox.bookmark-trash", action: "list" };
  assert.equal(
    listener(
      message,
      { id: "own", tab: { id: 1 }, url: "https://example.com" },
      () => assert.fail(),
    ),
    undefined,
  );
  const result = await new Promise((resolve) =>
    listener(
      message,
      { id: "own", url: "chrome-extension://own/sidepanel.html" },
      resolve,
    ),
  );
  assert.equal(result.ok, true);
  assert.equal(created.periodInMinutes, 1440);
  assert.equal(typeof alarmListener, "function");
});
