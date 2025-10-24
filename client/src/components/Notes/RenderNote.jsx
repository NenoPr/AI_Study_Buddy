import { React, useRef, useState, useEffect, useCallback, memo } from "react";
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
import ListItem from "@tiptap/extension-list-item";
import { DOMParser as ProseMirrorDOMParser } from "prosemirror-model";

import History from "@tiptap/extension-history";
import Code from "@tiptap/extension-code";

import DOMPurify from "dompurify";
import he from "he";
import { Button } from "../ui/button";

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

const CleanListItem = ListItem.extend({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction(transactions, oldState, newState) {
          const tr = newState.tr;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === "listItem") {
              const text = node.textContent.trim();

              // Check if this list item is empty
              const isEmpty = text === "";

              // Check if user has cursor inside this node
              const cursorInside =
                newState.selection.$from.pos >= pos &&
                newState.selection.$from.pos <= pos + node.nodeSize;

              // Only delete if empty AND user is NOT currently editing it
              if (isEmpty && !cursorInside) {
                tr.delete(pos, pos + node.nodeSize);
              }
            }
          });

          return tr.docChanged ? tr : null;
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
  const [menuMode, setMenuMode] = useState("main");

  const askAI = async (selectedText, to, prompt) => {
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
        body: JSON.stringify({ question: selectedText, prompt: prompt }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.answer) {
        const decoded = he.decode(data.answer);
        let clean = DOMPurify.sanitize(decoded, {
          USE_PROFILES: { html: true },
        });

        // Remove empty list items again
        const temp = document.createElement("div");
        temp.innerHTML = clean;
        temp.querySelectorAll("li").forEach((li) => {
          const text = (li.textContent || "").trim();
          if (!text) li.remove();
        });
        clean = temp.innerHTML;

        // Move insertion point to the end of the current block node
        const resolvedPos = editorContent.state.doc.resolve(to);
        const blockEnd = resolvedPos.end(resolvedPos.depth);

        // Validate before inserting
        const fragment = ProseMirrorDOMParser.fromSchema(
          editorContent.schema
        ).parse(new DOMParser().parseFromString(clean, "text/html"));

        if (!fragment) {
          console.warn("Skipping empty AI content");
          return;
        }

        editorContent.chain().focus().insertContentAt(blockEnd, fragment).run();
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
      //PasteSplitParagraph,
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
      CleanListItem,
    ],
    shouldRerenderOnTransaction: true,
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  const BubbleMenuContent = memo(function BubbleMenuContent({
    editor,
    menuMode,
    setMenuMode,
  }) {
    const modeRef = useRef(menuMode);
    const [, forceRender] = useState(0); // local trigger only for this component

    const setMode = useCallback((mode, persist = false) => {
      modeRef.current = mode;
      forceRender((n) => n + 1);
      if (persist) {
        setMenuMode(mode);
      }
    }, []);

    const handleMark = (mark, mode) => {
      if (mark === "unsetAllMarks") {
        editor.chain().focus()[`${mark}`]().run();
      } else if (mark === "clearNodes") {
        editor.chain().focus()[`${mark}`]().run();
        editor.chain().focus().unsetMark("code").run();
      } else if (mark.includes("heading")) {
        editor
          .chain()
          .focus()
          .setNode("heading", { level: Number(mark.slice(-1)) })
          .run();
      } else if (mark === "paragraph") {
        editor.chain().focus().setParagraph().run();
      } else if (mark === "image") {
        editor.chain().focus().setImage({ src: url }).run();
      } else if (mark === "unsetLink") {
        editor.chain().focus().unsetLink().run();
      }
      editor.chain().focus()[`toggle${mark}`]().run();
    };

    if (modeRef.current === "main") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("style")}
          >
            Style
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("nodes")}
          >
            Nodes
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("headers")}
          >
            Headers
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("convert")}
          >
            Convert
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("ai")}
          >
            AI
          </button>
        </div>
      );
    }

    if (modeRef.current === "style") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("Bold")}
          >
            Bold
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("Italic")}
          >
            Italic
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("Underline")}
          >
            Underline
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("Strike")}
          >
            Strike
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("Highlight")}
          >
            Highlight
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("unsetAllMarks")}
          >
            Clear
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("main")}
          >
            ← Back
          </button>
        </div>
      );
    }

    if (modeRef.current === "nodes") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => handleMark("BulletList")}
          >
            Bullet List
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setMode("nodes");
            }}
            onClick={() => handleMark("OrderedList")}
          >
            Ordered List
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setMode("nodes");
            }}
            onClick={() => handleMark("Code")}
          >
            Code Block
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setMode("nodes");
            }}
            onClick={() => handleMark("Blockquote")}
          >
            Block Quote
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setMode("nodes");
            }}
            onClick={() => handleMark("clearNodes")}
          >
            Clear Node
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => setMode("main", true)}
          >
            ← Back
          </button>
        </div>
      );
    }

    if (modeRef.current === "headers") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-1")}
          >
            H1
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-2")}
          >
            H2
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-3")}
          >
            H3
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-4")}
          >
            H4
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-5")}
          >
            H5
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("heading-6")}
          >
            H6
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("paragraph")}
          >
            Clear
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("main")}
          >
            ← Back
          </button>
        </div>
      );
    }

    if (modeRef.current === "convert") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const url = state.doc.textBetween(from, to, " ");
              editorContent.chain().focus().setLink({ href: url }).run();
            }}
          >
            Link
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleMark("unsetLink")}
          >
            Remove Link
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const url = state.doc.textBetween(from, to, " ");
              editorContent.chain().focus().setImage({ src: url }).run();
            }}
          >
            Link to Image
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("main")}
          >
            ← Back
          </button>
        </div>
      );
    }

    if (modeRef.current === "ai") {
      return (
        <div className="bubble-menu-section">
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI(selectedText, to);
            }}
          >
            Ask AI
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI(selectedText, to, "Explain");
            }}
            className="button-AI"
          >
            Explain
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI(selectedText, to, "Summarize");
            }}
          >
            Summarize
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI(selectedText, to, "Continue");
            }}
          >
            Continue
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault(); // keeps the selection alive
              const { state } = editorContent;
              const { from, to } = state.selection;

              const selectedText = state.doc.textBetween(from, to, " ");
              setQuestion(selectedText);
              console.log("Selected text:", selectedText);
              askAI(selectedText, to, "Fix Grammar");
            }}
          >
            Fix Grammar
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMode("main")}
          >
            ← Back
          </button>
        </div>
      );
    }

    return null;
  });

  return (
    <div className="p-2 pt-0" >
      {/* Toolbar */}
      <div
        className="note-open-content-buttons mb-2"
      >
        {/* <button
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
            editorTitle.chain().focus().unsetAllMarks().run();
            editorContent.chain().focus().unsetAllMarks().run();
          }}
        >
          Clear Marks
        </button>
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
          Separator
        </button>
        <button
          onClick={() => {
            editorTitle.chain().focus().clearNodes().run();
            editorContent.chain().focus().clearNodes().run();
          }}
        >
          Clear Nodes
        </button>
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
        </>*/}

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
            editorContent.chain().focus().setHorizontalRule().run();
          }}
        >
          Separator
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

      <BubbleMenu
        editor={editorContent}
        tippyOptions={{
          duration: 0,
          hideOnClick: false,
          interactive: true,
          placement: "top",
        }}
        shouldShow={({ editor, state }) => {
          // make sure editor exists before calling methods
          if (!editor) return false;
          return editor.isFocused && !state.selection.empty;
        }}
        className="my-bubble-menu"
      >
        <div className="bubble-menu-section">
          <BubbleMenuContent
            editor={editorContent}
            menuMode={menuMode}
            setMenuMode={setMenuMode}
          />
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
