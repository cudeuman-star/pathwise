import { send, currentUser, publicUser, storeKind } from "../_lib.js";
export default async function handler(req, res) {
  const u = currentUser(req);
  send(res, 200, { user: u ? publicUser(u) : null, config: { stripe: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID), store: storeKind } });
}
