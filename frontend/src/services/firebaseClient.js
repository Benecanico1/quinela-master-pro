import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { saveRealOfficialDrawToStorage, getLocalDateString } from './clientEngine.js';

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

// Google Sign-In Function (Official Google Identity / OAuth 2.0)
export async function signInWithGoogleAccount() {
  if (!auth) {
    throw new Error("Firebase Auth no inicializado en la aplicación.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (!user || !user.email) {
      throw new Error("No se pudo obtener la cuenta verificada de Google.");
    }

    const cleanEmail = user.email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === 'jesushidalgo25@gmail.com';
    const now = Date.now();
    const defaultExpiresAt = isMasterAdmin ? (now + 365 * 86400000) : (now + 15 * 86400000);
    const docId = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');

    let userData = {
      id: docId,
      firebase_uid: user.uid,
      name: user.displayName || cleanEmail.split('@')[0] || 'Usuario Quinela',
      email: cleanEmail,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
      role: isMasterAdmin ? 'admin' : 'user',
      is_vip: 1,
      vip_active: 1,
      tier: isMasterAdmin ? 'VIP_ANNUAL' : 'VIP_TRIAL',
      vip_days_left: isMasterAdmin ? 365 : 15,
      vip_expires_at: defaultExpiresAt,
      trial_active: isMasterAdmin ? 0 : 1,
      trial_days_left: isMasterAdmin ? 365 : 15,
      provider: 'google.com',
      last_login: new Date().toISOString()
    };

    // Verificar si ya existía en Firestore para respetar días restantes y estado VIP
    if (db) {
      try {
        const userRef = doc(db, 'users', docId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const existing = userSnap.data();
          let effectiveExpiresAt = existing.vip_expires_at || defaultExpiresAt;
          if (typeof effectiveExpiresAt === 'string') {
            const p = new Date(effectiveExpiresAt).getTime();
            if (!isNaN(p)) effectiveExpiresAt = p;
          }
          const diffMs = effectiveExpiresAt - now;
          const calculatedDaysLeft = Math.max(0, Math.ceil(diffMs / 86400000));
          const isVip = isMasterAdmin ? 1 : (calculatedDaysLeft > 0 && existing.is_vip !== 0 ? 1 : 0);

          userData = {
            ...userData,
            ...existing,
            photoURL: user.photoURL || existing.photoURL || userData.photoURL,
            name: user.displayName || existing.name || userData.name,
            is_vip: isVip,
            vip_active: isVip,
            vip_days_left: isMasterAdmin ? 365 : calculatedDaysLeft,
            vip_expires_at: effectiveExpiresAt,
            last_login: new Date().toISOString()
          };
        }
        await setDoc(userRef, userData, { merge: true });
      } catch (dbErr) {
        console.warn("Firestore sync error on Google Sign-In:", dbErr.message);
      }
    }

    localStorage.setItem('quiniela_user', JSON.stringify(userData));
    localStorage.setItem('has_completed_onboarding', 'true');
    return userData;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error("Inicio de sesión cancelado en la ventana de Google.");
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error("Dominio no autorizado en Firebase Auth. Por favor agrega este dominio en la consola de Firebase.");
    }
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

// Fetch today's official draws directly from Firestore
export async function syncDrawsFromFirestore() {
  if (!db) return null;
  try {
    const todayStr = getLocalDateString(new Date());
    // 1. Check today's specific document
    const todayRef = doc(db, 'official_draws', todayStr);
    const snap = await getDoc(todayRef);
    let updatedData = {};
    if (snap.exists()) {
      updatedData = snap.data();
    }

    // 2. Also check 'latest' doc
    const latestRef = doc(db, 'official_draws', 'latest');
    const latestSnap = await getDoc(latestRef);
    if (latestSnap.exists()) {
      updatedData = { ...updatedData, ...latestSnap.data() };
    }

    if (Object.keys(updatedData).length > 0) {
      const raw = localStorage.getItem('quinela_official_draws_real_v1');
      const existing = raw ? JSON.parse(raw) : {};
      const merged = { ...existing, ...updatedData };
      localStorage.setItem('quinela_official_draws_real_v1', JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn("Firestore draws sync error:", err.message);
  }
  return null;
}

// Subscribe to real-time official draws updates from Firestore
export function subscribeToOfficialDraws(onUpdate) {
  if (!db) return () => {};

  try {
    const drawsRef = collection(db, 'official_draws');
    const unsubscribe = onSnapshot(drawsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const docData = change.doc.data();
          if (!docData) return;

          // If document is a single draw
          if (docData.board) {
            saveRealOfficialDrawToStorage(change.doc.id, docData);
          } else {
            // Document contains multiple draws as key-value pairs
            Object.keys(docData).forEach((key) => {
              if (docData[key] && docData[key].board) {
                saveRealOfficialDrawToStorage(key, docData[key]);
              }
            });
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

// Subscribe to real-time User Profile updates from Firestore (for instant VIP activation reflection)
export function subscribeToUserProfile(email, onUpdate) {
  if (!db || !email || email === 'visita@quiniela.com') return () => {};
  try {
    const cleanEmail = email.trim().toLowerCase();
    const docId = 'user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const userRef = doc(db, 'users', docId);

    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const userData = snap.data();
        if (onUpdate) onUpdate(userData);
      }
    }, (err) => {
      console.warn("User profile snapshot listener offline/fallback:", err.message);
    });

    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}
