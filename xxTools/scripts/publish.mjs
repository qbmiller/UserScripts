#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';

export function repositoryFromRemote(remote) {
  const match = remote.trim().match(/^(?:git@github\.com:|https:\/\/github\.com\/|ssh:\/\/git@github\.com\/)([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/);
  if (!match) throw new Error('origin 必须是 github.com 的 Git 仓库地址。');
  return `${match[1]}/${match[2]}`;
}
export function validateTag(tag) {
  if (!tag || tag.startsWith('-') || /[\s\x00-\x1f]/.test(tag)) throw new Error('tag 不能为空、包含空白或以减号开头。');
  return tag;
}
export function releaseArguments(repo, tag, title, sha, asset, notes) {
  return ['release', 'create', tag, asset, '--repo', repo, '--target', sha, '--title', title, '--notes-file', notes, '--draft'];
}

export async function main() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const run = (command, args, capture = false) => execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  const repo = repositoryFromRemote(run('git', ['remote', 'get-url', 'origin'], true));
  const sha = run('git', ['rev-parse', 'HEAD'], true).trim();
  const dryRun = process.env.DRY_RUN === '1';
  const input = createInterface({ input: process.stdin, output: process.stdout });
  let tag, title;
  try {
    const defaultTag = `xxTools-v${pkg.version}`;
    tag = validateTag(process.env.TAG || (await input.question(`Release tag [${defaultTag}]: `)).trim() || defaultTag);
    run('git', ['check-ref-format', `refs/tags/${tag}`], true);
    const defaultTitle = `xxTools ${pkg.version}`;
    title = process.env.TITLE || (await input.question(`Release title [${defaultTitle}]: `)).trim() || defaultTitle;
    if (/\x00/.test(title)) throw new Error('title 不能包含 NUL 字符。');
  } finally { input.close(); }

  console.log(`\n仓库：${repo}\ntag：${tag}\ntitle：${title}\n扩展版本：${pkg.version}\nRelease 指向：${sha}`);
  const dirty = run('git', ['status', '--porcelain', '--', '.'], true).trim();
  if (dirty) console.log('当前 xxTools 有未提交修改：ZIP 使用当前工作区内容，Release tag 指向上面的 HEAD。');
  if (!dryRun) {
    run('gh', ['auth', 'status', '--hostname', 'github.com'], true);
    // 用列表结果明确判断重复，网络/权限失败直接终止，不能误当作 Release 不存在。
    const existing = JSON.parse(run('gh', ['api', '--paginate', '--slurp', `repos/${repo}/releases?per_page=100`], true));
    if (existing.flat().some(release => release.tag_name === tag)) throw new Error(`Release ${tag} 已存在，不会覆盖，请换一个 tag。`);
    // 发布前确认目标提交已在远端，避免创建失败或引用不存在的本地提交。
    run('gh', ['api', `repos/${repo}/commits/${sha}`, '--silent'], true);
  }
  run('npm', ['test']);
  run('npm', ['run', 'typecheck']);
  run('npm', ['run', 'zip']);
  const output = path.join(root, '.output');
  const version = JSON.parse(readFileSync(path.join(output, 'chrome-mv3/manifest.json'), 'utf8')).version;
  if (version !== pkg.version) throw new Error('构建产物与 package.json 版本不一致。');
  const staging = path.join(output, 'release'); mkdirSync(staging, { recursive: true });
  const asset = path.join(staging, `xxTools-${version}-chrome.zip`);
  copyFileSync(path.join(output, `${pkg.name}-${version}-chrome.zip`), asset);
  const notes = path.join(staging, 'release-notes.md');
  writeFileSync(notes, process.env.NOTES || `下载并解压 xxTools-${version}-chrome.zip，在 Chrome 扩展管理页开启开发者模式，加载解压后的目录。\n\n更新后请重新加载扩展，并刷新已有 GitHub 页面。\n\n扩展版本：${version}\n构建提交：${sha}${dirty ? '\n构建包含当前工作区未提交修改。' : ''}\n`);
  const args = releaseArguments(repo, tag, title, sha, asset, notes);
  console.log(`\n压缩包：${asset}`);
  if (dryRun) { console.log('DRY_RUN：验证与打包完成，不创建 tag 或 Release。'); return; }
  // 先上传到草稿，完整上传后才公开。失败保留草稿供检查，绝不覆盖已有资产。
  run('gh', args);
  try { run('gh', ['release', 'edit', tag, '--repo', repo, '--draft=false']); }
  catch { throw new Error(`资产已上传，但公开失败。请检查 ${repo} 的 ${tag} 草稿 Release 后重试公开。`); }
  run('gh', ['release', 'view', tag, '--repo', repo, '--json', 'url', '--jq', '.url']);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(`发布失败：${error.message}`); process.exitCode = 1; });
}
