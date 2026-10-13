import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../apiClient.js";
import { messageFrom } from "../utils/errors.js";

export default function SiteHeader({
  user,
  setUser,
  taxIncluded,
  setTaxIncluded,
}) {
  const location = useLocation();
  const [search, setSearch] = useState(
    new URLSearchParams(location.search).get("search") || "",
  );
  const navigate = useNavigate();

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("search") || "");
  }, [location.search]);

  async function signOut() {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
      navigate(location.state?.from || "/");
    } catch (error) {
      window.alert(messageFrom(error));
    }
  }

  function searchListings(event) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/?search=${encodeURIComponent(query)}` : "/");
  }

  const profileName = user?.displayName?.startsWith("google-")
    ? ""
    : user?.displayName;
  const accountLabel = profileName || user?.email || "Account";
  const avatarInitial = accountLabel.trim().charAt(0).toUpperCase() || "U";

  function closeAccountMenu(event) {
    const menu = event.currentTarget.closest("details");
    if (menu) menu.open = false;
  }

  return (
    <header className="stay-header">
      <Link className="brand" to="/" aria-label="ArriveHome home">
        <img className="brand-mark" src="/arrivehome-mark.svg" alt="" />
        <span>
          arrive<span>home</span>
        </span>
      </Link>
      <form className="header-search" onSubmit={searchListings} role="search">
        <label className="visually-hidden" htmlFor="site-search">
          Search stays
        </label>
        <input
          id="site-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Where do you want to go?"
        />
        <button type="submit" aria-label="Search listings">
          ⌕
        </button>
      </form>
      <nav className="header-actions" aria-label="Main navigation">
        <label className="tax-switch">
          <input
            type="checkbox"
            checked={taxIncluded}
            onChange={(event) => setTaxIncluded(event.target.checked)}
          />
          <span>Show total with tax</span>
        </label>
        {user ? (
          <details className="account-dropdown">
            <summary className="account-trigger" aria-label="Open account menu">
              {user.profilePhoto ? (
                <img
                  className="user-avatar"
                  src={user.profilePhoto}
                  alt="Profile photo"
                />
              ) : (
                <span
                  className="user-avatar user-avatar-fallback"
                  role="img"
                  aria-label="User account initial"
                >
                  {avatarInitial}
                </span>
              )}
            </summary>
            <div className="account-popover">
              <p className="account-identity">{accountLabel}</p>
              <Link to="/trips" onClick={closeAccountMenu}>
                Your trips
              </Link>
              <Link to="/listings/new" onClick={closeAccountMenu}>
                List your place
              </Link>
              <button type="button" onClick={signOut}>
                Sign out
              </button>
            </div>
          </details>
        ) : (
          <div className="user-menu">
            <Link className="host-link" to="/listings/new">
              List your place
            </Link>
            <Link to="/login">Log in</Link>
            <Link className="signup-link" to="/signup">
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
