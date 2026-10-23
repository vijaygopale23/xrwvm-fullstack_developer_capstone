import React, { useState } from "react";
import "./Login.css";
import Header from "../Header/Header";

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("/djangoapp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, password }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== "Authenticated") {
        throw new Error(result.error || "The user could not be authenticated.");
      }
      sessionStorage.setItem("username", result.userName);
      sessionStorage.setItem("firstname", result.firstName);
      sessionStorage.setItem("lastname", result.lastName);
      window.location.assign("/");
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <div>
      <Header />
      <form className="login_panel" onSubmit={handleSubmit}>
        <div>
          <label className="input_field" htmlFor="username">Username</label>
          <input id="username" name="username" placeholder="Username" className="input_field" value={userName} onChange={(event) => setUserName(event.target.value)} required />
        </div>
        <div>
          <label className="input_field" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Password" className="input_field" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </div>
        {error && <p role="alert">{error}</p>}
        <div>
          <button className="action_button" type="submit">Login</button>
          <a className="action_button" href="/">Cancel</a>
        </div>
        <a className="loginlink" href="/register">Register Now</a>
      </form>
    </div>
  );
};

export default Login;
