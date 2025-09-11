// fetchInterceptor.js
import { navigate } from "./navigate";
// utils/fetchInterceptor.js
const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

function normalizeUrl(input) {
  if (/^https?:\/\//i.test(input)) return input; // absolute URL → leave as is

  // Ensure exactly one slash between base and path
  const base = API_BASE.replace(/\/+$/, "");
  const path = input.replace(/^\/+/, "");
  return `${base}/${path}`;
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
