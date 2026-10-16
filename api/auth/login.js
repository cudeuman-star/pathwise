import { body, send, method, getUser, checkPw, sessionCookie, publicUser } from "../_lib.js";
export default async function handler(req, res) {
  if (!method(req, res, "POST")) return;
  const { email, password } = await body(req);
  const u = email && await getUser(email);
  if (!u || !checkPw(password || "", u.pw)) return send(res, 401, { error: "Incorrect email or password." });
  send(res, 200, { user: publicUser(u) }, { "Set-Cookie": sessionCookie(publicUser(u)) });
}
