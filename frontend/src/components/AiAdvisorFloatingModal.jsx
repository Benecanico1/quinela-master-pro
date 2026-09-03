import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, MessageCircle, X, Send, Sparkles, ChevronRight, 
  ExternalLink, PhoneCall, HelpCircle, ArrowRight, Zap, 
  Layers, CheckCircle2, Crown, ShieldAlert, Award, Compass
} from 'lucide-react';

const SUPPORT_WHATSAPP_NUMBER = '5491159158512';
const SUPPORT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;

const QUICK_TOPICS = [
  { id: 'predictions', label: '🎯 ¿Cómo funcionan los Pronósticos?', query: '¿Cómo funcionan los pronósticos de la IA?' },
  { id: 'agencies', label: '📍 ¿Dónde hay agencias oficiales cerca?', query: '¿Dónde encuentro agencias oficiales de lotería cercanas y cómo llegar?' },
  { id: 'slip', label: '🎟️ ¿Cómo usar el Cupón para el Agenciero?', query: '¿Cómo funciona el cupón digital con letra grande para mostrar en la agencia?' },
  { id: 'audit', label: '🛡️ ¿Cómo se auditan los aciertos en el Radar?', query: '¿Cómo audita la IA los aciertos día por día y dónde caen los premios?' },
  { id: 'draws', label: '📊 ¿Dónde ver los resultados oficiales?', query: '¿A qué hora son los sorteos y cómo veo los resultados sin complicarme?' },
  { id: 'strategy', label: '🧮 ¿Cómo calcular Redoblonas y Bankroll?', query: '¿Cómo funciona la calculadora de redoblonas y gestión de saldo?' },
  { id: 'vip', label: '👑 ¿Cómo activar el Pase VIP?', query: '¿Qué incluye el VIP y cómo lo pago por Mercado Pago o USDT?' },
  { id: 'wallet', label: '📷 ¿Cómo escanear mi ticket?', query: '¿Cómo puedo escanear y verificar mi boleto de quiniela con la cámara?' },
  { id: 'notifs', label: '🔔 ¿Cómo funcionan las Notificaciones y Pop-ups?', query: '¿Dónde veo los mensajes y novedades del administrador?' },
  { id: 'dreams', label: '🌙 ¿Cómo buscar mis sueños?', query: '¿Cómo convierto lo que soñé en números de la suerte?' },
  { id: 'whatsapp', label: '💬 Hablar con Soporte Humano', query: 'Quiero hablar con una persona de soporte por WhatsApp' }
];

