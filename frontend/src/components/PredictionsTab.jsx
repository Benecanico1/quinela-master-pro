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
  syncRemoteOfficialDraws,
  SIGNIFICADOS
} from '../services/clientEngine';
import { 
  getMLPredictions, 
  getMLTrendPredictions, 
  getThreeEnginesComparativeStats, 
  ML_MODEL_METADATA 
} from '../services/mlPredictionEngine';
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
  const [engineFilter, setEngineFilter] = useState('all'); // 'all' | 'ml' | 'trend' | 'baseline'
  const [expandedSections, setExpandedSections] = useState({
    'active-ml': true,
    'active-trend': true,
    'active-baseline': true,
    'closed-ml': true,
    'closed-trend': true,
    'closed-baseline': true
  });
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
  const [chartTimeframe, setChartTimeframe] = useState('diario'); // 'diario' | 'semanal' | 'mensual'
  const [drawsSyncVersion, setDrawsSyncVersion] = useState(0);
  const [expandedMetadata, setExpandedMetadata] = useState({}); // Collapsed by default
  const [dailyAuditModalEngine, setDailyAuditModalEngine] = useState(null); // Modal de auditoría interactiva diaria

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Auto-sync official draws from LOTBA / remote backend on mount
  useEffect(() => {
    syncRemoteOfficialDraws().then(() => {
      setDrawsSyncVersion(v => v + 1);
    }).catch(() => {});
  }, []);

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

  // Predictions object for active shift (fallback, labels, redoblonas)
  const mlPredictionsActive = useMemo(() => {
    try {
      return getMLPredictions(selectedLottery, cleanActiveShift, 15);
    } catch (e) {
      return { shift_name: liveShiftInfo?.name || 'La Previa', shift_time: liveShiftInfo?.timeStr || '10:15', top_predictions: [], suggested_redoblonas: [] };
    }
  }, [selectedLottery, cleanActiveShift, liveShiftInfo]);

  // Pre-draw lock for active upcoming shift strictly before deadline
  try {
    ensureAllUpcomingCanonicalRecords(todayStr, cleanActiveShift);
  } catch (e) {
    console.warn("Pre-draw locking error:", e);
  }

  const rawMLActive = getOrLockUpcomingCanonicalPrediction(todayStr, cleanJur, cleanActiveShift, 'ML-FULL');
  const rawTrendActive = getOrLockUpcomingCanonicalPrediction(todayStr, cleanJur, cleanActiveShift, 'ML-TREND');
  const rawStatActive = getOrLockUpcomingCanonicalPrediction(todayStr, cleanJur, cleanActiveShift, 'STATISTICAL');

  // STRICT COMPOSITE KEY VALIDATION (date + jurisdiction + shift + engine)
  // Guarantees zero leakage or carryover from other shifts/jurisdictions
  const canonicalMLActive = (rawMLActive && 
    rawMLActive.date === todayStr && 
    rawMLActive.jurisdiction === cleanJur && 
    rawMLActive.shift === cleanActiveShift && 
    rawMLActive.engine_id === 'ML-FULL') ? rawMLActive : null;

  const canonicalTrendActive = (rawTrendActive && 
    rawTrendActive.date === todayStr && 
    rawTrendActive.jurisdiction === cleanJur && 
    rawTrendActive.shift === cleanActiveShift && 
    rawTrendActive.engine_id === 'ML-TREND') ? rawTrendActive : null;

  const canonicalStatActive = (rawStatActive && 
    rawStatActive.date === todayStr && 
    rawStatActive.jurisdiction === cleanJur && 
    rawStatActive.shift === cleanActiveShift && 
    rawStatActive.engine_id === 'STATISTICAL') ? rawStatActive : null;

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
    try {
      const live = getMLPredictions(cleanJur, resolvedActiveShiftId, 5);
      const list = (live?.top_predictions || []).map(p => p.number);
      if (list.length > 0) return formatItemsFromTop5(list);
    } catch (e) {}
    return [];
  }, [canonicalMLActive, cleanActiveShift, cleanJur, todayStr, resolvedActiveShiftId]);

  const trendTop5Active = useMemo(() => {
    if (canonicalTrendActive && 
        canonicalTrendActive.status === 'LOCKED' && 
        canonicalTrendActive.shift === cleanActiveShift &&
        canonicalTrendActive.jurisdiction === cleanJur &&
        canonicalTrendActive.date === todayStr &&
        Array.isArray(canonicalTrendActive.top_5) && 
        canonicalTrendActive.top_5.length > 0) {
      return formatItemsFromTop5(canonicalTrendActive.top_5);
    }
    try {
      const live = getMLTrendPredictions(cleanJur, resolvedActiveShiftId, 5);
      const list = (live?.top_predictions || []).map(p => p.number);
      if (list.length > 0) return formatItemsFromTop5(list);
    } catch (e) {}
    return [];
  }, [canonicalTrendActive, cleanActiveShift, cleanJur, todayStr, resolvedActiveShiftId]);

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
    try {
      const live = getClientPredictions(cleanJur, resolvedActiveShiftId, 5);
      const list = (live?.top_predictions || live?.predictions || []).map(p => p.number);
      if (list.length > 0) return formatItemsFromTop5(list);
    } catch (e) {}
    return [];
  }, [canonicalStatActive, cleanActiveShift, cleanJur, todayStr, resolvedActiveShiftId]);

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
  const canonicalClosedTrend = getCanonicalPrediction(todayStr, cleanJur, closedShiftId, 'ML-TREND');
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

  const trendTop5Closed = useMemo(() => {
    if (canonicalClosedTrend && 
        canonicalClosedTrend.status === 'LOCKED' && 
        canonicalClosedTrend.shift === closedShiftId &&
        canonicalClosedTrend.jurisdiction === cleanJur &&
        canonicalClosedTrend.date === todayStr &&
        Array.isArray(canonicalClosedTrend.top_5) && 
        canonicalClosedTrend.top_5.length > 0) {
      return formatItemsFromTop5(canonicalClosedTrend.top_5);
    }
    return [];
  }, [canonicalClosedTrend, closedShiftId, cleanJur, todayStr]);

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
    Boolean(canonicalClosedML && canonicalClosedML.status === 'LOCKED') ||
    Boolean(canonicalClosedTrend && canonicalClosedTrend.status === 'LOCKED');

  // Unified evaluation for closed shift items using pure evaluateCanonicalPrediction
  // STRICT JURISDICTION ISOLATION: Ciudad never evaluates with Provincia, Provincia never evaluates with Ciudad
  const evaluateItemInClosedShift = (candNumber, engineKey) => {
    const targetDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
    const targetRecord = engineKey === 'ml' 
      ? canonicalClosedML 
      : engineKey === 'trend' 
        ? canonicalClosedTrend 
        : canonicalClosedStat;

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
      : chosenEngine === 'trend'
        ? getMLTrendPredictions(lotteryKey, resolvedActiveShiftId, 15)
        : getClientPredictions(lotteryKey, resolvedActiveShiftId, 15);
    const predictionsList = isVip ? lotData.top_predictions.slice(0, 5) : [lotData.top_predictions[0]];
    const engineTag = chosenEngine === 'ml' 
      ? '🧠 Motor IA / ML (Champion)' 
      : chosenEngine === 'trend'
        ? '🚀 Motor IA ML (Tendencia & Momentum)'
        : '📊 Motor Estadístico (Frecuencias)';

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
    setCopyStatus(`¡Copiadas recomendaciones de ${lotteryKey === 'ciudad' ? 'Nacional' : 'Provincia'} (${chosenEngine === 'ml' ? 'IA Champion' : chosenEngine === 'trend' ? 'IA Tendencia' : 'Estadístico'})! 📋✨`);
    setTimeout(() => setCopyStatus(''), 2500);
  };

  const handleCopyDailySummaryForSocialMedia = () => {
    const ciudadML = getMLPredictions('ciudad', resolvedActiveShiftId, 5);
    const provML = getMLPredictions('provincia', resolvedActiveShiftId, 5);
    const ciudadTrend = getMLTrendPredictions('ciudad', resolvedActiveShiftId, 5);
    const provTrend = getMLTrendPredictions('provincia', resolvedActiveShiftId, 5);
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

    // 2. FILA IA ML TENDENCIA (FAST MOMENTUM)
    postText += `🚀 *FILA 2: MOTOR IA ML — TENDENCIA & MOMENTUM (ML-TREND):*\n`;
    postText += `🏛️ *Ciudad (Nacional):* `;
    postText += ciudadTrend.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n🌿 *Provincia (Bs As):* `;
    postText += provTrend.top_predictions.slice(0, 5).map((p, i) => `[${i+1}] ${p.number}`).join(' | ');
    postText += `\n\n`;

    // 3. FILA MOTOR ESTADÍSTICO
    postText += `📊 *FILA 3: MOTOR ESTADÍSTICO (FRECUENCIAS & ATRASOS):*\n`;
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
    setCopyStatus('¡Pronósticos copiados para WhatsApp! 📢✨');
    setTimeout(() => setCopyStatus(''), 3000);
  };

  const handleQuickGenerate = () => {
    const list = slipEngineChoice === 'trend' ? trendTop5Active : slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
    const randomPick = (list && list.length > 0)
      ? (isVip ? list[Math.floor(Math.random() * list.length)] : list[0])
      : { number: '13', significado: 'La Suerte', composite_score: 85 };
    setGeneratedTicket({
      ambo: randomPick.number,
      significado: randomPick.significado,
      target_lottery_label: randomPick.target_lottery_label,
      score: randomPick.composite_score,
      engine: slipEngineChoice === 'trend' ? 'ML-TREND (#1)' : slipEngineChoice === 'ml' ? 'ML-FULL (IA)' : 'Estadístico Base',
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

  // Helper to render an Engine Row (Accordion Collapsible + Top 5 cards)
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
    isClosedSection = false,
    shiftDisplayName = '',
    shiftDisplayTime = ''
  }) => {
    const sectionKey = isClosedSection ? `closed-${engineKey}` : `active-${engineKey}`;
    const isSectionExpanded = Boolean(expandedSections[sectionKey]);
    const previewNumbers = (predictionsList || []).slice(0, 5).map(p => p.number);
    const isMetaOpen = Boolean(expandedMetadata[sectionKey]);

    const resolvedShiftTitle = shiftDisplayName 
      ? `${shiftDisplayName} ${shiftDisplayTime ? `${shiftDisplayTime} hs` : ''}`.trim()
      : (canonicalRecord?.shift ? `${canonicalRecord.shift.toUpperCase()} ${canonicalRecord.draw_time || ''} hs` : '');

    return (
      <div className={`rounded-2xl border transition-all duration-200 shadow-md ${
        isSectionExpanded 
          ? 'bg-slate-900/95 border-amber-500/50 ring-1 ring-amber-500/20' 
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
      }`}>
        {/* Row Header (Clickable Accordion Trigger) */}
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-3 sm:p-3.5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer rounded-2xl transition-colors hover:bg-slate-800/40"
        >
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xl shrink-0">{engineKey === 'ml' ? '🧠' : engineKey === 'trend' ? '🚀' : '📊'}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Sorteo y Hora al lado del icono */}
                {resolvedShiftTitle && (
                  <span className="text-xs px-2 py-0.5 rounded-md font-mono font-black bg-amber-500 text-slate-950 shadow-sm flex items-center gap-1">
                    <span>⏰</span>
                    <span>{resolvedShiftTitle}</span>
                  </span>
                )}
                <span className="text-xs sm:text-sm font-black text-white">{title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${tagColor}`}>
                  {tag}
                </span>
                {isSealed && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> LOCKED
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10.5px] font-mono shrink-0 self-end sm:self-auto">
            {/* Top 5 Preview Pill when collapsed */}
            {!isSectionExpanded && previewNumbers.length > 0 && (
              <div className="hidden xs:flex items-center gap-1 bg-slate-950/80 border border-slate-700/80 px-2 py-0.5 rounded-lg text-amber-300 font-black text-[11px]">
                <span className="text-slate-400 font-bold text-[9.5px]">Top:</span>
                <span>{previewNumbers.join(' • ')}</span>
              </div>
            )}

            <span className={`px-2 py-0.5 rounded-md ${statusColor} font-bold flex items-center gap-1`}>
              <Lock className="w-2.5 h-2.5" />
              {statusText}
            </span>

            <div className="flex items-center gap-1 text-slate-400 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800 text-[10px]">
              <span className="text-amber-400 font-bold">
                {isSectionExpanded ? 'Contraer' : 'Ver Detalles'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-300 ${isSectionExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>

        {/* Collapsible Content */}
        {isSectionExpanded && (
          <div className="p-3 sm:p-4 pt-0 space-y-3 animate-fadeIn border-t border-slate-800/80">
            {/* Traceability Metadata Bar (CONTRAÍBLE - Contraído por defecto) */}
            {canonicalRecord && (
              <div className="mt-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-slate-300 overflow-hidden shadow-inner">
                <button
                  type="button"
                  onClick={() => setExpandedMetadata(prev => ({ ...prev, [sectionKey]: !prev[sectionKey] }))}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-bold text-slate-300">
                      Datos de Auditoría Oficial & Criptografía (Estado, Jurisdicción, Horario, Hash)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-[9.5px]">
                    <span className="text-amber-400 font-medium">
                      {isMetaOpen ? 'Ocultar datos' : 'Ver datos técnicos'}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-amber-400 transition-transform duration-200 ${isMetaOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isMetaOpen && (
                  <div className="p-2.5 pt-1 border-t border-slate-800/80 space-y-1.5 animate-fadeIn">
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
              </div>
            )}

            {/* 5 Cards Grid or Loading/Unregistered State */}
            {(!predictionsList || predictionsList.length === 0) ? (
              <div className="p-4 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 font-mono text-xs space-y-1 mt-2">
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
              <div className="space-y-2 pt-1">
                {/* 1. PRIMERA LÍNEA: EL QUE VA A LA CABEZA (#1) - Destacado y Claro */}
                {(() => {
                  const cand = predictionsList[0];
                  if (!cand) return null;
                  const idx = 0;
                  const hitInfo = isClosedSection ? evaluateItemInClosedShift(cand.number, engineKey) : null;
                  const isExpanded = expandedIndex === `${engineKey}-${idx}`;

                  return (
                    <div
                      key={`${engineKey}-${cand.number}-${idx}`}
                      onClick={() => setExpandedIndex(isExpanded ? null : `${engineKey}-${idx}`)}
                      className={`rounded-xl p-2.5 sm:p-3 transition-all border cursor-pointer relative ${
                        hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                          ? 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/60 border-amber-400 shadow-lg ring-1 ring-amber-400/60'
                          : hitInfo?.is_hit
                            ? 'bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40'
                            : !isClosedSection
                              ? 'bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/50 shadow-md'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Indicador A LA CABEZA */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-md font-mono font-black bg-amber-500 text-slate-950 uppercase tracking-wide flex items-center gap-1 shadow-sm">
                            <span>👑 #1 A LA CABEZA</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold hidden xs:inline">
                            Fiabilidad: {cand.composite_score || cand.predictive_score}%
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400">
                            T: <strong className="text-white font-bold">{cand.suggested_centenas?.[0] || `7${cand.number}`}</strong> • C: <strong className="text-white font-bold">{cand.suggested_millar?.[0] || `17${cand.number}`}</strong>
                          </span>
                          {!isClosedSection && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTraceCandidate(cand);
                              }}
                              className="px-1.5 py-0.5 text-[9px] font-bold text-amber-300 hover:text-amber-200 bg-amber-950/60 border border-amber-500/30 rounded flex items-center gap-0.5"
                            >
                              <HelpCircle className="w-2.5 h-2.5" />
                              <span>¿Por qué?</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo del Número a la cabeza */}
                      <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-slate-800/60">
                        <div className="flex items-baseline gap-2.5">
                          <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                            hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                              ? 'text-amber-300 animate-pulse'
                              : hitInfo?.is_hit
                                ? 'text-emerald-300'
                                : 'text-amber-400'
                          }`}>
                            {cand.number}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-200 font-bold">
                            "{cand.significado}"
                          </span>
                        </div>

                        {isClosedSection && (
                          <div>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
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
                      </div>
                    </div>
                  );
                })()}

                {/* 2. SEGUNDA LÍNEA: LOS OTROS CUATRO NÚMEROS (TOP #2 A #5) UNO AL LADO DEL OTRO */}
                <div className="grid grid-cols-2 xs:grid-cols-4 gap-1.5 sm:gap-2">
                  {predictionsList.slice(1, 5).map((cand, localIdx) => {
                    const idx = localIdx + 1;
                    const isLocked = !isVip && idx > 0;
                    const hitInfo = isClosedSection ? evaluateItemInClosedShift(cand.number, engineKey) : null;

                    if (isLocked) {
                      return (
                        <div
                          key={`${engineKey}-${cand.number}-${idx}`}
                          onClick={onOpenUpgrade}
                          className="relative rounded-xl p-2 bg-slate-950/70 border border-slate-800/80 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-amber-500/50 transition-all min-h-[72px]"
                        >
                          <div className="filter blur-sm select-none opacity-20 text-center">
                            <span className="text-lg font-black font-mono">{cand.number}</span>
                          </div>
                          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-1 bg-slate-950/85 backdrop-blur-xs text-center">
                            <Crown className="w-3 h-3 text-amber-400 mb-0.5" />
                            <div className="text-[9.5px] font-black text-white">Top #{idx + 1}</div>
                            <span className="text-[8px] text-amber-300 font-bold bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                              VIP
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
                        className={`rounded-xl p-1.5 sm:p-2 transition-all border cursor-pointer relative flex flex-col justify-between ${
                          hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                            ? 'bg-gradient-to-b from-amber-950/60 to-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                            : hitInfo?.is_hit
                              ? 'bg-gradient-to-b from-emerald-950/50 to-slate-950 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Cabecera miniatura */}
                        <div className="flex items-center justify-between pb-0.5 border-b border-slate-800/80 text-[8.5px] sm:text-[9px]">
                          <span className="font-mono font-bold text-slate-400">
                            #{idx + 1} {idx === 1 ? '• 5' : idx < 4 ? '• 10' : '• 20'}
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {cand.composite_score || cand.predictive_score}%
                          </span>
                        </div>

                        {/* Número grande y significado */}
                        <div className="my-1 text-center">
                          <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight block ${
                            hitInfo?.is_hit && hitInfo.hit_type === 'CABEZA'
                              ? 'text-amber-300'
                              : hitInfo?.is_hit
                                ? 'text-emerald-300'
                                : 'text-white'
                          }`}>
                            {cand.number}
                          </span>
                          <span className="text-[9px] text-slate-300 block truncate" title={cand.significado}>
                            "{cand.significado}"
                          </span>
                        </div>

                        {/* Terno / Cuaterno en línea pequeña */}
                        <div className="text-[8px] font-mono text-slate-400 text-center pt-0.5 border-t border-slate-800/60 flex items-center justify-center gap-1.5 flex-wrap">
                          <span>T:<strong className="text-slate-200">{cand.suggested_centenas?.[0] || `7${cand.number}`}</strong></span>
                          <span>C:<strong className="text-slate-200">{cand.suggested_millar?.[0] || `17${cand.number}`}</strong></span>
                        </div>

                        {/* Hit Result Badge in Closed Section */}
                        {isClosedSection && (
                          <div className="mt-1 pt-0.5 border-t border-slate-800/80">
                            <span className={`w-full block text-center text-[8.5px] font-mono font-bold px-0.5 py-0.2 rounded ${
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
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Banner de Aviso cuando el VIP está Vencido */}
      {!isVip && (
        <div className="p-3.5 bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 border border-amber-500/50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>Tu período VIP ha expirado (Viendo 1 pronóstico)</span>
                <span className="text-[9px] bg-rose-500/30 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-mono">Modo Limitado</span>
              </h4>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ¿Quieres tener los pronósticos completos de cada motor? Comunícate con el administrador o activa tus 30 días premium.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenUpgrade}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Pagar 30 Días Premium ($5 USD)</span>
          </button>
        </div>
      )}

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

      {/* 2. Título & Auditoría General */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Pronósticos Oficiales — Triple Motor IA</span>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              Ranking & Transparencia Total
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Comparativa simultánea de 3 motores independientes: IA Champion, IA Tendencia y Motor Estadístico.
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
            Hasta 77.25% HitRate@5
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PODIO & GRÁFICA VERTICAL DE RENDIMIENTO MENSUAL CONSOLIDADO (ÚLTIMOS 30 DÍAS) */}
      {/* ========================================================================= */}
      {/* SECCIÓN RANKING DE EFECTIVIDAD Y GRÁFICA COMPARATIVA DE LOS 3 MOTORES      */}
      {/* ========================================================================= */}
      {(() => {
        const stats = getThreeEnginesComparativeStats(chartTimeframe);
        return (
          <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5 flex-wrap">
                    <span>Ranking de Efectividad Auditada</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold">
                      {stats.periodBadge}
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {stats.periodSubtitle}
                  </p>
                </div>
              </div>

              {/* Selector de Marco Temporal: Diario (predeterminado), Semanal, Mensual */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setChartTimeframe('diario')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                    chartTimeframe === 'diario'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rendimiento de los sorteos oficiales de hoy (Predomina)"
                >
                  <span>⚡ Diario</span>
                  {chartTimeframe === 'diario' && (
                    <span className="text-[8px] bg-slate-950 text-amber-300 px-1 py-0.2 rounded font-black">HOY</span>
                  )}
                </button>
                <button
                  onClick={() => setChartTimeframe('semanal')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                    chartTimeframe === 'semanal'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rendimiento últimos 7 días (30 sorteos)"
                >
                  <span>📅 Semanal</span>
                </button>
                <button
                  onClick={() => setChartTimeframe('mensual')}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                    chartTimeframe === 'mensual'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Rendimiento acumulado de 30 días (130 sorteos)"
                >
                  <span>📊 Mensual</span>
                </button>
              </div>

              <div className="text-[10px] font-mono font-bold text-amber-300 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-slate-800 w-full sm:w-auto text-right sm:text-left">
                🥇 Recomendado: <strong className="text-white">{stats.leader?.name}</strong> ({stats.leader?.top5RateText})
              </div>
            </div>

            {/* Gráfica de Columnas Verticales (Crecimiento de Abajo hacia Arriba) */}
            <div className="pt-2">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between flex-wrap gap-1">
                <span>📈 Rendimiento {chartTimeframe === 'diario' ? 'Diario (Hoy)' : chartTimeframe === 'semanal' ? 'Semanal (7 Días)' : 'Mensual Acumulado'} (Gráfica Ascendente)</span>
                <span className="text-amber-400 text-[9.5px] font-mono font-bold">{stats.samplePeriodText}</span>
              </div>

              <div className="h-48 sm:h-52 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex items-end justify-around gap-2 relative shadow-inner">
                {/* Guías horizontales de referencia (Grid) */}
                <div className="absolute inset-x-3 top-6 border-b border-slate-800/60 pointer-events-none flex justify-end">
                  <span className="text-[8px] font-mono text-slate-600 -mt-2.5">80%</span>
                </div>
                <div className="absolute inset-x-3 top-16 border-b border-slate-800/60 pointer-events-none flex justify-end">
                  <span className="text-[8px] font-mono text-slate-600 -mt-2.5">60%</span>
                </div>
                <div className="absolute inset-x-3 top-28 border-b border-slate-800/60 pointer-events-none flex justify-end">
                  <span className="text-[8px] font-mono text-slate-600 -mt-2.5">40%</span>
                </div>

                {stats.rankedEngines.map((eng) => {
                  const isSelected = engineFilter === 'all' || engineFilter === eng.engineKey;
                  return (
                    <div 
                      key={eng.id}
                      onClick={() => setDailyAuditModalEngine(eng)}
                      title={`Toca para ver los números con tendencia y aciertos de ${eng.name}`}
                      className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer transition-all duration-300 group z-10 ${
                        !isSelected ? 'opacity-50 hover:opacity-100' : 'opacity-100'
                      }`}
                    >
                      {/* Porcentaje y Total de Aciertos en la cima de la barra */}
                      <div className="mb-1 text-center transition-transform group-hover:-translate-y-1">
                        <span className={`text-[11px] sm:text-xs font-black font-mono block ${
                          eng.isLeader ? 'text-amber-300' : 'text-slate-200'
                        }`}>
                          {eng.top5RateText}
                        </span>
                        <span className="text-[9px] font-mono text-emerald-400 font-bold block">
                          {eng.monthlyAciertosPizarra}
                        </span>
                        <span className="text-[9px] block">
                          {eng.medal}
                        </span>
                      </div>

                      {/* Barra Vertical con track de altura fija h-28 sm:h-32 (Sube/Baja dinámicamente) */}
                      <div className="w-full max-w-[60px] sm:max-w-[78px] h-28 sm:h-32 bg-slate-900/90 rounded-t-xl overflow-hidden p-0.5 flex flex-col justify-end border border-slate-700/60 shadow-lg relative group-hover:border-amber-400/80 transition-all">
                        <div 
                          className={`w-full rounded-t-lg transition-all duration-700 ease-out shadow-inner relative flex flex-col justify-between ${
                            eng.top5RateNum > 0 ? eng.colorBar : 'bg-slate-800/80 border-t border-slate-600/50'
                          }`}
                          style={{ height: eng.top5RateNum > 0 ? `${Math.max(10, eng.top5RateNum)}%` : '4%' }}
                        >
                          {eng.top5RateNum > 0 ? (
                            <div className="w-full h-full bg-gradient-to-t from-transparent via-white/10 to-white/30 rounded-t-lg" />
                          ) : (
                            <div className="w-full h-0.5 bg-slate-700/60" />
                          )}
                        </div>
                      </div>

                      {/* Etiqueta / Nombre del Motor en la base */}
                      <div className="mt-2 text-center w-full">
                        <span className={`text-[10px] sm:text-[11px] font-black truncate block group-hover:text-amber-300 transition-colors ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}>
                          {eng.icon} {eng.name}
                        </span>
                        <span className="text-[8px] text-amber-400 font-mono font-bold block mt-0.5">
                          🔍 Ver números ↗
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Podio Resumen en UNA SOLA LÍNEA (Los 3 Motores en 3 columnas) */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {stats.rankedEngines.map((eng) => {
                const hitsCount = eng.liveData?.hits ?? eng.monthlyAciertosPizarraNum ?? 0;
                const hasPrize = hitsCount > 0;

                return (
                  <div 
                    key={eng.id}
                    onClick={() => setDailyAuditModalEngine(eng)}
                    title={`Toca para ver descripción, números y detalles de ${eng.name}`}
                    className={`p-2 rounded-xl border transition-all cursor-pointer text-center hover:border-amber-400/80 hover:shadow-lg flex flex-col justify-between ${
                      engineFilter === eng.engineKey || (engineFilter === 'all' && eng.isLeader)
                        ? 'bg-slate-900/95 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Medalla + Nombre */}
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-xs sm:text-sm shrink-0">{eng.medal}</span>
                      <span className="text-[10px] sm:text-xs font-black text-white truncate">
                        {eng.name.replace('Motor ', '')}
                      </span>
                    </div>

                    {/* Si ha dado premio o si no ha dado premio el día de hoy */}
                    <div className="my-0.5">
                      {hasPrize ? (
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded-lg text-[8.5px] sm:text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 w-full">
                          ✅ Con premio ({hitsCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center px-1 py-0.5 rounded-lg text-[8.5px] sm:text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 w-full">
                          ⚪ Sin premio
                        </span>
                      )}
                    </div>

                    {/* Indicador sutil para abrir detalles */}
                    <span className="text-[7.5px] sm:text-[8px] text-amber-400/80 font-mono font-bold block mt-0.5">
                      ℹ️ Ver info ↗
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 3. Selector de Lotería y Selector de Visualización (4 Opciones) */}
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

        {/* Selector de Modo de Visualización (4 Botones: Todos / Champion / Tendencia / Estadístico) */}
        <div className="grid grid-cols-4 gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow">
          <button
            onClick={() => setEngineFilter('all')}
            className={`py-1.5 px-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              engineFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Ver los 3 motores en simultáneo"
          >
            <span>🌟 Todos (3)</span>
          </button>
          <button
            onClick={() => setEngineFilter('trend')}
            className={`py-1.5 px-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              engineFilter === 'trend'
                ? 'bg-amber-500 text-slate-950 shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Motor #1 en densidad Top 5 (77.25%)"
          >
            <span>🚀 Tendencia</span>
          </button>
          <button
            onClick={() => setEngineFilter('ml')}
            className={`py-1.5 px-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              engineFilter === 'ml'
                ? 'bg-indigo-600 text-white shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Motor Champion en Pizarra 20 (74.25%)"
          >
            <span>🧠 Champion</span>
          </button>
          <button
            onClick={() => setEngineFilter('baseline')}
            className={`py-1.5 px-1.5 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 truncate ${
              engineFilter === 'baseline'
                ? 'bg-blue-600 text-white shadow font-black'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Motor Tradicional de Frecuencias y Atrasos"
          >
            <span>📊 Clásico</span>
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
              const currentEngine = slipEngineChoice === 'trend' ? 'ML-TREND' : slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
              const activeRecord = getOrCreateCanonicalPrediction(todayStr, selectedLottery === 'all' ? 'ciudad' : selectedLottery, resolvedActiveShiftId, currentEngine);
              const top5 = (slipEngineChoice === 'trend' ? trendTop5Active : slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active).map(p => p.number);
              recordCouponSnapshot({
                prediction_id: activeRecord?.prediction_id || `SNAPSHOT_${todayStr}`,
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
              1. Próximo Sorteo a Jugar: <span className="text-amber-400">{liveShiftInfo?.name || mlPredictionsActive.shift_name}</span> ({liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15'} hs)
            </h3>
          </div>
          <div className="text-[10px] font-mono text-amber-300 font-bold bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
            ⏳ Cierra en: {liveShiftInfo.formattedTimeLeft}
          </div>
        </div>

        {/* MOTOR #1: IA ML TENDENCIA (FAST MOMENTUM - #1 EN EFECTIVIDAD TOP 5) */}
        {(engineFilter === 'all' || engineFilter === 'trend') && renderEngineRow({
          engineKey: 'trend',
          shiftDisplayName: liveShiftInfo?.name || mlPredictionsActive.shift_name,
          shiftDisplayTime: liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15',
          title: 'IA Tendencia (ML-TREND)',
          subtitle: 'Aceleración de ciclo corto y dinámica de 20 sorteos. Máxima densidad en Top 5 (#1 con 77.25%)',
          tag: '#1 en Top 5 (77.25%)',
          tagColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          statusText: 'LOCKED',
          statusColor: 'bg-amber-950 text-amber-400 border border-amber-500/30',
          timestampText: `Deadline: ${canonicalTrendActive?.draw_time || liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15'} hs`,
          isSealed: true,
          canonicalRecord: canonicalTrendActive,
          predictionsList: trendTop5Active,
          isClosedSection: false
        })}

        {/* MOTOR #2: IA ML CHAMPION (22 FEATURES CAUSALES - LÍDER EN PIZARRA 20) */}
        {(engineFilter === 'all' || engineFilter === 'ml') && renderEngineRow({
          engineKey: 'ml',
          shiftDisplayName: liveShiftInfo?.name || mlPredictionsActive.shift_name,
          shiftDisplayTime: liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15',
          title: 'IA Champion (ML-FULL)',
          subtitle: 'Redes Neuronales y Regresión Logística L2 con 22 Features Causales y Temporales (74.25% en 20 Pzas)',
          tag: 'Champion Pizarra 20',
          tagColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
          statusText: 'LOCKED',
          statusColor: 'bg-emerald-950 text-emerald-400 border border-emerald-500/30',
          timestampText: `Deadline: ${canonicalMLActive?.draw_time || liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15'} hs`,
          isSealed: true,
          canonicalRecord: canonicalMLActive,
          predictionsList: mlTop5Active,
          isClosedSection: false
        })}

        {/* MOTOR #3: ESTADÍSTICO CLÁSICO (FRECUENCIAS & ATRASOS) */}
        {(engineFilter === 'all' || engineFilter === 'baseline') && renderEngineRow({
          engineKey: 'baseline',
          shiftDisplayName: liveShiftInfo?.name || mlPredictionsActive.shift_name,
          shiftDisplayTime: liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15',
          title: 'Motor Estadístico Clásico',
          subtitle: 'Análisis Probabilístico Tradicional de Frecuencias, Atrasos y Rezagados Históricos (61.25%)',
          tag: 'Estadístico Tradicional',
          tagColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
          statusText: 'LOCKED',
          statusColor: 'bg-blue-950 text-blue-400 border border-blue-500/30',
          timestampText: `Deadline: ${canonicalStatActive?.draw_time || liveShiftInfo?.timeStr || mlPredictionsActive.shift_time || '10:15'} hs`,
          isSealed: true,
          canonicalRecord: canonicalStatActive,
          predictionsList: statTop5Active,
          isClosedSection: false
        })}
      </div>

      {/* ========================================================================= */}
      {/* BLOQUE 2: ÚLTIMO SORTEO CERRADO (AUDITORÍA OFICIAL COMPROBABLE) */}
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
              Auditoría de aciertos exactos de cada motor vs el extracto oficial de la lotería.
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

        {/* Auditoría de Aciertos IA Tendencia */}
        {(() => {
          const targetClosedDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
          const evalClosedTrend = targetClosedDraw && canonicalClosedTrend ? evaluateCanonicalPrediction(canonicalClosedTrend, targetClosedDraw) : null;
          const isClosedTrendEvaluated = Boolean(evalClosedTrend && evalClosedTrend.is_evaluated);

          return (engineFilter === 'all' || engineFilter === 'trend') && renderEngineRow({
            engineKey: 'trend',
            shiftDisplayName: lastClosed.name,
            shiftDisplayTime: lastClosed.timeStr,
            title: 'Auditoría — IA Tendencia (ML-TREND)',
            subtitle: 'Verificación de aciertos del modelo de aceleración rápida en extracto oficial',
            tag: 'ML-TREND Auditado',
            tagColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
            statusText: isClosedTrendEvaluated ? 'EVALUADO' : '⏳ Sorteo cerrado — esperando resultado oficial',
            statusColor: isClosedTrendEvaluated ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/40',
            timestampText: `Cerrado: ${lastClosed.timeStr} hs`,
            isSealed: Boolean(canonicalClosedTrend && canonicalClosedTrend.status === 'LOCKED'),
            canonicalRecord: canonicalClosedTrend,
            predictionsList: trendTop5Closed,
            isClosedSection: true
          });
        })()}

        {/* Auditoría de Aciertos IA Champion */}
        {(() => {
          const targetClosedDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
          const evalClosedML = targetClosedDraw && canonicalClosedML ? evaluateCanonicalPrediction(canonicalClosedML, targetClosedDraw) : null;
          const isClosedMLEvaluated = Boolean(evalClosedML && evalClosedML.is_evaluated);

          return (engineFilter === 'all' || engineFilter === 'ml') && renderEngineRow({
            engineKey: 'ml',
            shiftDisplayName: lastClosed.name,
            shiftDisplayTime: lastClosed.timeStr,
            title: 'Auditoría — IA Champion (ML-FULL)',
            subtitle: 'Verificación de aciertos del modelo Champion (22 features) en extracto oficial',
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

        {/* Auditoría de Aciertos Estadístico */}
        {(() => {
          const targetClosedDraw = cleanJur === 'provincia' ? provinciaDraw : ciudadDraw;
          const evalClosedStat = targetClosedDraw && canonicalClosedStat ? evaluateCanonicalPrediction(canonicalClosedStat, targetClosedDraw) : null;
          const isClosedStatEvaluated = Boolean(evalClosedStat && evalClosedStat.is_evaluated);

          return (engineFilter === 'all' || engineFilter === 'baseline') && renderEngineRow({
            engineKey: 'baseline',
            shiftDisplayName: lastClosed.name,
            shiftDisplayTime: lastClosed.timeStr,
            title: 'Auditoría — Motor Estadístico Clásico',
            subtitle: 'Verificación de aciertos de frecuencias y atrasos en extracto oficial',
            tag: 'Estadístico Auditado',
            tagColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
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

            {/* Selector de Motor dentro del Cupón (3 Opciones) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setSlipEngineChoice('trend')}
                className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                  slipEngineChoice === 'trend'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="IA ML Tendencia (#1 Top 5 - 77.25%)"
              >
                🚀 Tendencia (#1)
              </button>
              <button
                type="button"
                onClick={() => setSlipEngineChoice('ml')}
                className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                  slipEngineChoice === 'ml'
                    ? 'bg-indigo-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="IA ML Champion (74.25% en 20)"
              >
                🧠 Champion
              </button>
              <button
                type="button"
                onClick={() => setSlipEngineChoice('baseline')}
                className={`py-1.5 px-1 rounded-lg font-bold transition-all cursor-pointer truncate ${
                  slipEngineChoice === 'baseline'
                    ? 'bg-blue-600 text-white font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Motor Estadístico Tradicional"
              >
                📊 Estadístico
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
                  BOLETA OFICIAL RECOMENDADA ({slipEngineChoice === 'trend' ? 'IA ML-TREND (#1)' : slipEngineChoice === 'ml' ? 'IA ML-FULL' : 'ESTADÍSTICO'})
                </span>
                <span className="text-xs font-black text-amber-400">
                  MOSTRAR EN VENTANILLA AL JUGAR
                </span>
              </div>

              {/* Números Principales */}
              <div className="space-y-2">
                {(slipEngineChoice === 'trend' ? trendTop5Active : slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active).map((item, idx) => (
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
                  const targetList = slipEngineChoice === 'trend' ? trendTop5Active : slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
                  try {
                    const currentEngine = slipEngineChoice === 'trend' ? 'ML-TREND' : slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
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
                  const engineTitle = slipEngineChoice === 'trend' ? 'MOTOR IA (ML-TREND #1)' : slipEngineChoice === 'ml' ? 'MOTOR IA (ML-FULL)' : 'MOTOR ESTADÍSTICO';
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
                    const currentEngine = slipEngineChoice === 'trend' ? 'ML-TREND' : slipEngineChoice === 'ml' ? 'ML-FULL' : 'STATISTICAL';
                    const activeRecord = getOrCreateCanonicalPrediction(todayStr, selectedLottery === 'all' ? 'ciudad' : selectedLottery, resolvedActiveShiftId, currentEngine);
                    const targetList = slipEngineChoice === 'trend' ? trendTop5Active : slipEngineChoice === 'ml' ? mlTop5Active : statTop5Active;
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

      {/* POP-UP MODAL: AUDITORÍA DETALLADA DE NÚMEROS Y ACIERTOS EN VIVO DEL DÍA */}
      {dailyAuditModalEngine && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="max-w-xl w-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl p-2 bg-slate-950 rounded-2xl border border-slate-800 shadow">
                  {dailyAuditModalEngine.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {dailyAuditModalEngine.name}
                    </h3>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {dailyAuditModalEngine.medal} {dailyAuditModalEngine.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Auditoría Oficial del Día • Números con Tendencia y Aciertos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDailyAuditModalEngine(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Descripción Técnica y Arquitectura del Motor (Clic para ver info) */}
            {dailyAuditModalEngine.description && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5 text-xs text-slate-300 leading-relaxed font-normal">
                <span className="text-amber-400 font-bold block mb-0.5">ℹ️ Arquitectura & Algoritmo:</span>
                {dailyAuditModalEngine.description}
              </div>
            )}

            {/* Resumen de Efectividad Inteligente de Hoy */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-inner">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-slate-400 font-bold">Rendimiento en Vivo de Hoy:</span>
                <span className="text-amber-300 font-mono font-black text-sm">
                  {dailyAuditModalEngine.top5RateText} ({dailyAuditModalEngine.monthlyAciertosPizarra} sorteos)
                </span>
              </div>

              {/* Barra de Progreso Dinámica */}
              <div className="w-full bg-slate-900 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/80 flex items-center shadow-inner">
                <div 
                  className={`h-full rounded-full ${dailyAuditModalEngine.colorBar} transition-all duration-700 shadow-md`}
                  style={{ width: `${Math.max(6, dailyAuditModalEngine.top5RateNum)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Sorteos Auditados</span>
                  <span className="text-sm font-black font-mono text-white">
                    {dailyAuditModalEngine.liveData?.totalCompleted || dailyAuditModalEngine.dailyBreakdown?.length || 0}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Aciertos Pizarra</span>
                  <span className="text-sm font-black font-mono text-emerald-400">
                    {dailyAuditModalEngine.monthlyAciertosPizarra}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase block font-bold">Impactos Totales</span>
                  <span className="text-sm font-black font-mono text-amber-300">
                    {dailyAuditModalEngine.totalOccurrences || 0} veces
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic">
                💡 La barra sube o baja automáticamente tras cada sorteo oficial según las coincidencias reales auditadas.
              </p>
            </div>

            {/* Sorteos Finalizados de Hoy con los Números y Aciertos */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                <span>📋 Sorteos Oficiales Finalizados de Hoy</span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {dailyAuditModalEngine.dailyBreakdown?.length || 0} sorteos
                </span>
              </h4>

              {(!dailyAuditModalEngine.dailyBreakdown || dailyAuditModalEngine.dailyBreakdown.length === 0) ? (
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                  Aguardando los primeros sorteos oficiales del día.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
                  {dailyAuditModalEngine.dailyBreakdown.map((drawItem, idx) => (
                    <div 
                      key={drawItem.draw_id || idx}
                      className={`p-3 rounded-xl border transition-all ${
                        drawItem.is_hit 
                          ? 'bg-gradient-to-r from-slate-950 via-emerald-950/20 to-slate-950 border-emerald-500/50 shadow-md'
                          : 'bg-slate-950/70 border-slate-800'
                      }`}
                    >
                      {/* Cabecera del Sorteo */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2 border-b border-slate-800/80 pb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10.5px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                            drawItem.lottery === 'ciudad'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {drawItem.lottery_name}
                          </span>
                          <span className="text-xs font-bold text-white capitalize">
                            {drawItem.shift_name} • {drawItem.shift_time} hs
                          </span>
                        </div>

                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-full border ${
                          drawItem.is_hit
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {drawItem.is_hit ? `✅ ${drawItem.positions.length} ${drawItem.positions.length === 1 ? 'Acierto' : 'Aciertos'}` : '⚪ Sin Acierto'}
                        </span>
                      </div>

                      {/* 1° Premio Oficial */}
                      <div className="flex items-center justify-between text-xs mb-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 font-medium">1° Premio Oficial:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-amber-400 text-sm">{drawItem.p1}</span>
                          <span className="text-[11px] text-slate-300">
                            (Ambo <strong>{drawItem.head_ambo}</strong> - {drawItem.significado})
                          </span>
                        </div>
                      </div>

                      {/* Números con Tendencia Dados por la IA para este sorteo */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Números con Tendencia (Top 5 Pronosticado):
                        </span>
                        <div className="grid grid-cols-5 gap-1 text-center">
                          {drawItem.top_5.map((num, nIdx) => {
                            const hitPos = drawItem.positions.find(p => p.number === num);
                            const isHead = drawItem.head_hit && drawItem.head_ambo === num;
                            return (
                              <div 
                                key={nIdx}
                                className={`p-1.5 rounded-lg border flex flex-col items-center justify-center transition-transform ${
                                  hitPos 
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-md font-black ring-2 ring-emerald-400/40 scale-105'
                                    : 'bg-slate-900 text-slate-200 border-slate-800'
                                }`}
                              >
                                <span className={`font-mono text-sm font-black ${hitPos ? 'text-slate-950' : 'text-white'}`}>
                                  {num}
                                </span>
                                <span className={`text-[8px] truncate max-w-full font-bold leading-tight mt-0.5 ${
                                  hitPos ? 'text-slate-950' : 'text-slate-400'
                                }`}>
                                  {hitPos ? `#${hitPos.position}° (${hitPos.multiplier?.split(' ')[0] || '7x'})` : (SIGNIFICADOS[num] || 'Ambo')}
                                </span>
                                {isHead && (
                                  <span className="text-[7.5px] bg-amber-400 text-slate-950 px-1 rounded font-black mt-0.5">
                                    👑 CABEZA
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Próximos Sorteos de Hoy (Pronósticos Sellados) */}
            {dailyAuditModalEngine.upcomingDraws && dailyAuditModalEngine.upcomingDraws.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center justify-between">
                  <span>⏳ Próximos Sorteos de Hoy (Pronósticos Sellados)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {dailyAuditModalEngine.upcomingDraws.length} sorteos pendientes
                  </span>
                </h4>
                <div className="space-y-2 max-h-[22vh] overflow-y-auto pr-1">
                  {dailyAuditModalEngine.upcomingDraws.map((upDraw, uIdx) => (
                    <div 
                      key={uIdx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>{upDraw.lottery === 'ciudad' ? '🏛️' : '🌿'}</span>
                          <span>{upDraw.lottery_name} — {upDraw.shift_name} ({upDraw.shift_time} hs)</span>
                        </span>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          🔒 Sellado Pre-Sorteo
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">Números con Tendencia:</span>
                        <div className="flex items-center gap-1">
                          {upDraw.top_5.map((n, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-slate-900 text-amber-300 border border-slate-800 rounded font-mono font-bold text-xs">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setEngineFilter(dailyAuditModalEngine.engineKey);
                  setDailyAuditModalEngine(null);
                }}
                className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Target className="w-4 h-4" />
                <span>Filtrar Pronósticos con {dailyAuditModalEngine.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setDailyAuditModalEngine(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
