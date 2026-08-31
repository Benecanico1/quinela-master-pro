import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Magnet, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { getClientSympathetic } from '../services/clientEngine';

export default function SympatheticTab() {
  const [selectedNum, setSelectedNum] = useState('14');
  const [data, setData] = useState(() => getClientSympathetic('14'));
  const [loading, setLoading] = useState(false);

  const fetchSympathy = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/sympathetic?number=${selectedNum}`);
      setData(res.data);
    } catch (err) {
      setData(getClientSympathetic(selectedNum));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSympathy();
  }, [selectedNum]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase border border-amber-500/30">
            <Magnet className="w-3.5 h-3.5 inline mr-1" /> Tradición Quinielera & Atracciones
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          Números Simpáticos, Inversos y Espejos
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          En la experiencia de agencia argentina, cuando sale un ambo determinado, este <strong>atrae</strong> a sus parejas simpáticas tradicionales y activa sus versiones <strong>Inversas (XY &harr; YX)</strong> y <strong>Espejo (100 - N)</strong>.
        </p>
      </div>

      {/* Number Selector Input */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-300 block mb-1">Selecciona o escribe el número base:</span>
          <div className="flex items-center gap-3">
            <input
              type="text"
              maxLength={2}
              value={selectedNum}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setSelectedNum(val);
              }}
              placeholder="14"
              className="w-20 bg-slate-950 border border-amber-500/60 text-amber-400 text-3xl font-black text-center rounded-xl p-2 focus:outline-none focus:border-amber-400"
            />
            {data && (
              <span className="text-base font-bold text-white">
                "{data.base_significado}"
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['14', '32', '48', '08', '06', '13', '20', '47', '88', '24'].map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNum(n)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedNum === n ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Relational Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inverso */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg text-center">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">Número Inverso (XY &harr; YX)</span>
            <div className="text-5xl font-black text-white mt-3">{data.inverso.number}</div>
            <div className="text-xs font-bold text-slate-300 mt-1">"{data.inverso.significado}"</div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-500">Score Actual:</span>
              <strong className="text-emerald-400 font-bold">{data.inverso.composite_score} pts</strong>
            </div>
          </div>

          {/* Complementario 100 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg text-center">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Espejo Base 100 (100 - N)</span>
            <div className="text-5xl font-black text-white mt-3">{data.complementario_100.number}</div>
            <div className="text-xs font-bold text-slate-300 mt-1">"{data.complementario_100.significado}"</div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-500">Score Actual:</span>
              <strong className="text-emerald-400 font-bold">{data.complementario_100.composite_score} pts</strong>
            </div>
          </div>

          {/* Espejo 99 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg text-center">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wide">Espejo Base 99 (99 - N)</span>
            <div className="text-5xl font-black text-white mt-3">{data.espejo_99.number}</div>
            <div className="text-xs font-bold text-slate-300 mt-1">"{data.espejo_99.significado}"</div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-500">Score Actual:</span>
              <strong className="text-emerald-400 font-bold">{data.espejo_99.composite_score} pts</strong>
            </div>
          </div>
        </div>
      )}

      {/* Attracted Numbers */}
      {data && data.attracted_numbers && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Magnet className="w-5 h-5 text-amber-400" /> Ambos Atraídos Históricamente por el {data.base_ambo} ("{data.base_significado}")
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.attracted_numbers.map((att, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                    {att.number}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-white">"{att.significado}"</div>
                    <div className="text-xs text-slate-500">Atraso: {att.current_delay} sorteos</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500">Score</span>
                  <div className="text-sm font-black text-emerald-400">{att.composite_score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
