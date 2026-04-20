import { db } from '../services/firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { AppState } from '../services/state.js';

export function initAuth(onLoginSuccess) {
  const btnAction = document.getElementById('btn-login');
  const inputUsername = document.getElementById('auth-username');
  const inputDisplayName = document.getElementById('auth-displayname');

  btnAction.addEventListener('click', async () => {
    const user = inputUsername.value.trim().toLowerCase();
    const name = inputDisplayName.value.trim();

    if (!user || !name) {
      alert("Both Username and Display Name are required.");
      return;
    }
    
    btnAction.disabled = true;
    btnAction.textContent = "Loading...";

    try {
      const userRef = doc(db, 'users', user);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Exists, so perform login
        await onLoginSuccess(user);
      } else {
        // Doesn't exist, create it then login
        await AppState.createUserProfile(user, {
          username: user,
          displayName: name
        });
        await onLoginSuccess(user);
      }

    } catch (e) {
      console.error("Auth error:", e);
      alert("Authentication failed. Check your connection or Firestore Rules.");
      btnAction.disabled = false;
      btnAction.textContent = "Enter Hub";
    }
  });
}
