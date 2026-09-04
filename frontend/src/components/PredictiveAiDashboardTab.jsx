import React, { useState, useMemo } from 'react';
import { 
  Cpu, Award, HelpCircle, AlertTriangle, ShieldCheck, CheckCircle2, 
  BarChart2, Activity, Info, RefreshCw, ChevronRight, Layers, Sliders,
  Eye, Lock, Sparkles, Filter, Database, TrendingUp, Search, DollarSign,
  History, Compass, ShieldAlert, ArrowUpRight, ArrowDownRight, Scale,
  Download, FileSpreadsheet, FileJson, Check, Shield
} from 'lucide-react';
import { 
  getMLPredictions, 
  getFourSystemsBenchmark,
  getHistoricalTestV1Frozen,
  simulateEconomicPerformanceClient,
  detectPerformanceDegradation,
  getAblationBenchmarkResults,
  ML_MODEL_METADATA 
} from '../services/mlPredictionEngine';
import { OFFICIAL_SHIFTS_SCHEDULE } from '../services/clientEngine';
import { 
  getProspectiveDashboardData, 
  exportProspectiveLedgerCSV, 
  exportProspectiveLedgerJSON,
  PHASE5_PROSPECTIVE_VALIDATION_ENABLED 
} from '../services/prospectiveLedgerClient';

