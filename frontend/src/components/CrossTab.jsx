import React from 'react';
import { ArrowLeftRight, Repeat, Sparkles } from 'lucide-react';

export default function CrossTab({ crossData, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-lg text-slate-300 font-medium">Buscando resonancias cruzadas Ciudad vs Provincia...</span>
      </div>
    );
  }

  if (!crossData) {
    return <div className="text-center py-10 text-slate-400">No hay datos de análisis cruzado disponibles</div>;
  }

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-cyan-400" /> Correlación Cruzada: Ciudad vs Provincia de Buenos Aires
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Estudio de los patrones de repetición en el mismo día entre ambas jurisdicciones y detección de <strong>"Ambos Saltarines"</strong> (números que aparecen en el tablero secundario de los 20 y saltan a la cabeza en turnos posteriores).
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-slate-400">Coincidencias en Cabeza (Mismo Día)</div>
            <div className="text-3xl font-black text-cyan-400 mt-1">{crossData.same_day_head_coincidences}</div>
            <div className="text-xs text-slate-400 mt-1">Ambos que salieron 1° en Ciudad y Provincia el mismo día</div>
          </div>
          <div className="p-4 bg-cyan-500/20 text-cyan-400 rounded-2xl">
            <Repeat className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs uppercase font-bold text-slate-400">Saltos de Pizarra a la Cabeza</div>
            <div className="text-3xl font-black text-amber-400 mt-1">{crossData.board_to_head_jumps_count}</div>
            <div className="text-xs text-slate-400 mt-1">Aparición en los 20 y posterior salida a la cabeza</div>
          </div>
          <div className="p-4 bg-amber-500/20 text-amber-400 rounded-2xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Board to Head Jumps List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h4 className="text-lg font-bold text-white mb-4">Registro Reciente de Ambos con Salto a la Cabeza</h4>
        <div className="space-y-3">
          {crossData.recent_jumps.map((jump, idx) => (
            <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {jump.number}
                </span>
                <div>
                  <div className="text-sm font-bold text-white">{jump.note}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{jump.date}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
