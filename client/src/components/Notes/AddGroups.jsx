import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";
import { Input } from "@/components/ui/input";

const API_BASE = import.meta.env.VITE_API_URL;

export default function AddNote({
  fetchGroups,
  setActiveComponent,
  activeComponent,
}) {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [GroupAdd, setGroupAdd] = useState(false);
  const { token } = useAuth();

  if (activeComponent && activeComponent !== "addGroup") return;

  // ✅ This function is async
  const addGroup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // await is only here, inside the async function
      const res = await fetch(`${API_BASE}/api/notes/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: groupName }),
        credentials: "include",
      });
      const data = await res.json();
      if (data) {
        //onNoteAdded(data); // ✅ push new note into parent state
      }
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
      setGroupAdd(false);
      setActiveComponent(null);
      setGroupName("");
      fetchGroups();
    }
  };

  return (
    <div>
      {GroupAdd ? (
        <>
          <form
            onSubmit={addGroup}
            name="addGroup"
            className="flex flex-col gap-5"
          >
            <h3>Add Group</h3>
            <div>Group Name</div>
            <Input
              type="text"
              placeholder="Title..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Adding group..." : "Add group"}
            </button>
            <button
              onClick={() => {
                setGroupAdd(false);
                setActiveComponent(null);
              }}
            >
              Cancel
            </button>
          </form>
        </>
      ) : (
        <button
          onClick={() => {
            setGroupAdd(true);
            setActiveComponent("addGroup");
          }}
        >
          Create Group
        </button>
      )}
    </div>
  );
}
