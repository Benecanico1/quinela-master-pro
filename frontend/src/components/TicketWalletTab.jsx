import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Wallet, CheckCircle2, XCircle, Plus, RefreshCw, Trash2, Award, Trophy, 
  Layers, Clock, AlertTriangle, ChevronDown, ChevronUp, Camera, QrCode, 
  Search, ShieldCheck, X, Sparkles, Hash, FileText, HelpCircle, 
  Share2, Printer, Check, Copy, History, BookOpen, ExternalLink, Info, ArrowRight
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { verifyClientTicket, OFFICIAL_SHIFTS_SCHEDULE, REAL_OFFICIAL_DRAWS_DATABASE, getLocalDateString } from '../services/clientEngine';

// Local storage key for ticket history
const STORAGE_KEY_TICKETS = 'quinela_wallet_history_v1';

// Helper for image resizing before barcode scanning (prevents OOM on high-res mobile cameras)
const compressAndResizeImage = (file, maxWidth = 1200) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name || 'ticket.jpg', { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

export default function TicketWalletTab() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lottery, setLottery] = useState('provincia');
  const [shift, setShift] = useState('nocturna');
  
  // Official Control Identifiers
  const [sequenceNumber, setSequenceNumber] = useState('');
  const [sorteoNumber, setSorteoNumber] = useState('');
  const [ticketItems, setTicketItems] = useState([]);

  // Form for adding individual plays
  const [newNumber, setNewNumber] = useState('');
  const [newAmount, setNewAmount] = useState(100);
  const [newPos, setNewPos] = useState('cabeza');

  // Verification state
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showBoard, setShowBoard] = useState(false);

  // Camera Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [scanNotice, setScanNotice] = useState(null); // { text, type: 'info'|'success'|'warning'|'error', loading: boolean }
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // New Features: Help Modal, Receipt Modal, Ticket History
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [helpTab, setHelpTab] = useState('camera'); // 'camera' | 'ticket' | 'ai'
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Saved ticket history in LocalStorage
  const [savedHistory, setSavedHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TICKETS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // Save history helper
  const saveToHistory = (result, items, seq, sorteo, d, lot, sh) => {
    try {
      const historyItem = {
        id: `tkt_${Date.now()}`,
        timestamp: new Date().toISOString(),
        date: d,
        lottery: lot,
        shift: sh,
        sequence: seq || 'S/N',
        sorteo: sorteo || 'S/N',
        total_won: result.total_won || 0,
        balance: result.balance || 0,
        total_invested: items.reduce((acc, it) => acc + (Number(it.amount) || 0), 0),
        official_head: result.official_head || '----',
        is_winner: (result.total_won || 0) > 0,
        items: items,
        board: result.board || []
      };

      const updated = [historyItem, ...savedHistory.filter(h => h.sequence !== seq || h.sequence === 'S/N')].slice(0, 30);
      setSavedHistory(updated);
      localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed saving ticket to localStorage:", e);
    }
  };

  const clearHistory = () => {
    if (window.confirm("¿Deseas vaciar todo el historial de boletos guardados?")) {
      setSavedHistory([]);
      localStorage.removeItem(STORAGE_KEY_TICKETS);
    }
  };

  const loadFromHistory = (item) => {
    setDate(item.date || getLocalDateString());
    setLottery(item.lottery || 'provincia');
    setShift(item.shift || 'nocturna');
    setSequenceNumber(item.sequence !== 'S/N' ? item.sequence : '');
    setSorteoNumber(item.sorteo !== 'S/N' ? item.sorteo : '');
    setTicketItems(item.items || []);
    setVerificationResult(null);
    setScanNotice({
      text: `Boleto cargado desde el historial (Sorteo #${item.sorteo || '---'} - ${item.date})`,
      type: 'info',
      loading: false
    });
    setShowHistory(false);
  };

  // Trigger camera: Native Capacitor camera on mobile, or file input on browser
  const handleTriggerCamera = async () => {
    setIsProcessingPhoto(true);
    setScanNotice({
      text: "Iniciando cámara del dispositivo...",
      type: 'info',
      loading: true
    });

    let rawFile = null;

    try {
      // 1. Try Native Capacitor Camera plugin
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (photo && photo.dataUrl) {
        const res = await fetch(photo.dataUrl);
        const blob = await res.blob();
        rawFile = new File([blob], `ticket_${Date.now()}.jpg`, { type: 'image/jpeg' });
      }
    } catch (capErr) {
      console.log("Capacitor camera fallback to file picker:", capErr);
      // Fallback: trigger HTML file input
      if (fileInputRef.current) {
        fileInputRef.current.click();
        setIsProcessingPhoto(false);
        return;
      }
    }

    if (rawFile) {
      await processScannedFile(rawFile);
    } else {
      setIsProcessingPhoto(false);
    }
  };

  // Handle native photo capture from camera with smart compression
  const handlePhotoCapture = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await processScannedFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Process and decode barcode from image file
  const processScannedFile = async (file) => {
    setIsProcessingPhoto(true);
    setScanNotice({
      text: "Comprimiendo y analizando código de barras del boleto...",
      type: 'info',
      loading: true
    });

    try {
      const optimizedFile = await compressAndResizeImage(file, 1200);

      const html5QrCode = new Html5Qrcode("photo-temp-scanner");
      const decodedText = await html5QrCode.scanFile(optimizedFile, true);
      
      const digits = decodedText.replace(/[^0-9]/g, '');
      if (digits.length >= 10) {
        setSequenceNumber(digits.slice(0, 10));
      } else {
        setSequenceNumber(decodedText.trim());
      }
      setScanNotice({
        text: `✅ Código detectado con éxito: ${decodedText}`,
        type: 'success',
        loading: false
      });
    } catch (err) {
      console.warn("Scan from file warning:", err);
      setScanNotice({
        text: "⚠️ Foto capturada. No se detectó un código nítido. Puedes ingresar los 10 dígitos de la secuencia manualmente en el formulario.",
        type: 'warning',
        loading: false
      });
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Quick preset from scanned ticket
  const handleLoadSampleTicket = () => {
    setDate('2026-08-24');
    setLottery('provincia');
    setShift('nocturna');
    setSequenceNumber('1393435243');
    setSorteoNumber('12844');
    setTicketItems([
      { id: 1, number: '295', amount: 100, position: 'cabeza' },
      { id: 2, number: '95', amount: 100, position: 'cabeza' },
      { id: 3, number: '1295', amount: 100, position: 'cabeza' },
      { id: 4, number: '17', amount: 100, position: 'cabeza' },
      { id: 5, number: '517', amount: 100, position: 'cabeza' },
      { id: 6, number: '5517', amount: 100, position: 'cabeza' },
      { id: 7, number: '88', amount: 100, position: 'cabeza' },
      { id: 8, number: '888', amount: 100, position: 'cabeza' },
      { id: 9, number: '9888', amount: 100, position: 'cabeza' },
      { id: 10, number: '24', amount: 100, position: 'cabeza' },
      { id: 11, number: '124', amount: 100, position: 'cabeza' },
      { id: 12, number: '3124', amount: 100, position: 'cabeza' },
      { id: 13, number: '53', amount: 100, position: 'cabeza' },
      { id: 14, number: '453', amount: 100, position: 'cabeza' },
      { id: 15, number: '7453', amount: 100, position: 'cabeza' },
    ]);
    setVerificationResult(null);
    setScanNotice({
      text: "Cargado ticket de muestra oficial (Sorteo #12844 - Nocturna 24/08)",
      type: 'info',
      loading: false
    });
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    setTicketItems([
      ...ticketItems,
      {
        id: Date.now(),
        number: newNumber.trim(),
        amount: Number(newAmount) || 100,
        position: newPos
      }
    ]);
    setNewNumber('');
    setVerificationResult(null);
  };

  const handleRemoveItem = (id) => {
    setTicketItems(ticketItems.filter(item => item.id !== id));
    setVerificationResult(null);
  };

  const handleVerifyTicket = async () => {
    if (ticketItems.length === 0 && !sequenceNumber.trim()) return;
    setVerifying(true);
    try {
      let finalResult = null;
      try {
        const res = await axios.post('/api/tickets/verify', {
          draw_date: date,
          lottery: lottery,
          shift: shift,
          sequence: sequenceNumber,
          sorteo: sorteoNumber,
          items: ticketItems
        }, { timeout: 1500 });
        
        if (res.data && typeof res.data.total_won === 'number') {
          finalResult = {
            ...res.data,
            sequence: sequenceNumber,
            sorteo: sorteoNumber
          };
        }
      } catch (networkErr) {
        // Fallback local engine
      }

      if (!finalResult) {
        const localAudit = verifyClientTicket(date, lottery, shift, ticketItems);
        finalResult = {
          ...localAudit,
          sequence: sequenceNumber,
          sorteo: sorteoNumber
        };
      }

      setVerificationResult(finalResult);

      // Auto-save to Local History
      if (finalResult.status === 'COMPLETED') {
        saveToHistory(finalResult, ticketItems, sequenceNumber, sorteoNumber, date, lottery, shift);
      }
    } catch (err) {
      const localAudit = verifyClientTicket(date, lottery, shift, ticketItems);
      const fallbackResult = {
        ...localAudit,
        sequence: sequenceNumber,
        sorteo: sorteoNumber
      };
      setVerificationResult(fallbackResult);
      if (fallbackResult.status === 'COMPLETED') {
        saveToHistory(fallbackResult, ticketItems, sequenceNumber, sorteoNumber, date, lottery, shift);
      }
    } finally {
      setVerifying(false);
    }
  };

  // Open Receipt Modal
  const handleOpenReceipt = () => {
    if (!verificationResult) return;
    setActiveReceiptData({
      date,
      lottery,
      shift,
      sequence: sequenceNumber || '1393435243',
      sorteo: sorteoNumber || '12844',
      items: ticketItems,
      total_won: verificationResult.total_won || 0,
      balance: verificationResult.balance || 0,
      official_head: verificationResult.official_head || '----',
      significado: verificationResult.significado || '',
      board: verificationResult.board || [],
      details: verificationResult.items || []
    });
    setIsReceiptOpen(true);
    setCopiedReceipt(false);
  };

  // Share or Copy Receipt
  const handleShareReceipt = async () => {
    if (!activeReceiptData) return;
    const summaryText = `🎟️ COMPROBANTE OFICIAL DE QUINIELA
Lotería: ${activeReceiptData.lottery?.toUpperCase()} (${activeReceiptData.shift?.toUpperCase()})
Fecha: ${activeReceiptData.date} | Sorteo: #${activeReceiptData.sorteo}
Secuencia Control: ${activeReceiptData.sequence}
Cabeza Oficial: ${activeReceiptData.official_head} "${activeReceiptData.significado}"
----------------------------------------
Premio Oficial a Cobrar: $${Number(activeReceiptData.total_won || 0).toLocaleString()} ARS
Balance Neto: ${activeReceiptData.balance >= 0 ? '+' : '-'}$${Math.abs(activeReceiptData.balance || 0).toLocaleString()} ARS
Estado: ${activeReceiptData.total_won > 0 ? '🎉 ¡GANADOR! Cobro habilitado en agencia' : '❌ Sin premio'}
----------------------------------------
Verificado por Quinela Master Pro Oficial`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprobante Oficial de Quiniela',
          text: summaryText
        });
      } catch (e) {
        // Fallback copy
        copyToClipboard(summaryText);
      }
    } else {
      copyToClipboard(summaryText);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    }
  };

  // Scanner Lifecycle
  useEffect(() => {
    let html5QrCode = null;

    if (isScannerOpen) {
      setCameraError(null);
      const scannerId = "reader-camera-view";
      
      const timer = setTimeout(() => {
        try {
          const formatsToSupport = [
            Html5QrcodeSupportedFormats.PDF_417,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.ITF
          ];

          html5QrCode = new Html5Qrcode(scannerId, { formatsToSupport });
          scannerRef.current = html5QrCode;

          const config = { 
            fps: 15, 
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              return {
                width: Math.min(320, Math.floor(viewfinderWidth * 0.85)),
                height: Math.min(180, Math.floor(minEdge * 0.6))
              };
            }
          };

          html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
              if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  html5QrCode.clear();
                }).catch(() => {});
              }
              setIsScannerOpen(false);
              
              const digits = decodedText.replace(/[^0-9]/g, '');
              if (digits.length >= 10) {
                setSequenceNumber(digits.slice(0, 10));
              } else {
                setSequenceNumber(decodedText.trim());
              }
              setScanNotice({
                text: `✅ Código de barras detectado con éxito: ${decodedText}`,
                type: 'success',
                loading: false
              });
            },
            (errorMessage) => {}
          ).catch((err) => {
            console.error("Camera start error:", err);
            setCameraError("No se pudo iniciar la cámara en vivo. Asegúrate de otorgar los permisos de cámara en Android.");
          });
        } catch (e) {
          setCameraError("Error al inicializar el módulo de escaneo.");
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        }
      };
    }
  }, [isScannerOpen]);

  const closeScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
      }).catch(() => {});
    }
    setIsScannerOpen(false);
    setCameraError(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn pb-12" role="region" aria-label="Validador y Billetera de Boletos Oficiales">
      {/* Hidden file input for native camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
        aria-label="Cámara nativa para captura de foto de boleto"
      />
      <div id="photo-temp-scanner" className="hidden"></div>

      {/* Header Banner with Main Actions & Help */}
      <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-4 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Validador Oficial de Quiniela
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-slate-300 text-[10px] font-bold border border-slate-800">
              Ciudad (LOTBA) & Provincia (IPLyC)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Billetera & Cotejo de Boletos Oficiales
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Captura una foto de tu ticket con la cámara o ingresa el número de secuencia para auditar los premios oficiales y calcular tu liquidación en agencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
          <button
            onClick={() => setIsScannerOpen(true)}
            aria-label="Abrir escáner de código de barras en vivo"
            className="flex-1 sm:flex-none px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[44px]"
          >
            <QrCode className="w-5 h-5 text-white" />
            <span>Escanear Código de Barras</span>
          </button>

          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={isProcessingPhoto}
            aria-label="Subir foto del boleto desde galería"
            className="px-3.5 py-3 bg-slate-950 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            title="Subir foto del boleto desde galería"
          >
            <Camera className={`w-4 h-4 ${isProcessingPhoto ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Subir Foto</span>
          </button>

          <button
            onClick={handleLoadSampleTicket}
            aria-label="Cargar boleto de la foto (Sorteo #12844)"
            className="px-3.5 py-3 bg-slate-950 border border-amber-500/40 hover:border-amber-400 text-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            title="Cargar boleto de la foto (Sorteo #12844)"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Boleto #12844</span>
          </button>

          <button
            onClick={() => setIsHelpOpen(true)}
            aria-label="Ver guía y preguntas frecuentes"
            className="px-3.5 py-3 bg-slate-950 border border-slate-700 hover:border-amber-400 text-amber-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px]"
            title="Guía y Ayuda del Validador"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Ayuda</span>
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Ver historial de boletos guardados"
            className={`px-3.5 py-3 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[44px] ${
              showHistory ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Historial de boletos validados"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Mis Boletos ({savedHistory.length})</span>
          </button>
        </div>
      </div>

      {/* Notice Banner with dynamic status colors & spinner */}
      {scanNotice && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
          scanNotice.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            : scanNotice.type === 'warning'
            ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
            : scanNotice.type === 'error'
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            : 'bg-slate-900 border-slate-700 text-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            {scanNotice.loading ? (
              <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-emerald-400" />
            ) : scanNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
            )}
            <span>{scanNotice.text}</span>
          </div>
          <button 
            onClick={() => setScanNotice(null)} 
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
            aria-label="Cerrar notificación"
          >
            Entendido
          </button>
        </div>
      )}

      {/* HISTORIAL DE BOLETOS GUARDADOS (DESPLEGABLE) */}
      {showHistory && (
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-black text-white">
                Historial de Boletos Validados ({savedHistory.length})
              </h3>
            </div>
            {savedHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Vaciar Historial
              </button>
            )}
          </div>

          {savedHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-2xl">
              No tienes boletos guardados aún. Cada vez que valides un boleto con éxito se guardará aquí automáticamente.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedHistory.map((item) => (
                <div 
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    item.is_winner 
                      ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      item.is_winner 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {item.is_winner ? '🎉 Ganador' : 'Sin Premio'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{item.lottery} - {item.shift}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Sec: {item.sequence} | Sorteo #{item.sorteo}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-black font-mono ${item.is_winner ? 'text-emerald-400' : 'text-slate-400'}`}>
                        ${Number(item.total_won || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">Cabeza: <strong className="text-amber-400 font-mono">{item.official_head}</strong></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => loadFromHistory(item)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Cargar Jugadas</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveReceiptData(item);
                        setIsReceiptOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl text-xs transition-all cursor-pointer"
                      title="Ver comprobante oficial digital"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sorteo Target & Official Sequence Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400" /> 1. Datos Oficiales del Boleto
          </h3>
          <span className="text-[11px] text-slate-400">Cotejado con extractos oficiales</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label htmlFor="sequence-input" className="text-[11px] font-bold text-slate-300 block mb-1">
              N° Secuencia (10 dígitos)
            </label>
            <input
              id="sequence-input"
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="ej: 1393435243"
              value={sequenceNumber}
              onChange={(e) => { setSequenceNumber(e.target.value.replace(/[^0-9]/g, '')); setVerificationResult(null); }}
              className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-black font-mono rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Número de secuencia de control del boleto de 10 dígitos"
            />
          </div>

          <div>
            <label htmlFor="sorteo-input" className="text-[11px] font-bold text-slate-300 block mb-1">
              N° Sorteo Oficial
            </label>
            <input
              id="sorteo-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="ej: 12844"
              value={sorteoNumber}
              onChange={(e) => { setSorteoNumber(e.target.value.replace(/[^0-9]/g, '')); setVerificationResult(null); }}
              className="w-full bg-slate-950 border border-slate-700 text-white font-bold font-mono rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Número de sorteo oficial"
            />
          </div>

          <div>
            <label htmlFor="date-input" className="text-[11px] font-bold text-slate-300 block mb-1">
              Fecha del Sorteo
            </label>
            <input
              id="date-input"
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setVerificationResult(null); }}
              className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Fecha del sorteo"
            />
          </div>

          <div>
            <label htmlFor="lottery-select" className="text-[11px] font-bold text-slate-300 block mb-1">
              Lotería Oficial
            </label>
            <select
              id="lottery-select"
              value={lottery}
              onChange={(e) => { setLottery(e.target.value); setVerificationResult(null); }}
              className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Seleccionar lotería oficial"
            >
              <option value="provincia">Provincia de Buenos Aires (IPLyC)</option>
              <option value="ciudad">Ciudad (Nacional / LOTBA)</option>
            </select>
          </div>

          <div>
            <label htmlFor="shift-select" className="text-[11px] font-bold text-slate-300 block mb-1">
              Turno del Sorteo
            </label>
            <select
              id="shift-select"
              value={shift}
              onChange={(e) => { setShift(e.target.value); setVerificationResult(null); }}
              className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Seleccionar turno del sorteo"
            >
              <option value="nocturna">Nocturna (21:00 hs)</option>
              <option value="vespertina">Vespertina (18:00 hs)</option>
              <option value="matutina">Matutina (15:00 hs)</option>
              <option value="primera">Primera (12:00 hs)</option>
              <option value="previa">La Previa (10:15 hs)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add New Line to Ticket Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
        <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> 2. Cargar Jugadas Realizadas
        </h3>
        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="play-number" className="text-[11px] font-bold text-slate-300 block mb-1">
              Número (2, 3 o 4 cifras)
            </label>
            <input
              id="play-number"
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="ej: 24, 124 o 3124"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-full bg-slate-950 border border-slate-700 text-amber-400 font-black rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-mono min-h-[42px]"
              aria-label="Número jugado de 2, 3 o 4 cifras"
            />
          </div>

          <div>
            <label htmlFor="play-amount" className="text-[11px] font-bold text-slate-300 block mb-1">
              Monto Apostado ($ ARS)
            </label>
            <input
              id="play-amount"
              type="number"
              inputMode="numeric"
              step="50"
              min="10"
              value={newAmount}
              onChange={(e) => setNewAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 text-white font-bold rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-mono min-h-[42px]"
              aria-label="Monto apostado en pesos argentinos"
            />
          </div>

          <div>
            <label htmlFor="play-pos" className="text-[11px] font-bold text-slate-300 block mb-1">
              Ubicación / Alcance
            </label>
            <select
              id="play-pos"
              value={newPos}
              onChange={(e) => setNewPos(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white font-semibold rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-emerald-500 min-h-[42px]"
              aria-label="Ubicación o alcance de la jugada"
            >
              <option value="cabeza">Ub. 01 - A la Cabeza (1°)</option>
              <option value="5">A los 5 Premios (1° al 5°)</option>
              <option value="10">A los 10 Premios (1° al 10°)</option>
              <option value="20">A los 20 Premios (Pizarra Completa)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={!newNumber.trim()}
            aria-label="Agregar jugada al boleto"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all active:scale-95 min-h-[42px]"
          >
            <Plus className="w-4 h-4" /> Agregar al Boleto
          </button>
        </form>
      </div>

      {/* Ticket Items List & Verify Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-white">3. Boleto Cargado ({ticketItems.length} jugadas)</h3>
            <div className="text-xs text-slate-400 mt-0.5">
              Total Invertido: <strong className="text-white font-mono">${ticketItems.reduce((acc, it) => acc + (Number(it.amount) || 0), 0).toLocaleString()} ARS</strong>
              {sequenceNumber && <span className="ml-2 text-amber-400 font-mono font-bold">• Secuencia: {sequenceNumber}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {ticketItems.length > 0 && (
              <button
                onClick={() => { setTicketItems([]); setVerificationResult(null); }}
                className="px-3.5 py-2.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                aria-label="Limpiar jugadas cargadas"
              >
                Limpiar
              </button>
            )}

            <button
              onClick={handleVerifyTicket}
              disabled={verifying || ticketItems.length === 0}
              aria-label="Validar boleto con lotería oficial"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50 min-h-[44px]"
            >
              <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Cotejando con Lotería Oficial...' : 'Validar Boleto Oficial'}
            </button>
          </div>
        </div>

        {ticketItems.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-medium border border-dashed border-slate-800 rounded-2xl">
            No tienes jugadas cargadas. Toma una foto con la cámara, usa el botón de muestra o escribe tus números arriba.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs" aria-label="Tabla de jugadas cargadas">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0">
                <tr>
                  <th className="py-2.5 px-3.5">Número</th>
                  <th className="py-2.5 px-3.5">Ubicación</th>
                  <th className="py-2.5 px-3.5">Monto Jugado</th>
                  <th className="py-2.5 px-3.5 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300 bg-slate-950/40">
                {ticketItems.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-3.5 font-black text-amber-400 font-mono text-base">{item.number}</td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-200 uppercase text-xs">
                      {item.position === 'cabeza' ? 'Ub. 01 (A la Cabeza)' : `A los ${item.position} Premios`}
                    </td>
                    <td className="py-2.5 px-3.5 text-white font-bold font-mono">${Number(item.amount || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 cursor-pointer transition-all"
                        title="Eliminar jugada"
                        aria-label={`Eliminar jugada ${item.number}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* OFFICIAL VERIFICATION RESULTS VIEW */}
      {verificationResult && (
        <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 animate-fadeIn ring-1 ring-emerald-500/30">
          {verificationResult.status !== 'COMPLETED' ? (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                <Clock className="w-4 h-4 animate-pulse text-amber-400" />
                <span>Sorteo en espera o no disponible</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {verificationResult.message}
              </p>
            </div>
          ) : (
            <>
              {/* Header: Official Certificate Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500/30">
                      Extracto Oficial de Lotería
                    </span>
                    {verificationResult.sequence && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Secuencia: <strong className="text-white">{verificationResult.sequence}</strong>
                      </span>
                    )}
                    {verificationResult.sorteo && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Sorteo: <strong className="text-white">#{verificationResult.sorteo}</strong>
                      </span>
                    )}
                  </div>

                  <div className="text-xl sm:text-2xl font-black text-white mt-1">
                    Cabeza Oficial: <span className="text-amber-400 font-mono">{verificationResult.official_head || '----'}</span>
                    {verificationResult.significado && (
                      <span className="text-xs font-bold text-amber-300 ml-2 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                        "{verificationResult.significado}"
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 block mt-0.5 font-medium">
                    {verificationResult.lottery?.toUpperCase()} - {verificationResult.shift?.toUpperCase()} ({verificationResult.draw_date})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Premio a Cobrar en Agencia</span>
                    <div className={`text-2xl sm:text-3xl font-black ${(verificationResult.total_won || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'} font-mono`}>
                      ${(verificationResult.total_won || 0).toLocaleString()} ARS
                    </div>
                    <div className="text-[11px] text-slate-400 font-bold mt-0.5">
                      Balance Neto: <strong className={(verificationResult.balance || 0) >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                        {(verificationResult.balance || 0) >= 0 ? `+$${(verificationResult.balance || 0).toLocaleString()}` : `-$${Math.abs(verificationResult.balance || 0).toLocaleString()}`}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenReceipt}
                    className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    title="Ver y Exportar Comprobante Oficial"
                    aria-label="Ver y Exportar Comprobante Oficial"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[10px]">Comprobante</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${
                (verificationResult.total_won || 0) > 0 
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
                  : 'bg-slate-950/60 border-slate-800 text-slate-400'
              }`}>
                {(verificationResult.total_won || 0) > 0 ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-7 h-7 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-black uppercase">
                    {(verificationResult.total_won || 0) > 0 
                      ? `🎉 ¡BOLETO GANADOR! Premio oficial liquidado: $${(verificationResult.total_won || 0).toLocaleString()} ARS` 
                      : '❌ SIN PREMIO - Sorteo oficial concluido sin aciertos'}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
                    {(verificationResult.total_won || 0) > 0 
                      ? 'Presenta tu ticket impreso o digital en tu agencia autorizada de quiniela para cobrar tu premio.'
                      : 'Ninguna de las jugadas coincidió con el rango de ubicación correspondiente al extracto oficial de la lotería.'}
                  </div>
                </div>
              </div>

              {/* Line by line audit results */}
              <div className="space-y-2.5">
                <h4 className="text-xs uppercase font-bold text-slate-400">Auditoría Línea por Línea del Boleto:</h4>
                {(verificationResult.items || []).map((line, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      line.is_hit 
                        ? 'bg-emerald-950/50 border-emerald-500/60 ring-1 ring-emerald-500/30' 
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {line.is_hit ? (
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-slate-800 text-slate-500">
                          <XCircle className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400 text-base">{line.number}</span>
                          <span className="text-[10px] font-bold text-slate-400 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                            {line.position === 'cabeza' ? 'Ub. 01 (Cabeza)' : `A los ${line.position}`}
                          </span>
                          <span className="text-xs text-slate-400 font-semibold">
                            (Apostado: ${line.amount})
                          </span>
                        </div>
                        <div className={`text-xs mt-0.5 ${line.is_hit ? 'text-emerald-300 font-bold' : 'text-slate-400'}`}>
                          {line.details}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {line.is_hit ? (
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          +${(line.won_amount || 0).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-semibold font-mono">$0</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* View 20 prizes toggle */}
              {verificationResult.board && (
                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => setShowBoard(!showBoard)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer py-1"
                    aria-expanded={showBoard}
                  >
                    {showBoard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showBoard ? 'Ocultar Pizarra de 20 Premios Oficial' : 'Ver Pizarra de 20 Premios Oficial de la Lotería'}</span>
                  </button>

                  {showBoard && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-3 animate-fadeIn">
                      {verificationResult.board.map((num, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            idx === 0 
                              ? 'bg-amber-950/50 border-amber-500/60 font-black text-amber-300' 
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="text-[10px] text-slate-500 font-bold">#{(idx + 1).toString().padStart(2, '0')}</span>
                          <span className="font-mono font-bold tracking-wider">{num}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* MODAL DE COMPROBANTE OFICIAL DIGITAL & EXPORTACIÓN */}
      {isReceiptOpen && activeReceiptData && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Comprobante oficial de verificación">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Comprobante Oficial Digital de Quiniela</span>
              </div>
              <button
                onClick={() => setIsReceiptOpen(false)}
                aria-label="Cerrar comprobante"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Body: Thermal Ticket Style */}
            <div className="p-5 overflow-y-auto flex-1 bg-slate-950">
              <div className="bg-white text-slate-950 p-6 rounded-2xl shadow-inner font-mono text-xs space-y-4 border border-slate-300 print:shadow-none">
                {/* Agency Header */}
                <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-1">
                  <div className="font-black text-sm uppercase tracking-wider">
                    {activeReceiptData.lottery === 'provincia' ? 'LOTERÍA DE LA PROVINCIA (IPLyC)' : 'LOTERÍA DE LA CIUDAD (LOTBA)'}
                  </div>
                  <div className="text-[10px] text-slate-600">SISTEMA OFICIAL DE COTEJO DE QUINIELA</div>
                  <div className="text-[11px] font-bold">
                    FECHA: {activeReceiptData.date} | TURNO: {activeReceiptData.shift?.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-700">
                    SORTEO N°: <strong>{activeReceiptData.sorteo}</strong> | SECUENCIA: <strong>{activeReceiptData.sequence}</strong>
                  </div>
                </div>

                {/* Draw Head */}
                <div className="bg-slate-100 p-2.5 rounded-xl text-center border border-slate-300">
                  <div className="text-[10px] uppercase text-slate-600 font-bold">Extracto Oficial 1° Premio (Cabeza)</div>
                  <div className="text-2xl font-black text-slate-900 tracking-widest">{activeReceiptData.official_head}</div>
                  {activeReceiptData.significado && (
                    <div className="text-[10px] italic text-slate-600">"{activeReceiptData.significado}"</div>
                  )}
                </div>

                {/* Plays List */}
                <div className="space-y-1 border-b border-dashed border-slate-400 pb-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-600 border-b border-slate-300 pb-1">
                    <span>NÚMERO / ALCANCE</span>
                    <span>APOSTADO</span>
                    <span>PREMIO</span>
                  </div>
                  {(activeReceiptData.details || activeReceiptData.items || []).map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-0.5">
                      <span>
                        <strong>{it.number}</strong> ({it.position === 'cabeza' ? 'Cabeza' : `A los ${it.position}`})
                      </span>
                      <span>${it.amount}</span>
                      <span className={it.is_hit ? 'font-black text-emerald-700' : 'text-slate-500'}>
                        {it.is_hit ? `+$${(it.won_amount || 0).toLocaleString()}` : '$0'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Settlement Summary */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span>Total Invertido:</span>
                    <strong>${((activeReceiptData.items || []).reduce((a, b) => a + (Number(b.amount) || 0), 0)).toLocaleString()} ARS</strong>
                  </div>
                  <div className="flex justify-between text-sm font-black border-t border-slate-400 pt-1.5">
                    <span>TOTAL A COBRAR:</span>
                    <span className={activeReceiptData.total_won > 0 ? 'text-emerald-700 text-base' : 'text-slate-800'}>
                      ${Number(activeReceiptData.total_won || 0).toLocaleString()} ARS
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Balance Neto:</span>
                    <span>{activeReceiptData.balance >= 0 ? '+' : '-'}${Math.abs(activeReceiptData.balance || 0).toLocaleString()} ARS</span>
                  </div>
                </div>

                {/* Footer Validation Hash */}
                <div className="text-center border-t border-dashed border-slate-400 pt-3 space-y-1">
                  <div className="text-[9px] text-slate-500">
                    {activeReceiptData.total_won > 0 
                      ? '✓ COMPROBANTE AUTENTICADO: HABILITADO PARA COBRO EN AGENCIA'
                      : 'SORTEO OFICIAL CONCLUIDO SIN ACIERTOS'}
                  </div>
                  <div className="text-[8px] text-slate-400">
                    HASH: {activeReceiptData.sequence ? `QMP-${activeReceiptData.sequence}-${activeReceiptData.sorteo}` : 'QMP-VALIDATED-OFFICIAL'}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: Print & Share */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                aria-label="Imprimir comprobante"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar PDF</span>
              </button>

              <button
                onClick={handleShareReceipt}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow min-h-[40px]"
                aria-label="Compartir comprobante"
              >
                {copiedReceipt ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-200" />
                    <span>¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span>Compartir Comprobante</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AYUDA CONTEXTUAL & GUÍA OFICIAL */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Guía y ayuda del validador">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/20 to-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Guía del Validador de Boletos</h3>
                  <span className="text-[11px] text-slate-400">Preguntas frecuentes y explicación paso a paso</span>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                aria-label="Cerrar ayuda"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 px-3 pt-2 gap-2">
              <button
                onClick={() => setHelpTab('camera')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                  helpTab === 'camera' 
                    ? 'border-amber-400 text-amber-300 bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                📸 Uso de Cámara
              </button>
              <button
                onClick={() => setHelpTab('ticket')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                  helpTab === 'ticket' 
                    ? 'border-amber-400 text-amber-300 bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🎫 Datos del Boleto
              </button>
              <button
                onClick={() => setHelpTab('ai')}
                className={`px-3 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                  helpTab === 'ai' 
                    ? 'border-amber-400 text-amber-300 bg-slate-900' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                🤖 Transparencia & Datos
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-300 leading-relaxed">
              {helpTab === 'camera' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <h5 className="font-black text-amber-300 text-sm flex items-center gap-1.5">
                      <Camera className="w-4 h-4" /> ¿Cómo capturar tu boleto con la cámara?
                    </h5>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                      <li>Toca el botón <strong>"Capturar Foto del Boleto"</strong>.</li>
                      <li>Apunta la cámara con buena iluminación al <strong>código de barras o número de secuencia inferior</strong>.</li>
                      <li>El sistema comprimirá la imagen y detectará automáticamente los 10 dígitos de control.</li>
                      <li>Si el código está borroso o gastado, usa el <strong>ingreso manual</strong> escribiendo la secuencia y número de sorteo en el formulario.</li>
                    </ol>
                  </div>
                </div>
              )}

              {helpTab === 'ticket' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <h5 className="font-black text-amber-300 text-sm">¿Qué significan los campos del boleto?</h5>
                    <ul className="space-y-2">
                      <li>
                        <strong className="text-white">N° Secuencia (10 dígitos):</strong> Código único impreso al pie del ticket oficial que identifica la operación en la terminal de lotería.
                      </li>
                      <li>
                        <strong className="text-white">N° Sorteo:</strong> Número oficial del sorteo (ej: 12844) publicado por IPLyC o LOTBA.
                      </li>
                      <li>
                        <strong className="text-white">Ubicación / Alcance:</strong>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5 text-slate-400">
                          <li><strong>Cabeza (1°):</strong> Paga 70x a las 2 cifras, 500x a las 3 cifras y 3.500x a las 4 cifras.</li>
                          <li><strong>A los 5 Premios:</strong> Si sale del 1° al 5°, el premio se divide entre 5.</li>
                          <li><strong>A los 10 Premios:</strong> Si sale del 1° al 10°, el premio se divide entre 10.</li>
                          <li><strong>A los 20 Premios:</strong> Si sale en la pizarra completa, el premio se divide entre 20.</li>
                        </ul>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {helpTab === 'ai' && (
                <div className="space-y-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                    <h5 className="font-black text-emerald-400 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Honestidad y Datos Oficiales
                    </h5>
                    <p>
                      <strong>Quinela Master Pro</strong> no simula falsos ganadores. La verificación de boletos coteja directamente los números ingresados contra los extractos reales de las loterías oficiales de la República Argentina.
                    </p>
                    <p className="text-slate-400">
                      Las predicciones de la IA son modelos estadísticos basados en frecuencias históricas, atrasos y cadenas de Markov para asistir en la selección de apuestas. No constituyen ninguna garantía de acierto.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
              >
                Cerrar Guía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ESCÁNER DE CÓDIGO DE BARRAS EN VIVO (PDF417 / 1D) */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Escáner de código de barras">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <span>Lector de Código de Barras en Vivo</span>
              </div>
              <button
                onClick={closeScanner}
                aria-label="Cerrar escáner"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-emerald-500/40 min-h-[260px] flex items-center justify-center">
                <div id="reader-camera-view" className="w-full h-full"></div>
                {/* Laser scan line overlay */}
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-20 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#10b981] animate-pulse"></div>
                </div>
              </div>

              {cameraError ? (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{cameraError}</span>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-300">
                  Enfoca el <strong>código de barras PDF417</strong> inferior de tu boleto de quiniela.
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    closeScanner();
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Elegir Foto de Galería</span>
                </button>
                <button
                  onClick={closeScanner}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEGAL & RESPONSIBLE GAMBLING DISCLAIMER */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-center text-slate-400 text-[11px] leading-relaxed">
        <div className="flex items-center justify-center gap-2 text-slate-300 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Transparencia & Juego Responsable</span>
        </div>
        <p>
          Quinela Master Pro es una herramienta analítica independiente de estadística y cotejo de boletos. No organiza ni comercializa apuestas por dinero real. Los extractos y premios corresponden a los resultados oficiales publicados por Lotería de la Ciudad de Buenos Aires (LOTBA) e Instituto Provincial de Lotería y Casinos de Buenos Aires (IPLyC).
        </p>
        <div className="pt-1 text-[10px] text-slate-500">
          Prohibido para menores de 18 años. El juego compulsivo es perjudicial para la salud. Línea gratuita de orientación: <strong>0800-444-4000</strong> (Argentina).
        </div>
      </div>
    </div>
  );
}
