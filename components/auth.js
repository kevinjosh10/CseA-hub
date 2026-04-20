import { auth } from '../services/firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { AppState } from '../services/state.js';

let isSignUp = false;

export function initAuth() {
  const btnToggle = document.getElementById('btn-toggle-signup');
  const btnAction = document.getElementById('btn-login');
  const signupFields = document.getElementById('signup-fields');
  
  const inputUsername = document.getElementById('auth-username');
  const inputPassword = document.getElementById('auth-password');
  const inputDisplayName = document.getElementById('auth-displayname');

  btnToggle.addEventListener('click', () => {
    isSignUp = !isSignUp;
    if (isSignUp) {
      signupFields.classList.remove('hidden');
      btnAction.textContent = 'Sign Up';
      btnToggle.textContent = 'Already have an account? Login';
    } else {
      signupFields.classList.add('hidden');
      btnAction.textContent = 'Login';
      btnToggle.textContent = 'Need an account? Sign up';
    }
  });

  btnAction.addEventListener('click', async () => {
    const user = inputUsername.value.trim().toLowerCase();
    const pass = inputPassword.value;
    const name = inputDisplayName.value.trim();

    if (!user || !pass) {
      alert("Username and password required.");
      return;
    }

    if (isSignUp && !name) {
      alert("Display Name required for signup.");
      return;
    }

    // Use a deterministic pseudo-email for Firebase Auth
    const email = `${user}@csea.private.hub`;
    
    btnAction.disabled = true;
    btnAction.textContent = "Loading...";

    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        // Create user profile in Firestore
        await AppState.createUserProfile(cred.user.uid, {
          username: user,
          displayName: name
        });
      } else {
        await signInWithEmailAndPassword(auth, email, pass);
      }
    } catch (e) {
      console.error("Auth error:", e);
      alert(e.message);
      btnAction.disabled = false;
      btnAction.textContent = isSignUp ? "Sign Up" : "Login";
    }
  });
}
