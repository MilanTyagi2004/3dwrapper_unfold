import { allowMethods, send, clearSessionCookie } from '../_lib/server.js';

// POST /api/admin/logout
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;
  return send(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
}
