import React from 'react';
import { Lock, Sparkles, Crown } from 'lucide-react';

export default function VipGate({ isVip, featureName, onOpenUpgrade, children }) {
  if (isVip) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      {/* Blurred Preview of the Component */}
      <div className="filter blur-md pointer-events-none opacity-40 select-none">
        {children}
      </div>

      {/* Golden VIP Lock Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-950/85 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Crown className="w-9 h-9" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider mb-2 border border-amber-500/40">
          <Sparkles className="w-3.5 h-3.5" /> Función Exclusiva VIP
        </div>

        <h3 className="text-xl md:text-2xl font-black text-white max-w-md">
          {featureName || 'Módulo Reservado para Miembros VIP'}
        </h3>

        <p className="text-xs text-slate-300 mt-2 max-w-md">
          Tu periodo de prueba inicial de 15 días ha finalizado. Desbloquea acceso ilimitado a todas las herramientas avanzadas por solo <strong className="text-amber-300">$5 USD / mes</strong> (o $5.500 ARS vía Mercado Pago).
        </p>

        <button
          onClick={onOpenUpgrade}
          className="mt-6 px-8 py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-xl shadow-amber-500/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Crown className="w-4 h-4" /> ACTIVAR MI MES VIP AHORA
        </button>
      </div>
    </div>
  );
}
