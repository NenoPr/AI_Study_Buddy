// turndown.js
import TurndownService from "turndown";

const turndownService = new TurndownService();

// Highlight → ==text==
turndownService.addRule("highlight", {
  filter: "mark",
  replacement: (content) => `==${content}==`,
});

// Underline → ++text++
turndownService.addRule("underline", {
  filter: "u",
  replacement: (content) => `++${content}++`,
});

export default turndownService;
