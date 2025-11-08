// netlify/functions/get-avatar.js

export default async (req, context) => {
  const id = context.params?.id || req.query.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Fetch informazioni utente Discord
    const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    });
    if (!res.ok) throw new Error("Discord API error: " + res.status);
    const data = await res.json();

    // Costruisci URL avatar
    let url;
    if (data.avatar) {
      const ext = data.avatar.startsWith("a_") ? "gif" : "png";
      url = `https://cdn.discordapp.com/avatars/${id}/${data.avatar}.${ext}?size=128`;
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
