import { React, useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Node, Extension, Mark } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";

import History from "@tiptap/extension-history";
import Code from "@tiptap/extension-code";

const API_BASE = import.meta.env.VITE_API_URL;

const PasteSplitParagraph = Extension.create({
  name: "pasteSplitParagraph",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData("text/plain");

            if (text) {
              const paragraphs = text.split(/n{1,2}/g);
              const nodes = paragraphs.map((p) =>
                view.state.schema.nodes.paragraph.create(
                  {},
                  view.state.schema.text(p)
                )
              );

              const fragment = view.state.schema.nodes.doc.create({}, nodes);
              const tr = view.state.tr.replaceSelectionWith(fragment);
              view.dispatch(tr);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      width: { default: "560" },
      height: { default: "315" },
      frameborder: { default: "0" },
      allow: {
        default:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
      },
      allowfullscreen: { default: true },
    };
  },
  parseHTML() {
    return [{ tag: "iframe[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["iframe", HTMLAttributes];
  },
});

export default function RenderNote({ title, setTitle, content, setContent }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    // const selectedText = editor.state.doc.textBetween(
    //   editor.state.selection.from,
    //   editor.state.selection.to,
    //   " "
    // );

    // const fullQuestion =
    //   question.trim() || `Explain this: ${selectedText || "the topic"}`;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });

      const data = await res.json();
      if (data.answer) {
        // insert AI answer right below the selection
        editor.chain().focus().insertContent(`<p>${data.answer}</p>`).run();
      }
    } catch (err) {
      console.error("AI error:", err);
    } finally {
      setQuestion("");
      setLoading(false);
    }
  };

  const editorTitle = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // disable the built-in one
      }),
      Underline,
      Highlight,
    ],
    content: title,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setTitle(html);
    },
  });

  const editorContent = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // disable the built-in one
      }),
      Underline,
      Highlight,
      PasteSplitParagraph,
      Table.configure({
        resizable: true, // optional: allows column resizing
      }),
      TableRow,
      TableCell,
      TableHeader, // <-- this enables <th>
      Link.configure({
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank", // open in new tab
        },
        autolink: true, // automatically create links from URLs
        linkOnPaste: true, // automatically convert URLs pasted
      }),
      Image.configure({
        inline: false, // block-level image
        HTMLAttributes: {
          class: "editor-image",
          style: "max-width: 100%; height: auto;",
        },
      }),
      Video,
    ],
    shouldRerenderOnTransaction: true,
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  return (
    <div style={{ padding: "1rem" }}>
      {/* Toolbar */}
      <div
        style={{ marginBottom: "0.5rem" }}
        className="note-open-content-buttons"
      >
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleUnderline().run();
            editorContent.chain().focus().toggleUnderline().run();
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
        {/* Marks */}
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleBold().run();
            editorContent.chain().focus().toggleBold().run();
          }}
        >
          Bold
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleItalic().run();
            editorContent.chain().focus().toggleItalic().run();
          }}
        >
          Italic
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleStrike().run();
            editorContent.chain().focus().toggleStrike().run();
          }}
        >
          Strike
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().toggleCode().run();
            editorContent
              .chain()
              .focus()
              .toggleCode("code", { color: "lightblue" })
              .run();
          }}
        >
          Code
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().unsetAllMarks().run();
            editorContent.chain().focus().unsetAllMarks().run();
          }}
        >
          Clear Marks
        </button>

        {/* Nodes */}
        <button
          onClick={() => {
            editorTitle.chain().focus().setParagraph().run();
            editorContent.chain().focus().setParagraph().run();
          }}
        >
          Paragraph
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 1 })
              .run();
          }}
        >
          H1
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 2 })
              .run();
          }}
        >
          H2
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 3 })
              .run();
          }}
        >
          H3
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 4 })
              .run();
          }}
        >
          H4
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 5 })
              .run();
          }}
        >
          H5
        </button>
        <button
          onClick={() => {
            editorContent
              .chain()
              .focus()
              .setNode("heading", { level: 6 })
              .run();
          }}
        >
          H6
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().toggleBulletList().run();
          }}
        >
          Bullet List
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().toggleOrderedList().run();
          }}
        >
          Ordered List
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().toggleCodeBlock().run();
          }}
        >
          Code Block
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().toggleBlockquote().run();
          }}
        >
          Blockquote
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().setHorizontalRule().run();
          }}
        >
          Horizontal Rule
        </button>
        <button
          onClick={() => {
            editorContent.chain().focus().setHardBreak().run();
          }}
        >
          Hard Break
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().clearNodes().run();
            editorContent.chain().focus().clearNodes().run();
          }}
        >
          Clear Nodes
        </button>
        {/* Links */}
        <>
          <button
            onClick={() => {
              const url = prompt("Enter the URL");
              if (url) {
                editorContent.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            Link
          </button>
          <button
            onClick={() => {
              editorContent.chain().focus().unsetLink().run();
            }}
          >
            Remove Link
          </button>

          <button
            onClick={() => {
              const url = prompt("Enter image URL");
              if (url) {
                editorContent.chain().focus().setImage({ src: url }).run();
              }
            }}
          >
            Image
          </button>

          <button
            onClick={() => {
              // check if 'video' node exists in schema
              if (!editorContent.schema.nodes.video) {
                alert("Video node is not registered in the editor!");
                return;
              }

              const url = prompt("Enter YouTube or video URL");
              if (url) {
                editorContent
                  .chain()
                  .focus()
                  .setNode("video", { src: url })
                  .run();
              }
            }}
          >
            Video
          </button>
        </>

        {/* History */}
        <button
          onClick={() => {
            editorTitle.chain().focus().undo().run();
            editorContent.chain().focus().undo().run();
          }}
        >
          Undo
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().redo().run();
            editorContent.chain().focus().redo().run();
          }}
        >
          Redo
        </button>
        <button
          onClick={askAI}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>

      <BubbleMenu
        editor={editorContent}
        options={{ placement: "top", offset: 6 }}
      >
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.25rem" }}>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI();
            }}
          >
            Ask AI
          </button>
        </div>
      </BubbleMenu>

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
