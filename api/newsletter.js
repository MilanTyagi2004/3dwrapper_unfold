import { allowMethods, readJson, send, getServiceClient, cleanStr, isEmail } from './_lib/server.js';

// POST /api/newsletter  { email }
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJson(req);
  const email = cleanStr(body.email, 254).toLowerCase();
  if (!isEmail(email)) return send(res, 400, { error: 'Invalid email' });

  try {
    const db = getServiceClient();
    const { error } = await db.from('newsletter_subscribers').insert({ email });
    // Treat duplicates as success so the endpoint can't be used to probe emails
    if (error && error.code !== '23505') {
      console.error('[newsletter] insert failed:', error.code);
      return send(res, 500, { error: 'Could not save' });
    }
    return send(res, 201, { ok: true });
  } catch (err) {
    console.error('[newsletter]', err.message);
    return send(res, 500, { error: 'Could not save' });
  }
}
