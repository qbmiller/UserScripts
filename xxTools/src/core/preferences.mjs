export const PREFERENCES_KEY = "toolbox.preferences";
const currentToolId = (id) => (id === "url-codec" ? "base64" : id);
const toolIds = (value) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter((item) => typeof item === "string").map(currentToolId),
        ),
      ]
    : [];
export function normalizePreferences(value) {
  const data = value && typeof value === "object" ? value : {};
  return {
    version: 1,
    autoRestore:
      typeof data.autoRestore === "boolean" ? data.autoRestore : true,
    skipBookmarkDeleteConfirm: data.skipBookmarkDeleteConfirm === true,
    favorites: toolIds(data.favorites),
    recent: toolIds(data.recent).slice(0, 6),
  };
}
export function updateRecent(recent, id) {
  return [id, ...recent.filter((item) => item !== id)].slice(0, 6);
}
export function isPreferenceChange(change) {
  return (
    change &&
    ((["autoRestore", "skipBookmarkDeleteConfirm"].includes(change.type) &&
      typeof change.value === "boolean") ||
      (["favorite", "recent"].includes(change.type) &&
        typeof change.id === "string" &&
        /^[a-z][a-z0-9-]{0,63}$/.test(change.id)) ||
      change.type === "clearRecent")
  );
}
export function applyPreferenceChange(value, change) {
  if (!isPreferenceChange(change)) throw new Error("无效的设置操作。");
  const next = normalizePreferences(value);
  if (change.type === "autoRestore") next.autoRestore = change.value;
  if (change.type === "skipBookmarkDeleteConfirm")
    next.skipBookmarkDeleteConfirm = change.value;
  if (change.type === "favorite") {
    const id = currentToolId(change.id);
    next.favorites = next.favorites.includes(id)
      ? next.favorites.filter((item) => item !== id)
      : [...next.favorites, id];
  }
  if (change.type === "recent")
    next.recent = updateRecent(next.recent, currentToolId(change.id));
  if (change.type === "clearRecent") next.recent = [];
  return next;
}
