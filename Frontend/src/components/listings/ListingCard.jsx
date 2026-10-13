import { useState } from "react";
import { Link } from "react-router-dom";
import { listingImages, money } from "../../apiClient.js";

export default function ListingCard({ listing, taxIncluded }) {
  const images = listingImages(listing);
  const [active, setActive] = useState(0);
  const image = images[active];
  const shownPrice = taxIncluded
    ? Math.round(listing.price * 1.18)
    : listing.price;

  return (
    <article className="listing-card">
      <Link
        className="card-photo"
        to={`/listings/${listing._id}`}
        aria-label={`View ${listing.title}`}
      >
        {image ? (
          <img src={image.url} alt={listing.title} loading="lazy" />
        ) : (
          <div className="photo-placeholder">⌂</div>
        )}
        {images.length > 1 && (
          <span className="photo-count">
            {active + 1} / {images.length}
          </span>
        )}
      </Link>
      {images.length > 1 && (
        <>
          <button
            className="gallery-arrow gallery-prev"
            type="button"
            aria-label="Previous photo"
            onClick={() =>
              setActive((active - 1 + images.length) % images.length)
            }
          >
            ‹
          </button>
          <button
            className="gallery-arrow gallery-next"
            type="button"
            aria-label="Next photo"
            onClick={() => setActive((active + 1) % images.length)}
          >
            ›
          </button>
        </>
      )}
      <div className="listing-card-copy">
        <div className="card-location-row">
          <p>{listing.location}</p>
          <span aria-label="Guest favourite">✦</span>
        </div>
        <h3>
          <Link to={`/listings/${listing._id}`}>{listing.title}</Link>
        </h3>
        <p className="card-description">{listing.description}</p>
        <p className="card-price">
          <strong>{money(shownPrice)}</strong>{" "}
          <span>night{taxIncluded ? " · incl. GST" : ""}</span>
        </p>
      </div>
    </article>
  );
}
