import { AppState } from '../services/state.js';
import { db } from '../services/firebase.js';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function initAdmin() {
  const btnDebug = document.getElementById('btn-debug');
  
  if (AppState.user && (AppState.user.role === 'admin' || AppState.user.username === 'godkevz123')) {
    btnDebug.classList.remove('hidden');
    btnDebug.style.display = 'flex';
    btnDebug.onclick = showAdminPanel;
  }
}

async function showAdminPanel() {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.top = 0; overlay.left = 0; overlay.width = '100vw'; overlay.height = '100vh';
  overlay.style.backgroundColor = 'var(--bg-primary)';
  overlay.style.zIndex = 3000;
  overlay.style.padding = '40px';
  overlay.style.overflowY = 'auto';

  overlay.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2>God-Level Admin Panel</h2>
        <button id="close-admin" class="btn-primary" style="background-color: var(--danger-color);">Close</button>
      </div>
      
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1; background: #fff; padding: 20px; border-radius: var(--radius-lg); box-shadow: var(--shadow-soft);">
           <h3>Manage Users</h3>
           <button id="load-users" class="btn-primary" style="margin-top: 10px; font-size: 12px;">Load All Users</button>
           <div id="admin-users-list" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"></div>
        </div>

        <div style="flex: 1; background: #fff; padding: 20px; border-radius: var(--radius-lg); box-shadow: var(--shadow-soft);">
           <h3>Global Controls</h3>
           <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
             <button id="wipe-global-chat" class="btn-primary" style="background-color: var(--danger-color); font-size: 12px;">Wipe Global Chat</button>
             <button id="reset-leaderboards" class="btn-primary" style="background-color: var(--danger-color); font-size: 12px;">Reset XP Leaderboards</button>
           </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('close-admin').onclick = () => {
    document.body.removeChild(overlay);
  };

  document.getElementById('load-users').onclick = async () => {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = 'Loading...';
    try {
      const snap = await getDocs(collection(db, 'users'));
      list.innerHTML = '';
      snap.forEach(d => {
        const data = d.data();
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '10px';
        row.style.border = '1px solid var(--bg-tertiary)';
        row.style.borderRadius = 'var(--radius-sm)';
        
        row.innerHTML = `
          <div>
            <strong>${data.displayName}</strong> 
            <span style="font-size:11px; color:gray;">(@${data.username})</span>
          </div>
          <div>
            ${data.role !== 'admin' ? `<button class="btn-ban" style="color:var(--danger-color); font-size:12px; font-weight:bold; cursor:pointer;">BAN</button>` : 'ADMIN'}
          </div>
        `;
        list.appendChild(row);
        
        const banBtn = row.querySelector('.btn-ban');
        if (banBtn) {
          banBtn.onclick = async () => {
            if (confirm(`Ban ${data.username}?`)) {
               await updateDoc(doc(db, 'users', d.id), { role: 'banned' });
               alert('Banned');
            }
          };
        }
      });
    } catch (e) {
      list.innerHTML = 'Failed to load';
    }
  };

}
