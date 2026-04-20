import { auth } from '../services/firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { AppState } from '../services/state.js';

export function initAuth() {
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

    // Use a deterministic pseudo-email & global secret password for Firebase Auth
    const email = `${user}@csea.private.hub`;
    const secretPass = `CseA_Global_Pass_123!`;
    
    btnAction.disabled = true;
    btnAction.textContent = "Loading...";

    try {
      // Attempt login first
      await signInWithEmailAndPassword(auth, email, secretPass);
    } catch (e) {
      // If user doesn't exist, create them
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, secretPass);
          // Create user profile in Firestore
          await AppState.createUserProfile(cred.user.uid, {
            username: user,
            displayName: name
          });
        } catch (createErr) {
          console.error("Signup error:", createErr);
          alert(createErr.message);
          btnAction.disabled = false;
          btnAction.textContent = "Enter Hub";
        }
      } else {
        console.error("Auth error:", e);
        alert("Authentication failed.");
        btnAction.disabled = false;
        btnAction.textContent = "Enter Hub";
      }
    }
  });
}
