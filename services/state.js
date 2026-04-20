import { db } from './firebase.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const AppState = {
  user: null,
  activeView: 'chat', // chat, games, leaderboard, profile
  currentChatId: 'global', // 'global' or userId/groupId
  
  async fetchUserProfile(userId, retries = 3) {
    try {
      const userRef = doc(db, 'users', userId);
      let userSnap = await getDoc(userRef);
      
      while (!userSnap.exists() && retries > 0) {
        console.log("Profile not found, retrying... (Auth race condition)");
        await new Promise(r => setTimeout(r, 600));
        userSnap = await getDoc(userRef);
        retries--;
      }

      if (userSnap.exists()) {
        this.user = { id: userId, ...userSnap.data() };
        console.log("UserProfile loaded:", this.user);
      } else {
        console.error("User profile missing in Firestore after retries!");
      }
    } catch (e) {
      console.error("Error fetching user profile:", e);
    }
  },

  async createUserProfile(userId, data) {
     const userRef = doc(db, 'users', userId);
     await setDoc(userRef, {
       username: data.username,
       displayName: data.displayName,
       avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${data.displayName}`,
       role: data.username === 'godkevz123' ? 'admin' : 'user',
       xp: 0,
       streak: 0,
       createdAt: new Date().toISOString()
     });
     this.user = { id: userId, ...data };
  },

  clear() {
    this.user = null;
  }
};
