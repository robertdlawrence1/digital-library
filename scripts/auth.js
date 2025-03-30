// Firebase & Firestore setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAC2xKlseyouk18Dr8A-ocoqY77OP56Jtk",
  authDomain: "robertdlawrence1.github.io",
  projectId: "digital-library-4f53e",
  storageBucket: "digital-library-4f53e.appspot.com",
  messagingSenderId: "775289018267",
  appId: "1:775289018267:web:86ea3e5cad787a2a0e733e",
  measurementId: "G-4BVT6LVMHX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function initAuth() {
  const authContainer = document.getElementById('auth-container');

  function renderSignInButton() {
    authContainer.innerHTML = `
      <button class="auth-btn" id="sign-in-btn">Sign In with Google</button>
    `;
    document.getElementById('sign-in-btn').addEventListener('click', () => {
      signInWithRedirect(auth, provider);
    });
  }

  function renderSignOutButton(user) {
    authContainer.innerHTML = `
      <div class="user-info">
        <span>${user.displayName}</span>
        <button class="auth-btn" id="sign-out-btn">Sign Out</button>
      </div>
    `;
    document.getElementById('sign-out-btn').addEventListener('click', () => {
      auth.signOut();
    });
  }

  // Handle redirect result (after returning from Google)
  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log('Redirect sign-in successful:', result.user.displayName);
      }
    })
    .catch((error) => {
      console.error('Redirect sign-in error:', error);
    });

  // Auto-update UI based on login state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      renderSignOutButton(user);
    } else {
      renderSignInButton();
    }
  });

  // Render initial state
  renderSignInButton();
}

export { db, auth };
