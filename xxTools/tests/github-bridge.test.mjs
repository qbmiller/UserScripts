import { test } from "node:test";
import assert from "node:assert/strict";
import { registerGitHubDownload } from "../src/features/github-download.mjs";
import { githubApi } from "../src/tools/github-download/engine.mjs";
function setup() {
  let listener;
  const tasks = {};
  const opened = [];
  const api = {
    runtime: {
      id: "own",
      getURL: (path) => "chrome-extension://own/" + path,
      onMessage: {
        addListener: (fn) => {
          listener = fn;
        },
      },
    },
    storage: {
      session: {
        get: async (key) => (key ? { [key]: tasks[key] } : { ...tasks }),
        set: async (values) => Object.assign(tasks, values),
        remove: async (keys) => {
          for (const key of Array.isArray(keys) ? keys : [keys])
            delete tasks[key];
        },
      },
    },
    tabs: {
      create: async (tab) => {
        opened.push(tab);
      },
    },
  };
  registerGitHubDownload(api);
  return { send: (...args) => listener(...args), tasks, opened };
}
const pageUrl = "https://github.com/o/r/tree/main/src";
const message = {
  type: "toolbox.github.create-job",
  pageUrl,
  items: [{ url: "https://github.com/o/r/blob/main/src/a.txt", type: "blob" }],
};
const sender = { id: "own", frameId: 0, url: pageUrl, tab: { id: 1 } };
test("GitHub 选择任务仅接受本扩展顶层内容脚本，检查来源与跨仓库链接", async () => {
  const state = setup();
  for (const bad of [
    { ...sender, id: "other" },
    { ...sender, frameId: 1 },
    { ...sender, tab: undefined },
  ])
    assert.equal(
      state.send(message, bad, () => assert.fail()),
      undefined,
    );
  const response = await new Promise((resolve) =>
    state.send(message, sender, resolve),
  );
  assert.equal(response.ok, true);
  assert.equal(state.opened.length, 1);
  assert.match(
    state.opened[0].url,
    /^chrome-extension:\/\/own\/github-download.html\?job=/,
  );
  const task = Object.values(state.tasks)[0];
  assert.deepEqual(task.items, message.items);
  assert.equal(task.pageUrl, pageUrl);
  const invalid = await new Promise((resolve) =>
    state.send(
      {
        ...message,
        items: [{ url: "https://github.com/evil/r/blob/main/a", type: "blob" }],
      },
      sender,
      resolve,
    ),
  );
  assert.equal(invalid.ok, false);
  assert.equal(state.opened.length, 1);
});
test("API Token 只发送给固定 API 域名，禁止重定向，限流显示操作建议", async () => {
  let request;
  const api = githubApi("private-token", undefined, async (url, options) => {
    request = { url, options };
    return new Response('{"ok":true}', { status: 200 });
  });
  assert.deepEqual(await api.json("/repos/o/r"), { ok: true });
  assert.equal(request.url, "https://api.github.com/repos/o/r");
  assert.equal(request.options.headers.Authorization, "Bearer private-token");
  assert.equal(request.options.redirect, "error");
  assert.equal(request.options.credentials, "omit");
  await assert.rejects(api.json("https://evil.com"), /不允许/);
  await assert.rejects(
    githubApi(
      "",
      undefined,
      async () => new Response("", { status: 403 }),
    ).json("/repos/o/r"),
    /Token/,
  );
});
