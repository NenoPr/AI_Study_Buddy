import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AddNote from "../components/Notes/AddNote";
import ShowNotes from "../components/Notes/ShowNotes";

export default function NotesPage() {
  const { token, loading, isLoggedIn } = useAuth();
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();

  // Redirect to login if not authenticated (after loading token)
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      navigate("/login");
    }
  }, [loading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!loading && token) {
      fetchNotes();
    }
  }, [loading, token]);

  // Fetch notes only when token is ready
  const fetchNotes = async () => {
    try {
      if (!token) return;
      const res = await fetch("/notes", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
  };

  const addNoteToState = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  if (loading) return <p>Loading...</p>; // wait until token restored

  return (
    <div>
      <AddNote onNoteAdded={addNoteToState} refreshNotes={fetchNotes} />
      <ShowNotes notes={notes} refreshNotes={fetchNotes} />
    </div>
  );
}
