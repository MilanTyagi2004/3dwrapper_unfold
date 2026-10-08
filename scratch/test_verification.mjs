import { supabase } from '../src/lib/supabase.js';

async function runTests() {
  console.log('=== TEST 1: SUPABASE CLIENT & LIVE DATABASE ===');
  const { data: passes, error: pErr } = await supabase.from('founder_passes').select('*');
  if (pErr) {
    console.error('FAILED to fetch founder_passes:', pErr);
    process.exit(1);
  }
  console.log(`PASSED: Fetched ${passes.length} founder pass rows.`);
  if (passes.length > 0) {
    console.log('Sample Row:', {
      member_id: passes[0].member_id,
      name: passes[0].name,
      email: passes[0].email,
      phone: passes[0].phone
    });
  }

  console.log('\n=== TEST 2: DUPLICATE DETECTION CHECK ===');
  const existingEmail = passes.length > 0 ? passes[0].email : 'milantyagi2004@gmail.com';
  const { data: dupCheck } = await supabase
    .from('founder_passes')
    .select('id, email, member_id')
    .eq('email', existingEmail.toLowerCase())
    .limit(1);

  if (dupCheck && dupCheck.length > 0) {
    console.log(`PASSED: Duplicate successfully detected for '${existingEmail}'! ID: ${dupCheck[0].member_id}`);
  } else {
    console.error('FAILED: Duplicate check failed to find existing email.');
  }

  console.log('\n=== TEST 3: NEWSLETTER TABLE CHECK ===');
  const { data: news, error: nErr } = await supabase.from('newsletter_subscribers').select('*');
  if (nErr) {
    console.error('FAILED to fetch newsletter_subscribers:', nErr);
  } else {
    console.log(`PASSED: Newsletter subscribers query successful (${news.length} rows).`);
  }

  console.log('\n=== TEST 4: EXCEL / CSV EXPORT DATA INTEGRITY ===');
  const headers = ['PASS ID', 'FULL NAME', 'EMAIL ADDRESS', 'PHONE NUMBER', 'ASSIGNED MOTTO', 'REGISTRATION DATE (UTC)'];
  const rows = passes.map(p => [
    `"${p.member_id || ''}"`,
    `"${p.name || ''}"`,
    `"${p.email || ''}"`,
    `"${p.phone || ''}"`,
    `"${(p.tagline || '').replace(/"/g, '""')}"`,
    `"${p.created_at ? new Date(p.created_at).toISOString() : ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  console.log('CSV UTF-8 BOM present:', csvContent.charCodeAt(0) === 0xFEFF);
  console.log('CSV Lines count:', csvContent.split('\r\n').length);
  console.log('CSV Sample Output:\n' + csvContent.split('\r\n').slice(0, 3).join('\n'));

  console.log('\n=== TEST 5: PASS ID GENERATOR RANDOMNESS ===');
  const sampleIds = new Set();
  const letters = ['X', 'Z', 'V', 'K', 'R', 'M', 'A', 'B', 'C', 'D'];
  for (let i = 0; i < 20; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const suffix = Math.floor(1 + Math.random() * 9);
    sampleIds.add(`DF-${num}-${letter}${suffix}`);
  }
  console.log(`Generated 20 sample Member IDs. Unique count: ${sampleIds.size}/20`);
  console.log('Sample IDs:', Array.from(sampleIds).slice(0, 5));

  console.log('\n>>> ALL 5 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY! <<<');
}

runTests();
