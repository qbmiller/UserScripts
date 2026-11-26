import {
  findTextLinks,
  imageSource,
  normalizeReaderSettings,
} from "./settings.mjs";
import { collectArticleHeadings } from "./headings.mjs";

export function installWeChatReader(value) {
  const settings = normalizeReaderSettings(value);
  if (!settings.enabled || document.getElementById("xxtools-wechat-reader"))
    return () => {};
  const host = document.createElement("div");
  host.id = "xxtools-wechat-reader";
  host.style.setProperty(
    "--xxtools-reader-font-size",
    `${settings.tocFontSize}px`,
  );
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `<style>
    :host{all:initial;font:var(--xxtools-reader-font-size,14px)/1.6 system-ui,sans-serif;color:#24382c;color-scheme:light}
    *{box-sizing:border-box}button{font:inherit;cursor:pointer;color:inherit}
    button:focus-visible,a:focus-visible{outline:2px solid #39815b;outline-offset:3px}
    .panel{position:fixed;left:16px;top:32px;width:300px;height:calc(100dvh - 64px);max-height:calc(100dvh - 64px);z-index:2147483000;background:#fffffff5;border:1px solid #dce5dd;border-radius:14px;box-shadow:0 8px 32px #102c181a;overflow:auto}
    header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid #e7ece8}header strong{font-size:inherit}header button,.toggle{border:0;background:#edf3ee;border-radius:6px;padding:4px 8px}
    nav{padding:8px}ol{list-style:none;margin:0;padding:0}li{margin:0;padding:0}.row{display:flex;align-items:start;padding-left:calc(var(--level)*12px)}
    .fold{flex:0 0 22px;border:0;background:transparent;padding:7px 0;font-size:11px}.heading{flex:1;min-width:0;border:0;background:transparent;text-align:left;padding:8px 10px;border-radius:6px;overflow-wrap:anywhere;font-size:inherit}.heading:hover{background:#f0f5f1}.heading[aria-current=true]{background:#e4f0e7;color:#24623e;font-weight:650}.empty{padding:8px;font-size:inherit;color:#6e7e72}
    .toggle{position:fixed;left:12px;top:100px;z-index:2147483000;writing-mode:vertical-rl;padding:12px 8px;border:1px solid #dce5dd;box-shadow:0 3px 16px #0001}
    [hidden]{display:none!important}dialog{max-width:96vw;max-height:96dvh;padding:44px 12px 12px;border:0;border-radius:12px;background:#142018;color:white}dialog::backdrop{background:#000c}dialog img{display:block;max-width:90vw;max-height:80dvh;object-fit:contain}dialog button{position:absolute;right:12px;top:8px;border:0;border-radius:6px;padding:5px 12px;background:#ffffff20;color:white}
    @media(max-width:1250px){.panel{left:12px;top:24px;width:min(320px,calc(100vw - 24px));height:calc(100dvh - 48px);max-height:calc(100dvh - 48px)}.toggle{top:65px}}
    @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
  </style><aside class="panel" aria-label="公众号文章目录"><header><strong>文章目录 · xxTools</strong><button type="button" aria-label="收起文章目录">收起</button></header><nav aria-label="文章章节"></nav></aside><button type="button" class="toggle" hidden aria-label="展开文章目录">文章目录</button><dialog aria-label="文章图片查看"><button type="button" aria-label="关闭图片查看">关闭 · Esc</button><img alt=""></dialog>`;
  const panel = shadow.querySelector(".panel");
  const nav = shadow.querySelector("nav");
  const toggle = shadow.querySelector(".toggle");
  const dialog = shadow.querySelector("dialog");
  const preview = dialog.querySelector("img");
  let article = null,
    headings = [],
    active = -1,
    timer,
    frame,
    stopped = false;
  const generatedLinks = new Set();
  const collapsed = new WeakSet();
  let previousFocus;
  const compact = window.innerWidth < 1250;
  function setExpanded(expanded) {
    panel.hidden = !expanded;
    toggle.hidden = expanded;
    toggle.setAttribute("aria-expanded", String(expanded));
  }
  setExpanded(!compact);
  shadow.querySelector("header button").onclick = () => {
    setExpanded(false);
    toggle.focus();
  };
  toggle.onclick = () => {
    setExpanded(true);
    shadow.querySelector("header button").focus();
  };
  function closeImage() {
    dialog.close();
  }
  dialog.querySelector("button").onclick = closeImage;
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeImage();
  });
  dialog.addEventListener("close", () => {
    preview.removeAttribute("src");
    previousFocus?.focus?.({ preventScroll: true });
  });

  function updateActive() {
    frame = undefined;
    if (!headings.length || !settings.toc) return;
    let next = 0;
    headings.forEach((item, index) => {
      if (item.node.getBoundingClientRect().top <= 140) next = index;
    });
    const scrollHeight = document.documentElement.scrollHeight;
    if (
      scrollHeight > window.innerHeight &&
      window.scrollY + window.innerHeight >= scrollHeight - 2
    )
      next = headings.length - 1;
    if (next === active) return;
    active = next;
    headings.forEach((item, index) =>
      item.button.setAttribute("aria-current", String(index === active)),
    );
  }
  function onScroll() {
    if (!frame) frame = requestAnimationFrame(updateActive);
  }
  function renderToc() {
    nav.replaceChildren();
    headings = [];
    active = -1;
    if (!settings.toc) return;
    const nodes = collectArticleHeadings(article);
    const root = document.createElement("ol");
    const stack = [];
    for (const { node, level } of nodes) {
      while (stack.length && stack.at(-1).level >= level) stack.pop();
      const parent = stack.at(-1);
      const list = parent?.children || root;
      const li = document.createElement("li");
      const row = document.createElement("div");
      row.className = "row";
      row.style.setProperty("--level", Math.min(stack.length, 5));
      const fold = document.createElement("button");
      fold.className = "fold";
      fold.type = "button";
      fold.textContent = "▾";
      fold.style.visibility = "hidden";
      fold.setAttribute("aria-label", "折叠子章节");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "heading";
      button.textContent = node.textContent.trim();
      button.onclick = () => {
        const top = window.scrollY + node.getBoundingClientRect().top - 28;
        window.scrollTo({
          top,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      };
      const children = document.createElement("ol");
      const setFold = () => {
        children.hidden = collapsed.has(node);
        fold.textContent = children.hidden ? "▸" : "▾";
        fold.setAttribute("aria-expanded", String(!children.hidden));
        fold.setAttribute(
          "aria-label",
          children.hidden ? "展开子章节" : "折叠子章节",
        );
      };
      setFold();
      fold.onclick = () => {
        collapsed.has(node) ? collapsed.delete(node) : collapsed.add(node);
        setFold();
      };
      row.append(fold, button);
      li.append(row, children);
      list.append(li);
      if (parent) parent.fold.style.visibility = "visible";
      headings.push({ node, button });
      stack.push({ level, children, fold });
    }
    nav.append(root);
    if (!nodes.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent =
        "这篇文章没有可识别的标题，仍可使用图片放大与链接识别。";
      nav.append(empty);
    }
    updateActive();
  }

  function linkify() {
    if (!settings.links) return;
    const walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return node.parentElement?.closest(
          'a,script,style,pre,code,textarea,button,input,select,[contenteditable]:not([contenteditable="false"])',
        )
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      const matches = findTextLinks(node.data);
      if (!matches.length) continue;
      const fragment = document.createDocumentFragment();
      let start = 0;
      for (const match of matches) {
        fragment.append(
          document.createTextNode(node.data.slice(start, match.index)),
        );
        const link = document.createElement("a");
        link.href = match.href;
        link.textContent = match.text;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.style.color = "inherit";
        link.style.textDecoration = "underline";
        generatedLinks.add(link);
        fragment.append(link);
        start = match.index + match.text.length;
      }
      fragment.append(document.createTextNode(node.data.slice(start)));
      node.replaceWith(fragment);
    }
    for (const link of generatedLinks)
      if (!link.isConnected) generatedLinks.delete(link);
  }
  function onImageClick(event) {
    if (
      !settings.images ||
      event.button !== 0 ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const image = event.target.closest?.("img");
    if (!image || !article?.contains(image)) return;
    const source = imageSource(image);
    if (!source) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    preview.src = source;
    preview.alt = image.alt || "文章图片";
    previousFocus = document.activeElement;
    if (!dialog.open) dialog.showModal();
  }
  const pageStyle = document.createElement("style");
  pageStyle.textContent =
    (settings.hideBottomBar
      ? "#js_pc_bottom_bar,#js_article_bottom_bar,.wx_bottom_bar{display:none!important}"
      : "") +
    (settings.articleFontSize
      ? `#js_content,#js_content *{font-size:${settings.articleFontSize}px!important}`
      : "");
  function observe() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
  function scan() {
    if (stopped) return;
    observer.disconnect();
    article = document.querySelector("#js_content");
    if (article) {
      if (!host.isConnected) document.body.append(host);
      if (!pageStyle.isConnected) document.head.append(pageStyle);
      panel.hidden = !settings.toc || !toggle.hidden;
      toggle.hidden = !settings.toc || !panel.hidden;
      linkify();
      renderToc();
    } else {
      host.remove();
      pageStyle.remove();
    }
    observe();
  }
  const observer = new MutationObserver((records) => {
    // Shadow DOM 的目录与图片弹层不会触发文章观察；链接转换时暂停观察。
    const relevant =
      !article ||
      !article.isConnected ||
      records.some(
        (record) =>
          article.contains(record.target) ||
          [...record.addedNodes].some(
            (node) =>
              node.nodeType === 1 &&
              (node.id === "js_content" || node.querySelector?.("#js_content")),
          ),
      );
    if (relevant) {
      clearTimeout(timer);
      timer = setTimeout(scan, 150);
    }
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  document.addEventListener("click", onImageClick, true);
  scan();
  return () => {
    stopped = true;
    observer.disconnect();
    clearTimeout(timer);
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
    document.removeEventListener("click", onImageClick, true);
    if (dialog.open) closeImage();
    host.remove();
    pageStyle.remove();
    for (const link of generatedLinks)
      if (link.isConnected) link.replaceWith(...link.childNodes);
    generatedLinks.clear();
  };
}
