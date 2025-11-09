const { WebhookClient } = require('discord.js');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { ign, discord_username, name, type, message } = req.body;

    if (!ign || !discord_username || !name || !type || !message) {
      return res.status(400).json({ error: 'Tutti i campi sono obbligatori' });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      return res.status(500).json({ error: 'Webhook non configurato' });
    }

    const webhook = new WebhookClient({ url: webhookUrl });

    const embed = {
      title: 'Nuova Richiesta',
      color: 0x22d3ee,
      fields: [
        { name: 'IGN', value: ign, inline: true },
        { name: 'Username Discord', value: discord_username, inline: true },
        { name: 'Nome', value: name, inline: true },

        { name: 'Tipo Richiesta', value: type, inline: true },
        { name: 'Messaggio', value: message, inline: false },
        { name: 'Stato', value: 'Aperta', inline: true },
      ],
      timestamp: new Date().toISOString(),
    };

    await webhook.send({ embeds: [embed] });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
