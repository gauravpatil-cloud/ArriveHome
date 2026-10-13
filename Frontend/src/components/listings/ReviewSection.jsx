import { Fragment, useState } from "react";
import { api } from "../../apiClient.js";
import Notice from "../Notice.jsx";
import { messageFrom } from "../../utils/errors.js";

export default function ReviewSection({ listing, user, setListing }) {
  const [stars, setStars] = useState(5);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reviews = listing.reviews || [];

  async function addReview(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/listings/${listing._id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ stars: Number(stars), message }),
      });
      const { listing: updated } = await api(`/listings/${listing._id}`);
      setListing(updated);
      setMessage("");
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function deleteReview(reviewId) {
    try {
      await api(`/listings/${listing._id}/reviews/${reviewId}`, {
        method: "DELETE",
      });
      setListing({
        ...listing,
        reviews: reviews.filter((review) => review._id !== reviewId),
      });
    } catch (requestError) {
      setError(messageFrom(requestError));
    }
  }

  return (
    <section className="reviews-section">
      <p className="eyebrow">Guest notes</p>
      <h2>
        Reviews <span className="review-count">({reviews.length})</span>
      </h2>
      {user && (
        <form className="review-form" onSubmit={addReview}>
          <fieldset
            className="rating-fieldset"
            onMouseLeave={() => setHoveredStars(0)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setHoveredStars(0);
            }}
          >
            <legend className="field-label">Your rating</legend>
            <div className="rating-picker">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Fragment key={rating}>
                  <input
                    className="rating-input"
                    type="radio"
                    id={`review-rating-${rating}`}
                    name="review-rating"
                    value={rating}
                    checked={stars === rating}
                    onChange={() => setStars(rating)}
                    onFocus={() => setHoveredStars(rating)}
                    aria-label={`${rating} ${rating === 1 ? "star" : "stars"}`}
                  />
                  <label
                    className={`rating-star ${rating <= (hoveredStars || stars) ? "is-active" : ""}`}
                    htmlFor={`review-rating-${rating}`}
                    onMouseEnter={() => setHoveredStars(rating)}
                    aria-hidden="true"
                  >
                    ★
                  </label>
                </Fragment>
              ))}
              <span className="rating-value" aria-live="polite">
                {hoveredStars || stars} / 5
              </span>
            </div>
          </fieldset>
          <label className="field-label" htmlFor="review-message">
            Share a few words
          </label>
          <textarea
            id="review-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="What made this stay special?"
            required
          />
          <button className="button button-light" type="submit" disabled={busy}>
            {busy ? "Posting…" : "Post review"}
          </button>
        </form>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {reviews.length ? (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review._id}>
              <div className="review-meta">
                <span className="review-avatar">
                  {review.author?.username?.slice(0, 1).toUpperCase() || "G"}
                </span>
                <div>
                  <strong>{review.author?.username || "Guest"}</strong>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <span
                  className="review-stars"
                  aria-label={`${review.stars} out of 5 stars`}
                >
                  {"★".repeat(review.stars)}
                </span>
              </div>
              <p>{review.message}</p>
              {user && String(review.author?._id) === String(user.id) && (
                <button
                  type="button"
                  className="text-button remove-review"
                  onClick={() => deleteReview(review._id)}
                >
                  Remove review
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted-copy">
          {user
            ? "Be the first to leave a review."
            : "Sign in to leave the first review."}
        </p>
      )}
    </section>
  );
}
