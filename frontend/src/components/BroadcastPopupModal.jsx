import React from 'react';
import { X, Sparkles, Megaphone, Crown, Trophy, Flame, ExternalLink, ArrowRight } from 'lucide-react';
import { markPopupAsSeen, markNotificationAsRead } from '../services/notificationService';

export default function BroadcastPopupModal({ 
  announcement, 
  onClose, 
  onNavigateTab 
}) {
  if (!announcement) return null;

  const handleAction = () => {
    markPopupAsSeen(announcement.id);
    markNotificationAsRead(announcement.id);
    
    if (announcement.action_tab && onNavigateTab) {
      onNavigateTab(announcement.action_tab);
      onClose();
    } else if (announcement.action_url) {
      window.open(announcement.action_url, '_blank');
      onClose();
    } else {
      onClose();
    }
  };

  const handleDismiss = () => {
    markPopupAsSeen(announcement.id);
    onClose();
  };

  const getBadgeInfo = (cat) => {
    switch (cat) {
      case 'update':
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
          titleBadge: '🚀 ACTUALIZACIÓN DISPONIBLE',
          borderColor: 'border-emerald-500/60',
          btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
        };
      case 'vip_alert':
        return {
          icon: <Crown className="w-4 h-4 text-amber-400" />,
          titleBadge: '👑 NOVEDAD VIP OFICIAL',
          borderColor: 'border-amber-500/60',
          btnBg: 'bg-amber-500 hover:bg-amber-400 text-slate-950'
        };
      case 'ai_hit':
        return {
          icon: <Trophy className="w-4 h-4 text-cyan-400" />,
          titleBadge: '🎯 ACIERTO OFICIAL DE LA IA',
          borderColor: 'border-cyan-500/60',
          btnBg: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
        };
      case 'promo':
        return {
          icon: <Flame className="w-4 h-4 text-rose-400" />,
          titleBadge: '🔥 OFERTA LIMITADA',
          borderColor: 'border-rose-500/60',
          btnBg: 'bg-rose-500 hover:bg-rose-400 text-white'
        };
      default:
        return {
          icon: <Megaphone className="w-4 h-4 text-purple-400" />,
          titleBadge: '📢 COMUNICADO OFICIAL',
          borderColor: 'border-purple-500/60',
          btnBg: 'bg-purple-600 hover:bg-purple-500 text-white'
        };
    }
  };

  const badge = getBadgeInfo(announcement.category);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className={`bg-slate-900 border ${badge.borderColor} rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl relative animate-scaleIn`}>
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Cerrar aviso"
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge */}
        <div className="flex items-center gap-1.5 text-xs font-black tracking-wider uppercase">
          {badge.icon}
          <span className="text-white">{badge.titleBadge}</span>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
          {announcement.title}
        </h3>

        {/* Message */}
        <div className="bg-slate-950/80 p-3.5 sm:p-4 rounded-2xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-60 overflow-y-auto no-scrollbar">
          {announcement.message}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {(announcement.action_text || announcement.action_tab || announcement.action_url) ? (
            <button
              type="button"
              onClick={handleAction}
              className={`w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg active:scale-98 ${badge.btnBg}`}
            >
              <span>{announcement.action_text || 'Ver Novedad'}</span>
              {announcement.action_url ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Entendido (Guardar en la Campanita)
          </button>
        </div>

      </div>
    </div>
  );
}