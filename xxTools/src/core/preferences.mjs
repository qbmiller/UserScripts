export const PREFERENCES_KEY = "toolbox.preferences";
const strings = (value) =>
  Array.isArray(value)
    ? [...new Set(value.filter((item) => typeof item === "string"))]
    : [];
export function normalizePreferences(value) {
  const data = value && typeof value === "object" ? value : {};
  return {
    version: 1,
    autoRestore:
      typeof data.autoRestore === "boolean" ? data.autoRestore : true,
    favorites: strings(data.favorites),
    recent: strings(data.recent).slice(0, 6),
  };
}
export function updateRecent(recent, id) {
  return [id, ...recent.filter((item) => item !== id)].slice(0, 6);
}
export function isPreferenceChange(change) {
  return (
    change &&
    ((change.type === "autoRestore" && typeof change.value === "boolean") ||
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
  if (change.type === "favorite")
    next.favorites = next.favorites.includes(change.id)
      ? next.favorites.filter((id) => id !== change.id)
      : [...next.favorites, change.id];
  if (change.type === "recent")
    next.recent = updateRecent(next.recent, change.id);
  if (change.type === "clearRecent") next.recent = [];
  return next;
}
