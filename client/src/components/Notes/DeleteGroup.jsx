import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
const API_BASE = import.meta.env.VITE_API_URL;

export default function DeleteGroup({
  selectGroups,
  fetchGroups,
  setActiveComponent,
  activeComponent,
  loading,
  setLoading,
}) {
  const [groups, setGroups] = useState([]);
  const [groupDelete, setGroupDelete] = useState(false);
  const { token } = useAuth();

  if (activeComponent && activeComponent !== "groupDelete") return;

  // ✅ This function is async
  const deleteGroups = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // await is only here, inside the async function
      const res = await fetch(`${API_BASE}/api/notes/groups`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: groups }),
        credentials: "include",
      });
      const data = await res.json();
      console.log(data);
    } catch (err) {
      console.error(err);
      alert(err);
    } finally {
      setLoading(false);
      setGroupDelete(false);
      setGroups([]);
      setActiveComponent(null);
      fetchGroups();
    }
  };

  function updateGroups(selected) {
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    setGroups(groupIds);
  }

  return (
    <div>
      {!loading ? (
        groupDelete ? (
          <>
            <form
              onSubmit={deleteGroups}
              name="deleteGroups"
              className="flex flex-col gap-5"
            >
              <h3>Delete Groups</h3>
              <div>Select groups to delete</div>
              <Select
                options={selectGroups}
                isMulti
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
              <button type="submit" disabled={loading}>
                {loading ? "Deleting groups..." : "Delete groups"}
              </button>
              <button
                onClick={() => {
                  setGroupDelete(false), setActiveComponent(null);
                }}
              >
                Cancel
              </button>
            </form>
          </>
        ) : (
          <Button
            onClick={() => {
              setGroupDelete(true);
              setActiveComponent("groupDelete");
            }}
          >
            Delete Group
          </Button>
        )
      ) : (
        <Button disabled>Delete Group</Button>
      )}
    </div>
  );
}
