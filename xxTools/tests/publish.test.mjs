import {test} from 'node:test';
import assert from 'node:assert/strict';
import {repositoryFromRemote,validateTag,releaseArguments} from '../scripts/publish.mjs';
test('发布目标取当前 Git origin，支持 SSH 和 HTTPS',()=>{
  for(const url of ['git@github.com:qbmiller/UserScripts.git','https://github.com/qbmiller/UserScripts.git','ssh://git@github.com/qbmiller/UserScripts.git']) assert.equal(repositoryFromRemote(url),'qbmiller/UserScripts');
  assert.throws(()=>repositoryFromRemote('https://evil.com/a/b.git'));
});
test('tag 校验，title 原样作为参数传入，无 shell 展开',()=>{
  for(const tag of ['', '-x', 'a b','a\nb'])assert.throws(()=>validateTag(tag));
  const title='xxTools 中文 $(touch /tmp/should-not-exist) `literal`';
  const args=releaseArguments('qbmiller/UserScripts','xxTools-v2.1.0',title,'sha','/tmp/path with spaces.zip','/tmp/notes.md');
  assert.equal(args[args.indexOf('--title')+1],title);
  assert.ok(args.includes('/tmp/path with spaces.zip'));
  assert.ok(args.includes('--draft'));
});
