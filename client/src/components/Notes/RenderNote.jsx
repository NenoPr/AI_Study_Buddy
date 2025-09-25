import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mark } from "@tiptap/core";
import { marked } from "marked";
import turndownService from "./utils/turndown";
import { Highlight, Underline } from "./utils/mark";

// Create a new tokenizer
const customTokenizer = {
  extensions: [
    {
      name: "highlight",
      level: "inline", // inline syntax
      start(src) {
        return src.indexOf("=="); // quick check for speed
      },
      tokenizer(src, tokens) {
        const rule = /^==(.+?)==/; // match highlight
        const match = rule.exec(src);
        if (match) {
          return {
            type: "highlight",
            raw: match[0],
            text: match[1],
          };
        }
      },
      renderer(token) {
        return `<mark>${token.text}</mark>`;
      },
    },
    {
      name: "underline",
      level: "inline",
      start(src) {
        return src.indexOf("++");
      },
      tokenizer(src, tokens) {
        const rule = /^\+\+(.+?)\+\+/;
        const match = rule.exec(src);
        if (match) {
          return {
            type: "underline",
            raw: match[0],
            text: match[1],
          };
        }
      },
      renderer(token) {
        return `<u>${token.text}</u>`;
      },
    },
  ],
};

// Register tokenizer with marked
marked.use(customTokenizer);

export default function RenderNote({ title, setTitle, content, setContent }) {
  const editorTitle = useEditor({
    extensions: [StarterKit, Highlight, Underline],
    content: marked(title), // Markdown → HTML
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = turndownService.turndown(html);
      setTitle(md);
    },
  });

  const editorContent = useEditor({
    extensions: [StarterKit, Highlight, Underline],
    content: marked(content), // Markdown → HTML
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const md = turndownService.turndown(html);
      setContent(md);
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      {/* Toolbar */}
      <div style={{ marginBottom: "0.5rem" }}>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleHighlight().run();
            editorContent.chain().focus().toggleHighlight().run();
          }}
        >
          Bold
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleHighlight().run();
            editorContent.chain().focus().toggleHighlight().run();
          }}
        >
          Italic
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleHighlight().run();
            editorContent.chain().focus().toggleHighlight().run();
          }}
        >
          Strike
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleHighlight().run();
            editorContent.chain().focus().toggleHighlight().run();
          }}
        >
          Underline
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleHighlight().run();
            editorContent.chain().focus().toggleHighlight().run();
          }}
        >
          Highlight
        </button>
        <button
          onClick={() => {
            // Get rendered HTML from TipTap
            const htmlT = editorTitle.getHTML();
            const htmlC = editorContent.getHTML();
            // Convert back to Markdown
            const mdT = serializeToMarkdown(htmlT);
            const mdC = serializeToMarkdown(htmlC);
            console.log("Markdown output:", mdT, mdC);
            alert(mdT, mdC);
          }}
        >
          Export Markdown
        </button>
      </div>

      {/* Editor */}
      <div className="note-open-title">
        <EditorContent editor={editorTitle} />
      </div>
      <div className="note-open-content">
        <EditorContent editor={editorContent} />
      </div>
    </div>
  );
}
