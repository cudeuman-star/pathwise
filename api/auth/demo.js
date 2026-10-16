import { send, method, sessionCookie, DEMO } from "../_lib.js";
// Stateless demo session: works on any deployment, no database required.
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const user = { ...DEMO, plan: "free", demo: true };
  send(res, 200, { user }, { "Set-Cookie": sessionCookie(user) });
}
