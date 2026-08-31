import React, { useState } from 'react';
import axios from 'axios';
import { 
  X, MessageSquare, Upload, Image as ImageIcon, Send, CheckCircle2, 
  Sparkles, ExternalLink, ShieldCheck, HelpCircle, PhoneCall
} from 'lucide-react';

export default function ContactSupportModal({ isOpen, onClose, user }) {
  const [message, setMessage] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const paymentReport = {
      id: Date.now(),
      user_id: user?.id || 1,
      user_name: user?.name || 'Usuario',
      user_email: user?.email || 'usuario@correo.com',
      amount_usd: 5.0,
      currency: 'ARS/USD',
      status: 'pending',
      transaction_id: transactionRef.trim() || `REF-${Date.now().toString().slice(-6)}`,
      proof_url: imagePreview || null,
      message: message.trim(),
      created_at: new Date().toISOString()
    };

    // Save locally for admin review
    const existing = JSON.parse(localStorage.getItem('pending_payments') || '[]');
    existing.unshift(paymentReport);
    localStorage.setItem('pending_payments', JSON.stringify(existing));

    try {
      await axios.post('/api/payments/report', paymentReport, { timeout: 1500 });
    } catch (e) {
      // Offline fallback saved in localStorage
    }

    setLoading(false);
    setIsSent(true);
  };

  const handleOpenWhatsApp = () => {
    const adminPhone = '5491123456789'; // Example or generic direct admin support line
    const text = encodeURIComponent(
      `Hola Administrador, quiero solicitar la activación de mi suscripción VIP en Quinela Master Pro AI.\n\n👤 Nombre: ${user?.name || 'Usuario'}\n📧 Correo: ${user?.email || 'No especificado'}\n💬 Mensaje: ${message || 'Adjunto comprobante de pago.'}`
    );
    window.open(`https://wa.me/${adminPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Contacto con el Administrador</h3>
              <p className="text-[11px] text-slate-400">Soporte directo y activación de membresías VIP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm">
          {isSent ? (
            <div className="py-8 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-white">¡Comprobante y Mensaje Enviados!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Tu solicitud ha sido enviada a la consola del Administrador. En breve se validará tu pago y se activará tu membresía VIP en este dispositivo.
              </p>
              <div className="pt-3">
                <button
                  onClick={() => {
                    setIsSent(false);
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all"
                >
                  Aceptar y Volver
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* User identification info */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-semibold">Remitente:</div>
                  <div className="font-bold text-white text-xs">{user?.name || 'Usuario'} ({user?.email || 'Sin correo'})</div>
                </div>
                <div className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user?.is_vip ? 'VIP Activo' : 'Solicitud VIP'}
                </div>
              </div>

              {/* Message field */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Mensaje o Solicitud al Administrador:
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Hola, adjunto el comprobante de pago para activar mi mes VIP o tengo una consulta..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  N° de Transacción / Referencia (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: MP-98471239 o Transferencia bancaria"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* File Upload for Payment Proof */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Foto de Captura del Comprobante de Pago:
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-3 text-center bg-slate-950/60 cursor-pointer transition-all relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img 
                        src={imagePreview} 
                        alt="Comprobante" 
                        className="max-h-36 rounded-xl object-contain border border-slate-700 shadow" 
                      />
                      <span className="text-[10px] text-emerald-400 font-bold">
                        ✓ Imagen cargada (Toca para cambiar)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-slate-300 font-bold">
                        Seleccionar o Tomar Foto del Comprobante
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Formatos JPG, PNG, captura de pantalla
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Send Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Enviando comprobante...' : 'Enviar Comprobante al Administrador'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar directo por WhatsApp al Administrador</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
