// ==UserScript==
// @name              🤠 Github enhanced assistant warehouse display size
// @description       🤠 Warehouse display size: On GitHub’s code search, warehouse search, issue page, user warehouse list and repository page, the size of the warehouse will be displayed next to the warehouse name, allowing users to quickly understand the scale of the warehouse and optimize their selection. Inactive development warning: If a repository has not been updated in the past six months, the system will add a prompt at the top of the repository to remind users that the repository is inactive and display the time of the last update. This helps users determine the activity and maintenance status of the warehouse. Quick jump within the warehouse: When browsing the warehouse, the user can easily view the list of all warehouses of the user, providing an entrance to quickly jump to different warehouses. Users can quickly find and access other projects of interest, improving work efficiency. Usage scenarios: Developers: By displaying the warehouse size and active warnings, you can quickly filter out suitable libraries for development and avoid using projects that are no longer maintained. Project Manager: Through the quick jump function, it is easy to manage and coordinate multiple projects and improve work efficiency. Learners: When learning new technologies, they can more easily find relevant open source projects and quickly check the activity and scale of the projects. 🤠
// @name:zh-CN        🤠 Github 增强小助手 仓库显示大小
// @description:zh-CN 🤠 仓库显示大小：在 GitHub 的代码搜索、仓库搜索、议题页面、用户仓库列表和存储库页面上，仓库名称旁边会显示该仓库的大小，方便用户快速了解仓库的规模，优化选择。不活跃开发警告：如果某个仓库在过去六个月内没有更新，系统将在仓库的顶部添加提示，提醒用户该仓库不活跃，并显示最后一次更新的时间。这有助于用户判断仓库的活跃程度和维护状况。仓库内快捷跳转：在浏览仓库时，用户可以方便地查看该用户的所有仓库列表，提供一个快速跳转到不同仓库的入口。用户可以快速找到和访问感兴趣的其他项目，提高工作效率。使用场景：开发者：可以通过显示仓库大小和活跃警告，快速筛选出合适的库进行开发，避免使用不再维护的项目。项目管理者：通过快速跳转功能，便于管理和协调多个项目，提高工作效率。学习者：在学习新技术时，可以更方便地找到相关的开源项目，快速查看项目的活跃程度和规模。🤠
// @name:zh           🤠 Github 增强小助手 仓库显示大小
// @description:zh    🤠 仓库显示大小：在 GitHub 的代码搜索、仓库搜索、议题页面、用户仓库列表和存储库页面上，仓库名称旁边会显示该仓库的大小，方便用户快速了解仓库的规模，优化选择。不活跃开发警告：如果某个仓库在过去六个月内没有更新，系统将在仓库的顶部添加提示，提醒用户该仓库不活跃，并显示最后一次更新的时间。这有助于用户判断仓库的活跃程度和维护状况。仓库内快捷跳转：在浏览仓库时，用户可以方便地查看该用户的所有仓库列表，提供一个快速跳转到不同仓库的入口。用户可以快速找到和访问感兴趣的其他项目，提高工作效率。使用场景：开发者：可以通过显示仓库大小和活跃警告，快速筛选出合适的库进行开发，避免使用不再维护的项目。项目管理者：通过快速跳转功能，便于管理和协调多个项目，提高工作效率。学习者：在学习新技术时，可以更方便地找到相关的开源项目，快速查看项目的活跃程度和规模。🤠
// @namespace         https://github.com/ChinaGodMan/UserScripts
// @version           0.1.3.7
// @author            mshll & 人民的勤务员 <toniaiwanowskiskr47@gmail.com>
// @match             https://github.com/*
// @grant             none
// @run-at            document-start
// @grant             GM_getValue
// @grant             GM_setValue
// @grant             GM_addStyle
// @grant             GM_xmlhttpRequest
// @grant             GM_registerMenuCommand
// @grant             none
// @require           https://update.greasyfork.org/scripts/511697/1460281/TOTP%20Generator.js
// @icon              data:image/png;base64,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
// @iconbak           https://github.githubassets.com/pinned-octocat.svg
// @license           MIT
// @source            https://github.com/qinwuyuan-cn/UserScripts
// @run-at            document-start
// @supportURL        https://github.com/ChinaGodMan/UserScripts/issues
// @homepageURL       https://github.com/ChinaGodMan/UserScripts
// @downloadURL https://update.greasyfork.org/scripts/502291/%F0%9F%A4%A0%20Github%20enhanced%20assistant%20warehouse%20display%20size.user.js
// @updateURL https://update.greasyfork.org/scripts/502291/%F0%9F%A4%A0%20Github%20enhanced%20assistant%20warehouse%20display%20size.meta.js
// ==/UserScript==
"use strict"
const userLang =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    "en"
const translations = {
    en: {
        save: "Save",
        cancel: "Cancel",
        modaltitle: "Set GitHub Token",
        description: 'Enter your GitHub personal access token with "repo" scope.',
        githubtokeninput: "Enter your GitHub personal access token",
        newtoken: "Click here to create a new token",
        warncheckbox: "  Inactive Development Warning",
        menu: "Set GitHub Token",
        renderWarning: "WARNING: repo has not received an update in 1+ year(s)",
        renderCaution: "Caution: repo has not received an update in 6+ months",
        confirm: "You have not entered a Token, confirm to clear the GitHub Token?",
        timediff: "Last commit was: {years} years, {months} months, {days} days ago ",
        view: "View[",
        allRepos: "]All repositories",
        newTab: "Open in a new tab when quickly viewing repositories",
        repoSize: "Repository size:",
        repoDes: "Repository description:",
        repoLang: "Primary language:",
        repoCreated: "Initial creation time:",
        repoUpdated: "Last updated:",
        repoPushed: "Last pushed:",
        repoForks: "Forks:",
        repoStars: "Stars:",
        ossinsight: "OSS Insight analysis page for the repository",
        activeforks: "Active forks list for the repository",
        activeforks_: "Active forks",
        publicRepos: "Public repositories: ",
        privateRepos: "Private repositories: ",
        forkRepos: "Forked repositories: ",
        deleteRepo_i: "You are trying to delete the repository:",
        deleteRepo: "ChinaGodMan reminds you:\nDeleting a repository is an extremely dangerous operation.\nOnce you delete a repository, it cannot be recovered.\nPlease think twice! Data is priceless, cherish it.",
        deleteRepo_ask: "Are you sure you want to delete the repository? (Confirmed",
        deleteRepo_pass: "Deletion successful!",
        deleteRepo_failed: "Deletion failed!\nIt is recommended to check whether the GitHub token has permission to delete the repository!",
        deleteRepo_failed_status: "Status code:",
        deleteRepo_btn: "Delete repository",
        secret: "[Optional:] Enter your two-factor key for automatic input during GitHub's two-step verification.",

    },
    "zh-CN,zh,zh-SG": {
        save: "保存",
        cancel: "取消",
        modaltitle: "设置 GitHub 令牌",
        description: '请输入您的 GitHub 个人访问令牌，需具备 "repo" 权限。',
        githubtokeninput: "请输入您的 GitHub 个人访问令牌",
        newtoken: "点击此处创建新的令牌",
        warncheckbox: " 非活跃开发警告",
        menu: "设置 GitHub 令牌",
        renderWarning: "警告：该仓库在 1 年以上未更新",
        renderCaution: "注意：该仓库在 6 个月以上未更新",
        confirm: "你没有输入Token,确认清空GitHub Token?",
        timediff: "最后一次提交距现在：{years}年{months}个月{days}天 ",
        view: "查看",
        allRepos: "所有仓库",
        newTab: "快速查看仓库时新窗口打开",
        repoSize: "仓库大小：",
        repoDes: "仓库简介：",
        repoLang: "主要语言：",
        repoCreated: "初始创建时间：",
        repoUpdated: "最后一次更新：",
        repoPushed: "最后一次推送：",
        repoPushed: "最后一次推送：",
        repoForks: "复刻：",
        repoStars: "星标：",
        ossinsight: "仓库对应的 OSS Insight 分析页面",
        activeforks: "仓库对应的活跃复刻列表",
        activeforks_: "活跃的复刻",
        publicRepos: "公共仓库: ",
        privateRepos: "私有仓库: ",
        forkRepos: "分叉仓库: ",
        deleteRepo_i: "你正在尝试删除仓库：",
        deleteRepo: "人民的勤务员提醒你:\n删除仓库是一个极其危险的操作\n 你一旦删除仓库，将再也无法恢复。\n请三思而后行!  数据无价，且行且珍惜",
        deleteRepo_ask: "你确定要删除仓库吗? (已确认",
        deleteRepo_pass: " 删除成功!",
        deleteRepo_failed: "删除失败!\n建议检查GitHub token 是否具有删除仓库的权限!",
        deleteRepo_failed_status: "状态码:",
        deleteRepo_btn: "删除仓库",
        secret: "[可选项目:]输入你的双因素密钥用于在GitHub触发二次验证时自动输入",
    }

}
const getTranslations = (lang) => {
    for (const key in translations) {
        if (key === lang || key.split(",").includes(lang)) {
            return translations[key]
        }
    }
    return translations["en"]
}
const translate = new Proxy(
    function (key) {
        const lang = userLang
        const strings = getTranslations(lang)
        return strings[key] || translations["en"][key]
    },
    {
        get(target, prop) {
            const lang = userLang
            const strings = getTranslations(lang)
            return strings[prop] || translations["en"][prop]
        },
    }
)
//! Generate a new public access token from https://github.com/settings/tokens and insert it here
//*Note: to be able to see the size of your private repos, you need to select the `repo` scope when generating the token
let TOKEN = GM_getValue("githubToken", "")
let WARNING = GM_getValue("warn", true)
let openInNewTab = GM_getValue("openInNewTab", false)
let DELAY = GM_getValue("DELAY", "24h")
let USETIP = GM_getValue("USETIP", false)//为真时使用GitHub自带的TIP提示而不是用网页title
let SECRET = GM_getValue("SECRET", '')
GM_addStyle(`
    .modal-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000;}
    .modal-content{background:white;padding:20px;border-radius:8px;width:400px;box-shadow:0 4px 15px rgba(0,0,0,0.2);position:relative;}
    .modal-title{margin:0 0 10px 0;font-size:20px;}
    .modal-description{margin-bottom:20px;font-size:14px;color:#666;}
    .modal-description a{color:#007bff;text-decoration:underline;}
    .github-token-input{width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:20px;font-size:14px;}
    #save-token{background-color:#28a745;color:white;border:none;padding:10px 20px;cursor:pointer;border-radius:4px;margin-right:10px;}
    #cancel-token{background-color:#dc3545;color:white;border:none;padding:10px 20px;cursor:pointer;border-radius:4px;}
`)
function createModal() {
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <h3 class="modal-title">${translate.modaltitle}</h3>
                <p class="modal-description">
                    ${translate.description}
                    <a href="https://github.com/settings/tokens/new?description=GitHub%20Repo%20Size%20UserScript&scopes=repo" target="_blank" rel="noopener noreferrer">
                        ${translate.newtoken}
                    </a>
                </p>
                <input type="text" id="github-token-input" placeholder="${translate.githubtokeninput}">
                <li role="presentation" aria-hidden="true" data-view-component="true" class="ActionList-sectionDivider"></li>
                <p class="modal-description">
                    ${translate.secret}
                    <a href="https://github.com/settings/security?type=app#two-factor-summary" target="_blank" rel="noopener noreferrer">
                        ${translate.newtoken}
                    </a>
                </p>
                <input type="text" id="two-factor-secret" class="github-token-input" placeholder="${translate.secret}">
                <label><input type="checkbox" id="warn">${translate.warncheckbox}</label><br>
                <label><input type="checkbox" id="openInNewTab">    ${translate.newTab}</label>
                <br>
                <li role="presentation" aria-hidden="true" data-view-component="true" class="ActionList-sectionDivider"></li>
                <button id="save-token">${translate.save}</button>
                <button id="cancel-token" class="cancel">${translate.cancel}</button>
            </div>
        </div>
    `
    const modalContainer = document.createElement("div")
    modalContainer.innerHTML = modalHTML
    document.body.appendChild(modalContainer)
    const elements = {
        input: modalContainer.querySelector("#github-token-input"),
        secretInput: modalContainer.querySelector("#two-factor-secret"),
        warn: modalContainer.querySelector("#warn"),
        newTab: modalContainer.querySelector("#openInNewTab"),
        saveButton: modalContainer.querySelector("#save-token"),
        cancelButton: modalContainer.querySelector("#cancel-token")
    }
    elements.warn.checked = GM_getValue("warn", true)
    elements.newTab.checked = GM_getValue("openInNewTab", false)
    elements.input.value = GM_getValue("githubToken", "")
    elements.secretInput.value = GM_getValue("SECRET", "")
    elements.saveButton.addEventListener("click", () => {
        const token = elements.input.value.trim()
        GM_setValue("warn", elements.warn.checked)
        WARNING = elements.warn.checked
        GM_setValue("openInNewTab", elements.newTab.checked)
        openInNewTab = elements.newTab.checked
        GM_setValue("SECRET", elements.secretInput.value.trim())

        if (token) {
            GM_setValue("githubToken", token)
            modalContainer.remove()
            TOKEN = token
        } else {
            const userConfirmed = confirm(translate("confirm")) //提示是否删除
            if (userConfirmed) {
                GM_setValue("githubToken", token)
                modalContainer.remove()
                TOKEN = token
            }
        }
    })

    elements.cancelButton.addEventListener("click", () => modalContainer.remove())
}

GM_registerMenuCommand(translate("menu"), function () {
    createModal()
})
const getPageType = () => {
    const { pathname, search } = window.location
    const params = new URLSearchParams(search)
    const [, username, repo] = pathname.split("/")
    const q = params.get("q")?.toLocaleLowerCase()
    const type = params.get("type")?.toLocaleLowerCase()
    if (window.location.pathname.split("/").pop() === "repositories") return "list-view-container"
    if (window.location.href.includes("?tab=repositories")) return "user-repositories"
    if (window.location.href.includes("?tab=stars")) return "user-starred-repos"
    if (username && repo) return "repo"
    if (q && type === "code") return "code_search"
    if (q) return "search"
}
const addSizeToRepos = () => {

    const pageType = getPageType()
    // Get the repo selector based on the page type
    let repoSelector
    switch (pageType) {
        case "repo": //仓库详情界面
            repoSelector = "#repository-container-header strong a"
            break
        case "list-view-container": //ORG下的仓库列表
            repoSelector =
                'div[data-testid="list-view-item-title-container"] h4 a'
            break
        case "user-repositories": //用户资料页面的仓库TAB
            repoSelector = "#user-repositories-list h3 a"
            break
        case "user-starred-repos": //用户资料页面的已星标仓库
            repoSelector = "#user-starred-repos h3 a"
            break
        case "search": //搜索
            repoSelector = 'div[data-testid="results-list"] .search-title a'
            break
        case "code_search": //代码搜索
            repoSelector = 'div[data-testid="results-list"] .search-title a'
            break
        default:
            return
    }
    function extractPath(input) {
        const thirdSlashIndex = input.indexOf(
            "/",
            input.indexOf("/", input.indexOf("/") + 1) + 1
        )
        if (thirdSlashIndex !== -1) {
            return input.substring(0, thirdSlashIndex)
        }
        return input
    }
    if (pageType === "user-repositories") {
        const repoItems = document.querySelectorAll('li[itemprop="owns"]')
        repoItems.forEach(item => {
            const repoName = item.querySelector('a[itemprop="name codeRepository"]').textContent.trim()
            const ownerName = window.location.pathname.split('/')[1]
            const deleteButton = document.createElement('button')
            deleteButton.textContent = 'Delete'
            deleteButton.classList.add('delete-repo-btn')
            deleteButton.onclick = function () {
            }
            insertDelBtn(ownerName, repoName, false, 'dialog-show-repo-delete-user-repositories', item)
        })
    }
    // Get all the repo links
    let filterHref
    document.querySelectorAll(repoSelector).forEach(async (elem) => {
        // Get json data from github api to extract the size
        const tkn = TOKEN
        var href = elem.getAttribute("href")
        href = extractPath(href)
        if (filterHref == href) {
            return
        } else {
            filterHref = href
        }
        if (pageType === "repo") {
            const parts = href.split('/')
            const owner = parts[1]
            const name = parts[2]
            insertActiveForks(owner, name, !isMobileDevice())
            insertOssInsightButton(owner, name, !isMobileDevice())
            if (isLoggedInUser_f()) insertDelBtn(owner, name, !isMobileDevice())
        }
        console.log(href)
        const headers = tkn ? { authorization: `token ${tkn}` } : {}
        const jsn = await (
            await fetch(`https://api.github.com/repos${href}`, {
                headers: headers,
            })
        ).json()
        // If JSON failed to load, skip
        if (jsn.message) return
        if (pageType === "repo" && WARNING) {
            checkCommitDate(jsn.pushed_at)
        }

        if (pageType === "repo") {
            const reposApi = isLoggedInUser(jsn.owner.avatar_url)
                ? (TOKEN ? 'https://api.github.com/user/repos' : jsn.owner.repos_url)
                : jsn.owner.repos_url
            function fetchReposWithCache(ownerKey, reposApi, headers) {
                const localData = localStorage.getItem(ownerKey)
                const currentTime = new Date().getTime()
                if (localData) {
                    const parsedData = JSON.parse(localData)
                    const localTimeStamp = new Date(parsedData.timeStamp).getTime()
                    if (currentTime - localTimeStamp < timeToSeconds(DELAY) * 1000) {
                        console.log('本地缓存数据未过期，直接使用本地数据')
                        insertReposList(parsedData.reposArray, USETIP)
                        return
                    }
                }
                getUserAllRepos(reposApi, headers)
                    .then(data => {
                        const reposArray = data.map(repo => ({
                            name: repo.name,
                            private: repo.private,
                            html_url: repo.html_url,
                            fork: repo.fork,
                            description: repo.description,
                            stargazers_count: repo.stargazers_count,
                            owner: repo.owner.login,
                            forks_count: repo.forks_count,
                            open_issues_count: repo.open_issues_count,
                            language: repo.language,
                            size: repo.size,
                            created_at: systemTime(repo.created_at),
                            updated_at: systemTime(repo.updated_at),
                            pushed_at: systemTime(repo.pushed_at),
                        }))
                        const timeStamp = new Date().toISOString()
                        const dataToStore = {
                            reposArray: reposArray,
                            timeStamp: timeStamp
                        }
                        localStorage.setItem(ownerKey, JSON.stringify(dataToStore))
                        insertReposList(reposArray, USETIP)
                    })
                    .catch(error => console.error('Error fetching data:', error))
            }
            if (!document.querySelector('#view-user-repos')) {

                fetchReposWithCache(jsn.owner.login, reposApi, headers)
            }

        }

        // Get parent element to append the size to
        let parent = elem.parentElement
        if (pageType === "repo") parent = elem.parentElement.parentElement
        // Create the size container
        let sizeContainer = parent.querySelector(`#mshll-repo-size`)
        if (sizeContainer === null) {
            sizeContainer = document.createElement("span")
            sizeContainer.id = "mshll-repo-size"
            sizeContainer.className = "tooltipped tooltipped-s"
            sizeContainer.classList.add(
                "Label",
                "Label--info",
                "v-align-middle",
                "ml-1"
            )
            sizeContainer.setAttribute("aria-label", "Repository size")
            sizeContainer.innerText = "-"
            // Create the size icon
            let sizeSVG = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            )
            sizeSVG.setAttribute("aria-hidden", "true")
            sizeSVG.setAttribute("viewBox", "-4 -4 22 22")
            sizeSVG.setAttribute("width", "16")
            sizeSVG.setAttribute("height", "16")
            sizeSVG.setAttribute("fill", "currentColor")
            sizeSVG.setAttribute("data-view-component", "true")
            sizeSVG.classList.add("octicon", "octicon-file-directory", "mr-1")
            let sizeSVGPath = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            )
            sizeSVGPath.setAttribute("fill-rule", "evenodd")
            sizeSVGPath.setAttribute(
                "d",
                "M1 3.5c0-.626.292-1.165.7-1.59.406-.422.956-.767 1.579-1.041C4.525.32 6.195 0 8 0c1.805 0 3.475.32 4.722.869.622.274 1.172.62 1.578 1.04.408.426.7.965.7 1.591v9c0 .626-.292 1.165-.7 1.59-.406.422-.956.767-1.579 1.041C11.476 15.68 9.806 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.62-1.579-1.04-.408-.426-.7-.965-.7-1.591Zm1.5 0c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Zm0 4.5c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 9.705 6.353 10 8 10c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55V5.724c-.241.15-.503.286-.778.407C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0 2.225V12.5c0 .133.058.318.282.55.227.237.592.484 1.1.708 1.016.447 2.471.742 4.118.742 1.647 0 3.102-.295 4.117-.742.51-.224.874-.47 1.101-.707.224-.233.282-.418.282-.551v-2.275c-.241.15-.503.285-.778.406-1.247.549-2.917.869-4.722.869-1.805 0-3.475-.32-4.721-.869a6.327 6.327 0 0 1-.779-.406Z"
            )
            sizeSVG.appendChild(sizeSVGPath)
            const size = jsn.size * 1024
            const humanReadableSize = getHumanReadableSize(jsn.size)
            // Insert the size into the size container
            sizeContainer.innerHTML = `${humanReadableSize}`
            sizeContainer.prepend(sizeSVG)
            // Insert the size container into the DOM
            if (pageType === "code_search") {
                parent.style.direction = "ltr"
            }
            if (!size) {
                sizeContainer.style.color = "red"
                sizeContainer.style.border = "1px solid red"
            }
            parent.appendChild(sizeContainer)
        }

    })
}
window.addSizeToRepos = addSizeToRepos
// Add the size to the repos on the page
window.onload = function () {
    //addSizeToRepos()
}
const selectors = [
    "#repository-container-header strong a", // 仓库详情界面
    'div[data-testid="list-view-item-title-container"] h4 a', // ORG下的仓库列表
    "#user-repositories-list h3 a", // 用户资料页面的仓库TAB
    "#user-starred-repos h3 a", // 用户资料页面的已星标仓库
    'div[data-testid="results-list"] .search-title a', // 搜索
    // 'div[data-testid="results-list"] .search-title a' // 代码搜索
]
document.addEventListener('DOMContentLoaded', () => {
    main()
    if (SECRET) {
        waitForElement('#app_totp')//, false
            .then(() => {
                generateTOTP(SECRET).then(totp => {
                    document.querySelector("#app_totp").value = totp
                    document.querySelector("button[type='submit']").click()
                })
            })
            .catch((error) => {
                console.error(`totp发生了错误,找不到元素`)
            })
    }
})
/* document.addEventListener('turbo:load', () => {
    addSizeToRepos()
}) */  //!SECTION-网络不顺畅时，加载太慢
observeUrlChanges(main)
function main(delay = 0) {
    Promise.race(selectors.map((selector) => waitForElement(selector))).then(() => {
        setTimeout(() => {
            addSizeToRepos()
        }, delay)
    }).catch((error) => {
        console.error(error.message)
    })
}
function observeUrlChanges(callback, delay = 10) {
    let lastUrl = location.href
    const observer = new MutationObserver(() => {
        const url = location.href
        if (url !== lastUrl) {
            lastUrl = url
            setTimeout(() => {
                callback()
            }, delay)
        }
    })
    observer.observe(document, { subtree: true, childList: true })
    return observer
}
function waitForElement(selector, dis = true) {
    return new Promise((resolve, reject) => {
        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                resolve()
                observer.disconnect()
            }
        })
        if (dis) {
            const timeout = setTimeout(() => {
                observer.disconnect()
                reject(new Error('超时：未找到指定元素'))
            }, 10000)
        }
        observer.observe(document.body, { childList: true, subtree: true })
    })
}

