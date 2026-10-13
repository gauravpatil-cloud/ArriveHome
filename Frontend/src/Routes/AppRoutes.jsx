import { Route, Routes } from "react-router-dom";
import AuthPage from "../pages/AuthPage.jsx";
import ListingDetailPage from "../pages/ListingDetailPage.jsx";
import ListingFormPage from "../pages/ListingFormPage.jsx";
import ListingsPage from "../pages/ListingsPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import TripsPage from "../pages/TripsPage.jsx";

export default function AppRoutes({
  user,
  setUser,
  googleEnabled,
  authLoaded,
  taxIncluded,
}) {
  return (
    <Routes>
      <Route path="/" element={<ListingsPage taxIncluded={taxIncluded} />} />
      <Route
        path="/listings"
        element={<ListingsPage taxIncluded={taxIncluded} />}
      />
      <Route path="/listings/new" element={<ListingFormPage user={user} />} />
      <Route
        path="/listings/:id"
        element={<ListingDetailPage user={user} taxIncluded={taxIncluded} />}
      />
      <Route
        path="/listings/:id/edit"
        element={<ListingFormPage user={user} />}
      />
      <Route
        path="/login"
        element={<AuthPage setUser={setUser} googleEnabled={googleEnabled} />}
      />
      <Route
        path="/signup"
        element={
          <AuthPage signup setUser={setUser} googleEnabled={googleEnabled} />
        }
      />
      <Route
        path="/trips"
        element={<TripsPage user={user} authLoaded={authLoaded} />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
