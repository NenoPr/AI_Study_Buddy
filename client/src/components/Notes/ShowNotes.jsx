import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRef, useEffect } from "react";
import { useQuizContext } from "../../context/QuizContext";
import { useLoadingContext } from "@/context/loadingContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";
import AddNote from "./AddNote";
import SummarizeGroupResponse from "./SummarizeGroupResponse";
import Quiz from "./Quiz";
import RenderNote from "./RenderNote";
import TurndownService from "turndown";
import DOMPurify from "dompurify";
import rehypeRaw from "rehype-raw";
import { marked } from "marked";

const turndownService = new TurndownService();
const API_BASE = import.meta.env.VITE_API_URL;

export default function ShowNotes({
  notes,
  refreshNotes,
  selectGroups,
  getNotes,
  summarizeGroupsResponse,
  setSummarizeGroupsResponse,
  groupsSelected,
  onNoteAdded,
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEditingId, setIsEditingId] = useState("");
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const [addToGroup, setAddToGroup] = useState(false);
  const [groupsToAdd, setGroupsToAdd] = useState([]);
  const [activeGroups, setActiveGroups] = useState([]);
  const [creatingNote, setCreatingNote] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [addNoteBool, setAddNoteBool] = useState(false);
  const [tabs, setTabs] = useState([]);
  const { token } = useAuth();
  const textareaRef = useRef(null);
  const { quizActive, setQuizActive, quizJSON, setQuizJSON } = useQuizContext();
  const { loading, setLoading, showError, setShowError } = useLoadingContext();

  useEffect(() => {
    console.log("activeGroups: ", activeGroups[0]);
  }, [activeGroups]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [content]);

  useEffect(() => {}, [summarizeGroupsResponse]);

  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notes/note/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      alert(err);
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
    setLoading(true);
    setIsEditingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/ai/summarize/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();
      setSummarizeGroupsResponse(data.summary);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
      setIsEditingId("");
    }
  };

  const createQuiz = async (id) => {
    setLoading(true);
    setIsEditingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/ai/createQuiz/${id}`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      const dataJSON = JSON.parse(data);
      setQuizJSON(dataJSON);

      console.log(dataJSON);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
      setIsEditingId("");
      setQuizActive(true);
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
    console.log("tit", data.title);
    console.log("cont", data.content);
    // console.log(itemId, title, content);
    try {
      const res = await fetch(`${API_BASE}/api/notes/note/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const resData = await res.json();
      console.log("Response:", resData);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setIsEditingNote(false);
      getNotes();
    }
  };

  const getNotesGroups = async () => {
    if (addToGroup) {
      setAddToGroup(false);
      setActiveGroups([]);
      return;
    }
    console.log(isEditingId);
    // Get groups that the note belongs in
    try {
      const res = await fetch(
        `${API_BASE}/api/notes/groupNotes/note/group/${isEditingId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      console.log("Notes groups data: ", data);
      data.groups.map((group) => {
        setActiveGroups((prev) => [
          {
            label: group.name,
            value: group.name,
            id: group.id,
          },
          ...prev,
        ]);
      });
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setAddToGroup(true);
    }
  };

  const updateNoteGroups = async (e) => {
    e.preventDefault();
    console.log("Data update Note groups: ", groupsToAdd);
    console.log("Editing ID: ", isEditingId);

    const controller = new AbortController();

    try {
      // Add all groups it belongs to
      const results = await fetch(`${API_BASE}/api/notes/groupNotes/update`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ note_id: isEditingId, group_ids: groupsToAdd }),
        credentials: "include",
        signal: controller.signal,
      });
      if (!results.ok) throw new Error(`Insert error ${results.status}`);

      console.log("Response:", results);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      if (!noteOpen) {
        setIsEditingId("");
        setTitle("");
        setContent("");
        getNotes();
      }
      setGroupsToAdd([]);
      setAddToGroup(false);
      getNotesGroups();
    }
    return () => controller.abort();
  };

  const createNoteTitle = async () => {
    setCreatingNote(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/createNote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: summarizeGroupsResponse }),
        credentials: "include",
      });

      const resData = await res.json();
      addNote(resData.answer, summarizeGroupsResponse);
    } catch (err) {
      console.error(err);
      alert("Error creating note...");
    } finally {
    }
  };

  const addNote = async (AiTitle, content) => {
    setCreatingNote(true);
    const groupIds = groupsSelected.map((g) => Number(g.id)).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: AiTitle,
          content: content,
          groups: groupIds,
        }),
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      alert(`Created a note under the title: ${AiTitle}`);
      setTitle("");
      setIsCreatingNote(false);
      setCreatingNote(false);
    }
  };

  return (
    <div className="notes">
      {addNoteBool ? (
        <AddNote
          setAddNoteBool={setAddNoteBool}
          onNoteAdded={onNoteAdded}
          refreshNotes={refreshNotes}
          selectGroups={selectGroups}
          setIsEditingNote={setIsEditingNote}
        />
      ) : summarizeGroupsResponse ? (
        <SummarizeGroupResponse
          creatingNote={creatingNote}
          isCreatingNote={isCreatingNote}
          setIsCreatingNote={setIsCreatingNote}
          title={title}
          setTitle={setTitle}
          setGroupsToAdd={setGroupsToAdd}
          addNote={addNote}
          getNotes={getNotes}
          selectIsDisabled={selectIsDisabled}
          selectIsLoading={selectIsLoading}
          createNoteTitle={createNoteTitle}
        />
      ) : quizActive ? (
        <Quiz quizJSON={quizJSON} setQuizActive={setQuizActive} />
      ) : (
        // Renders note edit screen
        noteOpen && (
          <div className="note-open">
            {isEditingNote ? (
              <>
                <div className="note-open-buttons">
                  <div
                    className="button-edit-save button-note"
                    onClick={() => saveNote(title, content, isEditingId)}
                  ></div>
                  <div
                    className="button-edit-cancel button-note"
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
                  // useRef={textareaRef}
                />
              </>
            ) : (
              <>
                <div className="note-open-buttons">
                  {deletingNoteId == isEditingId ? (
                    <>
                      <span style={{ alignSelf: "center" }}>Are you sure?</span>
                      <button
                        onClick={() => {
                          setAddToGroup(false);
                          setActiveGroups([]);
                          deleteNote(isEditingId);
                        }}
                      >
                        Yes
                      </button>
                      <button onClick={() => setDeletingNoteId(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <div
                        className="button-groups button-note"
                        onClick={getNotesGroups}
                      ></div>
                      <div
                        className="button-edit-save button-note"
                        onClick={() => {
                          saveNote(title, content, isEditingId);
                        }}
                      ></div>
                      <div
                        className="button-delete button-note"
                        onClick={() => {
                          setDeletingNoteId(isEditingId);
                        }}
                      ></div>
                      <div
                        className="button-edit-cancel button-note"
                        onClick={() => {
                          setIsEditingId("");
                          setTitle("");
                          setContent("");
                          setNoteOpen(false);
                          setIsEditingNote(false);
                          setAddToGroup(false);
                          setActiveGroups([]);
                          getNotes();
                        }}
                      ></div>
                    </>
                  )}
                </div>
                {addToGroup && (
                  <>
                    <form
                      onSubmit={updateNoteGroups}
                      className="flex flex-col gap-5"
                    >
                      <Select
                        options={selectGroups}
                        defaultValue={activeGroups}
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
                        Update notes groups
                      </button>
                    </form>
                  </>
                )}
                <RenderNote
                  title={title}
                  setTitle={setTitle}
                  content={content}
                  setContent={setContent}
                />
              </>
            )}
          </div>
        )
      )}
      {/* Renders all selected notes  */}
      {loading ? (
        <div className="flex self-center">Loading...</div>
      ) : (
        notes &&
        !noteOpen &&
        !summarizeGroupsResponse &&
        !addNoteBool &&
        !quizActive && (
          <div className="note-container">
            <div className="note-card">
              <div
                className="note-contents note-add"
                onClick={() => {
                  setAddNoteBool(true);
                }}
              ></div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
                className="note-add-words"
              >
                Add note
              </div>
            </div>
            {notes.map((item, index) => (
              <div key={index} className="note-card">
                <div
                  className="note-contents"
                  onClick={() => {
                    editNote(item.title, item.content, item.id);
                    setNoteOpen(true);
                  }}
                >
                  <div>
                    <div
                      className="note-title"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(item.title),
                      }}
                    ></div>
                    <div className="line"></div>
                  </div>
                  <div
                    className="note-content"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(item.content),
                    }}
                  ></div>
                </div>
                <div className="note-buttons-container">
                  {deletingNoteId == item.id ? (
                    <>
                      <span style={{ alignSelf: "center" }}>Are you sure?</span>
                      <button onClick={() => deleteNote(item.id)}>Yes</button>
                      <button onClick={() => setDeletingNoteId(null)}>
                        No
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="button-summarize-note"
                        onClick={() => {
                          summarizeNote(item.id);
                        }}
                        disabled={loading}
                      >
                        {loading && isEditingId == item.id
                          ? "Summarizing note..."
                          : "Summarize"}
                      </button>
                      <button
                        className="button-quiz-note"
                        onClick={() => createQuiz(item.id)}
                        disabled={loading}
                      >
                        {loading && isEditingId == item.id
                          ? "Quizing note..."
                          : "Quiz"}
                      </button>
                      {loading ? null : (
                        <button
                          className="button-delete"
                          disabled={loading}
                          onClick={() => setDeletingNoteId(item.id)}
                        ></button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
