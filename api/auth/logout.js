import { send, clearCookie } from "../_lib.js";
export default async function handler(req, res) { send(res, 200, { ok: true }, { "Set-Cookie": clearCookie() }); }
