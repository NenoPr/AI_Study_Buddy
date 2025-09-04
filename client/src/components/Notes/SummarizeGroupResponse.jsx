import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGroupSummary } from "../../context/GroupsSummaryContext";
import Select from "react-select";


export default function SummarizeGroupResponse(
  {creatingNote,
  isCreatingNote,
  setIsCreatingNote,
  setTitle,
  setGroupsToAdd,
  addNote,
  getNotes,
  selectIsDisabled,
  selectIsLoading,
  createNoteTitle}
) {
  const { summarizeGroupsResponse, setSummarizeGroupsResponse, groupsSelected, setGroupsSelected, groups, setGroups } = useGroupSummary();

  return (
    <div className="summary">
      <div style={{ fontWeight: "bold", fontSize: "1.5rem" }}>Response:</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {summarizeGroupsResponse}
      </ReactMarkdown>
      {isCreatingNote ? null : (
        <button
          style={{ width: "fit-content" }}
          onClick={() => setIsCreatingNote(true)}
        >
          Create a new note
        </button>
      )}
      <br />
      {isCreatingNote ? (
        <>
          <button
            onClick={createNoteTitle}
            disabled={creatingNote}
            style={{ width: "fit-content", marginBottom: "1rem" }}
          >
            Let AI handle it...
          </button>
          <label htmlFor="title">Title:</label>
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
                  width: "50%",
                }),
              }}
            />
          </label>
          <br />
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              style={{ width: "fit-content" }}
              onClick={() => addNote(title, summarizeGroupsResponse)}
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
      <br />
      <button
        style={{ width: "fit-content" }}
        onClick={() => {
          setSummarizeGroupsResponse(null), getNotes();
        }}
      >
        Return
      </button>
    </div>
  );
}
