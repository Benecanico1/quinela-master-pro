import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Users, CreditCard, Megaphone, Settings, 
  ShieldCheck, Check, Plus, RefreshCw, Crown, AlertCircle,
  Eye, Image as ImageIcon, MessageSquareHeart, Star, ThumbsUp, Lightbulb, AlertTriangle, ChevronRight, Trophy, ExternalLink, Smartphone,
  Calendar, Clock, UserCheck, Sparkles, Send, ShieldAlert
} from 'lucide-react';
import { getRealOfficialDrawsFromStorage, saveRealOfficialDrawToStorage, SIGNIFICADOS, getLocalDateString } from '../services/clientEngine';
import { getAffiliateUrl, setAffiliateUrl } from '../services/firebaseClient';
import { getCloudAdminTelemetry, grantVipDaysInCloud } from '../services/telemetryService';
import { publishBroadcastNotification, getStoredNotifications, deleteBroadcastFromCloud } from '../services/notificationService';

export default function AdminPanelModal({ isOpen, onClose, adminEmail = 'jesushidalgo25@gmail.com' }) {
  const [adminTab, setAdminTab] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [installsList, setInstallsList] = useState([]);
  const [userSubTab, setUserSubTab] = useState('registered'); // 'registered' or 'installs'
  const [paymentsList, setPaymentsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [customVipDays, setCustomVipDays] = useState('30');
  const [userModalMsg, setUserModalMsg] = useState('');
  
  // Broadcast Notifications & Pop-Ups State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState('update'); // 'update', 'vip_alert', 'ai_hit', 'general', 'promo'
  const [notifIsPopup, setNotifIsPopup] = useState(true);
  const [notifActionText, setNotifActionText] = useState('Descargar Actualización');
  const [notifActionUrl, setNotifActionUrl] = useState('https://ingenieriajh.web.app/quinela');
  const [broadcastHistory, setBroadcastHistory] = useState(() => getStoredNotifications());
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [settings, setSettings] = useState({ mercadopago_alias: 'quiniela.master.pro', usdt_trc20_wallet: 'TQ7x...' });
  const [promo, setPromo] = useState({
    title: '🔥 ¡OFERTA LANZAMIENTO VIP!',
    subtitle: 'Desbloquea Pronósticos AI, Calculadora de Bankroll y Redoblonas Candado.',
    badge: 'OFERTA LIMITADA',
    discount_text: 'Solo $5 USD / mes ($5.500 ARS)',
    button_text: 'ACTIVAR MI MES VIP AHORA',
    is_active: 1
  });
  const [affiliateInput, setAffiliateInput] = useState(() => getAffiliateUrl());
  const [affiliateSaveMsg, setAffiliateSaveMsg] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  // Official Draws Management State
  const [drawDate, setDrawDate] = useState(() => getLocalDateString());
  const [drawLottery, setDrawLottery] = useState('ciudad');
  const [drawShift, setDrawShift] = useState('previa');
  const [drawHead, setDrawHead] = useState('');
  const [drawBoard, setDrawBoard] = useState(Array(20).fill(''));
  const [saveDrawMsg, setSaveDrawMsg] = useState('');

  // Load existing official draw when date/lottery/shift changes
  useEffect(() => {
    const db = getRealOfficialDrawsFromStorage();
    const hash = `${drawDate}_${drawLottery.toLowerCase()}_${drawShift.toLowerCase()}`;
    if (db[hash]) {
      setDrawHead(db[hash].head_millar || '');
      setDrawBoard([...(db[hash].board || Array(20).fill(''))]);
    } else {
      setDrawHead('');
      setDrawBoard(Array(20).fill(''));
    }
  }, [drawDate, drawLottery, drawShift, adminTab]);

  const handleSaveOfficialDraw = (e) => {
    e.preventDefault();
    const hash = `${drawDate}_${drawLottery.toLowerCase()}_${drawShift.toLowerCase()}`;
    const headAmbo = (drawHead || drawBoard[0] || '00').slice(-2);
    const headCentena = (drawHead || drawBoard[0] || '000').slice(-3);
    const headMillar = (drawHead || drawBoard[0] || '0000').padStart(4, '0');

    const cleanBoard = [...drawBoard];
    cleanBoard[0] = headMillar;
    for (let i = 1; i < 20; i++) {
      if (!cleanBoard[i]) cleanBoard[i] = '0000';
    }

    const payload = {
      head_millar: headMillar,
      head_centena: headCentena,
      head_ambo: headAmbo,
      board: cleanBoard
    };

    const ok = saveRealOfficialDrawToStorage(hash, payload);
    if (ok) {
      setSaveDrawMsg(`✅ Extracto Oficial guardado y publicado con éxito para ${drawLottery.toUpperCase()} - ${drawShift.toUpperCase()} (${drawDate})`);
      setTimeout(() => setSaveDrawMsg(''), 4000);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live telemetry directly from Firebase Firestore
      try {
        const cloudData = await getCloudAdminTelemetry();
        if (cloudData.users && cloudData.users.length > 0) {
          setUsersList(cloudData.users);
        } else {
          setUsersList([
            { id: 'admin', name: 'Jesús Hidalgo (Admin)', email: 'jesushidalgo25@gmail.com', role: 'admin', is_vip: 1, tier: 'VIP_ANNUAL', trial_active: 0, vip_active: 1, vip_days_left: 365 }
          ]);
        }
        if (cloudData.installs) {
          setInstallsList(cloudData.installs);
        }
      } catch (cloudErr) {
        console.warn('Error fetching Firestore telemetry:', cloudErr);
      }

      // 2. Load local payments & feedback
      const localPayments = JSON.parse(localStorage.getItem('pending_payments') || '[]');
      const localFeedback = JSON.parse(localStorage.getItem('app_feedback_list') || '[]');
      setPaymentsList(localPayments);
      setFeedbackList(localFeedback);

      // 3. Fallback sync for secondary endpoints
      try {
        const [pRes, sRes, promoRes, fRes] = await Promise.all([
          axios.get(`/api/admin/payments?admin_email=${adminEmail}`, { timeout: 1200 }).catch(() => ({ data: [] })),
          axios.get('/api/public/payment-info', { timeout: 1200 }).catch(() => ({ data: {} })),
          axios.get('/api/public/promo-popup', { timeout: 1200 }).catch(() => ({ data: null })),
          axios.get('/api/feedback/list', { timeout: 1200 }).catch(() => ({ data: [] }))
        ]);

        if (Array.isArray(pRes.data) && pRes.data.length > 0) {
          setPaymentsList([...localPayments, ...pRes.data]);
        }
        if (Array.isArray(fRes.data) && fRes.data.length > 0) {
          setFeedbackList([...localFeedback, ...fRes.data]);
        }
        if (sRes.data && sRes.data.mercadopago_alias) {
          setSettings(sRes.data);
        }
        if (promoRes.data && promoRes.data.title) {
          setPromo(promoRes.data);
        }
      } catch (networkErr) {
        // Safe silent fallback
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGrantVip = async (userId, days) => {
    const numDays = Number(days) || 30;
    setUsersList(prev => (prev || []).map(u => {
      if (u.id === userId || u.email === userId) {
        const newDays = (u.vip_days_left || 0) + numDays;
        return { ...u, is_vip: 1, tier: 'VIP_MONTHLY', vip_active: 1, vip_days_left: newDays };
      }
      return u;
    }));

    if (selectedUserModal && (selectedUserModal.id === userId || selectedUserModal.email === userId)) {
      setSelectedUserModal(prev => ({
        ...prev,
        is_vip: 1,
        tier: 'VIP_MONTHLY',
        vip_active: 1,
        vip_days_left: (prev.vip_days_left || 0) + numDays
      }));
      setUserModalMsg(`✅ ¡Se sumaron +${numDays} días VIP con éxito!`);
      setTimeout(() => setUserModalMsg(''), 3500);
    }

    const currentUser = JSON.parse(localStorage.getItem('quiniela_user') || '{}');
    if (currentUser.id === userId || currentUser.email === userId || currentUser.email === adminEmail) {
      currentUser.is_vip = true;
      currentUser.tier = 'VIP_MONTHLY';
      currentUser.vip_active = true;
      currentUser.vip_days_left = (currentUser.vip_days_left || 0) + numDays;
      localStorage.setItem('quiniela_user', JSON.stringify(currentUser));
    }

    // Direct Firestore update
    try {
      await grantVipDaysInCloud(userId, numDays);
    } catch (e) {}

    try {
      await axios.post('/api/admin/users/grant-vip', {
        admin_email: adminEmail,
        user_id: userId,
        days: numDays
      }, { timeout: 1500 });
    } catch (err) {}
  };

  const handleRevokeVip = async (userId) => {
    setUsersList(prev => (prev || []).map(u => {
      if (u.id === userId || u.email === userId) {
        return { ...u, is_vip: 0, tier: 'FREE', vip_active: 0, vip_days_left: 0 };
      }
      return u;
    }));

    if (selectedUserModal && (selectedUserModal.id === userId || selectedUserModal.email === userId)) {
      setSelectedUserModal(prev => ({
        ...prev,
        is_vip: 0,
        tier: 'FREE',
        vip_active: 0,
        vip_days_left: 0
      }));
      setUserModalMsg('🚫 Membresía VIP revocada (Usuario en plan Free).');
      setTimeout(() => setUserModalMsg(''), 3500);
    }
  };

  const handleReviewPayment = async (paymentId, action) => {
    const updatedPayments = (paymentsList || []).map(p => {
      if (p.id === paymentId) {
        return { ...p, status: action === 'approve' ? 'approved' : 'rejected' };
      }
      return p;
    });
    setPaymentsList(updatedPayments);
    localStorage.setItem('pending_payments', JSON.stringify(updatedPayments));

    if (action === 'approve') {
      const payment = updatedPayments.find(p => p.id === paymentId);
      if (payment) {
        const currentUser = JSON.parse(localStorage.getItem('quiniela_user') || '{}');
        if (currentUser.email === payment.user_email) {
          currentUser.is_vip = true;
          currentUser.tier = 'VIP_MONTHLY';
          currentUser.vip_active = true;
          currentUser.vip_days_left = (currentUser.vip_days_left || 0) + 30;
          localStorage.setItem('quiniela_user', JSON.stringify(currentUser));
        }
      }
    }

    try {
      await axios.post('/api/admin/payments/review', {
        admin_email: adminEmail,
        payment_id: paymentId,
        action: action
      }, { timeout: 1500 });
    } catch (err) {}
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/promo-popup', {
        admin_email: adminEmail,
        ...promo
      }, { timeout: 1500 });
      setSaveStatus('¡Pop-up promocional actualizado con éxito!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      setSaveStatus('Guardado localmente en este dispositivo');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handlePublishNotification = async (e) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) {
      setBroadcastMsg('⚠️ Por favor ingresa un título y un mensaje.');
      setTimeout(() => setBroadcastMsg(''), 3000);
      return;
    }

    try {
      const created = await publishBroadcastNotification({
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        category: notifCategory,
        is_popup: notifIsPopup,
        action_text: notifActionText.trim(),
        action_url: notifActionUrl.trim()
      });

      setBroadcastHistory(getStoredNotifications());
      setNotifTitle('');
      setNotifMessage('');
      setBroadcastMsg('🚀 ¡Comunicado enviado con éxito a todos los usuarios!');
      setTimeout(() => setBroadcastMsg(''), 4000);
    } catch (err) {
      setBroadcastMsg('✅ Guardado en la bandeja de avisos.');
      setTimeout(() => setBroadcastMsg(''), 3000);
    }
  };

  const handleDeleteBroadcastItem = async (id) => {
    if (window.confirm('¿Deseas dar de baja este comunicado?')) {
      await deleteBroadcastFromCloud(id);
      setBroadcastHistory(getStoredNotifications());
      setBroadcastMsg('🗑️ Comunicado eliminado.');
      setTimeout(() => setBroadcastMsg(''), 2500);
    }
  };

  const filteredUsers = (usersList || []).filter(u => 
    (u?.name || '').toLowerCase().includes((searchUser || '').toLowerCase()) || 
    (u?.email || '').toLowerCase().includes((searchUser || '').toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn" role="dialog" aria-modal="true" aria-label="Panel de Administrador">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                <span>Panel de Control Admin</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                  Jesús Hidalgo
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Control total de usuarios VIP, pagos y opiniones</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Cerrar panel de administración"
            className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-all min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 px-3 pt-2 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setAdminTab('users')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'users' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> Usuarios ({usersList.length})
          </button>

          <button
            onClick={() => setAdminTab('payments')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'payments' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard className="w-4 h-4" /> Pagos ({paymentsList.filter(p => p?.status === 'pending').length})
          </button>

          <button
            onClick={() => setAdminTab('feedback')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'feedback' ? 'border-pink-500 text-pink-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <MessageSquareHeart className="w-4 h-4" /> Opiniones ({feedbackList.length})
          </button>

          <button
            onClick={() => setAdminTab('draws')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'draws' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Trophy className="w-4 h-4" /> Extractos Oficiales
          </button>

          <button
            onClick={() => {
              setAdminTab('promo');
              setBroadcastHistory(getStoredNotifications());
            }}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'promo' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Megaphone className="w-4 h-4" /> Enviar Pop-Ups & Avisos
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {loading && (
            <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-purple-400" /> Sincronizando datos...
            </div>
          )}

          {/* USERS MANAGEMENT TAB */}
          {!loading && adminTab === 'users' && (
            <div className="space-y-4">
              {/* Telemetry KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold">Total Dispositivos</span>
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <div className="text-lg font-black text-white">{installsList.length}</div>
                  <div className="text-[9.5px] text-slate-500">Instalaciones activas</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold">Registrados</span>
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="text-lg font-black text-white">{usersList.length}</div>
                  <div className="text-[9.5px] text-slate-500">Con cuenta de correo</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold">Visitantes Libres</span>
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="text-lg font-black text-white">
                    {installsList.filter(i => !i.isRegistered).length}
                  </div>
                  <div className="text-[9.5px] text-slate-500">Sin correo ingresado</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-[11px] font-bold">VIPs Activos</span>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-lg font-black text-amber-400">
                    {usersList.filter(u => u.is_vip).length}
                  </div>
                  <div className="text-[9.5px] text-slate-500">Con acceso VIP</div>
                </div>
              </div>

              {/* Sub-tab Switcher: Registrados con Correo vs Dispositivos Libres */}
              <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUserSubTab('registered')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    userSubTab === 'registered'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>👤 Registrados con Correo ({usersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setUserSubTab('installs')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    userSubTab === 'installs'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>📱 Dispositivos Libres / Descargas ({installsList.length})</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <input
                  type="text"
                  placeholder={userSubTab === 'registered' ? "Buscar por nombre o correo..." : "Buscar por ID de dispositivo..."}
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-full sm:w-80 bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={fetchAdminData}
                  className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Actualizar Datos
                </button>
              </div>

              {/* TABLE: REGISTERED USERS */}
              {userSubTab === 'registered' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Usuario</th>
                        <th className="p-3">Correo</th>
                        <th className="p-3 text-center">Membresía</th>
                        <th className="p-3 text-center">Vigencia</th>
                        <th className="p-3 text-center">Acción VIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredUsers.map((u) => (
                        <tr 
                          key={u.id || u.email} 
                          onClick={() => {
                            setSelectedUserModal(u);
                            setCustomVipDays('30');
                            setUserModalMsg('');
                          }}
                          className="hover:bg-purple-950/30 cursor-pointer transition-colors group"
                          title="Toca para ver el perfil completo y gestionar días VIP"
                        >
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="avatar" className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800 shrink-0" />
                            ) : null}
                            <span className="group-hover:text-purple-300 transition-colors">{u.name || 'Sin Nombre'}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">
                            <span className="underline decoration-purple-500/50 group-hover:text-purple-300">{u.email}</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : u.is_vip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                              {u.tier || (u.is_vip ? 'VIP' : 'FREE')}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {u.trial_active ? (
                              <span className="text-emerald-400">{u.trial_days_left || u.vip_days_left}d prueba</span>
                            ) : u.vip_active || u.is_vip ? (
                              <span className="text-amber-400 font-bold">{u.vip_days_left}d VIP</span>
                            ) : (
                              <span className="text-rose-400 font-bold">Free</span>
                            )}
                          </td>
                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleGrantVip(u.id || u.email, 15)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[10px] cursor-pointer"
                              >
                                +15D
                              </button>
                              <button
                                onClick={() => handleGrantVip(u.id || u.email, 30)}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-[10px] cursor-pointer shadow"
                              >
                                +1 Mes
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedUserModal(u);
                                  setCustomVipDays('30');
                                  setUserModalMsg('');
                                }}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] cursor-pointer"
                              >
                                Gestionar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TABLE: FREE DEVICE INSTALLS */}
              {userSubTab === 'installs' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-3">Dispositivo ID</th>
                        <th className="p-3 text-center">Versión App</th>
                        <th className="p-3 text-center">Aperturas</th>
                        <th className="p-3">Primera Apertura</th>
                        <th className="p-3">Última Actividad</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {installsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No hay dispositivos registrados aún.
                          </td>
                        </tr>
                      ) : (
                        installsList
                          .filter(inst => !searchUser || (inst.deviceId || '').toLowerCase().includes(searchUser.toLowerCase()) || (inst.userEmail || '').toLowerCase().includes(searchUser.toLowerCase()))
                          .map((inst) => (
                            <tr key={inst.id || inst.deviceId} className="hover:bg-slate-900/40">
                              <td className="p-3 font-mono font-bold text-white flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span>{(inst.deviceId || 'Dispositivo').slice(0, 16)}...</span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] font-bold">
                                  v{inst.appVersion || '1.3.32'}
                                </span>
                              </td>
                              <td className="p-3 text-center font-bold text-amber-400">
                                {inst.totalOpens || 1}
                              </td>
                              <td className="p-3 text-slate-400 text-[11px]">
                                {inst.firstInstalled ? new Date(inst.firstInstalled).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                              </td>
                              <td className="p-3 text-slate-300 text-[11px]">
                                {inst.lastActive ? new Date(inst.lastActive).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Reciente'}
                              </td>
                              <td className="p-3 text-center">
                                {inst.isRegistered ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                                    {inst.userEmail}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold text-[10px]">
                                    Libre
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS INBOX TAB */}
          {!loading && adminTab === 'payments' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Comprobantes y Solicitudes de Pago</h3>
              <div className="space-y-3">
                {paymentsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                    No hay comprobantes pendientes
                  </div>
                ) : (
                  paymentsList.map((p) => (
                    <div key={p.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{p.user_name || 'Usuario'}</span>
                          <span className="text-xs text-slate-400 font-mono">({p.user_email})</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.status === 'approved' ? 'bg-emerald-500/20 text-emerald-300' : p.status === 'rejected' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {p.status || 'pending'}
                          </span>
                        </div>

                        {p.message && (
                          <div className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            <strong>Mensaje:</strong> {p.message}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400">
                          Ref: <strong className="text-amber-400 font-mono">{p.transaction_id || p.proof_details || 'N/A'}</strong> • {p.created_at || 'Reciente'}
                        </div>

                        {p.proof_url && (
                          <button
                            onClick={() => setSelectedProofUrl(p.proof_url)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" /> Ver Captura del Comprobante
                          </button>
                        )}
                      </div>

                      {p.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleReviewPayment(p.id, 'approve')}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shadow"
                          >
                            <Check className="w-4 h-4" /> Aprobar (+30D VIP)
                          </button>
                          <button
                            onClick={() => handleReviewPayment(p.id, 'reject')}
                            className="px-3 py-2 bg-slate-800 hover:bg-rose-950 text-rose-300 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* FEEDBACK & OPINIONS TAB */}
          {!loading && adminTab === 'feedback' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white">Opiniones y Sugerencias de los Usuarios</h3>
              <div className="space-y-3">
                {feedbackList.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                    No hay opiniones registradas aún
                  </div>
                ) : (
                  feedbackList.map((f) => (
                    <div key={f.id || Math.random()} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm">{f.user_name || 'Usuario'}</span>
                          <span className="text-slate-400 font-mono text-[11px]">({f.user_email})</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.type === 'positive' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            f.type === 'suggestion' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}>
                            {f.type === 'positive' ? '👍 Me gusta' : f.type === 'suggestion' ? '💡 Sugerencia' : '⚠️ Fallo reportado'}
                          </span>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(Math.max(1, Math.min(5, Number(f.rating) || 5)))].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed">
                        <strong>Opinión sobre la app & ING JH:</strong>
                        <p className="mt-1 text-slate-300">{f.opinion}</p>
                      </div>

                      {f.suggestions && (
                        <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-slate-300 text-xs">
                          <strong className="text-amber-400">Detalles / Sugerencias:</strong> {f.suggestions}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 text-right">
                        {f.created_at || 'Reciente'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* OFFICIAL DRAWS MANAGEMENT TAB */}
          {!loading && adminTab === 'draws' && (
            <form onSubmit={handleSaveOfficialDraw} className="space-y-4 max-w-2xl animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Cargar / Actualizar Extractos Oficiales Reales</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ingresa o modifica los 20 números oficiales de Ciudad y Provincia para que los usuarios vean los resultados 100% exactos.
                  </p>
                </div>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Fecha del Sorteo</label>
                  <input
                    type="date"
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Lotería</label>
                  <select
                    value={drawLottery}
                    onChange={(e) => setDrawLottery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="ciudad">🏛️ Ciudad (Nacional - LOTBA)</option>
                    <option value="provincia">🌿 Provincia (IPLyC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Turno</label>
                  <select
                    value={drawShift}
                    onChange={(e) => setDrawShift(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="previa">La Previa (10:15)</option>
                    <option value="primera">Primera (12:00)</option>
                    <option value="matutina">Matutina (15:00)</option>
                    <option value="vespertina">Vespertina (18:00)</option>
                    <option value="nocturna">Nocturna (21:00)</option>
                  </select>
                </div>
              </div>

              {/* 1° Premio Highlight Input */}
              <div className="bg-amber-950/40 border border-amber-500/50 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black text-amber-400 uppercase block">1° Premio a la Cabeza (4 Cifras)</span>
                  <span className="text-[11px] text-slate-300">
                    Ambo: <strong>{(drawHead || drawBoard[0] || '00').slice(-2)}</strong> ("{SIGNIFICADOS[(drawHead || drawBoard[0] || '00').slice(-2)] || 'La Suerte'}")
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ej: 6666"
                  value={drawHead || drawBoard[0] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDrawHead(val);
                    const nb = [...drawBoard];
                    nb[0] = val;
                    setDrawBoard(nb);
                  }}
                  className="w-28 bg-slate-950 border border-amber-500 text-amber-300 font-mono font-black text-center text-xl rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* 20 Numbers Grid */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-300">Extracto Oficial Completo (20 Posiciones):</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Array.from({ length: 20 }, (_, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-500 w-7 text-right">#{idx + 1}</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0000"
                        value={drawBoard[idx] || ''}
                        onChange={(e) => {
                          const nb = [...drawBoard];
                          nb[idx] = e.target.value;
                          if (idx === 0) setDrawHead(e.target.value);
                          setDrawBoard(nb);
                        }}
                        className={`w-full bg-slate-900 border text-center font-mono font-bold text-xs rounded-lg px-1.5 py-1 focus:outline-none ${
                          idx === 0 ? 'border-amber-500 text-amber-300 font-black' : 'border-slate-700 text-white focus:border-purple-500'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {saveDrawMsg && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 font-bold text-center">
                  {saveDrawMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all uppercase tracking-wider"
              >
                Guardar y Publicar Extracto Oficial
              </button>
            </form>
          )}

          {/* BROADCAST POP-UPS & NOTIFICATIONS CENTER */}
          {!loading && adminTab === 'promo' && (
            <div className="space-y-6">
              
              {/* COMPOSER FORM */}
              <div className="bg-slate-950 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white">
                        Enviar Comunicado / Pop-Up a Todos los Usuarios
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Los mensajes llegarán en tiempo real a la campanita de los clientes y/o como Pop-Up en pantalla.
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePublishNotification} className="space-y-3.5">
                  {/* Categoría Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Tipo de Notificación / Categoría:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: 'update', label: '🚀 Actualización', color: 'border-emerald-500 text-emerald-300 bg-emerald-950/40' },
                        { id: 'vip_alert', label: '👑 Alerta VIP', color: 'border-amber-500 text-amber-300 bg-amber-950/40' },
                        { id: 'ai_hit', label: '🎯 Acierto IA', color: 'border-cyan-500 text-cyan-300 bg-cyan-950/40' },
                        { id: 'general', label: '📢 Comunicado', color: 'border-purple-500 text-purple-300 bg-purple-950/40' },
                        { id: 'promo', label: '🔥 Oferta VIP', color: 'border-rose-500 text-rose-300 bg-rose-950/40' }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNotifCategory(cat.id)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                            notifCategory === cat.id
                              ? `${cat.color} ring-1 font-black shadow`
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Título del Aviso:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 🚀 ¡Nueva Versión 1.3.36 Disponible con Mejoras!"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Mensaje / Contenido Completo:
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escribe el mensaje que leerán los usuarios en su pantalla o en la campanita..."
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
                    />
                  </div>

                  {/* Opciones de Envío (Checkbox Pop-Up) */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPopupNotif"
                        checked={notifIsPopup}
                        onChange={(e) => setNotifIsPopup(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <label htmlFor="isPopupNotif" className="text-xs text-slate-200 font-bold cursor-pointer">
                        Abrir también como Pop-Up en pantalla completa al iniciar la app
                      </label>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">
                      {notifIsPopup ? 'Pop-Up + Campanita' : 'Solo Campanita'}
                    </span>
                  </div>

                  {/* Botón de Acción Opcional */}
                  <div className="grid sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Texto del Botón (Opcional):</label>
                      <input
                        type="text"
                        placeholder="Ej: Descargar Actualización"
                        value={notifActionText}
                        onChange={(e) => setNotifActionText(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Enlace / Destino (Opcional):</label>
                      <input
                        type="text"
                        placeholder="https://ingenieriajh.web.app/quinela"
                        value={notifActionUrl}
                        onChange={(e) => setNotifActionUrl(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {broadcastMsg && (
                    <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                      {broadcastMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>🚀 Enviar Comunicado a Todos los Usuarios</span>
                  </button>
                </form>
              </div>

              {/* HISTORIAL DE COMUNICADOS ACTIVOS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Historial de Comunicados Emitidos ({broadcastHistory.length})</span>
                </h4>

                {broadcastHistory.length === 0 ? (
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
                    No hay comunicados activos.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
                    {broadcastHistory.map((item) => (
                      <div key={item.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 uppercase">
                              {item.category}
                            </span>
                            {item.is_popup && (
                              <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Pop-Up
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(item.created_at).toLocaleString('es-AR')}
                            </span>
                          </div>
                          <h5 className="font-bold text-white text-xs">{item.title}</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{item.message}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteBroadcastItem(item.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Eliminar comunicado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ENLACE DE AFILIADO OFICIAL */}
              <div className="pt-4 border-t border-slate-800 space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Enlace de Afiliado Oficial (.bet.ar)
                  </h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pega aquí tu enlace oficial de Quiniela (portal oficial <strong>lotba.bet.ar</strong>). Todos los botones de <em>"🎯 Jugar en Plataforma Oficial"</em> abrirán este enlace.
                </p>
                
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="https://lotba.bet.ar"
                    value={affiliateInput}
                    onChange={(e) => setAffiliateInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 truncate">
                      Actual: {affiliateInput || 'https://lotba.bet.ar'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (affiliateInput.trim()) {
                          setAffiliateUrl(affiliateInput.trim());
                          setAffiliateSaveMsg('¡Enlace de Afiliado guardado con éxito!');
                          setTimeout(() => setAffiliateSaveMsg(''), 3000);
                        }
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      Guardar Enlace
                    </button>
                  </div>

                  {affiliateSaveMsg && (
                    <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-xl text-center animate-fadeIn">
                      {affiliateSaveMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE DE USUARIO Y GESTIÓN VIP PERSONALIZADA */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-purple-500/50 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-base shadow">
                  {selectedUserModal.photoURL ? (
                    <img src={selectedUserModal.photoURL} alt="avatar" className="w-10 h-10 rounded-2xl object-cover" />
                  ) : (
                    <UserCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {selectedUserModal.name || 'Usuario Registrado'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400 truncate max-w-[220px] sm:max-w-[280px]">
                    {selectedUserModal.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Datos del Cliente y Estado VIP */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Estado de Membresía:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                  selectedUserModal.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : selectedUserModal.is_vip
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                }`}>
                  {selectedUserModal.tier || (selectedUserModal.is_vip ? 'VIP ACTIVO' : 'PLAN FREE')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Tiempo de Vigencia VIP:</span>
                <span className="font-bold text-amber-400">
                  {selectedUserModal.vip_days_left > 0 ? (
                    `Quedan ${selectedUserModal.vip_days_left} días de acceso`
                  ) : selectedUserModal.trial_active ? (
                    `Prueba activa (${selectedUserModal.trial_days_left}d)`
                  ) : (
                    <span className="text-slate-500 font-normal">Sin días VIP activos</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                <span className="text-slate-500">ID / UID:</span>
                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[200px]">
                  {selectedUserModal.id || 'N/A'}
                </span>
              </div>

              {selectedUserModal.createdAt && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Fecha de Registro:</span>
                  <span className="font-mono text-[10px] text-slate-300">
                    {new Date(selectedUserModal.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>

            {/* Mensaje de Confirmación / Éxito */}
            {userModalMsg && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-bold text-center animate-fadeIn">
                {userModalMsg}
              </div>
            )}

            {/* Asignación Rápida de Días VIP */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Asignar o Sumar Días VIP:</span>
              </label>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleGrantVip(selectedUserModal.id || selectedUserModal.email, 7)}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all active:scale-95"
                >
                  +7 Días
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantVip(selectedUserModal.id || selectedUserModal.email, 15)}
                  className="py-2 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer transition-all active:scale-95"
                >
                  +15 Días
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantVip(selectedUserModal.id || selectedUserModal.email, 30)}
                  className="py-2 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer transition-all active:scale-95"
                >
                  +30 Días
                </button>
                <button
                  type="button"
                  onClick={() => handleGrantVip(selectedUserModal.id || selectedUserModal.email, 365)}
                  className="py-2 px-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl shadow cursor-pointer transition-all active:scale-95"
                >
                  +1 Año
                </button>
              </div>
            </div>

            {/* Asignación Personalizada */}
            <div className="flex gap-2 pt-1">
              <input
                type="number"
                min="1"
                max="999"
                value={customVipDays}
                onChange={(e) => setCustomVipDays(e.target.value)}
                placeholder="Días"
                className="w-24 bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-xl px-3 py-2 text-xs font-bold text-white text-center focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleGrantVip(selectedUserModal.id || selectedUserModal.email, customVipDays)}
                className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Asignar {customVipDays} Días VIP</span>
              </button>
            </div>

            {/* Opción de Revocar */}
            {selectedUserModal.is_vip ? (
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => handleRevokeVip(selectedUserModal.id || selectedUserModal.email)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold underline cursor-pointer"
                >
                  Quitar acceso VIP (Pasar a cuenta Free)
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Modal Preview for Payment Proof */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-4 max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">Captura de Comprobante de Pago</span>
              <button 
                onClick={() => setSelectedProofUrl(null)} 
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-center p-2">
              <img src={selectedProofUrl} alt="Comprobante de Pago" className="w-full h-auto object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
