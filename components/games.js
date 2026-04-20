import { db } from '../services/firebase.js';
import { AppState } from '../services/state.js';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const gamesList = [
  { id: 'tictactoe', name: 'Tic Tac Toe', type: 'multiplayer', icon: '❌⭕' },
  { id: 'rps', name: 'Rock Paper Scissors', type: 'multiplayer', icon: '✊✋✌️' },
  { id: 'connect4', name: 'Connect 4', type: 'multiplayer', icon: '🔴🟡' },
  { id: 'snake', name: 'Snake', type: 'solo', icon: '🐍' },
  { id: 'reaction', name: 'Reaction Time', type: 'solo', icon: '⚡' }
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
          <div style="font-weight: 600;">${game.name}</div>
          <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">${game.type}</div>
        </div>
      </div>
      <div>
        <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;">Play</button>
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
        // Since players contains us, ensure we didn't create it
        if (gameData.creator !== AppState.user.id) {
          showChallengePopup(change.doc.id, gameData);
        }
      }
    });
  });
}

function showChallengePopup(gameId, data) {
  // Simple custom confirmation
  const accept = confirm(`You have been challenged to ${data.type} by another player! Accept?`);
  if (accept) {
    updateDoc(doc(db, 'games', gameId), {
      status: 'playing'
    }).then(() => {
      // Launch game UI
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
      boardState: {},
      lastMove: null
    });
    alert("Challenge sent! Waiting for them to accept...");
    // Local listen for game start
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

function launchGame(game) {
  if (game.type === 'solo') {
    startCanvasGame(game.id, 'solo_local', true);
  } else {
    // For now, just a dummy alert unless we have a specific target
    const targetUserId = prompt("Enter User ID to challenge (or leave blank to play vs self locally):");
    if (targetUserId) {
      challengeUser(targetUserId, game.id);
    } else {
      startCanvasGame(game.id, 'local_test', true);
    }
  }
}

function startCanvasGame(gameId, instanceId, isHost) {
  // Placeholder for triggering gameLogic.js
  console.log(`Starting ${gameId} in canvas. Instance: ${instanceId}. Host: ${isHost}`);
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.top = 0; overlay.left = 0; overlay.width = '100vw'; overlay.height = '100vh';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
  overlay.style.zIndex = 2000;
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';

  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth > 400 ? 400 : window.innerWidth - 40;
  canvas.height = window.innerHeight > 600 ? 500 : window.innerHeight - 100;
  canvas.style.backgroundColor = '#1a1a1a';
  canvas.style.borderRadius = 'var(--radius-lg)';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Quit Game';
  closeBtn.className = 'btn-primary';
  closeBtn.style.marginTop = '20px';
  closeBtn.style.backgroundColor = 'var(--danger-color)';
  closeBtn.onclick = () => document.body.removeChild(overlay);

  overlay.appendChild(canvas);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  // Render dummy context to prove it runs
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.font = '24px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`${gameId.toUpperCase()} - Ready`, canvas.width/2, canvas.height/2);
}
