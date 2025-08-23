import './App.css'
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from "./context/AuthContext.jsx";
import SummarizeNotes from "./components/SummarizeNotes";
import Navbar from './components/Navbar';
import Login from './pages/Login'
import Signup from './pages/Signup'
import Notes from './pages/Notes'

const ProtectedRoute = ({ children }) => {
  const { loading, isLoggedIn } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <main>
      <Navbar />
      <Routes>
        <Route path="/" element={<SummarizeNotes />} />
        <Route path="/notes" element={
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
          } />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>

    </main>
  )
}

export default App
