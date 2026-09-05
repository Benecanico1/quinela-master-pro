import React, { useState } from 'react';
import { 
  X, Settings, User, Bell, Volume2, Shield, HelpCircle, 
  Code, Crown, LogOut, ChevronRight, Lock, Sparkles, Check, LogIn,
  MessageSquare, Upload, MessageSquareHeart, Star
} from 'lucide-react';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  user, 
  onOpenGuide, 
  onOpenAdmin, 
  onOpenUpgrade, 
  onLogout,
  onOpenAuth,
  onOpenContactSupport,
  onOpenFeedback,
  onElevateAdmin
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');

  if (!isOpen) return null;

  const isAdmin = user?.email === 'jesushidalgo25@gmail.com' || user?.role === 'admin';
  const isGuest = !user?.is_vip && (!user?.email || user?.email === 'visita@quiniela.com');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl overflow-hidden border border-amber-500/40 shadow">
              <img src="/logo.jpg" alt="Quinela Master Pro" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-1.5">
                Configuración y Perfil
              </h3>
              <span className="text-[11px] text-slate-400">Quinela Master Pro v1.4.6</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {/* User Account Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black text-base shadow">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="font-black text-white text-sm">{user?.name || 'Usuario'}</div>
                <div className="text-[11px] text-slate-400">{user?.email || 'visita@quiniela.com'}</div>
              </div>
            </div>

            <div>
              {user?.is_vip ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VIP ({user.trial_days_left}d)
                </span>
              ) : (
                <button
                  onClick={onOpenUpgrade}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg cursor-pointer transition-all"
                >
                  Subir a VIP
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions List */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
            {/* Guide Button */}
            <button
              onClick={() => {
                onClose();
                onOpenGuide();
              }}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-900 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm">Guía de Uso Interactiva</div>
                  <div className="text-[10px] text-slate-400">Aprende a jugar con la estrategia matemática</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Feedback Button */}
            <button
              onClick={() => {
                onClose();
                if (onOpenFeedback) onOpenFeedback();
              }}
              className="w-full p-3.5 flex items-center justify-between hover:bg-slate-900 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <MessageSquareHeart className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm">Dejar Opinión & Feedback</div>
                  <div className="text-[10px] text-slate-400">Danos tu opinión sobre la app y nuestro trabajo</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>

            {/* Notification Toggle */}
            <div className="p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-white text-xs sm:text-sm">Alertas de Sorteo</div>
                  <div className="text-[10px] text-slate-400">Avisar 15 min antes del cierre de jugadas</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Contact Support & VIP Payment Proof Section (Visible to ALL Users) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-xs sm:text-sm">Contacto con el Administrador</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              ¿Deseas activar tu membresía VIP o tienes alguna duda? Envía un mensaje directo al administrador o adjunta la captura de tu comprobante de pago.
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenContactSupport();
              }}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Enviar Mensaje o Comprobante de Pago</span>
            </button>
          </div>

          {/* Administrator Section: Direct Access or PIN Unlock */}
          {isAdmin ? (
            <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/20 p-4 rounded-2xl border border-amber-500/50 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-white text-xs sm:text-sm">Consola de Administrador</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40">
                  ADMIN ACTIVO
                </span>
              </div>

              <p className="text-[11px] text-slate-300">
                Acceso autorizado para gestionar usuarios VIP, revisar pagos y configurar la app.
              </p>

              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <span>Abrir Panel de Control Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs sm:text-sm">Acceso de Administrador</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Jesús Hidalgo</span>
              </div>

              {showAdminPin ? (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      placeholder="Ingresa PIN (ej: 2508)"
                      value={adminPin}
                      onChange={(e) => { setAdminPin(e.target.value); setPinError(''); }}
                      className="flex-1 bg-slate-900 border border-slate-700 text-white font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => {
                        if (adminPin === '2508' || adminPin === '2026' || adminPin === '1234' || adminPin.toLowerCase() === 'admin') {
                          if (onElevateAdmin) onElevateAdmin();
                          onClose();
                          onOpenAdmin();
                        } else {
                          setPinError('PIN incorrecto. Intenta con 2508');
                        }
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      Entrar
                    </button>
                  </div>
                  {pinError && <p className="text-[10px] text-rose-400 font-bold">{pinError}</p>}
                </div>
              ) : (
                <button
                  onClick={() => setShowAdminPin(true)}
                  className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Desbloquear Consola de Administrador</span>
                </button>
              )}
            </div>
          )}

          {/* Logout / Switch Account Section */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <LogOut className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white text-xs sm:text-sm">
                  {isGuest ? 'Iniciar Sesión / Registrar' : 'Cerrar Sesión'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {isGuest ? 'Conéctate para activar tus 15 días VIP' : 'Desconectar de esta cuenta en este dispositivo'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                if (isGuest) {
                  onOpenAuth();
                } else {
                  onLogout();
                }
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-all ${
                isGuest 
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' 
                  : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30'
              }`}
            >
              {isGuest ? 'Conectar' : 'Salir'}
            </button>
          </div>

          {/* Credits & Authors Card */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-center space-y-1.5 text-xs">
            <div className="font-bold text-white">Quinela Master Pro AI</div>
            <p className="text-slate-400 text-[11px]">
              Diseñado y desarrollado por{' '}
              <a 
                href="https://ingenieriajh.web.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-black underline decoration-amber-500/50 underline-offset-2 transition-all inline-flex items-center gap-1 cursor-pointer"
              >
                ING JH
              </a>
            </p>
            <div className="text-[10px] text-slate-400 pt-1">
              &copy; 2026 Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
