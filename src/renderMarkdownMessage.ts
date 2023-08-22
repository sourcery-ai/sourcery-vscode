import { marked } from "marked";

import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);
export function renderMarkdownMessage(message: string) {
  // Send the whole message we've been streamed so far to the webview,
  // after converting from markdown to html

  const rendered = marked(message, {
    gfm: true,
    breaks: true,
    mangle: false,
    headerIds: false,
  });

  // Allow any classes on span and code blocks or highlightjs classes get removed
  return sanitizeHtml(rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "details",
      "summary",
    ]),
    allowedClasses: { span: false, code: false },
    allowedSchemes: sanitizeHtml.defaults.allowedSchemes.concat(["file"]),
  });
}
