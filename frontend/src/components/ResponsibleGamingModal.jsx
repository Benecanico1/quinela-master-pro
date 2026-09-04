import React from 'react';
import { ShieldAlert, AlertTriangle, Scale, X, CheckCircle2, Phone } from 'lucide-react';

export default function ResponsibleGamingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-950 border-2 border-amber-500/50 rounded-3xl max-w-lg w-full p-5 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Información Importante
              </h2>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Transparencia & Juego Responsable
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Declaración Central Obligatoria */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 text-sm leading-relaxed text-slate-300">
          <p className="font-semibold text-white">
            <strong>Quiniela Master Pro</strong> es una herramienta de análisis estadístico y no puede garantizar resultados de sorteos.
          </p>

          <p>
            Los sorteos de lotería son eventos inciertos y los resultados históricos <strong>no garantizan resultados futuros</strong>.
          </p>

          <p>
            Las estadísticas, rankings e índices mostrados por la aplicación son únicamente informativos y <strong>no constituyen una garantía de premio ni una recomendación de apuesta</strong>.
          </p>

          <p className="text-amber-300 font-bold">
            Jugar implica riesgo económico. Utilice esta información de manera responsable y únicamente si es mayor de 18 años.
          </p>
        </div>

        {/* Advertencia de Salud y Ayuda al Jugador Problemático */}
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-black text-xs sm:text-sm uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>EL JUGAR COMPULSIVAMENTE ES PERJUDICIAL PARA LA SALUD</span>
          </div>
          <p className="text-xs text-rose-200/90">
            Solo para mayores de 18 años (+18). Si usted o alguien que conoce tiene problemas con el juego, busque ayuda profesional gratuita:
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="font-mono font-bold text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-400" />
              Línea Gratuita Nacional: 0800-444-4000
            </span>
            <span className="text-[11px] text-slate-400">Atención anónima y confidencial 24/7</span>
          </div>
        </div>

        {/* Desvinculación de Organismos Oficiales */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-bold text-slate-300">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>Aclaración sobre Organismos de Lotería:</span>
          </div>
          <p className="leading-normal">
            Esta aplicación <strong>no está asociada, avalada, autorizada ni respaldada</strong> por Lotería de la Ciudad de Buenos Aires (LOTBA S.E.), Instituto Provincial de Lotería y Casinos (IPLyC) ni por ningún ente gubernamental de lotería.
          </p>
          <p className="text-[11px] text-slate-500">
            <strong>Fuente de resultados:</strong> Consulta de extractos públicos oficiales únicamente con fines de verificación informativa.
          </p>
        </div>

        {/* Botón de Aceptación */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Comprendo y Acepto los Términos de Uso</span>
        </button>

      </div>
    </div>
  );
}
