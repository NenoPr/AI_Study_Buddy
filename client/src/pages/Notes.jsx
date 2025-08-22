import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { isLoggedIn, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) return navigate("/login");
  }, [navigate]);

  const getNotes = async () => {
    setLoading(true);

    try {
      // await is only here, inside the async function
      const res = await fetch("/notes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setNotes(data.notes || "No notes returned.");
      console.log(notes);
    } catch (err) {
      console.error(err);
      setNotes("Error summarizing notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={getNotes} disabled={loading}>
        {loading ? "Fetching notes..." : "Fetch notes"}
      </button>
      {notes && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {notes.map((item, index) => (
            <div key={index}>
              <h4>{item.title}</h4>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      )}
      <br />
    </div>
  );
}
