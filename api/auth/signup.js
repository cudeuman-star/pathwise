import { body, send, method, getUser, saveUser, hashPw, sessionCookie, publicUser, validEmail } from "../_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const { email, password, name } = await body(req);
  if (!validEmail(email)) return send(res, 400, { error: "Enter a valid email address." });
  if (!password || password.length < 8) return send(res, 400, { error: "Password must be at least 8 characters." });
  if (await getUser(email)) return send(res, 409, { error: "An account with this email already exists. Sign in instead." });
  const u = await saveUser({ email, name: (name || email.split("@")[0]).slice(0, 80), pw: hashPw(password), plan: "free", created: new Date().toISOString() });
  send(res, 201, { user: publicUser(u) }, { "Set-Cookie": sessionCookie(publicUser(u)) });
}
