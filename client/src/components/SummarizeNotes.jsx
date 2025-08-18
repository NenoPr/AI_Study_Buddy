import { useState } from "react";

export default function SummarizeNotes({ token }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ This function is async
  const handleSummarize = async () => {
    setLoading(true);
    setSummary("");

    try {
      // await is only here, inside the async function
      const res = await fetch("/ai/summarize", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setSummary(data.summary || "No summary returned.");
    } catch (err) {
      console.error(err);
      setSummary("Error summarizing notes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleSummarize} disabled={loading}>
        {loading ? "Summarizing..." : "Summarize Notes"}
      </button>
      {summary && (
        <div style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>
          {summary}
        </div>
      )}
    </div>
  );
}
