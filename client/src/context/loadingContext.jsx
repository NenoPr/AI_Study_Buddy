// context/SummaryContext.jsx
import { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState("")

  return (
    <LoadingContext.Provider
      value={{ loading, setLoading, showError, setShowError }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoadingContext() {
  return useContext(LoadingContext);
}
