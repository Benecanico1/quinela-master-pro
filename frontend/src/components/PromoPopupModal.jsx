import React from 'react';
import { X, Sparkles, Flame, Crown, ArrowRight } from 'lucide-react';

export default function PromoPopupModal({ promo, isOpen, onClose, onActivateClick }) {
  if (!isOpen || !promo || !promo.is_active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-wider mb-3 border border-rose-500/40">
          <Flame className="w-3.5 h-3.5 fill-current" /> {promo.badge || 'OFERTA ESPECIAL'}
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
          {promo.title}
        </h3>

        <p className="text-xs text-slate-300 mt-2 mb-4">
          {promo.subtitle}
        </p>

        <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 mb-6 shadow-inner">
          <div className="text-xs text-slate-400 font-semibold uppercase">Precio Promocional</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            {promo.discount_text}
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
            onActivateClick();
          }}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Crown className="w-4 h-4 fill-current" /> {promo.button_text || 'APROVECHAR OFERTA AHORA'}
        </button>
      </div>
    </div>
  );
}
