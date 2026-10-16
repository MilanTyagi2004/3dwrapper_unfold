import { allowMethods, readJson, send, getServiceClient, cleanStr, isEmail, isPhone } from './_lib/server.js';

// POST /api/founder-pass  { name, email, phone, memberId, tagline }
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJson(req);
  const email = cleanStr(body.email, 254).toLowerCase();
  const phone = cleanStr(body.phone, 20);
  const name = cleanStr(body.name, 120);
  const memberId = cleanStr(body.memberId, 40);
  const tagline = cleanStr(body.tagline, 300);

  if (!isEmail(email) || !isPhone(phone)) {
    return send(res, 400, { error: 'Invalid input' });
  }

  try {
    const db = getServiceClient();
    const { error } = await db.from('founder_passes').insert({
      name: name || null,
      email,
      phone,
      member_id: memberId || null,
      tagline: tagline || null,
    });

    if (error) {
      if (error.code === '23505') return send(res, 409, { error: 'Already registered' });
      console.error('[founder-pass] insert failed:', error.code); // server log only
      return send(res, 500, { error: 'Could not save' });
    }
    return send(res, 201, { ok: true });
  } catch (err) {
    console.error('[founder-pass]', err.message);
    return send(res, 500, { error: 'Could not save' });
  }
}
