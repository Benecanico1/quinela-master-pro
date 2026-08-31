import React, { useState } from 'react';
import { 
  X, User, Mail, ShieldCheck, Crown, Sparkles, Clock, LogOut, 
  ChevronRight, ExternalLink, Award, CheckCircle2, Ticket, Star, RefreshCw
} from 'lucide-react';
import { logOutGoogleAccount, getAffiliateUrl } from '../services/firebaseClient';

export default function UserProfileModal({ isOpen, onClose, user, onUserUpdated, onOpenUpgrade }) {
  const [loggingOut, setLoggingOut] = useState(false);

  if (!isOpen || !user) return null;

  const isVip = Boolean(user.is_vip || user.vip_active || user.email === 'jesushidalgo25@gmail.com');
  const daysLeft = user.vip_days_left ?? (isVip ? 30 : 0);
  const affiliateUrl = getAffiliateUrl();

  const handleLogout = async () => {
    setLoggingOut(true);
    await logOutGoogleAccount();
    if (onUserUpdated) {
      onUserUpdated(null);
    }
    setLoggingOut(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative space-y-5 text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Badge */}
        <div className="flex items-center gap-3.5 pt-1">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.name} 
              className="w-14 h-14 rounded-2xl border-2 border-amber-400/50 shadow-md object-cover" 
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg border-2 border-amber-300">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white truncate">{user.name || 'Mi Cuenta'}</h3>
              {isVip && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> VIP
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 shrink-0" /> {user.email}
            </p>
          </div>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border ${
          isVip 
            ? 'bg-gradient-to-br from-amber-500/10 via-amber-900/10 to-slate-900 border-amber-500/30 shadow-inner' 
            : 'bg-slate-800/60 border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isVip ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-400'}`}>
                {isVip ? <Sparkles className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Estado de Cuenta</p>
                <p className="text-sm font-black text-white">
                  {isVip ? `👑 Suscripción VIP (${daysLeft} días restantes)` : '🆓 Cuenta Gratuita (Pronóstico #1)'}
                </p>
              </div>
            </div>

            {!isVip && onOpenUpgrade && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUpgrade();
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs shadow hover:brightness-110 cursor-pointer active:scale-95 transition-all"
              >
                Activar VIP
              </button>
            )}
          </div>
        </div>

        {/* Benefits & Access info */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tus Beneficios Activos</p>
          <div className="space-y-1.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Acceso directo a Pizarras Oficiales (20 premios en vivo)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isVip ? 'Top 5 Pronósticos de IA + Redoblonas Candado' : 'Pronóstico #1 de Máxima Probabilidad'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Escáner de Boletos con lector de código de barras</span>
            </div>
          </div>
        </div>

        {/* Play on official portal button */}
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 cursor-pointer transition-all active:scale-98"
        >
          <span>🎯 Jugar en Plataforma Oficial Autorizada (.bet.ar)</span>
          <ExternalLink className="w-4 h-4" />
        </a>

        {/* Logout button */}
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">ID: {String(user.id).slice(0, 10)}...</span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-red-400 hover:text-red-300 flex items-center gap-1 font-bold cursor-pointer transition-colors"
          >
            {loggingOut ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
