export const GITHUB_SELECTION_KEY = "githubSelection";

export function normalizeGitHubSelectionSettings(value) {
  return {
    enabled: value?.enabled !== false,
    onlyWhenSelected: value?.onlyWhenSelected !== false,
  };
}
