import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";
import reviewIcon from "../assets/reviewicon.png";

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [states, setStates] = useState([]);
  const [error, setError] = useState("");

  const loadDealers = async (state) => {
    try {
      const endpoint = state && state !== "All"
        ? `/djangoapp/get_dealers/${encodeURIComponent(state)}`
        : "/djangoapp/get_dealers";
      const response = await fetch(endpoint);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Unable to load dealerships");
      }
      setDealersList(result.dealers);
      setError("");
      if (!state) {
        setStates(
          Array.from(new Set(result.dealers.map((dealer) => dealer.state))).sort()
        );
      }
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  const isLoggedIn = sessionStorage.getItem("username") !== null;
  return (
    <div>
      <Header />
      {error && <p role="alert">{error}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Dealer Name</th>
            <th>City</th>
            <th>Address</th>
            <th>Zip</th>
            <th>
              <select
                name="state"
                id="state"
                defaultValue=""
                onChange={(event) => loadDealers(event.target.value)}
              >
                <option value="" disabled>State</option>
                <option value="All">All States</option>
                {states.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </th>
            {isLoggedIn && <th>Review Dealer</th>}
          </tr>
        </thead>
        <tbody>
          {dealersList.map((dealer) => (
            <tr key={dealer.id}>
              <td>{dealer.id}</td>
              <td><Link to={`/dealer/${dealer.id}`}>{dealer.full_name}</Link></td>
              <td>{dealer.city}</td>
              <td>{dealer.address}</td>
              <td>{dealer.zip}</td>
              <td>{dealer.state}</td>
              {isLoggedIn && (
                <td>
                  <Link to={`/postreview/${dealer.id}`}>
                    <img src={reviewIcon} className="review_icon" alt="Post Review" />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dealers;
