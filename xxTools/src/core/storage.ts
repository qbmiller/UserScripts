import { reactive } from "vue";
import {
  normalizePreferences,
  PREFERENCES_KEY,
  applyPreferenceChange,
} from "./preferences.mjs";
import { createPreferenceClient } from "./preference-client.mjs";

export const preferences = reactive(normalizePreferences(null));
export const storageStatus = reactive({ ready: false, error: "" });
const hasChromeStorage =
  typeof chrome !== "undefined" && !!chrome.storage?.local;
async function read() {
  return hasChromeStorage
    ? (await chrome.storage.local.get(PREFERENCES_KEY))[PREFERENCES_KEY]
    : JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "null");
}
const client = createPreferenceClient(
  preferences,
  {
    read,
    async commit(change: object) {
      if (hasChromeStorage) {
        const result = await chrome.runtime.sendMessage({
          type: "toolbox.preferences.update",
          change,
        });
        if (!result?.ok) throw new Error("保存失败");
      } else
        localStorage.setItem(
          PREFERENCES_KEY,
          JSON.stringify(applyPreferenceChange(await read(), change)),
        );
    },
    subscribe(listener: (value: unknown) => void) {
      if (hasChromeStorage)
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local" && changes[PREFERENCES_KEY])
            listener(changes[PREFERENCES_KEY].newValue);
        });
    },
  },
  (message: string) => {
    storageStatus.error = message;
  },
);

export async function loadPreferences() {
  try {
    await client.refresh();
  } catch {
    storageStatus.error = "设置读取失败，暂时使用默认值。";
  } finally {
    storageStatus.ready = true;
  }
}
export const recordUse = (id: string) => {
  void client.change({ type: "recent", id });
};
export const toggleFavorite = (id: string) => {
  void client.change({ type: "favorite", id });
};
export const setAutoRestore = (value: boolean) => {
  void client.change({ type: "autoRestore", value });
};
export const clearRecent = () => {
  void client.change({ type: "clearRecent" });
};
