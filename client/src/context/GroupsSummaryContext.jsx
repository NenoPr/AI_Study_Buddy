// context/SummaryContext.jsx
import { createContext, useContext, useState } from "react";

const GroupsSummaryContext = createContext();

export function GroupSummaryProvider({ children }) {
  const [summarizeGroupsResponse, setSummarizeGroupsResponse] = useState("");
  const [groupsSelected, setGroupsSelected] = useState(null);
  const [groups, setGroups] = useState([]);
  return (
    <GroupsSummaryContext.Provider value={{ summarizeGroupsResponse, setSummarizeGroupsResponse, groupsSelected, setGroupsSelected, groups, setGroups }}>
      {children}
    </GroupsSummaryContext.Provider>
  );
}

export function useGroupSummary() {
  return useContext(GroupsSummaryContext);
}
