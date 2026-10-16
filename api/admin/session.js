import { allowMethods, send, requireAdmin } from '../_lib/server.js';

// GET /api/admin/session → 200 if the HttpOnly cookie is a valid admin session
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;
  try {
    const admin = await requireAdmin(req);
    return admin ? send(res, 200, { ok: true }) : send(res, 401, { ok: false });
  } catch (err) {
    console.error('[admin/session]', err.message);
    return send(res, 401, { ok: false });
  }
}
