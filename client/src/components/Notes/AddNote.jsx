import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AddNote({refreshNotes, onNoteAdded}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteAdd, setNoteAdd] = useState(false);
  const { token } = useAuth();

  // ✅ This function is async
  const addNote = async (e) => {
    e.preventDefault()
    setLoading(true);

    try {
      // await is only here, inside the async function
      const res = await fetch("/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({title, content})
      });
      const data = await res.json();
      if (data) {
        onNoteAdded(data); // ✅ push new note into parent state
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setNoteAdd(false);
      setTitle("");
      setContent("");
      // refreshNotes();
    }
  };

  return (
    <div>
      {noteAdd ? (
        <form onSubmit={addNote} name="addNote">
          <h2>Title</h2>
          <input
            type="text"
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <br />
          <h2>Content</h2>
          <input
            type="text"
            placeholder="Content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Adding note..." : "Add note"}
          </button>
        </form>
      ) : 
        (<button onClick={() => setNoteAdd(true)}>Add Note</button>)
      }
    </div>
  );
}
