import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import "../css/spinner.css"

const API_BASE = import.meta.env.VITE_API_URL;

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpFail, setSignUpFail] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setSignUpFail(false);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      alert(data.message || "Signup successful!");
    } catch (err) {
      console.error(err);
      setSignUpFail(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div class="flex justify-center">
      <form onSubmit={handleSignup} class="flex flex-col gap-5 mt-2">
        <h2 class="font-extrabold">Signup</h2>

        {loading ? (
          <div className="spinner-container">
            <p>Singing in...</p>
            {/* From Uiverse.io by mrhyddenn  */}
            <div class="spinner center">
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
              <div class="spinner-blade"></div>
            </div>
          </div>
        ) : (
          <>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" variant="outline">
              Signup
            </Button>

            {signUpFail && <p>Sign up failed...</p>}
          </>
        )}
      </form>
    </div>
  );
}
