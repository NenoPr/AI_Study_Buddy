import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "10px", background: "#eee" }}>
      <Link to="/" style={{ marginRight: "10px" }}>
        Home
      </Link>
      <Link to="/login" style={{ marginRight: "10px" }}>
        Login
      </Link>
      <Link to="/signup">
        Sign up
      </Link>
    </nav>
  );
}
