import { Router } from "express";
import express, { json } from "express";
import { authenticateToken, validateUserId } from "../middleware/authMiddleware.mjs";
import { body, validationResult } from "express-validator";
import OpenAI from "openai";

const router = Router();
router.use(authenticateToken);
router.use(validateUserId)

// Answers the users question
router.post(
  "/ask",
  [
    // ✅ Validation
    body("question"),
    // ✅ Sanitization
    body("question"),
  ],
  async (req, res) => {
    console.log(req.body.question);
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const question = req.body.question;

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
              "You are a helpful study assistant. Answer the students questions. Use the .md format to format them, make them look easy to understand and pleasing to see.",
          },
          { role: "user", content: `${question}` },
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
router.post("/askNote", async (req, res) => {
  console.log(req.body.question);
  try {
    const userId = req.user?.userId;

    // Get user's notes
    const result = await req.pool.query(
      "SELECT title, content FROM notes WHERE user_id = $1 AND id=$2",
      [userId, res.body.id]
    );

    if (!result.rows.length) {
      return res.json({ answer: "No notes found..." });
    }

    // const notesText = result.rows.map(note => `${note.title}: ${note.content}`).join("\n\n"); // for multiple notes

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
            "You are a helpful study assistant. Answer the user's questions. Use the .md format to format them, make them look easy to understand and pleasing to see.",
        },
        {
          role: "user",
          content: `Here are my notes: \n${notesText}\n\nQuestion: ${req.body.question}`,
        },
      ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

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
            "You are a helpful study assistant. Summarize the user's notes concisely.",
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
router.get("/summarize/:id", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    let result;

    // Get user's notes
    try {
      result = await req.pool.query(
        "SELECT * FROM notes WHERE id=$1 AND user_id=$2",
        [id, req.user.userId]
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
            "You are a helpful study assistant. Summarize the user's notes concisely. Use the .md format to format them, make them look easy to understand and pleasing to see.",
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

// Summarizes selected groups
router.post("/summarize/groupNotes", async (req, res) => {
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
        const res = await client.query("SELECT * FROM notes WHERE id=$1", [
          note_id.note_id,
        ]);
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
            "You are a helpful study assistant. Summarize the user's notes concisely. Use the .md format to format them, make them look easy to understand and pleasing to see.",
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
});

// Creates title for a note
router.post("/createNote", async (req, res) => {
  console.log(req.body.note);
  try {
    const userId = req.user?.userId;

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
            "Create a title for given notes. Keep it as short and as simple as possible, one sentence only. Send the title and nothing else. Don't use any counters or bullet points. Also use .md markup for the title, but don't add .md extension to the title.",
        },
        {
          role: "user",
          content: `Create a fitting title for all of this content: ${req.body.note}`,
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
});

router.get("/createQuiz/:id", async (req, res) => {
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
});

router.post("/createQuiz/group", async (req, res) => {
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
      const res = await client.query("SELECT content FROM notes WHERE id=$1", [
        note.note_id,
      ]);
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
});

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
