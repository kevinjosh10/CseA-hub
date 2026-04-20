import { db } from './firebase.js';
import { doc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { AppState } from './state.js';

export function launchGameInCanvas(gameId, instanceId, isHost, canvas, closeCallback) {
  const ctx = canvas.getContext('2d');
  let gameLoop;
  let unsub = null;

  if (gameId === 'snake') {
    // ----------------------------------------
    // SOLO: SNAKE GAME
    // ----------------------------------------
    let snake = [{x: 10, y: 10}];
    let food = {x: 5, y: 5};
    let dx = 1; let dy = 0;
    let score = 0;
    const size = 20;

    const handleKey = (e) => {
      if(e.key === 'ArrowUp' && dy !== 1) { dx=0; dy=-1; }
      if(e.key === 'ArrowDown' && dy !== -1) { dx=0; dy=1; }
      if(e.key === 'ArrowLeft' && dx !== 1) { dx=-1; dy=0; }
      if(e.key === 'ArrowRight' && dx !== -1) { dx=1; dy=0; }
    };
    window.addEventListener('keydown', handleKey);

    const loop = () => {
      // Move
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      // Hit wall
      if (head.x < 0 || head.x >= canvas.width/size || head.y < 0 || head.y >= canvas.height/size) {
        clearInterval(gameLoop);
        ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle = '#f43f5e'; ctx.font = '30px Inter'; ctx.textAlign='center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        return;
      }
      
      snake.unshift(head);
      
      // Eat food
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        food = {x: Math.floor(Math.random() * (canvas.width/size)), y: Math.floor(Math.random() * (canvas.height/size))};
      } else {
        snake.pop();
      }

      // Draw
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#6366f1';
      snake.forEach(p => ctx.fillRect(p.x*size, p.y*size, size-2, size-2));
      
      ctx.fillStyle = '#10b981';
      ctx.fillRect(food.x*size, food.y*size, size-2, size-2);

      ctx.fillStyle = '#fff'; ctx.font = '16px Inter'; ctx.textAlign='left';
      ctx.fillText(`Score: ${score}`, 10, 20);
    };

    gameLoop = setInterval(loop, 100);

    // Cleanup logic
    canvas.dataset.cleanup = () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKey);
    };

  } else if (gameId === 'tictactoe') {
    // ----------------------------------------
    // MULTIPLAYER: TIC TAC TOE
    // ----------------------------------------
    let board = ['', '', '', '', '', '', '', '', ''];
    let turn = isHost ? 'X' : 'O'; // Host is X, Challenger is O
    let mySymbol = isHost ? 'X' : 'O';
    let gameState = 'playing'; // playing, win, tie

    const drawLine = (x1, y1, x2, y2) => {
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 4; ctx.stroke();
    };

    const drawBoard = () => {
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,canvas.width,canvas.height);
      const w = canvas.width, h = canvas.height;
      drawLine(w/3, 0, w/3, h); drawLine(2*w/3, 0, 2*w/3, h);
      drawLine(0, h/3, w, h/3); drawLine(0, 2*h/3, w, 2*h/3);
      
      for(let i=0; i<9; i++) {
        const x = (i%3) * (w/3) + (w/6);
        const y = Math.floor(i/3) * (h/3) + (h/6);
        if(board[i]) {
          ctx.fillStyle = board[i] === 'X' ? '#f43f5e' : '#6366f1';
          ctx.font = '60px Inter'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.fillText(board[i], x, y);
        }
      }

      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,w,40);
      ctx.fillStyle = '#fff'; ctx.font = '16px Inter'; ctx.textAlign='center';
      if (gameState === 'playing') {
        const status = board.filter(v=>v).length % 2 === (isHost ? 0 : 1) ? "Your Turn" : "Opponent's Turn";
        ctx.fillText(status, w/2, 25);
      } else {
        ctx.fillText(gameState === 'tie' ? "Tie Game!" : `${gameState} Wins!`, w/2, 25);
      }
    };

    drawBoard();

    const handleClick = async (e) => {
      if (gameState !== 'playing') return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = canvas.width/3, h = canvas.height/3;
      const col = Math.floor(x/w), row = Math.floor(y/h);
      const idx = row*3 + col;

      const isMyTurn = board.filter(v=>v).length % 2 === (isHost ? 0 : 1);

      if (board[idx] === '' && isMyTurn) {
        board[idx] = mySymbol;
        drawBoard();
        // Sync via Firestore
        await updateDoc(doc(db, 'games', instanceId), { boardState: board });
      }
    };
    canvas.addEventListener('click', handleClick);

    if (instanceId !== 'local_test') {
      unsub = onSnapshot(doc(db, 'games', instanceId), (snap) => {
        const data = snap.data();
        if (data && data.boardState && Array.isArray(data.boardState)) {
          board = data.boardState;
          
          // Check win condition
          const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
          for (let line of lines) {
            const [a,b,c] = line;
            if (board[a] && board[a]===board[b] && board[a]===board[c]) {
              gameState = board[a];
            }
          }
          if (gameState === 'playing' && !board.includes('')) gameState = 'tie';

          drawBoard();
        }
      });
    }

    canvas.dataset.cleanup = () => {
      canvas.removeEventListener('click', handleClick);
      if(unsub) unsub();
    };

  } else {
    // Default Fallback
    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '20px Inter'; ctx.textAlign='center';
    ctx.fillText(`${gameId} coming soon!`, canvas.width/2, canvas.height/2);
    canvas.dataset.cleanup = () => {};
  }
}
