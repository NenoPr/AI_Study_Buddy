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
    if (token) {
      fetchNotes();
      fetchGroups();
    }
  }, [token]);

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
    try {
      if (!token) return;
      const res = await fetch("/api/notes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("token")}`, <-- old way
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // console.log(data);
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    }
    fetchGroups();
  };

  const addNoteToState = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
  };

  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];

  const fetchNotesGroups = async (e) => {
    if (!e[0]) {
      fetchNotes()
      return
    }
    setIsDisabled(true);
    setIsLoading(true);
    console.log("e: ",e[0].id)
    try {
      if (!token) return;
      const res = await fetch(`/api/notes/groupNotes/${e[0].id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // console.log(data);
      setNotes(data.notes || []);
    } catch (err) {
      console.error(err);
      setNotes([]);
    } finally {
      setIsDisabled(false);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div onClick={fetchGroups}>Fetch Groups</div>
      <br />
      <AddNote onNoteAdded={addNoteToState} refreshNotes={fetchNotes} />
      <br />
      <Select
        options={groups}
        isMulti
        isDisabled={isDisabled}
        isLoading={isLoading}
        onChange={fetchNotesGroups}
      />
      <br />
      <ShowNotes
        notes={notes}
        refreshNotes={fetchNotes}
        onNoteAdded={addNoteToState}
      />
    </div>
  );
}
