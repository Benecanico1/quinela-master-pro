import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { saveRealOfficialDrawToStorage } from './clientEngine';

// Firebase configuration with verified Google Auth credentials
const firebaseConfig = {
  apiKey: "AIzaSyDXFaF4mSV8ct2qxmvBvQf6QG-jj4g2Peo",
  authDomain: "dynotech-power-garaje.firebaseapp.com",
  projectId: "dynotech-power-garaje",
  storageBucket: "dynotech-power-garaje.firebasestorage.app",
  messagingSenderId: "442979078793",
  appId: "1:442979078793:web:b8461be77c8d4881b36c58"
};

let app;
let db;
let auth;
let googleProvider;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: 'select_account' });
} catch (e) {
  console.warn("Firebase initialization skipped or running in fallback mode:", e);
}

export { db, auth };

export const AFFILIATE_URL_KEY = 'quinela_affiliate_url_v1';
export const DEFAULT_AFFILIATE_URL = 'https://lotba.bet.ar';

export function getAffiliateUrl() {
  try {
    return localStorage.getItem(AFFILIATE_URL_KEY) || DEFAULT_AFFILIATE_URL;
  } catch (e) {
    return DEFAULT_AFFILIATE_URL;
  }
}

export function setAffiliateUrl(url) {
  try {
    localStorage.setItem(AFFILIATE_URL_KEY, url);
    if (db) {
      const configRef = doc(db, 'app_config', 'affiliate');
      setDoc(configRef, { url, updated_at: new Date().toISOString() }, { merge: true }).catch(() => {});
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Google Sign-In Function
export async function signInWithGoogleAccount() {
  if (!auth) {
    throw new Error("Firebase Auth no inicializado");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userData = {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Usuario Quinela',
      email: user.email,
      photoURL: user.photoURL,
      is_vip: user.email === 'jesushidalgo25@gmail.com' ? 1 : 0,
      vip_days_left: user.email === 'jesushidalgo25@gmail.com' ? 365 : 0,
      role: user.email === 'jesushidalgo25@gmail.com' ? 'admin' : 'user',
      tier: user.email === 'jesushidalgo25@gmail.com' ? 'VIP_ANNUAL' : 'FREE',
      last_login: new Date().toISOString()
    };

    // Save to Firestore
    if (db) {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        userData.is_vip = existingData.is_vip ?? userData.is_vip;
        userData.vip_days_left = existingData.vip_days_left ?? userData.vip_days_left;
        userData.tier = existingData.tier ?? userData.tier;
        userData.role = existingData.role ?? userData.role;
      }
      await setDoc(userRef, userData, { merge: true });
    }

    localStorage.setItem('quiniela_user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
}

// Sign Out Function
export async function logOutGoogleAccount() {
  try {
    if (auth) await signOut(auth);
    localStorage.removeItem('quiniela_user');
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    return false;
  }
}

// Subscribe to real-time official draws updates from Firestore
export function subscribeToOfficialDraws(onUpdate) {
  if (!db) return () => {};

  try {
    const drawsRef = collection(db, 'official_draws');
    const unsubscribe = onSnapshot(drawsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const drawData = change.doc.data();
          const docId = change.doc.id; // e.g. "2026-08-27_ciudad_previa"
          if (drawData && drawData.board) {
            saveRealOfficialDrawToStorage(docId, drawData);
          }
        }
      });
      if (onUpdate) onUpdate();
    }, (error) => {
      console.warn("Firestore real-time sync active in offline cache mode:", error.message);
    });

    return unsubscribe;
  } catch (err) {
    console.warn("Firestore subscription error:", err);
    return () => {};
  }
}
