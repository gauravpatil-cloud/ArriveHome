import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, listingImages, money } from "../apiClient.js";
import Notice from "../components/Notice.jsx";
import { messageFrom } from "../utils/errors.js";

export default function TripsPage({ user, authLoaded }) {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [params] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    api("/bookings/mine")
      .then(({ bookings: items }) => setBookings(items))
      .catch((requestError) => setError(messageFrom(requestError)));
  }, [user]);

  if (!authLoaded)
    return <div className="loading-state">Loading your trips…</div>;
  if (!user)
    return (
      <section className="page-width empty-state">
        <h2>Sign in to see your trips</h2>
        <Link className="button button-primary" to="/login">
          Log in
        </Link>
      </section>
    );
  return (
    <section className="page-width trips-page">
      <p className="eyebrow">Your ArriveHome account</p>
      <h1>Your trips</h1>
      {params.get("booked") && (
        <Notice tone="success">
          Your stay is confirmed. Have a wonderful trip!
        </Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {!bookings.length && !error ? (
        <div className="empty-state">
          <h3>No trips booked yet</h3>
          <p>Your next great stay is waiting to be found.</p>
          <Link className="button button-primary" to="/">
            Explore stays
          </Link>
        </div>
      ) : (
        <div className="trip-list">
          {bookings.map((booking) => (
            <article className="trip-card" key={booking._id}>
              {booking.listing && (
                <Link
                  to={`/listings/${booking.listing._id}`}
                  className="trip-photo"
                >
                  {listingImages(booking.listing)[0] ? (
                    <img src={listingImages(booking.listing)[0].url} alt="" />
                  ) : (
                    "⌂"
                  )}
                </Link>
              )}
              <div>
                <p className="eyebrow">{booking.status}</p>
                <h2>
                  {booking.listing?.title || "Listing no longer available"}
                </h2>
                <p>{booking.listing?.location}</p>
                <p>
                  {new Date(booking.checkIn).toLocaleDateString()} –{" "}
                  {new Date(booking.checkOut).toLocaleDateString()} ·{" "}
                  {booking.nights} nights
                </p>
                <strong>{money(booking.amount)} total</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
