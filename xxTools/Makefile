.PHONY: help build test publish

help:
	@echo "make build    构建 Chrome 扩展 ZIP"
	@echo "make test     测试与类型检查"
	@echo "make publish  输入 tag、title，构建并发布 GitHub Release"
	@echo "make publish DRY_RUN=1  构建并预览，不创建 Release"

build:
	npm run zip

test:
	npm test
	npm run typecheck

publish:
	node scripts/publish.mjs
