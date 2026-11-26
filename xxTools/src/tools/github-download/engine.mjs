export const MAX_FILES = 10000;
export const MAX_BYTES = 200 * 1024 * 1024;
export const TOKEN_KEY = "toolbox.github.token";
export function parseRepository(value) {
  const url = new URL(value);
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (
    url.origin !== "https://github.com" ||
    parts.length < 2 ||
    !/^[\w.-]+$/.test(parts[0]) ||
    !/^[\w.-]+$/.test(parts[1]) ||
    (parts[2] && !["tree", "blob"].includes(parts[2]))
  )
    throw new Error("请打开 GitHub 仓库的文件列表或文件页。");
  return { owner: parts[0], repo: parts[1], tail: parts.slice(3) };
}
function safePath(path) {
  if (
    !path ||
    /^[a-z]:/i.test(path) ||
    path.includes("\\") ||
    /[\x00-\x1f]/.test(path) ||
    path.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error("仓库路径无法安全写入 ZIP。");
  return path;
}
export function selectedPath(value, repo, ref) {
  const url = new URL(value);
  const prefix = `/${repo.owner}/${repo.repo}/`;
  const path = decodeURIComponent(url.pathname);
  if (url.origin !== "https://github.com" || !path.startsWith(prefix))
    throw new Error("选择包含其他仓库的链接。");
  const rest = path.slice(prefix.length);
  if (!rest.startsWith(`tree/${ref}/`) && !rest.startsWith(`blob/${ref}/`))
    throw new Error("选择项不属于当前分支，请刷新页面后重选。");
  return safePath(rest.slice(rest.indexOf("/") + 1 + ref.length + 1));
}
export async function resolveRevision(repo, api) {
  const base = `/repos/${repo.owner}/${repo.repo}`;
  let candidates = [];
  if (!repo.tail.length) candidates = [(await api(base)).default_branch];
  else
    candidates = repo.tail.map((_, i) =>
      repo.tail.slice(0, repo.tail.length - i).join("/"),
    );
  for (const ref of candidates) {
    try {
      const commit = await api(`${base}/commits/${encodeURIComponent(ref)}`);
      return {
        ...repo,
        ref,
        sha: commit.sha,
        treeSha: commit.commit?.tree?.sha || commit.sha,
      };
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  throw new Error("无法解析当前分支或提交，请确认仓库访问权限。");
}
export async function collectFiles(
  repo,
  items,
  api,
  progress = (_text) => {},
  signal,
) {
  const base = `/repos/${repo.owner}/${repo.repo}/git/trees/`;
  const cache = new Map();
  async function tree(sha, recursive = false) {
    signal?.throwIfAborted();
    const key = sha + (recursive ? "?recursive=1" : "");
    if (!cache.has(key)) cache.set(key, await api(base + key));
    return cache.get(key);
  }
  const selected = items.map((item) => ({
    ...item,
    path: selectedPath(item.url, repo, repo.ref),
  }));
  const roots = selected.filter(
    (item) =>
      !selected.some(
        (other) =>
          other !== item &&
          other.type === "tree" &&
          item.path.startsWith(other.path + "/"),
      ),
  );
  const files = new Map();
  let bytes = 0;
  function add(entry, path) {
    safePath(path);
    if (entry.type === "commit")
      throw new Error(
        `所选目录包含子模块 ${path}，请单独克隆子模块或缩小选择范围。`,
      );
    if (entry.type !== "blob" || files.has(path)) return;
    bytes += entry.size || 0;
    if (files.size >= MAX_FILES || bytes > MAX_BYTES)
      throw new Error("单次最多下载 10,000 个文件、200 MiB，请缩小选择范围。");
    files.set(path, { path, sha: entry.sha, size: entry.size || 0 });
    progress(`已发现 ${files.size} 个文件`);
  }
  async function walk(sha, prefix) {
    const data = await tree(sha, true);
    if (!data.truncated) {
      for (const entry of data.tree) add(entry, prefix + entry.path);
      return;
    }
    async function descend(sha, prefix) {
      const data = await tree(sha);
      if (data.truncated)
        throw new Error("GitHub 返回的目录列表不完整，已停止以避免缺失文件。");
      for (const entry of data.tree) {
        safePath(entry.path);
        if (entry.type === "tree")
          await descend(entry.sha, prefix + entry.path + "/");
        else add(entry, prefix + entry.path);
      }
    }
    await descend(sha, prefix);
  }
  for (const item of roots) {
    let sha = repo.treeSha || repo.sha;
    let entry;
    for (const segment of item.path.split("/")) {
      const data = await tree(sha);
      if (data.truncated) throw new Error("GitHub 返回的目录列表不完整。");
      entry = data.tree.find((node) => node.path === segment);
      if (!entry) throw new Error(`所选路径已不存在：${item.path}`);
      sha = entry.sha;
    }
    if (entry.type === "tree") await walk(entry.sha, item.path + "/");
    else add(entry, item.path);
  }
  if (!files.size) throw new Error("没有可下载的文件。");
  return [...files.values()].sort((a, b) => a.path.localeCompare(b.path));
}
export async function downloadArchive(
  repo,
  files,
  raw,
  progress = (_text) => {},
  signal,
) {
  signal?.throwIfAborted();
  const { default: JSZip } = await import("jszip");
  signal?.throwIfAborted();
  const batch = new AbortController();
  const abort = () => batch.abort(signal.reason);
  signal?.addEventListener("abort", abort, { once: true });
  const zip = new JSZip();
  let cursor = 0,
    done = 0,
    bytes = 0,
    failed = false;
  let failure;
  async function worker() {
    try {
      while (cursor < files.length && !failed) {
        batch.signal.throwIfAborted();
        const file = files[cursor++];
        const buffer = await raw(
          `/repos/${repo.owner}/${repo.repo}/git/blobs/${file.sha}`,
          batch.signal,
        );
        batch.signal.throwIfAborted();
        bytes += buffer.byteLength;
        if (bytes > MAX_BYTES)
          throw new Error("实际下载超过 200 MiB，请缩小选择范围。");
        zip.file(file.path, buffer);
        progress(`下载 ${++done}/${files.length}：${file.path}`);
      }
    } catch (error) {
      failed = true;
      failure ||= error;
      batch.abort(error);
      throw error;
    }
  }
  try {
    await Promise.allSettled(
      Array.from({ length: Math.min(4, files.length) }, worker),
    );
    if (failure) throw failure;
    batch.signal.throwIfAborted();
    return await zip.generateAsync(
      {
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 3 },
      },
      (info) => {
        batch.signal.throwIfAborted();
        progress(`打包 ZIP：${Math.round(info.percent)}%`);
      },
    );
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}
export function githubApi(token = "", signal, fetcher = fetch) {
  async function request(path, raw = false, requestSignal = signal) {
    if (!path.startsWith("/repos/")) throw new Error("不允许的 API 路径。");
    requestSignal?.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort(requestSignal.reason);
    requestSignal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(
      () => controller.abort(new Error("GitHub 请求超时，请重试。")),
      45000,
    );
    try {
      const response = await fetcher("https://api.github.com" + path, {
        signal: controller.signal,
        credentials: "omit",
        redirect: "error",
        headers: {
          Accept: raw
            ? "application/vnd.github.raw+json"
            : "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        const text =
          response.status === 403 || response.status === 429
            ? "GitHub API 限流或权限不足，可在 GitHub 下载工具中设置 Token 后重试。"
            : response.status === 401
              ? "GitHub Token 无效或已过期。"
              : response.status === 404
                ? "仓库、分支或文件不存在，私有仓库需配置有读取权限的 Token。"
                : `GitHub 请求失败（HTTP ${response.status}）。`;
        const error = new Error(text);
        error.status = response.status;
        throw error;
      }
      if (raw) {
        if (Number(response.headers.get("content-length")) > MAX_BYTES)
          throw new Error("单个文件超过 200 MiB。");
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > MAX_BYTES) throw new Error("单个文件超过 200 MiB。");
            chunks.push(value);
          }
        } catch (error) {
          await reader.cancel().catch(() => {});
          throw error;
        }
        const data = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          data.set(chunk, offset);
          offset += chunk.byteLength;
        }
        return data;
      }
      return await response.json();
    } finally {
      clearTimeout(timer);
      requestSignal?.removeEventListener("abort", abort);
    }
  }
  return {
    json: (path) => request(path),
    raw: (path, requestSignal = signal) => request(path, true, requestSignal),
  };
}
