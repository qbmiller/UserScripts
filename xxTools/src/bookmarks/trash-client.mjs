export async function trashRequest(action, details = {}) {
  const result = await chrome.runtime.sendMessage({
    ...details,
    type: "toolbox.bookmark-trash",
    action,
  });
  if (!result?.ok) throw new Error(result?.error || "回收站操作失败，请重试。");
  return result;
}
