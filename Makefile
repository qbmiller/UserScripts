.PHONY: help build test publish

help:
	@$(MAKE) -C xxTools help

build:
	$(MAKE) -C xxTools build

test:
	$(MAKE) -C xxTools test

publish:
	$(MAKE) -C xxTools publish
