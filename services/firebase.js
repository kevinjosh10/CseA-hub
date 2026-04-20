import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDSPEs_s8Ouej74phSUKuBMsf6KzgKAkVU",
  authDomain: "cse-a-hub.firebaseapp.com",
  projectId: "cse-a-hub",
  storageBucket: "cse-a-hub.firebasestorage.app",
  messagingSenderId: "905502501273",
  appId: "1:905502501273:web:7324397ab3dec75f710b08",
  measurementId: "G-HBVJP26PZJ",
  databaseURL: "https://cse-a-hub-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
