import { subscribeToPresence } from '../services/rtdb.js';
import { db } from '../services/firebase.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { AppState } from '../services/state.js';

const userCache = new Map();

export function initUsersList() {
  const usersListEl = document.getElementById('users-list');

  subscribeToPresence(async (statusObj) => {
    usersListEl.innerHTML = '';
    
    // Convert object to array
    const users = Object.entries(statusObj).map(([uid, data]) => ({ uid, ...data }));
    
    // Sort by online first
    users.sort((a, b) => (b.online === a.online) ? 0 : b.online ? 1 : -1);

    for (const u of users) {
      // Don't show ourselves in the main list or show with ' (You)'
      // Fetch or use cache
      if (!userCache.has(u.uid)) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          userCache.set(u.uid, snap.data());
        }
      }
      
      const userData = userCache.get(u.uid);
      if (!userData) continue;

      const userRow = document.createElement('div');
      userRow.style.display = 'flex';
      userRow.style.alignItems = 'center';
      userRow.style.gap = '12px';
      userRow.style.padding = '8px 0';
      userRow.style.cursor = 'pointer';
      userRow.style.transition = 'background-color var(--transition-fast)';
      userRow.style.borderRadius = 'var(--radius-sm)';
      
      userRow.onmouseover = () => userRow.style.backgroundColor = 'var(--bg-tertiary)';
      userRow.onmouseout = () => userRow.style.backgroundColor = 'transparent';

      const isMe = u.uid === (AppState.user && AppState.user.id);
      
      userRow.innerHTML = `
        <div style="position: relative;">
          <img src="${userData.avatar}" style="width: 36px; height: 36px; border-radius: 50%; background-color: #fff;">
          <div style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background-color: ${u.online ? 'var(--success-color)' : 'var(--text-muted)'}; border: 2px solid var(--bg-secondary);"></div>
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 500; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">
            ${userData.displayName} ${isMe ? '<span style="color:var(--text-muted); font-size: 12px;">(You)</span>' : ''}
          </div>
          ${u.typing ? '<div style="font-size: 11px; color: var(--accent-color);">Typing...</div>' : ''}
          ${u.currentGame ? `<div style="font-size: 11px; color: var(--text-secondary);">Playing ${escapeHTML(u.currentGame)}</div>` : ''}
        </div>
      `;
      
      userRow.addEventListener('click', () => {
         // Open private chat or user profile
         console.log("Clicked user", userData.displayName);
      });
      
      usersListEl.appendChild(userRow);
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag));
}
