import { send, method, currentUser, origin } from "../_lib.js";
// Creates a Stripe Checkout Session (TEST mode only). Falls back to a simulated checkout when keys are absent.
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const u = currentUser(req); if (!u) return send(res, 401, { error: "Please sign in first." });
  const key = process.env.STRIPE_SECRET_KEY, price = process.env.STRIPE_PRICE_ID, base = origin(req);
  if (!key || !price) return send(res, 200, { mode: "simulated", url: `${base}/#/checkout/simulated` });
  if (!key.startsWith("sk_test_")) return send(res, 400, { error: "Only Stripe TEST keys (sk_test_…) are allowed in this project." });
  const p = new URLSearchParams({ mode: "subscription", "line_items[0][price]": price, "line_items[0][quantity]": "1",
    success_url: `${base}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${base}/#/pricing?canceled=1`,
    client_reference_id: u.email, customer_email: u.demo ? "" : u.email });
  if (u.demo) p.delete("customer_email");
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: p });
  const j = await r.json();
  if (!r.ok) return send(res, 502, { error: j.error?.message || "Stripe error" });
  send(res, 200, { mode: "stripe", url: j.url });
}
