import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SummarizeNotes from "./components/SummarizeNotes";
import Navbar from './components/Navbar';
import Login from './pages/Login'
import Signup from './pages/Signup'

function App() {
  const [count, setCount] = useState(0)
  const [token, setToken] = useState(""); // store JWT from login/signup
  const [loginStatus, setLoginStatus] = useState("");

  const handleLogIn = async (event) => {
    event.preventDefault()
    const email = event.target.email1.value
    const password = event.target.password1.value
    try {
      // await is only here, inside the async function
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email": `${email}`,
          "password": `${password}`
        })
      });

      const data = await res.json();
      data.token ? setToken(data.token) : setLoginStatus("No user was found with these credentials.")
    } catch (err) {
      console.error(err);
      setSummary("Internal server error.");
    }
  }

  function handleLogInTest(event) {
    console.log(event)
    event.preventDefault()
    const email = event.target.email1.value
    const password = event.target.password1.value
    console.log(email,password)
  }

  return (
    <main>
      <Navbar />
      <Routes>
        <Route path="/" element={<SummarizeNotes />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
      {/* <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
        {token ? (
        <SummarizeNotes token={token} />
        ) : (
          <>
          <div>Please log in and provide a JWT token.</div>
          <form onSubmit={handleLogIn}>
            <label htmlFor="">
              Email:
              <input type="email" name="email1" id="email1" /> 
            </label>
            <br />
            <label htmlFor="">
              Password:
              <input type="password" name="password1" id="password1" />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <p>{loginStatus}</p>
          </>
        )}
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </main>
  )
}

export default App
