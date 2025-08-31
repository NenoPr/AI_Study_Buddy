import express, { json } from "express";
import { authenticateToken } from "../middleware/authMiddleware.mjs";

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

// Create a route
router.post("/", async (req, res) => {
  const title = req.body.title;
  const content = req.body.content;
  const groups = req.body?.groups;
  if (!title || !content)
    return res.status(400).json({ error: "Title and content required" });

  try {
    const result = await req.pool.query(
      "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
      [req.user.userId, title, content]
    );
    if (groups) {
      await Promise.all(
        groups.map(async (groupId) => {
          const noteGroupsTable = await req.pool.query(
            "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2)",
            [result.rows[0].id, groupId]
          );
        })
      );
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500), json({ error: "Internal server error" });
  }
});

// READ all notes for the logged-in user
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [req.user.userId, limit, offset]
    );

    // Get total count
    const totalResult = await req.pool.query(
      "SELECT COUNT(*) FROM notes WHERE user_id = $1",
      [req.user.userId]
    );
    const totalRows = parseInt(totalResult.rows[0].count, 10);

    const notes = result.rows.map((note) => ({
      ...note,
      markdown: `${note.content}\n\n**Tags:** React, markdown`,
    }));

    res.json({ notes: result.rows, page, limit, totalRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// UPDATE a note by id
router.put("/:id", async (req, res) => {
  const { title, content } = req.body;
  const { id } = req.params;
  console.log("req.body:", req.body);
  console.log("req.params:", req.params);
  console.log("req.user:", req.user);
  try {
    const result = await req.pool.query(
      "UPDATE notes SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *",
      [title, content, id, req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Note not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
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
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Note not found" });
    res.json({ message: "Note deleted", note: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups", async (req, res) => {
  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT * FROM groups WHERE user_id = $1",
      [req.user.userId]
    );

    res.json({ groups: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groupNotes/:group_id", async (req, res) => {
  const { group_id } = req.params;
  console.log("groupId: ", req.params);
  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT * FROM note_groups WHERE group_id = $1",
      [group_id]
    );
    console.log("Note Groups Result:", result.rows);

    const noteIds = result.rows.map((note) => note.note_id);

    const resNotes = await req.pool.query(
      "SELECT * FROM notes WHERE id = ANY($1)",
      [noteIds] // pass array as parameter
    );

    res.json({ notes: resNotes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groupNotes/note/group/:note_id", async (req, res) => {
  const { note_id } = req.params;
  console.log("note_id: ", req.params);
  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT group_id FROM note_groups WHERE note_id = $1",
      [note_id]
    );
    console.log("Note Result:", result.rows);

    const groupIds = result.rows.map((group) => group.group_id);

    const resGroups = (
      await Promise.all(
        groupIds.map(async (group_id) => {
          try {
            console.log("Querying group_id:", group_id);

            const result = await req.pool.query(
              "SELECT * FROM groups WHERE id = $1",
              [group_id]
            );

            if (result.rows.length === 0) {
              console.warn(`⚠️ No group found for id ${group_id}`);
              return null; // return null if nothing found
            }

            return result.rows; // will be an array
          } catch (err) {
            console.error(
              `❌ Error fetching group_id ${group_id}:`,
              err.message
            );
            return null;
          }
        })
      )
    )
      .filter(Boolean) // remove nulls
      .flat(); // flatten nested arrays

    console.log("✅ Clean groups:", resGroups);

    console.log("All groups:", resGroups);
    res.json({ groups: resGroups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groupNotes/note/:note_id", async (req, res) => {
  const { note_id } = req.params;
  console.log("note_id: ", req.params);
  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT group_id FROM note_groups WHERE note_id = $1",
      [note_id]
    );
    console.log("Note Result:", result.rows);

    const groupIds = result.rows.map((group) => group.group_id);

    res.json({ groups: groupIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groupNotes", async (req, res) => {
  const note = req.body.notes_ids;
  const group = req.body.group_id;

  console.log(note);
  console.log(group);

  try {
    const result = await req.pool.query(
      "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2) RETURNING *",
      [note, group]
    );

    res.json({ result: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups", async (req, res) => {
  // If creating a new group
  const name = req.body.name;
  const notes_ids = req.body.notes_ids.split(",");
  console.log("Values passed: ", name, notes_ids);

  try {
    // Get notes
    const GroupTable = await req.pool.query(
      "INSERT INTO groups (name, user_id) VALUES ($1, $2) RETURNING *",
      [name, req.user.userId]
    );
    console.log("Group Table: ");
    const group_id = GroupTable.rows[0].id;
    await Promise.all(
      notes_ids.map(async (note_id) => {
        const noteGroupsTable = await req.pool.query(
          "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2)",
          [note_id, group_id]
        );
      })
    );

    //   res.json({ groups: result.rows});
    res.status(200).json("Success");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
