import { useState } from "react";

export default function Signup() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSignup(e) {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/auth/signup", {
                method: "POST",
                headers: { "Content-type": "application/json"},
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            alert(data.message || "Signup successful!");
        } catch (err) {
            console.error(err);
            alert("Signup failed")
        }
    }

    return (
        <form onSubmit={handleSignup}>
            <h2>Signup</h2>
            <input 
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
            />
            <br />
            <input 
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
            />
            <br />
            <button type="submit">Signup</button>
        </form>
    )
}