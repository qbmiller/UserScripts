// ==UserScript==
// @name         知乎专栏左侧目录
// @namespace    https://zhuanlan.zhihu.com/
// @version      1.1.0
// @description  自动提取知乎专栏文章标题，在页面左侧显示可跟随阅读的目录。
// @author       https://github.com/qbmiller/UserScripts
// @match        https://zhuanlan.zhihu.com/p/*
// @match        https://zhuanlan.zhihu.com/*/p/*
// @grant        none
// @run-at       document-idle
// @license MIT
// ==/UserScript==

(() => {
  'use strict';

  console.info('[知乎左侧目录 v1.1.0] 脚本已注入', location.href);

  const PANEL_ID = 'zhihu-left-toc-panel';
  const STYLE_ID = 'zhihu-left-toc-style';
  const HEADING_SELECTOR = 'h1, h2, h3, h4';
  const ARTICLE_SELECTORS = [
    '.Post-RichText',
    'article .RichText',
    'article',
    '[class*="Post-RichText"]',
  ];
  let observer;
  let rebuildTimer;
  let activeTimer;

  function getArticle() {
    return ARTICLE_SELECTORS
      .map((selector) => document.querySelector(selector))
      .find((element) => element && element.querySelector(HEADING_SELECTOR));
  }

  function isVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  function getHeadings(article) {
    return [...article.querySelectorAll(HEADING_SELECTOR)]
      .filter((heading) => isVisible(heading) && heading.textContent.trim())
      .map((heading, index) => {
        if (!heading.id) heading.id = `zhihu-toc-heading-${index}-${Date.now()}`;

        return {
          element: heading,
          id: heading.id,
          level: Number(heading.tagName.slice(1)),
          text: heading.textContent.replace(/\s+/g, ' ').trim(),
        };
      });
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        z-index: 9999;
        top: 88px;
        left: max(16px, calc((100vw - 1440px) / 2 - 220px));
        width: 188px;
        max-height: calc(100vh - 112px);
        overflow: auto;
        box-sizing: border-box;
        padding: 12px 10px;
        border: 1px solid #ebebeb;
        border-radius: 6px;
        background: rgba(255, 255, 255, .96);
        box-shadow: 0 3px 12px rgba(0, 0, 0, .08);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      #${PANEL_ID} .zlt-title {
        margin: 0 0 7px;
        color: #1a1a1a;
        font-size: 14px;
        font-weight: 600;
      }
      #${PANEL_ID} .zlt-list {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      #${PANEL_ID} .zlt-link {
        display: block;
        overflow: hidden;
        box-sizing: border-box;
        padding: 6px 7px;
        border-left: 2px solid transparent;
        color: #646464;
        font-size: 13px;
        line-height: 1.35;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #${PANEL_ID} .zlt-link:hover {
        color: #056de8;
        background: #f5f8fc;
      }
      #${PANEL_ID} .zlt-link.is-active {
        border-left-color: #056de8;
        color: #056de8;
        background: #eef6ff;
        font-weight: 600;
      }
      #${PANEL_ID} .zlt-level-2 { padding-left: 18px; }
      #${PANEL_ID} .zlt-level-3 { padding-left: 29px; }
      #${PANEL_ID} .zlt-level-4 { padding-left: 40px; }
      #${PANEL_ID} .zlt-toggle {
        display: none;
        width: 100%;
        padding: 0;
        border: 0;
        background: transparent;
        color: #1a1a1a;
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      @media (max-width: 1180px) {
        #${PANEL_ID} {
          top: auto;
          bottom: 24px;
          left: 16px;
          width: auto;
          max-width: min(300px, calc(100vw - 32px));
          max-height: min(60vh, 440px);
          padding: 10px;
        }
        #${PANEL_ID} .zlt-toggle { display: block; }
        #${PANEL_ID} > .zlt-title { display: none; }
        #${PANEL_ID} .zlt-title { margin: 0; }
        #${PANEL_ID}:not(.is-open) .zlt-list { display: none; }
        #${PANEL_ID}.is-open .zlt-title { margin-bottom: 7px; }
      }
    `;
    document.head.append(style);
  }

  function setActive(panel, headingId) {
    panel.querySelectorAll('.zlt-link').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.target === headingId);
    });
  }

  function updateActive(panel, headings) {
    const viewportLine = window.scrollY + Math.min(window.innerHeight * 0.28, 180);
    let current = headings[0];

    for (const heading of headings) {
      if (heading.element.getBoundingClientRect().top + window.scrollY <= viewportLine) current = heading;
      else break;
    }

    if (current) setActive(panel, current.id);
  }

  function build() {
    const article = getArticle();
    const oldPanel = document.getElementById(PANEL_ID);
    if (!article) {
      oldPanel?.remove();
      return null;
    }

    const headings = getHeadings(article);
    if (headings.length < 2) {
      oldPanel?.remove();
      return article;
    }

    addStyle();
    const panel = oldPanel || document.createElement('nav');
    panel.id = PANEL_ID;
    panel.dataset.version = '1.1.0';
    panel.setAttribute('aria-label', '文章目录');
    panel.innerHTML = `
      <button class="zlt-toggle" type="button" aria-expanded="false">
        <span class="zlt-title">目录</span>
      </button>
      <p class="zlt-title">目录</p>
      <ol class="zlt-list"></ol>
    `;

    const list = panel.querySelector('.zlt-list');
    const baseLevel = Math.min(...headings.map((heading) => heading.level));
    headings.forEach((heading) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.className = `zlt-link zlt-level-${Math.min(4, heading.level - baseLevel + 1)}`;
      link.href = `#${heading.id}`;
      link.dataset.target = heading.id;
      link.textContent = heading.text;
      link.title = heading.text;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${heading.id}`);
        setActive(panel, heading.id);
      });
      item.append(link);
      list.append(item);
    });

    panel.querySelector('.zlt-toggle').addEventListener('click', () => {
      const open = panel.classList.toggle('is-open');
      panel.querySelector('.zlt-toggle').setAttribute('aria-expanded', String(open));
    });

    if (!oldPanel) document.body.append(panel);
    updateActive(panel, headings);

    window.removeEventListener('scroll', window.__zhihuTocScrollHandler);
    window.__zhihuTocScrollHandler = () => {
      clearTimeout(activeTimer);
      activeTimer = setTimeout(() => updateActive(panel, headings), 50);
    };
    window.addEventListener('scroll', window.__zhihuTocScrollHandler, { passive: true });
    return article;
  }

  function scheduleBuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(initialize, 300);
  }

  function initialize() {
    const article = build();
    observer?.disconnect();
    observer = new MutationObserver(scheduleBuild);
    observer.observe(article || document.documentElement, { childList: true, subtree: true });
  }

  initialize();
})();
