export default function PhotoGallery({ photos, title, active, setActive }) {
  if (!photos.length)
    return <div className="photo-placeholder detail-placeholder">⌂</div>;
  const current = photos[active];
  return (
    <div
      className={`photo-gallery ${photos.length === 1 ? "single-photo" : ""}`}
    >
      <div className="gallery-main">
        <img src={current.url} alt={`${title}, photo ${active + 1}`} />
        {photos.length > 1 && (
          <>
            <button
              className="gallery-arrow gallery-prev"
              type="button"
              aria-label="Previous photo"
              onClick={() =>
                setActive((active - 1 + photos.length) % photos.length)
              }
            >
              ‹
            </button>
            <button
              className="gallery-arrow gallery-next"
              type="button"
              aria-label="Next photo"
              onClick={() => setActive((active + 1) % photos.length)}
            >
              ›
            </button>
            <span className="photo-count">
              {active + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <div className="gallery-thumbnails" aria-label="All property photos">
          {photos.map((photo, index) => (
            <button
              className={index === active ? "thumbnail active" : "thumbnail"}
              key={`${photo.filename}-${index}`}
              type="button"
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <img src={photo.url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
