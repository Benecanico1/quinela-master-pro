import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function SplashScreen({ onFinish, duration = 2400 }) {
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadingOut(true);
    }, Math.max(duration - 400, 1000));

    const endTimer = setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
    };
  }, [duration, onFinish]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }, 200);
  };

  return (
    <div 
      onClick={handleSkip}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between py-12 px-6 bg-slate-950 text-white transition-opacity duration-500 cursor-pointer select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'radial-gradient(circle at 50% 40%, #1e1b4b 0%, #090d16 60%, #030712 100%)'
      }}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Tag */}
      <div className="flex items-center gap-2 pt-4 opacity-80">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-xs font-semibold tracking-widest uppercase text-amber-400/90">
          Sistemas Predictivos Oficiales
        </span>
      </div>

      {/* Main Center Logo & Title */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-xs relative z-10">
        {/* Glowing Logo Card */}
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition duration-1000 animate-pulse" />
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden border-2 border-amber-400/30 shadow-2xl shadow-amber-500/20 bg-slate-900 flex items-center justify-center">
            <img 
              src="/splash_logo.jpg" 
              alt="Quiniela Master Pro" 
              className="w-full h-full object-cover transform hover:scale-105 transition duration-700"
              onError={(e) => {
                e.target.src = '/logo.jpg';
              }}
            />
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-wider bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            QUINIELA MASTER PRO
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide">
            Modelos de Predicción e Inteligencia Estadística
          </p>
        </div>

        {/* Loading / Progress Indicator */}
        <div className="w-48 space-y-2 pt-2">
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full animate-[pulse_1.5s_ease-in-out_infinite]" style={{ width: '100%' }} />
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Iniciando pronósticos de hoy...</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-1 opacity-70 pb-2">
        <p className="text-[10px] tracking-wider text-slate-500">
          CIUDAD • PROVINCIA • SANTA FE • CÓRDOBA
        </p>
        <p className="text-[9px] text-slate-600">
          Toca la pantalla para continuar
        </p>
      </div>
    </div>
  );
}
