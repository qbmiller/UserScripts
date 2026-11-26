import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { writeFileSync, renameSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const id = randomUUID();
const env = { ...process.env };
delete env.VITE_XXTOOLS_LOCAL_BUILD_ID;
// 分发 ZIP 保持普通构建；只有本机解压目录启用构建检测。
execFileSync("npm", ["run", "zip"], { cwd: root, env, stdio: "inherit" });
execFileSync("npm", ["run", "build"], {
  cwd: root,
  env: { ...env, VITE_XXTOOLS_LOCAL_BUILD_ID: id },
  stdio: "inherit",
});
const marker = new URL("../.output/chrome-mv3/__local_build.json", import.meta.url);
const temporary = new URL(`${marker.href}.tmp`);
writeFileSync(temporary, JSON.stringify({ id }));
renameSync(temporary, marker);
console.log("本地构建完成：已启用的本地扩展将在约一分钟内自动重载。");
console.log("首次使用请在 Chrome 扩展管理页手动重载一次；之后无需重复操作。ZIP 不含自动重载功能。");
