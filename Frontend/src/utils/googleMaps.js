export const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
let googleMapsPromise;

export function loadGoogleMaps() {
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }
  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Google Maps API key is missing."));
  }
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const callbackName = "__arriveHomeGoogleMapsReady";
      window[callbackName] = () => resolve(window.google.maps);
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=${callbackName}&loading=async&v=weekly`;
      script.async = true;
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error("Google Maps could not be loaded."));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      googleMapsPromise = null;
      throw error;
    });
  }
  return googleMapsPromise;
}
