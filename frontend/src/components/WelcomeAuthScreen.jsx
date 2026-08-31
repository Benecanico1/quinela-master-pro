import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import GoogleAuthPromptModal from './GoogleAuthPromptModal';

export default function WelcomeAuthScreen({ isOpen, onAuthSuccess, onSuccess, onContinueAsGuest }) {
  const [showEmailForm, setShowEmailForm] = useState(false);
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

  const handleGoogleClick = () => {
    setShowGooglePrompt(true);
  };

  const handleGoogleSuccess = (googleUser) => {
    setShowGooglePrompt(false);
    triggerSuccess(googleUser);
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    let finalName = name.trim();
    if (!finalName) {
      finalName = email.split('@')[0];
      finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
    }

    const trialUser = {
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

    triggerSuccess(trialUser);

    // Async background sync
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { name: trialUser.name, email: trialUser.email, password } 
      : { email: trialUser.email, password };

    axios.post(endpoint, payload, { timeout: 2000 }).catch(() => {});
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto animate-fadeIn">
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-7 space-y-5 text-center my-auto">
          
          {/* Big Official Logo with Glow */}
          <div className="flex flex-col items-center justify-center space-y-3 pt-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-300 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-2 border-amber-400 shadow-2xl bg-slate-950">
                <img 
                  src="/logo.jpg" 
                  alt="Quinela Master Pro" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                Quinela Master Pro
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AI
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Inteligencia y Probabilidad Oficial</p>
            </div>
          </div>

          {/* 15-Day VIP Gift Callout */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/40 rounded-2xl p-3 text-center space-y-1">
            <div className="inline-flex items-center gap-1 text-amber-400 font-black text-xs uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> ¡Regalo de Bienvenida!
            </div>
            <p className="text-[11px] sm:text-xs text-slate-200 font-semibold">
              Regístrate hoy y recibe <strong className="text-amber-300 font-black">15 DÍAS VIP GRATIS</strong> con acceso total a los 5 pronósticos y estrategias.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs p-2.5 rounded-xl text-center font-bold">
              {errorMsg}
            </div>
          )}

          {/* Main Action 1: Google Login Button */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleClick}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-3 cursor-pointer transition-all active:scale-98"
            >
              {/* Google Colorful Icon SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continuar con Google</span>
            </button>

            {/* Collapsible Email Registration Section */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowEmailForm(!showEmailForm)}
                className="text-xs font-bold text-slate-400 hover:text-amber-400 flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{showEmailForm ? 'Ocultar formulario de correo' : 'O regístrate con tu correo acá'}</span>
                {showEmailForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showEmailForm && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 pt-2 text-left bg-slate-950/80 p-4 rounded-2xl border border-slate-800 animate-fadeIn">
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-bold text-center mb-2">
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className={`flex-1 py-1.5 rounded-lg cursor-pointer ${isRegister ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Registrarme (+15d VIP)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className={`flex-1 py-1.5 rounded-lg cursor-pointer ${!isRegister ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'}`}
                  >
                    Iniciar Sesión
                  </button>
                </div>

                {isRegister && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      placeholder="Tu nombre o apodo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
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
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  {isRegister ? 'Crear Cuenta y Activar 15 Días VIP' : 'Ingresar a mi Cuenta'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          {/* Option 3: Continue as Guest without Account */}
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-2xl border border-slate-700/60 cursor-pointer transition-all"
            >
              Entrar sin cuenta (Modo Invitado)
            </button>
            <p className="text-[10px] text-slate-400">
              * Sin cuenta tendrás acceso libre al 1° pronóstico diario. Puedes registrarte luego para activar los 15 días VIP.
            </p>
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
