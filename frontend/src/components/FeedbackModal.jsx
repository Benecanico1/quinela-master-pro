import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, Star, Heart, ThumbsUp, AlertTriangle, Lightbulb, 
  Send, CheckCircle2, MessageSquareHeart 
} from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose, user }) {
  const [rating, setRating] = useState(5);
  const [feedbackType, setFeedbackType] = useState('positive'); // 'positive', 'suggestion', 'issue'
  const [opinion, setOpinion] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!opinion.trim()) return;
    setLoading(true);

    const feedbackData = {
      id: Date.now(),
      user_name: user?.name || 'Usuario Anónimo',
      user_email: user?.email || 'Sin correo',
      rating,
      type: feedbackType,
      opinion: opinion.trim(),
      suggestions: suggestions.trim(),
      created_at: new Date().toLocaleString()
    };

    // Save locally
    const existing = JSON.parse(localStorage.getItem('app_feedback_list') || '[]');
    existing.unshift(feedbackData);
    localStorage.setItem('app_feedback_list', JSON.stringify(existing));

    try {
      await axios.post('/api/feedback/submit', feedbackData, { timeout: 1500 });
    } catch (e) {
      // Local fallback
    }

    setLoading(false);
    setIsSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Tu Opinión & Feedback</h3>
              <p className="text-[11px] text-slate-400">Queremos saber tu experiencia y sugerencias</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {isSubmitted ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">¡Muchas Gracias por tu Feedback!</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Leemos cada comentario para seguir perfeccionando Quinela Master Pro AI y ofrecerte la mejor herramienta posible.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setOpinion('');
                    setSuggestions('');
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rating Stars */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-center space-y-2">
                <span className="text-xs font-bold text-slate-300 block">¿Cómo calificas la aplicación?</span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Category Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setFeedbackType('positive')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'positive'
                      ? 'bg-emerald-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Me gusta
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('suggestion')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'suggestion'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" /> Idea / Mejora
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType('issue')}
                  className={`py-2 px-1 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    feedbackType === 'issue'
                      ? 'bg-rose-500 text-white font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Detecté un fallo
                </button>
              </div>

              {/* Main Opinion Field */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Tu opinión sobre la app y el trabajo de los desarrolladores (ING JH):
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Escribe aquí lo que más te gustó, qué resultados obtuviste o qué te pareció el diseño..."
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Optional Suggestions or Issues Field */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Cosas a mejorar o detalles que detectaste (Opcional):
                </label>
                <textarea
                  rows="2"
                  placeholder="¿Alguna función que te gustaría agregar o algún botón que no funcione como esperabas?..."
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Enviando opinión...' : 'Enviar mi Opinión'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
