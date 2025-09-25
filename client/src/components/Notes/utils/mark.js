// marks.js
import { Mark } from "@tiptap/core";

export const Highlight = Mark.create({
  name: "highlight",
  parseHTML() { return [{ tag: "mark" }]; },
  renderHTML({ HTMLAttributes }) { return ["mark", HTMLAttributes, 0]; },
  addCommands() {
    return { toggleHighlight: () => ({ commands }) => commands.toggleMark(this.name) };
  },
});

export const Underline = Mark.create({
  name: "underline",
  parseHTML() { return [{ tag: "u" }]; },
  renderHTML({ HTMLAttributes }) { return ["u", HTMLAttributes, 0]; },
  addCommands() {
    return { toggleUnderline: () => ({ commands }) => commands.toggleMark(this.name) };
  },
});
