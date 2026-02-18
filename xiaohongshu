// ==UserScript==
// @name         小红书图片直接粘贴（新建+编辑增强版）
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  在小红书创作者平台新建/编辑笔记时直接粘贴图片上传
// @author       AI Assistant
// @match        https://creator.xiaohongshu.com/publish/publish*
// @match        https://creator.xiaohongshu.com/publish/update*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[XHS-PasteImage]', ...args);

  function isXhsPublishPage() {
    return /creator\.xiaohongshu\.com\/publish\/(publish|update)/.test(location.href);
  }

  function extractImageFilesFromClipboard(clipboardData) {
    if (!clipboardData?.items) return [];
    const files = [];

    for (const item of clipboardData.items) {
      if (item.type && item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    return files;
  }

  function isVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function findBestFileInput() {
    const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
    if (!inputs.length) return null;

    // 优先找 accept 包含 image 的
    const imageInputs = inputs.filter(i => (i.accept || '').toLowerCase().includes('image'));
    const candidates = imageInputs.length ? imageInputs : inputs;

    // 优先可用且在页面中的
    const enabled = candidates.filter(i => !i.disabled);
    if (!enabled.length) return null;

    // 先选可见的，否则返回第一个可用
    return enabled.find(isVisible) || enabled[0];
  }

  function clickUploadTrigger() {
    const textMatchers = ['上传图文', '上传图片', '添加图片', '继续添加', '重新上传', '添加', '上传'];
    const all = Array.from(document.querySelectorAll('button, div, span'));

    const trigger = all.find(el => {
      const t = (el.textContent || '').trim();
      return t && textMatchers.some(k => t.includes(k));
    });

    if (trigger) {
      trigger.click();
      log('点击上传触发器:', trigger.textContent?.trim());
      return true;
    }
    return false;
  }

  function waitForFileInput(timeout = 2500, interval = 120) {
    return new Promise(resolve => {
      const start = Date.now();
      const timer = setInterval(() => {
        const input = findBestFileInput();
        if (input) {
          clearInterval(timer);
          resolve(input);
          return;
        }
        if (Date.now() - start > timeout) {
          clearInterval(timer);
          resolve(null);
        }
      }, interval);
    });
  }

  function setFilesToInput(input, files) {
    try {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      input.files = dt.files;

      // 兼容框架监听
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } catch (err) {
      log('设置 input.files 失败:', err);
      return false;
    }
  }

  function findDropZone() {
    const selectors = [
      '.upload-area',
      '.drop-zone',
      '[data-role="upload"]',
      '[class*="upload"]',
      '[class*="Upload"]',
      '[class*="drop"]',
      '[class*="Drop"]'
    ];

    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  function simulateDrop(element, files) {
    try {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));

      ['dragenter', 'dragover', 'drop'].forEach(type => {
        const ev = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt
        });
        element.dispatchEvent(ev);
      });
      return true;
    } catch (err) {
      log('模拟拖拽失败:', err);
      return false;
    }
  }

  async function uploadImages(files) {
    // 先直接找 input
    let input = findBestFileInput();

    // 找不到就尝试点“上传/添加”按钮再等
    if (!input) {
      clickUploadTrigger();
      input = await waitForFileInput();
    }

    if (input && setFilesToInput(input, files)) {
      log('图片已通过 input 上传:', files.map(f => f.name || f.type));
      return true;
    }

    // input 失败时 fallback 到拖放
    const dropZone = findDropZone();
    if (dropZone && simulateDrop(dropZone, files)) {
      log('图片已通过拖放模拟上传');
      return true;
    }

    return false;
  }

  async function handlePaste(e) {
    if (!isXhsPublishPage()) return;

    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const imageFiles = extractImageFilesFromClipboard(clipboardData);
    if (!imageFiles.length) return; // 非图片不处理

    const ok = await uploadImages(imageFiles);
    if (ok) {
      e.preventDefault();
      e.stopPropagation();
    } else {
      log('未找到可用上传入口，保留默认粘贴行为');
    }
  }

  function init() {
    if (!isXhsPublishPage()) return;
    log('脚本已加载:', location.href);

    // capture=true，减少被页面框架拦截的概率
    document.addEventListener('paste', handlePaste, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
