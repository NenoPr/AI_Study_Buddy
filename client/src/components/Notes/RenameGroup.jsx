import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const API_BASE = import.meta.env.VITE_API_URL;

export default function RenameGroup({
  selectGroups,
  fetchGroups,
  setActiveComponent,
  activeComponent,
  loading,
  setLoading,
}) {
  const [group, setGroup] = useState([]);
  const [groupRename, setGroupRename] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const { token } = useAuth();

  if (activeComponent && activeComponent !== "groupRename") return;

  // ✅ This function is async
  const renameGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("groupName", newGroupName);

    try {
      // await is only here, inside the async function
      const res = await fetch(`${API_BASE}/api/notes/groups`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newGroupName, group_id: group }),
        credentials: "include",
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
      setGroupRename(false);
      setGroup([]);
      setActiveComponent(null);
      fetchGroups();
    }
  };

  function updateGroups(selected) {
    const groupId = Number(selected.id);
    setGroup(groupId);
  }

  return (
    <div>
      {!loading ? (
        groupRename ? (
          <>
            <form
              onSubmit={renameGroup}
              name="renameGroups"
              className="flex flex-col gap-5"
            >
              <h3>Rename Groups</h3>
              <div>Select a group to rename</div>
              <Select
                options={selectGroups}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    borderColor: state.isFocused ? "grey" : "red",
                    width: "100%",
                    margin: "0 auto",
                  }),
                }}
                onChange={updateGroups}
                required
              />
              <Input
                type="text"
                placeholder="Insert new name..."
                onChange={(e) => setNewGroupName(e.target.value)}
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Renaming group..." : "Rename group"}
              </button>
              <button
                onClick={() => {
                  setGroupRename(false), setActiveComponent(null);
                }}
              >
                Cancel
              </button>
            </form>
          </>
        ) : (
          <Button
            onClick={() => {
              setGroupRename(true);
              setActiveComponent("groupRename");
            }}
          >
            Rename Group
          </Button>
        )
      ) : (
        <Button disabled>Rename Group</Button>
      )}
    </div>
  );
}
