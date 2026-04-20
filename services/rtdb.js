import { rtdb } from './firebase.js';
import { ref, onValue, onDisconnect, set, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

export function initPresence(userId) {
  const userStatusRef = ref(rtdb, `/status/${userId}`);
  const connectedRef = ref(rtdb, '.info/connected');

  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      // When disconnected, set online: false and lastSeen
      onDisconnect(userStatusRef).set({
        online: false,
        lastSeen: serverTimestamp(),
        typing: false
      }).then(() => {
        // Now set as online
        set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp(),
          typing: false
        });
      });
    }
  });
}

// Track others
export function subscribeToPresence(callback) {
  const statusRef = ref(rtdb, '/status');
  onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}
