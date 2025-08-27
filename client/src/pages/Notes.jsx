import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AddNote from "../components/Notes/AddNote";
import ShowNotes from "../components/Notes/ShowNotes";
import "../css/notes.css"

export default function NotesPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    if (token) {
      fetchNotes();
    }
  }, [token]);

  // Fetch notes only when token is ready
  const fetchNotes = async () => {
    try {
      if (!token) return;
      const res = await fetch("/api/notes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("token")}`, <-- old way
        },
        credentials: "include"
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      console.log(data)
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  };

  const addNoteToState = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  return (
    <div>
      <br />
      <AddNote onNoteAdded={addNoteToState} refreshNotes={fetchNotes} />
      <br />
      <ShowNotes notes={notes} refreshNotes={fetchNotes} onNoteAdded={addNoteToState} />
      <br />
    </div>
  );
}
