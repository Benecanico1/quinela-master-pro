import React, { useState, useEffect } from 'react';
import { 
  Moon, Search, Sparkles, Zap, Brain, MessageSquareQuote, 
  Send, HelpCircle, Check, Copy, Flame, ShieldCheck, RefreshCw, Wand2, Compass,
  Crown, Lock, AlertCircle, Timer
} from 'lucide-react';
import { interpretDreamWithAI, getLocalDateString } from '../services/clientEngine';

const QUICK_DREAM_PROMPTS = [
  { label: '❤️ Amor y Pareja', text: 'Soñé con mi pareja y momentos de mucho amor y alegría' },
  { label: '💰 Encontré dinero', text: 'Soñé que encontraba mucho dinero y monedas de oro' },
  { label: '💀 Ser querido fallecido', text: 'Soñé con un familiar muerto que me hablaba' },
  { label: '🌧️ Lluvia y agua limpia', text: 'Soñé con lluvia abundante y agua de río' },
  { label: '🤰 Embarazo o recién nacido', text: 'Soñé que estaba embarazada y tenía un bebé' },
  { label: '🔥 Fuego e incendio', text: 'Soñé con fuego y llamas altas' },
  { label: '🐶 Perro leal', text: 'Soñé con un perro que me cuidaba' },
  { label: '🦷 Dientes cayendo', text: 'Soñé que se me caían los dientes' }
];

const DAILY_FREE_LIMIT = 3;

