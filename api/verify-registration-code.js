import { supabase } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic auth check
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString().split(':');
  const [username, password] = credentials;
  if (username !== 'account@valiancev2.it' || password !== '112@Outofhead!') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const normalizedEmail = email.toLowerCase();
  console.log('Verifying code for email:', email, '(normalized:', normalizedEmail + ')');
  console.log('Received code:', code);
  console.log('Trimmed code:', code.trim());

  // Get the stored code from Supabase
  const { data: stored, error: fetchError } = await supabase
    .from('registration_codes')
    .select('*')
    .eq('email', normalizedEmail)
    .single();

  if (fetchError || !stored) {
    console.log('No stored code for email:', email, '(normalized:', normalizedEmail + ')');
    return res.status(400).json({ error: 'No code found for this email' });
  }

  console.log('Stored code:', stored.code);
  console.log('Stored expires_at:', stored.expires_at);

  // Check if code is expired
  if (new Date(stored.expires_at) < new Date()) {
    // Delete expired code
    await supabase
      .from('registration_codes')
      .delete()
      .eq('email', normalizedEmail);
    return res.status(400).json({ error: 'Code expired' });
  }

  if (stored.code !== code.trim()) {
    console.log('Code mismatch:', stored.code, '!==', code.trim());
    return res.status(400).json({ error: 'Invalid code' });
  }

  // Code is valid, remove it
  await supabase
    .from('registration_codes')
    .delete()
    .eq('email', normalizedEmail);

  res.status(200).json({ message: 'Code verified successfully' });
}
