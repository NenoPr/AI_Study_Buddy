import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import { Extension } from "@tiptap/core";
import { Plugin } from "prosemirror-state";
import { Mark } from "@tiptap/core";
import History from "@tiptap/extension-history";
import Code from "@tiptap/extension-code";

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

// function splitCodeByNewline(editor) {
//   const { state, view } = editor;
//   const { tr, selection } = state;
//   const { from, to } = selection;

//   // Get all nodes in selection
//   let nodes = [];
//   state.doc.nodesBetween(from, to, (node, pos) => {
//     if (node.type.name === "codeBlock") {
//       nodes.push({ node, pos });
//     }
//   });

//   nodes.forEach(({ node, pos }) => {
//     const lines = node.textContent.split("\n"); // split by newline
//     if (lines.length > 1) {
//       // Replace original code block with separate paragraphs
//       const frag = lines.map((line) =>
//         state.schema.nodes.paragraph.create({}, state.schema.text(line))
//       );
//       tr.replaceWith(pos, pos + node.nodeSize, frag);
//     }
//   });

//   editor.view.dispatch(tr);
// }

// function mergeListItemsToParagraph(editor) {
//   const { state, view } = editor;
//   const { tr, selection } = state;
//   const { $from, $to } = selection;

//   // Collect all selected list items
//   const items = [];
//   state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
//     if (node.type.name === 'listItem') {
//       items.push(node);
//     }
//   });

//   if (items.length > 0) {
//     // Merge all list items text into a single paragraph
//     const mergedText = items.map((item) => item.textContent).join('\n');
//     const paragraph = state.schema.nodes.paragraph.create(
//       {},
//       state.schema.text(mergedText)
//     );

//     // Replace the whole list selection with the single paragraph
//     tr.deleteRange($from.start(), $to.end());
//     tr.insert($from.start(), paragraph);
//     editor.view.dispatch(tr);
//   }
// }

export default function RenderNote({ title, setTitle, content, setContent }) {
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
    ],
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
        {/* <button
          onClick={() => {
            editorContent.chain().focus().toggleBlockquote().run();
          }}
        >
          Blockquote
        </button> */}
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
