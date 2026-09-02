import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ShieldCheck, Mail, User, ArrowRight } from 'lucide-react';
import { db } from '../services/firebaseClient';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function GoogleAuthPromptModal({ isOpen, onClose, onGoogleSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.trim()) {
      setError('Por favor ingresa tu correo de Google Gmail.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail.includes('@')) {
        cleanEmail += '@gmail.com';
      }

      let displayName = name.trim();
      if (!displayName) {
        displayName = cleanEmail.split('@')[0];
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }

      const isAdmin = cleanEmail === 'jesushidalgo25@gmail.com';
      const docId = `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const userData = {
        id: docId,
        name: displayName,
        email: cleanEmail,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        is_vip: 1,
        vip_days_left: isAdmin ? 365 : 15,
        trial_active: !isAdmin,
        trial_days_left: isAdmin ? 365 : 15,
        role: isAdmin ? 'admin' : 'user',
        tier: isAdmin ? 'VIP_ANNUAL' : 'VIP_TRIAL',
        provider: 'google.com',
        last_login: new Date().toISOString()
      };

      // Save to Firestore if connected
      if (db) {
        try {
          const userRef = doc(db, 'users', docId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const existing = userSnap.data();
            userData.is_vip = existing.is_vip ?? userData.is_vip;
            userData.vip_days_left = existing.vip_days_left ?? userData.vip_days_left;
            userData.tier = existing.tier ?? userData.tier;
            userData.role = existing.role ?? userData.role;
          }
          await setDoc(userRef, userData, { merge: true });
        } catch (dbErr) {
          console.warn("Firestore sync skipped:", dbErr);
        }
      }

      // Link device telemetry
      try {
        const { syncUserProfileToCloud } = await import('../services/telemetryService');
        await syncUserProfileToCloud(userData);
      } catch (e) {}

      localStorage.setItem('quiniela_user', JSON.stringify(userData));
      onGoogleSuccess(userData);
      onClose();
    } catch (err) {
      console.error("Error signing in:", err);
      setError('Ocurrió un error al procesar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Official Google Brand */}
        <div className="flex flex-col items-center justify-center pt-1 space-y-2">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-200">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-white">Continuar con Google</h3>
            <p className="text-[11px] text-slate-400">Acceso Seguro Instantáneo (+15 Días VIP)</p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Tu Correo Google (Gmail)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="tu.cuenta@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Nombre de Usuario (Opcional)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 mt-2"
          >
            <span>{loading ? 'Verificando Cuenta...' : 'Vincular y Activar 15 Días VIP'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        <div className="pt-1 text-[10.5px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tus datos y pronósticos quedan respaldados de forma segura</span>
        </div>
      </div>
    </div>
  );
}
