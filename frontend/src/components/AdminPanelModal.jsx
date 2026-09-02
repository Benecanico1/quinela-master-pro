import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, Users, CreditCard, Megaphone, Settings, 
  ShieldCheck, Check, Plus, RefreshCw, Crown, AlertCircle,
  Eye, Image as ImageIcon, MessageSquareHeart, Star, ThumbsUp, Lightbulb, AlertTriangle, ChevronRight, Trophy, ExternalLink, Smartphone
} from 'lucide-react';
import { getRealOfficialDrawsFromStorage, saveRealOfficialDrawToStorage, SIGNIFICADOS, getLocalDateString } from '../services/clientEngine';
import { getAffiliateUrl, setAffiliateUrl } from '../services/firebaseClient';
import { getCloudAdminTelemetry, grantVipDaysInCloud } from '../services/telemetryService';

export default function AdminPanelModal({ isOpen, onClose, adminEmail = 'jesushidalgo25@gmail.com' }) {
  const [adminTab, setAdminTab] = useState('users');
  const [usersList, setUsersList] = useState([]);
  const [installsList, setInstallsList] = useState([]);
  const [userSubTab, setUserSubTab] = useState('registered'); // 'registered' or 'installs'
  const [paymentsList, setPaymentsList] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
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
    setUsersList(prev => (prev || []).map(u => {
      if (u.id === userId || u.email === userId) {
        return { ...u, is_vip: 1, tier: 'VIP_MONTHLY', vip_active: 1, vip_days_left: (u.vip_days_left || 0) + days };
      }
      return u;
    }));

    const currentUser = JSON.parse(localStorage.getItem('quiniela_user') || '{}');
    if (currentUser.id === userId || currentUser.email === userId || currentUser.email === adminEmail) {
      currentUser.is_vip = true;
      currentUser.tier = 'VIP_MONTHLY';
      currentUser.vip_active = true;
      currentUser.vip_days_left = (currentUser.vip_days_left || 0) + days;
      localStorage.setItem('quiniela_user', JSON.stringify(currentUser));
    }

    // Direct Firestore update
    try {
      await grantVipDaysInCloud(userId, days);
    } catch (e) {}

    try {
      await axios.post('/api/admin/users/grant-vip', {
        admin_email: adminEmail,
        user_id: userId,
        days: days
      }, { timeout: 1500 });
    } catch (err) {}
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
            onClick={() => setAdminTab('promo')}
            className={`pb-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 cursor-pointer transition-all shrink-0 ${adminTab === 'promo' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Megaphone className="w-4 h-4" /> Ofertas Pop-Up
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
                        <tr key={u.id || u.email} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt="avatar" className="w-6 h-6 rounded-full border border-slate-700 bg-slate-800" />
                            ) : null}
                            <span>{u.name || 'Sin Nombre'}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-400">{u.email}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : u.is_vip ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'}`}>
                              {u.tier || (u.is_vip ? 'VIP' : 'FREE')}
                            </span>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {u.trial_active ? (
                              <span className="text-emerald-400">{u.trial_days_left || u.vip_days_left}d prueba</span>
                            ) : u.vip_active || u.is_vip ? (
                              <span className="text-amber-400">{u.vip_days_left}d VIP</span>
                            ) : (
                              <span className="text-rose-400 font-bold">Free</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
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
                                onClick={() => handleGrantVip(u.id || u.email, 365)}
                                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold text-[10px] cursor-pointer"
                              >
                                +1 Año
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

          {/* PROMOTIONS TAB */}
          {!loading && adminTab === 'promo' && (
            <div className="space-y-6 max-w-lg">
              <form onSubmit={handleSavePromo} className="space-y-3">
              <h3 className="text-sm font-bold text-white">Configurar Banner Pop-Up de Oferta VIP</h3>
              
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Título de la Oferta</label>
                <input
                  type="text"
                  value={promo?.title || ''}
                  onChange={(e) => setPromo({ ...promo, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Subtítulo Descriptivo</label>
                <input
                  type="text"
                  value={promo?.subtitle || ''}
                  onChange={(e) => setPromo({ ...promo, subtitle: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Texto de Descuento</label>
                <input
                  type="text"
                  value={promo?.discount_text || ''}
                  onChange={(e) => setPromo({ ...promo, discount_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={Boolean(promo?.is_active)}
                  onChange={(e) => setPromo({ ...promo, is_active: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
                <label htmlFor="promoActive" className="text-xs text-white font-bold cursor-pointer">
                  Mostrar Pop-Up automático a usuarios no VIP
                </label>
              </div>

              {saveStatus && (
                <div className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 p-2 rounded-xl text-center">
                  {saveStatus}
                </div>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all"
              >
                Guardar Configuración
              </button>
            </form>

            {/* Affiliate Official Link Configuration */}
            <div className="mt-6 pt-5 border-t border-slate-800 space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Enlace de Afiliado Oficial (.bet.ar)
                </h4>
              </div>
              <p className="text-[11px] text-slate-400">
                Pega aquí tu enlace oficial de Quiniela (portal oficial <strong>lotba.bet.ar</strong> o de redes como <strong>Afiliapub</strong>, <strong>bplay</strong>, <strong>Betsson</strong>). Todos los botones de <em>"🎯 Jugar en Plataforma Oficial"</em> abrirán este enlace para acreditarte comisiones automáticamente.
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
                    Guardar Enlace de Afiliado
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
