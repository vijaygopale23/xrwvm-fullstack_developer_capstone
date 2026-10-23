import React from 'react';
import "../assets/style.css";
import "../assets/bootstrap.min.css";

const Header = () => {
  const logout = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch("/djangoapp/logout", { method: "GET" });
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      sessionStorage.clear();
      window.location.assign("/");
    } catch (error) {
      alert(error.message);
    }
  };

  const username = sessionStorage.getItem("username");
  const djangoOrigin = process.env.NODE_ENV === "development"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "";
  return (
    <nav className="navbar navbar-expand-lg navbar-light" style={{ backgroundColor: "darkturquoise", minHeight: "1in" }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="/">Dealerships</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="navbarText">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><a className="nav-link" href="/">Home</a></li>
            <li className="nav-item"><a className="nav-link" href={`${djangoOrigin}/about`}>About Us</a></li>
            <li className="nav-item"><a className="nav-link" href={`${djangoOrigin}/contact`}>Contact Us</a></li>
          </ul>
          <div className="loginlink" id="loginlogout">
            {username
              ? <><span className="username">{username}</span><a className="nav_item" href="/djangoapp/logout" onClick={logout}>Logout</a></>
              : <><a className="nav_item" href="/login">Login</a><a className="nav_item" href="/register">Register</a></>}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header
