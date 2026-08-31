import React, { useState } from 'react';
import { X, Sparkles, Trophy, Calculator, Moon, Radio, ChevronRight, CheckCircle, Lightbulb, BookOpen, Crown, UserCheck, ShieldCheck } from 'lucide-react';

export default function GuideModal({ isOpen, onClose, user }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const isGuest = !user?.is_vip && (!user?.email || user?.email === 'visita@quiniela.com');

  const steps = [
    {
      title: "1. Tu Cuenta y Membresía VIP (+15 Días Gratis)",
      icon: Crown,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            ¡Bienvenido a <strong>Quinela Master Pro AI</strong>! Aquí te explicamos cómo funciona tu acceso:
          </p>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {user?.is_vip ? '¡Tienes Activos 15 Días VIP Gratis!' : '¿Cómo activar tus 15 Días VIP?'}
            </div>
            
            {user?.is_vip ? (
              <p className="text-slate-300 text-xs leading-relaxed">
                Tu cuenta está registrada y cuenta con <strong className="text-emerald-400">15 DÍAS VIP DE PRUEBA</strong>. Tienes acceso completo a los <strong>5 pronósticos del día</strong>, sugerencias de ternos/cuaternos, la calculadora de bankroll y todas las estrategias.
              </p>
            ) : (
              <div className="space-y-1.5 text-xs text-slate-300">
                <p>
                  Si entraste en <strong>Modo Invitado (Sin cuenta)</strong>, estás en la versión básica gratuita:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Podrás ver libremente <strong>1 número diario de pronóstico</strong>.</li>
                  <li>Los pronósticos #2 al #5 y las herramientas de bankroll requieren registro VIP.</li>
                  <li><strong className="text-amber-300">¿Quieres los 15 días VIP?</strong> Solo toca el botón <strong>"VIP"</strong> o <strong>"Configuración"</strong> en la barra superior y regístrate gratis con Google o correo.</li>
                </ul>
              </div>
            )}
          </div>

          <p className="text-slate-400 italic text-[11px]">
            💡 El registro es 100% gratuito y no requiere tarjeta de crédito para iniciar tu prueba.
          </p>
        </div>
      )
    },
    {
      title: "2. Pronósticos AI Inteligentes",
      icon: Sparkles,
      color: "text-amber-400",
      bgColor: "from-amber-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            El motor de Inteligencia Artificial analiza los últimos sorteos y calcula los <strong>números con mayor probabilidad matemática de salir a la cabeza</strong>.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300">¿Cómo jugarlo?</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Ambo (2 cifras):</strong> El número principal sugerido (ej: 28 "El Cerro" paga <strong>70x</strong>).</li>
              <li><strong>Terno (3 cifras):</strong> Centena recomendada (ej: 428) que paga <strong>500x</strong>.</li>
              <li><strong>Cuaterno (4 cifras):</strong> Millar sugerido (ej: 3428) que paga <strong>3.500x</strong>.</li>
            </ul>
          </div>
          <p className="text-slate-400 italic">
            💡 Toca cualquier tarjeta para ver su justificación estadística (atraso, calor y cadena de Markov).
          </p>
        </div>
      )
    },
    {
      title: "3. Sorteos & Resultados Oficiales",
      icon: Trophy,
      color: "text-amber-300",
      bgColor: "from-amber-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            En la sección de <strong>Resultados</strong> puedes auditar y contrastar qué números salieron en cada turno (*La Previa, Primera, Matutina, Vespertina y Nocturna*) tanto de <strong>Ciudad como de Provincia</strong>.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-amber-300">Pizarra de 20 Posiciones:</div>
            <p className="text-slate-400">
              Haz clic en <strong>"Ver 20 Premios"</strong> para desplegar el tablero oficial completo del 1 al 20 y verificar aciertos en premios menores o redoblonas.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "4. Estrategia & Calculadora Martingala",
      icon: Calculator,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            Jugar a la quiniela sin un plan de dinero lleva a pérdidas. La <strong>Estrategia de Bankroll</strong> calcula exactamente cuánto apostar en cada turno para que cuando aciertes, <strong>recuperes el 100% de lo invertido y asegures ganancia neta</strong>.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="font-bold text-emerald-400">Redoblonas (Hasta 700x):</div>
            <p className="text-slate-400">
              Combina 2 números (ej: al 1° y al 10°) y simula tu pago con la calculadora oficial de multiplicadores.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "5. Libro de los Sueños Táctil",
      icon: Moon,
      color: "text-purple-400",
      bgColor: "from-purple-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            Traduce tus sueños a números de la suerte según la tabla clásica tradicional argentina (del 00 al 99).
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-purple-300">Búsqueda Rápida:</div>
            <p className="text-slate-400">
              Puedes escribir directamente en el buscador o tocar los botones rápidos (*"Dinero"*, *"Lluvia"*, *"Fuego"*, *"Perro"*, *"Accidente"*, *"Boda"*) para obtener el ambo, terno y cuaterno al instante.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "6. Radar & Alertas en Vivo",
      icon: Radio,
      color: "text-cyan-400",
      bgColor: "from-cyan-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            El radar monitorea en tiempo real la apertura y cierre de apuestas para cada sorteo del día.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-cyan-300">Herramientas Visuales:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Mapa Térmico:</strong> Visualiza en colores qué números están "calientes" y cuáles "fríos".</li>
              <li><strong>Semáforo de Atrasos:</strong> Detecta números con ratio mayor a 1.3x en zona de maduración.</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "7. Validador & Billetera Oficial de Boletos",
      icon: ShieldCheck,
      color: "text-emerald-400",
      bgColor: "from-emerald-500/20 to-slate-900",
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-300">
          <p>
            Coteja cualquier boleto impreso en tiempo real contra los extractos oficiales de <strong>Lotería de la Ciudad (LOTBA)</strong> y <strong>Provincia de Buenos Aires (IPLyC)</strong>.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
            <div className="font-bold text-emerald-400">Funciones Clave:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li><strong>Captura de Foto:</strong> Toma una foto a tu boleto para leer el código de barras y secuencia de control.</li>
              <li><strong>Liquidación Oficial:</strong> Conoce al instante el monto exacto a cobrar en tu agencia autorizada.</li>
              <li><strong>Comprobante Digital:</strong> Genera, imprime o comparte tu comprobante térmico oficial autenticado.</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${current.bgColor} border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-amber-400">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                Guía de Uso • Paso {currentStep + 1} de {steps.length}
              </span>
              <h3 className="text-base sm:text-lg font-black text-white">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {current.content}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-6 bg-amber-500' : 'w-2 bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Anterior
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer transition-all flex items-center gap-1"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl shadow cursor-pointer transition-all flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" /> ¡Entendido! Entrar a la App
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