function displayMessage(el) {
    document
        .querySelector("#js-repo-pjax-container")
        .insertAdjacentElement("beforebegin", el)
}
function renderWarning(timediff) {
    const banner = document.createElement("div")
    banner.id = "zh-banner-warning"
    banner.setAttribute(
        "style",
        `
    background-color: red;
    height: 100px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 36px;
    position: relative;
  `
    )
    banner.textContent = translate.renderWarning
    const smallTag = document.createElement("div")
    smallTag.setAttribute(
        "style",
        `
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 5px 10px;
    font-size: 14px;
    border-top-left-radius: 5px;
  `
    )
    smallTag.textContent = timediff
    banner.appendChild(smallTag)
    displayMessage(banner)
}
function renderCaution(timediff) {
    const banner = document.createElement("div")
    banner.id = "zh-banner-warning"
    banner.setAttribute(
        "style",
        `
    background-color: yellow;
    height: 50px;
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    position: relative;
  `
    )
    banner.textContent = translate.renderCaution
    const smallTag = document.createElement("div")
    smallTag.setAttribute(
        "style",
        `
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 5px 10px;
    font-size: 14px;
    border-top-left-radius: 5px;
  `
    )
    smallTag.textContent = timediff
    banner.appendChild(smallTag)
    displayMessage(banner)
}
function checkCommitDate(datetimeString) {
    if (document.querySelector("#zh-banner-warning")) return
    const date = new Date(datetimeString)
    const now = new Date()
    const yearsDiff = now.getFullYear() - date.getFullYear()
    const monthsDiff = now.getMonth() - date.getMonth()
    const daysDiff = now.getDate() - date.getDate()
    let adjustedMonths = monthsDiff
    let adjustedDays = daysDiff
    if (adjustedDays < 0) {
        adjustedMonths--
        const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        adjustedDays += lastMonth.getDate()
    }
    let finalYears = yearsDiff
    if (adjustedMonths < 0) {
        finalYears--
        adjustedMonths += 12
    }
    let result = translate.timediff
    if (finalYears === 0) {
        result = result.replace(/{years}.*?(?={months})/, '')
    }
    result = result.replace('{years}', finalYears > 0 ? finalYears : '')
    result = result.replace('{months}', adjustedMonths)
    result = result.replace('{days}', adjustedDays)
    const daysSinceLastCommit = (Date.now() - date.getTime()) / 1000 / 60 / 60 / 24
    if (daysSinceLastCommit > 365) {
        renderWarning(result)
    } else if (daysSinceLastCommit > 182.5) {
        renderCaution(result)
    } else {
        /* noop */
    }
}
function insertReposList(links, tip = false) {
    const gitHubStyle = `
#view-user-repos {
  order: 10;
}
#view-user-repos .dropdown-menu {
  min-width: 170px;
  width: auto;
}
#view-user-repos .dropdown-menu .dropdown-item .d-inline-flex {
  vertical-align:sub;
}`
    if (!document.head.querySelector('style[data-id="view-user-repos-css"]')) {
        const globalStyle = document.createElement('style')
        globalStyle.dataset.id = 'view-user-repos-css'
        globalStyle.innerHTML = gitHubStyle
        document.head.appendChild(globalStyle)
    }
    const selectors = [
        '.jxTzTd', // Repo main page
        '.faNtbn .d-flex.gap-2', // Repo files page
        '.gwHaUx .d-flex.gap-2' // Commits page
    ]
    //document.querySelector(selectors.join(', '))
    const existingButton = document.querySelector('.jxTzTd')
    if (existingButton) {
        const sortedLinks = links.sort((a, b) => {//!SECTION 排序
            // 首先比较 fork 下沉到数组的低端.
            if (b.fork > 0 && a.fork <= 0) {
                return -1 // a 在前
            } else if (a.fork > 0 && b.fork <= 0) {
                return 1 // b 在前
            } else {
                // 如果 fork 相同，比较 private
                if (b.private === a.private) {
                    // 如果 private 相同，进一步判断 private 为 false 的情况
                    if (!a.private && !b.private) {
                        return b.stargazers_count - a.stargazers_count // stargazers_count 大的在前
                    }
                    return 0 // private 相同且不是 false 的情况下不排序
                }
                return (b.private ? -1 : 1) // private 为 true 的在前
            }
        })
        function getIconPath(link) {
            var fillColor = null
            if (link.private) fillColor = "green"
            if (!link.private && !link.fork) fillColor = "red"
            var svg = `<path fill="${fillColor}" fill-rule="evenodd" d="M1 3.5c0-.626.292-1.165.7-1.59.406-.422.956-.767 1.579-1.041C4.525.32 6.195 0 8 0c1.805 0 3.475.32 4.722.869.622.274 1.172.62 1.578 1.04.408.426.7.965.7 1.591v9c0 .626-.292 1.165-.7 1.59-.406.422-.956.767-1.579 1.041C11.476 15.68 9.806 16 8 16c-1.805 0-3.475-.32-4.721-.869-.623-.274-1.173-.62-1.579-1.04-.408-.426-.7-.965-.7-1.591Zm1.5 0c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 5.205 6.353 5.5 8 5.5c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55 0-.133-.058-.318-.282-.551-.227-.237-.591-.483-1.101-.707C11.102 1.795 9.647 1.5 8 1.5c-1.646 0-3.101.295-4.118.742-.508.224-.873.471-1.1.708-.224.232-.282.417-.282.55Zm0 4.5c0 .133.058.318.282.551.227.237.591.483 1.101.707C4.898 9.705 6.353 10 8 10c1.646 0 3.101-.295 4.118-.742.508-.224.873-.471 1.1-.708.224-.232.282-.417.282-.55V5.724c-.241.15-.503.286-.778.407C11.475 6.68 9.805 7 8 7c-1.805 0-3.475-.32-4.721-.869a6.15 6.15 0 0 1-.779-.407Zm0 2.225V12.5c0 .133.058.318.282.55.227.237.592.484 1.1.708 1.016.447 2.471.742 4.118.742 1.647 0 3.102-.295 4.117-.742.51-.224.874-.47 1.101-.707.224-.233.282-.418.282-.551v-2.275c-.241.15-.503.285-.778.406-1.247.549-2.917.869-4.722.869-1.805 0-3.475-.32-4.721-.869a6.327 6.327 0 0 1-.779-.406Z"></path>`
            if (fillColor) return svg
            if (link.fork) return `<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path>`
        }
        let privateClassAdded = false
        let forkClassAdded = false
        const stats = {
            privateTrue: 0,
            privateFalse: 0,
            forkTrue: 0,
            forkFalse: 0,
        }
        const listItems = sortedLinks.map(link => {
            stats.privateTrue += (link.private && !link.fork) ? 1 : 0
            stats.privateFalse += (link.private ? 0 : 1) && !link.fork ? 1 : 0
            stats.forkTrue += link.fork ? 1 : 0
            stats.forkFalse += link.fork ? 0 : 1
            let liClass = ""
            if (link.private && !privateClassAdded) {
                liClass += "border-top"
                privateClassAdded = true
            }
            if (link.fork && !forkClassAdded) {
                liClass += "border-top"
                forkClassAdded = true
            }
            const starsAndForks = [
                link.stargazers_count > 0 ? `${translate.repoStars}${link.stargazers_count}` : '',
                link.forks_count > 0 ? `${translate.repoForks}${link.forks_count}` : ''
            ].filter(Boolean).join(' ')
            const repoInfo = [
                (link.description ? `${translate.repoDes}${link.description}` : ''),
                starsAndForks,
                `${translate.repoSize}${getHumanReadableSize(link.size)}`,
                link.language ? `${translate.repoLang}${link.language}` : '',
                `${translate.repoCreated}${link.created_at}`,
                `${translate.repoUpdated}${link.updated_at}`,
                `${translate.repoPushed}${link.pushed_at}`
            ].filter(Boolean).join('\n')
            return `
        <li class="${liClass}${(tip) ? ` tooltipped tooltipped-s` : ''}"  aria-label="${repoInfo}">
            <a href="${link.html_url}" class="dropdown-item" ${(openInNewTab) ? `target="_blank"` : ''} rel="noopener noreferrer" ${(tip) ? '"' : ` title="${repoInfo}"`}>
                <span class="d-inline-flex mr-2">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        ${getIconPath(link)}
                    </svg>
                </span>
                ${link.name}
            </a>
        </li>
    `
        }).join('')
        const ariaLabel = [
            ` ${translate.view}[${links[0].owner}]${translate.allRepos} `,
            `${translate.allRepos} : ${sortedLinks.length}`,
            stats.privateTrue > 0 ? `${translate.privateRepos} ${stats.privateTrue}` : '',
            stats.privateFalse > 0 ? `${translate.publicRepos}  ${stats.privateFalse}` : '',
            stats.forkTrue > 0 ? `${translate.forkRepos} ${stats.forkTrue}` : '',
            //stats.forkFalse > 0 ? `非分叉仓库: ${stats.forkFalse}` : ''
        ].filter(Boolean).join('\n')
        const detailsHTML = `
<details id="view-user-repos" class="details-overlay details-reset position-relative d-flex">
    <summary role="button" type="button" class="btn text-center">
        <span class="d-none d-xl-flex flex-items-center tooltipped tooltipped-s" aria-label="${ariaLabel}">
            ${translate.view}<mark>[${links[0].owner}]</mark>${translate.allRepos}
            <span class="dropdown-caret ml-2"></span>
        </span>
        <span class="d-inline-block d-xl-none">
            ${links[0].owner}
            <span class="dropdown-caret d-none d-sm-inline-block d-md-none d-lg-inline-block"></span>
        </span>
    </summary>
    <div>
        <ul class="dropdown-menu dropdown-menu-sw">
            ${listItems}
        </ul>
    </div>
</details>`

        existingButton.insertAdjacentHTML('beforebegin', detailsHTML)
    } else {
    }
}
function isLoggedInUser(avatar_url) {//从返回的json判断
    const imgElement = document.querySelector(".AppHeader-user button span span img")
    if (imgElement) {
        const imgSrc = imgElement.src
        return imgSrc === avatar_url
    } else {
        return false
    }
}
function isLoggedInUser_f() {//NOTE - 比较仓库头像和登录头像中的ID
    const imgElement = document.querySelector(".AppHeader-user button span span img")
    const repoImgElement = document.querySelector("#repo-title-component > img")
    if (imgElement && repoImgElement) {
        const imgSrc = imgElement.src
        const repoImgSrc = repoImgElement.src

        const userIdPattern = /\/u\/(\d+)/
        const imgUserIdMatch = imgSrc.match(userIdPattern)
        const repoUserIdMatch = repoImgSrc.match(userIdPattern)
        if (imgUserIdMatch && repoUserIdMatch) {
            const imgUserId = imgUserIdMatch[1]
            const repoUserId = repoUserIdMatch[1]
            return imgUserId === repoUserId
        }
    }
    return false
}
async function getUserRepos(href, header = {}) {
    try {
        const response = await fetch(`${href}`, {
            headers: header,
        })
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error('Fetch error:', error)
        throw error
    }
}
async function getUserAllRepos(href, header = {}, getAll = false, maxPage = 0) {
    try {
        let allRepos = []
        let page = 1
        let perPage = 100
        do {
            const url = getAll ? `${href}?per_page=${perPage}&page=${page}` : href//NOTE - false时，就获取前30个就行了 ，够用了 仓库没那么多，列表太长也不好。
            const response = await fetch(url, { headers: header })
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
            const repos = await response.json()
            if (repos.length === 0) break
            allRepos = allRepos.concat(repos)
            page++
            // 如果设定了最大页数并且已经达到了最大页数，结束战斗
            if (maxPage !== 0 && page > maxPage) break
        } while (getAll)
        return allRepos
    } catch (error) {
        console.error('Fetch error:', error)
        throw error
    }
}
function insertOssInsightButton(owner, repo, usePageHeadActions) {
    if (document.getElementById('github-ossinsight')) return
    const svgStr = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><svg width="16px" height="15px" viewBox="0 0 128 80" xmlns="http://www.w3.org/2000/svg" version="1.1"><defs><linearGradient id="linearGradient3764" x1="1" x2="47" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0,-1,1,0,-1.5e-6,47.999998)"><stop stop-color="#8358b4" offset="0"/><stop stop-color="#8d65ba" offset="1"/></linearGradient></defs><path style="fill:#2a7fff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 124.3786,58.780229 c -1.27749,-1.795307 -2.68782,-3.48499 -4.11179,-5.150822 C 112.62916,44.68703 103.86053,36.715539 94.250452,30.927693 88.115128,27.228104 81.543761,24.247314 74.74074,22.809725 71.279616,22.090933 67.893432,21.719607 64.319891,21.705982 c -3.461128,0 -6.918848,0.384951 -10.37997,1.103743 -6.813243,1.437589 -13.360765,4.418379 -19.496087,8.117968 -9.606671,5.787846 -18.388938,13.762746 -26.0538323,22.701714 -1.4103405,1.662427 -2.7934283,3.352111 -4.0709103,5.150822 -1.7441892,2.394851 -1.7441892,5.21552 0,7.61037 3.9005794,5.467639 8.5574296,10.322066 13.2687846,14.784739 10.192606,9.569192 21.863688,17.578152 34.73049,20.811052 3.978932,0.99813 7.971493,1.47846 11.977677,1.47846 4.057286,0 8.022589,-0.48033 12.001521,-1.47846 12.866803,-3.2329 24.551506,-11.24526 34.757746,-20.811052 4.73861,-4.445654 9.38182,-9.313696 13.29263,-14.784739 1.71694,-2.39485 1.71694,-5.215519 0,-7.61037 m 0,0"/><path style="fill:#f9f9f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 95.010128,62.585414 c 0,16.927497 -13.728682,30.659556 -30.65958,30.659556 -16.927494,0 -30.659579,-13.728655 -30.659579,-30.659556 0,-16.927494 13.728682,-30.659582 30.659579,-30.659582 16.927497,0 30.65958,13.728679 30.65958,30.659582 m 0,0"/><path style="fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 81.383648,62.585414 c 0,9.395467 -7.624015,17.019479 -17.0331,17.019479 -9.409084,0 -17.033099,-7.624012 -17.033099,-17.019479 0,-9.409081 7.624015,-17.033104 17.033099,-17.033104 9.409085,0 17.0331,7.624023 17.0331,17.033104 m 0,0"/><path style="fill:#f9f9f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 65.581158,61.555935 a 5.1774597,4.889823 0 1 1 -10.35492,0 5.1774597,4.889823 0 1 1 10.35492,0 z" transform="translate(12.066285,-6.7626366)"/></svg>
