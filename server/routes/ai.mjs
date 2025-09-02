import { Router } from "express";
import express, { json } from "express";
import { authenticateToken } from "../middleware/authMiddleware.mjs";
import OpenAI from "openai";

const router = Router();
router.use(authenticateToken);

router.post("/ask", async (req, res) => {
  console.log(req.body.question);
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
            "You are a helpful study assistant. Answer the students questions.",
        },
        { role: "user", content: `Question: ${req.body.question}` },
      ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

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
            "You are a helpful study assistant. Answer the students questions.",
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
    console.log("group_ids: ",group_ids)
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
      console.log("allGroupNotes: ", allGroupNotes)
      

      if (note_ids.length === 0)
        return res
          .status(404)
          .json({ error: "No notes found with provided groups..." });

      for (const note_id of allGroupNotes) {
        const res = await client.query(
          "SELECT * FROM notes WHERE id=$1",
          [note_id.note_id]
        );
        console.log("note_id: ", note_id.note_id)
        result.push(res.rows.flat());
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
    console.log("result: ", result)
    const notesText = result.flat()
      .map((note) => `${note.title}: ${note.content}`)
      .join("\n\n");

    console.log("notesText: ", notesText)

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
    console.log("Response: ",response.choices[0].message.content)
    const summary = response.choices[0].message.content;
    res.json({ summary });
  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/createNote", async (req, res) => {
  console.log(req.body.note);
  try {
    const userId = req.user?.userId;
    if (!userId)
      return res.status(401).json({ error: "Invalid token: user ID missing" });

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

export default router;
