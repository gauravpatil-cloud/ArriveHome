import { useEffect, useRef, useState } from "react";
import { googleMapsApiKey, loadGoogleMaps } from "../../utils/googleMaps.js";

export default function GoogleLocationPicker({
  mapLocation,
  latitude,
  longitude,
  onLocationChange,
}) {
  const autocompleteHostRef = useRef(null);
  const mapHostRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const currentValuesRef = useRef({ mapLocation, latitude, longitude });
  const [pickerError, setPickerError] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    currentValuesRef.current = { mapLocation, latitude, longitude };
  }, [mapLocation, latitude, longitude]);

  useEffect(() => {
    if (!googleMapsApiKey) return undefined;
    let active = true;
    let autocomplete;
    let placeSelectHandler;
    let geocoder;
    const listeners = [];

    async function initializePicker() {
      try {
        const google = await loadGoogleMaps();
        const [mapsLibrary, placesLibrary, geocodingLibrary] =
          await Promise.all([
            google.importLibrary("maps"),
            google.importLibrary("places"),
            google.importLibrary("geocoding"),
          ]);
        if (!active || !mapHostRef.current || !autocompleteHostRef.current) {
          return;
        }

        const current = currentValuesRef.current;
        const hasPin = current.latitude !== "" && current.longitude !== "";
        const position = hasPin
          ? { lat: Number(current.latitude), lng: Number(current.longitude) }
          : null;
        const map = new mapsLibrary.Map(mapHostRef.current, {
          center: position || { lat: 20.5937, lng: 78.9629 },
          zoom: position ? 16 : 5,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        mapRef.current = map;
        const marker = new google.maps.Marker({
          map,
          position: position || undefined,
          draggable: true,
          title: "Drag to adjust the property pin",
        });
        markerRef.current = marker;
        geocoder = new geocodingLibrary.Geocoder();

        async function placePin(pinPosition) {
          marker.setPosition(pinPosition);
          map.panTo(pinPosition);
          try {
            const { results } = await geocoder.geocode({
              location: pinPosition,
            });
            const address = results?.[0]?.formatted_address;
            if (!address) {
              setPickerError(
                "Google Maps could not find an address at this pin.",
              );
              return;
            }
            setPickerError("");
            onLocationChangeRef.current({
              mapLocation: address,
              latitude: String(pinPosition.lat),
              longitude: String(pinPosition.lng),
            });
          } catch {
            setPickerError("Could not find the address for this map pin.");
          }
        }

        const autocompleteElement =
          new placesLibrary.PlaceAutocompleteElement();
        autocompleteElement.placeholder = "Search a street address or place";
        autocompleteElement.style.width = "100%";
        autocompleteElement.setAttribute(
          "aria-label",
          "Search property address",
        );
        autocomplete = autocompleteElement;
        autocompleteHostRef.current.replaceChildren(autocompleteElement);

        placeSelectHandler = async (event) => {
          try {
            const place = event.placePrediction.toPlace();
            await place.fetchFields({
              fields: ["formattedAddress", "location", "viewport"],
            });
            if (!active || !place.location) return;
            const selectedPosition = place.location.toJSON();
            marker.setPosition(selectedPosition);
            if (place.viewport) {
              map.fitBounds(place.viewport);
            } else {
              map.setCenter(selectedPosition);
              map.setZoom(16);
            }
            setPickerError("");
            onLocationChangeRef.current({
              mapLocation: place.formattedAddress || "",
              latitude: String(selectedPosition.lat),
              longitude: String(selectedPosition.lng),
            });
          } catch {
            setPickerError(
              "Could not select that address. Try another result.",
            );
          }
        };
        autocompleteElement.addEventListener("gmp-select", placeSelectHandler);

        listeners.push(
          map.addListener("click", (event) => {
            if (event.latLng) placePin(event.latLng.toJSON());
          }),
          marker.addListener("dragend", (event) => {
            if (event.latLng) placePin(event.latLng.toJSON());
          }),
        );
        setMapReady(true);
      } catch {
        if (active) {
          setPickerError(
            "Google Maps could not load. Check the Maps JavaScript and Places API settings for your key.",
          );
        }
      }
    }

    initializePicker();
    return () => {
      active = false;
      listeners.forEach((listener) => listener.remove());
      if (placeSelectHandler) {
        autocomplete?.removeEventListener("gmp-select", placeSelectHandler);
      }
      markerRef.current?.setMap(null);
      markerRef.current = null;
      mapRef.current = null;
      autocompleteHostRef.current?.replaceChildren();
    };
  }, []);

  function updateAddress(event) {
    onLocationChange({
      mapLocation: event.target.value,
      latitude: "",
      longitude: "",
    });
  }

  return (
    <div className="location-picker">
      {googleMapsApiKey && !pickerError ? (
        <>
          <div className="location-autocomplete" ref={autocompleteHostRef} />
          {mapLocation && (
            <p className="location-selected-address">{mapLocation}</p>
          )}
        </>
      ) : (
        <input
          type="text"
          value={mapLocation}
          onChange={updateAddress}
          maxLength={250}
          placeholder="Street address, city, region"
          aria-label="Property address"
          required
        />
      )}
      {googleMapsApiKey && !pickerError && (
        <div
          className="location-picker-map"
          ref={mapHostRef}
          role="region"
          aria-label="Choose and adjust the exact property pin"
        />
      )}
      {pickerError && (
        <p className="location-picker-message" role="alert">
          {pickerError}
        </p>
      )}
      {googleMapsApiKey && !mapReady && !pickerError && (
        <p className="location-picker-message">Loading map…</p>
      )}
    </div>
  );
}
