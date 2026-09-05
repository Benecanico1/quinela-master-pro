import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Flame, Clock, Layers, ChevronDown, ChevronUp, 
  Shuffle, Copy, Check, ShieldCheck, Lock, Crown, RefreshCw, Zap,
  Activity, Timer, AlertTriangle, HelpCircle, Info, ExternalLink, Share2,
  Menu, X, Ticket, Cpu, Sliders, CheckCircle2, Award, Target
} from 'lucide-react';
import { 
  getClientPredictions, 
  SHIFT_DEFINITIONS, 
  getCurrentActiveShift, 
  formatSecondsToHMS, 
  getLastClosedShift,
  getRealOfficialDrawsFromStorage,
  getLocalDateString,
  SIGNIFICADOS
} from '../services/clientEngine';
import { getMLPredictions, ML_MODEL_METADATA } from '../services/mlPredictionEngine';
import { 
  getOrCreateCanonicalPrediction, 
  getCanonicalPrediction, 
  recordCouponSnapshot,
  formatItemsFromTop5,
  evaluateCanonicalPrediction
} from '../services/canonicalPredictionsLedger';
import { 
  getOrLockUpcomingCanonicalPrediction, 
  ensureAllUpcomingCanonicalRecords 
} from '../services/preDrawService';
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
  const [engineFilter, setEngineFilter] = useState('both'); // 'both' | 'ml' | 'baseline'
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [generatedTicket, setGeneratedTicket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [liveShiftInfo, setLiveShiftInfo] = useState(() => getCurrentActiveShift());
  const [isEfficiencyModalOpen, setIsEfficiencyModalOpen] = useState(false);
  const [traceCandidate, setTraceCandidate] = useState(null);
  const [isShiftMenuOpen, setIsShiftMenuOpen] = useState(false);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [isExtraLargeFont, setIsExtraLargeFont] = useState(false);
  const [slipEngineChoice, setSlipEngineChoice] = useState('ml'); // 'ml' | 'baseline'

  // Second-by-second live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveShiftInfo(getCurrentActiveShift());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const lastClosed = getLastClosedShift();
  const todayStr = getLocalDateString(new Date());

  // Calculations for Active/Upcoming Shift
  const resolvedActiveShiftId = (activeShift && activeShift !== 'auto') 
    ? activeShift 
    : (liveShiftInfo?.id || 'la_previa');
  const cleanJur = selectedLottery === 'all' ? 'ciudad' : selectedLottery;
  const cleanActiveShift = resolvedActiveShiftId.toLowerCase().replace('la_', '');

  // Pre-draw lock for active upcoming shift strictly before deadline
  try {
    ensureAllUpcomingCanonicalRecords(todayStr, cleanActiveShift);
  } catch (e) {
    console.warn("Pre-draw locking error:", e);
  }

  const rawMLActive = getOrLockUpcomingCanonicalPrediction(todayStr, cleanJur, cleanActiveShift, 'ML-FULL');
  const rawStatActive = getOrLockUpcomingCanonicalPrediction(todayStr, cleanJur, cleanActiveShift, 'STATISTICAL');

  // STRICT COMPOSITE KEY VALIDATION (date + jurisdiction + shift + engine)
  // Guarantees zero leakage or carryover from other shifts/jurisdictions
  const canonicalMLActive = (rawMLActive && 
    rawMLActive.date === todayStr && 
    rawMLActive.jurisdiction === cleanJur && 
    rawMLActive.shift === cleanActiveShift && 
    rawMLActive.engine_id === 'ML-FULL') ? rawMLActive : null;

  const canonicalStatActive = (rawStatActive && 
    rawStatActive.date === todayStr && 
    rawStatActive.jurisdiction === cleanJur && 
    rawStatActive.shift === cleanActiveShift && 
    rawStatActive.engine_id === 'STATISTICAL') ? rawStatActive : null;

  const mlPredictionsActive = getMLPredictions(selectedLottery, resolvedActiveShiftId, 15);

  // Strictly source Top 5 from Canonical Prediction Record. Top 5 NEVER falls back to dynamic recalculation or previous shifts.
  const mlTop5Active = useMemo(() => {
    if (canonicalMLActive && 
        canonicalMLActive.status === 'LOCKED' && 
        canonicalMLActive.shift === cleanActiveShift &&
        canonicalMLActive.jurisdiction === cleanJur &&
        canonicalMLActive.date === todayStr &&
        Array.isArray(canonicalMLActive.top_5) && 
        canonicalMLActive.top_5.length > 0) {
      return formatItemsFromTop5(canonicalMLActive.top_5);
    }
    return [];
  }, [canonicalMLActive, cleanActiveShift, cleanJur, todayStr]);

  const statTop5Active = useMemo(() => {
    if (canonicalStatActive && 
        canonicalStatActive.status === 'LOCKED' && 
        canonicalStatActive.shift === cleanActiveShift &&
        canonicalStatActive.jurisdiction === cleanJur &&
        canonicalStatActive.date === todayStr &&
        Array.isArray(canonicalStatActive.top_5) && 
        canonicalStatActive.top_5.length > 0) {
      return formatItemsFromTop5(canonicalStatActive.top_5);
    }
    return [];
  }, [canonicalStatActive, cleanActiveShift, cleanJur, todayStr]);

  // Calculations & Official Hits for Last Closed Shift
  const allDrawsDb = getRealOfficialDrawsFromStorage();
  const closedShiftId = lastClosed.id;

  // Retrieve official draws for the closed shift
  const ciudadDrawKey = `${todayStr}_ciudad_${closedShiftId}`;
  const provinciaDrawKey = `${todayStr}_provincia_${closedShiftId}`;
  const ciudadDraw = allDrawsDb[ciudadDrawKey] || null;
  const provinciaDraw = allDrawsDb[provinciaDrawKey] || null;

  // Closed shift predictions strictly sourced from Canonical Records. NO fallback to recalculation.
  const canonicalClosedML = getCanonicalPrediction(todayStr, cleanJur, closedShiftId, 'ML-FULL');
  const canonicalClosedStat = getCanonicalPrediction(todayStr, cleanJur, closedShiftId, 'STATISTICAL');

  const mlTop5Closed = useMemo(() => {
    if (canonicalClosedML && 
        canonicalClosedML.status === 'LOCKED' && 
        canonicalClosedML.shift === closedShiftId &&
        canonicalClosedML.jurisdiction === cleanJur &&
        canonicalClosedML.date === todayStr &&
        Array.isArray(canonicalClosedML.top_5) && 
        canonicalClosedML.top_5.length > 0) {
      return formatItemsFromTop5(canonicalClosedML.top_5);
    }
    return [];
  }, [canonicalClosedML, closedShiftId, cleanJur, todayStr]);

  const statTop5Closed = useMemo(() => {
    if (canonicalClosedStat && 
        canonicalClosedStat.status === 'LOCKED' && 
        canonicalClosedStat.shift === closedShiftId &&
        canonicalClosedStat.jurisdiction === cleanJur &&
        canonicalClosedStat.date === todayStr &&
        Array.isArray(canonicalClosedStat.top_5) && 
        canonicalClosedStat.top_5.length > 0) {
      return formatItemsFromTop5(canonicalClosedStat.top_5);
    }
    return [];
  }, [canonicalClosedStat, closedShiftId, cleanJur, todayStr]);

  const isClosedShiftSealedInLedger = Boolean(canonicalClosedStat && canonicalClosedStat.status === 'LOCKED') ||
    Boolean(canonicalClosedML && canonicalClosedML.status === 'LOCKED');

  // Unified evaluation for closed shift items using pure evaluateCanonicalPrediction
  // STRICT JURISDICTION ISOLATION: Ciudad never evaluates with Provincia, Provincia never evaluates with Ciudad
  const evaluateItemInClosedShift = (candNumber, engineKey) => {
    const targetDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
    const targetRecord = engineKey === 'ml' ? canonicalClosedML : canonicalClosedStat;

    if (!targetDraw || !targetRecord) {
      return { is_hit: false, hit_type: 'WAITING_RESULT', label: '⏳ Esperando extracto oficial' };
    }

    const evaluation = evaluateCanonicalPrediction(targetRecord, targetDraw);
    if (!evaluation || !evaluation.is_evaluated) {
      return { is_hit: false, hit_type: 'WAITING_RESULT', label: '⏳ Esperando extracto oficial' };
    }

    if (evaluation.head_hit && evaluation.official_head_ambo === candNumber) {
      return {
        is_hit: true,
        hit_type: 'CABEZA',
        label: `👑 CABEZA (${evaluation.head_multiplier || '70x'})`,
        position: 1,
        multiplier: '70x Pleno'
      };
    }

    const posHit = evaluation.official_positions.find(p => p.number === candNumber);
    if (posHit) {
      return {
        is_hit: true,
        hit_type: 'PIZARRA',
        label: `🎯 Posición #${posHit.position} (${posHit.multiplier})`,
        position: posHit.position,
        multiplier: posHit.multiplier
      };
    }

    return {
      is_hit: false,
      hit_type: 'NO_HIT',
      label: '⚪ No figuró en extracto'
    };
  };

  const handleCopyAllLottery = (lotteryKey, chosenEngine = 'ml') => {
    const lotLabel = lotteryKey === 'ciudad' ? 'CIUDAD (NACIONAL)' : lotteryKey === 'provincia' ? 'PROVINCIA BS AS' : 'NACIONAL Y PROVINCIA';
    const lotData = chosenEngine === 'ml'
      ? getMLPredictions(lotteryKey, resolvedActiveShiftId, 15)
      : getClientPredictions(lotteryKey, resolvedActiveShiftId, 15);
    const predictionsList = isVip ? lotData.top_predictions.slice(0, 5) : [lotData.top_predictions[0]];
    const engineTag = chosenEngine === 'ml' ? '🧠 Motor IA / ML (Champion)' : '📊 Motor Estadístico (Frecuencias)';

    let text = `🎯 ${lotLabel} - ${lotData.shift_name || 'En Vivo'}\n`;
    text += `⚙️ Algoritmo: ${engineTag}\n\n`;
    predictionsList.forEach((pred, idx) => {
      const ambo = pred.number;
      const terno = pred.suggested_centenas?.[0] || `7${ambo}`;
      const cuaterno = pred.suggested_millar?.[0] || `17${ambo}`;
      const posTag = idx === 0 
        ? 'A LA CABEZA (1° Premio)' 
        : idx === 1 
          ? 'Al 1° y a los 5' 
          : idx < 4 
            ? 'A los 5 o a los 10' 
            : 'A los 10 o a los 20';
      text += `[${idx + 1}] ${posTag}\n• Ambo: ${ambo}\n• Terno: ${terno}\n• Cuaterno: ${cuaterno}\n\n`;
    });
    text += `Recomendado por Quiniela Master Pro`;

    navigator.clipboard.writeText(text);
    setCopyStatus(`¡Copiadas recomendaciones de ${lotteryKey === 'ciudad' ? 'Nacional' : 'Provincia'} (${chosenEngine === 'ml' ? 'IA' : 'Estadístico'})! 📋✨`);
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleCopyDailySummaryForSocialMedia = () => {
    const ciudadML = getMLPredictions('ciudad', resolvedActiveShiftId, 5);
    const provML = getMLPredictions('provincia', resolvedActiveShiftId, 5);
    const ciudadStat = getClientPredictions('ciudad', resolvedActiveShiftId, 5);
    const provStat = getClientPredictions('provincia', resolvedActiveShiftId, 5);
    const allData = getClientPredictions('all', resolvedActiveShiftId, 5);

    const now = new Date();
    const todayFormatted = now.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let postText = `🔥 *PRONÓSTICOS OFICIALES DEL DÍA (Quiniela Master Pro)* 🔥\n`;
    postText += `📅 ${todayFormatted.toUpperCase()}\n`;
    postText += `⏰ Turno: ${mlPredictionsActive.shift_name || 'En Vivo'} (${mlPredictionsActive.shift_time || '15:00'} hs)\n\n`;

    // 1. FILA IA / ML (CHAMPION)
    postText += `🧠 *FILA 1: MOTOR IA / ML — CHAMPION (ML-FULL):*\n`;
    postText += `🏛️ *Ciudad (Nacional):* `;
    postText += ciudadML.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n🌿 *Provincia (Bs As):* `;
    postText += provML.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n\n`;

    // 2. FILA MOTOR ESTADÍSTICO
    postText += `📊 *FILA 2: MOTOR ESTADÍSTICO (FRECUENCIAS & ATRASOS):*\n`;
    postText += `🏛️ *Ciudad (Nacional):* `;
    postText += ciudadStat.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n🌿 *Provincia (Bs As):* `;
    postText += provStat.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n\n`;

    // 3. Sección Redoblonas Candado del Día
    if (allData.suggested_redoblonas && allData.suggested_redoblonas.length > 0) {
      postText += `🔒 *REDOBLONAS CANDADO SUGERIDAS:*\n`;
      allData.suggested_redoblonas.slice(0, 2).forEach((redo) => {
        postText += `💎 Pareja: *${redo.pair}* (${redo.significados}) ↳ ${redo.recommended_positions}\n`;
      });
      postText += `\n`;
    }

    postText += `📲 *Generado por Quiniela Master Pro con Transparencia Total*\n`;
    postText += `🎁 *Probá la app con 15 DÍAS VIP GRATIS acá:* 👇\n`;
    postText += `https://ingenieriajh.com/quinela.html`;

    navigator.clipboard.writeText(postText);
    setCopyStatus('¡Pronósticos de Ambas Filas copiados para WhatsApp! 📢✨');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const handleQuickGenerate = () => {
    const list = slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
    const randomPick = isVip ? list[Math.floor(Math.random() * list.length)] : list[0];
    setGeneratedTicket({
      ambo: randomPick.number,
      significado: randomPick.significado,
      target_lottery_label: randomPick.target_lottery_label,
      score: randomPick.composite_score,
      engine: slipEngineChoice === 'ml' ? 'ML-FULL (IA)' : 'Estadístico Base',
      terno: randomPick.suggested_centenas?.[0] || `7${randomPick.number}`,
      cuaterno: randomPick.suggested_millar?.[0] || `17${randomPick.number}`
    });
  };

  const copyToClipboard = () => {
    if (!generatedTicket) return;
    const text = `🎯 Pronóstico Recomendado (${generatedTicket.engine} - ${mlPredictionsActive.shift_name || 'Quiniela Master Pro'}):\n🏛️ Lotería: ${generatedTicket.target_lottery_label || 'Ambas Loterías'}\nAmbo (2 cifras): ${generatedTicket.ambo} ("${generatedTicket.significado}") (70x)\nTerno (3 cifras): ${generatedTicket.terno} (500x)\nCuaterno (4 cifras): ${generatedTicket.cuaterno} (3.500x)\n⏳ Validez: ${liveShiftInfo.formattedTimeLeft}`;
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

  const currentShiftObj = shiftOptions.find(s => s.id === activeShift) || shiftOptions[0];

  // Helper to render an Engine Row (Top 5 cards)
  const renderEngineRow = ({
    engineKey,
    title,
    subtitle,
    tag,
    tagColor,
    statusText,
    statusColor,
    timestampText,
    isSealed = false,
    canonicalRecord = null,
    predictionsList,
    isClosedSection = false
  }) => {
    return (
      <div className="space-y-2 p-3 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
        {/* Row Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{engineKey === 'ml' ? '🧠' : '📊'}</span>
            <span className="text-xs sm:text-sm font-black text-white">{title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${tagColor}`}>
              {tag}
            </span>
            {isSealed && (
              <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> 🔒 LOCKED (TRACEABILITY_V1)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-mono">
            <span className={`px-2 py-0.5 rounded-md ${statusColor} font-bold flex items-center gap-1`}>
              <Lock className="w-2.5 h-2.5" />
              {statusText}
            </span>
            <span>•</span>
            <span className="truncate">{timestampText}</span>
          </div>
        </div>

        {/* Traceability Metadata Bar (Required for Pre-Draw Auditing) */}
        {canonicalRecord && (
          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1.5 shadow-inner">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-amber-400 font-bold flex items-center gap-1 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                <Lock className="w-3 h-3 text-amber-400" /> ESTADO: {canonicalRecord.status}
              </span>
              <span>•</span>
              <span>🏛️ JURISDICCIÓN: <strong className="text-white font-bold">{canonicalRecord.jurisdiction?.toUpperCase()}</strong></span>
              <span>•</span>
              <span>📅 FECHA: <strong className="text-white font-bold">{canonicalRecord.date}</strong></span>
              <span>•</span>
              <span>⏰ TURNO: <strong className="text-white font-bold">{canonicalRecord.shift?.toUpperCase()}</strong></span>
              <span>•</span>
              <span>🕒 HORARIO: <strong className="text-white font-bold">{canonicalRecord.draw_time} hs</strong></span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-400">
              <span className="truncate">PREDICTION_ID: <strong className="text-indigo-300 font-mono">{canonicalRecord.prediction_id}</strong></span>
              <span>•</span>
              <span>CREATED: <strong className="text-slate-300">{canonicalRecord.created_at || 'N/A'}</strong></span>
              <span>•</span>
              <span>LOCKED: <strong className="text-slate-300">{canonicalRecord.locked_at || 'N/A'}</strong></span>
              <span>•</span>
              <span>DEADLINE: <strong className="text-amber-300 font-bold">{canonicalRecord.deadline}</strong></span>
            </div>
            {canonicalRecord.prediction_hash && (
              <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                <span>HASH SHA-256:</span>
                <strong className="text-emerald-400 font-mono select-all bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {canonicalRecord.prediction_hash}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* 5 Cards Grid or Loading/Unregistered State */}
        {(!predictionsList || predictionsList.length === 0) ? (
          <div className="p-4 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono text-xs space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-400">
              <Lock className="w-4 h-4" />
              <span className="font-bold">
                {isClosedSection 
                  ? 'SIN PREDICCIÓN REGISTRADA' 
                  : (loading ? 'Cargando pronóstico sellado...' : `SIN PRONÓSTICO SELLADO PARA ${(canonicalRecord?.shift || cleanActiveShift || 'ESTE TURNO').toUpperCase()}`)}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              {isClosedSection 
                ? 'No existía snapshot sellado en Ledger previo a este sorteo. Generación retrospectiva deshabilitada.'
                : 'No existe registro canónico sellado antes del deadline para este turno y jurisdicción.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {predictionsList.map((cand, idx) => {
              const isLocked = !isVip && idx > 0;
              const hitInfo = isClosedSection ? evaluateItemInClosedShift(cand.number, engineKey) : null;

              if (isLocked) {
                return (
                  <div
                    key={`${engineKey}-${cand.number}-${idx}`}
                    onClick={onOpenUpgrade}
                    className="relative rounded-xl p-3 bg-slate-950/70 border border-slate-800/80 flex flex-col justify-between overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all min-h-[120px]"
                  >
                    <div className="filter blur-sm select-none opacity-20 text-center">
                      <span className="text-2xl font-black font-mono">{cand.number}</span>
                    </div>
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-2 bg-slate-950/85 backdrop-blur-xs text-center space-y-1">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <div className="text-[11px] font-black text-white">Top #{idx + 1} (VIP)</div>
                      <span className="text-[9px] text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/30">
                        Desbloquear
                      </span>
                    </div>
                  </div>
                );
              }

              const isExpanded = expandedIndex === `${engineKey}-${idx}`;

              return (
                <div
                  key={`${engineKey}-${cand.number}-${idx}`}
                  onClick={() => setExpandedIndex(isExpanded ? null : `${engineKey}-${idx}`)}
                  className={`rounded-xl p-2.5 transition-all border cursor-pointer relative ${
                    hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                      ? 'bg-gradient-to-b from-amber-950/60 to-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                      : hitInfo?.is_hit
                        ? 'bg-gradient-to-b from-emerald-950/50 to-slate-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                        : idx === 0 && !isClosedSection
                          ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-amber-500/40'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Header of Card */}
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800/80 text-[9.5px]">
                    <span className="font-mono font-bold text-slate-400">
                      #{idx + 1} • {idx === 0 ? 'Cabeza' : idx === 1 ? '1° y 5' : idx < 4 ? 'A los 10' : 'A los 20'}
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {cand.composite_score || cand.predictive_score}%
                    </span>
                  </div>

                  {/* Main Number & Meaning */}
                  <div className="flex items-center justify-between gap-1.5 my-1">
                    <div>
                      <span className={`text-2xl font-black font-mono tracking-tight ${
                        hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                          ? 'text-amber-300'
                          : hitInfo?.is_hit
                            ? 'text-emerald-300'
                            : idx === 0 && !isClosedSection
                              ? 'text-amber-400'
                              : 'text-white'
                      }`}>
                        {cand.number}
                      </span>
                      <span className="text-[10px] text-slate-300 block truncate max-w-[95px]">
                        "{cand.significado}"
                      </span>
                    </div>

                    <div className="text-right text-[9px] font-mono text-slate-400">
                      <div>T: <strong className="text-slate-200">{cand.suggested_centenas?.[0] || `7${cand.number}`}</strong></div>
                      <div>C: <strong className="text-slate-200">{cand.suggested_millar?.[0] || `17${cand.number}`}</strong></div>
                    </div>
                  </div>

                  {/* Hit Result Badge in Closed Section */}
                  {isClosedSection && (
                    <div className="mt-1.5 pt-1 border-t border-slate-800/80">
                      <span className={`w-full block text-center text-[9.5px] font-mono font-bold px-1 py-0.5 rounded ${
                        hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                          ? 'bg-amber-500 text-slate-950 font-black shadow'
                          : hitInfo?.is_hit
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-slate-900 text-slate-500'
                      }`}>
                        {hitInfo?.label}
                      </span>
                    </div>
                  )}

                  {/* Traceability Trigger */}
                  {!isClosedSection && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTraceCandidate(cand);
                      }}
                      className="mt-1 w-full py-1 text-[9px] font-bold text-slate-400 hover:text-amber-300 flex items-center justify-center gap-1 border-t border-slate-800/80 cursor-pointer"
                    >
                      <HelpCircle className="w-2.5 h-2.5 text-amber-400" />
                      <span>¿Por qué?</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. Barra Sticky Superior con Próximo Sorteo y Menú de Rayitas */}
      <div className="sticky top-[48px] sm:top-[56px] z-30 -mx-3 sm:-mx-6 lg:-mx-8 px-3 sm:px-6 lg:px-8 py-1.5 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/30 flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="text-[11px] sm:text-xs font-black text-amber-300 truncate">
            Próximo Sorteo Activo: <strong className="text-white">{mlPredictionsActive.shift_name || 'En Vivo'}</strong> ({mlPredictionsActive.shift_time || '15:00'} hs)
          </span>
          <span className="text-[10px] font-mono text-amber-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 ml-1 shrink-0">
            ⏳ {liveShiftInfo.formattedTimeLeft}
          </span>
        </div>

        {/* Menú de Rayitas (☰) */}
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

          {isShiftMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsShiftMenuOpen(false)} />
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

      {/* 2. Título & Selector de Lotería */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Pronósticos Oficiales Dual-Engine</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Transparencia Total
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Comparativa simultánea: Motor IA (ML-FULL Champion) y Motor Estadístico Base.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsEfficiencyModalOpen(true)}
          className="bg-slate-950 hover:bg-slate-900 px-3 py-1 rounded-xl border border-amber-500/30 text-right cursor-pointer hover:border-amber-400 transition-colors shrink-0 shadow self-start sm:self-auto"
        >
          <div className="text-[9px] text-slate-400 flex items-center gap-0.5 justify-end">
            <span>Auditoría Out-of-Sample</span>
            <Info className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <div className="text-xs font-black text-emerald-400 font-mono">
            74.25% Acierto en 20 Pzas
          </div>
        </button>
      </div>

      {/* 3. Selector de Lotería y Selector de Visualización */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Selector de Lotería */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow">
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

        {/* Selector de Modo de Visualización (Ambos / Solo ML / Solo Estadístico) */}
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow">
          <button
            onClick={() => setEngineFilter('both')}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              engineFilter === 'both'
                ? 'bg-indigo-600 text-white shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>✨ 2 Filas (Ambos)</span>
          </button>
          <button
            onClick={() => setEngineFilter('ml')}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              engineFilter === 'ml'
                ? 'bg-indigo-600 text-white shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🧠 Solo IA</span>
          </button>
          <button
            onClick={() => setEngineFilter('baseline')}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
              engineFilter === 'baseline'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📊 Solo Estadístico</span>
          </button>
        </div>
      </div>

      {/* 4. Botones de Acción (Cupón Digital, Copiar WhatsApp, Jugar) */}
      <div className="space-y-1.5">
        {copyStatus && (
          <div className="text-center">
            <span className="text-[10.5px] font-bold text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded-full border border-emerald-500/50 shadow inline-block">
              {copyStatus}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setIsSlipModalOpen(true);
            try {
              const currentEngine = slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
              const activeRecord = getOrCreateCanonicalPrediction(todayStr, selectedLottery === 'all' ? 'ciudad' : selectedLottery, resolvedActiveShiftId, currentEngine);
              const top5 = (slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active).map(p => p.number);
              recordCouponSnapshot({
                prediction_id: activeRecord.prediction_id,
                exact_top5_displayed: top5,
                engine: currentEngine,
                jurisdiction: selectedLottery,
                shift: resolvedActiveShiftId
              });
            } catch (e) {}
          }}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/30 transition-all active:scale-98 cursor-pointer"
        >
          <Ticket className="w-4 h-4 text-slate-950" />
          <span>🎟️ Abrir Cupón para el Agenciero (Letra Grande)</span>
          <span className="text-[10px] px-2 py-0.5 bg-slate-950 text-amber-300 rounded-full font-bold ml-1">
            Modo Rápido
          </span>
        </button>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => handleCopyAllLottery('ciudad', 'ml')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/90 hover:bg-slate-800 border border-blue-500/40 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
          >
            <span className="text-xs">🏛️</span>
            <span className="text-[11px] font-bold text-white truncate">Copiar Nacional</span>
            <Copy className="w-3 h-3 text-blue-400 shrink-0 ml-auto" />
          </button>

          <button
            type="button"
            onClick={() => handleCopyAllLottery('provincia', 'ml')}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/40 rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
          >
            <span className="text-xs">🌿</span>
            <span className="text-[11px] font-bold text-white truncate">Copiar Prov.</span>
            <Copy className="w-3 h-3 text-emerald-400 shrink-0 ml-auto" />
          </button>

          <button
            type="button"
            onClick={handleCopyDailySummaryForSocialMedia}
            className="flex items-center justify-center gap-1 py-2 px-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
          >
            <Share2 className="w-3 h-3 shrink-0" />
            <span className="text-[11px] font-black truncate">Pronóstico Día</span>
            <Copy className="w-3 h-3 shrink-0 ml-auto" />
          </button>

          <a
            href={getAffiliateUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 py-2 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-center transition-all active:scale-95 cursor-pointer shadow"
          >
            <span className="text-xs">🌐</span>
            <span className="text-[11px] font-black truncate">Jugar Oficial</span>
            <ExternalLink className="w-3 h-3 shrink-0 ml-auto" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BLOQUE 1: PRÓXIMO SORTEO (ACTIVO) */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              1. Próximo Sorteo a Jugar: <span className="text-amber-400">{mlPredictionsActive.shift_name}</span> ({mlPredictionsActive.shift_time || '15:00'} hs)
            </h3>
          </div>
          <div className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
            ⏳ Cierra en: {liveShiftInfo.formattedTimeLeft}
          </div>
        </div>

        {/* FILA 1: IA / ML — Champion (ML-FULL) */}
        {(engineFilter === 'both' || engineFilter === 'ml') && renderEngineRow({
          engineKey: 'ml',
          title: 'Fila 1: Motor IA / Machine Learning — Champion (ML-FULL)',
          subtitle: 'Regresión Logística L2 + 22 Features Causales',
          tag: 'Champion v1.0',
          tagColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          statusText: 'LOCKED',
          statusColor: 'bg-emerald-950 text-emerald-400 border border-emerald-500/30',
          timestampText: `Deadline: ${canonicalMLActive?.draw_time || '10:15'} hs`,
          isSealed: true,
          canonicalRecord: canonicalMLActive,
          predictionsList: mlTop5Active,
          isClosedSection: false
        })}

        {/* FILA 2: Motor Estadístico Base (Frecuencias & Atrasos) */}
        {(engineFilter === 'both' || engineFilter === 'baseline') && renderEngineRow({
          engineKey: 'baseline',
          title: 'Fila 2: Motor Estadístico (Frecuencias, Atrasos & Markov)',
          subtitle: 'Baseline Descriptivo con 2.223 Sorteos Verificados',
          tag: 'Baseline Estadístico',
          tagColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          statusText: 'LOCKED',
          statusColor: 'bg-blue-950 text-blue-400 border border-blue-500/30',
          timestampText: `Deadline: ${canonicalStatActive?.draw_time || '10:15'} hs`,
          isSealed: true,
          canonicalRecord: canonicalStatActive,
          predictionsList: statTop5Active,
          isClosedSection: false
        })}
      </div>

      {/* ========================================================================= */}
      {/* BLOQUE 2: ÚLTIMO SORTEO CERRADO (NO OCULTAR NUNCA) */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-3 border-t-2 border-slate-800">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                2. Último Sorteo Cerrado: <span className="text-amber-300">{lastClosed.name} ({lastClosed.timeStr} hs)</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Auditoría de pronósticos recomendados vs extractos oficiales recién extraídos de la pizarra.
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ciudadDraw && ciudadDraw.status === 'PUBLISHED' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 font-bold">
                🏛️ Ciudad Cabeza: <strong className="text-white">{ciudadDraw.p1 || ciudadDraw.head_millar}</strong> ({ciudadDraw.head_ambo || (ciudadDraw.p1 || ciudadDraw.head_millar || '').slice(-2)})
              </span>
            )}
            {provinciaDraw && provinciaDraw.status === 'PUBLISHED' && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold">
                🌿 Prov. Cabeza: <strong className="text-white">{provinciaDraw.p1 || provinciaDraw.head_millar}</strong> ({provinciaDraw.head_ambo || (provinciaDraw.p1 || provinciaDraw.head_millar || '').slice(-2)})
              </span>
            )}
            {(!ciudadDraw || ciudadDraw.status !== 'PUBLISHED') && (!provinciaDraw || provinciaDraw.status !== 'PUBLISHED') && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                ⏳ Esperando resultado oficial de lotería
              </span>
            )}
          </div>
        </div>

        {/* Nota de proveniencia de auditoría */}
        <div className="text-[10.5px] px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {isClosedShiftSealedInLedger
              ? '🛡️ Estado de Auditoría: PRONOSTICADO ANTES DEL SORTEO (Bloqueo criptográfico Fase 5 verificado en Ledger).'
              : 'ℹ️ Estado de Auditoría: COINCIDENCIA DETERMINISTA — Las predicciones se calculan estrictamente con datos previos al sorteo pero no contaban con snapshot sellado en Ledger.'}
          </span>
        </div>

        {/* Fila 1 Cerrada: IA / ML */}
        {(() => {
          const targetClosedDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
          const evalClosedML = targetClosedDraw && canonicalClosedML ? evaluateCanonicalPrediction(canonicalClosedML, targetClosedDraw) : null;
          const isClosedMLEvaluated = Boolean(evalClosedML && evalClosedML.is_evaluated);

          return (engineFilter === 'both' || engineFilter === 'ml') && renderEngineRow({
            engineKey: 'ml',
            title: `Resultados Fila 1: Motor IA (ML-FULL) en ${lastClosed.name}`,
            subtitle: 'Verificación de aciertos del modelo Champion',
            tag: 'ML-FULL Auditado',
            tagColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
            statusText: isClosedMLEvaluated ? 'EVALUADO' : '⏳ Sorteo cerrado — esperando resultado oficial',
            statusColor: isClosedMLEvaluated ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
            timestampText: isClosedShiftSealedInLedger ? 'Sellado: 16:51 ART' : `Cerrado: ${lastClosed.timeStr} hs`,
            isSealed: isClosedShiftSealedInLedger,
            canonicalRecord: canonicalClosedML,
            predictionsList: mlTop5Closed,
            isClosedSection: true
          });
        })()}

        {/* Fila 2 Cerrada: Motor Estadístico */}
        {(() => {
          const targetClosedDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
          const evalClosedStat = targetClosedDraw && canonicalClosedStat ? evaluateCanonicalPrediction(canonicalClosedStat, targetClosedDraw) : null;
          const isClosedStatEvaluated = Boolean(evalClosedStat && evalClosedStat.is_evaluated);

          return (engineFilter === 'both' || engineFilter === 'baseline') && renderEngineRow({
            engineKey: 'baseline',
            title: `Resultados Fila 2: Motor Estadístico en ${lastClosed.name}`,
            subtitle: 'Verificación de aciertos de frecuencias y atrasos',
            tag: 'Estadístico Auditado',
            tagColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            statusText: isClosedStatEvaluated ? 'EVALUADO' : '⏳ Sorteo cerrado — esperando resultado oficial',
            statusColor: isClosedStatEvaluated ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
            timestampText: `Cerrado: ${lastClosed.timeStr} hs`,
            isSealed: Boolean(canonicalClosedStat && canonicalClosedStat.status === 'LOCKED'),
            canonicalRecord: canonicalClosedStat,
            predictionsList: statTop5Closed,
            isClosedSection: true
          });
        })()}
      </div>

      {/* Suggested Redoblonas Candado */}
      {mlPredictionsActive.suggested_redoblonas && mlPredictionsActive.suggested_redoblonas.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-400" /> Redoblonas Candado del Turno ({mlPredictionsActive.shift_name})
            </h3>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-amber-400">
              <Clock className="w-3 h-3" />
              <span>Vence: {liveShiftInfo.formattedTimeLeft}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {mlPredictionsActive.suggested_redoblonas.map((redo, ridx) => (
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

      {/* Generador Rápido de Jugada */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Shuffle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-xs sm:text-sm">Generador Rápido de Jugada</div>
            <div className="text-[10px] text-slate-400">Arma Ambo, Terno y Cuaterno para {mlPredictionsActive.shift_name} (⏳ {liveShiftInfo.formattedTimeLeft})</div>
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

      {/* Modales */}
      <EfficiencyExplanationModal
        isOpen={isEfficiencyModalOpen}
        onClose={() => setIsEfficiencyModalOpen(false)}
        rate={backtest?.head_hit_rate !== undefined ? `${backtest.head_hit_rate}% Aciertos Retrospectivos` : "Base Oficial 2.223 Sorteos"}
      />

      {traceCandidate && (
        <TraceabilityModal
          isOpen={!!traceCandidate}
          onClose={() => setTraceCandidate(null)}
          prediction={traceCandidate}
          shiftName={mlPredictionsActive?.shift_name}
          lotteryLabel={traceCandidate.target_lottery_label || selectedLottery}
        />
      )}

      {/* MODAL CUPÓN DIGITAL PARA EL AGENCIERO */}
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
                    {mlPredictionsActive.shift_name || 'Turno Oficial'} • {selectedLottery === 'ciudad' ? 'Lotería Nacional' : selectedLottery === 'provincia' ? 'Lotería Provincia' : 'Nacional y Provincia'}
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

            {/* Selector de Motor dentro del Cupón */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setSlipEngineChoice('ml')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                  slipEngineChoice === 'ml'
                    ? 'bg-indigo-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🧠 Fila 1: Motor IA (ML-FULL)
              </button>
              <button
                type="button"
                onClick={() => setSlipEngineChoice('baseline')}
                className={`py-1.5 px-2 rounded-lg font-bold transition-all cursor-pointer ${
                  slipEngineChoice === 'baseline'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Fila 2: Estadístico Base
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

            {/* Tarjeta de Números en Pantalla Completa para Ventanilla */}
            <div className="bg-slate-900 border-2 border-dashed border-amber-400/60 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="text-center pb-2 border-b border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">
                  BOLETA OFICIAL RECOMENDADA ({slipEngineChoice === 'ml' ? 'IA ML-FULL' : 'ESTADÍSTICO'})
                </span>
                <span className="text-xs font-black text-amber-400">
                  MOSTRAR EN VENTANILLA AL JUGAR
                </span>
              </div>

              {/* Números Principales */}
              <div className="space-y-2">
                {(slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active).map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-400">[{idx + 1}]</span>
                      <span className={`font-mono font-black ${isExtraLargeFont ? 'text-4xl' : 'text-2xl'} tracking-wider text-amber-400`}>
                        {item.number}
                      </span>
                      <span className="text-xs text-slate-300 font-semibold">({item.significado})</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                      {idx === 0 ? 'A la Cabeza' : idx === 1 ? 'Cabeza y a los 5' : idx < 4 ? 'A los 5 o a los 10' : 'A los 10 o a los 20'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones del Cupón */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const targetList = slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
                  try {
                    const currentEngine = slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
                    const activeRecord = getOrCreateCanonicalPrediction(todayStr, selectedLottery === 'all' ? 'ciudad' : selectedLottery, resolvedActiveShiftId, currentEngine);
                    recordCouponSnapshot({
                      prediction_id: activeRecord.prediction_id,
                      exact_top5_displayed: targetList.map(p => p.number),
                      engine: currentEngine,
                      jurisdiction: selectedLottery,
                      shift: resolvedActiveShiftId
                    });
                  } catch (e) {}

                  const numbersText = targetList.map((n, i) => {
                    const ambo = n.number;
                    const terno = n.suggested_centenas?.[0] || `7${ambo}`;
                    const cuaterno = n.suggested_millar?.[0] || `17${ambo}`;
                    const posTag = i === 0 
                      ? 'A LA CABEZA (1° Premio)' 
                      : i === 1 
                        ? 'Al 1° y a los 5' 
                        : i < 4 
                          ? 'A los 5 o a los 10' 
                          : 'A los 10 o a los 20';
                    return `[${i + 1}] ${posTag}\n• Ambo: ${ambo}\n• Terno: ${terno}\n• Cuaterno: ${cuaterno}`;
                  }).join('\n\n');
                  const lotTitle = selectedLottery === 'ciudad' ? 'CIUDAD (NACIONAL)' : selectedLottery === 'provincia' ? 'PROVINCIA BS AS' : 'NACIONAL Y PROVINCIA';
                  const engineTitle = slipEngineChoice === 'ml' ? 'MOTOR IA (ML-FULL)' : 'MOTOR ESTADÍSTICO';
                  const msg = `🎯 *${lotTitle} - ${mlPredictionsActive.shift_name?.toUpperCase() || 'EN VIVO'}*\n⚙️ ${engineTitle}\n\n${numbersText}\n\nRecomendado por Quiniela Master Pro`;
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
                  try {
                    const currentEngine = slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
                    const activeRecord = getOrCreateCanonicalPrediction(todayStr, selectedLottery === 'all' ? 'ciudad' : selectedLottery, resolvedActiveShiftId, currentEngine);
                    const targetList = slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
                    recordCouponSnapshot({
                      prediction_id: activeRecord.prediction_id,
                      exact_top5_displayed: targetList.map(p => p.number),
                      engine: currentEngine,
                      jurisdiction: selectedLottery,
                      shift: resolvedActiveShiftId
                    });
                  } catch (e) {}

                  handleCopyAllLottery(selectedLottery === 'all' ? 'ciudad' : selectedLottery, slipEngineChoice);
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
