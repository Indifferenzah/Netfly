// Forum functionality
let currentCategory = null;
let threads = JSON.parse(localStorage.getItem('forum-threads')) || {};
let users = JSON.parse(localStorage.getItem('forum-users')) || {};
let onlineUsers = JSON.parse(localStorage.getItem('forum-online-users')) || [];
let currentUser = null;

// Function to set current user from auth.js
window.setCurrentUser = function(user) {
  currentUser = user;
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  loadDiscordWidget();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('new-thread-btn').addEventListener('click', () => createNewThread());
}

// Load threads for a category
function loadThreads(category) {
  currentCategory = category;
  const threadsList = document.getElementById('threads-list');
  const threadView = document.getElementById('thread-view');
  threadView.style.display = 'none';
  threadsList.style.display = 'block';

  const categoryThreads = threads[category] || [];

  if (categoryThreads.length === 0) {
    threadsList.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <p style="color: var(--muted); margin-bottom: 20px;">Nessuna discussione ancora. Sii il primo a creare un thread!</p>
        <button class="btn primary" onclick="createNewThread()">Crea Nuovo Thread</button>
      </div>
    `;
  } else {
    threadsList.innerHTML = categoryThreads.map(thread => `
      <div class="thread">
        <div>
          <div class="thread-title">${thread.title}</div>
          <div class="thread-meta">da ${thread.author} - ${new Date(thread.date).toLocaleDateString()}</div>
        </div>
        <button class="btn" onclick="viewThread('${category}', '${thread.id}')">Visualizza</button>
        ${currentUser && currentUser.isAdmin ? `<button class="btn" onclick="deleteThread('${category}', '${thread.id}')">Elimina</button>` : ''}
      </div>
    `).join('');
  }
}

// View a specific thread
function viewThread(category, threadId) {
  const thread = threads[category].find(t => t.id === threadId);
  if (!thread) return;

  const threadView = document.getElementById('thread-view');
  const threadsList = document.getElementById('threads-list');
  threadsList.style.display = 'none';
  threadView.style.display = 'block';

  let repliesHtml = '';
  if (thread.replies && thread.replies.length > 0) {
    repliesHtml = thread.replies.map(reply => `
      <div class="reply" style="border-left: 3px solid var(--brand); padding-left: 15px; margin-top: 15px; background: var(--panel); padding: 10px; border-radius: 8px;">
        <p>${reply.content}</p>
        <div class="thread-meta">da ${reply.author} - ${new Date(reply.date).toLocaleDateString()}</div>
      </div>
    `).join('');
  }

  threadView.innerHTML = `
    <h3>${thread.title}</h3>
    <p>${thread.content}</p>
    <div class="thread-meta">da ${thread.author} - ${new Date(thread.date).toLocaleDateString()}</div>
    ${repliesHtml}
    <button class="btn" onclick="loadThreads('${category}')">Torna alla lista</button>
    ${currentUser ? '<button class="btn primary" onclick="replyToThread(\'' + category + '\', \'' + threadId + '\')">Rispondi</button>' : '<p style="color: var(--muted); margin-top: 10px;">Accedi per rispondere</p>'}
  `;
}

// Create new thread
function createNewThread() {
  if (!currentUser) {
    // Show registration prompt for unauthenticated users
    const register = confirm('Per creare un thread devi essere registrato. Vuoi registrarti ora?');
    if (register) {
      window.location.href = 'register.html';
    }
    return;
  }

  // Show BBCode editor modal
  showThreadEditor();
}

function showThreadEditor() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <h2>Crea Nuovo Thread</h2>
      <form id="thread-form">
        <div class="form-group">
          <label for="thread-title">Titolo:</label>
          <input type="text" id="thread-title" required>
        </div>
        <div class="form-group">
          <label for="thread-content">Contenuto:</label>
          <div class="bbcode-toolbar">
            <button type="button" onclick="insertBBCode('[b]', '[/b]')" title="Grassetto">B</button>
            <button type="button" onclick="insertBBCode('[i]', '[/i]')" title="Corsivo">I</button>
            <button type="button" onclick="insertBBCode('[u]', '[/u]')" title="Sottolineato">U</button>
            <button type="button" onclick="insertBBCode('[color=red]', '[/color]')" title="Rosso">🔴</button>
            <button type="button" onclick="insertBBCode('[color=blue]', '[/color]')" title="Blu">🔵</button>
            <button type="button" onclick="insertBBCode('[color=green]', '[/color]')" title="Verde">🟢</button>
            <button type="button" onclick="insertBBCode('[url=]', '[/url]')" title="Link">🔗</button>
          </div>
          <textarea id="thread-content" rows="10" required></textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn" onclick="closeModal()">Annulla</button>
          <button type="submit" class="btn primary">Crea Thread</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('thread-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('thread-title').value;
    const content = document.getElementById('thread-content').value;

    if (!title || !content) return;

    const thread = {
      id: Date.now().toString(),
      title,
      content: parseBBCode(content),
      author: currentUser.user_metadata?.username || currentUser.email,
      date: new Date().toISOString()
    };

    if (!threads[currentCategory]) threads[currentCategory] = [];
    threads[currentCategory].push(thread);
    localStorage.setItem('forum-threads', JSON.stringify(threads));
    loadThreads(currentCategory);
    closeModal();
  });
}

function insertBBCode(openTag, closeTag) {
  const textarea = document.getElementById('thread-content');
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const beforeText = textarea.value.substring(0, start);
  const afterText = textarea.value.substring(end);

  textarea.value = beforeText + openTag + selectedText + closeTag + afterText;
  textarea.focus();
  textarea.setSelectionRange(start + openTag.length, end + openTag.length);
}

function parseBBCode(text) {
  return text
    .replace(/\[b\](.*?)\[\/b\]/gi, '<strong>$1</strong>')
    .replace(/\[i\](.*?)\[\/i\]/gi, '<em>$1</em>')
    .replace(/\[u\](.*?)\[\/u\]/gi, '<u>$1</u>')
    .replace(/\[color=(.*?)\](.*?)\[\/color\]/gi, '<span style="color: $1">$2</span>')
    .replace(/\[url=(.*?)\](.*?)\[\/url\]/gi, '<a href="$1" target="_blank">$2</a>')
    .replace(/\n/g, '<br>');
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
}

// Reply to thread
function replyToThread(category, threadId) {
  if (!currentUser) {
    alert('Devi essere registrato per rispondere.');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <h2>Rispondi al Thread</h2>
      <form id="reply-form">
        <div class="form-group">
          <label for="reply-content">Risposta:</label>
          <div class="bbcode-toolbar">
            <button type="button" onclick="insertBBCode('[b]', '[/b]')" title="Grassetto">B</button>
            <button type="button" onclick="insertBBCode('[i]', '[/i]')" title="Corsivo">I</button>
            <button type="button" onclick="insertBBCode('[u]', '[/u]')" title="Sottolineato">U</button>
            <button type="button" onclick="insertBBCode('[color=red]', '[/color]')" title="Rosso">🔴</button>
            <button type="button" onclick="insertBBCode('[color=blue]', '[/color]')" title="Blu">🔵</button>
            <button type="button" onclick="insertBBCode('[color=green]', '[/color]')" title="Verde">🟢</button>
            <button type="button" onclick="insertBBCode('[url=]', '[/url]')" title="Link">🔗</button>
          </div>
          <textarea id="reply-content" rows="8" required></textarea>
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button type="button" class="btn" onclick="closeModal()">Annulla</button>
          <button type="submit" class="btn primary">Invia Risposta</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById('reply-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const content = document.getElementById('reply-content').value;

    if (!content) return;

    const reply = {
      id: Date.now().toString(),
      content: parseBBCode(content),
      author: currentUser.user_metadata?.username || currentUser.email,
      date: new Date().toISOString()
    };

    const thread = threads[category].find(t => t.id === threadId);
    if (thread) {
      if (!thread.replies) thread.replies = [];
      thread.replies.push(reply);
      localStorage.setItem('forum-threads', JSON.stringify(threads));
      viewThread(category, threadId);
      closeModal();
    }
  });
}

// Delete thread (admin only)
function deleteThread(category, threadId) {
  if (!currentUser || !currentUser.isAdmin) return;

  threads[category] = threads[category].filter(t => t.id !== threadId);
  localStorage.setItem('forum-threads', JSON.stringify(threads));
  loadThreads(category);
}

// Update online users display
function updateOnlineUsers() {
  const onlineUsersList = document.getElementById('online-users-list');
  onlineUsersList.innerHTML = onlineUsers.map(username => {
    const user = users[username] || { username };
    return `
      <div class="user-item">
        <div class="user-avatar" style="background-image: url('${user.pfp || ''}'); background-size: cover;"></div>
        <span>${user.name || username}</span>
      </div>
    `;
  }).join('');
}

// Load Discord widget
function loadDiscordWidget() {
  fetch('https://discord.com/api/guilds/1350073876339490826/widget.json')
    .then(response => response.json())
    .then(data => {
      const widget = document.getElementById('discord-widget');
      if (data.instant_invite) {
        widget.innerHTML = `
          <iframe src="https://discord.com/widget?id=1350073876339490826&theme=dark" width="100%" height="300" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>
        `;
      }
    })
    .catch(err => console.error('Error loading Discord widget:', err));
}
