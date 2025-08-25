import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware.mjs";
import OpenAI from "openai";

const router = Router();

router.post("/ask", authenticateToken, async (req, res) => {
  console.log(req.body.question)
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Invalid token: user ID missing" });

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3, // low creativity to reduce hallucinations
      max_tokens: 500,
      messages: [
        { role: "system", content: "You are a helpful study assistant. Answer the students questions." },
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

router.post("/askNote", authenticateToken, async (req, res) => {
  console.log(req.body.question)
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Invalid token: user ID missing" });

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
        { role: "system", content: "You are a helpful study assistant. Answer the students questions." },
        { role: "user", content: `Here are my notes: \n${notesText}\n\nQuestion: ${req.body.question}` },
      ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });

  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/summarize", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Invalid token: user ID missing" });

    // Get user's notes
    const result = await req.pool.query(
      "SELECT title, content FROM notes WHERE user_id = $1",
      [userId]
    );

    if (!result.rows.length) {
      return res.json({ answer: "You have no notes to summarize yet." });
    }

    const notesText = result.rows.map(note => `${note.title}: ${note.content}`).join("\n\n");

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3, // low creativity to reduce hallucinations
      max_tokens: 500,
      messages: [
        { role: "system", content: "You are a helpful study assistant. Summarize the user's notes concisely." },
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

router.post("/createNote", authenticateToken, async (req, res) => {
  console.log(req.body.note)
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Invalid token: user ID missing" });

    // Call OpenAI
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0.3, // low creativity to reduce hallucinations
      max_tokens: 500,
      messages: [
        { role: "system", content: "Create titles for given notes. Keep it as short and as simple as possible. Only send title name, nothing else." },
        { role: "user", content: `Create a fitting title for this note: ${req.body.note}` },
      ],
    });

    const answer = response.choices[0].message.content;
    res.json({ answer });
    console.log(answer)

  } catch (err) {
    console.error("AI route error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
