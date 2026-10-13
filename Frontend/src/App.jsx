import { useEffect, useState } from "react";
import { api } from "./apiClient.js";
import SiteFooter from "./components/SiteFooter.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    api("/auth/me")
      .then(({ user: currentUser, googleEnabled: isGoogleEnabled }) => {
        setUser(currentUser);
        setGoogleEnabled(isGoogleEnabled);
      })
      .catch((error) => console.error("Could not restore your session:", error))
      .finally(() => setAuthLoaded(true));
  }, []);

  return (
    <div className="site-shell">
      <SiteHeader
        user={user}
        setUser={setUser}
        taxIncluded={taxIncluded}
        setTaxIncluded={setTaxIncluded}
      />
      <main className="main-content">
        <AppRoutes
          user={user}
          setUser={setUser}
          googleEnabled={googleEnabled}
          authLoaded={authLoaded}
          taxIncluded={taxIncluded}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
