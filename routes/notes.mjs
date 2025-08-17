import express, { json } from "express";
import { authenticateToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Create a route
router.post("/", async (req, res) => {
    const {title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required"});

    try {
        const result = await req.pool.query(
            "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
            [req.user.userId, title, content]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500),json({ error: "Internal server error"});
    }
});

// READ all notes for the Logged-in user
router.get("/", async (req, res) => {
    try {
        const result = await req.pool.query(
            "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error"})
    }
});

// UPDATE a note by id
router.put("/:id", async (req, res) => {
    const { title, content } = req.body;
    const { id } = req.params;
    try {
        const result = await req.pool.query(
            "UPDATE notes SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *",
            [title, content, id, req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Note not found"});
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error"});
    }
});

// DELETE a note by id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await req.pool.query(
            "DELETE FROM notes WHERE id=$1 AND user_id=$2 RETURNING *",
            [id, req.user.userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Note not found"})
        res.json({ message: "Note deleted", note: result.rows[0]});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error"});
    }
});

export default router;