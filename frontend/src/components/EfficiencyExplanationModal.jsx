import React from 'react';
import { 
  X, Activity, CheckCircle2, TrendingUp, BarChart3, 
  Cpu, ShieldCheck, HelpCircle, Layers, Award, AlertTriangle
} from 'lucide-react';

export default function EfficiencyExplanationModal({ isOpen, onClose, rate = "Auditoría Dinámica" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Auditoría del Motor Estadístico
              </h3>
              <p className="text-[11px] text-slate-400">Metodología matemática y verificación retrospectiva</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-300">
          
          {/* Big Stat Highlight Card */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-950 to-emerald-950/40 p-4 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Muestra Analizada</span>
              <div className="text-2xl font-black text-white font-mono">{rate}</div>
              <div className="text-[11px] text-slate-400">Base oficial de más de 2.200 sorteos oficiales verificados</div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black text-center">
              Auditoría<br/><span className="text-[9px] font-normal">Trazabilidad 100%</span>
            </div>
          </div>

          {/* 4 Pillars Explained Mathematically */}
          <div className="space-y-2.5">
            <div className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-amber-400" /> Los 4 Factores del Motor Estadístico
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Pillar 1 */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-black">1</div>
                  Frecuencia Histórica y Atraso Observado
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Registra las apariciones acumuladas y el número de sorteos transcurridos desde la última salida del ambo. <em>Nota técnica:</em> En sorteos aleatorios independientes, el atraso no fuerza la aparición futura; describe únicamente la anomalía temporal observada respecto a la media esperada.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-black">2</div>
                  Cadenas de Markov (Transición Estocástica)
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Calcula la matriz empírica de probabilidades condicionales: con qué frecuencia relativa una terminación específica ha sucedido a la terminación del sorteo precedente en el histórico oficial.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-black">3</div>
                  Distribución Agregada (Sumas y Paridad)
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Evalúa la densidad empírica de sumas de cifras y equilibrios par/impar. La mayor concentración observada se sitúa en combinaciones de suma media (entre 7 y 11) y patrones mixtos.
                </p>
              </div>

              {/* Pillar 4 */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <div className="flex items-center gap-2 font-bold text-white text-xs sm:text-sm">
                  <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-black">4</div>
                  Resonancia Inter-Loterías y Pizarra a Cabeza
                </div>
                <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                  Monitorea las transferencias empíricas entre sorteos de Ciudad y Provincia en la misma jornada y los saltos desde la pizarra de 20 premios de turnos anteriores hacia la cabeza.
                </p>
              </div>
            </div>
          </div>

          {/* Responsible Gaming Notice */}
          <div className="bg-amber-950/30 p-3.5 rounded-2xl border border-amber-500/30 text-[11px] text-amber-200/90 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Aviso de Responsabilidad y Rigor Matemático:</span>
            </div>
            <p className="text-[10.5px] leading-relaxed">
              Quiniela Master Pro es una herramienta analítica y de estudio estadístico. Los cálculos y rankings se derivan estrictamente de los extractos oficiales pasados. Los sorteos de lotería son eventos aleatorios independientes; el rendimiento histórico no garantiza resultados en sorteos futuros.
            </p>
          </div>

          {/* Button */}
          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow cursor-pointer transition-all active:scale-95"
            >
              Entendido, volver a los Pronósticos
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
