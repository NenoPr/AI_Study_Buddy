import "./App.css";
import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { GroupSummaryProvider } from "./context/GroupsSummaryContext.jsx";
import AIHome from "./components/AIHome.jsx";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notes from "./pages/Notes";
import { setNavigate } from "./utils/navigate.js";
import "./utils/fetchInterceptor.mjs";

const ProtectedRoute = ({ children }) => {
  const { status } = useAuth();
  console.log("ProtectedRoute status:", status);

  if (status === "checking") return <p>Loading...</p>; // don’t redirect yet
  if (status === "guest") return <Navigate to="/login" replace />; // redirect if truly not logged in
  return children; // authed → show page
};

function AppWrapper() {
  const navigate = useNavigate();

  // register globally on mount
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <main>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AIHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <GroupSummaryProvider>
                <Notes />
              </GroupSummaryProvider>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </main>
  );
}

export default function App() {
  return <AppWrapper />;
}
