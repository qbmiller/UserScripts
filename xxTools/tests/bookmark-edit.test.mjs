import { test } from "node:test";
import assert from "node:assert/strict";
import {
  editBookmark,
  moveFolders,
  canEditBookmark,
  deletionSize,
} from "../src/bookmarks/edit.mjs";
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
                  url: "https://example.com/",
                },
                { id: "4", parentId: "2", title: "子目录", children: [] },
              ],
            },
            { id: "5", parentId: "1", title: "目标", children: [] },
          ],
        },
      ],
    },
  ];
  const calls = [];
  const api = { getTree: async () => structuredClone(tree) };
  for (const name of ["update", "move", "remove", "removeTree"])
    api[name] = async (...args) => calls.push([name, ...args]);
  return { tree, api, calls };
}
test("重命名与网址修改、空名称和不安全网址验证", async () => {
  const { api, calls } = setup();
  await editBookmark(api, {
    type: "rename",
    id: "3",
    title: " 新名称 ",
    url: "https://vuejs.org",
  });
  assert.deepEqual(calls, [
    ["update", "3", { title: "新名称", url: "https://vuejs.org/" }],
  ]);
  await assert.rejects(
    editBookmark(api, {
      type: "rename",
      id: "3",
      title: " ",
      url: "https://a.com",
    }),
    /名称/,
  );
  await assert.rejects(
    editBookmark(api, {
      type: "rename",
      id: "3",
      title: "a",
      url: "javascript:alert(1)",
    }),
    /有效/,
  );
});
test("内置目录不可编辑，不能把文件夹移入自己或后代", async () => {
  const { tree, api } = setup();
  assert.equal(canEditBookmark(tree[0].children[0]), false);
  assert.deepEqual(
    moveFolders(tree, "2").map((x) => x.id),
    ["1", "5"],
  );
  await assert.rejects(
    editBookmark(api, { type: "move", id: "2", parentId: "4" }),
    /不能移入/,
  );
  await assert.rejects(editBookmark(api, { type: "delete", id: "1" }), /内置/);
});
test("移动选择目标前/末尾，校验过期位置", async () => {
  const { api, calls } = setup();
  await editBookmark(api, {
    type: "move",
    id: "3",
    parentId: "2",
    beforeId: "4",
  });
  await editBookmark(api, {
    type: "move",
    id: "3",
    parentId: "5",
    beforeId: "",
  });
  assert.deepEqual(calls, [
    ["move", "3", { parentId: "2", index: 1 }],
    ["move", "3", { parentId: "5", index: 0 }],
  ]);
  await assert.rejects(
    editBookmark(api, {
      type: "move",
      id: "3",
      parentId: "5",
      beforeId: "gone",
    }),
    /位置已改变/,
  );
});
test("删除书签或文件夹，并拒绝确认后已变化的快照", async () => {
  const { tree, api, calls } = setup();
  const folder = tree[0].children[0].children[0];
  const recycle = async (node) => calls.push(["recycle", node.id]);
  assert.deepEqual(deletionSize(folder), { bookmarks: 1, folders: 2 });
  await editBookmark(
    api,
    {
      type: "delete",
      id: "2",
      snapshot: JSON.stringify(folder),
    },
    recycle,
  );
  await editBookmark(
    api,
    {
      type: "delete",
      id: "3",
      snapshot: JSON.stringify(folder.children[0]),
    },
    recycle,
  );
  assert.deepEqual(calls, [
    ["recycle", "2"],
    ["recycle", "3"],
  ]);
  await assert.rejects(
    editBookmark(api, { type: "delete", id: "2", snapshot: "{}" }),
    /发生变化/,
  );
});
