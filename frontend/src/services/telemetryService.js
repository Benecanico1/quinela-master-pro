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

    const nowIso = new Date().toISOString();
    const payload = {
      id: docId,
      name: userData.name || 'Usuario Quiniela',
      email: cleanEmail,
      photoURL: userData.photoURL || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + cleanEmail),
      role: userData.role || (cleanEmail === 'jesushidalgo25@gmail.com' ? 'admin' : 'user'),
      is_vip: userData.is_vip ?? 1,
      tier: userData.tier || (cleanEmail === 'jesushidalgo25@gmail.com' ? 'VIP_ANNUAL' : 'VIP_TRIAL'),
      vip_days_left: userData.vip_days_left ?? (cleanEmail === 'jesushidalgo25@gmail.com' ? 365 : 15),
      trial_active: userData.trial_active ?? (cleanEmail === 'jesushidalgo25@gmail.com' ? 0 : 1),
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

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
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
      const newDays = (current.vip_days_left || 0) + extraDays;
      await updateDoc(userRef, {
        is_vip: 1,
        vip_active: 1,
        vip_days_left: newDays,
        tier: 'VIP_MONTHLY',
        updated_at: new Date().toISOString()
      });
      return true;
    }
  } catch (err) {
    console.error('Error granting VIP days in cloud:', err);
  }
  return false;
}
