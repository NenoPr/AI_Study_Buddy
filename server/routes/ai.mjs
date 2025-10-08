import { Router } from "express";
import express, { json } from "express";
import {
  authenticateToken,
  validateUserId,
} from "../middleware/authMiddleware.mjs";
import { validateAndSanitizeId } from "../middleware/validateSanitizeReq.mjs";
import { body, validationResult } from "express-validator";
import { aiLimiter } from "../middleware/rateLimiters.mjs";
import OpenAI from "openai";

const router = Router();
router.use(authenticateToken);
router.use(validateUserId);
router.use(aiLimiter);

// Answers the users question
router.post(
  "/ask",
  [
    body("question")
      .isString()
      .withMessage("Question must be a string")
      .trim()
      .notEmpty()
      .withMessage("Question cannot be empty")
      .isLength({ min: 3, max: 1000 })
      .withMessage("Question must be between 3 and 1000 characters"),
    body("prompt")
      .optional({ nullable: true }) // ← allow missing or null
      .isString()
      .withMessage("Prompt must be a string")
      .trim()
      .isLength({ min: 3, max: 1000 })
      .withMessage("Prompt must be between 3 and 1000 characters"),
  ],
  async (req, res) => {
    console.log(req.body.question);
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const question = req.body.question;
    let prompt = "";
    if (req.body.prompt == "Continue") {
      prompt = req.body.prompt + " writing from the next text:";
    } else if (req.body.prompt == "Explain") {
      prompt = req.body.prompt + " the following text:";
    } else if (req.body.prompt == "Summarize") {
      prompt = req.body.prompt + " the following text:";
    } else if (req.body.prompt == "Fix Grammar") {
      prompt =
        req.body.prompt +
        " in the following text, only send the corrected text, nothing else:";
    }

    try {
      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful study assistant. Answer the students questions or do what they ask. Use the HTML format so it can be displayed in a browser, don't add any extra elements like header or footer, only use the HTML format to put the answer in. Make them look easy to understand and pleasing to see. Use every possible element you can to style the HTML. Don't use classes if you're gonna style the elements, only use inline style attribute.",
          },
          { role: "user", content: `${prompt} ${question}` },
        ],
      });

      const answer = response.choices[0].message.content;
      res.json({ answer });
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Answers a question regarding a note
router.post(
  "/askNote",
  [
    body("question")
      .isString()
      .withMessage("Question must be a string")
      .trim()
      .notEmpty()
      .withMessage("Question cannot be empty")
      .isLength({ min: 3, max: 1000 })
      .withMessage("Question must be between 3 and 1000 characters"),
  ],
  validateAndSanitizeId({ location: "body", type: "int", fieldName: "noteId" }),
  async (req, res) => {
    console.log(req.body.question);
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { question, noteId } = req.body;
    const userId = req.user?.userId;
    try {
      // Get user's notes
      const result = await req.pool.query(
        "SELECT title, content FROM notes WHERE user_id = $1 AND id=$2",
        [userId, noteId]
      );

      if (!result.rows.length) {
        return res.json({ answer: "No notes found..." });
      }

      const notesText = result.rows
        .map((note) => `${note.title}: ${note.content}`)
        .join("\n\n"); // for multiple notes

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful study assistant. Answer the students questions. Use the HTML format so it can be displayed in a browser, don't add any extra elements like header or footer, only use the HTML format to put the answer in. Make them look easy to understand and pleasing to see. Use every possible element you can to style the HTML. Don't use classes if you're gonna style the elements, only use inline style attribute.",
          },
          {
            role: "user",
            content: `Here are my notes: \n${notesText}\n\nQuestion: ${question}`,
          },
        ],
      });

      const answer = response.choices[0].message.content;
      res.json({ answer });
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Summarizes all notes
router.get("/summarize", async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Get user's notes
    const result = await req.pool.query(
      "SELECT title, content FROM notes WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length) {
      return res.json({ answer: "You have no notes to summarize yet." });
    }

    const notesText = result.rows
      .map((note) => `${note.title}: ${note.content}`)
      .join("\n\n");

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3, // low creativity to reduce hallucinations
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful study assistant. Summarize the user's notes concisely. Use the HTML format so it can be displayed in a browser, don't add any extra elements like header or footer, only use the HTML format to put the answer in. Make them look easy to understand and pleasing to see. Use every possible element you can to style the HTML. Don't use classes if you're gonna style the elements, only use inline style attribute.",
        },
        { role: "user", content: `Here are my notes: \n${notesText}\n\n ` },
      ],
    });

    const summary = response.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Summarize a note
