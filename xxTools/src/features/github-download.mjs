import { parseRepository } from "../tools/github-download/engine.mjs";
export function registerGitHubDownload(api) {
  const active = new Set();
  api.runtime.onMessage.addListener((message, sender, respond) => {
    if (message?.type !== "toolbox.github.create-job") return;
    if (sender.id !== api.runtime.id || sender.frameId !== 0 || !sender.tab?.id)
      return;
    try {
      const source = parseRepository(sender.url);
      const page = parseRepository(message.pageUrl);
      if (
        source.owner !== page.owner ||
        source.repo !== page.repo ||
        new URL(sender.url).pathname !== new URL(message.pageUrl).pathname
      )
        throw new Error("页面已改变，请刷新后重选。");
      if (
        !Array.isArray(message.items) ||
        !message.items.length ||
        message.items.length > 1000
      )
        throw new Error("请选择 1–1000 个文件或目录。");
      for (const item of message.items) {
        if (
          !["tree", "blob"].includes(item.type) ||
          typeof item.url !== "string" ||
          item.url.length > 4096
        )
          throw new Error("选择项格式无效。");
        const repo = parseRepository(item.url);
        if (
          repo.owner !== source.owner ||
          repo.repo !== source.repo ||
          !new URL(item.url).pathname.startsWith(
            `/${source.owner}/${source.repo}/${item.type}/`,
          )
        )
          throw new Error("选择项不属于当前仓库。");
      }
    } catch (error) {
      respond({ ok: false, error: error.message });
      return;
    }
    if (active.has(sender.tab.id)) {
      respond({ ok: false, error: "任务正在创建，请稍后。" });
      return;
    }
    active.add(sender.tab.id);
    (async () => {
      const id = crypto.randomUUID();
      const key = "github.job." + id;
      // 定时清理仅清任务数据，不访问或导航其他标签。
      const stored = await api.storage.session.get(null);
      const expired = Object.entries(stored)
        .filter(
          ([k, v]) =>
            k.startsWith("github.job.") &&
            Date.now() - (v?.createdAt || 0) > 86400000,
        )
        .map(([k]) => k);
      if (expired.length) await api.storage.session.remove(expired);
      await api.storage.session.set({
        [key]: {
          pageUrl: message.pageUrl,
          items: message.items.map((item) => ({
            url: item.url,
            type: item.type,
          })),
          createdAt: Date.now(),
        },
      });
      try {
        await api.tabs.create({
          url: api.runtime.getURL("github-download.html") + "?job=" + id,
        });
      } catch (error) {
        await api.storage.session.remove(key);
        throw error;
      }
      respond({ ok: true });
    })()
      .catch(() =>
        respond({ ok: false, error: "创建下载任务失败，请刷新扩展后重试。" }),
      )
      .finally(() => active.delete(sender.tab.id));
    return true;
  });
}
