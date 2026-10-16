import { send, method, currentUser } from "../_lib.js"; import { upgrade } from "./_upgrade.js";
// Simulated checkout, only available when Stripe keys are NOT configured. No card data is involved.
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  if (process.env.STRIPE_SECRET_KEY) return send(res, 403, { error: "Simulated checkout is disabled when Stripe is configured." });
  const u = currentUser(req); if (!u) return send(res, 401, { error: "Please sign in first." });
  const { user, cookie } = await upgrade(u, { simulated: true });
  send(res, 200, { user }, { "Set-Cookie": cookie });
}
