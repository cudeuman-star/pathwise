import { getUser, saveUser, sessionCookie, publicUser } from "../_lib.js";
export async function upgrade(sessionUser, extra = {}) {
  const stored = !sessionUser.demo && await getUser(sessionUser.email);
  if (stored) await saveUser({ ...stored, plan: "pro", ...extra });
  const u = publicUser({ ...sessionUser, plan: "pro" });
  return { user: u, cookie: sessionCookie(u) };
}
