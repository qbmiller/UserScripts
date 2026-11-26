export const GITHUB_SELECTION_KEY = "githubSelection";

export function normalizeGitHubSelectionSettings(value) {
  return { enabled: typeof value?.enabled === "boolean" ? value.enabled : true };
}
