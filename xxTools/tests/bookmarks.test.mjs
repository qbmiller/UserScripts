import { test } from "node:test";
import assert from "node:assert/strict";
import {
  flattenBookmarks,
  groupByWebsite,
  searchBookmarks,
  bookmarkTarget,
} from "../src/bookmarks/model.mjs";
const tree = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "书签栏",
        children: [
          {
            id: "2",
            title: "开发",
            children: [
              { id: "3", title: "Vue 文档", url: "https://vuejs.org/guide/" },
              {
                id: "4",
                title: "GitHub",
                url: "https://github.com/vuejs/core",
              },
            ],
          },
          { id: "5", title: "Vue 首页", url: "https://www.vuejs.org/" },
          { id: "6", title: "脚本", url: "javascript:alert(1)" },
          { id: "7", title: "坏地址", url: "invalid" },
        ],
      },
    ],
  },
];
test("展开书签保留来源路径、顺序和重复网址，不修改原始树", () => {
  const before = JSON.stringify(tree);
  const files = flattenBookmarks(tree);
  assert.equal(files.length, 5);
  assert.deepEqual(files[0].folders, ["书签栏", "开发"]);
  assert.equal(JSON.stringify(tree), before);
  assert.equal(flattenBookmarks([]).length, 0);
});
test("网站分组规范化 www 和大小写，保留不同子域并处理特殊地址", () => {
  const files = flattenBookmarks(tree);
  const groups = groupByWebsite(files);
  assert.equal(groups.find((g) => g.id === "vuejs.org").items.length, 2);
  assert.equal(groups.find((g) => g.id === "其他地址").items.length, 2);
  const sub = groupByWebsite([
    { url: "https://docs.example.com/a" },
    { url: "https://example.com/a" },
  ]);
  assert.equal(sub.length, 2);
});
test("搜索标题、网址、文件夹路径，且不执行书签脚本", () => {
  const files = flattenBookmarks(tree);
  assert.equal(searchBookmarks(files, "VUE").length, 3);
  assert.equal(searchBookmarks(files, "开发 文档").length, 1);
  assert.equal(bookmarkTarget("javascript:alert(1)"), null);
  assert.equal(bookmarkTarget("data:text/html,test"), null);
  assert.equal(bookmarkTarget("https://github.com"), "https://github.com/");
});
