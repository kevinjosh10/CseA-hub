import { db } from '../services/firebase.js';
import { AppState } from '../services/state.js';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export function initChat() {
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  
  let unsubscribeChat = null;

  function loadMessages(chatId) {
    if (unsubscribeChat) unsubscribeChat();
    
    chatMessages.innerHTML = '<div style="text-align: center; color: var(--text-muted);">Loading messages...</div>';
    
    // According to rules: limit(20), optimistic UI
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'desc'), limit(20));
    
    unsubscribeChat = onSnapshot(q, (snapshot) => {
      // Re-render
      chatMessages.innerHTML = '';
      
      const msgs = [];
      snapshot.forEach(doc => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      msgs.reverse(); // Because we fetched desc to get latest 20
      
      msgs.forEach(msg => {
        const isMe = msg.senderId === AppState.user.id;
        const msgEl = document.createElement('div');
        msgEl.style.display = 'flex';
        msgEl.style.gap = '10px';
        msgEl.style.alignItems = 'flex-end';
        msgEl.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
        
        const bubble = document.createElement('div');
        bubble.style.padding = '10px 14px';
        bubble.style.borderRadius = 'var(--radius-lg)';
        bubble.style.maxWidth = '75%';
        bubble.style.wordBreak = 'break-word';
        bubble.style.boxShadow = 'var(--shadow-soft)';
        
        if (isMe) {
          bubble.style.backgroundColor = 'var(--accent-color)';
          bubble.style.color = '#fff';
          bubble.style.borderBottomRightRadius = '4px';
        } else {
          bubble.style.backgroundColor = '#ffffff';
          bubble.style.color = 'var(--text-primary)';
          bubble.style.borderBottomLeftRadius = '4px';
        }

        bubble.innerHTML = `
          ${!isMe ? `<div style="font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px;">${msg.senderName}</div>` : ''}
          <div style="font-size: 14px;">${escapeHTML(msg.text)}</div>
        `;
        
        // Very simple avatar rendering for others
        if (!isMe) {
          const avatar = document.createElement('img');
          avatar.src = msg.senderAvatar || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='; // placeholder
          avatar.style.width = '24px';
          avatar.style.height = '24px';
          avatar.style.borderRadius = '50%';
          avatar.style.backgroundColor = 'var(--bg-tertiary)';
          msgEl.appendChild(avatar);
          msgEl.appendChild(bubble);
        } else {
          msgEl.appendChild(bubble);
        }
        
        chatMessages.appendChild(msgEl);
      });
      
      // Auto-scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, (error) => {
      console.error("Chat error:", error);
    });
  }

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text || !AppState.user) return;
    
    // Optimistic UI could be handled by immediately rendering the message bubble
    // and matching it with the document ID when onSnapshot fires.
    
    chatInput.value = '';
    
    try {
      await addDoc(collection(db, `chats/${AppState.currentChatId}/messages`), {
        text,
        senderId: AppState.user.id,
        senderName: AppState.user.displayName,
        senderAvatar: AppState.user.avatar,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error sending message:", e);
      alert("Failed to send message.");
    }
  }

  btnSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Load global chat initially
  loadMessages('global');
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
