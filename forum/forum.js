// Forum functionality
import { supabase } from './auth.js';

let currentCategory = null;
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
async function loadThreads(category) {
  currentCategory = category;
  const threadsList = document.getElementById('threads-list');
  const threadView = document.getElementById('thread-view');
  threadView.style.display = 'none';
  threadsList.style.display = 'block';

  try {
    const { data: discussions, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!discussions || discussions.length === 0) {
      threadsList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <p style="color: var(--muted); margin-bottom: 20px;">Nessuna discussione ancora. Sii il primo a creare un thread!</p>
          <button class="btn primary" onclick="createNewThread()">Crea Nuovo Thread</button>
        </div>
      `;
    } else {
      threadsList.innerHTML = discussions.map(thread => `
        <div class="thread">
          <div>
            <div class="thread-title">${thread.title}</div>
            <div class="thread-meta">da ${thread.author} - ${new Date(thread.created_at).toLocaleDateString()}</div>
          </div>
          <button class="btn" onclick="viewThread('${category}', '${thread.id}')">Visualizza</button>
          ${currentUser && currentUser.isAdmin ? `<button class="btn" onclick="deleteThread('${category}', '${thread.id}')">Elimina</button>` : ''}
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading threads:', error);
    threadsList.innerHTML = '<p style="color: red;">Errore nel caricamento delle discussioni.</p>';
  }
}

// View a specific thread
async function viewThread(category, threadId) {
  const threadView = document.getElementById('thread-view');
  const threadsList = document.getElementById('threads-list');
  threadsList.style.display = 'none';
  threadView.style.display = 'block';

  try {
    // Get the discussion
    const { data: discussion, error: discussionError } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', threadId)
      .single();

    if (discussionError) throw discussionError;

    // Get replies
    const { data: replies, error: repliesError } = await supabase
      .from('replies')
      .select('*')
      .eq('discussion_id', threadId)
      .order('created_at', { ascending: true });

    if (repliesError) throw repliesError;

    let repliesHtml = '';
    if (replies && replies.length > 0) {
      repliesHtml = replies.map(reply => `
        <div class="reply" style="border-left: 3px solid var(--brand); padding-left: 15px; margin-top: 15px; background: var(--panel); padding: 10px; border-radius: 8px;">
          <p>${reply.content}</p>
          <div class="thread-meta">da ${reply.author} - ${new Date(reply.created_at).toLocaleDateString()}</div>
        </div>
      `).join('');
    }

    threadView.innerHTML = `
      <h3>${discussion.title}</h3>
      <p>${discussion.content}</p>
      <div class="thread-meta">da ${discussion.author} - ${new Date(discussion.created_at).toLocaleDateString()}</div>
      ${repliesHtml}
      <button class="btn" onclick="loadThreads('${category}')">Torna alla lista</button>
      ${currentUser ? '<button class="btn primary" onclick="replyToThread(\'' + category + '\', \'' + threadId + '\')">Rispondi</button>' : '<p style="color: var(--muted); margin-top: 10px;">Accedi per rispondere</p>'}
    `;
  } catch (error) {
    console.error('Error loading thread:', error);
    threadView.innerHTML = '<p style="color: red;">Errore nel caricamento del thread.</p>';
  }
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

  document.getElementById('thread-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('thread-title').value;
    const content = document.getElementById('thread-content').value;

    if (!title || !content) return;

    try {
      const { data, error } = await supabase
        .from('discussions')
        .insert({
          title,
          content: parseBBCode(content),
          author: currentUser.user_metadata?.username || currentUser.email,
          category: currentCategory
        });

      if (error) throw error;

      loadThreads(currentCategory);
      closeModal();
    } catch (error) {
      console.error('Error creating thread:', error);
      alert('Errore nella creazione del thread.');
    }
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

  document.getElementById('reply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const content = document.getElementById('reply-content').value;

    if (!content) return;

    try {
      const { data, error } = await supabase
        .from('replies')
        .insert({
          discussion_id: threadId,
          content: parseBBCode(content),
          author: currentUser.user_metadata?.username || currentUser.email
        });

      if (error) throw error;

      viewThread(category, threadId);
      closeModal();
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('Errore nell\'invio della risposta.');
    }
  });
}

// Delete thread (admin only)
async function deleteThread(category, threadId) {
  if (!currentUser || !currentUser.isAdmin) return;

  try {
    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', threadId);

    if (error) throw error;

    loadThreads(category);
  } catch (error) {
    console.error('Error deleting thread:', error);
    alert('Errore nell\'eliminazione del thread.');
  }
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