export default function DreamsTab({ isVip, onOpenUpgrade }) {
  const [dreamInput, setDreamInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [interpretationResult, setInterpretationResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [quotaUsedToday, setQuotaUsedToday] = useState(0);

  // Load and check daily usage quota
  useEffect(() => {
    const todayStr = getLocalDateString();
    const savedDate = localStorage.getItem('quiniela_dream_query_date');
    const savedCount = parseInt(localStorage.getItem('quiniela_dream_query_count') || '0', 10);

    if (savedDate === todayStr) {
      setQuotaUsedToday(savedCount);
    } else {
      localStorage.setItem('quiniela_dream_query_date', todayStr);
      localStorage.setItem('quiniela_dream_query_count', '0');
      setQuotaUsedToday(0);
    }
  }, []);

  const remainingFreeQueries = Math.max(0, DAILY_FREE_LIMIT - quotaUsedToday);
  const isLimitReached = !isVip && remainingFreeQueries <= 0;

  const handleInterpret = (textToAnalyze) => {
    const query = textToAnalyze !== undefined ? textToAnalyze : dreamInput;
    if (!query.trim()) return;

    if (isLimitReached) {
      if (typeof onOpenUpgrade === 'function') {
        onOpenUpgrade();
      }
      return;
    }

    setAnalyzing(true);

    setTimeout(() => {
      const result = interpretDreamWithAI(query);
      setInterpretationResult(result);
      setAnalyzing(false);

      if (!isVip) {
        const nextCount = quotaUsedToday + 1;
        setQuotaUsedToday(nextCount);
        localStorage.setItem('quiniela_dream_query_count', nextCount.toString());
      }
    }, 500);
  };

  const handleSelectQuickPrompt = (promptText) => {
    setDreamInput(promptText);
    handleInterpret(promptText);
  };

  const copyFullTicket = () => {
    if (!interpretationResult || !interpretationResult.candidates) return;
    const c1 = interpretationResult.candidates[0];
    const text = `🌙 Pronóstico Onírico IA (Sueño: "${dreamInput}"):\nAmbo Principal: ${c1.number} ("${c1.significado}")\nTerno: ${c1.suggested_centena}\nCuaterno: ${c1.suggested_cuaterno}\nRedoblona: ${interpretationResult.suggested_redoblona?.pair || 'Ambo'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/40 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase mb-1 border border-purple-500/30">
              <Brain className="w-3.5 h-3.5 text-purple-400" /> Inteligencia Artificial Onírica
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              Oráculo e Intérprete de Sueños con IA
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
              Describe lo que soñaste. La IA analizará el significado psicológico y calculará los números exactos para tu jugada.
            </p>
          </div>

          {/* Daily Quota / VIP Counter */}
          <div className="bg-slate-950 p-2.5 rounded-xl border border-purple-500/30 text-left sm:text-right shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <div>
              <div className="text-[10px] text-slate-400">Cuota Diaria de IA</div>
              <div className="text-sm sm:text-base font-black font-mono text-purple-400">
                {isVip ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Ilimitado (VIP)
                  </span>
                ) : (
                  <span>{remainingFreeQueries} de {DAILY_FREE_LIMIT} disponibles hoy</span>
                )}
              </div>
            </div>
            {!isVip && (
              <button
                onClick={onOpenUpgrade}
                className="text-[9px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md cursor-pointer transition-all"
              >
                Hacerse VIP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Limit Reached Warning Card (If free queries exhausted) */}
      {isLimitReached && (
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-white">
                Has alcanzado el límite diario de {DAILY_FREE_LIMIT} consultas gratuitas
              </div>
              <p className="text-[11px] text-slate-300">
                Para evitar sobrecargas y seguir interpretando sueños ilimitadamente hoy, activa tu acceso VIP o espera a que se renueve tu cuota a las 00:00 hs.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUpgrade}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 shrink-0"
          >
            Desbloquear Consultas Ilimitadas (VIP)
          </button>
        </div>
      )}

      {/* Interactive AI Dream Query Box */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5">
        <div>
          <label className="text-xs font-black text-white uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ¿Qué soñaste anoche?
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder="Escribe tu sueño con naturalidad: 'soñé que encontraba monedas de oro en el mar', 'soñé con lluvia abundante y agua clara', 'soñé con un perro leal'..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-purple-500 rounded-2xl p-3.5 text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        {/* 1-Tap Popular Dream Pills */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Consultas populares sugeridas:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_DREAM_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => handleSelectQuickPrompt(p.text)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  dreamInput === p.text
                    ? 'bg-purple-600 text-white shadow-md font-black'
                    : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-purple-500/40 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={() => handleInterpret(dreamInput)}
          disabled={analyzing || !dreamInput.trim()}
          className={`w-full py-3.5 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 disabled:opacity-50 ${
            isLimitReached
              ? 'bg-gradient-to-r from-amber-600 to-amber-500'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500'
          }`}
        >
          {analyzing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : isLimitReached ? (
            <Crown className="w-4 h-4 text-amber-200" />
          ) : (
            <Wand2 className="w-4 h-4 text-amber-300" />
          )}
          <span>
            {analyzing 
              ? 'Consultando a la Inteligencia Artificial Onírica...' 
              : isLimitReached 
                ? 'Límite Diario Alcanzado - Pasar a VIP' 
                : 'Interpretar Sueño con Inteligencia Artificial'}
          </span>
        </button>
      </div>

      {/* Initial Guidance Card when no interpretation requested yet */}
      {!interpretationResult && !analyzing && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-2.5 shadow animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Moon className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-black text-white">Tu Oráculo Onírico con IA está listo</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Escribe en el recuadro superior lo que recuerdes de tu sueño o pulsa en cualquiera de las sugerencias rápidas para que la Inteligencia Artificial analice el significado y te entregue tu Ambo, Terno, Cuaterno y Redoblona.
          </p>
        </div>
      )}

      {/* AI Interpretation Outcome */}
      {interpretationResult && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Detailed Interpretation Card */}
          <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 rounded-2xl p-4 sm:p-6 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <MessageSquareQuote className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] uppercase font-black text-purple-400 tracking-wider">Interpretación de la IA</span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {interpretationResult.theme}
                  </h3>
                </div>
              </div>

              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{interpretationResult.confidence}% Conexión Onírica</span>
              </div>
            </div>

            {/* Explanation paragraph */}
            <div className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                <Compass className="w-4 h-4" /> ¿Qué significa lo que soñaste?
              </div>
              <p>{interpretationResult.interpretation}</p>
            </div>

            {/* Subconscious message */}
            <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl flex items-center gap-2.5 text-xs text-purple-200">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <strong>Mensaje Revelado:</strong> {interpretationResult.subconscious_message}
              </div>
            </div>
          </div>

          {/* Predicted Lucky Numbers for this Dream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" /> Números Pronosticados para este Sueño
              </h3>
              <span className="text-[10px] text-purple-300 font-bold">Ambo + Terno + Cuaterno</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {interpretationResult.candidates?.map((cand, idx) => (
                <div
                  key={cand.number}
                  className={`rounded-2xl p-4 transition-all border ${
                    idx === 0
                      ? 'bg-gradient-to-b from-purple-950/50 via-slate-900 to-slate-900 border-purple-500/60 shadow-lg ring-1 ring-purple-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight px-3 py-1 rounded-xl bg-slate-950 text-amber-400 border border-purple-500/40 shadow-inner">
                        {cand.number}
                      </span>
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase">
                          {idx === 0 ? 'AMBO PRINCIPAL' : `AMBO REVELADO #${idx + 1}`}
                        </div>
                        <div className="text-base font-black text-white">
                          "{cand.significado}"
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2.5 line-clamp-2">
                    {cand.reason}
                  </p>

                  {/* Terno and Cuaterno breakdown */}
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Terno:</span>
                      <span className="font-mono font-black text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
                        {cand.suggested_centena}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400">Cuaterno:</span>
                      <span className="font-mono font-black text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
                        {cand.suggested_cuaterno}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Dream Redoblona and Quick Copy */}
          {interpretationResult.suggested_redoblona && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Redoblona Onírica Sugerida</div>
                  <div className="text-[11px] text-amber-300 font-mono font-bold">
                    {interpretationResult.suggested_redoblona.pair} • <span className="text-slate-400 font-sans font-normal">{interpretationResult.suggested_redoblona.note}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={copyFullTicket}
                className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Jugada Copiada!' : 'Copiar Jugada del Sueño'}</span>
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
