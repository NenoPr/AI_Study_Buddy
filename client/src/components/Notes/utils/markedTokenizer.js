// markedTokenizer.js
import { marked } from "marked";

const customTokenizer = {
  extensions: [
    {
      name: "highlight",
      level: "inline",
      start(src) { return src.indexOf("=="); },
      tokenizer(src) {
        const rule = /^==(.+?)==/;
        const match = rule.exec(src);
        if (match) {
          return { type: "highlight", raw: match[0], text: match[1] };
        }
      },
      renderer(token) { return `<mark>${token.text}</mark>`; },
    },
    {
      name: "underline",
      level: "inline",
      start(src) { return src.indexOf("++"); },
      tokenizer(src) {
        const rule = /^\+\+(.+?)\+\+/;
        const match = rule.exec(src);
        if (match) {
          return { type: "underline", raw: match[0], text: match[1] };
        }
      },
      renderer(token) { return `<u>${token.text}</u>`; },
    },
  ],
};

marked.use(customTokenizer);

export default marked;
