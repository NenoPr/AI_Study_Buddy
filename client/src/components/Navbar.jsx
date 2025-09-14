import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Navbar() {
  const { logout, status, user } = useAuth();

  return (
    <nav class="p-2 w-fill rounded-2xl bg-gray-200">
      <Link to="/" style={{ marginRight: "10px" }}>
        AI
      </Link>
      <Link to="/notes" style={{ marginRight: "10px" }}>
        Notes
      </Link>
      {status == "authed" ? (
        <>
          <Link
            onClick={() => {
              logout();
            }}
            to="/login"
          >
            Logout
          </Link>
          <div>Hello {user?.email}!</div>
        </>
      ) : (
        <>
          <Link to="/login" style={{ marginRight: "10px" }}>
            Login
          </Link>
          <Link to="/signup" style={{ marginRight: "10px" }}>
            Sign up
          </Link>
        </>
      )}
    </nav>
  );
}