`
    const targetUrl = `https://ossinsight.io/analyze/${owner}/${repo}`
    const title = `${repo}  ${translate.ossinsight}`
    const el = usePageHeadActions
        ? document.querySelector('.pagehead-actions')
        : document.querySelector('#responsive-meta-container .d-flex.gap-2.mt-n3.mb-3.flex-wrap')
    if (!el) {
        console.log('github-ossinsight: 没有找到目标元素, 无法添加按钮')
        return
    }
    const buttonHtml = `<a id="github-ossinsight" href="${targetUrl}" target="_blank" rel="noopener noreferrer" aria-label="${title}" class="btn btn-sm tooltipped tooltipped-s">${svgStr}</a>`
    if (usePageHeadActions) {
        el.insertAdjacentHTML('afterbegin', `<li>${buttonHtml}</li>`)
    } else {
        el.insertAdjacentHTML('afterbegin', buttonHtml)
    }
}
function insertActiveForks(owner, repo, usePageHeadActions) {
    if (document.getElementById('github-active-forks')) return
    const svgStr = `<svg class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M1.5 1.75a.75.75 0 00-1.5 0v12.5c0 .414.336.75.75.75h14.5a.75.75 0 000-1.5H1.5V1.75zm14.28 2.53a.75.75 0 00-1.06-1.06L10 7.94 7.53 5.47a.75.75 0 00-1.06 0L3.22 8.72a.75.75 0 001.06 1.06L7 7.06l2.47 2.47a.75.75 0 001.06 0l5.25-5.25z"></path></svg>`
    const targetUrl = `https://ossinsight.io/analyze/${owner}/${repo}`
    const title = `${repo}  ${translate.activeforks}`
    const el = usePageHeadActions
        ? document.querySelector('.pagehead-actions')
        : document.querySelector('#responsive-meta-container .d-flex.gap-2.mt-n3.mb-3.flex-wrap')
    if (!el) {
        console.log('github-Active Forks: 没有找到目标元素, 无法添加按钮')
        return
    }
    const buttonHtml = `<details class="details-reset details-overlay f5 position-relative "><summary id="active-forks-button-repo" class="btn btn-sm tooltipped tooltipped-s" aria-label="${title}"><a id="github-active-forks" href="https://techgaun.github.io/active-forks/index.html#${owner}/${repo}" target="_blank" > ${svgStr}  ${usePageHeadActions ? translate.activeforks_ : ""}</a></details>`
    if (usePageHeadActions) {
        el.insertAdjacentHTML('afterbegin', `<li>${buttonHtml}</li>`)
    } else {
        el.insertAdjacentHTML('afterbegin', buttonHtml)
    }
}

