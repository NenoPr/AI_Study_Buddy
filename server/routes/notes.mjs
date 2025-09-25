import express, { json } from "express";
import {
  authenticateToken,
  validateUserId,
} from "../middleware/authMiddleware.mjs";
import { body, validationResult } from "express-validator";
import {
  validateAndSanitizeId,
  validateNote,
} from "../middleware/validateSanitizeReq.mjs";
import sanitizeHtml from "sanitize-html";

const router = express.Router();

// All routes are protected
router.use(authenticateToken);
router.use(validateUserId);

// READ all notes for the logged-in user
router.get("/", async (req, res) => {
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );

    // Get total count
    const totalResult = await req.pool.query(
      "SELECT COUNT(*) FROM notes WHERE user_id = $1",
      [userId]
    );
    const totalRows = parseInt(totalResult.rows[0].count, 10);

    // const notes = result.rows.map((note) => ({
    //   ...note,
    //   markdown: `${note.content}\n\n**Tags:** React, markdown`,
    // }));

    res.json({ notes: result.rows, page, limit, totalRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new note
router.post(
  "/",
  validateNote,
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "groups",
    isArray: true,
  }),
  async (req, res) => {
    const userId = req.user.userId;
    const title = req.body.title;
    const content = req.body.content;
    const groups = req.body?.groups;

    const client = await req.pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        "INSERT INTO notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *",
        [userId, title, content]
      );
      console.log("result: ", result);
      const note_id = result.rows[0].id;

      if (groups) {
        for (const group_id of groups) {
          await client.query(
            "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2)",
            [note_id, group_id]
          );
        }
      }
      await client.query("COMMIT");
      res.status(200).json("Success");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500), json({ error: "Internal server error" });
    }
  }
);

// UPDATE a note by id
router.put(
  "/note/:id",
  validateNote,
  validateAndSanitizeId({ location: "params", type: "int", fieldName: "id" }),
  async (req, res) => {
    const userId = req.user.userId;
    const { title, content } = req.body;
    const id  = req.params.id;
    console.log("req.body:", req.body);
    console.log("req.params:", req.params.id);
    console.log("req.user:", req.user);

    console.log(typeof id) // should be 'string' from req.params
console.log(typeof userId) // 'number'

    const client = await req.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "UPDATE notes SET title=$1, content=$2, updated_at=NOW() WHERE id=$3 AND user_id=$4 RETURNING *",
        [title, content, id, userId]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Note not found" });
      }

      await client.query("COMMIT");

      res.status(200).json("Success");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE a note by id
router.delete(
  "/note/:id",
  validateAndSanitizeId({ location: "params", type: "int", fieldName: "id" }),
  async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    console.log("ID:", id);
    const client = await req.pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        "DELETE FROM notes WHERE id=$1 AND user_id=$2 RETURNING *",
        [id, userId]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Note not found" });
      }

      await client.query("COMMIT");
      res.json({ message: "Note deleted", note: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all groups
router.get("/groups", async (req, res) => {
  const userId = req.user.userId;
  try {
    // Get notes
    const result = await req.pool.query(
      "SELECT * FROM groups WHERE user_id = $1",
      [userId]
    );

    res.status(200).json({ groups: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new Group
router.post(
  "/groups",
  [
    body("name")
      .exists()
      .withMessage("Group name is required")
      .isString()
      .withMessage("Group name must be a string")
      .trim()
      .matches(/^[\p{L}\p{N}\p{P}\p{Zs}]+$/u)
      .withMessage("Group name contains invalid characters")
      .isLength({ min: 1, max: 200 })
      .withMessage("Group name must be 1–200 characters"),
  ],
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "notes_ids",
    isArray: true,
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // If creating a new group
    const userId = req.user.userId;
    const name = req.body.name;
    const notes_ids = req.body.notes_ids?.split(",");
    console.log("Values passed: ", name, notes_ids);

    try {
      const client = await req.pool.connect();

      await client.query("BEGIN");
      const GroupTable = await client.query(
        "INSERT INTO groups (name, user_id) VALUES ($1, $2) RETURNING *",
        [name, userId]
      );

      const group_id = GroupTable.rows[0].id;

      if (notes_ids) {
        for (const note_id of notes_ids) {
          await client.query(
            "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2)",
            [note_id, group_id]
          );
        }
      }

      await client.query("COMMIT");

      res.status(200).json("Success");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Update Group
router.put(
  "/groups",
  [
    body("name")
      .exists()
      .withMessage("Group name is required")
      .isString()
      .withMessage("Group name must be a string")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Group name must be 1–200 characters"),
  ],
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "group_id",
    isArray: false,
  }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // If creating a new group
    const userId = req.user.userId;
    const name = req.body.name;
    const group_id = req.body.group_id;
    console.log("Values passed: ", name, group_id);

    const client = await req.pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        "UPDATE groups SET name=$1 WHERE id=$2 AND user_id=$3",
        [name, group_id, userId]
      );

      await client.query("COMMIT");

      res.status(200).json("Success");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Delete Groups
router.delete(
  "/groups",
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "ids",
    isArray: true,
  }),
  async (req, res) => {
    const ids = req.body.ids;
    const client = await req.pool.connect();
    try {
      await client.query("BEGIN");
      for (const group_id of ids) {
        await client.query("DELETE FROM groups WHERE id=$1", [group_id]);
      }
      await client.query("COMMIT");

      res.status(200).json("Success");
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all notes from a group
router.get(
  "/groupNotes/:group_id",
  validateAndSanitizeId({
    location: "params",
    type: "int",
    fieldName: "group_id",
  }),
  async (req, res) => {
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

      res.status(200).json({ notes: resNotes.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all groups a note belongs to
router.get(
  "/groupNotes/note/group/:note_id",
  validateAndSanitizeId({
    location: "params",
    type: "int",
    fieldName: "note_id",
  }),
  async (req, res) => {
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
                res.status(100).res.json("No groups found...");
                return null; // return null if nothing found
              }

              return result.rows; // will be an array
            } catch (err) {
              console.error(
                `❌ Error fetching group_id ${group_id}:`,
                err.message
              );
              res.status(500).json({ error: "Error fetching group..." });
              return null;
            }
          })
        )
      )
        .filter(Boolean) // remove nulls
        .flat(); // flatten nested arrays

      console.log("✅ Clean groups:", resGroups);

      console.log("All groups:", resGroups);
      res.status(200).json({ groups: resGroups });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Get all group_ids from a note
router.get(
  "/groupNotes/note/:note_id",
  validateAndSanitizeId({
    location: "params",
    type: "int",
    fieldName: "note_id",
  }),
  async (req, res) => {
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
  }
);

// Update groups for a note
router.post(
  "/groupNotes/update",
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "note_id",
  }),
  validateAndSanitizeId({
    location: "body",
    type: "int",
    fieldName: "group_ids",
    isArray: true,
  }),
  async (req, res) => {
    const { note_id, group_ids } = req.body;

    const client = await req.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM note_groups WHERE note_id=$1", [note_id]);

      for (const group_id of group_ids) {
        await client.query(
          "INSERT INTO note_groups (note_id, group_id) VALUES ($1, $2)",
          [note_id, group_id]
        );
      }

      await client.query("COMMIT");
      res.json({ success: true });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    } finally {
      client.release();
    }
  }
);

export default router;
