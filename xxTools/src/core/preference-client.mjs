import { applyPreferenceChange, normalizePreferences } from "./preferences.mjs";

export function createPreferenceClient(
  state,
  adapter,
  onError = (_message) => {},
) {
  let pending = 0;
  let revision = 0;
  let writes = Promise.resolve();
  adapter.subscribe((value) => {
    if (!pending) Object.assign(state, normalizePreferences(value));
  });
  async function refresh() {
    const current = revision;
    const value = await adapter.read();
    if (!pending && current === revision)
      Object.assign(state, normalizePreferences(value));
  }
  function change(operation) {
    Object.assign(state, applyPreferenceChange(state, operation));
    revision++;
    pending++;
    writes = writes
      .catch(() => {})
      .then(async () => {
        try {
          await adapter.commit(operation);
          onError("");
        } catch {
          onError("设置保存失败，请检查扩展存储是否可用。");
        } finally {
          pending--;
          if (!pending)
            await refresh().catch(() => onError("设置读取失败，请重试。"));
        }
      });
    return writes;
  }
  return { change, refresh };
}
