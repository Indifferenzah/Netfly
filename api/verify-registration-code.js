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

  if (!global.registrationCodes) {
    return res.status(400).json({ error: 'No code found for this email' });
  }

  const stored = global.registrationCodes.get(email);
  if (!stored) {
    return res.status(400).json({ error: 'No code found for this email' });
  }

  // Check if code is expired (10 minutes)
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    global.registrationCodes.delete(email);
    return res.status(400).json({ error: 'Code expired' });
  }

  if (stored.code !== code) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  // Code is valid, remove it
  global.registrationCodes.delete(email);

  res.status(200).json({ message: 'Code verified successfully' });
}
