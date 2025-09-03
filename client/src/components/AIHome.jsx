import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";

export default function AIHome() {
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [groups, setGroups] = useState([]);
  const [groupsToAdd, setGroupsToAdd] = useState([]);
  const [title, setTitle] = useState("");
  const [loadingSummarize, setLoadingSummarize] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [selectIsDisabled, setSelectIsDisabled] = useState(false);
  const [selectIsLoading, setSelectIsLoading] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);

  const { token } = useAuth();

  // ✅ This function is async
  const handleSummarize = async () => {
    setLoadingSummarize(true);
    setSummary("");

    try {
      // await is only here, inside the async function
      const res = await fetch("/api/ai/summarize", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      const data = await res.json();
      setSummary(data.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      setSummary("Error summarizing notes.");
    } finally {
      setLoadingSummarize(false);
    }
  };

  const handleQuestion = async () => {
    setLoadingQuestion(true);
    setAnswer("");

    try {
      // await is only here, inside the async function
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: question }),
        credentials: "include",
      });

      const data = await res.json();
      setAnswer(data.answer || "No answer returned...");
    } catch (err) {
      console.error(err);
      setAnswer("Error answering question...");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/notes/groups", {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const resGroups = await res.json();
      setGroups([]);
      resGroups.groups.forEach((group) => {
        setGroups((prev) => [
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
      setGroups([]);
    }
  };

  const createNoteTitle = async () => {
    setCreatingNote(true);
    try {
      const res = await fetch("/api/ai/createNote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: answer }),
        credentials: "include",
      });

      const resData = await res.json();
      addNote(resData.answer, answer, groupsToAdd);
    } catch (err) {
      console.error(err);
      alert("Error creating note...");
    } finally {
    }
  };

  const addNote = async (AiTitle, content, groups) => {
    setCreatingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: AiTitle,
          content: content,
          groups: groups,
        }),
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      alert(`Created a note under the title: ${AiTitle}`);
      setTitle("");
      setIsCreatingNote(false);
      setCreatingNote(false);
    }
  };

  return (
    <div>
      <br />
      <button onClick={handleSummarize} disabled={loadingSummarize}>
        {loadingSummarize ? "Summarizing..." : "Summarize all Notes"}
      </button>
      <div style={{ margin: "1rem" }}></div>
      {summary && (
        <>
          <h2 style={{ alignText: "center" }}>Summary:</h2>
          <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
            {summary}
          </div>
        </>
      )}
      <br />
      <form onSubmit={handleQuestion}>
        <textarea
          type="text"
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask me anything..."
          style={{ width: "30rem", height: "5rem" }}
        />
        <br />
        <button onClick={handleQuestion} disabled={loadingQuestion}>
          {loadingQuestion ? "Answering question..." : "Ask Question"}
        </button>
      </form>
      <div className="notes">
        {answer && (
          <div className="summary">
            <h2 style={{ alignText: "center" }}>Answer:</h2>
            <div
              className="test"
              style={{ textAlign: "left", marginTop: "1rem" }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown>
            </div>
            <br />
            {isCreatingNote ? null : (
              <button
                style={{ width: "fit-content" }}
                onClick={() => {
                  setIsCreatingNote(true), fetchGroups();
                }}
              >
                Create a new note
              </button>
            )}
            {isCreatingNote ? (
              <>
                <button
                  onClick={createNoteTitle}
                  disabled={creatingNote}
                  style={{ width: "fit-content" }}
                >
                  Let AI handle it...
                </button>
                <br />
                <div style={{ width: "fit-content" }}>
                  <label htmlFor="title">Title:</label>
                  <br />
                  <input
                    name="title"
                    type="text"
                    placeholder="Title..."
                    style={{ width: "20rem" }}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <br />
                  <label>
                    Groups:
                    <Select
                      options={groups}
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
                          width: "100%",
                        }),
                      }}
                    />
                  </label>
                </div>
                <br />
                <div style={{display: "flex", gap: "1rem"}}>
                  <button
                    style={{ width: "fit-content" }}
                    onClick={() => addNote(title, answer, groupsToAdd)}
                  >
                    Create new note
                  </button>
                  <br />
                  <button
                    onClick={() => setIsCreatingNote(false)}
                    style={{ width: "fit-content" }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
      <br />
    </div>
  );
}
