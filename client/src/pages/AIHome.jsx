import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Select from "react-select";
import RenderNote from "@/components/Notes/RenderNote";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import DOMPurify from "dompurify";

const API_BASE = import.meta.env.VITE_API_URL;

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
      const res = await fetch(`${API_BASE}/api/ai/summarize`, {
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
      const res = await fetch(`${API_BASE}/api/ai/ask`, {
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
      const res = await fetch(`${API_BASE}/api/notes/groups`, {
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
      alert(err);
      setGroups([]);
    } finally {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
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
      const res = await fetch(`${API_BASE}/api/notes`, {
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
      alert(err);
    } finally {
      alert(`Created a note under the title: ${AiTitle}`);
      setTitle("");
      setIsCreatingNote(false);
      setCreatingNote(false);
    }
  };

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (!e.shiftKey) {
        // Enter without Shift → submit
        e.preventDefault();
        handleQuestion();
      }
      // Shift+Enter → let it create a new line
    }
  }

  function decodeHtml(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  return (
    <div class="flex flex-col items-center">
      <form
        onSubmit={handleQuestion}
        class="flex flex-col gap-2 h-fit items-center mt-5 w-full"
      >
        <Textarea
          type="text"
          onChange={(e) => {
            setQuestion(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          class="w-full max-w-250 h-50 pl-5 pr-5 pt-3 border-4 rounded-2xl resize-none"
          name="question"
          id="question"
        />
        <span class="opacity-50">
          Hint: Press ENTER to submit a question, SHIFT+ENTER to create a new
          line
        </span>
        <br />
        <button
          onClick={handleQuestion}
          disabled={loadingQuestion}
          class="w-fit"
        >
          {loadingQuestion ? "Answering question..." : "Ask Question"}
        </button>
      </form>
      <div className="notes">
        {answer && (
          <div class="summary">
            <div
              class="summary-answer"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(decodeHtml(answer), {
                  USE_PROFILES: { html: true }
                }),
              }}
            >
              {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown> */}
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
                  <Input
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
                      menuPlacement="top"
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
                <div style={{ display: "flex", gap: "1rem" }}>
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