function insertDelBtn(owner, repo, usePageHeadActions, cusClass = 'dialog-show-repo-delete-home', element) {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
  <path d="M2 4h12v2H2V4zm1.33 3h9.34v10a1 1 0 0 1-1 1H4.33a1 1 0 0 1-1-1V7zm1-4h6.34v1H4.33V3zM6 8h1v6H6V8zm3 0h1v6H9V8z"/>
</svg>`
    const targetUrl = `https://ossinsight.io/analyze/${owner}/${repo}`
    const title = `[${repo}]\n  ${translate.deleteRepo}`
    if (element) {
        var el = element
    } else {
        var el = usePageHeadActions
            ? document.querySelector('.pagehead-actions')
            : document.querySelector('#responsive-meta-container .d-flex.gap-2.mt-n3.mb-3.flex-wrap')
    }
    if (!el) {
        console.log('github-Active Forks: 没有找到目标元素, 无法添加按钮')
        return
    }
    if (el.querySelector(`#${cusClass}`)) return
    const buttonHtml = `<button id="${cusClass}" data-show-dialog-id="repo-delete-menu-dialog" type="button"
  data-view-component="true"
  class="js-repo-delete-button Button--danger Button--medium Button float-none float-sm-right ">
  <span class="Button-content">
    <span class="Button-label tooltipped tooltipped-s"  aria-label="${title}">${svgStr}${usePageHeadActions ? translate.deleteRepo_btn : ""}</span>
  </span>
</button>`
    if (usePageHeadActions) {
        el.insertAdjacentHTML('beforeend', `<li>${buttonHtml}</li>`)
    } else {
        el.insertAdjacentHTML('beforeend', buttonHtml)
    }
    el.querySelector(`#${cusClass}`).addEventListener('click', function () {
        showDeleteConfirmations(owner, repo)
    })
}
function showDeleteConfirmations(owner, repo, count = 3) {
    const blacklist = ["ChinaGodMan/disk", "ChinaGodMan/LocalDev", "ChinaGodMan/Ebackup", "ChinaGodMan/portable-device", "ChinaGodMan/UserScripts"]
    const repoIdentifier = `${owner}/${repo}`
    if (blacklist.includes(repoIdentifier)) {
        alert(`[${repoIdentifier}] 在黑名单中`)
        return
    }
    for (let i = 0; i < count; i++) {
        let confirmed = confirm(`${owner}:\n${translate.deleteRepo_i}[${repo}]\n${translate.deleteRepo}\n${translate.deleteRepo_ask}  ${i + 1}/${count})`)
        if (!confirmed) return
    }
    deleteRepository(owner, repo)
}
function deleteRepository(owner, repo) {
    fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
        .then(response => {
            if (response.status === 204) {
                alert(`"${repo}" ${translate.deleteRepo_pass}`)
                location.reload()
            } else {
                alert(`"[${repo}]"\n${translate.deleteRepo_failed} ${translate.deleteRepo_failed_status}${response.status}`)
            }
        })
        .catch(error => {
            alert(`An error occurred: ${error}`)
        })
}
//LINK - 帮助小子程序
function getHumanReadableSize(sizeInKB) {
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const size = sizeInKB * 1024
    let i = parseInt(Math.floor(Math.log(size) / Math.log(1024)))
    const humanReadableSize = (size / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
    return humanReadableSize
}
function systemTime(isoString) {
    const date = new Date(isoString)
    return date.toLocaleString()
}
function timeToSeconds(timeStr) {
    let hours = 0, minutes = 0, seconds = 0
    const hoursMatch = timeStr.match(/(\d+)h/)
    const minutesMatch = timeStr.match(/(\d+)m/)
    const secondsMatch = timeStr.match(/(\d+)s/)
    if (hoursMatch) {
        hours = parseInt(hoursMatch[1], 10)
    }
    if (minutesMatch) {
        minutes = parseInt(minutesMatch[1], 10)
    }
    if (secondsMatch) {
        seconds = parseInt(secondsMatch[1], 10)
    }
    let totalSeconds = (hours * 3600) + (minutes * 60) + seconds
    return totalSeconds
}
function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

    // 从URL中提取仓库信息
    function getRepoFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const repoQuery = urlParams.get('query');

        if (!repoQuery) return null;

        // 匹配 repo:owner/repo 格式
        const repoMatch = repoQuery.match(/repo:([^/]+)\/([^/\s]+)/);
        if (repoMatch) {
            return {
                owner: repoMatch[1],
                repo: repoMatch[2]
            };
        }
        return null;
    }

    // 创建显示项目信息的DOM元素
    function createInfoElement() {
        const infoDiv = document.createElement('div');
        infoDiv.id = 'github-project-info';
        infoDiv.style.padding = '15px';
        infoDiv.style.margin = '10px 0';
        infoDiv.style.backgroundColor = '#f6f8fa';
        infoDiv.style.border = '1px solid #e1e4e8';
        infoDiv.style.borderRadius = '6px';
        return infoDiv;
    }

    // 获取项目信息
    function fetchProjectInfo(owner, repo) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://api.github.com/repos/${owner}/${repo}`,
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    updateProjectInfo(data);
                } catch (e) {
                    console.error('解析项目信息失败:', e);
                }
            },
            onerror: function(response) {
                console.error('获取项目信息失败:', response);
            }
        });
    }

    // 更新项目信息显示
    function updateProjectInfo(data) {
        let infoDiv = document.getElementById('github-project-info');
        if (!infoDiv) {
            infoDiv = createInfoElement();
            const notificationsList = document.querySelector('.notifications-list');
            if (notificationsList) {
                notificationsList.parentNode.insertBefore(infoDiv, notificationsList);
            }
        }

        // 构建显示内容
        // const content = `
        //     <h3 style="margin-top: 0;">📊 ${data.full_name}</h3>
        //     <p><strong>描述:</strong> ${data.description || '暂无描述'}</p>
        //     <p>
        //         <strong>统计:</strong>
        //         ⭐ ${data.stargazers_count.toLocaleString()} stars |
        //         🍴 ${data.forks_count.toLocaleString()} forks |
        //         👀 ${data.watchers_count.toLocaleString()} watchers
        //     </p>
        //     <p><strong>主要语言:</strong> ${data.language || '未指定'}</p>
        //     <p><strong>最近更新:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
        //     <p><strong>开源协议:</strong> ${data.license ? data.license.name : '未指定'}</p>
        //     ${data.homepage ? `<p><strong>主页:</strong> <a href="${data.homepage}" target="_blank">${data.homepage}</a></p>` : ''}
        // `;
        // 使用 Grid 布局的新内容结构
        //     <h3 style="margin-top: 0; grid-column: 1 / -1; margin-bottom: 15px;">📊 ${data.full_name}</h3>
        const content = `
        <h3 style="margin-top: 0; grid-column: 1 / -1; margin-bottom: 15px;">📊
    <a href="https://github.com/${data.full_name}" target="_blank">${data.full_name}</a>
</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="info-column" style="border-right: 1px solid #e1e4e8; padding-right: 16px;">
                    <p style="margin-top: 0;"><strong>描述:</strong> ${data.description || '暂无描述'}</p>
                    <p><strong>统计:</strong>
                        <div style="margin-left: 20px;">
                            ⭐ ${data.stargazers_count.toLocaleString()} stars<br>
                            🍴 ${data.forks_count.toLocaleString()} forks<br>
                            👀 ${data.watchers_count.toLocaleString()} watchers
                        </div>
                    </p>
                </div>
                <div class="info-column" style="padding-left: 16px;">
                    <p style="margin-top: 0;"><strong>主要语言:</strong> ${data.language || '未指定'}</p>
                    <p><strong>最近更新:</strong> ${new Date(data.updated_at).toLocaleString()}</p>
                    <p><strong>开源协议:</strong> ${data.license ? data.license.name : '未指定'}</p>
                    ${data.homepage ? `<p><strong>主页:</strong> <a href="${data.homepage}" target="_blank">${data.homepage}</a></p>` : ''}
                </div>
            </div>
        `;

        infoDiv.innerHTML = content;

        // 添加响应式样式
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                #github-project-info > div {
                    grid-template-columns: 1fr !important;
                }
                #github-project-info .info-column {
                    border-right: none !important;
                    padding: 0 !important;
                }
                #github-project-info .info-column:first-child {
                    border-bottom: 1px solid #e1e4e8;
                    padding-bottom: 16px !important;
                }
                #github-project-info .info-column:last-child {
                    padding-top: 16px !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // URL变化监听函数
    function handleUrlChange() {
        const repoInfo = getRepoFromUrl();
        if (repoInfo) {
            fetchProjectInfo(repoInfo.owner, repoInfo.repo);
        } else {
            // 如果没有找到仓库信息，移除已有的信息显示
            const infoDiv = document.getElementById('github-project-info');
            if (infoDiv) {
                infoDiv.remove();
            }
        }
    }

    // 监听 URL 变化
    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            handleUrlChange();
        }
    }).observe(document, {subtree: true, childList: true});

    // 初始加载
    handleUrlChange();

