import { allowMethods, readJson, send, getServiceClient, cleanStr, isEmail, isPhone } from './_lib/server.js';

function phonesMatch(inputPhone, dbPhone) {
  if (!inputPhone || !dbPhone) return false;
  const inTrim = String(inputPhone).trim();
  const dbTrim = String(dbPhone).trim();
  if (inTrim === dbTrim) return true;

  const inDigits = inTrim.replace(/\D/g, '');
  const dbDigits = dbTrim.replace(/\D/g, '');
  if (inDigits === dbDigits && inDigits.length > 0) return true;

  // Compare last 10 digits (handles country code prefixes like +91, 0, etc.)
  if (inDigits.length >= 10 && dbDigits.length >= 10) {
    if (inDigits.slice(-10) === dbDigits.slice(-10)) return true;
  }
  return false;
}

// POST /api/retrieve-pass  { email, phone }
// Returns the registered member's pass if BOTH email and phone match.
export default async function handler(req, res) {
  if (!allowMethods(req, res, ['POST'])) return;

  const body = await readJson(req);
  const email = cleanStr(body.email, 254).toLowerCase();
  const phone = cleanStr(body.phone, 20);

  if (!isEmail(email) || !isPhone(phone)) {
    return send(res, 400, { error: 'Please enter a valid email and phone number' });
  }

  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('founder_passes')
      .select('id, name, email, phone, member_id, tagline, created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[retrieve-pass] lookup failed:', error.code);
      return send(res, 500, { error: 'Verification failed' });
    }

    if (!data || data.length === 0 || !phonesMatch(phone, data[0].phone)) {
      // Constant-time mitigation to defeat timing and email-enumeration attacks
      await new Promise((r) => setTimeout(r, 120));
      return send(res, 404, { error: 'NO MATCHING CULT PASS FOUND // CHECK EMAIL & PHONE' });
    }

    const member = data[0];

    return send(res, 200, {
      ok: true,
      pass: {
        name: member.name || email.split('@')[0].toUpperCase(),
        email: member.email,
        phone: member.phone,
        memberId: member.member_id || 'DF-2026-VIP',
        tagline: member.tagline || "BORN FROM OBSESSION. BUILT WITHOUT COMPROMISE.",
        createdAt: member.created_at,
      },
    });
  } catch (err) {
    console.error('[retrieve-pass]', err.message);
    return send(res, 500, { error: 'Verification error' });
  }
}