export default function AiAdvisorFloatingModal({ activeTab, onNavigate, onOpenUpgrade }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: '👋 ¡Hola! Soy tu **Asesor Experto de Quinela Master Pro**.\n\nConozco el funcionamiento completo de la aplicación de punta a punta. ¿En qué te puedo orientar hoy? Puedes hacerme cualquier consulta o elegir un tema rápido:',
      action: null,
      time: 'Ahora'
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const handleOpenWhatsApp = (customMsg = '') => {
    const textParam = encodeURIComponent(
      customMsg || 'Hola, me comunico desde la app Quinela Master Pro. Necesito asistencia con una consulta.'
    );
    window.open(`${SUPPORT_WHATSAPP_URL}?text=${textParam}`, '_blank');
  };

  const processUserQuery = (query) => {
    const q = query.toLowerCase().trim();

    // 1. Buscador y Mapa de Agencias Cercanas con GPS
    if (q.includes('agencia') || q.includes('mapa') || q.includes('cercana') || q.includes('cerca') || q.includes('donde jugar') || q.includes('dónde jugar') || q.includes('gps') || q.includes('ubicacion') || q.includes('ubicación') || q.includes('como llegar') || q.includes('cómo llegar')) {
      return {
        text: '📍 **Buscador y Mapa de Agencias Oficiales (LOTBA & IPLyC)**:\n\n• En la pestaña **Estrategia** dispones del **Mapa y Buscador de Agencias Cercanas**.\n• **Búsqueda Inteligente:** Puedes escribir tu barrio, calle o localidad (ej. *Palermo, Belgrano, San Isidro, Morón, Quilmes*).\n• **GPS Cerca de Mí:** Al pulsar *"Buscar Cerca de Mí (GPS)"*, la app calcula la distancia exacta en km y te ordena las agencias más próximas.\n• **Ruta en Google Maps:** Cada agencia tiene el botón *"Cómo Llegar"* que abre directamente la ruta paso a paso en Google Maps.\n• **Juego Online:** Si prefieres jugar desde el celular, te provee el acceso oficial a **lotba.bet.ar**.',
        action: {
          type: 'tab',
          tabId: 'bankroll',
          label: '📍 Ir al Mapa de Agencias'
        }
      };
    }

    // 2. Cupón Digital para el Agenciero / Letra Grande / Modo Jugada Rápida
    if (q.includes('cupon') || q.includes('cupón') || q.includes('agenciero') || q.includes('boleta') || q.includes('letra grande') || q.includes('adulto') || q.includes('mayor') || q.includes('mostrar') || q.includes('facil') || q.includes('fácil') || q.includes('rapida') || q.includes('rápida')) {
      return {
        text: '🎟️ **Cupón Digital para el Agenciero (Modo Jugada Rápida)**:\n\n• En la pestaña de **Pronósticos**, pulsa el botón **"🎟️ Cupón Agenciero (Letra Grande)"**.\n• Te genera una boleta digital en pantalla completa con **números gigantes y de alto contraste**.\n• Diseñado especialmente para **mostrárselo directamente al agenciero en la ventanilla** o para personas mayores sin necesidad de anotar en un papel.\n• Detalla con absoluta claridad qué jugar al 1° Premio (Cabeza), a los 5, a los 10, a los 20 y en Redoblona.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Abrir Pronósticos y Cupón'
        }
      };
    }

    // 3. Auditoría, Radar de Aciertos y Métricas Certeras (Dónde caen los premios)
    if (q.includes('radar') || q.includes('auditor') || q.includes('ranking') || q.includes('certer') || q.includes('donde cayo') || q.includes('dónde cayeron') || q.includes('pleno') || q.includes('kpi') || q.includes('verdad') || q.includes('estadistica') || q.includes('estadística')) {
      return {
        text: '🛡️ **Auditoría Dinámica del Radar (100% Certera Día por Día)**:\n\n• La app audita en vivo cada sorteo oficial completado de LOTBA e IPLyC contra las predicciones emitidas.\n• **Dónde Caeron los Premios:** Te muestra la ubicación exacta del acierto:\n  - 👑 **A la Cabeza (1° Premio Pleno 70x)**\n  - 🎯 **A los 5 Premios (Multiplicador 14x)**\n  - 💎 **A los 10 Premios (Multiplicador 7x)**\n  - 🛡️ **A los 20 Premios (Multiplicador 3.5x)**\n• **Cero Datos Falsos:** Si un turno aún no se jugó (como Vespertina o Nocturna), figura como *"⏳ Programado"* y no inventa números.\n• **Botón de Copiar Informe:** Genera el balance verificado del día para compartir en WhatsApp.',
        action: {
          type: 'tab',
          tabId: 'stats_radar',
          label: '📊 Ver Radar y Ranking Auditado'
        }
      };
    }

    // 4. Resultados Oficiales Despejados (Menú de 3 Opciones)
    if (q.includes('resultado') || q.includes('sorteo') || q.includes('horario') || q.includes('pizarra') || q.includes('ayer') || q.includes('hoy') || q.includes('previa') || q.includes('primera') || q.includes('matutina') || q.includes('vespertina') || q.includes('nocturna') || q.includes('extracto') || q.includes('20 numeros') || q.includes('20 premios')) {
      return {
        text: '📊 **Resultados Oficiales Organizados y Claros**:\n\nLa pestaña Resultados fue rediseñada para no aturdirte con exceso de datos:\n• **🏆 Sorteos de Hoy:** Muestra directo las pizarras oficiales del día (el sorteo más reciente primero) con botón pop-up para ver los 20 premios completos.\n• **📅 Buscar por Fecha / Turno:** Te permite buscar cualquier día anterior (*Hoy, Ayer o por Calendario*) y filtrar por turno específico (*La Previa, Primera, Matutina, Vespertina, Nocturna*).\n• **📜 Historial Auditado:** Archivo histórico con los aciertos verificados de la IA.\n• **Horarios oficiales:** La Previa 10:15 hs | Primera 12:00 hs | Matutina 15:00 hs | Vespertina 18:00 hs | Nocturna 21:00 hs.',
        action: {
          type: 'tab',
          tabId: 'draws_history',
          label: '📊 Ver Resultados Oficiales'
        }
      };
    }

    // 5. Calculadora de Redoblonas y Bankroll
    if (q.includes('redoblona') || q.includes('bankroll') || q.includes('martingala') || q.includes('estrategia') || q.includes('saldo') || q.includes('presupuesto') || q.includes('candado')) {
      return {
        text: '🧮 **Calculadora de Redoblonas y Bankroll**:\n\n• **Redoblona Candado (Hasta 700x):** Calcula tu ganancia exacta combinando 2 números en distintas posiciones (ej: Cabeza con 10, a los 5 con los 10, o a los 20).\n• **Simulador de Bankroll:** Aplica progresiones matemáticas (Martingala o Proporcional) para recuperar apuestas y garantizar ganancias netas.\n• En la misma pestaña de **Estrategia** dispones también del mapa de agencias oficiales.',
        action: {
          type: 'tab',
          tabId: 'bankroll',
          label: '🧮 Ir a Estrategia y Redoblonas'
        }
      };
    }

    // 6. Notificaciones, Campanita y Pop-ups del Administrador
    if (q.includes('notificacion') || q.includes('notificación') || q.includes('campana') || q.includes('campanita') || q.includes('popup') || q.includes('pop up') || q.includes('mensaje') || q.includes('aviso') || q.includes('actualizacion') || q.includes('actualización')) {
      return {
        text: '🔔 **Campanita de Notificaciones y Pop-ups Informativos**:\n\n• En la esquina superior derecha de la app tienes la **Campanita de Notificaciones** con contador de mensajes no leídos.\n• Allí el Administrador te enviará novedades importantes, avisos de sorteos y avisos de nuevas versiones disponibles.\n• **Persistencia:** Los mensajes quedan guardados en tu campanita hasta que decidas borrarlos.\n• **Pop-ups en Pantalla:** Los comunicados urgentes se abrirán automáticamente como aviso destacado.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Volver al Inicio'
        }
      };
    }

    // 7. Costo / Gastos / Consumo de la IA
    if (q.includes('gasto') || q.includes('costo') || q.includes('consume') || q.includes('gasta') || q.includes('cobran') || q.includes('api') || q.includes('gratis')) {
      return {
        text: '💡 **Costo y Consumo de la IA**:\n\n• **¡Consumo $0 (Cero Costo)!** El motor de inteligencia artificial y este Asesor Virtual funcionan de manera 100% local y optimizada dentro de tu aplicación.\n• **No genera ningún cargo extra en tu cuenta ni costos de servidor por consultar.** Puedes preguntar y usar los pronósticos con total tranquilidad.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ver Pronósticos de IA'
        }
      };
    }

    // 8. VIP / Planes / Pago / Suscripción
    if (q.includes('vip') || q.includes('pago') || q.includes('pagar') || q.includes('precio') || q.includes('suscrip') || q.includes('mercado pago') || q.includes('usdt')) {
      return {
        text: '👑 **Membresía VIP Quinela Master Pro**:\n\n• **Acceso Total:** Desbloquea el Top 5 de Pronósticos de Alta Probabilidad, Cuaternos (3.500x) y Redoblonas Candado (700x).\n• **Medios de Pago:** Mercado Pago (Transferencia / Alias) y USDT TRC-20.\n• **Activación:** Se acredita de forma inmediata o enviando tu comprobante a nuestro soporte por WhatsApp.',
        action: {
          type: 'modal',
          label: '👑 Ver Planes y Activar VIP',
          handler: () => {
            setIsOpen(false);
            if (onOpenUpgrade) onOpenUpgrade();
          }
        },
        showWhatsApp: true
      };
    }

    // 9. Premios / Cuánto Paga / Multiplicadores
    if (q.includes('cuanto paga') || q.includes('cuánto paga') || q.includes('paga') || q.includes('multiplicador') || q.includes('ambo') || q.includes('terno') || q.includes('cuaterno')) {
      return {
        text: '💰 **Tabla Oficial de Premios y Multiplicadores**:\n\n• **Ambo (2 cifras):**\n  - A la Cabeza (1° Premio): Paga **70 veces** lo apostado.\n  - A los 5: Paga **14 veces**.\n  - A los 10: Paga **7 veces**.\n  - A los 20: Paga **3.5 veces**.\n• **Terno (3 cifras):**\n  - A la Cabeza: Paga **500 veces** lo apostado.\n  - A los 20: Paga **25 veces**.\n• **Cuaterno (4 cifras):**\n  - A la Cabeza: Paga **3.500 veces** lo apostado.\n  - A los 20: Paga **175 veces**.\n• **Redoblona:** Paga hasta **700 veces** cuando aciertas ambos números.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ver Pronósticos del Turno'
        }
      };
    }

    // 10. Escáner / Billetera / Ticket / Controlar
    if (q.includes('escan') || q.includes('ticket') || q.includes('boleto') || q.includes('control') || q.includes('billetera') || q.includes('camara') || q.includes('gane') || q.includes('premio')) {
      return {
        text: '📷 **Billetera y Escáner Óptico de Boletos**:\n\n• Puedes enfocar con la cámara de tu celular el código de barras o código QR de tu ticket oficial de lotería.\n• El sistema audita automáticamente el sorteo y la secuencia para verificar si obtuviste aciertos a la Cabeza o en los 20 premios de la pizarra oficial.',
        action: {
          type: 'tab',
          tabId: 'wallet',
          label: '📷 Ir al Escáner y Billetera'
        }
      };
    }

    // 11. Sueños / Soñé / Significado / Diccionario
    if (q.includes('sueño') || q.includes('sueno') || q.includes('soñe') || q.includes('soñé') || q.includes('significado') || q.includes('diccionario')) {
      return {
        text: '🌙 **Diccionario de Sueños Tradicional**:\n\n• Ingresa una palabra clave de tu sueño (ej: dinero, perro, viaje, familia, agua) y el buscador semántico te indicará el número del 00 al 99 correspondiente con sus jugadas recomendadas.',
        action: {
          type: 'tab',
          tabId: 'dreams',
          label: '🌙 Ir al Diccionario de Sueños'
        }
      };
    }

    // 12. Copiar / Portapapeles / WhatsApp
    if (q.includes('copiar') || q.includes('portapapeles') || q.includes('compartir')) {
      return {
        text: '📋 **Copiado Rápido y Cupón Digital**:\n\n• En Pronósticos tienes los botones **`[ Copiar Ciudad ]`** y **`[ Copiar Provincia ]`** para pegar en WhatsApp.\n• Y tienes el botón **`[ 🎟️ Cupón Agenciero ]`** que abre una boleta digital en letra grande para mostrar directamente en ventanilla.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ir a Pronósticos'
        }
      };
    }

    // 13. Soporte Humano / WhatsApp
    if (q.includes('humano') || q.includes('persona') || q.includes('whatsapp') || q.includes('soporte') || q.includes('ayuda') || q.includes('contacto')) {
      return {
        text: '💬 **Contacto con Soporte Humano**:\n\nSi necesitas asistencia personalizada con acreditación de pagos VIP o dudas técnicas, nuestro equipo está a tu disposición en WhatsApp (+54 9 11 5915-8512).',
        action: {
          type: 'whatsapp',
          label: '💬 Abrir Chat de WhatsApp',
          handler: () => handleOpenWhatsApp(query)
        },
        showWhatsApp: true
      };
    }

    // Respuesta Inteligente General
    return {
      text: '🤖 **Asesor Experto Quinela Master Pro**:\n\nConozco todo sobre la app, pregúntame lo que quieras:\n• 📍 **Agencias Oficiales:** Cómo encontrar la agencia LOTBA/IPLyC más cercana con GPS.\n• 🎟️ **Cupón Agenciero:** Cómo ver tu jugada en letra grande para el mostrador.\n• 🛡️ **Radar y Auditoría:** Dónde caen los premios y verificación día a día.\n• 📊 **Resultados:** Cómo ver los 20 premios de hoy o buscar días anteriores.\n• 🧮 **Estrategia:** Redoblonas candado y calculadora de bankroll.\n• 🎯 **Pronósticos:** Cuánto pagan las 2, 3 y 4 cifras (70x, 500x, 3.500x).\n• 👑 **Pase VIP:** Activación y beneficios exclusivos.',
      action: {
        type: 'tab',
        tabId: 'predictions',
        label: '🎯 Explorar Pronósticos'
      },
    };
  };

  const handleSendMessage = (textToSend = null) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = processUserQuery(text);
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: response.text,
        action: response.action,
        showWhatsApp: response.showWhatsApp,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleActionClick = (action) => {
    if (!action) return;
    if (action.type === 'tab' && onNavigate) {
      onNavigate(action.tabId);
      setIsOpen(false);
    } else if (action.type === 'url' && action.url) {
      window.open(action.url, '_blank');
    } else if (action.handler) {
      action.handler();
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir Asesor Inteligente"
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-2xl shadow-emerald-500/40 border border-emerald-300/40 active:scale-95 transition-all duration-200 cursor-pointer group"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-white animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-black tracking-wide leading-tight flex items-center gap-1">
            Asesor IA
            <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
          </span>
          <span className="text-[9px] text-emerald-100 font-medium leading-none">
            ¿Dudas? Pregúntame
          </span>
        </div>
      </button>

      {/* Advisor Chat Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md h-[88vh] sm:h-[620px] bg-slate-900 border border-emerald-500/30 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white animate-in slide-in-from-bottom-6 duration-200">
            
            {/* Modal Header */}
            <div className="px-4 py-3.5 bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 border-b border-emerald-500/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30 border border-emerald-300/30 shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-white">Asesor Quinela Master</h3>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                      IA OFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    En línea • Navega y resuelve dudas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  title="Abrir WhatsApp Oficial"
                  className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-xl transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Navigation / Suggested Topics Chips */}
            <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 font-bold shrink-0 uppercase tracking-wider pl-1">
                Atajos:
              </span>
              {QUICK_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleSendMessage(topic.query)}
                  className="px-2.5 py-1 bg-slate-800/90 hover:bg-emerald-900/60 border border-slate-700/80 hover:border-emerald-500/50 rounded-full text-[10.5px] text-slate-200 hover:text-emerald-200 font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer active:scale-95"
                >
                  {topic.label}
                </button>
              ))}
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-900/60">
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-md ${
                        isBot
                          ? 'bg-slate-800/95 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                          : 'bg-emerald-600 text-white rounded-tr-sm font-medium'
                      }`}
                    >
                      <div className="whitespace-pre-line">
                        {msg.text.split('\n').map((line, idx) => {
                          // Format bold text **text**
                          if (line.includes('**')) {
                            const parts = line.split('**');
                            return (
                              <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                                {parts.map((part, pIdx) =>
                                  pIdx % 2 === 1 ? (
                                    <strong key={pIdx} className="text-emerald-300 font-bold">
                                      {part}
                                    </strong>
                                  ) : (
                                    part
                                  )
                                )}
                              </p>
                            );
                          }
                          return (
                            <p key={idx} className={idx > 0 ? 'mt-1' : ''}>
                              {line}
                            </p>
                          );
                        })}
                      </div>

                      {/* Interactive Navigation Action Button */}
                      {msg.action && (
                        <div className="mt-3 pt-2.5 border-t border-slate-700/60">
                          <button
                            type="button"
                            onClick={() => handleActionClick(msg.action)}
                            className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-all text-xs"
                          >
                            <span>{msg.action.label}</span>
                            <ArrowRight className="w-4 h-4 text-emerald-100" />
                          </button>
                        </div>
                      )}

                      {/* WhatsApp Direct Escalation Button */}
                      {msg.showWhatsApp && (
                        <div className="mt-2 pt-2 border-t border-slate-700/40">
                          <button
                            type="button"
                            onClick={() => handleOpenWhatsApp()}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold rounded-xl shadow cursor-pointer active:scale-95 transition-all text-xs"
                          >
                            <MessageCircle className="w-4 h-4 text-slate-950" />
                            <span>Hablar con Soporte por WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 p-2 bg-slate-800/60 border border-slate-700/50 rounded-2xl w-fit">
                  <Bot className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  <span className="text-[11px] text-slate-400 animate-pulse">
                    El Asesor está escribiendo...
                  </span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form & WhatsApp Quick Bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Escribe tu consulta sobre la app..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 text-white rounded-2xl px-3.5 py-2.5 text-xs focus:outline-none placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow transition-all cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Direct WhatsApp Callout */}
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400">
                <span>¿Prefieres atención personalizada?</span>
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp +54 9 11 5915-8512
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
