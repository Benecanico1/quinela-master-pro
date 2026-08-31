import React, { useState } from 'react';
import { Sliders, Play, Copy, Check } from 'lucide-react';

export default function GeneratorTab({ predictions }) {
  const [parityFilter, setParityFilter] = useState('any');
  const [rangeFilter, setRangeFilter] = useState('any');
  const [minDelay, setMinDelay] = useState(10);
  const [quantity, setQuantity] = useState(5);
  const [generatedTickets, setGeneratedTickets] = useState([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (!predictions || !predictions.top_predictions) return;

    let pool = [...predictions.top_predictions];

    if (parityFilter === 'par_par') {
      pool = pool.filter(p => parseInt(p.number[0]) % 2 === 0 && parseInt(p.number[1]) % 2 === 0);
    } else if (parityFilter === 'impar_impar') {
      pool = pool.filter(p => parseInt(p.number[0]) % 2 !== 0 && parseInt(p.number[1]) % 2 !== 0);
    } else if (parityFilter === 'mixto') {
      pool = pool.filter(p => (parseInt(p.number[0]) % 2) !== (parseInt(p.number[1]) % 2));
    }

    if (rangeFilter === 'bajos') {
      pool = pool.filter(p => parseInt(p.number) <= 49);
    } else if (rangeFilter === 'altos') {
      pool = pool.filter(p => parseInt(p.number) >= 50);
    }

    pool = pool.filter(p => p.current_delay >= minDelay);

    if (pool.length === 0) {
      pool = [...predictions.top_predictions];
    }

    const selected = pool.slice(0, quantity).map((item, idx) => ({
      id: idx + 1,
      ambo: item.number,
      significado: item.significado,
      score: item.composite_score,
      centena: item.suggested_centenas[0],
      millar: item.suggested_millar[0]
    }));

    setGeneratedTickets(selected);
  };

  const copyToClipboard = () => {
    const text = generatedTickets.map(t => `Ambo: ${t.ambo} ("${t.significado}") | Terno: ${t.centena} | Cuaterno: ${t.millar}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Control Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" /> Generador Inteligente de Jugadas y Boletos
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Personaliza los filtros estadísticos para seleccionar tus números óptimos para 2, 3 y 4 cifras.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Filtro de Paridad</label>
            <select
              value={parityFilter}
              onChange={(e) => setParityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="any">Cualquiera</option>
              <option value="par_par">Solo Par - Par (ej: 24, 88)</option>
              <option value="impar_impar">Solo Impar - Impar (ej: 13, 95)</option>
              <option value="mixto">Mixto (Par-Impar / Impar-Par)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Rango de Cifras</label>
            <select
              value={rangeFilter}
              onChange={(e) => setRangeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="any">Cualquier Rango (00 - 99)</option>
              <option value="bajos">Bajos (00 - 49)</option>
              <option value="altos">Altos (50 - 99)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Atraso Mínimo: {minDelay} sorteos</label>
            <input
              type="range"
              min="0"
              max="50"
              value={minDelay}
              onChange={(e) => setMinDelay(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cantidad de Jugadas</label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value={3}>3 Números</option>
              <option value={5}>5 Números</option>
              <option value={8}>8 Números</option>
              <option value={10}>10 Números</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" /> Generar Jugada Óptima
        </button>
      </div>

      {/* Generated Results */}
      {generatedTickets.length > 0 && (
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-lg font-bold text-white">Boleto de Jugadas Recomendadas</h4>
              <p className="text-xs text-slate-400">Listos para apostar a la cabeza o a los premios</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado al portapapeles' : 'Copiar Jugada'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generatedTickets.map((ticket) => (
              <div key={ticket.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 relative group hover:border-amber-500/50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Opción #{ticket.id}</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
                    {ticket.score} pts
                  </span>
                </div>

                <div className="my-4 text-center">
                  <div className="text-4xl font-black text-amber-400">{ticket.ambo}</div>
                  <div className="text-xs font-semibold text-slate-400 mt-1">"{ticket.significado}"</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Terno (3 cifras)</span>
                    <strong className="text-white text-sm font-mono">{ticket.centena}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cuaterno (4 cifras)</span>
                    <strong className="text-white text-sm font-mono">{ticket.millar}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
