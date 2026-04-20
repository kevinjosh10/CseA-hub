import { db } from '../services/firebase.js';
import { AppState } from '../services/state.js';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { launchGameInCanvas } from '../services/gameLogic.js';

const gamesList = [
  { id: 'tictactoe', name: 'Tic Tac Toe', type: 'multiplayer', icon: '❌⭕' },
  { id: 'snake', name: 'Snake', type: 'solo', icon: '🐍' }
];

export function initGames() {
  const gamesContainer = document.getElementById('games-container');
  gamesContainer.innerHTML = '';

  gamesList.forEach(game => {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="font-size: 24px;">${game.icon}</div>
        <div>
          <div style="font-weight: 600; color: #fff;">${game.name}</div>
          <div style="font-size: 12px; color: var(--accent-color); text-transform: uppercase;">${game.type}</div>
        </div>
      </div>
      <div>
        <button class="btn-primary" style="padding: 8px 16px; font-size: 13px;">Play</button>
      </div>
    `;

    card.querySelector('button').addEventListener('click', (e) => {
      e.stopPropagation();
      launchGame(game);
    });

    gamesContainer.appendChild(card);
  });

  listenForChallenges();
}

let challengeUnsub = null;

function listenForChallenges() {
  if (challengeUnsub) challengeUnsub();
  if (!AppState.user) return;

  const q = query(
    collection(db, 'games'), 
    where('status', '==', 'pending'),
    where('players', 'array-contains', AppState.user.id)
  );

  challengeUnsub = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const gameData = change.doc.data();
        if (gameData.creator !== AppState.user.id) {
          showChallengePopup(change.doc.id, gameData);
        }
      }
    });
  });
}

function showChallengePopup(gameId, data) {
  const accept = confirm(`You have been challenged to ${data.type.toUpperCase()}! Accept?`);
  if (accept) {
    updateDoc(doc(db, 'games', gameId), {
      status: 'playing'
    }).then(() => {
      startCanvasGame(data.type, gameId, false);
    });
  } else {
    updateDoc(doc(db, 'games', gameId), {
      status: 'declined'
    });
  }
}

export async function challengeUser(targetUserId, gameId) {
  try {
    const docRef = await addDoc(collection(db, 'games'), {
      type: gameId,
      status: 'pending',
      creator: AppState.user.id,
      players: [AppState.user.id, targetUserId],
      boardState: ['', '', '', '', '', '', '', '', ''],
      lastMove: null
    });
    alert("Challenge sent! Waiting for them to accept...");
    const unsub = onSnapshot(doc(db, 'games', docRef.id), (snap) => {
      const data = snap.data();
      if (data && data.status === 'playing') {
        unsub();
        startCanvasGame(gameId, docRef.id, true);
      } else if (data && data.status === 'declined') {
        unsub();
        alert("Challenge declined.");
      }
    });
  } catch (e) {
    alert("Failed to send challenge");
  }
}

async function showChallengeSelectModal(gameId) {
  const users = await getDocs(collection(db, 'users'));
  
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed'; overlay.top=0; overlay.left=0; overlay.width='100vw'; overlay.height='100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.8)'; overlay.style.zIndex=3000;
  overlay.style.display = 'flex'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';
  
  const modal = document.createElement('div');
  modal.className = 'glass-panel';
  modal.style.padding = '24px'; modal.style.width = '300px'; modal.style.maxHeight = '80vh'; modal.style.overflowY = 'auto';
  
  modal.innerHTML = `<h3 style="color:#fff; margin-bottom: 16px;">Select opponent</h3>`;
  
  users.forEach(u => {
    if (u.id === AppState.user.id) return;
    const data = u.data();
    const btn = document.createElement('button');
    btn.className = 'glass-card';
    btn.style.width = '100%'; btn.style.marginBottom = '8px'; btn.style.color = '#fff'; btn.style.textAlign = 'left';
    btn.textContent = data.displayName;
    btn.onclick = () => {
      document.body.removeChild(overlay);
      challengeUser(u.id, gameId);
    };
    modal.appendChild(btn);
  });

  const cancel = document.createElement('button');
  cancel.className = 'btn-primary'; cancel.style.backgroundColor = 'var(--danger-color)'; cancel.style.marginTop = '16px'; cancel.style.width = '100%';
  cancel.textContent = 'Cancel';
  cancel.onclick = () => document.body.removeChild(overlay);
  
  modal.appendChild(cancel);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

function launchGame(game) {
  if (game.type === 'solo') {
    startCanvasGame(game.id, 'solo_local', true);
  } else {
    showChallengeSelectModal(game.id);
  }
}

function startCanvasGame(gameId, instanceId, isHost) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed'; overlay.top = 0; overlay.left = 0; overlay.width = '100vw'; overlay.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.9)'; overlay.style.zIndex = 2000;
  overlay.style.display = 'flex'; overlay.style.flexDirection = 'column'; overlay.style.justifyContent = 'center'; overlay.style.alignItems = 'center';

  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth > 400 ? 400 : window.innerWidth - 40;
  canvas.height = window.innerHeight > 600 ? 500 : window.innerHeight - 100;
  canvas.style.backgroundColor = '#0a0a0a';
  canvas.style.border = '1px solid var(--glass-border)';
  canvas.style.borderRadius = 'var(--radius-lg)';
  canvas.style.boxShadow = 'var(--shadow-float)';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Quit Game';
  closeBtn.className = 'btn-primary';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.backgroundColor = 'var(--danger-color)';
  closeBtn.onclick = () => {
    if (canvas.dataset.cleanup) canvas.dataset.cleanup();
    document.body.removeChild(overlay);
  };

  overlay.appendChild(canvas);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  // Invoke dedicated game logic logic engine!
  launchGameInCanvas(gameId, instanceId, isHost, canvas, closeBtn.onclick);
}/2, canvas.height/2);
}
