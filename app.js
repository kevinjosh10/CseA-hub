import { auth } from './services/firebase.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { initAuth } from './components/auth.js';
import { AppState } from './services/state.js';
import { initChat } from './components/chat.js';
import { initPresence } from './services/rtdb.js';
import { initUsersList } from './components/users.js';

// DOM Elements
const authView = document.getElementById('auth-view');
const mainLayout = document.getElementById('main-layout');

function initializeApp() {
  console.log("Initializing CSE-A Hub...");
  
  // Initialize Modules
  initAuth();
  
  // Listen to Auth State
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User logged in:", user.uid);
      await AppState.fetchUserProfile(user.uid);
      
      // Update UI 
      authView.style.opacity = '0';
      setTimeout(() => {
        authView.classList.add('hidden');
        mainLayout.classList.add('active');
      }, 250);

      // Start presence check & Chat
      initPresence(user.uid);
      initChat();
      initUsersList();
    } else {
      console.log("No user, showing login.");
      AppState.clear();
      
      mainLayout.classList.remove('active');
      authView.classList.remove('hidden');
      // small delay to ensure display:none is removed before fading in
      setTimeout(() => {
        authView.style.opacity = '1';
      }, 10);
    }
  });

  setupMobileNav();
}

function setupMobileNav() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // Remove active from all
      navItems.forEach(n => n.classList.remove('active'));
      const btn = e.currentTarget;
      btn.classList.add('active');
      
      // Handle view switching here (placeholder logic)
      const view = btn.dataset.view;
      console.log("Switching view to:", view);
      // Depending on view, we'd adjust what .col-main shows or toggle columns on mobile
    });
  });
}

// Start
initializeApp();
