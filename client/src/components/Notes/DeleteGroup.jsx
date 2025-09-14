import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Select from "react-select";
const API_BASE = import.meta.env.VITE_API_URL;


export default function AddNote({ selectGroups, fetchGroups, setActiveComponent, activeComponent }) {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([])
  const [groupDelete, setGroupDelete] = useState(false);
  const { token } = useAuth();

  if (activeComponent && activeComponent !== "groupDelete") return


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
      console.log(data)
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setGroupDelete(false);
      setGroups([]);
      setActiveComponent(null)
      fetchGroups();
    }
  };
  
  function updateGroups(selected) {
    const groupIds = selected.map((g) => Number(g.id)).filter(Boolean);
    setGroups(groupIds)
  }

  return (
    <div>
      {groupDelete ? (<>
        <h3>Delete Groups</h3>
        <form onSubmit={deleteGroups} name="deleteGroups">
          <h4>Select groups to delete</h4>
          <Select
          options={selectGroups}
          isMulti
          styles={{
            control: (baseStyles, state) => ({
              ...baseStyles,
              borderColor: state.isFocused ? "grey" : "red",
              width: "50%",
              margin: "0 auto",
            }),
          }}
          onChange={updateGroups}
        />
          <br />
          <button type="submit" disabled={loading}>
            {loading ? "Deleting groups..." : "Delete groups"}
          </button>
          <button onClick={() => {setGroupDelete(false), setActiveComponent(null)}}>Cancel</button>
        </form>
            </>
      ) : (
        <button onClick={() => {setGroupDelete(true); setActiveComponent("groupDelete")}}>Delete Group</button>
      )}
    </div>
  );
}
