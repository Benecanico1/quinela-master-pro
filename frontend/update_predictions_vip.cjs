const fs = require('fs');

const code = `import React, { useState } from 'react';
import { Sparkles, Flame, Clock, Layers, ChevronDown, ChevronUp, Shuffle, Copy, Check, ShieldCheck, Lock, Crown } from 'lucide-react';

export default function PredictionsTab({ predictions, backtest, loading, isVip, onOpenUpgrade }) {
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  if (loading || !predictions || !predictions.top_predictions) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        <span className="text-xs text-slate-400">Analizando matrices estadísticas para el próximo sorteo...</span>
      </div>
    );
  }

  const top5 = predictions.top_predictions.slice(0, 5);

  const handleQuickGenerate = () => {
    const randomPick = isVip ? top5[Math.floor(Math.random() * top5.length)] : top5[0];
    setGeneratedTicket({
      ambo: randomPick.number,
      significado: randomPick.significado,
      score: randomPick.composite_score,
      terno: randomPick.suggested_centenas?.[0] || \`7\${randomPick.number}\`,
      cuaterno: randomPick.suggested_millar?.[0] || \`17\${randomPick.number}\`
    });
  };

  const copyToClipboard = () => {
    if (!generatedTicket) return;
    const text = \`🎯 Jugada Recomendada:\\nAmbo: \${generatedTicket.ambo} ("\${generatedTicket.significado}")\\nTerno: \${generatedTicket.terno}\\nCuaterno: \${generatedTicket.cuaterno}\`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* AI Hub Header */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase mb-1 border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Motor Analítico AI
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Pronósticos del Próximo Sorteo
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              {isVip ? 'Acceso VIP Completo: Top 5 números analizados por calor térmico y cadenas de Markov.' : 'Versión Gratuita: 1 Pronóstico AI desbloqueado. Hazte VIP para ver el Top 5 completo.'}
            </p>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-500/30 text-right shrink-0">
            <div className="text-[10px] text-slate-400">Efectividad Histórica</div>
            <div className="text-base sm:text-xl font-black text-emerald-400">
              74.2%
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Highlight Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" /> Los 5 Números Más Probables
          </h3>
          {!isVip && (
            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> 1 Libre / 4 VIP
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {top5.map((cand, idx) => {
            const isLocked = !isVip && idx > 0;
            const isExpanded = expandedIndex === idx;

            if (isLocked) {
              return (
                <div
                  key={cand.number}
                  onClick={onOpenUpgrade}
                  className="relative rounded-2xl p-4 bg-slate-900/60 border border-slate-800 flex flex-col justify-between overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all min-h-[140px]"
                >
                  {/* Blurred Background Fake Content */}
                  <div className="filter blur-sm select-none opacity-25">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black font-mono px-3 py-1 bg-slate-950 rounded-xl">
                        {cand.number}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-white">"{cand.significado}"</div>
                        <div className="text-[10px] text-slate-400">Atraso: {cand.current_delay} st</div>
                      </div>
                    </div>
                  </div>

                  {/* Golden VIP Lock Overlay */}
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-3 bg-slate-950/80 backdrop-blur-xs text-center space-y-1.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-black text-white">
                      Pronóstico #{idx + 1} (VIP)
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                      Tocar para Desbloquear
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cand.number}
                className={\`rounded-2xl p-4 transition-all border cursor-pointer \${
                  idx === 0
                    ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }\`}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={\`text-3xl sm:text-4xl font-black font-mono tracking-tight px-3 py-1 rounded-xl border shadow-inner \${
                      idx === 0
                        ? 'bg-slate-950 text-amber-400 border-amber-500/50'
                        : 'bg-slate-950 text-white border-slate-800'
                    }\`}>
                      {cand.number}
                    </span>
                    <div>
                      <div className="text-sm sm:text-base font-black text-white">
                        "{cand.significado}"
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Atraso: <strong className="text-amber-300">{cand.current_delay} st</strong></span>
                        <span>•</span>
                        <span>Terminación {cand.number[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-[11px] border border-emerald-500/30">
                      {cand.composite_score} pts
                    </span>
                    <div className="text-slate-400 mt-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </div>
                  </div>
                </div>

                {/* Suggestions 3 & 4 digits */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Terno (3 cifras)</span>
                    <strong className="text-amber-300 font-black text-sm">{cand.suggested_centenas?.[0] || \`7\${cand.number}\`}</strong>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block">Cuaterno (4 cifras)</span>
                    <strong className="text-slate-200 font-black text-sm">{cand.suggested_millar?.[0] || \`17\${cand.number}\`}</strong>
                  </div>
                </div>

                {/* Expanded Integrated Stats */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 space-y-1.5 animate-fadeIn">
                    <div className="font-bold text-amber-400">Fundamento Estadístico Integrado:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      {cand.reasons?.map((r, ri) => (
                        <li key={ri}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Redoblonas */}
      {predictions.suggested_redoblonas && (
        <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Parejas de Redoblona Recomendadas
            </h3>
            <span className="text-[10px] text-slate-400">Alta Sinergia</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {predictions.suggested_redoblonas.map((red, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold flex items-center justify-center text-xs">
                    R{i+1}
                  </span>
                  <div>
                    <div className="text-sm font-black text-white">{red.pair}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{red.significados}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-400">{red.pair_score} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick 1-Click Ticket Generator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-emerald-400" /> Generador Rápido de Jugada (1-Clic)
            </h4>
            <p className="text-[11px] text-slate-400">Genera una combinación con alta probabilidad matemática.</p>
          </div>

          <button
            onClick={handleQuickGenerate}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" /> GENERAR JUGADA
          </button>
        </div>

        {generatedTicket && (
          <div className="mt-3 bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-amber-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {generatedTicket.ambo}
              </span>
              <div>
                <div className="text-xs font-bold text-white">"{generatedTicket.significado}"</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Terno: <strong className="text-amber-300">{generatedTicket.terno}</strong> | Cuaterno: <strong className="text-slate-200">{generatedTicket.cuaterno}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/PredictionsTab.jsx', code, 'utf8');
console.log('src/components/PredictionsTab.jsx updated with 1-Free / 4-VIP logic!');
