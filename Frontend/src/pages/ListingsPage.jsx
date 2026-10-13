import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../apiClient.js";
import ListingCard from "../components/listings/ListingCard.jsx";
import Notice from "../components/Notice.jsx";
import { messageFrom } from "../utils/errors.js";

export default function ListingsPage({ taxIncluded }) {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api(`/listings${search ? `?search=${encodeURIComponent(search)}` : ""}`)
      .then(({ listings: items }) => setListings(items))
      .catch((requestError) => setError(messageFrom(requestError)))
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <section className="page-width listings-page">
      <div className="welcome-panel">
        <div>
          <p className="eyebrow">A better way to get away</p>
          <h1>Find a place that feels like yours.</h1>
          <p>Thoughtful stays for your next little escape or big adventure.</p>
        </div>
        <div className="welcome-decoration" aria-hidden="true">
          ⌂
        </div>
      </div>
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            {search ? "Search results" : "Handpicked homes"}
          </p>
          <h2>{search ? `Stays for “${search}”` : "Places to stay"}</h2>
        </div>
        <span className="result-count">
          {listings.length} {listings.length === 1 ? "stay" : "stays"}
        </span>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {loading ? (
        <div className="loading-state">Finding lovely places…</div>
      ) : listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              taxIncluded={taxIncluded}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span aria-hidden="true">⌕</span>
          <h3>No stays found just yet</h3>
          <p>
            Try another destination or clear your search to explore every stay.
          </p>
          {search && (
            <Link className="button button-light" to="/">
              Explore all stays
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
