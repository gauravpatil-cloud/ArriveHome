import { Link } from "react-router-dom";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <Link className="brand footer-brand" to="/">
            <img className="brand-mark" src="/arrivehome-mark.svg" alt="" />
            <span>
              arrive<span>home</span>
            </span>
          </Link>
          <p>Find the feeling of home, wherever you go.</p>
        </div>
        <div className="footer-links">
          <Link to="/">Explore stays</Link>
          <Link to="/listings/new">Become a host</Link>
          <Link to="/trips">Your trips</Link>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} ArriveHome{" "}
        <span>Made for the way you travel.</span>
      </div>
    </footer>
  );
}
