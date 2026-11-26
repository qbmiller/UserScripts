import { installGitHubSelection } from "../src/tools/github-download/selection.mjs";
export default defineContentScript({
  matches: ["https://github.com/*"],
  runAt: "document_idle",
  main(ctx) {
    const stop = installGitHubSelection({
      sendMessage: (message: object) => chrome.runtime.sendMessage(message),
    });
    ctx.onInvalidated(stop);
  },
});
