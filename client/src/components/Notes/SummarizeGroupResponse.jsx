import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGroupSummary } from "../../context/GroupsSummaryContext";
import Select from "react-select";
import { useEffect, useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import DOMPurify from "dompurify";
import he from "he";

export default function SummarizeGroupResponse({
  creatingNote,
  isCreatingNote,
  setIsCreatingNote,
  title,
  setTitle,
  setGroupsToAdd,
  addNote,
  getNotes,
  selectIsDisabled,
  selectIsLoading,
  createNoteTitle,
}) {
  const {
    summarizeGroupsResponse,
    setSummarizeGroupsResponse,
    groupsSelected,
    setGroupsSelected,
    groups,
    setGroups,
  } = useGroupSummary();
  
  const [sanitizedHtml, setSanitizedHtml] = useState("");

  useEffect(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, [addNote]);

  useEffect(() => {
    if (!summarizeGroupsResponse) return;
    // decode HTML entities -> sanitize -> set state
    const decoded = he.decode(summarizeGroupsResponse);
    const clean = DOMPurify.sanitize(decoded, { USE_PROFILES: { html: true } });
    setSanitizedHtml(clean);
  }, [summarizeGroupsResponse]);

  return (
    <div className="summary">
      <div
        class="w-full p-3 border-b-2 border-gray-500"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      ></div>
      {isCreatingNote ? null : (
        <button class="w-fit ml-3" onClick={() => setIsCreatingNote(true)}>
          Create a new note
        </button>
      )}
      {isCreatingNote ? (
        <div class="ml-3 flex flex-col gap-2">
          <button
            onClick={createNoteTitle}
            disabled={creatingNote}
            class="w-fit mb-3"
          >
            Let AI handle it...
          </button>
          <label htmlFor="title">Title:</label>
          <Input
            name="title"
            type="text"
            placeholder="Title..."
            style={{ width: "20rem" }}
            onChange={(e) => setTitle(e.target.value)}
          />
          <label>
            Groups:
            <Select
              options={groups}
              defaultValue={groupsSelected}
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
                  width: "20rem",
                }),
              }}
            />
          </label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              class="w-fit ml-3"
              onClick={() => {
                addNote(title, summarizeGroupsResponse);
              }}
            >
              Create new note
            </button>
            <button onClick={() => setIsCreatingNote(false)} class="w-fit ml-3">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <button
        class="w-fit ml-3"
        onClick={() => {
          setSummarizeGroupsResponse(null), getNotes();
        }}
      >
        Return
      </button>
    </div>
  );
}
