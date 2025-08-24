import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function ShowNotes({ notes, refreshNotes }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();


  const getNotes = async () => {
    setLoading(true);
    refreshNotes();
    setLoading(false);
  };

  const deleteNote = async (e) => {
    try {
      // await is only here, inside the async function
      const res = await fetch(`/api/notes/${e.target.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include"
      });
    } catch (err) {
      console.error(err);
    } finally {
      refreshNotes();
    }
  };

  return (
    <>
      <button onClick={getNotes} disabled={loading}>
        {loading ? "Fetching notes..." : "Fetch notes"}
      </button>
      {notes && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {notes.map((item, index) => (
            <div key={index} style={{border: "3px solid black", borderRadius: ".5rem", marginBottom: "1rem"}}>
              <h4>{item.title}</h4>
              <p>{item.content}</p>
              <button onClick={deleteNote} id={item.id} style={{marginBottom: "10px", border: "2px solid black"}}>Delete me</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
