import { db } from '../services/firebase.js';
import { AppState } from '../services/state.js';
import { collection, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export async function initLeaderboard() {
  const gamesContainer = document.getElementById('games-container');
  // We append leaderboard below games in the right column
  
  const header = document.createElement('h4');
  header.textContent = "Top Players (All-Time)";
  header.style.marginTop = '20px';
  header.style.marginBottom = '10px';
  header.style.paddingLeft = '8px';
  header.style.color = 'var(--text-secondary)';
  
  gamesContainer.appendChild(header);

  const listContainer = document.createElement('div');
  listContainer.style.display = 'flex';
  listContainer.style.flexDirection = 'column';
  listContainer.style.gap = '8px';
  gamesContainer.appendChild(listContainer);

  try {
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    
    let rank = 1;
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('div');
      row.className = 'glass-card';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.padding = '12px';
      
      row.innerHTML = `
        <div style="font-weight: 700; color: var(--text-muted); width: 24px;">#${rank}</div>
        <img src="${data.avatar}" style="width: 32px; height: 32px; margin: 0 12px; border-radius: 50%;">
        <div style="flex: 1; font-weight: 500;">${data.displayName}</div>
        <div style="font-weight: 700; color: var(--accent-color);">${data.xp || 0} XP</div>
      `;
      listContainer.appendChild(row);
      rank++;
    });
  } catch (e) {
    console.error("Failed to load leaderboard", e);
  }
}
