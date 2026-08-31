import React from 'react';
import { GitCommit, Compass } from 'lucide-react';

export default function MarkovTab({ markov, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-lg text-slate-300 font-medium">Calculando matriz de transición de Markov P(S_{t+1}|S_t)...</span>
      </div>
    );
  }

  if (!markov || !markov.next_ending_probabilities) {
    return <div className="text-center py-10 text-slate-400">No hay datos de Markov disponibles</div>;
  }

  return (
    <div className="space-y-8">
      {/* Current State Info Banner */}
      <div className="bg-gradient-to-r from-indigo-950/50 via-slate-900 to-purple-950/50 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Estado Actual (Último Resultado a la Cabeza)</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="text-4xl font-black text-amber-400 bg-slate-950 px-4 py-1.5 rounded-xl border border-slate-800">
                {markov.last_draw_head}
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Sorteo {markov.last_draw_info?.date} - Turno {markov.last_draw_info?.shift} ({markov.last_draw_info?.lottery})
                </div>
                <div className="text-xs text-slate-400">
                  Decena: {markov.last_draw_head[0]}0s | Terminación: {markov.last_draw_head[1]}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-xl text-right">
            <div className="text-xs text-slate-400">Modelo</div>
            <div className="text-sm font-extrabold text-indigo-300">Cadena de Markov de 1° Orden</div>
          </div>
        </div>
      </div>

      {/* Probabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Ending Probabilities */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-400" /> Probabilidad de Siguiente Terminación (0 - 9)
          </h3>
          <div className="space-y-3">
            {markov.next_ending_probabilities.map((item, idx) => (
              <div key={item.digit} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{item.ending}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-400">{(item.probability * 100).toFixed(1)}%</span>
                  <div className="text-[11px] text-slate-500">{item.count} transiciones históricas</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Decade Probabilities */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-purple-400" /> Probabilidad de Siguiente Decena (00s - 90s)
          </h3>
          <div className="space-y-3">
            {markov.next_decade_probabilities.map((item, idx) => (
              <div key={item.digit} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">{item.decade}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-purple-400">{(item.probability * 100).toFixed(1)}%</span>
                  <div className="text-[11px] text-slate-500">{item.count} transiciones históricas</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
