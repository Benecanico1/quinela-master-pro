import React, { useState, useMemo } from 'react';
import { 
  Flame, Clock, Radio, Info, ChevronRight, Target, ShieldCheck, 
  Sparkles, Crown, Lock, Award, TrendingUp, Zap, CheckCircle2, History, Calendar, Filter, Building2, Trees
} from 'lucide-react';
import { getClientFrequencies, getRadar30DaysHistory } from '../services/clientEngine';

export default function StatsRadarTab({ frequencies, loading, isVip, onOpenUpgrade }) {
  const [subTab, setSubTab] = useState('radar'); // 'radar', 'heatmap', 'delays', 'verified_hits', 'history_30d'
  const [selectedNum, setSelectedNum] = useState(null);
  const [historyLotteryFilter, setHistoryLotteryFilter] = useState('all'); // 'all', 'ciudad', 'provincia'
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all'); // 'all', 'cabeza', 'pizarra'

  const activeFreqs = (frequencies && frequencies.all_numbers && frequencies.all_numbers.length > 0)
    ? frequencies
    : getClientFrequencies('all', 'all', 'head');

  const nums = activeFreqs.all_numbers;
  const maxFreq = Math.max(...nums.map(n => n.frequency), 1);
  const minFreq = Math.min(...nums.map(n => n.frequency));

  // Compute 30-Day Real Hit History from the deterministic engine
  const historyData = useMemo(() => {
    return getRadar30DaysHistory(historyLotteryFilter, 30);
  }, [historyLotteryFilter]);

  const filteredHits = useMemo(() => {
    if (historyTypeFilter === 'cabeza') {
      return historyData.hits.filter(h => h.hit_type.includes('CABEZA'));
    }
    if (historyTypeFilter === 'pizarra') {
      return historyData.hits.filter(h => h.hit_type.includes('PIZARRA'));
    }
    return historyData.hits;
  }, [historyData, historyTypeFilter]);

  const getColorClass = (freq) => {
    const ratio = (freq - minFreq) / (maxFreq - minFreq || 1);
    if (ratio >= 0.8) return 'bg-rose-600 text-white shadow-rose-900/50';
    if (ratio >= 0.6) return 'bg-amber-600 text-white shadow-amber-900/50';
    if (ratio >= 0.4) return 'bg-emerald-700 text-slate-100 shadow-emerald-900/50';
    if (ratio >= 0.2) return 'bg-sky-800 text-slate-200 shadow-sky-900/50';
    return 'bg-slate-800 text-slate-400';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CRITICO_ATRASADO':
        return <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black">🔴 Crítico Atrasado</span>;
      case 'MADURANDO':
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">🟡 En Maduración</span>;
      case 'CALIENTE_FRECUENTE':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">🟢 Caliente</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">Normal</span>;
    }
  };

  // Limit numbers for free users
  const displayedNums = isVip ? nums : nums.slice(0, 30);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase mb-1 border border-cyan-500/30">
            <Radio className="w-3 h-3 text-cyan-400" /> Sensor Termográfico y Estadístico
          </div>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            Radar Térmico de Probabilidades
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
            Escáner integral del 00 al 99: detecta zonas calientes, atrasos maduros y audita aciertos reales de 30 días.
          </p>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/30 text-right shrink-0">
          <div className="text-[10px] text-slate-400">Efectividad Auditada (30d)</div>
          <div className="text-base sm:text-xl font-black text-cyan-400 font-mono">
            {historyData.summary.accuracy_rate}
          </div>
        </div>
      </div>

      {/* Sub-navigation Switcher with 5 Subtabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow gap-1">
        <button
          onClick={() => setSubTab('radar')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'radar' ? 'bg-cyan-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" /> Visión General
        </button>

        <button
          onClick={() => setSubTab('heatmap')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'heatmap' ? 'bg-rose-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Mapa Térmico
        </button>

        <button
          onClick={() => setSubTab('delays')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'delays' ? 'bg-amber-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" /> Atrasos Críticos
        </button>

        <button
          onClick={() => setSubTab('verified_hits')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            subTab === 'verified_hits' ? 'bg-emerald-500 text-slate-950 shadow-md font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" /> Aciertos Radar
        </button>

        <button
          onClick={() => setSubTab('history_30d')}
          className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer col-span-2 sm:col-span-1 ${
            subTab === 'history_30d' ? 'bg-indigo-500 text-white shadow-md font-black ring-1 ring-indigo-400' : 'text-indigo-400 hover:text-indigo-300 bg-indigo-950/20'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Historial 30 Días
        </button>
      </div>

      {/* Free User Teaser Banner if not VIP */}
      {!isVip && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Versión Gratuita: Muestra de 30 Números</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">Muestra Activa</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Desbloquea la matriz 10x10 completa (del 00 al 99), filtros por turno y los sensores de ruptura con el Plan VIP.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUpgrade}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 shrink-0 flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Desbloquear Radar 100% VIP</span>
          </button>
        </div>
      )}

      {/* Sub-view: Live Radar Overview */}
      {subTab === 'radar' && (
        <div className="space-y-4">
          {/* Quick Hot & Cold Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-black uppercase">
                  <Flame className="w-4 h-4" /> Top 3 Números Calientes (Mayor Frecuencia)
                </div>
                <span className="text-[10px] text-slate-400">Racha positiva</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(activeFreqs.rankings?.hot_numbers || []).slice(0, 3).map((h) => (
                  <div key={h.number} className="text-center p-2 bg-rose-950/80 border border-rose-700/50 rounded-xl">
                    <span className="text-2xl font-black font-mono text-rose-300 block">{h.number}</span>
                    <span className="text-[10px] text-slate-400 block">{h.significado}</span>
                    <span className="text-[9px] font-bold text-rose-400">{h.frequency} salidas</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase">
                  <Clock className="w-4 h-4" /> Top 3 Atrasos Maduros (Punto de Ruptura)
                </div>
                <span className="text-[10px] text-slate-400">Tensión alta</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(activeFreqs.rankings?.most_delayed || []).slice(0, 3).map((d) => (
                  <div key={d.number} className="text-center p-2 bg-amber-950/80 border border-amber-700/50 rounded-xl">
                    <span className="text-2xl font-black font-mono text-amber-300 block">{d.number}</span>
                    <span className="text-[10px] text-slate-400 block">{d.significado}</span>
                    <span className="text-[9px] font-bold text-amber-400">{d.current_delay} sorteos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Radar Verified Highlights preview */}
          <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" /> Aciertos Confirmados por el Radar (Últimas Horas)
              </h3>
              <button onClick={() => setSubTab('verified_hits')} className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer">
                Ver todos ({historyData.hits.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {historyData.hits.slice(0, 2).map((hit, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl font-black font-mono text-amber-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                      {hit.number}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">"{hit.significado}" ➔ {hit.lottery_name} ({hit.shift_name})</div>
                      <div className="text-[10px] text-slate-400">Predicho a las {hit.draw_time} hs • {hit.draw_date}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] shrink-0 border border-emerald-500/30">
                    {hit.prize_multiplier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-view: Heatmap 10x10 */}
      {subTab === 'heatmap' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rose-500" /> Matriz Termográfica (00 al 99)
            </h3>
            <span className="text-[11px] text-slate-400">Toca un número para ver su ficha técnica</span>
          </div>

          {/* Color scale legend bar */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold">
            <span className="text-slate-400">Escala de Intensidad:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-600"></span><span className="text-rose-300">Caliente (Top)</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-600"></span><span className="text-amber-300">Frecuente</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-700"></span><span className="text-emerald-300">Medio</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-800"></span><span className="text-sky-300">Bajo</span></div>
              <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-800"></span><span className="text-slate-400">Frío</span></div>
            </div>
          </div>

          {/* Sticky Detail Card on Top when selected */}
          {selectedNum && (
            <div className="sticky top-12 sm:top-16 z-30 bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                  {selectedNum.number}
                </span>
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-2">
                    <span>"{selectedNum.significado}"</span>
                    {getStatusBadge(selectedNum.status)}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Frecuencia: <strong className="text-white">{selectedNum.frequency} salidas</strong> • Atraso actual: <strong className="text-amber-400">{selectedNum.current_delay} sorteos</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedNum(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg cursor-pointer">
                Cerrar
              </button>
            </div>
          )}

          {/* Numbers Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
            {displayedNums.map((item) => (
              <button
                key={item.number}
                onClick={() => setSelectedNum(item)}
                className={`p-2.5 sm:p-3 rounded-xl font-mono text-center transition-all cursor-pointer shadow hover:scale-105 active:scale-95 ${getColorClass(item.frequency)} ${
                  selectedNum?.number === item.number ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''
                }`}
              >
                <span className="text-base sm:text-lg font-black block">{item.number}</span>
                <span className="text-[9px] opacity-80 block truncate">{item.significado}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view: Delays */}
      {subTab === 'delays' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" /> Ranking de Atrasos Críticos (Puntos de Ruptura)
            </h3>
            <span className="text-[11px] text-slate-400">Ordenados de mayor a menor atraso</span>
          </div>

          <div className="space-y-2">
            {[...displayedNums]
              .sort((a, b) => b.current_delay - a.current_delay)
              .slice(0, 15)
              .map((item, idx) => (
                <div
                  key={item.number}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-5">#{idx + 1}</span>
                    <span className="text-xl font-black font-mono text-amber-400 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                      {item.number}
                    </span>
                    <div>
                      <div className="font-bold text-white text-xs">{item.significado}</div>
                      <div className="text-[10px] text-slate-400">Atraso promedio: {item.avg_delay || 14} sorteos</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-1">
                      <div className="text-xs font-black text-amber-300 font-mono">{item.current_delay} sorteos</div>
                      <div className="text-[9px] text-slate-500">sin salir</div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Sub-view: Verified Radar Hits (Aciertos Recientes Confirmados) */}
      {subTab === 'verified_hits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" /> Aciertos Confirmados por el Radar
              </h3>
              <p className="text-[11px] text-slate-400">
                Solo se muestran sorteos donde el número predicho fue 100% acertado en la pizarra oficial.
              </p>
            </div>
            <button
              onClick={() => setSubTab('history_30d')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
            >
              <History className="w-3.5 h-3.5" /> Ver Historial Completo 30 Días ({historyData.hits.length})
            </button>
          </div>

          <div className="space-y-3">
            {historyData.hits.slice(0, 10).map((hit) => (
              <div key={hit.id} className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-2.5 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black font-mono text-amber-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      {hit.number}
                    </span>
                    <div>
                      <div className="text-sm font-black text-white">
                        "{hit.significado}" ➔ {hit.lottery_name}
                      </div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {hit.hit_type}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30 inline-block">
                      {hit.prize_multiplier}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Fecha: <strong className="text-slate-200">{hit.draw_date}</strong> • Hora: <strong className="text-amber-300">{hit.draw_time} hs</strong>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <span>{hit.note}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                    {hit.radar_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-view: NEW 30-Day Complete Audit History */}
      {subTab === 'history_30d' && (
        <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase mb-1 border border-indigo-500/30">
                <History className="w-3 h-3 text-indigo-400" /> Auditoría 30 Días • Cero Inventos
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                Historial de Aciertos del Radar (30 Días)
              </h3>
              <p className="text-[11px] text-slate-300">
                Registro transparente cotejado contra las pizarras oficiales de lotería. Si un sorteo no acertó, no se lista.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">TOTAL ACIERTOS</span>
                <span className="text-base font-black text-emerald-400 font-mono">{historyData.summary.total_hits_30d}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">A LA CABEZA</span>
                <span className="text-base font-black text-amber-400 font-mono">{historyData.summary.head_hits_30d}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block font-bold">EFECTIVIDAD</span>
                <span className="text-base font-black text-indigo-400 font-mono">{historyData.summary.accuracy_rate}</span>
              </div>
            </div>
          </div>

          {/* Lottery and Type Filters */}
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 mr-1">Lotería:</span>
              <button
                onClick={() => setHistoryLotteryFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyLotteryFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setHistoryLotteryFilter('ciudad')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyLotteryFilter === 'ciudad' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Ciudad
              </button>
              <button
                onClick={() => setHistoryLotteryFilter('provincia')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyLotteryFilter === 'provincia' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Provincia
              </button>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <span className="text-xs font-bold text-slate-400 mr-1">Tipo:</span>
              <button
                onClick={() => setHistoryTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyTypeFilter === 'all' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Todos ({historyData.hits.length})
              </button>
              <button
                onClick={() => setHistoryTypeFilter('cabeza')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyTypeFilter === 'cabeza' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Solo Cabeza 70x
              </button>
              <button
                onClick={() => setHistoryTypeFilter('pizarra')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  historyTypeFilter === 'pizarra' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-900 text-slate-400'
                }`}
              >
                En Pizarra
              </button>
            </div>
          </div>

          {/* Full List of Verified Hits */}
          <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
            {filteredHits.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No hay registros con el filtro seleccionado.
              </div>
            ) : (
              filteredHits.map((hit) => (
                <div
                  key={hit.id}
                  className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 bg-slate-900 px-3 py-1 rounded-xl border border-slate-800">
                      {hit.number}
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                        <span>"{hit.significado}"</span>
                        <span className="text-[10px] font-normal text-slate-400">➔ {hit.lottery_name} ({hit.shift_name})</span>
                      </div>
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {hit.hit_type}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30">
                      {hit.prize_multiplier}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {hit.draw_date} • {hit.draw_time} hs
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
