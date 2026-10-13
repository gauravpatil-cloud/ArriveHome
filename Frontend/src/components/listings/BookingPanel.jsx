import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, dateToday, money } from "../../apiClient.js";
import Notice from "../Notice.jsx";
import { messageFrom } from "../../utils/errors.js";

export default function BookingPanel({
  listing,
  blockedDates,
  taxIncluded,
  user,
}) {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round(
            (Date.parse(`${checkOut}T00:00:00Z`) -
              Date.parse(`${checkIn}T00:00:00Z`)) /
              86400000,
          ),
        )
      : 0;
  const minCheckOut = checkIn
    ? (() => {
        const nextDay = new Date(`${checkIn}T00:00:00.000Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        return nextDay.toISOString().slice(0, 10);
      })()
    : dateToday();
  const subtotal = listing.price * nights;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax;
  const validRange = Boolean(checkIn && checkOut && nights > 0);
  const datesConflict =
    validRange &&
    blockedDates.some(
      (stay) => checkIn < stay.checkOut && checkOut > stay.checkIn,
    );

  const isAvailable = useMemo(() => {
    return validRange && !datesConflict;
  }, [datesConflict, validRange]);

  async function startCheckout(event) {
    event.preventDefault();
    setError("");
    if (!user) {
      navigate("/login", { state: { from: `/listings/${listing._id}` } });
      return;
    }
    if (!isAvailable) {
      if (!datesConflict) {
        setError("Select a check-in date and a later check-out date.");
      }
      return;
    }

    setBusy(true);
    try {
      const order = await api("/bookings/orders", {
        method: "POST",
        body: JSON.stringify({ listingId: listing._id, checkIn, checkOut }),
      });
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () =>
          reject(
            new Error(
              "Could not load Razorpay checkout. Check your internet connection and try again.",
            ),
          );
        document.body.appendChild(script);
      });

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "ArriveHome",
        description: `${listing.title} · ${nights} ${nights === 1 ? "night" : "nights"}`,
        order_id: order.orderId,
        prefill: { name: user.username, email: user.email },
        theme: { color: "#315f50" },
        handler: async (payment) => {
          try {
            await api("/bookings/verify", {
              method: "POST",
              body: JSON.stringify({ bookingId: order.bookingId, ...payment }),
            });
            navigate("/trips?booked=1");
          } catch (verificationError) {
            setError(messageFrom(verificationError));
          } finally {
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      checkout.on("payment.failed", (failure) => {
        setError(
          failure.error?.description || "Payment failed. Please try again.",
        );
        setBusy(false);
      });
      checkout.open();
    } catch (requestError) {
      setError(messageFrom(requestError));
      setBusy(false);
    }
  }

  return (
    <aside className="booking-card">
      <div className="booking-price">
        <strong>
          {money(
            taxIncluded ? Math.round(listing.price * 1.18) : listing.price,
          )}
        </strong>
        <span> / night{taxIncluded ? " · incl. GST" : ""}</span>
      </div>
      <form onSubmit={startCheckout}>
        <div className="date-fields">
          <label>
            CHECK-IN
            <input
              type="date"
              value={checkIn}
              min={dateToday()}
              onChange={(event) => {
                const value = event.target.value;
                setCheckIn(value);
                if (checkOut && value && checkOut <= value) setCheckOut("");
              }}
              required
            />
          </label>
          <label>
            CHECK-OUT
            <input
              type="date"
              value={checkOut}
              min={minCheckOut}
              onChange={(event) => setCheckOut(event.target.value)}
              required
            />
          </label>
        </div>
        {checkIn && checkOut && nights > 0 && (
          <div className="price-breakdown">
            <p>
              <span>
                {money(listing.price)} × {nights}{" "}
                {nights === 1 ? "night" : "nights"}
              </span>
              <span>{money(subtotal)}</span>
            </p>
            <p>
              <span>GST (18%)</span>
              <span>{money(tax)}</span>
            </p>
            <p className="total-line">
              <strong>Total</strong>
              <strong>{money(total)}</strong>
            </p>
          </div>
        )}
        {datesConflict && (
          <p className="calendar-warning" role="status">
            These dates aren’t available. Please choose a different stay.
          </p>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <button
          className="button button-primary booking-submit"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Opening secure checkout…"
            : user
              ? "Reserve with Razorpay"
              : "Sign in to reserve"}
        </button>
        <p className="secure-note">
          You will not be charged until you confirm payment.
        </p>
      </form>
    </aside>
  );
}
