import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRef, useEffect } from "react";

export default function ShowNotes({ notes, refreshNotes }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditingId, setIsEditingId] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const textareaRef = useRef(null);

  const getNotes = async () => {
    setLoading(true);
    refreshNotes();
    setLoading(false);
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [content]);

  const deleteNote = async (id) => {
    try {
      // await is only here, inside the async function
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      getNotes();
    }
  };

  function editNote(title, content, itemId) {
    setIsEditingId(itemId);
    setTitle(title);
    setContent(content);
    return;
  }

  const saveNote = async (title, content, itemId) => {
    const data = { title, content };
    console.log(itemId, title, content);
    try {
      // await is only here, inside the async function
      const res = await fetch(`/api/notes/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const resData = await res.json();
      console.log("Response:", resData);
    } catch (err) {
      console.error(err);
      console.log(data, itemId);
    } finally {
      setIsEditingId("");
      setTitle("");
      setContent("");
      getNotes();
    }
  };

  return (
    <>
      <button onClick={getNotes} disabled={loading}>
        {loading ? "Fetching notes..." : "Fetch notes"}
      </button>
      {notes && (
        <div className="note-container">
          {notes.map((item, index) =>
            isEditingId == item.id ? (
              <div className="note-card" key={index}>
                <input
                  name="itemTitle"
                  type="text"
                  value={title}
                  style={{
                    width: "90%",
                    textAlign: "center",
                    padding: ".5rem",
                    marginTop: "1rem",
                    color: "black",
                    fontWeight: "bolder",
                  }}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <div className="line"></div>
                <textarea
                  ref={textareaRef}
                  name="itemContent"
                  value={content}
                  style={{
                    width: "90%",
                    marginTop: "10px",
                    resize: "none",
                    overflow: "hidden",
                    fontSize: "1rem",
                    padding: "1rem",
                  }}
                  wrap="soft"
                  onChange={(e) => setContent(e.target.value)}
                />
                <div className="note-buttons-container">
                  <div
                    className="button-edit-save"
                    onClick={() => saveNote(title, content, item.id)}
                  ></div>
                  <div
                    className="button-edit-cancel"
                    onClick={() => {
                      setIsEditingId("");
                      setTitle(""), setContent("");
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div key={index} className="note-card">
                <div className="note-title">{item.title}</div>
                <div className="line"></div>
                <div className="note-content">{item.content}</div>
                <div className="note-buttons-container">
                  <div
                    className="button-edit"
                    onClick={() => editNote(item.title, item.content, item.id)}
                  ></div>
                  <div
                    className="button-delete"
                    onClick={() => deleteNote(item.id)}
                  ></div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </>
  );
}
