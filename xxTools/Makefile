.PHONY: help build test publish

help:
	@echo "make build    构建 Chrome 扩展 ZIP"
	@echo "              解压目录：xxTools/.output/chrome-mv3（重新加载此目录即可）"
	@echo "              首次手动重载后，后续构建成功约一分钟内自动重载"
	@echo "make test     测试与类型检查"
	@echo "make publish  输入 tag、title，构建并发布 GitHub Release"
	@echo "make publish DRY_RUN=1  构建并预览，不创建 Release"

build:
	node scripts/build-local.mjs

test:
	npm test
	npm run typecheck

publish:
	node scripts/publish.mjs
