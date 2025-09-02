// fetchInterceptor.js
import { navigate } from "./navigate";

const originalFetch = window.fetch;
let isRedirecting = false;

window.fetch = async (...args) => {
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
