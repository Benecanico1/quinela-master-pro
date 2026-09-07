import { db } from './firebaseClient.js';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs } from 'firebase/firestore';

const DEVICE_ID_KEY = 'quinela_device_uuid_v1';
const DEVICE_OPENS_KEY = 'quinela_total_opens_count';
const CURRENT_APP_VERSION = '1.3.33';

export function getOrCreateDeviceId() {
  let deviceId = '';
  try {
    deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      const randStr = Math.random().toString(36).substring(2, 10);
      deviceId = 'dev_' + Date.now() + '_' + randStr;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
  } catch (e) {
    deviceId = 'dev_' + Date.now();
  }
  return deviceId;
}

export function calculateRemainingVipDays(user) {
  if (!user) return { daysLeft: 0, isVip: false, expiresAt: null };
  const email = (user.email || '').trim().toLowerCase();
  if (email === 'jesushidalgo25@gmail.com' || user.role === 'admin') {
    return { daysLeft: 365, isVip: true, expiresAt: Date.now() + 365 * 86400000 };
  }

  const now = Date.now();
  let expiresAt = user.vip_expires_at;

  // Migration / Default initialization if vip_expires_at is not yet set
  if (!expiresAt) {
    if (user.vip_days_left && user.vip_days_left > 0) {
      expiresAt = now + (Number(user.vip_days_left) * 86400000);
    } else if (user.is_vip || user.vip_active) {
      expiresAt = now + 15 * 86400000;
    } else {
      expiresAt = now; // Expired
    }
  }

  const diffMs = expiresAt - now;
  const daysLeft = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const isVip = daysLeft > 0;

  return { daysLeft, isVip, expiresAt };
}

export async function registerDeviceSession() {
  if (!db) return null;

  try {
    const deviceId = getOrCreateDeviceId();
    let currentOpens = 1;
    try {
      currentOpens = parseInt(localStorage.getItem(DEVICE_OPENS_KEY) || '0', 10) + 1;
      localStorage.setItem(DEVICE_OPENS_KEY, currentOpens.toString());
    } catch (e) {}

    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem('quiniela_user') || 'null');
    } catch (e) {}

    const isRegistered = !!(currentUser && currentUser.email && currentUser.email !== 'visita@quiniela.com');
    const userEmail = isRegistered ? currentUser.email : 'Libre (Sin correo)';
    const userName = currentUser?.name || 'Usuario Libre';

    const deviceRef = doc(db, 'device_installs', deviceId);
    const snap = await getDoc(deviceRef);

    const nowIso = new Date().toISOString();

    if (!snap.exists()) {
      await setDoc(deviceRef, {
        deviceId,
        appVersion: CURRENT_APP_VERSION,
        firstInstalled: nowIso,
        lastActive: nowIso,
        totalOpens: currentOpens,
        isRegistered,
        userEmail,
        userName,
        platform: typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() ? 'Android Nativo' : 'Web / PWA'
      });
    } else {
      await updateDoc(deviceRef, {
        lastActive: nowIso,
        appVersion: CURRENT_APP_VERSION,
        totalOpens: currentOpens,
        isRegistered,
        userEmail,
        userName
      });
    }

    if (isRegistered && currentUser) {
      await syncUserProfileToCloud(currentUser);
    }

    return { deviceId, totalOpens: currentOpens };
  } catch (err) {
    console.warn('Device telemetry registration skipped/offline:', err.message);
    return null;
  }
}

export async function syncUserProfileToCloud(userData) {
  if (!db || !userData || !userData.email) return;

  try {
    const cleanEmail = userData.email.trim().toLowerCase();
    const docId = userData.id || ('user_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'));
    const userRef = doc(db, 'users', docId);

    const now = Date.now();
    const isAdmin = cleanEmail === 'jesushidalgo25@gmail.com' || userData.role === 'admin';
    const initialDays = isAdmin ? 365 : (userData.vip_days_left ?? 15);
    const expiresAt = userData.vip_expires_at || (now + initialDays * 86400000);
    const calculated = calculateRemainingVipDays({ ...userData, vip_expires_at: expiresAt });

    const nowIso = new Date().toISOString();
    const payload = {
      id: docId,
      name: userData.name || 'Usuario Quiniela',
      email: cleanEmail,
      photoURL: userData.photoURL || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + cleanEmail),
      role: isAdmin ? 'admin' : (userData.role || 'user'),
      is_vip: calculated.isVip ? 1 : 0,
      vip_active: calculated.isVip ? 1 : 0,
      tier: isAdmin ? 'VIP_ANNUAL' : (userData.tier || (calculated.isVip ? 'VIP_TRIAL' : 'FREE')),
      vip_days_left: calculated.daysLeft,
      vip_expires_at: expiresAt,
      trial_active: (userData.trial_active ?? (isAdmin ? 0 : 1)) && calculated.isVip ? 1 : 0,
      last_login: nowIso,
      updated_at: nowIso
    };

    await setDoc(userRef, payload, { merge: true });

    try {
      const deviceId = getOrCreateDeviceId();
      const deviceRef = doc(db, 'device_installs', deviceId);
      await setDoc(deviceRef, {
        isRegistered: true,
        userEmail: cleanEmail,
        userName: payload.name
      }, { merge: true });
    } catch (e) {}

    return payload;
  } catch (err) {
    console.warn('Error syncing user profile to cloud:', err.message);
  }
}

