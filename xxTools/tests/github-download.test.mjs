import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseRepository,
  selectedPath,
  resolveRevision,
  collectFiles,
  downloadArchive,
} from "../src/tools/github-download/engine.mjs";
test("识别仓库，拒绝其他域名、PR 和路径穿越", () => {
  assert.equal(
    parseRepository("https://github.com/o/r/tree/feature/a/src").repo,
    "r",
  );
  for (const url of ["https://evil.com/o/r", "https://github.com/o/r/pull/1"])
    assert.throws(() => parseRepository(url));
  assert.equal(
    selectedPath(
      "https://github.com/o/r/blob/feature/a/src/%E4%B8%AD.txt",
      { owner: "o", repo: "r" },
      "feature/a",
    ),
    "src/中.txt",
  );
  assert.throws(() =>
    selectedPath(
      "https://github.com/x/r/blob/main/a",
      { owner: "o", repo: "r" },
      "main",
    ),
  );
});
test("带斜杠分支解析并固定提交，不误用默认分支", async () => {
  const calls = [];
  const api = async (path) => {
    calls.push(path);
    if (path.endsWith("/commits/feature%2Fa")) return { sha: "a".repeat(40) };
    const e = new Error("404");
    e.status = 404;
    throw e;
  };
  const revision = await resolveRevision(
    parseRepository("https://github.com/o/r/tree/feature/a/src"),
    api,
  );
  assert.equal(revision.ref, "feature/a");
  assert.equal(revision.sha, "a".repeat(40));
  assert.equal(calls.length, 2);
});
test("目录树被截断时逐层读取，去重已选子文件并保留路径", async () => {
  const api = async (path) => {
    if (path.endsWith("/git/trees/commit"))
      return { tree: [{ type: "tree", path: "src", sha: "dir" }] };
    if (path.endsWith("/git/trees/dir?recursive=1"))
      return { truncated: true, tree: [] };
    if (path.endsWith("/git/trees/dir"))
      return {
        tree: [
          { type: "blob", mode: "100644", path: "a.txt", sha: "a", size: 1 },
          { type: "tree", path: "sub", sha: "sub" },
        ],
      };
    if (path.endsWith("/git/trees/sub"))
      return {
        tree: [
          { type: "blob", mode: "100644", path: "b.txt", sha: "b", size: 1 },
        ],
      };
    throw new Error(path);
  };
  const context = { owner: "o", repo: "r", ref: "main", sha: "commit" };
  const files = await collectFiles(
    context,
    [
      { url: "https://github.com/o/r/tree/main/src", type: "tree" },
      { url: "https://github.com/o/r/blob/main/src/a.txt", type: "blob" },
    ],
    api,
  );
  assert.deepEqual(
    files.map((f) => f.path),
    ["src/a.txt", "src/sub/b.txt"],
  );
});
test("下载 ZIP 保留二进制和路径，失败/取消不返回部分 ZIP", async () => {
  const files = [{ path: "src/a.bin", sha: "a", size: 3 }];
  const blob = await downloadArchive(
    { owner: "o", repo: "r" },
    files,
    async () => new Uint8Array([0, 128, 255]),
  );
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.deepEqual(
    [...(await zip.file("src/a.bin").async("uint8array"))],
    [0, 128, 255],
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    downloadArchive(
      { owner: "o", repo: "r" },
      files,
      async () => new Uint8Array(),
      () => {},
      controller.signal,
    ),
  );
});
test("任一下载失败会终止该批请求，旧请求不会再回调进度", async () => {
  let release, started, slowSignal;
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  const progress = [];
  const result = downloadArchive(
    { owner: "o", repo: "r" },
    [
      { path: "a", sha: "a" },
      { path: "b", sha: "b" },
    ],
    async (path, signal) => {
      if (path.endsWith("/a")) {
        await Promise.resolve();
        throw new Error("a failed");
      }
      slowSignal = signal;
      started();
      return new Promise((resolve) => {
        release = resolve;
      });
    },
    (text) => progress.push(text),
  ).then(
    () => null,
    (error) => error,
  );
  await ready;
  await new Promise((resolve) => setImmediate(resolve));
  const aborted = slowSignal?.aborted;
  release(new Uint8Array([1]));
  const error = await result;
  await new Promise((resolve) => setImmediate(resolve));
  assert.match(error.message, /a failed/);
  assert.equal(aborted, true);
  assert.deepEqual(progress, []);
});
