import {
  allowMethods, readJson, send, getServiceClient, isAdminUser,
  sessionCookie, cleanStr, isEmail, createSignedToken,
} from '../_lib/server.js';

// POST /api/admin/login  { email, password }
// Supports either:
// 1. Direct server ADMIN_PASSWORD (set in .env or Vercel environment variables)
// 2. Supabase Auth email + password
// Sets a secure HttpOnly cookie on success.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJson(req);
  const email = cleanStr(body.email, 254).toLowerCase();
  const password = typeof body.password === 'string' ? body.password.slice(0, 200) : '';

  const denied = async (msg = 'Invalid credentials') => {
    // Artificial 500ms delay to throttle automated brute-force attempts
    await new Promise((r) => setTimeout(r, 500));
    return send(res, 401, { error: msg });
  };

  if (!password) return denied();

  try {
    // 1. Check direct server-side ADMIN_PASSWORD if configured
    const serverAdminPass = process.env.ADMIN_PASSWORD;
    if (serverAdminPass && password === serverAdminPass) {
      const maxAge = 8 * 3600; // 8 hours
      const token = createSignedToken({
        role: 'admin',
        email: email || 'admin@demonicfuel.com',
        exp: Date.now() + maxAge * 1000,
      });
      return send(res, 200, { ok: true }, {
        'Set-Cookie': sessionCookie(token, maxAge),
      });
    }

    // 2. Fallback to Supabase Auth user verification
    if (isEmail(email)) {
      const authClient = getServiceClient();
      const db = getServiceClient();

      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (!error && data?.session) {
        if (!(await isAdminUser(db, data.user.id))) {
          return denied('Account not authorized');
        }
        const maxAge = Math.min(data.session.expires_in || 3600, 3600);
        return send(res, 200, { ok: true }, {
          'Set-Cookie': sessionCookie(data.session.access_token, maxAge),
        });
      }
    }

    return denied();
  } catch (err) {
    console.error('[admin/login]', err.message);
    return send(res, 500, { error: 'Login failed' });
  }
}
