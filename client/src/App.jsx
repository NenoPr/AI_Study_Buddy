import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import SummarizeNotes from "./components/SummarizeNotes";

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
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
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
      </p>
    </>
  )
}

export default App
