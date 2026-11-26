// 知乎原生目录（含收起状态）及其章节项；不按“目录”文字或标题锚点猜测。
export function hasNativeZhihuToc(root = document) {
  return [
    ...root.querySelectorAll(
      ".Catalog, .Catalog-content, [data-catalog-target-id]",
    ),
  ].some((element) => !element.closest("#zhihu-left-toc-panel"));
}
