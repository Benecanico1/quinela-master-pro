import React, { useState } from 'react';
import { 
  Calculator, Layers, TrendingUp, DollarSign, ShieldCheck, Zap,
  HelpCircle, CheckCircle2, ArrowRight, Play, Sparkles, AlertCircle,
  MapPin
} from 'lucide-react';
import { simulateClientBankroll } from '../services/clientEngine';
import AgenciesMapSearch from './AgenciesMapSearch';

export default function BankrollTab({ predictions }) {
  // Main Sub-Tab navigation: calculator vs agencies
  const [subTab, setSubTab] = useState('calculator'); // 'calculator' | 'agencies'

  // Redoblona state (Parte Principal Superior)
  const [amboA, setAmboA] = useState('28');
  const [posA, setPosA] = useState('1');
  const [amboB, setAmboB] = useState('64');
  const [posB, setPosB] = useState('10');
  const [redoblonaAmount, setRedoblonaAmount] = useState(500);

  // Bankroll state
  const [baseBet, setBaseBet] = useState(200);
  const [turns, setTurns] = useState(5);
  const [strategy, setStrategy] = useState('martingale');
  const [targetProfit, setTargetProfit] = useState(10000);
  const [betType, setBetType] = useState('ambo_cabeza');
  const [simulatedWinTurn, setSimulatedWinTurn] = useState(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  const simData = simulateClientBankroll(baseBet, turns, strategy, targetProfit, betType);

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

  const redoblonaMult = getRedoblonaMultiplier(posA, posB);
  const potentialPrize = redoblonaAmount * redoblonaMult;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-8">
      {/* Título Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>Estrategia, Calculadora & Mapa de Agencias</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Cálculo matemático de multiplicadores, cobertura inteligente y ubicación de agencias oficiales.
          </p>
        </div>
      </div>

      {/* Sub-Menú Principal de Navegación de Estrategia */}
      <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow">
        <button
          type="button"
          onClick={() => setSubTab('calculator')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'calculator'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Calculadora de Redoblonas & Bankroll</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('agencies')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
            subTab === 'agencies'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>📍 Mapa y Buscador de Agencias Cercanas</span>
        </button>
      </div>

      {subTab === 'agencies' ? (
        <AgenciesMapSearch />
      ) : (
        <>
          {/* 1. CALCULADORA DE REDOBLONAS (Parte Principal Superior) */}
          <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>Calculadora de Redoblonas Candado</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  Hasta 700x
                </span>
              </h3>
              <p className="text-[10.5px] text-slate-300">
                Multiplica tu premio acertando 2 números en las posiciones seleccionadas.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Primer Número */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-black text-amber-400 uppercase flex items-center gap-1">
              <span>Ambo A (Primer Número)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Número (00-99)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={amboA}
                  onChange={(e) => setAmboA(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg text-center rounded-xl p-2 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Posición</label>
                <select
                  value={posA}
                  onChange={(e) => setPosA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="1">Al 1° (Cabeza)</option>
                  <option value="5">A los 5</option>
                  <option value="10">A los 10</option>
                </select>
              </div>
            </div>
          </div>

          {/* Segundo Número */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
            <span className="text-xs font-black text-cyan-400 uppercase flex items-center gap-1">
              <span>Ambo B (Segundo Número)</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Número (00-99)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={amboB}
                  onChange={(e) => setAmboB(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg text-center rounded-xl p-2 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Posición</label>
                <select
                  value={posB}
                  onChange={(e) => setPosB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5 focus:outline-none focus:border-cyan-400"
                >
                  <option value="5">A los 5</option>
                  <option value="10">A los 10</option>
                  <option value="20">A los 20</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Monto y Resultado de Redoblona */}
        <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <label className="text-[11px] font-bold text-slate-400 block mb-1">Monto a Apostar a la Redoblona ($)</label>
            <input
              type="number"
              min="100"
              step="100"
              value={redoblonaAmount}
              onChange={(e) => setRedoblonaAmount(Number(e.target.value) || 100)}
              className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-4 py-2 w-full sm:w-48 focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div className="text-right w-full sm:w-auto">
            <div className="text-xs text-slate-400">Multiplicador Oficial: <strong className="text-amber-400 font-mono text-sm">{redoblonaMult}x</strong></div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              Premio: ${potentialPrize.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTONES DE CONTROL DE ESTRATEGIA (Debajo de Redoblonas) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Modalidad y Progresión de Apuesta</span>
          </span>
          <button
            type="button"
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="text-[11px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHowItWorks ? 'Ocultar Guía' : '¿Cómo funciona?'}</span>
          </button>
        </div>

        {/* Guía Desplegable Opcional */}
        {showHowItWorks && (
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs text-slate-300 animate-fadeIn">
            <p className="leading-relaxed">
              La estrategia es un <strong>plan financiero matemático</strong>: te dice exactamente cuánto dinero jugar en cada turno para que, al salir tu número, recuperes todo lo invertido en los turnos anteriores y obtengas una ganancia neta.
            </p>
          </div>
        )}

        {/* Botones de Progresión */}
        <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow">
          {[
            { id: 'martingale', label: 'Martingala Inteligente' },
            { id: 'dalembert', label: "D'Alembert Suave" },
            { id: 'target_profit', label: 'Ganancia Fija' }
          ].map((strat) => (
            <button
              key={strat.id}
              type="button"
              onClick={() => setStrategy(strat.id)}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                strategy === strat.id
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {strat.label}
            </button>
          ))}
        </div>

        {/* Botones Rápidos de Turnos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { turnsCount: 3, label: '3 Sorteos (Medio Día)' },
            { turnsCount: 5, label: '5 Sorteos (Día Completo)' },
            { turnsCount: 8, label: '8 Sorteos (2 Días)' },
            { turnsCount: 10, label: '10 Sorteos (Respaldo Máx)' }
          ].map((t) => (
            <button
              key={t.turnsCount}
              type="button"
              onClick={() => setTurns(t.turnsCount)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                turns === t.turnsCount
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. CALCULADORA DE INVERSIÓN Y GANANCIAS */}
      <div className="space-y-4">
        {/* Presupuesto Total Necesario y Ajuste de Apuesta Inicial */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Plan de Cobertura para {turns} Sorteos</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Modalidad: <strong className="text-white">{betType === 'ambo_cabeza' ? 'Ambo a la Cabeza (70x)' : betType === 'terno' ? 'Terno 3 Cifras (500x)' : betType === 'ambo_5' ? 'Ambo a los 5 (14x)' : 'Ambo a los 10 (7x)'}</strong>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <label className="text-[11px] font-bold text-slate-400">Apuesta Inicial:</label>
              <input
                type="number"
                min="50"
                step="50"
                value={baseBet}
                onChange={(e) => setBaseBet(Number(e.target.value) || 50)}
                className="bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-2.5 py-1 text-xs w-24 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto">
            <div className="text-[10px] text-slate-400">Presupuesto Total Necesario</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ${simData.total_budget_needed.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tabla Paso a Paso (Sin fecha ni hora del sorteo) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Tabla Paso a Paso de tu Jugada
            </span>
            <span className="text-[10px] text-slate-400">Toca cualquier turno para simular</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Sorteo</th>
                  <th className="py-2.5 px-3">Apuesta</th>
                  <th className="py-2.5 px-3">Gasto Acumulado</th>
                  <th className="py-2.5 px-3">Premio Bruto</th>
                  <th className="py-2.5 px-3 text-right">Ganancia Neta (Limpia)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {simData.progression_table.map((row) => {
                  const isSelected = simulatedWinTurn === row.turn_number;
                  const shiftNames = ["1° La Previa", "2° Primera", "3° Matutina", "4° Vespertina", "5° Nocturna", "6° Previa", "7° Primera", "8° Matutina", "9° Vespertina", "10° Nocturna"];
                  const label = shiftNames[row.turn_number - 1] || `Sorteo #${row.turn_number}`;

                  return (
                    <tr
                      key={row.turn_number}
                      onClick={() => setSimulatedWinTurn(row.turn_number)}
                      className={`transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/40 font-bold text-white ring-1 ring-emerald-500/50'
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-3 flex items-center gap-1.5 font-sans font-bold">
                        <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`}></span>
                        {label}
                      </td>
                      <td className="py-3 px-3 text-amber-300 font-bold">
                        ${row.turn_bet.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        ${row.accumulated_investment.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        ${row.gross_prize.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-black text-xs sm:text-sm">
                        +${row.net_profit.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Simulation Outcome Toast */}
        {simulatedWinTurn && (
          <div className="bg-emerald-950/50 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-white">
                  ¡Simulación de Acierto en Sorteo #{simulatedWinTurn}!
                </div>
                <div className="text-[11px] text-slate-300">
                  Inversión acumulada hasta este turno: <strong>${simData.progression_table[simulatedWinTurn - 1].accumulated_investment.toLocaleString()}</strong>. Cobras <strong>${simData.progression_table[simulatedWinTurn - 1].gross_prize.toLocaleString()}</strong> y te quedan limpios <strong className="text-emerald-400">+${simData.progression_table[simulatedWinTurn - 1].net_profit.toLocaleString()}</strong>.
                </div>
              </div>
            </div>
            <button
              onClick={() => setSimulatedWinTurn(null)}
              className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