router.get(
  "/summarize/:id",
  validateAndSanitizeId({ location: "params", type: "int", fieldName: "id" }),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      let result;

      // Get user's notes
      try {
        result = await req.pool.query(
          "SELECT * FROM notes WHERE id=$1 AND user_id=$2",
          [id, userId]
        );
        if (result.rows.length === 0)
          return res.status(404).json({ error: "Note not found" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }

      const notesText = result.rows
        .map((note) => `${note.title}: ${note.content}`)
        .join("\n\n");

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful study assistant. Summarize the user's notes concisely. Use the HTML format so it can be displayed in a browser, don't add any extra elements like header or footer, only use the HTML format to put the answer in. Make them look easy to understand and pleasing to see. Use every possible element you can to style the HTML. Don't use classes if you're gonna style the elements, only use inline style attribute.",
          },
          { role: "user", content: `Here are my notes: \n${notesText}\n\n ` },
        ],
      });

      const summary = response.choices[0].message.content;
      res.json({ summary });
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Summarizes selected groups
router.post(
  "/summarize/groupNotes",
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "group_ids",
  }),
  async (req, res) => {
    try {
      const userId = req.user?.userId;
      const group_ids = req.body.group_ids;
      console.log("group_ids: ", group_ids);
      const result = [];

      const client = await req.pool.connect();
      // Get user's notes
      try {
        const note_ids = [];
        for (const group_id of group_ids) {
          const res = await client.query(
            "SELECT note_id FROM note_groups WHERE group_id=$1",
            [group_id]
          );
          note_ids.push(res.rows);
        }
        const allGroupNotes = note_ids.flat();
        console.log("allGroupNotes: ", allGroupNotes);

        if (note_ids.length === 0)
          return res
            .status(404)
            .json({ error: "No notes found with provided groups..." });

        for (const note_id of allGroupNotes) {
          const res = await client.query(
            "SELECT * FROM notes WHERE id=$1 AND user_id=$2",
            [note_id.note_id, userId]
          );
          console.log("note_id: ", note_id.note_id);
          result.push(res.rows.flat());
        }
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      }
      console.log("result: ", result);
      const notesText = result
        .flat()
        .map((note) => `${note.title}: ${note.content}`)
        .join("\n\n");

      console.log("notesText: ", notesText);

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful study assistant. Summarize the user's notes concisely. Use the HTML format so it can be displayed in a browser, don't add any extra elements like header or footer, only use the HTML format to put the answer in. Make them look easy to understand and pleasing to see. Use every possible element you can to style the HTML. Don't use classes if you're gonna style the elements, only use inline style attribute.",
          },
          { role: "user", content: `Here are my notes: \n${notesText}\n\n ` },
        ],
      });
      console.log("Response: ", response.choices[0].message.content);
      const summary = response.choices[0].message.content;
      res.json({ summary });
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// Creates title for a note
router.post(
  "/createNote",
  [
    body("note")
      .isString()
      .withMessage("Note must be a string")
      .trim()
      .notEmpty()
      .withMessage("Note cannot be empty")
      .isLength({ min: 3, max: 10000 })
      .withMessage("Note must be between 3 and 10000 characters"),
  ],
  async (req, res) => {
    console.log(req.body.note);
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const note = req.body.note;
    try {
      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "Create a title for given note. Keep it as short and as simple as possible, one sentence only. Send the title and nothing else. Don't use any counters or bullet points.",
          },
          {
            role: "user",
            content: `Create a fitting title for all of this content: ${note}`,
          },
        ],
      });

      const answer = response.choices[0].message.content;
      res.json({ answer });
      console.log(answer);
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.get(
  "/createQuiz/:id",
  validateAndSanitizeId({
    location: "params",
    type: "int",
    fieldName: "id",
  }),
  async (req, res) => {
    const userId = req.user?.userId;
    const noteId = req.params.id;
    const JSONStructure = `"\"question\": \"Question string\",\n  \"options\": {\n    \"a\": \"option string\",\n    \"b\": \"option string\",\n    \"c\": \"option string\",\n    \"d\": \"option string\"\n  },\n  \"correct_answer\": \"correct option string, a,b,c or d character\",\n  \"explanation\": \"The correct answer explanation string\""`;
    try {
      // Get note
      const result = await req.pool.query(
        "SELECT content FROM notes WHERE user_id = $1 AND id = $2",
        [userId, noteId]
      );

      const note = result.rows[0].content;

      console.log(note);

      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `Create a quiz for the given note. Use this example format to structure the quiz in json: ${JSONStructure}. VERY important: Send the quiz in json format! Do not stringify it like in the example format. If there is multiple question send the json questions in an array with the prefix "questions". Don't send anything else but the json object.`,
          },
          {
            role: "user",
            content: `Here is the note: ${note}`,
          },
        ],
      });

      const answer = response.choices[0].message.content;
      res.json(answer);
      console.log(answer);
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/createQuiz/group",
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "groups",
  }),
  async (req, res) => {
    const userId = req.user?.userId;
    const groups = req.body.groups;
    if (!groups) {
      res.json("No groups selected...");
      return;
    }
    const JSONStructure = `"\"question\": \"Question string\",\n  \"options\": {\n    \"a\": \"option string\",\n    \"b\": \"option string\",\n    \"c\": \"option string\",\n    \"d\": \"option string\"\n  },\n  \"correct_answer\": \"correct option string, a,b,c or d character\",\n  \"explanation\": \"The correct answer explanation string\""`;
    const client = await req.pool.connect();
    try {
      // Get note
      const note_ids = [];
      for (const id of groups) {
        const result = await client.query(
          "SELECT note_id FROM note_groups WHERE group_id=$1",
          [id]
        );
        note_ids.push(result.rows);
      }
      const allGroupNotes = note_ids.flat();
      console.log(allGroupNotes);

      const notesResult = [];
      for (const note of allGroupNotes) {
        const res = await client.query(
          "SELECT content FROM notes WHERE id=$1 AND user_id=$2",
          [note.note_id, userId]
        );
        notesResult.push(res.rows[0].content);
      }

      const notesText = notesResult.join("\n\n");
      console.log(notesText);
      // Call OpenAI
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        temperature: 0.3, // low creativity to reduce hallucinations
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: `Create a quiz for the given notes. Use this example format to structure the quiz in json: ${JSONStructure}. VERY important: Send the quiz in json format! Do not stringify it like in the example format. If there is multiple question send the json questions in an array with the prefix "questions". Don't send anything else but the json object. Try to create as many questions as you can that can fit in 4096 tokens, a question for each note.`,
          },
          {
            role: "user",
            content: `Here are the notes: ${notesText}`,
          },
        ],
      });

      const answer = response.choices[0].message.content;
      res.json(answer);
      console.log(answer);
    } catch (err) {
      console.error("AI route error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;

// Make it structured like this:
// "question": "Question string",
// "options": {
//   "a": "option string",
//   "b": "option string",
//   "c": "option string",
//   "d": "option string"
// },
// "correct_answer": "correct option string, a,b,c or d character",
// "explanation": "The correct answer explanation string"
