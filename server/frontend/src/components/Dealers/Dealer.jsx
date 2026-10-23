import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./Dealers.css";
import "../assets/style.css";
import positiveIcon from "../assets/positive.png";
import neutralIcon from "../assets/neutral.png";
import negativeIcon from "../assets/negative.png";
import Header from "../Header/Header";

const sentimentIcon = (sentiment) => {
  if (sentiment === "positive") return positiveIcon;
  if (sentiment === "negative") return negativeIcon;
  return neutralIcon;
};

const Dealer = () => {
  const { id } = useParams();
  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadDealer = async () => {
      try {
        const [dealerResponse, reviewsResponse] = await Promise.all([
          fetch(`/djangoapp/dealer/${id}`),
          fetch(`/djangoapp/reviews/dealer/${id}`),
        ]);
        const dealerResult = await dealerResponse.json();
        const reviewsResult = await reviewsResponse.json();
        if (!dealerResponse.ok || !reviewsResponse.ok) {
          throw new Error(dealerResult.error || reviewsResult.error || "Unable to load dealer details");
        }
        if (!cancelled) {
          setDealer(dealerResult.dealer[0]);
          setReviews(reviewsResult.reviews);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message);
          setLoading(false);
        }
      }
    };
    loadDealer();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const username = sessionStorage.getItem("username");
  return (
    <div style={{ margin: "20px" }}>
      <Header />
      <main style={{ marginTop: "10px" }}>
        <h1 style={{ color: "grey" }}>
          {dealer?.full_name}
          {username && <Link to={`/postreview/${id}`} className="nav_item">Review Dealer</Link>}
        </h1>
        {dealer && (
          <h4 style={{ color: "grey" }}>
            {dealer.city}, {dealer.address}, Zip - {dealer.zip}, {dealer.state}
          </h4>
        )}
        {error && <p role="alert">{error}</p>}
        <section className="reviews_panel" aria-label="Dealer reviews">
          {loading
            ? <p>Loading reviews...</p>
            : reviews.length === 0 && !error
              ? <p>No reviews yet!</p>
            : reviews.map((review) => (
              <article className="review_panel" key={review.id}>
                <img src={sentimentIcon(review.sentiment)} className="emotion_icon" alt={`${review.sentiment} sentiment`} />
                <p className="review">{review.review}</p>
                <p className="reviewer">
                  {review.name} {review.car_make} {review.car_model} {review.car_year}
                </p>
              </article>
            ))}
        </section>
      </main>
    </div>
  );
};

export default Dealer;
