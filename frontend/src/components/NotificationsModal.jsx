import React from 'react';
import { 
  X, Bell, Trash2, CheckCheck, ExternalLink, Sparkles, 
  Crown, Trophy, Megaphone, Flame, Clock, ArrowRight, ShieldCheck
} from 'lucide-react';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotificationForUser, 
  clearAllNotifications 
} from '../services/notificationService';

export default function NotificationsModal({ 
  isOpen, 
  onClose, 
  notifications = [], 
  onNotificationsChange, 
  onNavigateTab 
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    const updated = markAllNotificationsAsRead();
    if (onNotificationsChange) onNotificationsChange(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('¿Deseas eliminar todos los mensajes de tu bandeja?')) {
      const updated = clearAllNotifications();
      if (onNotificationsChange) onNotificationsChange(updated);
    }
  };

  const handleDeleteOne = (e, id) => {
    e.stopPropagation();
    const updated = deleteNotificationForUser(id);
    if (onNotificationsChange) onNotificationsChange(updated);
  };

  const handleNotificationClick = (item) => {
    if (!item.read) {
      const updated = markNotificationAsRead(item.id);
      if (onNotificationsChange) onNotificationsChange(updated);
    }

    if (item.action_tab && onNavigateTab) {
      onNavigateTab(item.action_tab);
      onClose();
    } else if (item.action_url) {
      window.open(item.action_url, '_blank');
      onClose();
    }
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'update':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
          label: '🚀 Actualización',
          style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        };
      case 'vip_alert':
        return {
          icon: <Crown className="w-3.5 h-3.5 text-amber-400" />,
          label: '👑 Alerta VIP',
          style: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
      case 'ai_hit':
        return {
          icon: <Trophy className="w-3.5 h-3.5 text-cyan-400" />,
          label: '🎯 Acierto IA',
          style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
        };
      case 'promo':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
          label: '🔥 Oferta Especial',
          style: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        };
      default:
        return {
          icon: <Megaphone className="w-3.5 h-3.5 text-purple-400" />,
          label: '📢 Comunicado Oficial',
          style: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        };
    }
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'Reciente';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    } catch (e) {
      return 'Reciente';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl flex flex-col max-h-[88vh] relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Notificaciones & Avisos</span>
                {unreadCount > 0 && (
                  <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black animate-pulse">
                    {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Mensajes oficiales, novedades y alertas de la IA</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar notificaciones"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-xs px-1 shrink-0">
            <span className="text-slate-400 font-medium text-[11px]">
              {notifications.length} {notifications.length === 1 ? 'mensaje guardado' : 'mensajes guardados'}
            </span>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Marcar leídas</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-slate-400 hover:text-rose-400 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="Vaciar todos los mensajes"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Vaciar</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 no-scrollbar">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-300">No tienes notificaciones pendientes</p>
                <p className="text-xs text-slate-500 mt-0.5">Te avisaremos cuando haya nuevos sorteos, aciertos o actualizaciones.</p>
              </div>
            </div>
          ) : (
            (notifications || []).filter(Boolean).map((item) => {
              const badge = getCategoryBadge(item?.category || 'general');
              const isUnread = !item?.read;

              return (
                <div
                  key={item?.id || Math.random()}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative group ${
                    isUnread
                      ? 'bg-slate-950 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {/* Top row: Badge + Timestamp + Delete button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 ${badge.style}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </span>

                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10.5px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(item?.created_at)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteOne(e, item?.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Borrar mensaje"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Title */}
                  <h3 className={`text-xs sm:text-sm font-black leading-snug ${isUnread ? 'text-white' : 'text-slate-200'}`}>
                    {item?.title || 'Notificación'}
                  </h3>

                  {/* Message Body */}
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item?.message || ''}
                  </p>

                  {/* Action Button if configured */}
                  {(item?.action_text || item?.action_tab || item?.action_url) && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 group-hover:underline">
                        <span>{item.action_text || 'Ver más detalles'}</span>
                        {item.action_url ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-center shrink-0">
          <p className="text-[10px] text-slate-500">
            Los mensajes permanecen guardados en tu dispositivo hasta que decidas borrarlos.
          </p>
        </div>

      </div>
    </div>
  );
}