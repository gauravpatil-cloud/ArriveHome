import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-width empty-state">
      <span aria-hidden="true">⌂</span>
      <h2>We couldn't find that page</h2>
      <Link className="button button-primary" to="/">
        Go home
      </Link>
    </section>
  );
}
