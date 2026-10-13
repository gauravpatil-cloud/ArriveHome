import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, listingImages } from "../apiClient.js";
import GoogleLocationPicker from "../components/listings/GoogleLocationPicker.jsx";
import Notice from "../components/Notice.jsx";
import { googleMapsApiKey } from "../utils/googleMaps.js";
import { messageFrom } from "../utils/errors.js";

export default function ListingFormPage({ user }) {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [values, setValues] = useState({
    title: "",
    price: "",
    location: "",
    mapLocation: "",
    latitude: "",
    longitude: "",
    description: "",
  });
  const [photos, setPhotos] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!editing) return;
    api(`/listings/${id}`)
      .then(({ listing }) => {
        if (!user || String(listing.owner?._id) !== String(user.id)) {
          setError("Only the host can edit this stay.");
          return;
        }
        setValues({
          title: listing.title,
          price: listing.price,
          location: listing.location,
          mapLocation: listing.mapLocation || "",
          latitude: listing.latitude ?? "",
          longitude: listing.longitude ?? "",
          description: listing.description,
        });
        setExistingImages(listingImages(listing));
      })
      .catch((requestError) => setError(messageFrom(requestError)));
  }, [editing, id, user]);

  function update(event) {
    setValues({ ...values, [event.target.name]: event.target.value });
  }

  function selectPhotos(event) {
    const selected = Array.from(event.target.files || []);
    const existingCount = new Set(existingImages.map((image) => image.url))
      .size;
    if (existingCount + selected.length > 10) {
      setError("A listing can have at most 10 photos.");
      setPhotos([]);
      return;
    }
    if (selected.some((photo) => photo.size > 8 * 1024 * 1024)) {
      setError("Each photo must be 8 MB or smaller.");
      setPhotos([]);
      return;
    }
    setError("");
    setPhotos(selected);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!user) {
      navigate("/login", {
        state: { from: editing ? `/listings/${id}/edit` : "/listings/new" },
      });
      return;
    }
    if (!editing && !photos.length) {
      setError("Add at least one property photo.");
      return;
    }
    if (
      googleMapsApiKey &&
      (values.latitude === "" || values.longitude === "")
    ) {
      setError(
        "Choose the property's location and pin on the map before saving.",
      );
      return;
    }
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) =>
      formData.append(key, value),
    );
    photos.forEach((photo) => formData.append("images", photo));
    setBusy(true);
    try {
      const result = await api(editing ? `/listings/${id}` : "/listings", {
        method: editing ? "PATCH" : "POST",
        body: formData,
      });
      navigate(`/listings/${result.listing._id}`);
    } catch (requestError) {
      setError(messageFrom(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="form-page">
      <Link to="/" className="text-link back-link">
        ← Back to stays
      </Link>
      <div className="form-card">
        <p className="eyebrow">{editing ? "Your space" : "Become a host"}</p>
        <h1>
          {editing ? "Update your stay" : "Share a place worth remembering."}
        </h1>
        <p className="form-intro">
          {editing
            ? "Refresh the details and add more photos."
            : "Add the details guests need to picture their next trip."}
        </p>
        {!user && (
          <Notice tone="info">
            Please <Link to="/login">sign in</Link> before publishing a stay.
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <form className="property-form" onSubmit={submit}>
          <label>
            Property title
            <input
              name="title"
              value={values.title}
              onChange={update}
              minLength={3}
              maxLength={100}
              placeholder="A sunlit apartment near the old town"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Price per night (INR)
              <input
                name="price"
                type="number"
                value={values.price}
                onChange={update}
                min="1"
                step="1"
                placeholder="3500"
                required
              />
            </label>
            <label>
              City or neighborhood (shown publicly)
              <input
                name="location"
                value={values.location}
                onChange={update}
                maxLength={150}
                placeholder="Pune, Maharashtra"
                required
              />
            </label>
          </div>
          <div className="location-picker-field">
            <p className="field-label">Property location</p>
            <GoogleLocationPicker
              mapLocation={values.mapLocation}
              latitude={values.latitude}
              longitude={values.longitude}
              onLocationChange={(selection) =>
                setValues((current) => ({ ...current, ...selection }))
              }
            />
            <p className="location-privacy-note">
              Only you and confirmed guests see this address.
            </p>
          </div>
          <label>
            About this place
            <textarea
              name="description"
              value={values.description}
              onChange={update}
              maxLength={5000}
              rows={5}
              placeholder="Describe what makes your place a lovely home base."
              required
            />
          </label>
          {existingImages.length > 0 && (
            <div className="existing-photos">
              <p className="field-label">
                Current photos · new photos are added to this gallery
              </p>
              <div className="form-photo-row">
                {existingImages.map((photo, index) => (
                  <img
                    src={photo.url}
                    alt={`Current property photo ${index + 1}`}
                    key={`${photo.filename}-${index}`}
                  />
                ))}
              </div>
            </div>
          )}
          <label className="upload-control">
            <span className="upload-icon">＋</span>
            <span>
              <strong>
                {editing ? "Add more photos" : "Choose property photos"}
              </strong>
              <small>Select up to 10 JPG, PNG or WebP images · 8 MB each</small>
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={selectPhotos}
            />
          </label>
          {photos.length > 0 && (
            <div className="form-photo-row">
              {photos.map((photo) => (
                <PreviewPhoto
                  key={`${photo.name}-${photo.lastModified}`}
                  photo={photo}
                />
              ))}
            </div>
          )}
          <button className="button button-primary form-submit" disabled={busy}>
            {busy
              ? "Saving your stay…"
              : editing
                ? "Save changes"
                : "Publish your stay"}
          </button>
        </form>
      </div>
    </section>
  );
}

function PreviewPhoto({ photo }) {
  const [preview, setPreview] = useState("");

  useEffect(() => {
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return preview ? <img src={preview} alt={photo.name} /> : null;
}
