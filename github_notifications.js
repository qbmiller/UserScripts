// ==UserScript==
// @name              GitHub Notification Repo Info
// @name:zh-CN        GitHub 通知仓库信息显示
// @description       Display repository information on GitHub notification pages
// @description:zh-CN 在 GitHub 通知页面显示仓库详细信息
// @namespace         https://github.com/ChinaGodMan/UserScripts
// @version           1.0.3
// @author            人民的勤务员 <china.qinwuyuan@gmail.com>
// @match             https://github.com/notifications*
// @match             https://github.com/*/*
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_addStyle
// @grant             GM_xmlhttpRequest
// @grant             GM_registerMenuCommand
// @icon              data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PHBhdGggZD0iTTggMGE4IDggMCAxIDEgMCAxNkE4IDggMCAwIDEgOCAwem0zLjUgNy41TDggMTFsLTMuNS0zLjUgMS0xTDggOWwyLjUtMi41IDEgMXoiLz48L3N2Zz4=
// @license           MIT
// @run-at            document-idle
// @connect           api.github.com
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置管理 ====================
    let PAT_GITHUB_TOKEN = GM_getValue('githubToken', '');

    // 翻译字典
    const translations = {
        en: {
            repoSize: 'Repository size:',
            repoDes: 'Description:',
            repoLang: 'Primary language:',
            repoCreated: 'Created:',
            repoUpdated: 'Updated:',
            repoPushed: 'Pushed:',
            repoForks: 'Forks:',
            repoStars: 'Stars:',
            repoWatcher: 'Watchers:',
            repoLicense: 'License:',
            repoPage: 'HomePage:',
            forkList: 'forkList',
            repoTotal: 'Statistics:',
            setToken: 'Set GitHub Token',
            tokenDesc: 'Enter your GitHub personal access token to increase API rate limit.',
            createToken: 'Create new token',
            save: 'Save',
            cancel: 'Cancel',
            loading: 'Loading project information...',
            error: 'Failed to load project information',
            networkError: 'Network error, please check your connection'
        },
        'zh-CN': {
            repoSize: '仓库大小：',
            repoDes: '仓库简介：',
            repoLang: '主要语言：',
            repoPage: '主页：',
            forkList: 'forkList',
            repoTotal: '统计：',
            repoLicense: '开源协议：',
            repoCreated: '创建时间：',
            repoUpdated: '最后更新：',
            repoPushed: '最后推送：',
            repoForks: '复刻：',
            repoStars: '星标：',
            repoWatcher: '关注者：',
            setToken: '设置 GitHub Token',
            tokenDesc: '输入您的 GitHub 个人访问令牌以提高 API 速率限制。',
            createToken: '创建新令牌',
            save: '保存',
            cancel: '取消',
            loading: '加载项目信息中...',
            error: '加载项目信息失败',
            networkError: '网络错误，请检查网络连接'
        }
    };

    const userLang = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const t = translations[userLang.startsWith('zh') ? 'zh-CN' : 'en'];

    // ==================== 样式注入 ====================
    GM_addStyle(`
        #github-project-info {
            padding: 15px;
            margin: 10px 0;
            background-color: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        #github-project-info h3 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 16px;
        }

        #github-project-info h3 a {
            text-decoration: none;
            color: #0969da;
        }

        #github-project-info h3 a:hover {
            text-decoration: underline;
        }

        #github-project-info .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }

        #github-project-info .info-column {
            padding: 0 8px;
        }

        #github-project-info .info-column:first-child {
            border-right: 1px solid #e1e4e8;
        }

        #github-project-info p {
            margin: 8px 0;
            font-size: 13px;
            line-height: 1.5;
        }

        #github-project-info strong {
            color: #24292f;
            font-weight: 600;
        }

        #github-project-info .stats {
            margin-left: 20px;
            line-height: 1.8;
        }

        #github-project-info .loading,
        #github-project-info .error {
            text-align: center;
            padding: 20px;
            font-size: 14px;
        }

        #github-project-info .error {
            color: #d73a49;
        }

        .github-repo-link {
            margin-left: 6px;
            white-space: nowrap;
        }

        .github-repo-links-fallback {
            display: block;
            margin-top: 8px;
        }

        /* 仿 GitHub 原生按钮外观，避免直接复用官方元素的 hash class
           （随部署变化、且脱离原有 DOM 结构后经常错位）导致样式错乱 */
        .github-forklist-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            height: 28px;
            padding: 0 12px;
            margin-left: 8px;
            vertical-align: middle;
            box-sizing: border-box;
            font-size: 12px;
            font-weight: 500;
            line-height: 20px;
            color: #24292f;
            background-color: #f6f8fa;
            border: 1px solid rgba(31, 35, 40, 0.15);
            border-radius: 6px;
            text-decoration: none;
            white-space: nowrap;
        }

        .github-forklist-btn svg {
            fill: currentColor;
        }

        .github-forklist-btn:hover {
            background-color: #f3f4f6;
            border-color: rgba(31, 35, 40, 0.15);
            color: #24292f;
        }

        @media (prefers-color-scheme: dark) {
            .github-forklist-btn {
                color: #c9d1d9;
                background-color: #21262d;
                border-color: rgba(240, 246, 252, 0.1);
            }

            .github-forklist-btn:hover {
                background-color: #30363d;
                color: #c9d1d9;
            }
        }

        /* 暗黑模式支持 */
        @media (prefers-color-scheme: dark) {
            #github-project-info {
                background-color: #0d1117;
                border-color: #30363d;
                color: #c9d1d9;
            }

            #github-project-info h3 a {
                color: #58a6ff;
            }

            #github-project-info .info-column:first-child {
                border-right-color: #30363d;
            }

            #github-project-info strong {
                color: #c9d1d9;
            }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            #github-project-info .info-grid {
                grid-template-columns: 1fr !important;
            }

            #github-project-info .info-column:first-child {
                border-right: none !important;
                border-bottom: 1px solid #e1e4e8;
                padding-bottom: 16px !important;
            }

            #github-project-info .info-column:last-child {
                padding-top: 16px !important;
            }
        }

        /* Token 设置模态框 */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        }

        .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }

        .modal-title {
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: 600;
        }

        .modal-description {
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
        }

        .modal-description a {
            color: #0969da;
            text-decoration: underline;
        }

        .github-token-input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 14px;
            box-sizing: border-box;
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }

        .modal-button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }

        .modal-button.primary {
            background-color: #2ea44f;
            color: white;
        }

        .modal-button.secondary {
            background-color: #6c757d;
            color: white;
        }
    `);

    // ==================== 工具函数 ====================

    // 等待元素出现
    function waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    clearTimeout(timeoutId);
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            const timeoutId = setTimeout(() => {
                observer.disconnect();
                reject(new Error(`元素 ${selector} 未找到`));
            }, timeout);
        });
    }

    // 从 URL 获取仓库信息
    function getRepoFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const repoQuery = urlParams.get('query');

        if (!repoQuery) return null;

        // 匹配 repo:owner/repo 格式
        const repoMatch = repoQuery.match(/repo:([^/\s]+)\/([^\s]+?)(?:\s|$)/);

        if (repoMatch) {
            return {
                owner: repoMatch[1],
                repo: repoMatch[2].trim()
            };
        }

        return null;
    }

    // 从链接提取仓库信息
    function extractRepoInfo(url) {
        try {
            const urlObj = new URL(url);
            const parts = urlObj.pathname.split('/').filter(p => p);

            if (parts.length >= 2) {
                return {
                    owner: parts[0],
                    name: parts[1]
                };
            }
        } catch (e) {
            console.error('URL 解析失败:', url, e);
        }

        return null;
    }

    // 在通知项的 Fork 操作旁添加 Fork 列表按钮。
    function addRepoLinksToNotification(li, repo) {
        if (!li || !repo || li.getAttribute('data-repo-links-added') === 'true') return;

        const repoUrl = `https://github.com/${repo.owner}/${repo.name}`;
        const forksLink = document.createElement('a');
        forksLink.href = `${repoUrl}/forks`;
        forksLink.target = '_blank';
        forksLink.rel = 'noopener noreferrer';
        forksLink.textContent = t.forkList;
        forksLink.className = 'btn btn-sm github-repo-link';

        const forkControl = Array.from(li.querySelectorAll('a, button')).find((element) => {
            return /\bfork\b/i.test(element.textContent || '');
        });

        if (forkControl) {
            forkControl.insertAdjacentElement('afterend', forksLink);
        } else {
            const fallback = document.createElement('span');
            fallback.className = 'github-repo-links-fallback';
            fallback.appendChild(forksLink);
            li.appendChild(fallback);
        }

        li.setAttribute('data-repo-links-added', 'true');
    }

    function enhanceNotificationItems(notificationsList) {
        notificationsList.querySelectorAll('li.notifications-list-item').forEach((li) => {
            const link = li.querySelector('.js-navigation-open');
            const repo = link && extractRepoInfo(link.href);
            if (repo) addRepoLinksToNotification(li, repo);
        });
    }

    let repositoryForkObserver = null;

    // 定位 GitHub 原生 Fork 按钮。
    // GitHub 会不定期调整仓库头部的 DOM 结构（例如 2025 年起给 Fork 按钮加上了
    // 下拉菜单），纯文本正则匹配容易失效，因此优先使用更稳定的属性/ID 选择器，
    // 文本正则仅作为兜底方案。
    function findForkControl() {
        return (
            document.querySelector('#fork-button') ||
            document.querySelector('a[icon="repo-forked"], button[icon="repo-forked"]') ||
            document.querySelector('a[href$="/fork"]') ||
            Array.from(document.querySelectorAll('a, button')).find((element) => {
                return /^\s*fork(?:s)?(?:\s+\d[\d,.k]*)?\s*$/i.test(element.textContent || '');
            })
        );
    }

    const FORK_ICON_SVG = '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>';

    // 找到 Fork 按钮所在的“整组”容器（按钮 + 下拉箭头），而不是组内的单个元素，
    // 这样插入的新按钮才会作为独立一个胶囊排在整组后面，不会卡进原生按钮组中间。
    function findForkGroupContainer(forkControl) {
        let node = forkControl;
        for (let i = 0; i < 4 && node && node.parentElement; i++) {
            const parent = node.parentElement;
            const cls = typeof parent.className === 'string' ? parent.className : '';
            if (parent.tagName === 'LI' || parent.getAttribute('role') === 'group' || /btn-?group|buttongroup/i.test(cls)) {
                return parent;
            }
            node = parent;
        }
        return forkControl;
    }

    // 在仓库主页的 Fork 按钮旁添加 Fork 列表按钮。
    function setupRepositoryForkButton() {
        const addButton = () => {
            const pathParts = window.location.pathname.split('/').filter(Boolean);
            if (pathParts.length !== 2) return false;

            const repoKey = pathParts.join('/');
            const existing = document.querySelector('[data-fork-list-button]');
            if (existing) {
                // 已经是当前仓库的按钮，无需重复插入。
                if (existing.getAttribute('data-fork-list-button') === repoKey) return true;
                // SPA(Turbo) 跳转后残留的旧仓库按钮，移除后重新插入。
                existing.remove();
            }

            const forkControl = findForkControl();
            if (!forkControl) return false;

            const anchor = findForkGroupContainer(forkControl);

            const button = document.createElement('a');
            button.href = `https://github.com/${pathParts[0]}/${pathParts[1]}/forks`;
            button.target = '_blank';
            button.rel = 'noopener noreferrer';
            button.className = 'github-forklist-btn';
            button.innerHTML = `${FORK_ICON_SVG}<span>${t.forkList}</span>`;
            button.setAttribute('data-fork-list-button', repoKey);
            anchor.insertAdjacentElement('afterend', button);
            return true;
        };

        addButton();

        // GitHub 会局部重绘仓库头部，因此观察器和事件监听只需注册一次，
        // 整个页面生命周期内保留即可。
        if (repositoryForkObserver) return;
        repositoryForkObserver = new MutationObserver(addButton);
        repositoryForkObserver.observe(document.body, { childList: true, subtree: true });

        // GitHub 现已使用 Turbo 做局部页面替换，额外监听其导航事件更可靠。
        document.addEventListener('turbo:load', addButton);
        document.addEventListener('turbo:render', addButton);
    }

    // ==================== 项目信息缓存 ====================
    const projectInfoCache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

    // ==================== UI 更新函数 ====================

    // 创建信息展示元素
    function createInfoElement() {
        const infoDiv = document.createElement('div');
        infoDiv.id = 'github-project-info';
        return infoDiv;
    }

    // 更新项目信息显示
    function updateProjectInfo(data) {
        let infoDiv = document.getElementById('github-project-info');

        if (!infoDiv) {
            infoDiv = createInfoElement();
            const notificationsList = document.querySelector('.notifications-list');
            if (notificationsList) {
                notificationsList.parentNode.insertBefore(infoDiv, notificationsList);
            } else {
                const mainContent = document.querySelector('main') || document.body;
                mainContent.insertBefore(infoDiv, mainContent.firstChild);
            }
        }

        // 加载状态
        if (!data) {
            infoDiv.innerHTML = `<p class="loading">⏳ ${t.loading}</p>`;
            return;
        }

        // 错误状态
        if (data.error) {
            infoDiv.innerHTML = `<p class="error">⚠️ ${data.message || t.error}</p>`;
            return;
        }

        // 正常显示
        const content = `
            <h3>📊 <a href="https://github.com/${data.full_name}" target="_blank">${data.full_name}</a></h3>
            <div class="info-grid">
                <div class="info-column">
                    <p><strong>${t.repoDes}</strong> ${data.description || 'None'}</p>
                    <p><strong>${t.repoTotal}</strong></p>
                    <div class="stats">
                        ⭐ ${t.repoStars} ${data.stargazers_count.toLocaleString()}<br>
                        🍴 ${t.repoForks} ${data.forks_count.toLocaleString()}<br>
                        👀 ${t.repoWatcher} ${data.watchers_count.toLocaleString()}
                    </div>
                </div>
                <div class="info-column">
                    <p><strong>${t.repoLang}</strong> ${data.language || 'None'}</p>
                    <p><strong>${t.repoUpdated}</strong> ${new Date(data.updated_at).toLocaleString()}</p>
                    <p><strong>${t.repoLicense}</strong> ${data.license ? data.license.name : 'None'}</p>
                    ${data.homepage ? `<p><strong>${t.repoPage}</strong> <a href="${data.homepage}" target="_blank">${data.homepage}</a></p>` : ''}
                </div>
            </div>
        `;

        infoDiv.innerHTML = content;
    }

    // ==================== API 请求函数 ====================

    // 获取项目信息
    function fetchProjectInfo(owner, repo) {
        const cacheKey = `${owner}/${repo}`;

        // 检查缓存
        const cached = projectInfoCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('📦 使用缓存数据:', cacheKey);
            updateProjectInfo(cached.data);
            return;
        }

        // 显示加载状态
        updateProjectInfo(null);

        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.github.com/repos/${owner}/${repo}`,
            headers: {
                'Authorization': PAT_GITHUB_TOKEN ? `token ${PAT_GITHUB_TOKEN}` : '',
                'Accept': 'application/vnd.github.v3+json'
            },
            onload: function(response) {
                try {
                    if (response.status === 200) {
                        const data = JSON.parse(response.responseText);

                        // 缓存数据
                        projectInfoCache.set(cacheKey, {
                            data: data,
                            timestamp: Date.now()
                        });

                        updateProjectInfo(data);
                        console.log('✅ 项目信息获取成功:', cacheKey);
                    } else {
                        console.error('❌ API 返回错误:', response.status);
                        updateProjectInfo({
                            error: true,
                            message: `${t.error} (${response.status})`
                        });
                    }
                } catch (e) {
                    console.error('❌ 解析失败:', e);
                    updateProjectInfo({
                        error: true,
                        message: t.error
                    });
                }
            },
            onerror: function() {
                console.error('❌ 网络请求失败');
                updateProjectInfo({
                    error: true,
                    message: t.networkError
                });
            },
            timeout: 10000
        });
    }

    // ==================== 通知页面监听 ====================

    // 设置悬停监听
    function setupNotificationHoverListener() {
        const notificationsList = document.querySelector('.notifications-list');
        if (!notificationsList || notificationsList.hasAttribute('data-hover-listener')) {
            return;
        }

        enhanceNotificationItems(notificationsList);
        const listObserver = new MutationObserver(() => enhanceNotificationItems(notificationsList));
        listObserver.observe(notificationsList, { childList: true, subtree: true });

        let lastRepoKey = null;
        let debounceTimer = null;

        notificationsList.addEventListener('mouseover', (event) => {
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
                const li = event.target.closest('li.notifications-list-item');
                if (!li) return;

                const link = li.querySelector('.js-navigation-open');
                if (!link) return;

                const result = extractRepoInfo(link.href);
                if (!result) return;

                addRepoLinksToNotification(li, result);

                const repoKey = `${result.owner}/${result.name}`;

                if (repoKey !== lastRepoKey) {
                    console.log('🔍 鼠标悬停获取:', result);
                    lastRepoKey = repoKey;
                    fetchProjectInfo(result.owner, result.name);
                }
            }, 200);
        });

        notificationsList.setAttribute('data-hover-listener', 'true');
        console.log('✅ 通知列表悬停监听已设置');
    }

    // ==================== Token 设置 ====================

    // 创建 Token 设置模态框
    function createTokenModal() {
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3 class="modal-title">${t.setToken}</h3>
                    <p class="modal-description">
                        ${t.tokenDesc}
                        <a href="https://github.com/settings/tokens/new?description=GitHub%20Notification%20Script&scopes=repo" target="_blank">
                            ${t.createToken}
                        </a>
                    </p>
                    <input type="text" id="github-token-input" class="github-token-input" placeholder="ghp_xxxxx..." value="${PAT_GITHUB_TOKEN}">
                    <div class="modal-buttons">
                        <button class="modal-button secondary" id="cancel-token">${t.cancel}</button>
                        <button class="modal-button primary" id="save-token">${t.save}</button>
                    </div>
                </div>
            </div>
        `;

        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = modalHTML;
        document.body.appendChild(modalContainer);

        modalContainer.querySelector('#save-token').addEventListener('click', () => {
            const token = modalContainer.querySelector('#github-token-input').value.trim();
            GM_setValue('githubToken', token);
            PAT_GITHUB_TOKEN = token;
            modalContainer.remove();
            console.log('✅ Token 已保存');
        });

        modalContainer.querySelector('#cancel-token').addEventListener('click', () => {
            modalContainer.remove();
        });
    }

    // ==================== 初始化 ====================

    // 主初始化函数
    function init() {
        console.log('🚀 GitHub 通知仓库信息脚本启动');
        setupRepositoryForkButton();

        // 从 URL 获取仓库信息
        const urlRepo = getRepoFromUrl();
        if (urlRepo) {
            console.log('📌 从 URL 获取仓库信息:', urlRepo);
            fetchProjectInfo(urlRepo.owner, urlRepo.repo);
        }

        // 等待通知列表加载后设置悬停监听
        waitForElement('.notifications-list')
            .then(() => {
                setupNotificationHoverListener();
            })
            .catch(err => {
                console.warn('⚠️ 未找到通知列表:', err.message);
            });
    }

    // 监听 URL 变化
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            setTimeout(init, 100);
        }
    }).observe(document, { subtree: true, childList: true });

    // 注册菜单命令
    GM_registerMenuCommand(t.setToken, createTokenModal);

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();