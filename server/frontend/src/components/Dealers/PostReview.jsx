import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import Header from "../Header/Header";

const PostReview = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [review, setReview] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [date, setDate] = useState("");
  const [carModels, setCarModels] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [dealerResponse, carsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch("/djangoapp/get_cars"),
        ]);
        if (!dealerResponse.ok || !carsResponse.ok) {
          throw new Error("Unable to load dealer or vehicle information");
        }
        const dealerResult = await dealerResponse.json();
        const carsResult = await carsResponse.json();
        setDealer(dealerResult.dealer[0]);
        setCarModels(carsResult.CarModels);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    loadFormData();
  }, [id]);

  const submitReview = async (event) => {
    event.preventDefault();
    const firstName = sessionStorage.getItem("firstname");
    const lastName = sessionStorage.getItem("lastname");
    const name = [firstName, lastName].filter(Boolean).join(" ")
      || sessionStorage.getItem("username");
    if (!name) {
      setError("Log in before submitting a review.");
      return;
    }
    try {
      const vehicle = JSON.parse(model);
      const response = await fetch("/djangoapp/add_review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          dealership: id,
          review,
          purchase: true,
          purchase_date: date,
          car_make: vehicle.make,
          car_model: vehicle.model,
          car_year: Number(year),
        }),
      });
      const result = await response.json();
      if (!response.ok || result.status !== 200) {
        throw new Error(result.error || "Unable to submit your review");
      }
      window.location.assign(`/dealer/${id}`);
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <div>
      <Header />
      <main style={{ margin: "5%" }}>
        <h1 style={{ color: "darkblue" }}>{dealer?.full_name}</h1>
        <form onSubmit={submitReview}>
          <label htmlFor="review">Your review</label>
          <textarea id="review" cols="50" rows="7" value={review} onChange={(event) => setReview(event.target.value)} required />
          <div className="input_field">
            <label htmlFor="purchase-date">Purchase Date</label>
            <input id="purchase-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
          <div className="input_field">
            <label htmlFor="cars">Car Make and Model</label>
            <select id="cars" value={model} onChange={(event) => setModel(event.target.value)} required>
              <option value="" disabled>Choose Car Make and Model</option>
              {carModels.map((car) => (
                <option key={`${car.CarMake}-${car.CarModel}`} value={JSON.stringify({ make: car.CarMake, model: car.CarModel })}>
                  {car.CarMake} {car.CarModel}
                </option>
              ))}
            </select>
          </div>
          <div className="input_field">
            <label htmlFor="year">Car Year</label>
            <input id="year" type="number" min="2015" max="2023" value={year} onChange={(event) => setYear(event.target.value)} required />
          </div>
          {error && <p role="alert">{error}</p>}
          <button className="postreview" type="submit">Post Review</button>
        </form>
      </main>
    </div>
  );
};

export default PostReview;
