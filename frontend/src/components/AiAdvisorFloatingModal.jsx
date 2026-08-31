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
  { id: 'wallet', label: '📷 ¿Cómo escanear mi ticket?', query: '¿Cómo puedo escanear y verificar mi boleto de quiniela?' },
  { id: 'lotba', label: '🌐 ¿Cómo jugar en lotba.bet.ar?', query: '¿Cómo hago para jugar mis números en la página oficial lotba.bet.ar?' },
  { id: 'vip', label: '👑 ¿Cómo activar el Pase VIP?', query: '¿Qué incluye el VIP y cómo lo pago por Mercado Pago o USDT?' },
  { id: 'draws', label: '📊 ¿Dónde ver los resultados oficiales?', query: '¿A qué hora son los sorteos y dónde veo los resultados de hoy y ayer?' },
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
      text: '👋 ¡Hola! Soy tu **Asesor Virtual de Quinela Master Pro**.\n\n¿En qué te puedo orientar hoy? Puedes hacerme cualquier consulta o elegir un tema rápido:',
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

    // 0. Costo / Gastos / Consumo de la IA
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

    // 1. VIP / Planes / Pago / Suscripción
    if (q.includes('vip') || q.includes('pago') || q.includes('pagar') || q.includes('precio') || q.includes('suscrip') || q.includes('mercado pago') || q.includes('usdt')) {
      return {
        text: '👑 **Membresía VIP Quinela Master Pro**:\n\n• **Acceso Total:** Desbloquea el Top 5 de Pronósticos de Alta Probabilidad, Cuaternos (3.500x) y Redoblonas Candado (1.280x).\n• **Medios de Pago:** Mercado Pago (Transferencia / Alias) y USDT TRC-20.\n• **Activación:** Se acredita de forma inmediata o enviando tu comprobante a nuestro soporte.',
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

    // 2. Premios / Cuánto Paga / Multiplicadores
    if (q.includes('cuanto paga') || q.includes('cuánto paga') || q.includes('paga') || q.includes('multiplicador') || q.includes('ambo') || q.includes('terno') || q.includes('cuaterno') || q.includes('redoblona')) {
      return {
        text: '💰 **Tabla Oficial de Premios y Multiplicadores**:\n\n• **Ambo (2 cifras):**\n  - A la Cabeza (1° Premio): Paga **70 veces** lo apostado.\n  - A los 20 Premios: Paga **3.5 veces** lo apostado.\n• **Terno (3 cifras):**\n  - A la Cabeza: Paga **500 veces** lo apostado.\n  - A los 20: Paga **25 veces**.\n• **Cuaterno (4 cifras):**\n  - A la Cabeza: Paga **3.500 veces** lo apostado.\n  - A los 20: Paga **175 veces**.\n• **Redoblona:** Paga hasta **1.280 veces** cuando aciertas ambos números.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ver Pronósticos del Turno'
        }
      };
    }

    // 3. Escáner / Billetera / Ticket / Controlar
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

    // 4. Pronósticos / Inteligencia Artificial / IA / Algoritmo
    if (q.includes('pronostico') || q.includes('pronóstico') || q.includes('ia') || q.includes('inteligencia') || q.includes('probabil') || q.includes('acierto') || q.includes('numero') || q.includes('número')) {
      return {
        text: '🎯 **Motor Predictivo y Algoritmo de IA**:\n\n• Nuestro sistema trabaja en **3 capas matemáticas:**\n  1. Distribución estadística de Poisson para frecuencias.\n  2. Pesos exponenciales por atraso crítico.\n  3. Análisis de rachas y números calientes.\n• Genera recomendaciones clasificadas por nivel de confianza y tiempo restante para apostar.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ir a Pronósticos IA'
        }
      };
    }

    // 5. Jugar oficial / lotba / apuestas / jugar online
    if (q.includes('jugar') || q.includes('lotba') || q.includes('apostar') || q.includes('online') || q.includes('agencia') || q.includes('bet.ar')) {
      return {
        text: '🌐 **Plataforma Oficial de Juego (lotba.bet.ar)**:\n\n• **Quinela Master Pro** es una herramienta analítica independiente de ayuda al apostador; no captamos apuestas directamente.\n• En cada pantalla encontrarás el botón directo que copia tus números y te lleva a la web oficial autorizada **lotba.bet.ar**.',
        action: {
          type: 'url',
          url: 'https://lotba.bet.ar',
          label: '🌐 Ir a lotba.bet.ar'
        }
      };
    }

    // 6. Resultados / Sorteos / Horarios / Pizarra / Ayer / Hoy
    if (q.includes('resultado') || q.includes('sorteo') || q.includes('horario') || q.includes('pizarra') || q.includes('ayer') || q.includes('hoy') || q.includes('previa') || q.includes('primera') || q.includes('matutina') || q.includes('vespertina') || q.includes('nocturna')) {
      return {
        text: '📊 **Sorteos y Horarios Oficiales**:\n\n• **La Previa:** 10:15 hs\n• **Primera:** 12:00 hs\n• **Matutina:** 15:00 hs\n• **Vespertina:** 18:00 hs\n• **Nocturna:** 21:00 hs\n\n• En la pestaña de Resultados puedes consultar las 20 posiciones oficiales de Ciudad (LOTBA) y Provincia de Buenos Aires.',
        action: {
          type: 'tab',
          tabId: 'draws',
          label: '📊 Ver Resultados Oficiales'
        }
      };
    }

    // 7. Sueños / Soñé / Significado / Diccionario
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

    // 8. Copiar / Portapapeles / WhatsApp
    if (q.includes('copiar') || q.includes('portapapeles') || q.includes('compartir') || q.includes('boton') || q.includes('botones')) {
      return {
        text: '📋 **Copiado Rápido por Lotería**:\n\n• En la pestaña de Pronósticos dispones de 2 botones dedicados:\n  - **`[ Copiar Todo Ciudad ]`**\n  - **`[ Copiar Todo Provincia ]`**\n• Al tocarlos, se copian al instante todos los Ambos, Ternos, Cuaternos y Redoblonas listos para pegar en WhatsApp o tu bloc de notas.',
        action: {
          type: 'tab',
          tabId: 'predictions',
          label: '🎯 Ir a Pronósticos'
        }
      };
    }

    // 9. Soporte Humano / WhatsApp
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
      text: '🤖 **Asistente Quinela Master Pro**:\n\nPuedo orientarte sobre:\n• 🎯 **Pronósticos:** Cómo se calculan los Ambos, Ternos y Cuaternos.\n• 💰 **Premios:** Cuánto pagan las 2, 3 y 4 cifras (70x, 500x, 3.500x).\n• 📷 **Billetera:** Cómo escanear boletos con la cámara.\n• 📊 **Resultados:** Horarios de los 5 sorteos diarios.\n• 🌙 **Sueños:** Significado de los números del 00 al 99.\n• 👑 **Pase VIP:** Desbloqueo del Top 5 completo.',
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
