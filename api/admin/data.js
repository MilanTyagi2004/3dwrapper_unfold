import { allowMethods, send, requireAdmin, getServiceClient } from '../_lib/server.js';

// GET /api/admin/data → founder passes + newsletter subscribers (admins only)
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['GET'])) return;

  try {
    if (!(await requireAdmin(req))) return send(res, 401, { error: 'Unauthorized' });

    const db = getServiceClient();
    const [passes, news] = await Promise.all([
      db.from('founder_passes')
        .select('id, member_id, name, email, phone, tagline, created_at')
        .order('created_at', { ascending: false }),
      db.from('newsletter_subscribers')
        .select('id, email, created_at')
        .order('created_at', { ascending: false }),
    ]);

    if (passes.error || news.error) {
      console.error('[admin/data] query failed:', passes.error?.code, news.error?.code);
      return send(res, 500, { error: 'Query failed' });
    }

    return send(res, 200, { passes: passes.data || [], newsletter: news.data || [] });
  } catch (err) {
    console.error('[admin/data]', err.message);
    return send(res, 500, { error: 'Query failed' });
  }
}
