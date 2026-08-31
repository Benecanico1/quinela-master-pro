import React, { useState } from 'react';
import { 
  Calculator, Layers, TrendingUp, DollarSign, ShieldCheck, Zap,
  HelpCircle, CheckCircle2, ArrowRight, Play, Sparkles, AlertCircle
} from 'lucide-react';
import { simulateClientBankroll } from '../services/clientEngine';

export default function BankrollTab({ predictions }) {
  const [activeSubTab, setActiveSubTab] = useState('bankroll'); // 'bankroll', 'redoblonas'

  // Bankroll state
  const [baseBet, setBaseBet] = useState(200);
  const [turns, setTurns] = useState(5);
  const [strategy, setStrategy] = useState('martingale');
  const [targetProfit, setTargetProfit] = useState(10000);
  const [betType, setBetType] = useState('ambo_cabeza');
  const [simulatedWinTurn, setSimulatedWinTurn] = useState(null);

  // Redoblona state
  const [amboA, setAmboA] = useState('28');
  const [posA, setPosA] = useState('1');
  const [amboB, setAmboB] = useState('64');
  const [posB, setPosB] = useState('10');
  const [redoblonaAmount, setRedoblonaAmount] = useState(500);

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
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Sub-tab Switcher */}
      <div className="grid grid-cols-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 shadow">
        <button
          onClick={() => setActiveSubTab('bankroll')}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'bankroll' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" /> Plan de Apuestas Inteligente
        </button>

        <button
          onClick={() => setActiveSubTab('redoblonas')}
          className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === 'redoblonas' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Redoblonas & Premios (700x)
        </button>
      </div>

      {/* Sub-view: Martingale / Bankroll */}
      {activeSubTab === 'bankroll' && (
        <div className="space-y-4 sm:space-y-6">
          
          {/* Simple Explanation Card for Beginners */}
          <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ¿Cómo funciona la Estrategia? (Explicado en 3 pasos sencillos)
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              La estrategia es un <strong>plan financiero matemático</strong>. En vez de apostar a ciegas, te dice exactamente cuánto dinero jugar en cada turno del día para que, <strong>en cuanto salga el número, recuperes todo lo gastado en los turnos anteriores y te quede una ganancia neta garantizada</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-center leading-4 text-[10px] font-black">1</span>
                  Elige tu número
                </div>
                <p className="text-[11px] text-slate-400">
                  Toma el número Top 1 recomendado por la IA para el día (ej: <strong>28</strong>).
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-center leading-4 text-[10px] font-black">2</span>
                  Sigue la tabla
                </div>
                <p className="text-[11px] text-slate-400">
                  Juega el monto exacto en el 1° sorteo. Si no sale, pasas al siguiente con el monto calculado.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-center leading-4 text-[10px] font-black">3</span>
                  Ganas y reinicias
                </div>
                <p className="text-[11px] text-slate-400">
                  Apenas sale tu número en cualquier turno, <strong>cobras, recuperas todo y reinicias desde el turno 1</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Header Banner with Budget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Calculadora de Inversión y Ganancias</div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-0.5">Plan de Cobertura para 5 Sorteos</h3>
              <p className="text-[11px] text-slate-400">Presupuesto total para jugar con respaldo todo el día</p>
            </div>
            <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto">
              <div className="text-[10px] text-slate-400">Presupuesto Total Necesario</div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                ${simData.total_budget_needed.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Apuesta Inicial ($)</label>
              <input
                type="number"
                min="50"
                step="50"
                value={baseBet}
                onChange={(e) => setBaseBet(Number(e.target.value) || 50)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Cantidad de Turnos</label>
              <select
                value={turns}
                onChange={(e) => setTurns(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value={3}>3 Turnos (Medio día)</option>
                <option value={5}>5 Turnos (Día completo)</option>
                <option value={8}>8 Turnos (2 días)</option>
                <option value={10}>10 Turnos (Respaldo máx)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Modalidad de Juego</label>
              <select
                value={betType}
                onChange={(e) => setBetType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="ambo_cabeza">Ambo a la Cabeza (Paga 70x)</option>
                <option value="terno">Terno 3 Cifras (Paga 500x)</option>
                <option value="ambo_5">Ambo a los 5 (Paga 14x)</option>
                <option value="ambo_10">Ambo a los 10 (Paga 7x)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">Tipo de Progresión</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="martingale">Martingala Inteligente</option>
                <option value="dalembert">D'Alembert (Suave)</option>
                <option value="target_profit">Ganancia Fija</option>
              </select>
            </div>
          </div>

          {/* Interactive Simulation Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Tabla Paso a Paso de tu Jugada
              </span>
              <span className="text-[10px] text-slate-400">Toca cualquier turno para simular tu victoria</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Turno / Sorteo</th>
                    <th className="py-2.5 px-3">Apuestas</th>
                    <th className="py-2.5 px-3">Gasto Acumulado</th>
                    <th className="py-2.5 px-3">Premio Bruto</th>
                    <th className="py-2.5 px-3 text-right">Ganancia Neta (Limpia)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {simData.progression_table.map((row) => {
                    const isSelected = simulatedWinTurn === row.turn_number;
                    const shiftNames = ["1° La Previa (10:15)", "2° Primera (12:00)", "3° Matutina (15:00)", "4° Vespertina (18:00)", "5° Nocturna (21:00)", "6° Previa Mañana", "7° Primera Mañana", "8° Matutina Mañana", "9° Vesp Mañana", "10° Noct Mañana"];
                    const label = shiftNames[row.turn_number - 1] || `Turno #${row.turn_number}`;

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
                    ¡Simulación de Acierto en Turno #{simulatedWinTurn}!
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Inversión total acumulada hasta este turno: <strong>${simData.progression_table[simulatedWinTurn - 1].accumulated_investment.toLocaleString()}</strong>. Cobras <strong>${simData.progression_table[simulatedWinTurn - 1].gross_prize.toLocaleString()}</strong> y te quedan limpios <strong className="text-emerald-400">+${simData.progression_table[simulatedWinTurn - 1].net_profit.toLocaleString()}</strong>.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSimulatedWinTurn(null)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800 shrink-0"
              >
                Cerrar
              </button>
            </div>
          )}

        </div>
      )}

      {/* Sub-view: Redoblonas */}
      {activeSubTab === 'redoblonas' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
            <h2 className="text-base sm:text-xl font-black text-white">
              Calculadora de Redoblonas Candado (Hasta 700x)
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Una redoblona consiste en acertar 2 números en el mismo sorteo. Si ambos salen en las posiciones elegidas, tu apuesta se multiplica exponencialmente.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Primer Número */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-amber-400 uppercase">Primer Número (Ambo A)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Número</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={amboA}
                      onChange={(e) => setAmboA(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg text-center rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Posición</label>
                    <select
                      value={posA}
                      onChange={(e) => setPosA(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5"
                    >
                      <option value="1">Al 1° (A la Cabeza)</option>
                      <option value="5">A los 5</option>
                      <option value="10">A los 10</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Segundo Número */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-cyan-400 uppercase">Segundo Número (Ambo B)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Número</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={amboB}
                      onChange={(e) => setAmboB(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-mono font-bold text-lg text-center rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Posición</label>
                    <select
                      value={posB}
                      onChange={(e) => setPosB(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl p-2.5"
                    >
                      <option value="5">A los 5</option>
                      <option value="10">A los 10</option>
                      <option value="20">A los 20</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Monto a Apostar a la Redoblona ($)</label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={redoblonaAmount}
                  onChange={(e) => setRedoblonaAmount(Number(e.target.value) || 100)}
                  className="bg-slate-900 border border-slate-700 text-white font-bold text-sm rounded-xl px-4 py-2 w-full sm:w-48"
                />
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">Multiplicador Oficial: <strong className="text-amber-400 font-mono">{redoblonaMult}x</strong></div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  Premio: ${potentialPrize.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
