# 拾用 · 浏览器工具箱

WXT + Vue 3 + TypeScript 开发的 Chrome MV3 侧栏扩展，当前版本 2.2.0。

## 已有功能

- GitHub 勾选下载：在仓库文件列表勾选文件/文件夹，独立任务页下载并打包 ZIP，支持进度、取消和可选 Token。
- 收藏夹：展示浏览器原有书签目录，搜索标题/网址/来源文件夹，按网站域名分组；只读展示，不移动或修改书签。
- 原生侧边栏：工具搜索、分类、收藏、最近使用、设置。
- 挂起标签恢复：仅在用户打开、选中或刷新当前标签时恢复，不批量加载后台标签；可关闭自动恢复。
- 手工提取挂起链接中的原始网址，复制或在新标签打开。
- JSON 校验、美化、压缩，保留大整数、指数、负零、重复键及字符串原始转义。
- URL 组件编码、解码，支持中文及 Unicode。
- 切换工具保留当前侧栏会话中的输入；收藏、最近使用和偏好保存在本地。

仅在 github.com 注入文件行勾选框和下载操作条；不申请全站访问权限，不收集工具输入，不使用第三方中转或云端打包服务。GitHub 内容通过 api.github.com 读取。

## 安装与从旧版升级

### 从 Release ZIP 安装（推荐）

无需安装 Node.js，也不需要构建源码。

