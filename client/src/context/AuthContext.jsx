import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("checking"); // "checking" | "authed" | "guest"
  const [user, setUser] = useState(null);


  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      const data = await res.json();
      setUser(data.user);
      setStatus("authed");
    } catch {
      setUser(null);
      setStatus("guest");
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
    setLoading(false); // token loaded
  }, []);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    checkAuth();
  };

  // frontend logout function in AuthContext
  const logout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Login failed");
    setUser(null);
    setStatus("guest"); // <-- important: mark as guest
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, status, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
