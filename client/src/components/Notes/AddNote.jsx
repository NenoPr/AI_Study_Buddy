import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";

export default function AddNote({ refreshNotes, onNoteAdded, selectGroups }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [groups, setGroups] = useState("")
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
      const res = await fetch("/api/notes", {
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

  useEffect(() => {
    console.log(groups)
  },[groups])

  function updateGroups(selected) {
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    setGroups(groupIds)
  }

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
          <h2>Groups</h2>
          <Select
            options={selectGroups}
            isMulti
            isDisabled={selectIsDisabled}
            isLoading={selectIsLoading}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? 'grey' : 'red',
                width: "50%",
                margin: "0 auto"
              }),
            }}
            onChange={updateGroups}
          />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Adding note..." : "Add note"}
          </button>
        </form>
      ) : (
        <button onClick={() => setNoteAdd(true)}>Add Note</button>
      )}
    </div>
  );
}
