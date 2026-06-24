### 小红书 。
  支持 pc网页版打开，新建、编辑笔记时候，直接粘贴图片（识别剪贴板），不用上传文件
### 公众号图文
  新建、编辑笔记时候，直接粘贴图片（识别剪贴板），不用上传文件
  
### github-notifications
github 通知页面，支持显示项目简介，开发语言。点击跳转等。
有时候关注的杂七杂八项目有点多。忘了这个项目干什么的了。
<img width="1766" height="430" alt="image" src="https://github.com/user-attachments/assets/cde25926-231c-4c68-9da6-f032ad0f440f" />


### 重建git历史
尤其git历史项目过多的，精简只保留最近n条
偶尔几条commit包含了不能提交的信息，公司名/密钥等.可用来重建

```
bash rebuild-git-short-history.sh \
  -n 30 \
  -e HEAD \
  -b github-main \
  --squash A..B \
  --squash-msg "合并 A/B，移除敏感信息" \
  --squash C..D \
  --squash-msg "整理 C/D 提交"
```


### 废弃  github_enhance.js 


<img width="1114" alt="image" src="https://github.com/user-attachments/assets/c6f57413-b3e7-4fd7-be87-e4874b920415">
