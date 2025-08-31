import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";

export default function ShowNotes({ notes, refreshNotes, selectGroups }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditingId, setIsEditingId] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const [addToGroup, setAddToGroup] = useState(false);
  const [groupsToAdd, setGroupsToAdd] = useState([]);
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

  const getNotesGroups = async () => {
    if (addToGroup) {
      setAddToGroup(false);
      return;
    }
    setAddToGroup(true);
    console.log(isEditingId)
    try {
      const res = await fetch(`api/notes/groupNotes/notes/${isEditingId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("token")}`, <-- old way
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json()
      console.log("Notes groups data: ", data.groupIds)
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNote = async (id) => {
    try {
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
      setIsEditingNote(false);
      setNoteOpen(false);
      setIsEditingId("");
      setContent("");
      setTitle("");
      getNotes();
    }
  };

  const summarizeNote = async (id) => {
    try {
      const res = await fetch(`/api/ai/summarize/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();
      console.log(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
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
    // console.log(itemId, title, content);
    try {
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
      if (!noteOpen) {
        setIsEditingId("");
        setTitle("");
        setContent("");
        getNotes();
      }
      setIsEditingNote(false);
    }
  };

  const updateNoteGroups = async (e) => {
    e.preventDefault();
    console.log("Data update Note groups: ", groupsToAdd);
    const controller = new AbortController();
    try {
      const results = groupsToAdd.map((id) =>
        fetch(`/api/notes/groupNotes`, {
          method: "POST",
          headers: { "Content-type": "application/json" },
          body: JSON.stringify({ notes_ids: isEditingId, group_id: id }),
          credentials: "include",
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`Error ${res.status}`);
          return res.json(); // expect { notes: [...] }
        })
      );
      console.log("Response:", results);
    } catch (err) {
      console.error(err);
    } finally {
      if (!noteOpen) {
        setIsEditingId("");
        setTitle("");
        setContent("");
        getNotes();
      }
      setAddToGroup(false);
    }
    return () => controller.abort();
  };

  return (
    <div className="notes">
      <button onClick={getNotes} disabled={loading}>
        {loading ? "Fetching notes..." : "Fetch notes"}
      </button>
      {noteOpen && (
        <div className="note-open">
          {isEditingNote ? (
            <>
              <div className="note-open-buttons">
                <div
                  className="button-edit-save"
                  onClick={() => saveNote(title, content, isEditingId)}
                ></div>
                <div
                  className="button-edit-cancel"
                  onClick={() => {
                    setIsEditingNote(false);
                  }}
                ></div>
              </div>
              <input
                className="note-open-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="note-open-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </>
          ) : (
            <>
              <div className="note-open-buttons">
                <div className="button-groups" onClick={getNotesGroups}></div>
                <div
                  className="button-edit"
                  onClick={() => setIsEditingNote(true)}
                ></div>
                <div
                  className="button-delete"
                  onClick={() => deleteNote(isEditingId)}
                ></div>
                <div
                  className="button-edit-cancel"
                  onClick={() => {
                    setIsEditingId("");
                    setTitle(""),
                      setContent(""),
                      setNoteOpen(false),
                      setIsEditingNote(false);
                  }}
                ></div>
              </div>
              {addToGroup && (
                <>
                  <form onSubmit={updateNoteGroups}>
                    <Select
                      options={selectGroups}
                      isMulti
                      isDisabled={selectIsDisabled}
                      isLoading={selectIsLoading}
                      onChange={(data) => {
                        const groupIds = data
                          .map((data) => Number(data.id))
                          .filter(Boolean);
                        setGroupsToAdd(groupIds);
                      }}
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          borderColor: state.isFocused ? "grey" : "red",
                          width: "50%",
                          margin: "0 auto",
                        }),
                      }}
                    />
                    <button
                      style={{ width: "fit-content", alignSelf: "center" }}
                      type="submit"
                    >
                      Add this note to group/s
                    </button>
                  </form>
                </>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{title}</ReactMarkdown>
              <div style={{ border: "1px solid gray" }}></div>
              <div className="note-open-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      )}
      {notes && !noteOpen && (
        <div className="note-container">
          {notes.map((item, index) => (
            <div key={index} className="note-card">
              <div
                className="note-contents"
                onClick={() => {
                  editNote(item.title, item.content, item.id);
                  setNoteOpen(true);
                }}
              >
                <div className="note-title">{item.title}</div>
                <div className="line"></div>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {item.content}
                </ReactMarkdown>
              </div>
              <div className="note-buttons-container">
                <div
                  className="button-delete"
                  onClick={() => deleteNote(item.id)}
                ></div>
                <div
                  className="button-summarize-note"
                  onClick={() => summarizeNote(item.id)}
                >
                  Summorize
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

{
  /* <div className="note-card" key={index}>
                <input
                  className="note-title"
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
                  className="note-content"
                  ref={textareaRef}
                  name="itemContent"
                  value={content}
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
              </div> */
}

{
  /* <div
                    className="button-edit"
                    onClick={() => editNote(item.title, item.content, item.id)}
                  ></div> */
}
