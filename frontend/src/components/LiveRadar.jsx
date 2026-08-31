import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { getCurrentActiveShift } from '../services/clientEngine';

export default function LiveRadar({ onShiftChange }) {
  const [shiftInfo, setShiftInfo] = useState(() => getCurrentActiveShift());
  const [isRotating, setIsRotating] = useState(false);
  const previousShiftId = useRef(shiftInfo.id);

  useEffect(() => {
    const updateCountdown = () => {
      const current = getCurrentActiveShift();
      setShiftInfo(current);

      if (current.id !== previousShiftId.current) {
        previousShiftId.current = current.id;
        setIsRotating(true);
        if (onShiftChange) {
          onShiftChange(current.id);
        }
        setTimeout(() => setIsRotating(false), 3000);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [onShiftChange]);

  return (
    <div className={`border rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg transition-all duration-500 ${
      isRotating 
        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40' 
        : 'bg-slate-900/90 border-amber-500/30'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${isRotating ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-ping'}`}></div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-300 font-semibold">
            {isRotating ? (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> ¡Sorteo cerrado! Recalculando pronósticos para {shiftInfo.name}...
              </span>
            ) : (
              <>
                Próximo Sorteo Activo: <strong className="text-white uppercase">{shiftInfo.name} ({shiftInfo.timeStr} hs)</strong>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs font-mono font-black text-amber-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 shadow">
          <span>⏳ Cierra en:</span>
          <span className="text-white">{shiftInfo.formattedTimeLeft}</span>
        </div>
        <span className="hidden md:inline text-xs text-slate-400 italic">
          💡 {shiftInfo.tip}
        </span>
      </div>
    </div>
  );
}
