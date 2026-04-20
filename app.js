import { initAuth } from './components/auth.js';
import { AppState } from './services/state.js';
import { initChat } from './components/chat.js';
import { initPresence } from './services/rtdb.js';
import { initUsersList } from './components/users.js';
import { initGames } from './components/games.js';
import { initLeaderboard } from './components/leaderboard.js';
import { initAdmin } from './components/admin.js';

// DOM Elements
const authView = document.getElementById('auth-view');
const mainLayout = document.getElementById('main-layout');

export async function performLogin(userId) {
  console.log("User logged in manually:", userId);
  await AppState.fetchUserProfile(userId);
  
  // Store session
  localStorage.setItem('cse_user_id', userId);

  // Update UI 
  authView.style.opacity = '0';
  setTimeout(() => {
    authView.classList.add('hidden');
    mainLayout.classList.add('active');
  }, 250);

  // Start presence check & Chat & Modules
  initPresence(userId);
  initChat();
  initUsersList();
  initGames();
  initLeaderboard();
  initAdmin();
}

export function performLogout() {
  localStorage.removeItem('cse_user_id');
  window.location.reload();
}

function initializeApp() {
  console.log("Initializing CSE-A Hub...");
  
  // Initialize Auth listeners
  initAuth();
  
  // Checking local session
  const storedUser = localStorage.getItem('cse_user_id');
  if (storedUser) {
    performLogin(storedUser);
  } else {
    console.log("No user session, showing login.");
    AppState.clear();
    
    mainLayout.classList.remove('active');
    authView.classList.remove('hidden');
    setTimeout(() => {
      authView.style.opacity = '1';
    }, 10);
  }

  setupMobileNav();
}

function setupMobileNav() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(n => n.classList.remove('active'));
      const btn = e.currentTarget;
      btn.classList.add('active');
      const view = btn.dataset.view;
    });
  });
}

// Start
initializeApp();
