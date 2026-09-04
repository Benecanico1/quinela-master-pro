import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Flame, Clock, Layers, ChevronDown, ChevronUp, 
  Shuffle, Copy, Check, ShieldCheck, Lock, Crown, RefreshCw, Zap,
  Activity, Timer, AlertTriangle, HelpCircle, Info, ExternalLink, Share2,
  Menu, X, Ticket
} from 'lucide-react';
import { getClientPredictions, SHIFT_DEFINITIONS, getCurrentActiveShift, formatSecondsToHMS } from '../services/clientEngine';
import { getAffiliateUrl } from '../services/firebaseClient';
import EfficiencyExplanationModal from './EfficiencyExplanationModal';
import TraceabilityModal from './TraceabilityModal';

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
  const [traceCandidate, setTraceCandidate] = useState(null);
  const [isShiftMenuOpen, setIsShiftMenuOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isExtraLargeFont, setIsExtraLargeFont] = useState(false);

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
      const posTag = idx === 0 
        ? '👑 A LA CABEZA (1° Premio)' 
        : idx === 1 
          ? '🎯 Al 1° y a los 5' 
          : idx < 4 
            ? '💎 A los 5 o a los 10' 
            : '🛡️ A los 10 o a los 20';
      text += `${idx + 1}. ${ambo} ("${pred.significado}") | Terno: ${terno} | Cuat: ${cuaterno}\n   ↳ Sugerencia: ${posTag}\n`;
    });
    text += `\nRecomendada por Quinela Master Pro`;

    navigator.clipboard.writeText(text);
    setCopyStatus(`¡Copiadas recomendaciones de ${lotteryKey === 'ciudad' ? 'Nacional' : 'Provincia'}! 📋✨`);
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleCopyDailySummaryForSocialMedia = () => {
    const ciudadData = getClientPredictions('ciudad', 'todo_el_dia', 4);
    const provData = getClientPredictions('provincia', 'todo_el_dia', 4);
    const allData = getClientPredictions('all', 'todo_el_dia', 5);

    const now = new Date();
    const todayFormatted = now.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let postText = `🔥 *PRONÓSTICO OFICIAL DEL DÍA (Quinela Master Pro)* 🔥\n`;
    postText += `📅 ${todayFormatted.toUpperCase()}\n\n`;

    // 1. Sección Lotería de la Ciudad (Nacional)
    postText += `🏛️ *LOTERÍA DE LA CIUDAD (NACIONAL) - FIJOS DEL DÍA:*\n`;
    ciudadData.top_predictions.slice(0, 4).forEach((p, idx) => {
      const icon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
      const terno = p.suggested_centenas?.[0] || `7${p.number}`;
      const cuaterno = p.suggested_millar?.[0] || `27${p.number}`;
      const posTag = idx === 0 
        ? '👑 A LA CABEZA (1° Premio Pleno)' 
        : idx === 1 
          ? '🎯 Al 1° y a los 5' 
          : idx === 2 
            ? '💎 A los 5 o a los 10' 
            : '🛡️ A los 10 o a los 20';

      postText += `${icon} *${p.number}* ("${p.significado}") - ${p.composite_score}% Conf.\n`;
      postText += `   ↳ 📍 Jugar: *${posTag}*\n`;
      postText += `   ↳ Terno: *${terno}* | Cuaterno: *${cuaterno}*\n`;
    });

    // 2. Sección Lotería de la Provincia (Bs As)
    postText += `\n🌿 *LOTERÍA DE LA PROVINCIA (BS AS) - FIJOS DEL DÍA:*\n`;
    provData.top_predictions.slice(0, 4).forEach((p, idx) => {
      const icon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '⭐';
      const terno = p.suggested_centenas?.[0] || `7${p.number}`;
      const cuaterno = p.suggested_millar?.[0] || `27${p.number}`;
      const posTag = idx === 0 
        ? '👑 A LA CABEZA (1° Premio Pleno)' 
        : idx === 1 
          ? '🎯 Al 1° y a los 5' 
          : idx === 2 
            ? '💎 A los 5 o a los 10' 
            : '🛡️ A los 10 o a los 20';

      postText += `${icon} *${p.number}* ("${p.significado}") - ${p.composite_score}% Conf.\n`;
      postText += `   ↳ 📍 Jugar: *${posTag}*\n`;
      postText += `   ↳ Terno: *${terno}* | Cuaterno: *${cuaterno}*\n`;
    });

    // 3. Sección Redoblonas Candado del Día
    if (allData.suggested_redoblonas && allData.suggested_redoblonas.length > 0) {
      postText += `\n🔒 *REDOBLONAS CANDADO DEL DÍA:*\n`;
      allData.suggested_redoblonas.forEach((redo) => {
        postText += `💎 Pareja: *${redo.pair}* (${redo.significados})\n`;
        postText += `   ↳ Modalidad: ${redo.recommended_positions} (${redo.target})\n`;
      });
    }

    postText += `\n📲 *Generado con Inteligencia Artificial por Quinela Master Pro*\n`;
    postText += `🎁 *Probá la app con 15 DÍAS VIP GRATIS acá:* 👇\n`;
    postText += `https://ingenieriajh.com/quinela.html`;

    navigator.clipboard.writeText(postText);
    setCopyStatus('¡Pronóstico del Día copiado separado por Lotería! 📢✨');
    setTimeout(() => setCopyStatus(''), 3000);
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
    { id: 'todo_el_dia', label: '⭐ Todo el Día (Fijos)', icon: Sparkles },
    { id: 'la_previa', label: 'La Previa (10:15)', icon: Clock },
    { id: 'primera', label: 'Primera (12:00)', icon: Clock },
    { id: 'matutina', label: 'Matutina (15:00)', icon: Clock },
    { id: 'vespertina', label: 'Vespertina (18:00)', icon: Clock },
    { id: 'nocturna', label: 'Nocturna (21:00)', icon: Clock }
  ];

  const isUrgent = liveShiftInfo.totalSecondsLeft <= 900; // Less than 15 min

  const currentShiftObj = shiftOptions.find(s => s.id === activeShift) || shiftOptions[0];

  return (
    <div className="space-y-3 sm:space-y-4 animate-fadeIn">
      {/* 1. Barra Sticky Superior de Una Sola Línea con Próximo Sorteo y Menú de Rayitas */}
      <div className="sticky top-[48px] sm:top-[56px] z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-1.5 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/30 flex items-center justify-between gap-2 shadow-md">
        {/* Próximo Sorteo Activo en una sola línea */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] sm:text-xs font-black text-amber-300 truncate">
            Próximo Sorteo Activo: <strong className="text-white">{activePredictions.shift_name || 'En Vivo'}</strong> ({activePredictions.shift_time || '15:00'} hs)
          </span>
        </div>

        {/* Menú de Rayitas (☰) para seleccionar turno */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsShiftMenuOpen(!isShiftMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 rounded-xl text-xs font-bold text-white shadow transition-all cursor-pointer"
            title="Seleccionar Turno del Sorteo"
          >
            <Menu className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-black text-amber-300 max-w-[110px] truncate">{currentShiftObj.label}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isShiftMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Desplegable Flotante del Menú de Rayitas */}
          {isShiftMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsShiftMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-1.5 w-60 bg-slate-900/95 backdrop-blur-xl border border-amber-500/30 rounded-2xl shadow-2xl py-1.5 z-50 animate-fadeIn">
                <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                  Seleccionar Turno Oficial
                </div>
                {shiftOptions.map((s) => {
                  const isSelected = activeShift === s.id || (!activeShift && s.id === 'auto');
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        onSelectShift && onSelectShift(s.id);
                        setIsShiftMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer text-left ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 font-black' 
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                        <span className="truncate">{s.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. Título Superior Limpio */}
      <div className="flex items-center justify-between pt-0.5 px-0.5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Motor de Análisis Estadístico</span>
          </h2>
          <p className="text-[10.5px] text-slate-400">
            Convergencia de frecuencias, atrasos y transiciones en tiempo real.
          </p>
        </div>

        {/* Botón pequeño de Auditoría */}
        <button
          type="button"
          onClick={() => setIsEfficiencyModalOpen(true)}
          className="bg-slate-950 hover:bg-slate-900 px-2 py-1 rounded-xl border border-amber-500/30 text-right cursor-pointer hover:border-amber-400 transition-colors shrink-0 shadow"
          title="Ver auditoría matemática del motor estadístico"
        >
          <div className="text-[9px] text-slate-400 flex items-center gap-0.5 justify-end">
            <span>Auditoría</span>
            <Info className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="text-xs font-black text-emerald-400 font-mono">
            {backtest?.head_hit_rate !== undefined ? `${backtest.head_hit_rate}%` : '2.223+'}
          </div>
        </button>
      </div>

      {/* 3. Selector de Lotería Compacto (Ambas / Nacional / Provincia) */}
      <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow">
        <button
          onClick={() => setSelectedLottery('all')}
          className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            selectedLottery === 'all'
              ? 'bg-amber-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌟 Ambas</span>
        </button>

        <button
          onClick={() => setSelectedLottery('ciudad')}
          className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            selectedLottery === 'ciudad'
              ? 'bg-amber-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🏛️ Nacional</span>
        </button>

        <button
          onClick={() => setSelectedLottery('provincia')}
          className={`py-1.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            selectedLottery === 'provincia'
              ? 'bg-amber-500 text-slate-950 shadow font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌿 Provincia</span>
        </button>
      </div>

      {/* 4. Cuatro Botones Compactos al Costado (Copiar y Jugar en Plataforma) */}
      <div className="space-y-1">
        {copyStatus && (
          <div className="text-center">
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/50 shadow animate-fadeIn inline-block">
              {copyStatus}
            </span>
          </div>
        )}

        {/* Botón Destacado: Cupón Digital para el Agenciero (Letra Grande) */}
        <button
          type="button"
          onClick={() => setIsSlipModalOpen(true)}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition-all active:scale-98 cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-slate-950" />
          <span>🎟️ Abrir Cupón para el Agenciero (Letra Grande)</span>
          <span className="text-[10px] px-2 py-0.5 bg-slate-950 text-amber-300 rounded-full font-bold ml-1">
            Modo Rápido
          </span>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {/* Botón 1: Copiar Nacional */}
          <button
            type="button"
            onClick={() => handleCopyAllLottery('ciudad')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/90 hover:bg-slate-800 border border-blue-500/40 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
            title="Copiar jugadas recomendadas para Lotería Nacional"
          >
            <span className="text-xs">🏛️</span>
            <span className="text-[11px] font-bold text-white truncate">Copiar Nacional</span>
            <Copy className="w-3 h-3 text-blue-400 shrink-0 ml-auto" />
          </button>

          {/* Botón 2: Copiar Provincia */}
          <button
            type="button"
            onClick={() => handleCopyAllLottery('provincia')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
            title="Copiar jugadas recomendadas para Provincia"
          >
            <span className="text-xs">🌿</span>
            <span className="text-[11px] font-bold text-white truncate">Copiar Prov.</span>
            <Copy className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />
          </button>

          {/* Botón 3: Pronóstico del Día (Para WhatsApp y Redes) */}
          <button
            type="button"
            onClick={handleCopyDailySummaryForSocialMedia}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
            title="Copiar resumen del día organizado para WhatsApp"
          >
            <Share2 className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-black truncate">Pronóstico del Día</span>
            <Copy className="w-3 h-3 shrink-0 ml-auto" />
          </button>

          {/* Botón 4: Jugar en Plataforma Oficial */}
          <a
            href={getAffiliateUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
            title="Abrir plataforma oficial de juego"
          >
            <span className="text-xs">🌐</span>
            <span className="text-[11px] font-black truncate">Jugar Oficial</span>
            <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
          </a>
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
                className={`rounded-2xl p-3 sm:p-3.5 transition-all border cursor-pointer ${
                  idx === 0
                    ? 'bg-gradient-to-b from-amber-950/50 to-slate-900 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                {/* Header of Signal: Target Lottery Badge, Position Badge & Live Countdown Timer */}
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                      cand.target_lottery === 'ciudad' 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : cand.target_lottery === 'provincia'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {cand.target_lottery === 'ciudad' ? '🏛️ Ciudad' : cand.target_lottery === 'provincia' ? '🌿 Provincia' : '🌟 Ambas'}
                    </span>

                    {/* Insignia de Posición Sugerida para Jugar */}
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase flex items-center gap-1 ${
                      idx === 0 
                        ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs' 
                        : idx === 1 
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' 
                          : idx < 4 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {idx === 0 
                        ? '👑 A la Cabeza' 
                        : idx === 1 
                          ? '🎯 Al 1° y a los 5' 
                          : idx < 4 
                            ? '💎 A los 5 o a los 10' 
                            : '🛡️ A los 10 o a los 20'}
                    </span>
                  </div>

                  {/* Individual Live Timer Badge */}
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[9.5px] font-mono font-bold text-amber-400 shrink-0">
                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                    <span>{liveShiftInfo.formattedTimeLeft}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight px-2.5 py-0.5 rounded-xl border shadow-inner ${
                      idx === 0
                        ? 'bg-slate-950 text-amber-400 border-amber-500/50'
                        : 'bg-slate-950 text-white border-slate-800'
                    }`}>
                      {cand.number}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white leading-tight">
                        "{cand.significado}"
                      </div>
                      <div className="text-[9.5px] text-slate-400">
                        {cand.target_lottery_label}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-[10.5px]">
                      Score: {cand.composite_score}/100
                    </span>
                  </div>
                </div>

                {/* Explicit Play Type Breakdown (2 cifras, 3 cifras, 4 cifras) - Compact */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 grid grid-cols-3 gap-1 text-[10.5px] bg-slate-950/80 p-2 rounded-xl border border-slate-800/50 text-center">
                  <div>
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Ambo (2c)</span>
                    <span className="font-mono font-black text-amber-300">{cand.number}</span>
                  </div>

                  <div className="border-x border-slate-800/80">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Terno (3c)</span>
                    <span className="font-mono font-black text-slate-200">{cand.suggested_centenas?.[0]}</span>
                  </div>

                  <div>
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Cuaterno (4c)</span>
                    <span className="font-mono font-black text-emerald-400">{cand.suggested_millar?.[0]}</span>
                  </div>
                </div>

                {/* Botón de Trazabilidad y Transparencia */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTraceCandidate(cand);
                  }}
                  className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-[10.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>¿Por qué aparece este número? (Trazabilidad)</span>
                </button>

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
        rate={backtest?.head_hit_rate !== undefined ? `${backtest.head_hit_rate}% Aciertos Retrospectivos` : "Base Oficial 2.223 Sorteos"}
      />

      {/* Traceability Modal */}
      {traceCandidate && (
        <TraceabilityModal
          isOpen={!!traceCandidate}
          onClose={() => setTraceCandidate(null)}
          prediction={traceCandidate}
          shiftName={activePredictions?.shift_name}
          lotteryLabel={traceCandidate.target_lottery_label || selectedLottery}
        />
      )}

      {/* MODAL CUPÓN DIGITAL PARA EL AGENCIERO (MODO JUGADA RÁPIDA / LETRA GRANDE) */}
      {isSlipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 border-2 border-amber-400 rounded-3xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto ring-2 ring-amber-400/40">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Cupón para el Agenciero
                  </h3>
                  <span className="text-xs text-amber-300 font-bold uppercase">
                    {activePredictions.shift_name || 'Turno Oficial'} • {selectedLottery === 'ciudad' ? 'Lotería Nacional' : selectedLottery === 'provincia' ? 'Lotería Provincia' : 'Nacional y Provincia'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Tamaño de Fuente */}
            <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Tamaño de Letra para Mostrar:</span>
              <button
                type="button"
                onClick={() => setIsExtraLargeFont(!isExtraLargeFont)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  isExtraLargeFont 
                    ? 'bg-amber-400 text-slate-950 shadow' 
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isExtraLargeFont ? '🔍 Letra Normal' : '🔍 Letra Gigante (Fácil)'}
              </button>
            </div>

            {/* Tarjeta de Números en Pantalla Completa para Mostrar en Ventanilla */}
            <div className="bg-slate-900 border-2 border-dashed border-amber-400/60 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">
                  BOLETA OFICIAL RECOMENDADA
                </span>
                <span className="text-xs font-black text-amber-400">
                  MOSTRAR EN VENTANILLA AL JUGAR
                </span>
              </div>

              {/* Números Principales */}
              <div className="space-y-2">
                {activePredictions.top_predictions.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      <span className={`font-mono font-black ${isExtraLargeFont ? 'text-4xl' : 'text-2xl'} tracking-wider text-amber-400`}>
                        {item.number}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">({item.significado})</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {item.recommended_positions || 'Cabeza y a los 5'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Redoblona Sugerida */}
              {activePredictions.redoblonas && activePredictions.redoblonas.length > 0 && (
                <div className="bg-slate-950/90 p-2.5 rounded-xl border border-indigo-500/40 text-xs">
                  <span className="font-bold text-indigo-300 block mb-0.5">REDOBLONA CANDADO:</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {activePredictions.redoblonas[0].pair} ({activePredictions.redoblonas[0].significados}) {activePredictions.redoblonas[0].recommended_positions || 'a los 10'}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones del Cupón */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const numbersText = activePredictions.top_predictions.slice(0, 3).map((n, i) => `• Ambo *${n.number}* (${n.significado}) -> ${n.recommended_positions || 'Cabeza y 5'}`).join('\n');
                  const msg = `🎟️ *MI JUGADA DE QUINIELA - ${activePredictions.shift_name?.toUpperCase()}*\n🏛️ Lotería: ${selectedLottery === 'ciudad' ? 'Nacional' : selectedLottery === 'provincia' ? 'Provincia' : 'Nacional y Provincia'}\n\n${numbersText}\n\n📲 Generado con Quinela Master Pro`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                }}
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar a WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyAllLottery(selectedLottery === 'all' ? 'ciudad' : selectedLottery);
                  setCopyStatus('¡Copiado para la agencia!');
                  setTimeout(() => setCopyStatus(''), 2500);
                }}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Copiar Texto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
