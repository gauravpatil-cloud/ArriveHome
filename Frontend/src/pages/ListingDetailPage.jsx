import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, listingImages } from "../apiClient.js";
import BookingPanel from "../components/listings/BookingPanel.jsx";
import PhotoGallery from "../components/listings/PhotoGallery.jsx";
import ReviewSection from "../components/listings/ReviewSection.jsx";
import Notice from "../components/Notice.jsx";
import { messageFrom } from "../utils/errors.js";

export default function ListingDetailPage({ user, taxIncluded }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [error, setError] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    setListing(null);
    setError("");
    Promise.all([api(`/listings/${id}`), api(`/listings/${id}/availability`)])
      .then(([{ listing: item }, { blockedDates: dates }]) => {
        setListing(item);
        setBlockedDates(dates);
      })
      .catch((requestError) => setError(messageFrom(requestError)));
  }, [id]);

  if (error)
    return (
      <section className="page-width">
        <Notice tone="error">{error}</Notice>
        <Link to="/" className="text-link">
          ← Back to stays
        </Link>
      </section>
    );
  if (!listing) return <div className="loading-state">Loading this stay…</div>;

  const photos = listingImages(listing);
  const hasExactLocation = Boolean(listing.mapLocation);
  const mapLocation = listing.mapLocation || listing.location;
  const hasExactCoordinates =
    hasExactLocation &&
    Number.isFinite(Number(listing.latitude)) &&
    Number.isFinite(Number(listing.longitude));
  const mapQuery = encodeURIComponent(
    hasExactCoordinates
      ? `${listing.latitude},${listing.longitude}`
      : mapLocation,
  );
  const isOwner =
    user && listing.owner && String(listing.owner._id) === String(user.id);

  async function deleteListing() {
    if (
      !window.confirm("Delete this listing? This will also remove its reviews.")
    )
      return;
    try {
      await api(`/listings/${id}`, { method: "DELETE" });
      navigate("/");
    } catch (requestError) {
      setError(messageFrom(requestError));
    }
  }

  return (
    <section className="page-width detail-page">
      <Link to="/" className="text-link back-link">
        ← All stays
      </Link>
      <div className="detail-title-row">
        <div>
          <p className="eyebrow">{listing.location}</p>
          <h1>{listing.title}</h1>
          <p className="detail-host">
            Hosted by {listing.owner?.username || "a local host"}
          </p>
        </div>
        {isOwner && (
          <div className="host-controls">
            <Link className="button button-light" to={`/listings/${id}/edit`}>
              Edit stay
            </Link>
            <button
              className="button button-outline-danger"
              type="button"
              onClick={deleteListing}
            >
              Delete
            </button>
          </div>
        )}
      </div>
      <PhotoGallery
        photos={photos}
        title={listing.title}
        active={photoIndex}
        setActive={setPhotoIndex}
      />
      <div className="detail-columns">
        <div className="detail-main">
          <div className="description-block">
            <p className="eyebrow">The stay</p>
            <h2>A little more about this place</h2>
            <p className="description-text">{listing.description}</p>
          </div>
          <ReviewSection
            listing={listing}
            user={user}
            setListing={setListing}
          />
        </div>
        <BookingPanel
          listing={listing}
          blockedDates={blockedDates}
          taxIncluded={taxIncluded}
          user={user}
        />
      </div>
      <section className="location-section" aria-labelledby="location-title">
        <div className="location-heading">
          <div>
            <p className="eyebrow">Location</p>
            <h2 id="location-title">
              {hasExactLocation ? "Exact location" : "Approximate location"}
            </h2>
            <p>{mapLocation}</p>
          </div>
          <a
            className="text-link"
            href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
        <iframe
          className="location-map"
          title={`Map of ${listing.location}`}
          src={`https://maps.google.com/maps?q=${mapQuery}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </section>
    </section>
  );
}
