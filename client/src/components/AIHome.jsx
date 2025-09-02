import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function AIHome() {
  const [summary, setSummary] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loadingSummarize, setLoadingSummarize] = useState(false);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
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

  const createNote = async () => {
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
      addNote(resData.answer, answer);
    } catch (err) {
      console.error(err);
      alert("Error creating note...");
    } finally {
      setCreatingNote(false);
    }
  };

  const addNote = async (title, content) => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
        credentials: "include",
      });
    } catch (err) {
      console.error(err);
    } finally {
      alert(`Created a note under the title: ${title}`);
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
      <div>
        {answer && (
          <>
            <h2 style={{ alignText: "center" }}>Answer:</h2>
            <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
              {answer}
            </div>
            <br />
            <button onClick={createNote}>
              {creatingNote
                ? "Creating note..."
                : "Create a note of this response"}
            </button>
          </>
        )}
      </div>
      <br />
    </div>
  );
}