1. 在 [GitHub Releases](https://github.com/qbmiller/UserScripts/releases) 下载对应 xxTools 版本附件中的 `xxTools-<版本>-chrome.zip`，不要选择 GitHub 自动生成的 `Source code (zip)`。
2. **先解压 ZIP**，将解压后的文件夹放到固定位置。Chrome 会持续从这个目录读取扩展，安装后不要删除或移动它。
3. 在 Chrome 地址栏打开 `chrome://extensions/`，开启右上角的「开发者模式」。
4. 如果旧版 xxTools 或「Session Buddy 挂起链接恢复」仍启用，先停用旧版，避免重复运行。
5. 点击「加载已解压的扩展程序」，选择解压后**直接包含 `manifest.json` 的文件夹**，不要选择 ZIP 文件或多套一层的父目录。
6. 点击扩展图标打开工具箱；**刷新已有的 GitHub 页面**，即可看到文件名旁的下载勾选框。

更新时，关闭正在运行的下载任务，将新版 ZIP 解压并覆盖原安装目录的内容，再到 `chrome://extensions/` 点击 xxTools 卡片上的「重新加载」，最后刷新 GitHub 页面。继续使用相同安装目录可避免因路径变化重复安装扩展。

### 从源码构建安装

1. 在本目录执行 `npm ci`，然后 `npm run build`。
2. 打开 `chrome://extensions/`，**先停用旧的「Session Buddy 挂起链接恢复」扩展**，避免两个扩展同时监听。
3. 开启开发者模式，点击「加载已解压的扩展程序」，选择本目录下的 `.output/chrome-mv3`。
4. macOS 文件选择器若看不到隐藏目录，按 `⌘⇧G`，粘贴该目录的完整路径。
5. 点击新扩展图标打开侧边栏。以后修改源码后执行 `npm run build`，再在扩展卡片点击重新加载。

源码根目录已不再是可加载扩展，旧版根目录 manifest 和脚本已迁移到 WXT 入口。加载路径变化可能产生新的扩展 ID，原来旧扩展的存储不会自动迁移；旧版本没有偏好存储。

安装、更新、浏览器启动都不会扫描或恢复所有标签。当前有挂起标签时，可以选中它、刷新，或者在工具详情点击「恢复当前标签」。地址中的原始网址已经被错误页替换且丢失时无法恢复，需重新打开 Session Buddy 保存的完整链接。

## 浏览器收藏夹

重新加载扩展并允许新增的 `bookmarks` 权限，然后点击底部「收藏夹」。

- **原文件夹**：按浏览器现有目录逐级进入，点击上方路径返回任意上级；空文件夹也会显示。
- **按网站分组**：在本机按域名归类，点击网站查看其中的书签；合并 `www.example.com` 和 `example.com`，其他子域名分别展示。
- 搜索标题、完整网址或来源文件夹，保留重复书签和原始顺序；分组按书签数量排序。
- 点击书签在新标签页打开；不执行 `javascript:` 脚本书签。特殊或无效网址归入「其他地址」。
- 浏览器中新增、删除、编辑或移动书签后，界面自动刷新，也可手工刷新。长列表每次显示 100 项，可继续加载。

此功能仅用 `chrome.bookmarks.getTree` 和书签事件读取，不调用创建、编辑、移动或删除 API，不向网络发送书签。分类只影响展示，不会整理或改动你的真实书签目录。

## GitHub 勾选下载

1. 在 Chrome 扩展管理页重新加载 xxTools，允许 GitHub 与 GitHub API 访问，然后**刷新原有 GitHub 标签页**。
2. 在仓库根目录或子目录，勾选文件名旁的复选框；可混合选择文件和文件夹，也可点左下角「全选当前页」。
3. 点击「下载 ZIP」打开独立下载任务页。它先固定当前提交，再展开所选目录、下载文件、本机打包，由浏览器保存 ZIP。
4. 文件单页可点「选择当前文件」后下载。切换目录、仓库或分支时会清空选择，避免混入旧路径。
5. 私有仓库或 API 限流时，在侧栏「GitHub 勾选下载」或任务页设置可选 Token。私有仓库需要对应仓库 Contents 读取权限，登录网页不能代替 API Token。

Token 只保存在扩展 local 存储，local 存储限制为可信扩展上下文访问；Token 不回显、不进入同步存储、不发给网页或第三方，只作为 api.github.com 的 Authorization 请求头。可随时删除。任务在 session 存储中保留以便刷新重试，创建任务时清理超过 24 小时的旧记录。

ZIP 保留仓库相对路径，选择父目录和其中的文件会去重。递归目录树被截断时逐层读取，不静默导出缺文件的 ZIP。任一文件失败会取消该批下载，不导出不完整 ZIP。

范围：GitHub.com 仓库的根目录、tree 和 blob 页面，不支持 GitHub Enterprise、PR 或历史提交差异页面。单次最多 1,000 个勾选项，展开后最多 10,000 文件 / 200 MiB；GitHub API 对单文件还有自身限制。Git LFS 下载仓库中的指针，遇到子模块会提示缩小范围而非静默忽略；不递归克隆子模块。ZIP 保存 symlink 的原始内容，不恢复系统链接或可执行位。打包时请保持任务页打开。

新增权限：downloads，用于保存生成的 ZIP；api.github.com，仅用于读取仓库数据；content script 仅匹配 https://github.com/*。不在扩展安装或启动时扫描/注入所有已打开标签。

实现参考 [KinoLien/gitzip](https://github.com/KinoLien/gitzip)（已核对 MIT LICENSE）的 GitHub API 目录展开、斜杠分支识别和 JSZip 思路；独立实现当前 GitHub DOM 和 MV3 通信，不依赖 GitZip 扩展或网站。压缩依赖 JSZip 随扩展打包，不从 CDN 加载。

## 开发与验证

需要 Node.js 22.12+（或 24+ LTS）及 npm。

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run zip
```

`npm run dev` 启动 WXT 开发环境；`npm run zip` 生成可分发 ZIP。测试通过 mock 验证 Chrome 标签、消息和设置行为；真实 Chrome 的扩展安装、侧栏开合及跨会话恢复仍需实际环境验证。

## 发布到 GitHub Release

在本目录运行：

```sh
make publish
```

依次输入 **tag** 和 **title**（回车使用默认值）。默认 tag 为 `xxTools-v<package.json 版本>`，默认 title 为 `xxTools <版本>`；tag 不会自动修改扩展版本。目标仓库从 Git `origin` 读取，当前为 `qbmiller/UserScripts`。

需要先安装依赖、安装 GitHub CLI 并运行 `gh auth login --hostname github.com`。命令自动执行测试、类型检查和 ZIP 构建，将 `xxTools-<版本>-chrome.zip` 上传至草稿 Release，成功后公开。已存在的同名 Release 会报错，不覆盖附件。Release 指向当前 HEAD，需先将该提交推到 GitHub；不会自动 commit 或 push。工作区未提交内容会进入 ZIP，发布说明会标注，建议发布前提交相应改动。

也可以显式传参或仅本地验证：

```sh
make publish TAG=xxTools-v2.1.0 TITLE='xxTools 2.1.0：GitHub 勾选下载'
make publish DRY_RUN=1
```

`DRY_RUN=1` 仍执行验证和打包，但不连接 GitHub、不创建 tag/Release、不上传。打包结果在 `.output/release/`。可用环境变量 `NOTES` 指定发布说明，默认说明包含加载方法、版本和构建提交。如果上传或公开中断，先检查 GitHub 上的草稿；命令不会删除或覆盖已有 Release。

## 新增工具

1. 新建 `src/tools/<tool-id>/ToolView.vue`，使用 `<script setup lang="ts">`。
2. 在 `src/core/registry.ts` 注册唯一 ID、名称、描述、分类、图标、关键词和 `load: () => import(...)`。
3. 工具自动进入搜索、分类、收藏、最近使用；逻辑尽量独立为纯函数。
4. 新增后台能力时在 `src/features` 实现，并在 `entrypoints/background.ts` 顶层同步注册监听器。需要新权限时显式修改 `wxt.config.ts`，不要向工具暴露任意 Chrome API 代理。
5. 添加验证实际行为的测试，执行类型检查和构建。

`src/core/preferences.mjs` 是存储格式与操作规约，`src/features/preferences.mjs` 串行合并各窗口的设置操作，`src/core/preference-client.mjs` 防止旧写回覆盖新交互。

## WASM、PDF 与 OCR 的后续接入

工具界面、处理引擎、模型数据分别管理。WASM/Worker/JS 可执行资源随扩展发布并按工具懒加载；不从远端下载可执行代码。OCR 语言包、模型等纯数据允许首次使用时由用户确认下载。

模型下载应显示来源、版本、大小、许可和本机处理方式，支持进度、取消、失败重试及缓存删除；校验版本、大小和 SHA-256，成功后标记可用。缓存使用 IndexedDB/OPFS，不放 chrome.storage；中断的临时文件不作为可用模型。算法资源升级随扩展更新，数据资源与引擎版本匹配。

PDF 的合并拆分等功能可优先评估纯 JS 库，只有渲染、压缩、OCR 等确有收益时引入 WASM；重任务放 Worker，避免阻塞侧栏。未来使用 WASM 时再按实际需要配置 CSP 的 `wasm-unsafe-eval`，当前版本没有 WASM 引擎、模型下载器或 PDF/OCR 功能。

参考设计见 `../docs/design/2026-11-26-browser-toolbox.md`，第三方发布包仅在 `../ref/toolside` 用于分析，不参与本扩展构建。
