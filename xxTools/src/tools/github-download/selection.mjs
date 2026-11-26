// 无网页依赖的安装入口，供 content script 和真实页面验证共用。
export function installGitHubSelection(bridge, onlyWhenSelected = true) {
  if (document.getElementById("xxtools-github-style"))
    return { dispose() {}, setOnlyWhenSelected() {} };
  const style = document.createElement("style");
  style.id = "xxtools-github-style";
  style.textContent = `
    .xxtools-github-check{appearance:auto!important;width:15px!important;height:15px!important;flex:none;align-self:center;margin:0 8px 0 0!important;vertical-align:middle!important;cursor:pointer!important;accent-color:#315f45}
    .react-directory-filename-column > .xxtools-github-check{margin-right:0!important}
    .js-navigation-item > .icon:has(> .xxtools-github-check){white-space:nowrap}
    #xxtools-github-bar{position:fixed;bottom:22px;left:22px;z-index:2147483000;display:flex;flex-wrap:wrap;align-items:center;gap:10px;max-width:calc(100vw - 44px);padding:12px 16px;border:1px solid var(--borderColor-default,#d0d7de);border-radius:12px;background:var(--bgColor-default,#fff);color:var(--fgColor-default,#24292f);box-shadow:0 5px 24px #0002;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #xxtools-github-bar[hidden]{display:none}#xxtools-github-bar strong{font-weight:650}#xxtools-github-bar button{border:1px solid var(--borderColor-default,#d0d7de);border-radius:7px;background:var(--bgColor-muted,#f6f8fa);color:inherit;padding:5px 9px;cursor:pointer;font:inherit}#xxtools-github-bar button[data-action="download"]{background:#315f45;color:#fff;border-color:#315f45}#xxtools-github-bar button:disabled{opacity:.5;cursor:default}#xxtools-github-status{max-width:320px;overflow-wrap:anywhere}
  `;
  document.head.append(style);
  const bar = document.createElement("section");
  bar.id = "xxtools-github-bar";
  bar.hidden = true;
  bar.setAttribute("aria-label", "xxTools GitHub 下载");
  bar.innerHTML =
    '<strong>xxTools</strong><span data-count></span><button data-action="all">全选当前页</button><button data-action="clear">清空</button><button data-action="download">下载 ZIP</button><span id="xxtools-github-status" role="status"></span>';
  document.body.append(bar);
  const selected = new Map();
  let current = location.pathname,
    items = [],
    valid = false,
    busy = false,
    timer;
  const status = bar.querySelector("#xxtools-github-status");
  function update() {
    bar.hidden =
      !valid || (!selected.size && (onlyWhenSelected || !items.length));
    const text = `已选 ${selected.size} 项`;
    if (bar.querySelector("[data-count]").textContent !== text)
      bar.querySelector("[data-count]").textContent = text;
    bar.querySelector('[data-action="download"]').disabled =
      busy || !selected.size;
    document.querySelectorAll(".xxtools-github-check").forEach((box) => {
      box.checked = selected.has(box.dataset.url);
    });
  }
  function createCheckbox(item, name) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "xxtools-github-check";
    box.dataset.url = item.url;
    box.setAttribute("aria-label", "选择下载 " + name);
    box.addEventListener("click", (event) => event.stopPropagation());
    box.addEventListener("change", () => {
      if (box.checked) selected.set(item.url, item);
      else selected.delete(item.url);
      update();
    });
    return box;
  }
  function entry(link) {
    try {
      const url = new URL(link.href, location.origin);
      const repo = location.pathname
        .split("/")
        .filter(Boolean)
        .slice(0, 2)
        .join("/");
      if (
        url.origin !== location.origin ||
        !url.pathname.startsWith("/" + repo + "/")
      )
        return null;
      const type = url.pathname.slice(repo.length + 2).split("/")[0];
      if (
        !["tree", "blob"].includes(type) ||
        link.textContent.trim() === ".." ||
        link.getAttribute("rel") === "up"
      )
        return null;
      return { url: url.origin + url.pathname, type };
    } catch {
      return null;
    }
  }
  function scan() {
    if (current !== location.pathname) {
      current = location.pathname;
      selected.clear();
      status.textContent = "";
      document
        .querySelectorAll(".xxtools-github-check")
        .forEach((box) => box.remove());
    }
    const parts = current.split("/").filter(Boolean);
    valid =
      parts.length >= 2 && (!parts[2] || ["tree", "blob"].includes(parts[2]));
    items = [];
    if (valid) {
      // 限定在真实文件行，避免为 README 中的链接、侧栏树和提交链接添加勾选框。
      document
        .querySelectorAll("tr.react-directory-row, .js-navigation-item")
        .forEach((row) => {
          const visible = [...row.querySelectorAll("a[href]")].filter(
            (link) => link.getClientRects().length && entry(link),
          );
          const seen = new Set();
          for (const link of visible) {
            const item = entry(link);
            if (!item || seen.has(item.url)) continue;
            seen.add(item.url);
            items.push(item);
            const iconColumn =
              link.closest(".react-directory-filename-column") ??
              row.querySelector(":scope > .icon");
            const existing = iconColumn
              ? iconColumn.firstElementChild
              : link.previousElementSibling;
            if (existing?.classList.contains("xxtools-github-check")) {
              if (existing.dataset.url === item.url) continue;
              existing.remove();
            }
            const box = createCheckbox(item, link.textContent.trim());
            if (iconColumn) iconColumn.prepend(box);
            else link.before(box);
          }
        });
      if (parts[2] === "blob") {
        const item = { url: location.origin + location.pathname, type: "blob" };
        items = [item];
        const actions =
          document.querySelector(".react-blob-header-edit-and-raw-actions") ??
          document.querySelector("main");
        if (actions) {
          let box = document.getElementById("xxtools-github-current-file");
          if (!box) {
            box = createCheckbox(item, "当前文件");
            box.id = "xxtools-github-current-file";
          }
          if (box.parentElement !== actions) actions.prepend(box);
        }
        const allButton = bar.querySelector('[data-action="all"]');
        allButton.textContent = "选择当前文件";
      } else
        bar.querySelector('[data-action="all"]').textContent = "全选当前页";
    }
    update();
  }
  bar.addEventListener("click", async (event) => {
    if (current !== location.pathname) {
      scan();
      return;
    }
    const action = event.target.closest("button")?.dataset.action;
    if (action === "all") {
      for (const item of items) selected.set(item.url, item);
      update();
    }
    if (action === "clear") {
      selected.clear();
      status.textContent = "";
      update();
    }
    if (action === "download" && !busy && selected.size) {
      busy = true;
      status.textContent = "正在打开下载任务…";
      update();
      try {
        const response = await bridge.sendMessage({
          type: "toolbox.github.create-job",
          pageUrl: location.origin + location.pathname,
          items: [...selected.values()],
        });
        if (!response?.ok)
          throw new Error(
            response?.error || "扩展未响应，请重新加载扩展并刷新网页。",
          );
        status.textContent = "已打开下载页，可在那里查看进度。";
      } catch (error) {
        status.textContent = error.message || "请刷新页面后重试。";
      } finally {
        busy = false;
        update();
      }
    }
  });
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(scan, 180);
  };
  const observer = new MutationObserver((mutations) => {
    if (mutations.some((change) => !bar.contains(change.target))) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("turbo:render", schedule);
  document.addEventListener("turbo:load", schedule);
  window.addEventListener("popstate", schedule);
  scan();
  return {
    setOnlyWhenSelected(value) {
      onlyWhenSelected = value;
      update();
    },
    dispose() {
      observer.disconnect();
      clearTimeout(timer);
      document.removeEventListener("turbo:render", schedule);
      document.removeEventListener("turbo:load", schedule);
      window.removeEventListener("popstate", schedule);
      style.remove();
      bar.remove();
      document
        .querySelectorAll(".xxtools-github-check")
        .forEach((box) => box.remove());
    },
  };
}
