import "./App.css";
import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import SummarizeNotes from "./components/SummarizeNotes";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notes from "./pages/Notes";

const ProtectedRoute = ({ children }) => {
  const { status } = useAuth();
  console.log("ProtectedRoute status:", status);

  if (status === "checking") return <p>Loading...</p>; // don’t redirect yet
  if (status === "guest") return <Navigate to="/login" replace />; // redirect if truly not logged in
  return children; // authed → show page
};

function App() {
  return (
    <main>
      <Navbar />
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <SummarizeNotes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <ProtectedRoute>
              <Notes />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </main>
  );
}

export default App;
