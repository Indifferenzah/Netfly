async function applyDiscordAvatars() {
  const members = Array.from(document.querySelectorAll(".member[data-discord-id]"));
  const batchSize = 3;
  const delayBetweenBatches = 250;

  function fallbackAvatar(id, el) {
    try {
      const idx = Number((BigInt(id) >> 22n) % 6n);
      el.style.background = `center / cover no-repeat url('https://cdn.discordapp.com/embed/avatars/${idx}.png')`;
      el.style.border = "1px solid #1f3a5a";
      el.textContent = "";
    } catch { el.textContent = ""; }
  }

  for (let i = 0; i < members.length; i += batchSize) {
    const batch = members.slice(i, i + batchSize);

    await Promise.all(batch.map(async (m) => {
      const id = m.getAttribute("data-discord-id");
      const avatarEl = m.querySelector(".avatar");
      if (!id) return;

      try {
        const res = await fetch(`/api/get-avatar?id=${encodeURIComponent(id)}`);
        if (!res.ok) return fallbackAvatar(id, avatarEl);

        const data = await res.json();
        if (!data?.url) return fallbackAvatar(id, avatarEl);

        avatarEl.style.background = `center / cover no-repeat url('${data.url}')`;
        avatarEl.style.border = "1px solid #1f3a5a";
        avatarEl.textContent = "";
      } catch (e) {
        console.error(`Avatar error for ID ${id}:`, e);
        fallbackAvatar(id, avatarEl);
      }
    }));

    if (i + batchSize < members.length) await new Promise(r => setTimeout(r, delayBetweenBatches));
  }
}

applyDiscordAvatars();
