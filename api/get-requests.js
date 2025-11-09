export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.TOKEN;
    const channelId = process.env.CHANNEL_ID;

    if (!token || !channelId) {
      return res.status(500).json({ error: 'Configurazione mancante' });
    }

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=100`, {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Errore nel recupero dei messaggi' });
    }

    const messages = await response.json();

    const requests = messages
      .filter(msg => msg.embeds && msg.embeds.length > 0 && msg.embeds[0].title === 'Nuova Richiesta')
      .map(msg => {
        const embed = msg.embeds[0];
        const fields = embed.fields.reduce((acc, field) => {
          acc[field.name] = field.value;
          return acc;
        }, {});

        return {
          id: msg.id,
          ign: fields['IGN'] || '',
          discord_username: fields['Username Discord'] || '',
          name: fields['Nome'] || '',
          email: fields['Email'] || '',
          type: fields['Tipo Richiesta'] || '',
          message: fields['Messaggio'] || '',
          status: fields['Stato'] || 'Aperta',
          response: fields['Risposta'] || '',
          responder: fields['Risposto da'] || '',
          timestamp: msg.timestamp,
        };
      });

    return res.status(200).json(requests);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Errore interno del server' });
  }
}
