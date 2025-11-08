// Netlify Function: get-avatar
// Usage: /.netlify/functions/get-avatar?id=<discord_user_id>
// Requires environment variable DISCORD_BOT_TOKEN set in Netlify site settings.

export async function handler(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  const id = event.queryStringParameters?.id;
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing id' }) };
  }
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    // Fallback to default embed avatar if token not configured
    try {
      const idx = Number(BigInt(id) % 6n);
      return { statusCode: 200, headers, body: JSON.stringify({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true }) };
    } catch {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server not configured' }) };
    }
  }
  try {
    const resp = await fetch(`https://discord.com/api/users/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bot ${token}` },
    });
    if (!resp.ok) {
      const idx = Number(BigInt(id) % 6n);
      return { statusCode: resp.status, headers, body: JSON.stringify({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true }) };
    }
    const user = await resp.json();
    let url;
    if (user.avatar) {
      const ext = user.avatar.startsWith('a_') ? 'gif' : 'png';
      url = `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${ext}?size=128`;
    } else {
      const idx = Number(BigInt(id) % 6n);
      url = `https://cdn.discordapp.com/embed/avatars/${idx}.png`;
    }
    return { statusCode: 200, headers, body: JSON.stringify({ url }) };
  } catch (e) {
    try {
      const idx = Number(BigInt(id) % 6n);
      return { statusCode: 200, headers, body: JSON.stringify({ url: `https://cdn.discordapp.com/embed/avatars/${idx}.png`, fallback: true }) };
    } catch {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unexpected error' }) };
    }
  }
}
