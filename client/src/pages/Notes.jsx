import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Select from "react-select";
import AddNote from "../components/Notes/AddNote";
import ShowNotes from "../components/Notes/ShowNotes";
import "../css/notes.css";

export default function NotesPage() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotes();
    fetchGroups();
  }, []);

  // useEffect(() => {
  //   console.log("use effect groups: ", groups)
  // },[groups])

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
            value: group.name.replace("-", "").toLowerCase(),
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

  // Fetch notes only when token is ready
  const fetchNotes = async () => {
    const controller = new AbortController();
    try {
      const res = await fetch("/api/notes", {
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
      setNotes([]);
    }
    await fetchGroups();
    // cleanup — runs when component unmounts
    return () => controller.abort();
  };

  const addNoteToState = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const fetchNotesGroups = async (selected) => {
    console.log("selected", selected)
    const controller = new AbortController();
    if (!selected || selected.length === 0) {
      await fetchNotes();
      return;
    }
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    console.log("groupIds: ", groupIds);
    setIsDisabled(true);
    setIsLoading(true);

    try {
      const requests = groupIds.map((id) =>
        fetch(`/api/notes/groupNotes/${id}`, {
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
      setNotes([]);
    } finally {
      setIsDisabled(false);
      setIsLoading(false);
      return () => controller.abort();
    }
  };

  return (
    <div>
      <br />
      <AddNote
        onNoteAdded={addNoteToState}
        refreshNotes={fetchNotes}
        selectGroups={groups}
      />
      <br />
      <div>
        <span>Groups</span>
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
              width: "50%",
              margin: "0 auto",
            }),
          }}
        />
      </div>
      <br />
      <ShowNotes
        notes={notes}
        refreshNotes={fetchNotes}
        onNoteAdded={addNoteToState}
        selectGroups={groups}
      />
    </div>
  );
}