export async function getCloudAdminTelemetry() {
  if (!db) return { users: [], installs: [] };

  try {
    const [usersSnap, installsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'device_installs'))
    ]);

    const users = usersSnap.docs.map(d => {
      const data = d.data();
      const calc = calculateRemainingVipDays(data);
      return { 
        id: d.id, 
        ...data,
        vip_days_left: calc.daysLeft,
        is_vip: calc.isVip ? 1 : 0,
        vip_active: calc.isVip ? 1 : 0
      };
    });
    const installs = installsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { users, installs };
  } catch (err) {
    console.warn('Error fetching cloud admin telemetry:', err.message);
    return { users: [], installs: [] };
  }
}

export async function grantVipDaysInCloud(userId, extraDays) {
  if (!db || !userId) return false;

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const current = snap.data();
      const now = Date.now();
      const currentExpires = current.vip_expires_at && current.vip_expires_at > now 
        ? current.vip_expires_at 
        : now;
      const newExpiresAt = currentExpires + (Number(extraDays) * 86400000);
      const newDaysLeft = Math.max(0, Math.ceil((newExpiresAt - now) / 86400000));

      await updateDoc(userRef, {
        is_vip: 1,
        vip_active: 1,
        vip_days_left: newDaysLeft,
        vip_expires_at: newExpiresAt,
        tier: Number(extraDays) >= 30 ? 'VIP_MONTHLY' : (current.tier || 'VIP_TRIAL'),
        updated_at: new Date().toISOString()
      });
      return true;
    }
  } catch (err) {
    console.error('Error granting VIP days in cloud:', err);
  }
  return false;
}

// Payment intent notification to Admin mailbox in Firestore
export async function notifyPaymentIntention(user, details = {}) {
  if (!db) return null;
  try {
    const userEmail = (user?.email || 'anonimo@quiniela.com').trim().toLowerCase();
    const cleanId = 'intent_' + userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const intentRef = doc(db, 'payment_intentions', cleanId);
    
    const nowIso = new Date().toISOString();
    const payload = {
      id: cleanId,
      user_email: userEmail,
      user_name: user?.name || 'Cliente Quiniela',
      status: 'intentando_transferir',
      amount: details.amount || 5500,
      timestamp: Date.now(),
      created_at: nowIso,
      updated_at: nowIso,
      note: 'El usuario hizo clic en Pagar 30 Días y está viendo los datos de transferencia'
    };
    await setDoc(intentRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('Error recording payment intention:', err.message);
    return null;
  }
}

// Submit proof of payment to Firestore
export async function submitCloudPaymentProof(user, proofDetails, amount = 5500) {
  if (!db) return null;
  try {
    const userEmail = (user?.email || 'anonimo@quiniela.com').trim().toLowerCase();
    const cleanId = 'proof_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const proofRef = doc(db, 'payment_intentions', cleanId);

    const nowIso = new Date().toISOString();
    const payload = {
      id: cleanId,
      user_email: userEmail,
      user_name: user?.name || 'Cliente Quiniela',
      status: 'comprobante_enviado',
      proof_details: proofDetails,
      amount: Number(amount) || 5500,
      timestamp: Date.now(),
      created_at: nowIso,
      updated_at: nowIso
    };
    await setDoc(proofRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('Error recording payment proof to cloud:', err.message);
    return null;
  }
}

// Listen to all payment intentions & proofs for the Admin mailbox
export function subscribeToPaymentInbox(callback) {
  if (!db) return () => {};
  try {
    const colRef = collection(db, 'payment_intentions');
    return onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      callback(list);
    }, (err) => {
      console.warn('Error listening to payment inbox:', err);
    });
  } catch (e) {
    return () => {};
  }
}
