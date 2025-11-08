export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const token = process.env.DISCORD_BOT_TOKEN;

  try {
    if (!token) {
      const idx = Number((BigInt(id) >> 22n) % 6n);
      return res.status(200).json({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true });
    }

    const resp = await fetch(`https://discord.com/api/users/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bot ${token}` },
    });

    if (!resp.ok) {
      const idx = Number((BigInt(id) >> 22n) % 6n);
      return res.status(resp.status).json({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true });
    }

    const user = await resp.json();
    const url = user.avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${user.avatar.startsWith('a_') ? 'gif' : 'png'}?size=128`
      : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(id) >> 22n) % 6n)}.png`;

    return res.status(200).json({ url });
  } catch (e) {
    const idx = Number((BigInt(id) >> 22n) % 6n);
    return res.status(200).json({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true });
  }
}
