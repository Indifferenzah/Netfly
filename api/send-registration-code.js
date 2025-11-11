import nodemailer from 'nodemailer';

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

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store the code temporarily (in a real app, use a database or Redis)
  // For simplicity, we'll use a global map (not recommended for production)
  if (!global.registrationCodes) {
    global.registrationCodes = new Map();
  }
  global.registrationCodes.set(email, { code, timestamp: Date.now() });

  // Send email using nodemailer
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'account@valiancev2.it',
      to: email,
      subject: 'Codice di Registrazione - Valiance',
      text: `Il tuo codice di registrazione è: ${code}\n\nQuesto codice scadrà tra 10 minuti.`,
      html: `<p>Il tuo codice di registrazione è: <strong>${code}</strong></p><p>Questo codice scadrà tra 10 minuti.</p>`,
    });

    res.status(200).json({ message: 'Code sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
}
