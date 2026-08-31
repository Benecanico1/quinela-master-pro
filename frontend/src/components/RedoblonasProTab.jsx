import React, { useState } from 'react';
import { Layers, Zap, Plus, Trash2 } from 'lucide-react';

export default function RedoblonasProTab({ predictions }) {
  const [amboA, setAmboA] = useState('28');
  const [posA, setPosA] = useState('1');
  const [amboB, setAmboB] = useState('64');
  const [posB, setPosB] = useState('10');
  const [amount, setAmount] = useState(500);

  const [candadoNums, setCandadoNums] = useState(['28', '64', '14']);
  const [candadoAmount, setCandadoAmount] = useState(200);

  const getRedoblonaMultiplier = (pA, pB) => {
    const p1 = parseInt(pA);
    const p2 = parseInt(pB);
    if (p1 === 1) {
      if (p2 === 5) return 700.0;
      if (p2 === 10) return 350.0;
      if (p2 === 20) return 175.0;
    } else if (p1 === 5) {
      if (p2 === 5) return 140.0;
      if (p2 === 10) return 70.0;
      if (p2 === 20) return 35.0;
    } else if (p1 === 10) {
      if (p2 === 10) return 35.0;
      if (p2 === 20) return 17.5;
    }
    return 15.0;
  };

  const mult = getRedoblonaMultiplier(posA, posB);
  const potentialPrize = amount * mult;

  const generateCandadoPairs = () => {
    const pairs = [];
    for (let i = 0; i < candadoNums.length; i++) {
      for (let j = i + 1; j < candadoNums.length; j++) {
        pairs.push({ a: candadoNums[i], b: candadoNums[j] });
      }
    }
    return pairs;
  };

  const candadoPairs = generateCandadoPairs();
  const totalCandadoCost = candadoPairs.length * candadoAmount;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase mb-1 border border-indigo-500/30">
              <Layers className="w-3 h-3" /> La Jugada Reina
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Redoblonas y Candados
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Multiplicadores oficiales hasta 700x y sistemas de cobertura múltiple.
            </p>
          </div>

          <div className="bg-slate-950 p-2.5 sm:p-3 rounded-xl border border-slate-800 text-right shrink-0">
            <span className="text-[10px] text-slate-400 block">Factor de Pago</span>
            <strong className="text-lg sm:text-2xl font-black text-indigo-400">{mult}x</strong>
          </div>
        </div>
      </div>

      {/* Touch-Friendly Redoblona Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Simple Pair Calculator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Calculadora de Redoblona
          </h3>

          {/* Ambo 1 */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">1° Ambo</span>
              <input
                type="text"
                maxLength={2}
                value={amboA}
                onChange={(e) => setAmboA(e.target.value.padStart(2, '0'))}
                className="w-16 bg-slate-900 border border-amber-500/60 text-amber-400 text-2xl font-black text-center rounded-lg p-1 mt-1"
              />
            </div>
            <div className="flex-1 text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Ubicación</span>
              <select
                value={posA}
                onChange={(e) => setPosA(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="1">Al 1° (Cabeza)</option>
                <option value="5">A los 5</option>
                <option value="10">A los 10</option>
              </select>
            </div>
          </div>

          {/* Ambo 2 */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">2° Ambo</span>
              <input
                type="text"
                maxLength={2}
                value={amboB}
                onChange={(e) => setAmboB(e.target.value.padStart(2, '0'))}
                className="w-16 bg-slate-900 border border-amber-500/60 text-amber-400 text-2xl font-black text-center rounded-lg p-1 mt-1"
              />
            </div>
            <div className="flex-1 text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">Ubicación</span>
              <select
                value={posB}
                onChange={(e) => setPosB(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                <option value="5">A los 5</option>
                <option value="10">A los 10</option>
                <option value="20">A los 20</option>
              </select>
            </div>
          </div>

          {/* Amount input & result */}
          <div className="pt-2 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-slate-400 block">Monto a Jugar ($)</span>
              <input
                type="number"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-28 bg-slate-950 border border-slate-700 text-white font-black text-sm rounded-lg px-2.5 py-1.5 mt-1"
              />
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Premio a Cobrar</span>
              <strong className="text-xl font-black text-emerald-400">${potentialPrize.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Candado System Generator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Sistema Candado
            </h3>
            <span className="text-[10px] text-slate-400">{candadoPairs.length} pares combinados</span>
          </div>

          {/* Numbers list */}
          <div className="flex items-center gap-2 flex-wrap">
            {candadoNums.map((num, i) => (
              <input
                key={i}
                type="text"
                maxLength={2}
                value={num}
                onChange={(e) => {
                  const copy = [...candadoNums];
                  copy[i] = e.target.value;
                  setCandadoNums(copy);
                }}
                className="w-14 bg-slate-950 border border-indigo-500/60 text-amber-400 text-xl font-black text-center rounded-xl p-1.5"
              />
            ))}
            {candadoNums.length < 4 && (
              <button
                onClick={() => setCandadoNums([...candadoNums, '17'])}
                className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                + 4to
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            {candadoPairs.map((p, idx) => (
              <div key={idx} className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-xs font-black text-white">{p.a}</span>
                <span className="text-[10px] text-slate-500 mx-1">y</span>
                <span className="text-xs font-black text-white">{p.b}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Costo total ($ {candadoAmount} c/u):</span>
            <strong className="text-sm font-black text-amber-400">${totalCandadoCost.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
