import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Crown, Copy, Check, MessageCircle, Send, ShieldCheck, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, user, onProofSubmitted }) {
  const [settings, setSettings] = useState(null);
  const [copiedAlias, setCopiedAlias] = useState(false);
  const [copiedCbu, setCopiedCbu] = useState(false);
  const [proofText, setProofText] = useState('');
  const [amount, setAmount] = useState(5500);
  const [sendingProof, setSendingProof] = useState(false);
  const [proofSentSuccess, setProofSentSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/public/payment-info').then(res => {
        setSettings(res.data);
        if (res.data.price_ars) setAmount(res.data.price_ars);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'alias') {
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2000);
    } else {
      setCopiedCbu(true);
      setTimeout(() => setCopiedCbu(false), 2000);
    }
  };

  const handleSendProof = async (e) => {
    e.preventDefault();
    if (!proofText.trim()) return;

    setSendingProof(true);
    try {
      await axios.post('/api/payments/submit-proof', {
        email: user?.email || 'usuario@quiniela.com',
        name: user?.name || 'Cliente',
        amount: Number(amount),
        proof_details: proofText
      });
      setProofSentSuccess(true);
      if (onProofSubmitted) onProofSubmitted();
    } catch (err) {
      console.error(err);
    } finally {
      setSendingProof(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hola Jesús, acabo de realizar el pago de $${amount} ARS ($5 USD) para mi pase VIP en Quinela Master Pro AI. Mi correo es: ${user?.email || ''}. Adjunto mi comprobante:`
  );
  const whatsappUrl = `https://wa.me/${(settings?.whatsapp_number || '+5491123456789').replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar space-y-4 sm:space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 cursor-pointer transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 mx-auto mb-2 shadow-lg shadow-amber-500/20">
            <Crown className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            {user?.is_vip ? 'Tu Membresía VIP' : 'Pase VIP Quinela Master'}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Solo <strong className="text-amber-400 font-bold">$5 USD / mes</strong> (o ${settings?.price_ars?.toLocaleString() || '5.500'} ARS vía Mercado Pago)
          </p>
        </div>

        {/* Active VIP Status Banner if user is already VIP */}
        {user?.is_vip && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
                <strong className="text-xs font-black text-emerald-300">ESTADO: VIP ACTIVO</strong>
              </div>
              <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {user.tier === 'VIP_TRIAL' ? `${user.trial_days_left} días restantes de prueba` : 'Suscripción Activa'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" /> Pronósticos IA completados
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Radar Térmico 00-99 completo
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-purple-400" /> Oráculo Onírico ilimitado
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Auditor de Boletos y Premios
              </div>
            </div>
          </div>
        )}

        {/* Payment Data Box */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Titular de Cuenta:</span>
            <strong className="text-white">{settings?.titular || 'Jesús Hidalgo'}</strong>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Entidad / Banco:</span>
            <strong className="text-emerald-400">{settings?.bank_name || 'Mercado Pago'}</strong>
          </div>

          {/* Alias */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block">ALIAS MERCADO PAGO</span>
              <strong className="text-xs sm:text-sm font-mono text-amber-400 font-bold">{settings?.alias || 'quiniela.vip.mp'}</strong>
            </div>
            <button
              onClick={() => copyToClipboard(settings?.alias || 'quiniela.vip.mp', 'alias')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              {copiedAlias ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedAlias ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          {/* CBU */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block">CBU / CVU</span>
              <strong className="text-[11px] sm:text-xs font-mono text-slate-300">{settings?.cbu || '0000003100012345678901'}</strong>
            </div>
            <button
              onClick={() => copyToClipboard(settings?.cbu || '0000003100012345678901', 'cbu')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              {copiedCbu ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCbu ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* WhatsApp Fast Activation Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all active:scale-98"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Enviar Comprobante por WhatsApp Directo</span>
        </a>

        {/* Manual Proof Submission Form */}
        <div className="pt-2 border-t border-slate-800">
          <form onSubmit={handleSendProof} className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300 block">
              O registra el N° de Operación o Transferencia:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                placeholder="Ej: Op #123456789 o correo de transferencia"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingProof || !proofText.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </button>
            </div>
            {proofSentSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 border border-emerald-500/30">
                <Check className="w-4 h-4" />
                <span>¡Comprobante enviado con éxito! Se activará a la brevedad.</span>
              </div>
            )}
          </form>
        </div>

        {/* Footer Guarantee Note */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Activación segura garantizada por ING JH • Quinela Master Pro AI</span>
        </div>
      </div>
    </div>
  );
}
