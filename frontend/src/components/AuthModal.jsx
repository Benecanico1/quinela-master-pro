import React, { useState } from 'react';
import axios from 'axios';
import { X, UserPlus, LogIn, Sparkles, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import GoogleAuthPromptModal from './GoogleAuthPromptModal';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onSuccess }) {
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [isRegister, setIsRegister] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const triggerSuccess = (userData) => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess(userData);
    } else if (typeof onSuccess === 'function') {
      onSuccess(userData);
    }
  };

  const handleGoogleSuccess = (googleUser) => {
    setShowGooglePrompt(false);
    triggerSuccess(googleUser);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    let finalName = name.trim();
    if (!finalName) {
      finalName = email.split('@')[0];
      finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
    }

    const userProfile = {
      id: Date.now(),
      name: finalName,
      email: email.trim().toLowerCase(),
      role: 'user',
      is_vip: true,
      tier: 'VIP_TRIAL',
      trial_active: true,
      trial_days_left: 15,
      vip_active: true,
      vip_days_left: 15
    };

    triggerSuccess(userProfile);
    onClose();

    // Async background sync
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name: userProfile.name, email: userProfile.email, password } 
      : { email: userProfile.email, password };
    
    axios.post(endpoint, payload, { timeout: 2000 }).catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl relative space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase mb-2 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" /> {isRegister ? '15 Días de Prueba VIP Gratis' : 'Acceso a tu Cuenta'}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              {isRegister ? 'Comenzar Prueba VIP' : 'Iniciar Sesión'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isRegister ? 'Regístrate hoy y recibe 15 días de acceso total sin costo.' : 'Ingresa tus credenciales registradas.'}
            </p>
          </div>

          {/* Google Fast Button */}
          <button
            type="button"
            onClick={() => setShowGooglePrompt(true)}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm rounded-xl shadow flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-98"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>Acceder con Google (+15d VIP)</span>
          </button>

          <div className="flex items-center gap-2 my-1">
            <div className="flex-1 border-t border-slate-800"></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold">O con correo</span>
            <div className="flex-1 border-t border-slate-800"></div>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs p-2.5 rounded-xl text-center font-bold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Tu nombre o apodo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">Contraseña</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              {isRegister ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>ACTIVAR MIS 15 DÍAS VIP</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>INICIAR SESIÓN</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-1 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer transition-all"
            >
              {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate y obtén 15 días gratis'}
            </button>
          </div>
        </div>
      </div>

      <GoogleAuthPromptModal
        isOpen={showGooglePrompt}
        onClose={() => setShowGooglePrompt(false)}
        onGoogleSuccess={handleGoogleSuccess}
      />
    </>
  );
}
