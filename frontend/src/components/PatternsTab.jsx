import React from 'react';
import { PieChart, Activity, BarChart2, Hash, Percent } from 'lucide-react';

export default function PatternsTab({ patterns, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-lg text-slate-300 font-medium">Calculando distribuciones de paridad, sumas y decenas...</span>
      </div>
    );
  }

  if (!patterns || !patterns.parity) {
    return <div className="text-center py-10 text-slate-400">No hay datos de patrones disponibles</div>;
  }

  return (
    <div className="space-y-8">
      {/* Parity and High/Low Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parity */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" /> Distribución de Paridad (Par / Impar)
          </h3>
          <div className="space-y-3">
            {patterns.parity.map((p, idx) => (
              <div key={idx} className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-slate-200">{p.pattern}</span>
                  <span className="text-purple-400 font-bold">{p.percentage}% <span className="text-slate-500 font-normal">({p.count} veces)</span></span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${p.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High / Low */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Distribución Bajos vs Altos (00-49 vs 50-99)
          </h3>
          <div className="space-y-4">
            {patterns.high_low.map((hl, idx) => (
              <div key={idx} className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-slate-200">{hl.category}</span>
                  <span className="text-cyan-400 font-bold">{hl.percentage}% <span className="text-slate-500 font-normal">({hl.count} salidas)</span></span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${hl.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="text-xs text-slate-400 italic bg-slate-950/40 p-3 rounded-lg border border-slate-800">
              ?? La teoría probabilística predice exactamente un 50% para cada rango. Desvíos significativos indican inercia temporal para contra-apuestas de reversión a la media.
            </div>
          </div>
        </div>
      </div>

      {/* Decades and Endings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Decades */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Hash className="w-5 h-5 text-amber-400" /> Frecuencia por Decena (00s - 90s)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {patterns.decades.map((dec) => (
              <div key={dec.decade} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
                <div className="text-xs font-bold text-slate-400">{dec.decade}</div>
                <div className="text-xl font-black text-amber-400 mt-1">{dec.count}</div>
                <div className="text-[11px] text-slate-500">{dec.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Endings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-400" /> Frecuencia por Terminación (0 - 9)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {patterns.endings.map((end) => (
              <div key={end.digit} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
                <div className="text-xs font-bold text-slate-400">Termina en {end.digit}</div>
                <div className="text-xl font-black text-emerald-400 mt-1">{end.count}</div>
                <div className="text-[11px] text-slate-500">{end.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sum of Digits Gaussian Bell Curve */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-400" /> Curva Gaussiana: Suma de los 2 Dígitos (0 a 18)
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Las sumas más probables por combinatoria son del <strong>7 al 11</strong> (representando más del 50% de las combinaciones posibles).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-6 lg:grid-cols-10 gap-2">
          {patterns.sums.map((s) => (
            <div key={s.sum} className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl text-center">
              <div className="text-xs font-bold text-indigo-400">Suma {s.sum}</div>
              <div className="text-lg font-black text-white mt-1">{s.observed}</div>
              <div className="text-[10px] text-slate-400">Obs: {s.percentage}%</div>
              <div className="text-[10px] text-slate-500">Teo: {s.theoretical_pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
