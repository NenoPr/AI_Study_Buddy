import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";
const API_BASE = import.meta.env.VITE_API_URL;


export default function AddNote({
  refreshNotes,
  onNoteAdded,
  selectGroups,
  setActiveComponent,
  activeComponent,
  setAddNoteBool,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groups, setGroups] = useState("");
  const [loading, setLoading] = useState(false);
  const [noteAdd, setNoteAdd] = useState(false);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const { token } = useAuth();

  // ✅ This function is async
  const addNote = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // await is only here, inside the async function
      const res = await fetch(`/${API_BASE}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, groups }),
        credentials: "include",
      });
      const data = await res.json();
      if (data) {
        //onNoteAdded(data); // ✅ push new note into parent state
        refreshNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setNoteAdd(false);
      setTitle("");
      setContent("");
      setAddNoteBool(false)
      // refreshNotes();
    }
  };

  function updateGroups(selected) {
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    setGroups(groupIds);
  }

  return (
    <div className="note-open">
      <form onSubmit={addNote} name="addNote">
        <>
          <h4>Title</h4>
          <input
            className="note-open-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <h4>Content</h4>
          <textarea
            className="note-open-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            // useRef={textareaRef}
          />
        </>
        <br />
        <h4>Groups</h4>
        <Select
          options={selectGroups}
          isMulti
          isDisabled={selectIsDisabled}
          isLoading={selectIsLoading}
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              borderColor: state.isFocused ? "grey" : "red",
              width: "50%",
              margin: "0 auto",
            }),
          }}
          onChange={updateGroups}
        />
        <br />
        <div className="buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Adding note..." : "Add note"}
          </button>
          <button
            disabled={loading}
            onClick={() => {
              setNoteAdd(false);
              setAddNoteBool(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

//   <button
//     onClick={() => {
//       setNoteAdd(true);
//       setActiveComponent("addNote");
//     }}
//   >
//     Add Note
//   </button>
// )}
