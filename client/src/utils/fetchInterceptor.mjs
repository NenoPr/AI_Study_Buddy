// fetchInterceptor.js
import { navigate } from "./navigate";
// utils/fetchInterceptor.js
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

function normalizeUrl(input) {
  // If full absolute URL (http/https), return as is
  if (/^https?:\/\//i.test(input)) return input;

  // Otherwise, prepend API_BASE
  return `${API_BASE}${input.startsWith("/") ? input : "/" + input}`;
}

const originalFetch = window.fetch;
let isRedirecting = false;

window.fetch = async (...args) => {
  let url = args[0];
  if (typeof url === "string") {
    url = normalizeUrl(url);
    args[0] = url;
  }
  url = normalizeUrl(url);

  const res = await originalFetch(...args);

  if (res.status === 401 && !isRedirecting) {
    isRedirecting = true;

    // cleanup if needed
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // smooth React Router redirect
    navigate("/login", { replace: true });
  }

  return res;
};