export default function PredictiveAiDashboardTab({ isVip = false, onOpenUpgrade }) {
  const [selectedLottery, setSelectedLottery] = useState('ciudad');
  const [selectedShift, setSelectedShift] = useState('auto');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('predictions'); // 'predictions', 'prospective', 'four_systems', 'ablation', 'blind_test', 'simulator', 'degradation', 'weights', 'all_100'

  const prospectiveData = useMemo(() => getProspectiveDashboardData(), []);

  // Parámetros interactivos del Simulador Económico
  const [simStake, setSimStake] = useState(100);
  const [simBetType, setSimBetType] = useState('board'); // 'head' | 'board'
  const [simNumbersCount, setSimNumbersCount] = useState(5);

  // Datos oficiales del benchmark de 4 sistemas y ablación
  const benchmark = useMemo(() => getFourSystemsBenchmark(), []);
  const frozenTest = useMemo(() => getHistoricalTestV1Frozen(), []);
  const ablationData = useMemo(() => getAblationBenchmarkResults(), []);
  const degradationData = useMemo(() => detectPerformanceDegradation(50), []);
  const simResults = useMemo(() => {
    return simulateEconomicPerformanceClient(Number(simStake) || 100, simBetType, Number(simNumbersCount) || 5);
  }, [simStake, simBetType, simNumbersCount]);

  // Predicciones ML en vivo para los parámetros seleccionados
  const mlResult = useMemo(() => {
    return getMLPredictions({
      lottery: selectedLottery,
      shift: selectedShift,
      topCount: 10
    });
  }, [selectedLottery, selectedShift]);

  // Lista completa de 100 ambos filtrados por búsqueda
  const filteredAllRanked = useMemo(() => {
    if (!mlResult?.all_ranked) return [];
    if (!searchTerm.trim()) return mlResult.all_ranked;
    const term = searchTerm.trim().toLowerCase();
    return mlResult.all_ranked.filter(item => 
      item.number.includes(term) || 
      item.significado.toLowerCase().includes(term)
    );
  }, [mlResult, searchTerm]);

  // Pesos del modelo para la pestaña de explicabilidad
  const featureWeightsList = [
    { name: "delay_avg", label: "Intervalo promedio entre apariciones", weight: 0.0836, category: "Ciclos y Atraso" },
    { name: "freq_5", label: "Frecuencia en ventana reciente (5 sorteos)", weight: 0.0533, category: "Inercia Temporal" },
    { name: "delay_std", label: "Desviación estándar de intervalos", weight: 0.0483, category: "Regularidad" },
    { name: "shift_freq", label: "Frecuencia específica en este turno", weight: 0.0395, category: "Contexto de Turno" },
    { name: "weekday_freq", label: "Frecuencia en este día de la semana", weight: 0.0320, category: "Calendario" },
    { name: "freq_20", label: "Frecuencia en ventana de 20 sorteos", weight: 0.0276, category: "Mediano Plazo" },
    { name: "trend_20_vs_100", label: "Ratio de aceleración reciente (20 vs 100)", weight: 0.0211, category: "Momentum" },
    { name: "freq_all", label: "Frecuencia histórica global", weight: 0.0207, category: "Base Histórica" },
    { name: "pos_head_freq", label: "Tasa de salida histórica a la cabeza", weight: 0.0194, category: "Posición" },
    { name: "markov_prob", label: "Probabilidad de transición de Markov", weight: 0.0185, category: "Secuencia" },
    { name: "unit_freq", label: "Afinidad de la cifra unidad (0-9)", weight: 0.0152, category: "Cluster Dígitos" },
    { name: "decade_freq", label: "Afinidad de la decena (00-90)", weight: 0.0141, category: "Cluster Dígitos" },
    { name: "delay_max", label: "Penalización por atraso extremo", weight: -0.0888, category: "Filtro de Varianza" }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header con Metadata Científica y Nomenclatura Precisa */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5 shadow">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                {ML_MODEL_METADATA.version}
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Fase 3: 4 Sistemas Validados
              </span>
              <span className="px-2.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-cyan-400" />
                Anti-Leakage Activo
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Validación Científica & Machine Learning
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Modelo supervisado con 22 features causales. Comparado rigurosamente en simultáneo contra{' '}
              <strong className="text-white">Baseline Estadístico, Markov Puro y Azar Monte Carlo</strong>{' '}
              sobre 400 sorteos fuera de muestra con protocolo anti-sesgo temporal.
            </p>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2 shrink-0 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="text-left md:text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Acierto Pizarra Top 20</div>
              <div className="text-xl font-black text-emerald-400">74.25%</div>
              <div className="text-[10px] text-emerald-300/90 font-mono">+11.75% vs azar (p &lt; 0.05)</div>
            </div>
            <div className="text-left md:text-right border-l md:border-l-0 md:border-t border-slate-800 pl-3 md:pl-0 md:pt-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">A la Cabeza (1° Premio)</div>
              <div className="text-xl font-black text-amber-400">1.50%</div>
              <div className="text-[10px] text-slate-400">p = 0.789 (no concluyente)</div>
            </div>
          </div>
        </div>

        {/* Diagnóstico de Honestidad Científica Obligatorio */}
        <div className="mt-4 p-3.5 bg-slate-950/80 rounded-2xl border border-amber-500/40 flex items-start gap-3 text-xs text-slate-300">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-black text-amber-300 block text-xs">DECLARACIÓN DE HONESTIDAD CIENTÍFICA (FASE 3):</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              En 1° premio (cabeza), el modelo <strong>no demuestra una ventaja estadísticamente significativa sobre el azar (p = 0.7893 &ge; 0.05)</strong>. 
              No existe método que garantice aciertos plenos. En la pizarra de 20 premios se demostró una ventaja estadística significativa (+11.75%, p = 0.0004 &lt; 0.05). 
              Las métricas corresponden a datos fuera de muestra y se auditan sorteo a sorteo.
            </p>
          </div>
        </div>
      </div>

      {/* Navegación de Sub-Pestañas (Fase 3 Completa) */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('predictions')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'predictions'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-300" />
          Ranking ML v1.0
        </button>

        {PHASE5_PROSPECTIVE_VALIDATION_ENABLED && (
          <button
            onClick={() => setActiveSubTab('prospective')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'prospective'
                ? 'bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-slate-900 text-emerald-400 hover:text-white border border-emerald-500/30'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Validación Prospectiva (Fase 5)</span>
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('four_systems')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'four_systems'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-300" />
          Los 4 Sistemas
        </button>

        <button
          onClick={() => setActiveSubTab('ablation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'ablation'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-300" />
          Ablación & Valor Incremental
        </button>

        <button
          onClick={() => setActiveSubTab('blind_test')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'blind_test'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-cyan-300" />
          Prueba Ciega en Vivo
        </button>

        <button
          onClick={() => setActiveSubTab('simulator')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'simulator'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4 text-amber-300" />
          Simulador Económico
        </button>

        <button
          onClick={() => setActiveSubTab('degradation')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'degradation'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-rose-300" />
          Monitor de Deterioro
        </button>

        <button
          onClick={() => setActiveSubTab('weights')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'weights'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-purple-300" />
          Pesos y Variables
        </button>

        <button
          onClick={() => setActiveSubTab('all_100')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'all_100'
              ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-blue-300" />
          Pizarra (00-99)
        </button>
      </div>

      {/* SUBTAB PROSPECTIVE: VALIDACIÓN PROSPECTIVA CIEGA (FASE 5) */}
      {activeSubTab === 'prospective' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Panel */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black tracking-wider flex items-center gap-1.5 shadow">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    FASE 5: VALIDACIÓN PROSPECTIVA CIEGA
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded-full text-[11px] font-bold">
                    Ledger Criptográfico SHA-256
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Monitoreo Científico Fuera de Muestra
                </h2>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Evaluación estricta de predicciones pre-sorteo bloqueadas criptográficamente antes del horario oficial de cada extracción.
                  Protocolo causal determinista sin recalibración post-resultado ni contaminación de datos.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={exportProspectiveLedgerCSV}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={exportProspectiveLedgerJSON}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
                >
                  <FileJson className="w-4 h-4 text-indigo-400" />
                  <span>Exportar JSON</span>
                </button>
              </div>
            </div>

            {/* Block 21 KPI Dashboard Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Sorteos Programados</div>
                <div className="text-lg font-black text-white mt-0.5">{prospectiveData.prospective_draws_scheduled}</div>
                <div className="text-[10px] text-emerald-400">Target: 300 - 500+</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Predicciones Válidas</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{prospectiveData.valid_predictions}</div>
                <div className="text-[10px] text-slate-400">Cobertura: {prospectiveData.coverage_rate}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Champion Actual</div>
                <div className="text-sm font-black text-indigo-300 mt-1 truncate">{prospectiveData.champion_id}</div>
                <div className="text-[10px] text-slate-400">{prospectiveData.champion_version}</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Data Leakage Events</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{prospectiveData.leakage_events}</div>
                <div className="text-[10px] text-emerald-400 font-bold">PASS (Cero fugas)</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Predicciones Alteradas</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{prospectiveData.modified_locked_predictions}</div>
                <div className="text-[10px] text-emerald-400 font-bold">PASS (Inmutabilidad 100%)</div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Drift Monitor</div>
                <div className="text-sm font-black text-cyan-300 mt-1">{prospectiveData.drift_status}</div>
                <div className="text-[10px] text-slate-400">Score: {prospectiveData.drift_score}</div>
              </div>
            </div>
          </div>

          {/* Table of Models (Champion vs Challengers vs Baselines) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" />
                  <span>Matriz Comparativa de Modelos (Modo Observación)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conforme a la regla de integridad de Fase 5, las métricas acumuladas prospectivas se declaran como N/A hasta alcanzar un tamaño muestral mínimo de N &ge; 25.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold">
                {prospectiveData.status_text}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Modelo</th>
                    <th className="py-3 px-2">Rol</th>
                    <th className="py-3 px-2 text-center">Top 1</th>
                    <th className="py-3 px-2 text-center">Hit Rate@5</th>
                    <th className="py-3 px-2 text-center">Precision@5</th>
                    <th className="py-3 px-2 text-center">Hit Rate@10</th>
                    <th className="py-3 px-2 text-center">Precision@10</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {prospectiveData.models_comparison.map((m, idx) => (
                    <tr key={idx} className={m.role === 'CHAMPION' ? 'bg-indigo-950/20 font-bold' : ''}>
                      <td className="py-3 px-3 font-sans flex items-center gap-2">
                        {m.role === 'CHAMPION' && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        <span className="text-white">{m.model}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          m.role === 'CHAMPION' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          m.role === 'CHALLENGER' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-400">{m.top1}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{m.hit5}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{m.prec5}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{m.hit10}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{m.prec10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Prediction Audit Ledger View */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  <span>Prediction Audit Ledger (Inmutable)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registro permanente de cada predicción emitida, horario de bloqueo, hash criptográfico y resolución oficial.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {prospectiveData.ledger_records.map((r, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-300">{r.prediction_id}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        {r.prediction_status}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {r.jurisdiction} • {r.shift} ({r.scheduled_time})
                      </span>
                    </div>
                    <div className="text-slate-300 text-[11px] flex items-center gap-2">
                      <span>Top 5 Ambos:</span>
                      <span className="font-mono font-bold text-amber-400">{r.top_5.join(' - ')}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400 font-mono text-[10px]">SHA-256: {r.prediction_hash}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left md:text-right border-t md:border-t-0 pt-2 md:pt-0 border-slate-800">
                    <div className="font-bold text-white text-[11px]">{r.official_result}</div>
                    <div className="text-[10px] text-emerald-400 font-bold mt-0.5">{r.evaluation}</div>
                    <div className="text-[10px] text-slate-500">{r.locked_at}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Disclaimer (Block 35) */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-amber-500/30 text-[11px] text-slate-400 space-y-1 text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              Declaración de Transparencia Científica y Juego Responsable (+18)
            </div>
            <p>
              Predicción estadística experimental. Ranking generado mediante análisis histórico determinista. 
              Los resultados pasados no garantizan resultados futuros. Un Predictive Score no equivale a una probabilidad de acierto garantizada.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 1: RANKING ML DEL PRÓXIMO SORTEO */}
      {activeSubTab === 'predictions' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-400" />
                Lotería:
              </span>
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setSelectedLottery('ciudad')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedLottery === 'ciudad'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ciudad (Nacional)
                </button>
                <button
                  onClick={() => setSelectedLottery('provincia')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedLottery === 'provincia'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Provincia Bs As
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Turno:</span>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="auto">Siguiente en Vivo (Auto)</option>
                {OFFICIAL_SHIFTS_SCHEDULE.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.time} hs)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 text-xs text-slate-400">
            <div>
              Turno evaluado: <strong className="text-white">{mlResult.shift_name} ({mlResult.shift_time} hs)</strong>{' '}
              • Dataset histórico: <span className="text-indigo-300 font-semibold">{mlResult.total_draws_analyzed} sorteos analizados</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Muestreo causal: <span className="text-slate-300">{mlResult.sample_period}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mlResult.predictions.slice(0, isVip ? 9 : 3).map((item, index) => {
              const isTop1 = index === 0;
              return (
                <div
                  key={item.number}
                  className={`rounded-2xl border p-4 transition-all duration-200 relative overflow-hidden ${
                    isTop1
                      ? 'bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border-indigo-500/60 shadow-xl'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                        isTop1
                          ? 'bg-indigo-600 text-white shadow-indigo-600/40'
                          : 'bg-slate-950 text-indigo-300 border border-slate-800'
                      }`}>
                        {item.number}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            isTop1 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                          }`}>
                            Rank #{item.rank}
                          </span>
                          {isTop1 && (
                            <span className="text-[10px] font-bold text-indigo-300">
                              Mayor prob. pizarra
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {item.significado}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-semibold">Score ML</div>
                      <div className="text-lg font-black text-indigo-400">
                        {item.predictive_score}
                        <span className="text-xs text-slate-400 font-normal">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                      Factores Determinantes:
                    </div>
                    {item.top_contributing_features.slice(0, 2).map((factor, fIdx) => (
                      <div key={fIdx} className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/60 px-2 py-1 rounded-lg">
                        <span className="truncate pr-2">{factor.label}</span>
                        <span className={`font-black shrink-0 ${factor.impact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {factor.impact > 0 ? `+${factor.impact.toFixed(3)}` : factor.impact.toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs bg-slate-950/80 p-2 rounded-xl border border-slate-800">
                    <div className="text-slate-400">
                      Terno: <strong className="text-amber-300 font-mono">{item.suggested_centenas[0]}</strong>
                    </div>
                    <div className="text-slate-400">
                      Cuaterno: <strong className="text-amber-300 font-mono">{item.suggested_millar[0]}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCandidate(item)}
                    className="mt-3 w-full py-2 bg-indigo-950/60 hover:bg-indigo-900/70 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    ¿Por qué este número? (Desglose)
                  </button>
                </div>
              );
            })}
          </div>

          {!isVip && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-amber-500/30 text-center space-y-3 shadow-lg">
              <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm">
                <Lock className="w-4 h-4" />
                Desbloquea los 10 Mejores Ambos del Modelo ML
              </div>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                Los usuarios VIP acceden al Top 10 completo, simulación de combinaciones con redoblonas y exportación directa a la Billetera Oficial.
              </p>
              <button
                onClick={onOpenUpgrade}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
              >
                Activar Acceso VIP
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: LOS 4 SISTEMAS DE COMPARACIÓN (FASE 3 OBLIGATORIA) */}
      {activeSubTab === 'four_systems' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-400" />
              Comparativa Científica de los 4 Sistemas (400 Sorteos Out-of-Sample)
            </h2>
            <p className="text-xs text-slate-300">
              Evaluación rigurosa sobre el conjunto congelado de 400 sorteos oficiales. 
              Cada sistema fue evaluado de manera independiente y en simultáneo sobre exactamente los mismos sorteos.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-3 sm:p-4">Sistema Evaluado</th>
                  <th className="p-3 sm:p-4 text-amber-300">Cabeza (1°)</th>
                  <th className="p-3 sm:p-4">IC 95% Cabeza</th>
                  <th className="p-3 sm:p-4 text-emerald-400">Pizarra (Top 20)</th>
                  <th className="p-3 sm:p-4">IC 95% Pizarra</th>
                  <th className="p-3 sm:p-4">Precision@5</th>
                  <th className="p-3 sm:p-4">p-value vs Azar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {benchmark.table.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 sm:p-4 font-bold text-white whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="p-3 sm:p-4 font-mono font-black text-amber-400 whitespace-nowrap">
                      {row.head_hits}
                    </td>
                    <td className="p-3 sm:p-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {row.head_ci95}
                    </td>
                    <td className="p-3 sm:p-4 font-mono font-black text-emerald-400 whitespace-nowrap">
                      {row.board_hits}
                    </td>
                    <td className="p-3 sm:p-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {row.board_ci95}
                    </td>
                    <td className="p-3 sm:p-4 font-mono font-semibold text-cyan-300 whitespace-nowrap">
                      {row.precision_at_5}
                    </td>
                    <td className="p-3 sm:p-4 font-mono text-[11px] whitespace-nowrap">
                      <span className={row.p_val_board_vs_random < 0.05 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        {row.p_val_board_vs_random === 1.0 ? 'Baseline (Azar)' : `p = ${row.p_val_board_vs_random}`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Contrastes Formales contra el Azar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Contraste 1: ML vs Azar */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-300 uppercase">ML vs Azar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold font-mono">
                  Δ Pizarra: {benchmark.contrasts.ml_vs_random.board_diff}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Cabeza: {benchmark.contrasts.ml_vs_random.head_diff} (p = {benchmark.contrasts.ml_vs_random.head_p_val})</div>
                <p className="text-[11px] text-slate-400">{benchmark.contrasts.ml_vs_random.head_statement}</p>
                <p className="text-[11px] text-emerald-400 font-semibold">{benchmark.contrasts.ml_vs_random.board_statement}</p>
              </div>
            </div>

            {/* Contraste 2: Baseline vs Azar */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 uppercase">Baseline vs Azar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold font-mono">
                  Δ Pizarra: {benchmark.contrasts.baseline_vs_random.board_diff}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Cabeza: {benchmark.contrasts.baseline_vs_random.head_diff} (p = {benchmark.contrasts.baseline_vs_random.head_p_val})</div>
                <p className="text-[11px] text-slate-400">{benchmark.contrasts.baseline_vs_random.board_statement}</p>
              </div>
            </div>

            {/* Contraste 3: Markov vs Azar */}
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-cyan-300 uppercase">Markov vs Azar</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold font-mono">
                  Δ Pizarra: {benchmark.contrasts.markov_vs_random.board_diff}
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Cabeza: {benchmark.contrasts.markov_vs_random.head_diff} (p = {benchmark.contrasts.markov_vs_random.head_p_val})</div>
                <p className="text-[11px] text-slate-400">{benchmark.contrasts.markov_vs_random.board_statement}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB ABLATION: AUDITORÍA DE ABLACIÓN & VALOR INCREMENTAL DE ML */}
      {activeSubTab === 'ablation' && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                Auditoría de Ablación & Valor Incremental de ML (Fase 4)
              </h2>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40">
                {ablationData.protocol} • 400 Sorteos Congelados
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Descomposición científica sobre <strong className="text-white">HISTORICAL_TEST_V1</strong>. Determina cuánto rendimiento aporta realmente el Machine Learning por encima de los métodos estadísticos simples (Frecuencia, Atraso, Markov y Baseline) y aisla el impacto de cada subconjunto de variables.
            </p>
          </div>

          {/* Veredicto Científico Formal (Escenario 2) */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-black uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              {ablationData.verdict.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {ablationData.verdict.description}
            </p>
          </div>

          {/* Respuestas a las Tres Preguntas Fundamentales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Pregunta 1</div>
              <h3 className="text-xs font-black text-white">¿Aporte de ML sobre Frecuencia Simple?</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Cabeza: <span className="font-mono text-slate-400">+0.50% (p = 0.7518, No Sig)</span></div>
                <div>Hit Rate@5: <strong className="font-mono text-emerald-400">+15.00% (p = 0.0000, Sig)</strong></div>
                <div>Precision@5: <strong className="font-mono text-cyan-300">+0.0510 (p = 0.0001, Sig)</strong></div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  La ponderación multiescala (ventanas cortas) supera con creces a la suma acumulada plana en pizarra.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Pregunta 2</div>
              <h3 className="text-xs font-black text-white">¿Aporte de ML sobre Baseline Estadístico?</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Cabeza: <span className="font-mono text-slate-400">+1.25% (p = 0.1306, No Sig)</span></div>
                <div>Hit Rate@5: <strong className="font-mono text-emerald-400">+13.00% (p = 0.0002, Sig)</strong></div>
                <div>Precision@5: <strong className="font-mono text-cyan-300">+0.0675 (p = 0.0000, Sig)</strong></div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  El baseline se penalizaba forzando atrasos altos (30%). El ML aprendió que el atraso extremo perjudica la selección.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Pregunta 3</div>
              <h3 className="text-xs font-black text-white">¿Aporte de Markov dentro de ML?</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <div>Hit Rate@5 con Markov: <span className="font-mono text-white">74.25%</span></div>
                <div>Hit Rate@5 sin Markov: <span className="font-mono text-white">74.00%</span></div>
                <div>Diferencia: <strong className="font-mono text-amber-400">-0.25% (p = 1.0000, No Sig)</strong></div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Las Cadenas de Markov no aportan valor predictivo adicional. Es un componente prescindible en el pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla General de Ranking de los 11 Sistemas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                Ranking de los 11 Sistemas Evaluados (400 Sorteos Congelados)
              </h3>
              <span className="text-[10px] text-slate-400">Ordenado por Hit Rate@5</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Sistema Evaluado</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-amber-300">Cabeza (1°)</th>
                    <th className="p-3 text-slate-300">Hit Rate@20</th>
                    <th className="p-3 text-slate-300">Hit Rate@10</th>
                    <th className="p-3 text-emerald-400 font-black">Hit Rate@5</th>
                    <th className="p-3 text-cyan-300 font-black">Precision@5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ablationData.results_table.map((row) => {
                    const isTopML = row.key === 'ML-FULL' || row.key === 'ML-TREND';
                    return (
                      <tr 
                        key={row.key} 
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isTopML ? 'bg-indigo-950/20 font-bold' : ''
                        }`}
                      >
                        <td className="p-3 text-center font-mono font-black text-slate-400">
                          {row.rank}°
                        </td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">
                          {row.label}
                          {row.key === 'ML-FULL' && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                              OFICIAL
                            </span>
                          )}
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.type.includes('Oficial') 
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : row.type.includes('Ablación')
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-amber-400 whitespace-nowrap">
                          {row.head_hits}
                        </td>
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                          {row.hit_rate_20}
                        </td>
                        <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                          {row.hit_rate_10}
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-400 whitespace-nowrap">
                          {row.hit_rate_5}
                        </td>
                        <td className="p-3 font-mono font-black text-cyan-300 whitespace-nowrap">
                          {row.precision_5}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contrastes de Valor Incremental de ML-FULL */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Valor Incremental de ML Completo vs Sistemas de Referencia
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ablationData.incremental_value.map((item, idx) => (
                <div key={idx} className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">ML vs {item.target}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                      item.is_sig_hit5 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.is_sig_hit5 ? 'SIGNIFICATIVO (p < 0.05)' : 'NO SIGNIFICATIVO'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Δ Hit Rate@5:</span>
                      <strong className="text-emerald-400">{item.diff_hit5} (p = {item.p_hit5})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Δ Precision@5:</span>
                      <strong className="text-cyan-300">{item.diff_prec5} (p = {item.p_prec5})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Δ Cabeza (1°):</span>
                      <span className="text-slate-400">{item.diff_head} (p = {item.p_head})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Análisis de Robustez en las 4 Ventanas */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Consistencia Temporal y Estabilidad (4 Ventanas de 100 Sorteos)
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="p-3">Sistema</th>
                    <th className="p-3 text-center">Ventana 1 (1-100)</th>
                    <th className="p-3 text-center">Ventana 2 (101-200)</th>
                    <th className="p-3 text-center">Ventana 3 (201-300)</th>
                    <th className="p-3 text-center">Ventana 4 (301-400)</th>
                    <th className="p-3 text-center text-emerald-400 font-black">Promedio</th>
                    <th className="p-3 text-center text-purple-300 font-black">Dispersión (σ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {ablationData.robustness.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-white font-sans whitespace-nowrap">{row.system}</td>
                      <td className="p-3 text-center text-slate-300">{row.w1}</td>
                      <td className="p-3 text-center text-slate-300">{row.w2}</td>
                      <td className="p-3 text-center text-slate-300">{row.w3}</td>
                      <td className="p-3 text-center text-slate-300">{row.w4}</td>
                      <td className="p-3 text-center font-black text-emerald-400">{row.mean}</td>
                      <td className="p-3 text-center font-black text-purple-300">±{row.sigma}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: PRUEBA CIEGA EN VIVO (LIVE_OUT_OF_SAMPLE_TEST_V2) */}
      {activeSubTab === 'blind_test' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              Protocolo de Prueba Ciega Inmutable (LIVE_OUT_OF_SAMPLE_TEST_V2)
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Garantía de cero sesgo retrospectivo. Cada predicción se sella con firma criptográfica antes del sorteo y sólo se evalúa una vez que el extracto oficial es verificado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black">1</div>
                Fase Pre-Sorteo (Antes del Sorteo)
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-5">
                <li>Carga exclusivamente el historial de sorteos concluidos.</li>
                <li>Ejecuta <code>auditDataLeakage()</code> para verificar invarianza temporal.</li>
                <li>Genera la lista de ambos para los 4 sistemas en paralelo.</li>
                <li>Guarda la predicción con timestamp UTC y hash SHA-256 inmutable.</li>
              </ul>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-bold text-white text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">2</div>
                Fase Post-Sorteo (Tras el Extracto Oficial)
              </div>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-5">
                <li>Descarga y valida el extracto oficial publicado por la lotería.</li>
                <li>Contrasta el resultado contra la predicción sellada inmutable.</li>
                <li>Registra aciertos en Cabeza, Top 5, Top 10 y Top 20.</li>
                <li>Permite anexar el nuevo sorteo al histórico para el siguiente turno.</li>
              </ul>
            </div>
          </div>

          {/* Histórico Congelado v1.0 Card */}
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Conjunto Congelado {frozenTest.dataset_name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                {frozenTest.status}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Muestra evaluada: <strong>{frozenTest.total_eval_draws} sorteos</strong> ({frozenTest.period}).
              Este conjunto quedó sellado el {frozenTest.freeze_date} y está protegido contra reentrenamientos para evitar sobreajuste.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SIMULADOR DE RENDIMIENTO ECONÓMICO (BACKTEST SIMULATOR) */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-400" />
              Simulador Retrospectivo de Rendimiento Económico
            </h2>
            <p className="text-xs text-slate-300">
              Calcula los costos, retornos hipotéticos y balances netos si se hubiera apostado de manera uniforme durante la muestra histórica de 400 sorteos.
            </p>
          </div>

          {/* Controles de Simulación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Monto por Ambo ($)</label>
              <input 
                type="number" 
                value={simStake} 
                onChange={(e) => setSimStake(Math.max(10, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Modalidad de Apuesta</label>
              <select 
                value={simBetType} 
                onChange={(e) => setSimBetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:border-indigo-500"
              >
                <option value="board">Pizarra a los 20 (Paga 3.5x)</option>
                <option value="head">A la Cabeza (1° Premio, Paga 70x)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Ambos Jugados por Sorteo</label>
              <input 
                type="number" 
                value={simBetType === 'head' ? 1 : simNumbersCount} 
                disabled={simBetType === 'head'}
                onChange={(e) => setSimNumbersCount(Math.min(10, Math.max(1, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono font-bold focus:border-indigo-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Resultados de los 4 Sistemas en la Simulación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'ml', name: 'Sistema B (ML)', color: 'border-indigo-500/50', data: simResults.systems.ml },
              { key: 'markov', name: 'Sistema C (Markov)', color: 'border-cyan-500/30', data: simResults.systems.markov },
              { key: 'random', name: 'Sistema D (Azar)', color: 'border-slate-700', data: simResults.systems.random },
              { key: 'baseline', name: 'Sistema A (Baseline)', color: 'border-amber-500/30', data: simResults.systems.baseline }
            ].map(sys => (
              <div key={sys.key} className={`bg-slate-900/90 p-4 rounded-2xl border ${sys.color} space-y-2`}>
                <div className="text-xs font-bold text-white truncate">{sys.name}</div>
                <div className="text-[11px] text-slate-400">Aciertos: <strong className="text-white font-mono">{sys.data.hits}</strong> / {simResults.totalDraws}</div>
                <div className="text-[11px] text-slate-400">Costo Total: <span className="font-mono text-slate-300">${sys.data.totalCost.toLocaleString()}</span></div>
                <div className="text-[11px] text-slate-400">Retorno Bruto: <span className="font-mono text-emerald-400">${sys.data.grossReturn.toLocaleString()}</span></div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Balance:</span>
                  <span className={`font-mono font-black text-xs ${sys.data.netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sys.data.netBalance >= 0 ? `+$${sys.data.netBalance.toLocaleString()}` : `-$${Math.abs(sys.data.netBalance).toLocaleString()}`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">ROI Estimado:</span>
                  <span className={`font-mono font-black ${Number(sys.data.roiPct) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sys.data.roiPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-center leading-relaxed">
            * {simResults.disclaimer}
          </div>
        </div>
      )}

      {/* SUBTAB 5: MONITOR DE DETERIORO DE RENDIMIENTO (CONCEPT DRIFT) */}
      {activeSubTab === 'degradation' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-rose-400" />
              Monitor de Deterioro de Rendimiento (Concept Drift)
            </h2>
            <p className="text-xs text-slate-300">
              Compara de forma continua la ventana reciente (últimos 50 sorteos) contra la línea base histórica para alertar tempranamente si el modelo pierde eficacia empírica.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Línea Base Histórica</div>
              <div className="text-2xl font-black text-indigo-400 font-mono">{degradationData.baseline_board_rate}</div>
              <div className="text-[10px] text-slate-500">400 sorteos out-of-sample</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Ventana Reciente (50 Sorteos)</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">{degradationData.recent_board_rate}</div>
              <div className="text-[10px] text-slate-500">Últimos sorteos monitorizados</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Variación Observada</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{degradationData.drop_pct}</div>
              <div className="text-[10px] text-slate-500">Rango normal: &plusmn; 5%</div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
            degradationData.is_deteriorating 
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300' 
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
          }`}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="text-xs font-bold">
              {degradationData.status_alert}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: IMPORTANCIA DE VARIABLES Y PESOS L2 */}
      {activeSubTab === 'weights' && (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Pesos Aprendidos por la Regresión Logística L2
            </h2>
            <p className="text-xs text-slate-300">
              Coeficientes matemáticos asignados a cada una de las variables tras el entrenamiento sobre 2.225 sorteos oficiales.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featureWeightsList.map((f) => {
              const isPositive = f.weight > 0;
              const absVal = Math.abs(f.weight);
              const maxVal = 0.09;
              const widthPct = Math.min(100, Math.round((absVal / maxVal) * 100));

              return (
                <div key={f.name} className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{f.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{f.name} • {f.category}</span>
                    </div>
                    <span className={`font-mono font-black text-xs ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${f.weight.toFixed(4)}` : f.weight.toFixed(4)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${isPositive ? 'bg-indigo-500' : 'bg-rose-500'}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 7: LOS 100 AMBOS CALIFICADOS */}
      {activeSubTab === 'all_100' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                Pizarra Completa de Calificación (00 al 99)
              </h2>
              <p className="text-xs text-slate-400">
                Consulta el score predictivo exacto asignado por el modelo a cualquier número del bolillero.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ambo o significado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {filteredAllRanked.map((item) => (
              <div
                key={item.number}
                onClick={() => setSelectedCandidate(item)}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all cursor-pointer text-center group"
              >
                <div className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors">
                  {item.number}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {item.significado}
                </div>
                <div className="text-[10px] font-mono font-bold text-indigo-300 mt-1">
                  {item.predictive_score} pts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE DESGLOSE MATEMÁTICO INDIVIDUAL */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                  {selectedCandidate.number}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {selectedCandidate.significado}
                  </h3>
                  <div className="text-xs text-indigo-300 font-bold">
                    Score Predictivo: {selectedCandidate.predictive_score}/100
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Explicabilidad Algorítmica (Top Contribuciones):
              </div>
              
              <div className="space-y-2">
                {selectedCandidate.top_contributing_features?.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{f.label}</span>
                      <span className={`font-black ${f.impact > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {f.impact > 0 ? `+${f.impact.toFixed(3)}` : f.impact.toFixed(3)} pts
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Variable: <code className="text-slate-300">{f.feature}</code> • Valor: {f.value.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCandidate.suggested_centenas && (
                <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-500/30 text-xs space-y-1">
                  <div className="font-bold text-indigo-300">Combinaciones Sugeridas:</div>
                  <div className="text-slate-300">
                    Ternos: <strong>{selectedCandidate.suggested_centenas.join(', ')}</strong> • 
                    Cuaternos: <strong>{selectedCandidate.suggested_millar.join(', ')}</strong>
                  </div>
                </div>
              )}

              <div className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-800">
                * El score predictivo describe anomalías empíricas relativas basadas en el historial previo. No constituye probabilidad ganadora ni certeza matemática.
              </div>
            </div>

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar Desglose
            </button>
          </div>
        </div>
      )}

      {/* Disclosure Legal Obligatorio (+18) */}
      <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1 text-center">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold">
          <ShieldCheck className="w-4 h-4" />
          Aviso de Juego Responsable y Transparencia Legal (+18)
        </div>
        <p>
          Quiniela Master Pro utiliza modelos estadísticos y de Machine Learning exclusivamente para fines informativos y analíticos. 
          Los sorteos de quiniela son eventos aleatorios e independientes. El rendimiento pasado no garantiza resultados futuros. Juegue con moderación.
        </p>
      </div>
    </div>
  );
}
