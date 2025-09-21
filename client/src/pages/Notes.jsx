import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGroupSummary } from "../context/GroupsSummaryContext";
import Select from "react-select";
import AddNote from "../components/Notes/AddNote";
import AddGroup from "../components/Notes/AddGroups";
import DeleteGroup from "../components/Notes/DeleteGroup";
import ShowNotes from "../components/Notes/ShowNotes";
import "../css/notes.css";
import { useQuizContext } from "../context/QuizContext";
import { useLoadingContext } from "@/context/loadingContext";
const API_BASE = import.meta.env.VITE_API_URL;

export default function NotesPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  // const [groups, setGroups] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const {
    summarizeGroupsResponse,
    setSummarizeGroupsResponse,
    groupsSelected,
    setGroupsSelected,
    groups,
    setGroups,
  } = useGroupSummary();
  const { quizActive, setQuizActive, quizJSON, setQuizJSON } = useQuizContext();
  const { loading, setLoading } = useLoadingContext();

  // const [groupsSelected, setGroupsSelected] = useState(null);
  // const [summarizeGroupsResponse, setSummarizeGroupsResponse] = useState("")

  useEffect(() => {
    fetchNotes();
    fetchGroups();
  }, []);

  const getNotes = async () => {
    setLoading(true);
    fetchNotesGroups(groupsSelected);
    setLoading(false);
  };

  // Fetch notes only when token is ready
  const fetchNotes = async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notes`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("token")}`, <-- old way
        },
        credentials: "include",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // console.log(data);
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      alert(err)
      setNotes([]);
    }
    await fetchGroups();
    // cleanup — runs when component unmounts
    return () => controller.abort();
  };

  const addNoteToState = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
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
      alert(err)
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesGroups = async (selected) => {
    console.log("selected", selected);
    setGroupsSelected(selected);
    setLoading(true);
    if (!selected || selected.length === 0) {
      await fetchNotes();
      return;
    }
    const controller = new AbortController();
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    console.log("groupIds: ", groupIds);
    setIsDisabled(true);
    setIsLoading(true);

    try {
      const requests = groupIds.map((id) =>
        fetch(`${API_BASE}/api/notes/groupNotes/${id}`, {
          method: "GET",
          credentials: "include",
          signal: controller.signal,
        }).then((res) => {
          if (!res.ok) throw new Error(`Error ${res.status}`);
          return res.json(); // expect { notes: [...] }
        })
      );

      // Wait for all to finish
      const results = await Promise.all(requests);
      // Merge all notes into one flat array
      // results is [{notes: [...]}, {notes: [...]}, ...]
      const merged = results.flatMap((r) => r.notes ?? []);
      // (Optional) de-dupe by id if the same note can appear in multiple groups
      const deduped = Array.from(
        new Map(merged.map((n) => [n.id, n])).values()
      );
      // Single state update
      setNotes(deduped);
    } catch (err) {
      console.error(err);
      alert(err)
      setNotes([]);
    } finally {
      setIsDisabled(false);
      setIsLoading(false);
      setLoading(false);
      return () => controller.abort();
    }
  };

  const summarizeGroups = async () => {
    if (!groupsSelected || groupsSelected.length === 0) {
      return;
    }
    const controller = new AbortController();
    const groupIds = groupsSelected.map((g) => Number(g.id)).filter(Boolean);
    setIsDisabled(true);
    setIsLoading(true);
    setLoadingGroups(true);
    setLoadingNotes(false);
    setLoading(true);
    console.log("groupIds: ", groupIds);

    try {
      const request = await fetch(`${API_BASE}/api/ai/summarize/groupNotes`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ group_ids: groupIds }),
        credentials: "include",
        signal: controller.signal,
      });
      if (!request.ok) throw new Error(`Error ${request.status}`);

      // Wait for all to finish
      const results = await request.json();
      console.log("Response: ", results);
      setSummarizeGroupsResponse(results.summary);
    } catch (err) {
      console.error(err);
      alert(err)
    } finally {
      setIsDisabled(false);
      setIsLoading(false);
      setLoadingGroups(false);
      setLoadingNotes(false);
      setLoading(false);
      return () => controller.abort();
    }
  };

  const createQuizGroups = async (id) => {
    setLoading(true);
    // setIsEditingId(id);
    const groupIds = groupsSelected.map((g) => Number(g.id)).filter(Boolean);
    try {
      const res = await fetch(`${API_BASE}/api/ai/createQuiz/group`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ groups: groupIds }),
        credentials: "include",
      });

      const data = await res.json();
      const dataJSON = JSON.parse(data);
      setQuizJSON(dataJSON);

      console.log(dataJSON);
    } catch (err) {
      console.error(err);
      alert(err)
    } finally {
      setLoading(false);
      setQuizActive(true);
      // setIsEditingId("");
    }
  };

  return (
    <div>
      <div class="flex flex-row justify-center m-5 gap-3">
        {/* <AddNote
          onNoteAdded={addNoteToState}
          refreshNotes={fetchNotes}
          selectGroups={groups}
          setActiveComponent={setActiveComponent}
          activeComponent={activeComponent}
        /> */}

        <AddGroup
          fetchGroups={fetchGroups}
          setActiveComponent={setActiveComponent}
          activeComponent={activeComponent}
        />

        <DeleteGroup
          selectGroups={groups}
          fetchGroups={fetchGroups}
          setActiveComponent={setActiveComponent}
          activeComponent={activeComponent}
        />
      </div>
      <div
        style={{
          border: "1px solid black",
          marginBottom: "1rem",
          marginTop: "1rem",
        }}
      ></div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <div class="font-bold">Groups: </div>
        <div class="w-full sm:w-100">
          <Select
            options={groups}
            isMulti
            isDisabled={isDisabled}
            isLoading={isLoading}
            onChange={fetchNotesGroups}
            styles={{
              control: (baseStyles, state) => ({
                ...baseStyles,
                borderColor: state.isFocused ? "grey" : "red",
                flexGrow: "1",
                width: "100%",
              }),
            }}
          />
        </div>
        <button onClick={getNotes} disabled={loading}>
          {loadingNotes ? "Fetching notes..." : "Fetch notes"}
        </button>
        <button onClick={summarizeGroups} disabled={loading}>
          {loadingGroups
            ? "Summarizing groups..."
            : "Summarize selected groups"}
        </button>
        <button disabled={loading} onClick={createQuizGroups}>
          {loadingGroups
            ? "Creating quiz..."
            : "Create a quiz from selected groups"}
        </button>
        {/* <div  class="sm:flex sm:justify-end sm:flex-1">
          <button class="w-full sm:w-fit">Sort By:</button>
        </div> */}
      </div>
      <div
        style={{
          border: "1px solid black",
          marginBottom: "1rem",
          marginTop: "1rem",
        }}
      ></div>
      <ShowNotes
        notes={notes}
        refreshNotes={fetchNotes}
        onNoteAdded={addNoteToState}
        selectGroups={groups}
        fetchNotesGroups={fetchNotesGroups}
        getNotes={getNotes}
        summarizeGroupsResponse={summarizeGroupsResponse}
        setSummarizeGroupsResponse={setSummarizeGroupsResponse}
        groupsSelected={groupsSelected}
      />
    </div>
  );
}
