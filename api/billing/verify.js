import { body, send, method, currentUser } from "../_lib.js"; import { upgrade } from "./_upgrade.js";
// Verify-on-return: confirm the Checkout Session with Stripe before granting Pro.
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const u = currentUser(req); if (!u) return send(res, 401, { error: "Please sign in first." });
  const { session_id } = await body(req); const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return send(res, 400, { error: "Stripe is not configured." });
  if (!/^cs_test_[A-Za-z0-9]+$/.test(session_id || "")) return send(res, 400, { error: "Invalid session." });
  const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, { headers: { Authorization: `Bearer ${key}` } }); const s = await r.json();
  if (!r.ok) return send(res, 502, { error: s.error?.message || "Stripe error" });
  if (s.client_reference_id !== u.email) return send(res, 403, { error: "This checkout belongs to another account." });
  if (s.status !== "complete") return send(res, 402, { error: "Payment not completed." });
  const { user, cookie } = await upgrade(u, { stripeCustomer: s.customer });
  send(res, 200, { user }, { "Set-Cookie": cookie });
}
