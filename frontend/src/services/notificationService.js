import { db } from './firebaseClient';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, query, orderBy } from 'firebase/firestore';

const NOTIFICATIONS_STORAGE_KEY = 'quinela_app_notifications_v1';
const DELETED_IDS_KEY = 'quinela_deleted_notifications_v1';
const POPUP_SEEN_KEY = 'quinela_seen_popups_v1';

// Initial default welcome notifications
export const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_welcome_01',
    title: '🚀 ¡Bienvenido a Quinela Master Pro AI!',
    message: 'Disfruta de nuestros pronósticos con inteligencia artificial en 3 capas, análisis térmico 00 al 99 y resultados oficiales en vivo de LOTBA y Provincia.',
    category: 'update',
    is_popup: false,
    action_text: 'Ver Pronósticos',
    action_tab: 'predictions',
    action_url: '',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: false
  },
  {
    id: 'notif_vip_02',
    title: '👑 Acceso VIP y Algoritmo Candado Activo',
    message: 'Recuerda que con tu membresía VIP tienes acceso a la Calculadora de Bankroll, Redoblonas de Alta Frecuencia y sensores térmicos de ruptura.',
    category: 'vip_alert',
    is_popup: false,
    action_text: 'Ver Estrategia',
    action_tab: 'bankroll',
    action_url: '',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    read: false
  }
];

// Helper to get deleted IDs by user
export function getDeletedNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem(DELETED_IDS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

// Helper to get seen popup IDs
export function getSeenPopupIds() {
  try {
    return JSON.parse(localStorage.getItem(POPUP_SEEN_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

export function markPopupAsSeen(notifId) {
  try {
    const seen = getSeenPopupIds();
    if (!seen.includes(notifId)) {
      seen.push(notifId);
      localStorage.setItem(POPUP_SEEN_KEY, JSON.stringify(seen));
    }
  } catch (e) {}
}

// Get all notifications for current user (merged with cloud & defaults)
export function getStoredNotifications() {
  try {
    const deletedIds = getDeletedNotificationIds();
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    let list = raw ? JSON.parse(raw) : [...DEFAULT_NOTIFICATIONS];

    // Filter out deleted by user
    list = list.filter(n => !deletedIds.includes(n.id));

    // Sort descending by created_at
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  } catch (e) {
    return [...DEFAULT_NOTIFICATIONS];
  }
}

export function saveStoredNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('app-notifications-updated', { detail: list }));
  } catch (e) {}
}

// Mark single as read
export function markNotificationAsRead(id) {
  const list = getStoredNotifications().map(n => {
    if (n.id === id) {
      return { ...n, read: true };
    }
    return n;
  });
  saveStoredNotifications(list);
  return list;
}

// Mark all as read
export function markAllNotificationsAsRead() {
  const list = getStoredNotifications().map(n => ({ ...n, read: true }));
  saveStoredNotifications(list);
  return list;
}

// Delete notification for user (persisted so it stays deleted)
export function deleteNotificationForUser(id) {
  try {
    const deletedIds = getDeletedNotificationIds();
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
    }
  } catch (e) {}

  const list = getStoredNotifications().filter(n => n.id !== id);
  saveStoredNotifications(list);
  return list;
}

// Clear all notifications for user
export function clearAllNotifications() {
  const current = getStoredNotifications();
  const allIds = current.map(n => n.id);
  try {
    const deletedIds = [...new Set([...getDeletedNotificationIds(), ...allIds])];
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deletedIds));
  } catch (e) {}

  saveStoredNotifications([]);
  return [];
}

// ADMIN FUNCTION: Publish new broadcast announcement to Firebase Firestore & local
export async function publishBroadcastNotification(announcement) {
  const notifId = announcement.id || `notif_${Date.now()}`;
  const payload = {
    id: notifId,
    title: announcement.title || '📢 Notificación Oficial',
    message: announcement.message || '',
    category: announcement.category || 'general', // 'update', 'vip_alert', 'ai_hit', 'general', 'promo'
    is_popup: Boolean(announcement.is_popup),
    action_text: announcement.action_text || '',
    action_tab: announcement.action_tab || '',
    action_url: announcement.action_url || '',
    created_at: new Date().toISOString()
  };

  // 1. Save to local storage
  const current = getStoredNotifications();
  const updated = [payload, ...current.filter(n => n.id !== notifId)];
  saveStoredNotifications(updated);

  // 2. Publish to Firebase Firestore collection 'broadcast_announcements'
  let cloudSuccess = false;
  if (db) {
    try {
      const docRef = doc(db, 'broadcast_announcements', notifId);
      await setDoc(docRef, payload, { merge: true });
      cloudSuccess = true;
      console.log("[NotificationService] Anuncio publicado exitosamente en Firestore:", notifId);
    } catch (e) {
      console.error("[NotificationService] Error al publicar en Firestore:", e);
    }
  }

  return { success: cloudSuccess, payload };
}

// ADMIN FUNCTION: Delete broadcast announcement from Firestore
export async function deleteBroadcastFromCloud(notifId) {
  deleteNotificationForUser(notifId);
  if (db) {
    try {
      const docRef = doc(db, 'broadcast_announcements', notifId);
      await deleteDoc(docRef);
      console.log("[NotificationService] Anuncio eliminado de Firestore:", notifId);
    } catch (e) {
      console.warn("Error deleting announcement from Firestore:", e);
    }
  }
}

// Helper to merge and persist cloud notifications
function mergeCloudNotifications(cloudNotifs, onUpdateCallback) {
  if (!Array.isArray(cloudNotifs) || cloudNotifs.length === 0) return;

  const deletedIds = getDeletedNotificationIds();
  const local = getStoredNotifications();
  const localMap = new Map(local.map(n => [n.id, n]));
  let hasNew = false;

  cloudNotifs.forEach(cn => {
    if (!cn || !cn.id) return;
    if (!deletedIds.includes(cn.id)) {
      if (!localMap.has(cn.id)) {
        localMap.set(cn.id, { ...cn, read: false });
        hasNew = true;
      } else {
        const existing = localMap.get(cn.id);
        localMap.set(cn.id, { ...cn, read: existing.read });
      }
    }
  });

  const merged = Array.from(localMap.values())
    .filter(n => !deletedIds.includes(n.id))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  saveStoredNotifications(merged);
  if (onUpdateCallback) {
    onUpdateCallback(merged);
  }
  return merged;
}

// Explicit fetch of broadcast notifications from cloud
export async function fetchBroadcastNotificationsFromCloud(onUpdateCallback) {
  if (!db) return null;
  try {
    const colRef = collection(db, 'broadcast_announcements');
    const snapshot = await getDocs(colRef);
    const cloudNotifs = [];
    snapshot.forEach(docSnap => {
      cloudNotifs.push(docSnap.data());
    });
    return mergeCloudNotifications(cloudNotifs, onUpdateCallback);
  } catch (err) {
    console.warn("[NotificationService] Fallback al consultar anuncios:", err);
    return null;
  }
}

// Real-time listener for incoming broadcast notifications from Admin
export function subscribeToBroadcastNotifications(onUpdateCallback) {
  if (!db) {
    return () => {};
  }

  try {
    const colRef = collection(db, 'broadcast_announcements');
    return onSnapshot(colRef, (snapshot) => {
      const cloudNotifs = [];
      snapshot.forEach(docSnap => {
        cloudNotifs.push(docSnap.data());
      });
      mergeCloudNotifications(cloudNotifs, onUpdateCallback);
    }, (err) => {
      console.warn("[NotificationService] Subscription fallback:", err);
    });
  } catch (e) {
    return () => {};
  }
}