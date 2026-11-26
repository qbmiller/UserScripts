import { format } from "prettier/standalone";
import html from "prettier/plugins/html";
import postcss from "prettier/plugins/postcss";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "#html-minifier";
import { parse, generate } from "css-tree";
export async function transformCode(input, language, compact = false) {
  if (!input.trim()) return "";
  const parsers = { html: "html", css: "css", js: "babel" };
  if (!parsers[language]) throw new Error("不支持的代码类型。");
  // Validate before minifying as well, so malformed input never looks like success.
  const formatted = await format(input, {
    parser: parsers[language],
    plugins: [html, postcss, babel, estree],
    tabWidth: 2,
  });
  if (!compact) return formatted;
  if (language === "js") {
    const result = await minifyJs(input, {
      compress: false,
      mangle: false,
      format: { comments: /^!|@license|@preserve/ },
    });
    return result.code || "";
  }
  if (language === "css")
    return generate(
      parse(input, {
        onParseError(error) {
          throw error;
        },
      }),
    );
  return minifyHtml(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    removeComments: false,
    minifyCSS: false,
    minifyJS: false,
    removeAttributeQuotes: false,
  });
}
