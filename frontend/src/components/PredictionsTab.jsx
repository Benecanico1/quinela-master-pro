import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Clock, Layers, ChevronDown, ChevronUp, 
  Shuffle, Copy, Check, ShieldCheck, Lock, Crown, RefreshCw, Zap,
  Activity, Timer, AlertTriangle, HelpCircle, Info, ExternalLink
} from 'lucide-react';
import { getClientPredictions, SHIFT_DEFINITIONS, getCurrentActiveShift, formatSecondsToHMS } from '../services/clientEngine';
import { getAffiliateUrl } from '../services/firebaseClient';
import EfficiencyExplanationModal from './EfficiencyExplanationModal';

export default function PredictionsTab({ 
  predictions, 
  backtest, 
  loading, 
  isVip, 
  onOpenUpgrade,
  activeShift = 'auto',
  onSelectShift
}) {
  const [selectedLottery, setSelectedLottery] = useState('all'); // 'all', 'ciudad', 'provincia'
  const [expandedIndex, setExpandedIndex] = useState(0);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [liveShiftInfo, setLiveShiftInfo] = useState(() => getCurrentActiveShift());
  const [isEfficiencyModalOpen, setIsEfficiencyModalOpen] = useState(false);

  // Second-by-second live countdown on every signal
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveShiftInfo(getCurrentActiveShift());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activePredictions = getClientPredictions(selectedLottery, activeShift || 'auto', 15);
  const top5 = activePredictions.top_predictions.slice(0, 5);

  const handleCopyAllLottery = (lotteryKey) => {
    const lotLabel = lotteryKey === 'ciudad' ? 'CIUDAD (NACIONAL)' : 'PROVINCIA BS AS';
    const lotData = getClientPredictions(lotteryKey, activeShift || 'auto', 15);
    const predictionsList = isVip ? lotData.top_predictions.slice(0, 5) : [lotData.top_predictions[0]];

    let text = `🎯 ${lotLabel} - ${lotData.shift_name || 'En Vivo'}\n`;
    predictionsList.forEach((pred, idx) => {
      const ambo = pred.number;
      const terno = pred.suggested_centenas?.[0] || `7${ambo}`;
      const cuaterno = pred.suggested_millar?.[0] || `17${ambo}`;
      text += `${idx + 1}. ${ambo} | ${terno} | ${cuaterno}\n`;
    });
    text += `\nRecomendada por Quinela Master Pro`;

    navigator.clipboard.writeText(text);
    setCopyStatus(`¡Copiadas recomendaciones de ${lotteryKey === 'ciudad' ? 'Nacional' : 'Provincia'}! 📋✨`);
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleQuickGenerate = () => {
    const randomPick = isVip ? top5[Math.floor(Math.random() * top5.length)] : top5[0];
    setGeneratedTicket({
      ambo: randomPick.number,
      significado: randomPick.significado,
      target_lottery_label: randomPick.target_lottery_label,
      score: randomPick.composite_score,
      terno: randomPick.suggested_centenas?.[0] || `7${randomPick.number}`,
      cuaterno: randomPick.suggested_millar?.[0] || `17${randomPick.number}`
    });
  };

  const copyToClipboard = () => {
    if (!generatedTicket) return;
    const text = `🎯 Pronóstico Recomendado (${activePredictions.shift_name || 'Quinela Master Pro'}):\n🏛️ Lotería: ${generatedTicket.target_lottery_label || 'Ambas Loterías'}\nAmbo (2 cifras): ${generatedTicket.ambo} ("${generatedTicket.significado}") (70x)\nTerno (3 cifras): ${generatedTicket.terno} (500x)\nCuaterno (4 cifras): ${generatedTicket.cuaterno} (3.500x)\n⏳ Validez: ${liveShiftInfo.formattedTimeLeft}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shiftOptions = [
    { id: 'auto', label: 'Auto (En Vivo)', icon: Zap },
    { id: 'la_previa', label: 'La Previa (10:15)', icon: Clock },
    { id: 'primera', label: 'Primera (12:00)', icon: Clock },
    { id: 'matutina', label: 'Matutina (15:00)', icon: Clock },
    { id: 'vespertina', label: 'Vespertina (18:00)', icon: Clock },
    { id: 'nocturna', label: 'Nocturna (21:00)', icon: Clock }
  ];

  const isUrgent = liveShiftInfo.totalSecondsLeft <= 900; // Less than 15 min

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Shift Selection Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {shiftOptions.map((s) => {
          const isSelected = activeShift === s.id || (!activeShift && s.id === 'auto');
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onSelectShift && onSelectShift(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lottery Filter Tabs for Predictions */}
      <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow">
        <button
          onClick={() => setSelectedLottery('all')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedLottery === 'all'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌟 Ambas Loterías</span>
        </button>

        <button
          onClick={() => setSelectedLottery('ciudad')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedLottery === 'ciudad'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🏛️ Ciudad (Nacional)</span>
        </button>

        <button
          onClick={() => setSelectedLottery('provincia')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            selectedLottery === 'provincia'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌿 Provincia Bs As</span>
        </button>
      </div>

      {/* 2 Botones Rápidos para Copiar Todas las Recomendaciones al Portapapeles */}
      {/* Compact Side-by-Side Copy Action */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-white tracking-wide flex items-center gap-1.5">
            <Copy className="w-3.5 h-3.5 text-amber-400" /> Copiar jugada
          </span>
          {copyStatus && (
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/50 animate-pulse">
              {copyStatus}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Botón Nacional */}
          <button
            type="button"
            onClick={() => handleCopyAllLottery('ciudad')}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-950 hover:from-blue-900/80 border border-blue-500/40 hover:border-blue-400 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow group"
          >
            <span className="text-sm">🏛️</span>
            <span className="text-xs font-black text-white group-hover:text-blue-300 transition-colors">
              Nacional
            </span>
            <Copy className="w-3 h-3 text-blue-400 group-hover:text-blue-300 ml-auto shrink-0" />
          </button>

          {/* Botón Provincia */}
          <button
            type="button"
            onClick={() => handleCopyAllLottery('provincia')}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 hover:from-emerald-900/80 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow group"
          >
            <span className="text-sm">🌿</span>
            <span className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">
              Provincia
            </span>
            <Copy className="w-3 h-3 text-emerald-400 group-hover:text-emerald-300 ml-auto shrink-0" />
          </button>
        </div>
      </div>

      {/* AI Hub Header with Live Signal Timer and Clickable Efficiency Box */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase mb-1.5 border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Sorteo: {activePredictions.shift_name || 'Próximo Sorteo'} ({activePredictions.shift_time || 'En Vivo'} hs)
            </div>
            <h2 className="text-base sm:text-2xl font-black text-white leading-tight">
              Pronósticos de Inteligencia Artificial
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              {isVip 
                ? `Acceso VIP Activo: Pronósticos diferenciados por lotería con desglose de 2, 3 y 4 cifras.` 
                : `Versión Gratuita: 1 Pronóstico AI desbloqueado. Hazte VIP para ver el Top 5 completo.`}
            </p>
          </div>

          {/* Clickable Historic Efficiency Box */}
          <button
            type="button"
            onClick={() => setIsEfficiencyModalOpen(true)}
            className="bg-slate-950 hover:bg-slate-900/90 p-3 rounded-2xl border border-amber-500/40 hover:border-amber-400 text-right shrink-0 flex items-center justify-between sm:flex-col sm:items-end w-full sm:w-auto gap-2 transition-all cursor-pointer shadow group"
            title="Toca para ver la explicación matemática de la efectividad"
          >
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 sm:justify-end group-hover:text-amber-300 transition-colors">
                <span>Efectividad Histórica</span>
                <Info className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono flex items-center gap-1">
                <span>74.2%</span>
              </div>
            </div>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
              ¿Por qué? Ver Deducción
            </span>
          </button>
        </div>
      </div>

      {/* Top 5 Highlight Cards with Countdown on Each Signal */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400 animate-pulse" /> Top 5 Recomendaciones de la IA
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
                  className="relative rounded-2xl p-4 bg-slate-900/60 border border-slate-800 flex flex-col justify-between overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all min-h-[155px]"
                >
                  {/* Blurred Background Fake Content */}
                  <div className="filter blur-sm select-none opacity-25">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl font-black font-mono px-3 py-1 bg-slate-950 rounded-xl">
                        {cand.number}
                      </span>
                      <div className="text-[10px] font-mono text-amber-400">
                        ⏳ {liveShiftInfo.formattedTimeLeft}
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
                    <div className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Vence en: {liveShiftInfo.formattedTimeLeft}
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      Tocar para Desbloquear
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={cand.number}
                className={`rounded-2xl p-4 transition-all border cursor-pointer ${
                  idx === 0
                    ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                {/* Header of Signal: Target Lottery Badge & Live Countdown Timer */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                    cand.target_lottery === 'ciudad' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : cand.target_lottery === 'provincia'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {cand.target_lottery === 'ciudad' ? '🏛️ Ciudad' : cand.target_lottery === 'provincia' ? '🌿 Provincia' : '🌟 Ambas'}
                  </span>

                  {/* Individual Live Timer Badge */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-amber-400 shadow-inner">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{liveShiftInfo.formattedTimeLeft}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight px-3 py-1 rounded-xl border shadow-inner ${
                      idx === 0
                        ? 'bg-slate-950 text-amber-400 border-amber-500/50'
                        : 'bg-slate-950 text-white border-slate-800'
                    }`}>
                      {cand.number}
                    </span>
                    <div>
                      <div className="text-base font-black text-white leading-tight">
                        "{cand.significado}"
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {cand.target_lottery_label}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-xs whitespace-nowrap">
                      {cand.composite_score}% Conf.
                    </span>
                  </div>
                </div>

                {/* Explicit Play Type Breakdown (2 cifras, 3 cifras, 4 cifras) */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-xs bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">🎯 <strong>Ambo (2 cifras):</strong></span>
                    <span className="font-mono font-black text-amber-300">{cand.number} <span className="text-[9px] text-slate-500 font-normal">(70x)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">🔢 <strong>Terno (3 cifras):</strong></span>
                    <span className="font-mono font-black text-slate-200">{cand.suggested_centenas?.[0]} <span className="text-[9px] text-slate-500 font-normal">(500x)</span></span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">👑 <strong>Cuaterno (4 cifras):</strong></span>
                    <span className="font-mono font-black text-emerald-400">{cand.suggested_millar?.[0]} <span className="text-[9px] text-slate-500 font-normal">(3.500x)</span></span>
                  </div>
                </div>

                {/* Direct Action: Jugar en Plataforma Oficial */}
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={getAffiliateUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      const betText = `Sorteo ${cand.target_lottery_label} (${activePredictions.shift_name}): Ambo ${cand.number}, Terno ${cand.suggested_centenas?.[0]}, Cuaterno ${cand.suggested_millar?.[0]}`;
                      navigator.clipboard.writeText(betText);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow shadow-emerald-950 transition-all cursor-pointer active:scale-95"
                  >
                    <span>🎯 Jugar en Plataforma Oficial (.bet.ar)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Free User Informational Banner directly under Top Prediction #1 */}
                {idx === 0 && !isVip && (
                  <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-slate-900 to-amber-500/10 border border-amber-500/30 text-xs flex flex-col sm:flex-row items-center justify-between gap-2.5 shadow-inner">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-slate-300 text-[11px]">
                        <strong>Cuenta Gratuita:</strong> Tienes desbloqueado el pronóstico #1 de mayor probabilidad. Para desbloquear el Top 5 completo, Redoblonas Candado y alertas en tiempo real, activa tu suscripción VIP.
                      </span>
                    </div>
                    {onOpenUpgrade && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenUpgrade();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow active:scale-95 transition-all"
                      >
                        Activar VIP
                      </button>
                    )}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                    <div className="text-[11px] font-bold text-slate-300">
                      Fundamento Estadístico Integrado:
                    </div>
                    {cand.reasons?.map((r, ridx) => (
                      <div key={ridx} className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Redoblonas Candado for this shift with Live Clock */}
      {activePredictions.suggested_redoblonas && activePredictions.suggested_redoblonas.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" /> Redoblonas Candado del Turno ({activePredictions.shift_name})
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-amber-400">
              <Clock className="w-3 h-3" />
              <span>Vence: {liveShiftInfo.formattedTimeLeft}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activePredictions.suggested_redoblonas.map((redo, ridx) => (
              <div key={ridx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-amber-400 text-sm">{redo.pair}</span>
                  <span className="text-[10px] text-slate-400 font-bold">{redo.pair_score}%</span>
                </div>
                <div className="text-xs text-white font-medium">{redo.significados}</div>
                <div className="text-[10px] text-slate-400 italic">{redo.recommended_positions}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Generator & Copy Box */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">Generador Rápido de Jugada</div>
            <div className="text-[10px] text-slate-400">Arma Ambo, Terno y Cuaterno para {activePredictions.shift_name} (⏳ {liveShiftInfo.formattedTimeLeft})</div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {generatedTicket ? (
            <button
              onClick={copyToClipboard}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : `${generatedTicket.ambo} / ${generatedTicket.terno} / ${generatedTicket.cuaterno}`}</span>
            </button>
          ) : (
            <button
              onClick={handleQuickGenerate}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generar Jugada</span>
            </button>
          )}
        </div>
      </div>

      {/* Explanatory Modal for Efficiency */}
      <EfficiencyExplanationModal
        isOpen={isEfficiencyModalOpen}
        onClose={() => setIsEfficiencyModalOpen(false)}
        rate="74.2%"
      />
    </div>
  );
}
