const alarmName = "xxtools-local-build-reload";

export function registerLocalBuildReload(api, buildId, fetcher = fetch) {
  let checking = false;
  async function check() {
    if (checking) return;
    checking = true;
    try {
      const response = await fetcher(api.runtime.getURL("__local_build.json"), { cache: "no-store" });
      if (!response.ok) return;
      const marker = await response.json();
      if (typeof marker.id === "string" && marker.id && marker.id !== buildId) {
        api.runtime.reload();
      }
    } catch {
      // 构建期间目录会被重建；缺失、不完整或失败的构建均不触发重载。
    } finally {
      checking = false;
    }
  }
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === alarmName) void check();
  });
  // Chrome 116 起均支持一分钟的后台闹钟，Service Worker 休眠后也能检查。
  void api.alarms.create(alarmName, { periodInMinutes: 1 });
  void check();
}
