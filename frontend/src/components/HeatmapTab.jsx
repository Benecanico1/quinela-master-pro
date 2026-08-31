import React, { useState } from 'react';
import { Flame, Snowflake, Info } from 'lucide-react';

export default function HeatmapTab({ frequencies, loading }) {
  const [selectedNum, setSelectedNum] = useState(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        <span className="ml-3 text-lg text-slate-300 font-medium">Calculando frecuencias térmicas de los 100 números...</span>
      </div>
    );
  }

  if (!frequencies || !frequencies.all_numbers) {
    return <div className="text-center py-10 text-slate-400">No hay datos de frecuencia disponibles</div>;
  }

  const nums = frequencies.all_numbers;
  const maxFreq = Math.max(...nums.map(n => n.frequency), 1);
  const minFreq = Math.min(...nums.map(n => n.frequency));
  const expFreq = frequencies.expected_frequency_per_num;

  const getColorClass = (freq) => {
    const ratio = (freq - minFreq) / (maxFreq - minFreq || 1);
    if (ratio >= 0.8) return 'bg-rose-600 hover:bg-rose-500 text-white';
    if (ratio >= 0.6) return 'bg-amber-600 hover:bg-amber-500 text-white';
    if (ratio >= 0.4) return 'bg-emerald-700 hover:bg-emerald-600 text-slate-100';
    if (ratio >= 0.2) return 'bg-sky-800 hover:bg-sky-700 text-slate-200';
    return 'bg-slate-800 hover:bg-slate-700 text-slate-400';
  };

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 uppercase font-semibold">Sorteos Evaluados</div>
            <div className="text-3xl font-black text-white mt-1">{frequencies.total_draws}</div>
            <div className="text-xs text-slate-400 mt-1">Frecuencia media esperada: <strong className="text-slate-200">{expFreq}</strong> salidas</div>
          </div>
          <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Info className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-400 uppercase font-semibold">Top Calientes (Hot)</div>
            <div className="text-2xl font-black text-rose-400 mt-1 flex gap-2">
              {frequencies.rankings.hot_numbers.slice(0, 3).map(h => (
                <span key={h.number} className="bg-rose-950/80 border border-rose-700/50 px-2 py-0.5 rounded-lg">{h.number}</span>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-1">Mayor desviación positiva de salidas</div>
          </div>
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
            <Flame className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-sky-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div>
            <div className="text-xs text-sky-400 uppercase font-semibold">Top Fríos (Cold)</div>
            <div className="text-2xl font-black text-sky-400 mt-1 flex gap-2">
              {frequencies.rankings.cold_numbers.slice(0, 3).map(c => (
                <span key={c.number} className="bg-sky-950/80 border border-sky-700/50 px-2 py-0.5 rounded-lg">{c.number}</span>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-1">Menor cantidad de apariciones</div>
          </div>
          <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl">
            <Snowflake className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Heatmap Grid (00 to 99) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" /> Mapa Térmico de los 100 Ambos (00 - 99)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Haz clic en cualquier número para ver su ficha técnica completa, z-score y significados.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-slate-400">Escala:</span>
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">Frío</span>
            <span className="px-2 py-1 rounded bg-sky-800 text-sky-200">Bajo</span>
            <span className="px-2 py-1 rounded bg-emerald-700 text-emerald-100">Medio</span>
            <span className="px-2 py-1 rounded bg-amber-600 text-amber-100">Alto</span>
            <span className="px-2 py-1 rounded bg-rose-600 text-rose-100">Caliente ??</span>
          </div>
        </div>

        {/* 10x10 Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {nums.map((item) => (
            <button
              key={item.number}
              onClick={() => setSelectedNum(item)}
              className={`p-3 rounded-xl transition-all duration-200 flex flex-col items-center justify-center cursor-pointer shadow ${getColorClass(item.frequency)} ${selectedNum?.number === item.number ? 'ring-4 ring-amber-400 scale-105 z-10' : ''}`}
            >
              <span className="text-lg font-black tracking-tight">{item.number}</span>
              <span className="text-[10px] font-bold opacity-85 mt-0.5">{item.frequency}x</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Number Details Modal/Card */}
      {selectedNum && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black text-amber-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                {selectedNum.number}
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">
                  Número {selectedNum.number} - "{selectedNum.significado}"
                </h4>
                <div className="text-xs text-slate-400 mt-0.5">
                  Estado: <strong className="text-amber-400 uppercase">{selectedNum.status}</strong>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedNum(null)}
              className="text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Total Apariciones</div>
              <div className="text-2xl font-black text-white mt-1">{selectedNum.frequency}</div>
              <div className="text-[11px] text-slate-500">{selectedNum.percentage}% de los sorteos</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Atraso Actual</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{selectedNum.current_delay}</div>
              <div className="text-[11px] text-slate-500">sorteos sin salir</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Atraso Medio</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{selectedNum.avg_delay}</div>
              <div className="text-[11px] text-slate-500">Máx histórico: {selectedNum.max_delay}</div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="text-xs text-slate-400">Z-Score (Desvío)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{selectedNum.z_score}</div>
              <div className="text-[11px] text-slate-500">Ratio Atraso: {selectedNum.delay_ratio}x</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
