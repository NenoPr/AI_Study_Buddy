import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function Navbar() {
  const { logout, status, user } = useAuth();

  // useEffect(() => {

  // }, [status])
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/" style={{ marginRight: "10px" }}>
        Home
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
