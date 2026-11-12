// ==UserScript==
// @name              GitHub Notification Repo Info
// @name:zh-CN        GitHub 通知仓库信息显示
// @description       Display notification repository info and Star controls on repository subpages
// @description:zh-CN 在通知页面显示仓库信息，在仓库子页面显示 Star 状态并支持直接操作
// @namespace         https://github.com/ChinaGodMan/UserScripts
// @version           1.0.8
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
            moreInfo: 'More information',
            retry: 'Retry',
            starred: 'Starred',
            notStarred: 'Not starred',
            detailsError: 'Additional information unavailable. Try again.',
            starLoading: 'Loading Star…',
            starRetry: 'Retry Star',
            starLogin: 'Sign in to Star',
            starError: 'Unable to update Star. Click to retry.',
            starConfirm: 'Unstar this repository? It will also be removed from your lists.',
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
            moreInfo: '更多信息',
            retry: '重试',
            starred: '已 Star',
            notStarred: '未 Star',
            detailsError: '补充信息暂不可用，请重试。',
            starLoading: '加载 Star…',
            starRetry: '重试加载 Star',
            starLogin: '登录后 Star',
            starError: 'Star 操作失败，请点击重试。',
            starConfirm: '确定取消 Star？该仓库也会从你的星标列表中移除。',
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

        .github-repository-star {
            display: flex;
            align-items: center;
            flex-shrink: 0;
            margin-right: 8px;
        }

        .github-repository-star button { cursor: pointer; height: 32px; margin-left: 0; }
        .github-repository-star button:disabled { cursor: wait; opacity: 0.65; }
        .github-repository-star [aria-pressed="true"] { color: var(--fgColor-attention, #9a6700); }

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

    GM_addStyle(`
        #github-project-info {
            padding: 20px 24px;
            margin: 0 0 16px;
            background: var(--bgColor-muted, #f6f8fa);
            border-color: var(--borderColor-default, #d1d9e0);
            color: var(--fgColor-default, #1f2328);
        }
        #github-project-info .repo-heading {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
        }
        #github-project-info h3 { margin: 0; font-size: 18px; line-height: 1.5; }
        #github-project-info .repo-columns {
            display: grid;
            grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
            gap: 24px;
        }
        #github-project-info .repo-description {
            margin: 0 0 16px;
            font-size: 15px;
            line-height: 1.75;
            overflow-wrap: anywhere;
        }
        #github-project-info .repo-stats {
            display: grid;
            gap: 8px;
            font-size: 15px;
            line-height: 1.6;
        }
        #github-project-info .repo-details {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding-left: 24px;
            border-left: 1px solid var(--borderColor-default, #d1d9e0);
            font-size: 14px;
            line-height: 1.7;
            overflow-wrap: anywhere;
            min-width: 0;
        }
        #github-project-info .repo-status {
            color: var(--fgColor-muted, #59636e);
            font-size: 14px;
        }
        #github-project-info .loading, #github-project-info .error { padding: 4px; margin: 0; font-size: 15px; }
        #github-project-info a { color: var(--fgColor-accent, #0969da); }
        #github-project-info button { cursor: pointer; margin-left: 0; height: 32px; font-size: 14px; }
        @media (max-width: 768px) {
            #github-project-info { padding: 16px; }
            #github-project-info .repo-columns { grid-template-columns: minmax(0, 1fr); gap: 16px; }
            #github-project-info .repo-details {
                border-left: 0;
                border-top: 1px solid var(--borderColor-default, #d1d9e0);
                padding: 16px 0 0;
            }
        }
    `);

    // ==================== 工具函数 ====================

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
            const existing = document.querySelector('[data-fork-list-button]');

            // 离开仓库主页时清理按钮，避免 Turbo 导航后残留到通知等页面。
            if (pathParts.length !== 2) {
                if (existing) existing.remove();
                return false;
            }

            const repoKey = pathParts.join('/');
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

    // ==================== 仓库子页面 Star ====================
    let repositoryStarObserver = null;

    // 使用仓库元数据确认身份，避免把 settings/profile 等二级路径当成仓库。
    function getSubpageRepository() {
        const parts = location.pathname.split('/').filter(Boolean);
        const name = document.querySelector('meta[name="octolytics-dimension-repository_nwo"]')?.content;
        if (parts.length < 3 || !name || name.toLowerCase() !== parts.slice(0, 2).join('/').toLowerCase()) return null;
        return parts.slice(0, 2).join('/');
    }

    function parseRepositoryStar(doc, repoKey) {
        const loggedIn = Boolean(doc.querySelector('meta[name="user-login"]')?.content);
        const tokens = {};
        let starData = null;
        let count;
        // GitHub 存在 React 首页、旧版首页、react-partial 等多种布局；
        // 数据不一定直接位于 payload.sidebarAbout 下。
        const visit = (value) => {
            if (!value || typeof value !== 'object') return;
            if (value.csrf_tokens) Object.assign(tokens, value.csrf_tokens);
            if (typeof value.viewerHasStarred === 'boolean') starData = value;
            if (Number.isFinite(value.stargazerCount)) count = value.stargazerCount;
            for (const child of Object.values(value)) {
                if (child && typeof child === 'object') visit(child);
            }
        };
        for (const script of doc.querySelectorAll('script[type="application/json"]')) {
            try { visit(JSON.parse(script.textContent)); } catch { /* 非仓库数据 */ }
        }

        // action 可能是绝对 URL、含查询参数或大小写与当前 URL 不同。
        const forms = [...doc.querySelectorAll('form[action]')];
        const findForm = (action) => forms.find(form => {
            try {
                const url = new URL(form.getAttribute('action'), location.origin);
                return url.origin === location.origin &&
                    url.pathname.replace(/\/$/, '').toLowerCase() === `/${repoKey}/${action}`.toLowerCase();
            } catch { return false; }
        });
        const starForm = findForm('star');
        const unstarForm = findForm('unstar');
        if (starData) {
            return {
                loggedIn, starred: starData.viewerHasStarred,
                canStar: starData.canStar !== false, count, tokens, starForm, unstarForm
            };
        }
        if (!loggedIn) return { loggedIn: false };
        if (starForm || unstarForm) {
            // 旧版控件会同时包含两个表单，用共同容器上的 on 类切换状态。
            // 不依赖某个固定外层类名：GitHub 曾调整 js-toggler-container。
            let container = unstarForm || starForm;
            while (container && starForm && unstarForm &&
                !(container.contains(starForm) && container.contains(unstarForm))) {
                container = container.parentElement;
            }
            const toggler = unstarForm?.closest('.js-toggler-container, starring-container') || container;
            const starred = starForm && unstarForm
                ? Boolean(toggler?.classList.contains('on') || toggler?.getAttribute('data-starred') === 'true')
                : Boolean(unstarForm);
            return { loggedIn, canStar: true, starred, tokens, starForm, unstarForm };
        }
        throw new Error('Star state not found (no repository Star data or forms in response)');
    }

    async function loadRepositoryStar(repoKey) {
        // 登录后的新版 TanStack 页面不再输出 application/json 仓库数据，
        // 直接读取 GitHub 自己使用的 sidebar 接口，避免解析或执行流式脚本。
        const sidebarResponse = await fetch(`/${repoKey}/_sidebar/about`, {
            credentials: 'same-origin', cache: 'no-store',
            headers: { Accept: 'application/json', 'GitHub-Verified-Fetch': 'true' },
            signal: AbortSignal.timeout(15000)
        });
        if (sidebarResponse.ok && sidebarResponse.headers.get('content-type')?.includes('application/json')) {
            const about = await sidebarResponse.json();
            if (typeof about?.star?.viewerHasStarred === 'boolean') {
                return {
                    loggedIn: Boolean(about.viewer?.isLoggedIn),
                    starred: about.star.viewerHasStarred, canStar: about.star.canStar,
                    count: about.stargazerCount, verifiedFetch: true
                };
            }
        }
        // 兼容尚未使用新版接口的仓库布局。
        const response = await fetch(`/${repoKey}`, {
            credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000)
        });
        if (!response.ok || new URL(response.url).pathname.replace(/\/$/, '').toLowerCase() !== `/${repoKey}`.toLowerCase()) {
            throw new Error('Unable to load repository');
        }
        const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
        return parseRepositoryStar(doc, repoKey);
    }

    async function toggleRepositoryStar(repoKey, state, confirm = false) {
        const action = `/${repoKey}/${state.starred ? 'unstar' : 'star'}`;
        const form = state.starred ? state.unstarForm : state.starForm;
        const token = state.tokens?.[action]?.post;
        if (!form && !token && !state.verifiedFetch) throw new Error('Star CSRF token not found');
        const body = form ? new URLSearchParams(new FormData(form)) : new URLSearchParams();
        if (confirm) body.set('confirm', 'true');
        const headers = { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        if (token || state.verifiedFetch) headers['GitHub-Verified-Fetch'] = 'true';
        if (token) headers['X-CSRF-Token'] = token;
        const response = await fetch(action, {
            method: 'POST', credentials: 'same-origin', headers, body,
            signal: AbortSignal.timeout(15000)
        });
        if (response.status === 409 && state.starred && !confirm) {
            if (window.confirm(t.starConfirm)) return toggleRepositoryStar(repoKey, state, true);
            return;
        }
        if (!response.ok || response.redirected) throw new Error(`Star request failed (${response.status})`);
    }

    function setupRepositoryStarButton() {
        const update = () => {
            const repoKey = getSubpageRepository();
            let wrapper = document.querySelector('[data-repository-star]');
            // 已有原生控件的页面保持原样，防止出现两套按钮。
            const nativeControl = document.querySelector('[data-testid="star-button"], .js-toggler-container.starring-container, form[action$="/unstar"]');
            if (!repoKey || nativeControl) {
                wrapper?.remove();
                return;
            }
            if (wrapper?.dataset.repositoryStar === repoKey) return;
            wrapper?.remove();
            const searchButton = document.querySelector('header button[aria-label*="search" i], .AppHeader-search, [data-target="qbsearch-input.inputButton"]');
            const searchGroup = searchButton?.closest('[class*="searchButtonGroup"], .AppHeader-search, .search-input-container') || searchButton;
            if (!searchGroup) return;
            wrapper = document.createElement('div');
            wrapper.className = 'github-repository-star';
            wrapper.dataset.repositoryStar = repoKey;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'github-forklist-btn';
            wrapper.appendChild(button);
            searchGroup.insertAdjacentElement('beforebegin', wrapper);
            let state = null;
            let busy = false;
            const current = () => wrapper.isConnected && getSubpageRepository() === repoKey;
            const refresh = async () => {
                busy = true;
                button.disabled = true;
                button.textContent = t.starLoading;
                try {
                    const next = await loadRepositoryStar(repoKey);
                    if (!current()) return;
                    state = next;
                    button.textContent = state.loggedIn
                        ? `${state.starred ? '★ Starred' : '☆ Star'}${Number.isFinite(state.count) ? ` ${state.count.toLocaleString()}` : ''}`
                        : `☆ ${t.starLogin}`;
                    if (state.loggedIn) button.setAttribute('aria-pressed', String(state.starred));
                    button.title = state.loggedIn ? `${state.starred ? 'Unstar' : 'Star'} ${repoKey}` : t.starLogin;
                } catch (error) {
                    if (!current()) return;
                    state = null;
                    button.removeAttribute('aria-pressed');
                    button.textContent = t.starRetry;
                    button.title = t.starError;
                    console.warn('GitHub Star:', error);
                } finally {
                    busy = false;
                    button.disabled = Boolean(state?.loggedIn && !state.canStar);
                }
            };
            button.addEventListener('click', async () => {
                if (busy || !current()) return;
                if (!state) { await refresh(); return; }
                if (!state.loggedIn) {
                    location.href = `/login?return_to=${encodeURIComponent(location.pathname + location.search)}`;
                    return;
                }
                busy = true;
                button.disabled = true;
                try {
                    // 每次操作前重新读取状态，兼容在其他标签页修改 Star。
                    state = await loadRepositoryStar(repoKey);
                    if (current() && state.loggedIn && state.canStar) await toggleRepositoryStar(repoKey, state);
                    if (current()) await refresh();
                } catch (error) {
                    state = null;
                    button.removeAttribute('aria-pressed');
                    button.textContent = t.starRetry;
                    button.title = t.starError;
                    console.warn('GitHub Star:', error);
                } finally {
                    busy = false;
                    button.disabled = Boolean(state?.loggedIn && !state.canStar);
                }
            });
            refresh();
        };
        update();
        if (repositoryStarObserver) return;
        repositoryStarObserver = new MutationObserver(update);
        repositoryStarObserver.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('turbo:load', update);
        document.addEventListener('turbo:render', update);
        document.addEventListener('pjax:end', update);
    }

    // ==================== 通知页仓库信息 ====================
    const projectInfoCache = new Map();
    const projectInfoRequests = new Map();
    const CACHE_DURATION = 5 * 60 * 1000;
    let projectInfoVersion = 0;
    let selectedProject = null;
    let notificationListenersReady = false;

    const isNotificationsPage = () => /^\/notifications(?:\/|$)/.test(location.pathname);

    // 以搜索工具栏定位右侧内容区，空结果页同样存在，不依赖通知列表。
    function getProjectInfoElement() {
        const toolbar = document.querySelector('.notifications-query-builder-wrapper')?.parentElement;
        const list = document.querySelector('.notifications-list');
        const anchor = toolbar || list;
        if (!anchor) return null;
        let element = document.getElementById('github-project-info');
        if (!element) {
            element = document.createElement('section');
            element.id = 'github-project-info';
            element.setAttribute('aria-live', 'polite');
        }
        if (element.parentElement !== anchor.parentElement || element.nextElementSibling !== anchor) {
            anchor.before(element);
        }
        return element;
    }

    function updateProjectInfo(data, { loading = false, error = '', detailsError = '' } = {}) {
        if (!isNotificationsPage()) return;
        const card = getProjectInfoElement();
        if (!card) return;
        card.replaceChildren();
        const appendText = (parent, tag, text, className = '') => {
            const node = document.createElement(tag);
            node.className = className;
            node.textContent = text;
            parent.append(node);
            return node;
        };
        const appendLink = (parent, text, href) => {
            try {
                const url = new URL(href);
                if (!['http:', 'https:'].includes(url.protocol)) return;
                const link = appendText(parent, 'a', text);
                link.href = url.href;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            } catch { /* 无效的仓库官网不生成链接 */ }
        };
        const addButton = (label, details = false, parent = card) => {
            const button = appendText(parent, 'button', label, 'github-forklist-btn');
            button.type = 'button';
            const project = selectedProject;
            button.addEventListener('click', () => {
                if (project) fetchProjectInfo(project.owner, project.repo, { details, force: true });
            });
            return button;
        };
        if (loading) {
            appendText(card, 'p', `⏳ ${t.loading}`, 'loading');
            return;
        }
        if (error) {
            appendText(card, 'p', error, 'error');
            addButton(t.retry);
            return;
        }
        const heading = appendText(card, 'div', '', 'repo-heading');
        appendLink(appendText(heading, 'h3', '📊 '), data.full_name, `https://github.com/${data.full_name}`);
        if (typeof data.viewerHasStarred === 'boolean') {
            appendText(heading, 'span', `${data.viewerHasStarred ? '★' : '☆'} ${data.viewerHasStarred ? t.starred : t.notStarred}`, 'repo-status');
        }
        const columns = appendText(card, 'div', '', 'repo-columns');
        const overview = appendText(columns, 'div', '', 'repo-overview');
        if (data.description) appendText(overview, 'p', data.description, 'repo-description');
        const stats = appendText(overview, 'div', '', 'repo-stats');
        for (const [icon, label, value] of [
            ['⭐', t.repoStars, data.stargazers_count],
            ['🍴', t.repoForks, data.forks_count],
            ['👀', t.repoWatcher, data.subscribers_count]
        ]) {
            if (Number.isFinite(value)) appendText(stats, 'span', `${icon} ${label}${value.toLocaleString()}`);
        }
        const info = appendText(columns, 'div', '', 'repo-details');
        if (data.license?.name) appendText(info, 'span', `${t.repoLicense}${data.license.name}`);
        if (data.homepage) appendLink(info, t.repoPage + data.homepage, data.homepage);
        if (data.language) appendText(info, 'span', `${t.repoLang}${data.language}`);
        if (data.updated_at && Number.isFinite(Date.parse(data.updated_at))) {
            appendText(info, 'span', `${t.repoUpdated}${new Date(data.updated_at).toLocaleString()}`);
        }
        if (detailsError) appendText(info, 'p', detailsError, 'error');
        if (!data.detailsLoaded) addButton(detailsError ? t.retry : t.moreInfo, true, info);
    }

    function sharedProjectRequest(key, load) {
        if (projectInfoRequests.has(key)) return projectInfoRequests.get(key);
        const promise = Promise.resolve().then(load).finally(() => projectInfoRequests.delete(key));
        projectInfoRequests.set(key, promise);
        return promise;
    }

    // REST 只用于按需补充语言、更新时间，或同源内部接口不可用时回退。
    function requestRestProject(repoKey) {
        return sharedProjectRequest(`rest:${repoKey}`, () => new Promise((resolve, reject) => {
            const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
            if (PAT_GITHUB_TOKEN) headers.Authorization = `Bearer ${PAT_GITHUB_TOKEN}`;
            GM_xmlhttpRequest({
                method: 'GET', url: `https://api.github.com/repos/${repoKey}`, headers,
                timeout: 10000,
                onload(response) {
                    if (response.status !== 200) { reject(new Error(`${t.error} (${response.status})`)); return; }
                    try { resolve({ ...JSON.parse(response.responseText), detailsLoaded: true }); }
                    catch { reject(new Error(t.error)); }
                },
                onerror: () => reject(new Error(t.networkError)),
                ontimeout: () => reject(new Error(t.networkError)),
                onabort: () => reject(new Error(t.networkError))
            });
        }));
    }

    function requestProject(repoKey) {
        const cached = projectInfoCache.get(repoKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) return Promise.resolve(cached.data);
        return sharedProjectRequest(`about:${repoKey}`, async () => {
            let data;
            try {
                const response = await fetch(`/${repoKey}/_sidebar/about`, {
                    credentials: 'same-origin', cache: 'no-store',
                    headers: { Accept: 'application/json', 'GitHub-Verified-Fetch': 'true' },
                    signal: AbortSignal.timeout(10000)
                });
                if (!response.ok) throw new Error(`Sidebar ${response.status}`);
                const about = await response.json();
                if (!Number.isFinite(about.stargazerCount)) throw new Error('Invalid sidebar response');
                data = {
                    full_name: repoKey, description: about.description, homepage: about.website,
                    stargazers_count: about.stargazerCount, forks_count: about.forksCount,
                    subscribers_count: about.watcherCount, license: about.repo?.license,
                    viewerHasStarred: about.viewer?.isLoggedIn ? about.star?.viewerHasStarred : undefined
                };
            } catch {
                data = await requestRestProject(repoKey);
            }
            projectInfoCache.set(repoKey, { data, timestamp: Date.now() });
            return data;
        });
    }

    async function fetchProjectInfo(owner, repo, { details = false, force = false } = {}) {
        const repoKey = `${owner}/${repo}`;
        const route = location.href;
        if (!isNotificationsPage()) return;
        if (!force && selectedProject?.key === repoKey && selectedProject.route === route &&
            document.getElementById('github-project-info')) return;
        selectedProject = { owner, repo, key: repoKey, route };
        const version = ++projectInfoVersion;
        const current = () => version === projectInfoVersion && location.href === route && isNotificationsPage();
        if (force && !details) projectInfoCache.delete(repoKey);
        if (!details) updateProjectInfo(null, { loading: true });
        let data;
        try {
            data = await requestProject(repoKey);
            if (!current()) return;
            updateProjectInfo(data);
            if (details && !data.detailsLoaded) {
                const button = document.querySelector('#github-project-info button');
                if (button) { button.disabled = true; button.textContent = t.loading; }
                const extra = await requestRestProject(repoKey);
                // 主接口中的统计和当前用户状态优先，REST 只补充缺失字段。
                data = { ...extra, ...data, language: extra.language, updated_at: extra.updated_at, detailsLoaded: true };
                projectInfoCache.set(repoKey, { data, timestamp: Date.now() });
                if (current()) updateProjectInfo(data);
            }
        } catch (error) {
            if (!current()) return;
            if (data) updateProjectInfo(data, { detailsError: t.detailsError });
            else updateProjectInfo(null, { error: error.message || t.error });
        }
    }

    // 委托给 document：列表被 Turbo 替换后依然有效，空结果页无需等待列表。
    function setupNotificationHoverListener() {
        if (notificationListenersReady) return;
        notificationListenersReady = true;
        let debounceTimer;
        const handle = event => {
            const item = event.target.closest?.('li.notifications-list-item');
            if (event.type === 'mouseover' && item && event.relatedTarget instanceof Node && item.contains(event.relatedTarget)) return;
            clearTimeout(debounceTimer);
            if (!isNotificationsPage() || !item) return;
            const link = item.querySelector('.js-navigation-open');
            const result = link && extractRepoInfo(link.href);
            if (result) debounceTimer = setTimeout(() => fetchProjectInfo(result.owner, result.name), 200);
        };
        document.addEventListener('mouseover', handle);
        document.addEventListener('focusin', handle);
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
        setupRepositoryStarButton();

        if (!isNotificationsPage()) {
            ++projectInfoVersion;
            selectedProject = null;
            document.getElementById('github-project-info')?.remove();
            return;
        }
        setupNotificationHoverListener();
        const urlRepo = getRepoFromUrl();
        if (urlRepo) fetchProjectInfo(urlRepo.owner, urlRepo.repo);
        else if (selectedProject?.route !== location.href) {
            ++projectInfoVersion;
            selectedProject = null;
            document.getElementById('github-project-info')?.remove();
        }
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

    document.addEventListener('turbo:load', init);
    document.addEventListener('turbo:render', init);
    document.addEventListener('pjax:end', init);

    // 注册菜单命令
    GM_registerMenuCommand(t.setToken, createTokenModal);

    // 页面加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
