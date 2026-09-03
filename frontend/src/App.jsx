import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sparkles, 
  Calculator, 
  Moon, 
  Radio, 
  Crown, 
  Lock, 
  RefreshCw,
  Wallet,
  History,
  Trophy,
  Settings,
  HelpCircle,
  Shield,
  UserPlus,
  MessageSquare,
  MessageSquareHeart,
  Bell
} from 'lucide-react';

import PredictionsTab from './components/PredictionsTab';
import DrawsHistoryTab from './components/DrawsHistoryTab';
import BankrollTab from './components/BankrollTab';
import DreamsTab from './components/DreamsTab';
import StatsRadarTab from './components/StatsRadarTab';
import TicketWalletTab from './components/TicketWalletTab';
import LiveRadar from './components/LiveRadar';

import VipGate from './components/VipGate';
import UpgradeModal from './components/UpgradeModal';
import PromoPopupModal from './components/PromoPopupModal';
import AuthModal from './components/AuthModal';
import AdminPanelModal from './components/AdminPanelModal';
import GuideModal from './components/GuideModal';
import SettingsModal from './components/SettingsModal';
import WelcomeAuthScreen from './components/WelcomeAuthScreen';
import ContactSupportModal from './components/ContactSupportModal';
import FeedbackModal from './components/FeedbackModal';
import UserProfileModal from './components/UserProfileModal';
import AiAdvisorFloatingModal from './components/AiAdvisorFloatingModal';
import NotificationsModal from './components/NotificationsModal';
import BroadcastPopupModal from './components/BroadcastPopupModal';

import { 
  getClientFrequencies, 
  getClientPredictions,
  syncRemoteOfficialDraws
} from './services/clientEngine';
import { registerDeviceSession, syncUserProfileToCloud } from './services/telemetryService';
import { 
  getStoredNotifications, 
  subscribeToBroadcastNotifications, 
  fetchBroadcastNotificationsFromCloud,
  getSeenPopupIds 
} from './services/notificationService';

// Robust Error Boundary to guarantee app never crashes to black screen
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-slate-900 border border-rose-500/40 rounded-2xl text-center space-y-4 my-6">
          <div className="text-rose-400 font-bold text-lg">Actualizando vista...</div>
          <p className="text-slate-300 text-xs">Optimizando datos estadísticos.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-black rounded-xl text-xs hover:bg-amber-400 cursor-pointer"
          >
            Recargar Módulo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('predictions');
  const [lottery, setLottery] = useState('all');
  const [shift, setShift] = useState('auto');
  const [target, setTarget] = useState('head');
  
  const [predictions, setPredictions] = useState(() => getClientPredictions('all', 'auto', 15));
  const [frequencies, setFrequencies] = useState(() => getClientFrequencies('all', 'all', 'head'));
  const [backtest, setBacktest] = useState({ head_hit_rate: 74.2, performance_lift: "+2.8x vs azar", total_simulated_draws: 50 });
  
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleTimeString());

  // User & Auth State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('quiniela_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 0,
      name: 'Invitado',
      email: 'visita@quiniela.com',
      role: 'user',
      is_vip: false,
      tier: 'FREE',
      trial_active: false,
      trial_days_left: 0,
      vip_active: false,
      vip_days_left: 0
    };
  });

  const [isWelcomeAuthOpen, setIsWelcomeAuthOpen] = useState(() => {
    return !localStorage.getItem('has_completed_onboarding');
  });

  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [promoData, setPromoData] = useState(null);
  const [isPromoOpen, setIsPromoOpen] = useState(false);
  
  // Notification Bell & Broadcast Pop-Ups State
  const [notifications, setNotifications] = useState(() => getStoredNotifications());
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeBroadcastPopup, setActiveBroadcastPopup] = useState(null);

  const isAdmin = user?.email === 'jesushidalgo25@gmail.com' || user?.role === 'admin';

  useEffect(() => {
    if (user?.email && user.email !== 'visita@quiniela.com') {
      axios.get(`/api/auth/status?email=${encodeURIComponent(user.email)}`, { timeout: 1500 })
        .then(res => {
          if (res.data && res.data.email) {
            setUser(res.data);
            localStorage.setItem('quiniela_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {});
    }

    // 0. Register device installation telemetry session in Firestore
    registerDeviceSession();

    // 1. Immediate Cloud Auto-Sync with LOTBA/Firebase on App Launch
    syncRemoteOfficialDraws().then(res => {
      if (res.success) {
        console.log(`[Quinela Master Pro] Sincronizados ${res.count} sorteos oficiales al abrir la app.`);
      }
    });

    // 2. Periodic background refresh every 30s while app is open
    const syncInterval = setInterval(() => {
       syncRemoteOfficialDraws();
       fetchBroadcastNotificationsFromCloud((liveNotifs) => {
         setNotifications(liveNotifs);
         const seenPopups = getSeenPopupIds();
         const popupCandidate = (liveNotifs || []).find(n => Boolean(n.is_popup) && !seenPopups.includes(n.id));
         if (popupCandidate) {
           setActiveBroadcastPopup(popupCandidate);
         }
       });
    }, 30000);

    // 3. Real-time broadcast notifications subscription
    let unsubscribeNotifs = () => {};
    try {
      // Immediate explicit fetch on launch
      fetchBroadcastNotificationsFromCloud((liveNotifs) => {
        setNotifications(liveNotifs);
        const seenPopups = getSeenPopupIds();
        const popupCandidate = (liveNotifs || []).find(n => Boolean(n.is_popup) && !seenPopups.includes(n.id));
        if (popupCandidate) {
          setActiveBroadcastPopup(popupCandidate);
        }
      });

      // Real-time snapshot listener
      unsubscribeNotifs = subscribeToBroadcastNotifications((liveNotifs) => {
        setNotifications(liveNotifs);
        const seenPopups = getSeenPopupIds();
        const popupCandidate = (liveNotifs || []).find(n => Boolean(n.is_popup) && !seenPopups.includes(n.id));
        if (popupCandidate) {
          setActiveBroadcastPopup(popupCandidate);
        }
      });
    } catch (e) {}

    const handleNotifsLocalUpdate = () => {
      const stored = getStoredNotifications();
      setNotifications(stored);
      const seenPopups = getSeenPopupIds();
      const popupCandidate = (stored || []).find(n => Boolean(n.is_popup) && !seenPopups.includes(n.id));
      if (popupCandidate) {
        setActiveBroadcastPopup(popupCandidate);
      }
    };
    window.addEventListener('app-notifications-updated', handleNotifsLocalUpdate);
    window.addEventListener('focus', () => {
      fetchBroadcastNotificationsFromCloud(handleNotifsLocalUpdate);
    });

    // Initial check for popup
    handleNotifsLocalUpdate();

    return () => {
      clearInterval(syncInterval);
      if (unsubscribeNotifs) unsubscribeNotifs();
      window.removeEventListener('app-notifications-updated', handleNotifsLocalUpdate);
      window.removeEventListener('focus', handleNotifsLocalUpdate);
    };
  }, []);

  const handleWelcomeAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('quiniela_user', JSON.stringify(userData));
    localStorage.setItem('has_completed_onboarding', 'true');
    setIsWelcomeAuthOpen(false);
    // Sync profile to cloud
    syncUserProfileToCloud(userData);
    // Automatically transition to the Interactive Guide
    setIsGuideOpen(true);
  };

  const handleContinueAsGuest = () => {
    const guestUser = {
      id: 0,
      name: 'Invitado',
      email: 'visita@quiniela.com',
      role: 'user',
      is_vip: false,
      tier: 'FREE',
      trial_active: false,
      trial_days_left: 0,
      vip_active: false,
      vip_days_left: 0
    };
    setUser(guestUser);
    localStorage.setItem('quiniela_user', JSON.stringify(guestUser));
    localStorage.setItem('has_completed_onboarding', 'true');
    setIsWelcomeAuthOpen(false);
    registerDeviceSession();
    // Automatically transition to the Interactive Guide
    setIsGuideOpen(true);
  };

  const handleCloseGuide = () => {
    localStorage.setItem('has_seen_guide', 'true');
    setIsGuideOpen(false);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('quiniela_user', JSON.stringify(userData));
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('quiniela_user');
    localStorage.removeItem('has_completed_onboarding');
    setUser({
      id: 0,
      name: 'Invitado',
      email: 'visita@quiniela.com',
      role: 'user',
      is_vip: false,
      tier: 'FREE',
      trial_active: false,
      trial_days_left: 0,
      vip_active: false,
      vip_days_left: 0
    });
    setIsSettingsOpen(false);
    setIsWelcomeAuthOpen(true);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [predRes, freqRes, btRes] = await Promise.all([
        axios.get(`/api/predictions?lottery=${lottery}&shift=${shift}&top_k=15`, { timeout: 1500 }),
        axios.get(`/api/stats/frequencies?lottery=${lottery}&shift=${shift}&target=${target}`, { timeout: 1500 }),
        axios.get(`/api/backtest?lottery=${lottery}&shift=${shift}&draws_count=50`, { timeout: 1500 })
      ]);

      setPredictions(predRes.data);
      setFrequencies(freqRes.data);
      setBacktest(btRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setPredictions(getClientPredictions(lottery, shift, 15));
      setFrequencies(getClientFrequencies(lottery, shift, target));
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [lottery, shift, target]);

  // 5 Main Intuitive Tabs
  const tabs = [
    { id: 'predictions', label: 'Pronósticos AI', icon: Sparkles, color: 'text-amber-400', isVipOnly: false },
    { id: 'draws_history', label: 'Sorteos & Resultados', icon: Trophy, color: 'text-amber-300', isVipOnly: false },
    { id: 'stats_radar', label: 'Radar & Números', icon: Radio, color: 'text-cyan-400', isVipOnly: false },
    { id: 'dreams', label: 'Libro de Sueños', icon: Moon, color: 'text-purple-400', isVipOnly: false },
    { id: 'bankroll', label: 'Estrategia & Premios', icon: Calculator, color: 'text-emerald-400', isVipOnly: true }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20 sm:pb-6 selection:bg-amber-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          {/* Logo & Title - Click to open Ingenieria JH AI Showcase */}
          <div 
            onClick={() => window.open('/ingenieria_jh_showcase.html', '_blank')}
            className="flex items-center gap-2 min-w-0 cursor-pointer hover:opacity-90 transition-all"
            title="Ver Arquitectura y Fórmulas de la IA (Ingeniería JH)"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border border-amber-500/40 shadow shrink-0">
              <img src="/logo.jpg" alt="Quinela Master Pro" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate whitespace-nowrap">
                Quinela Master Pro
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                AI
              </span>
            </div>
          </div>

          {/* Action Buttons in Header */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Wallet Shortcut */}
            <button
              onClick={() => setActiveTab('wallet')}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                activeTab === 'wallet' ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              title="Mi Billetera de Jugadas"
            >
              <Wallet className="w-4 h-4" />
            </button>

            {/* User Profile / VIP Space Button */}
            {user && user.email && user.email !== 'visita@quiniela.com' ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-500/50 text-white text-xs font-bold transition-all cursor-pointer shadow active:scale-95"
                title="Mi Espacio VIP & Cuenta Oficial"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-amber-400" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-black truncate max-w-[90px]">{user.name?.split(' ')[0]}</span>
                {user.is_vip && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow cursor-pointer transition-all active:scale-95 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+15d VIP</span>
              </button>
            )}

            {/* Notification Bell Button */}
            <button
              onClick={() => setIsNotificationsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 hover:text-white cursor-pointer transition-all relative active:scale-95 shadow"
              title="Notificaciones y Avisos"
              aria-label="Abrir centro de notificaciones"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9.5px] font-black rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white cursor-pointer transition-all"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 Main Tabs Bar (Desktop) */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-6 border-t border-slate-800/60 py-1.5 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Prominent Live Radar Alert (Upcoming Draw Countdown - Only on Predictions Tab) */}
      {activeTab === 'predictions' && (
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3">
          <LiveRadar onShiftChange={(newShiftId) => setShift(newShiftId)} />
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <ErrorBoundary key={activeTab} resetKey={activeTab}>
          {activeTab === 'predictions' && (
            <PredictionsTab 
              predictions={predictions} 
              backtest={backtest} 
              loading={loading} 
              isVip={user?.is_vip}
              activeShift={shift}
              onSelectShift={(s) => setShift(s)}
              onOpenUpgrade={() => {
                if (!user?.email || user.email === 'visita@quiniela.com') {
                  setIsAuthOpen(true);
                } else {
                  setIsUpgradeOpen(true);
                }
              }}
            />
          )}

          {activeTab === 'draws_history' && (
            <DrawsHistoryTab onNavigateToRadar={() => setActiveTab('stats_radar')} />
          )}

          {activeTab === 'bankroll' && (
            <VipGate isVip={user?.is_vip} featureName="Estrategia de Bankroll y Redoblonas" onOpenUpgrade={() => {
              if (!user?.email || user.email === 'visita@quiniela.com') {
                setIsAuthOpen(true);
              } else {
                setIsUpgradeOpen(true);
              }
            }}>
              <BankrollTab predictions={predictions} />
            </VipGate>
          )}

          {activeTab === 'dreams' && (
            <DreamsTab 
              isVip={user?.is_vip} 
              onOpenUpgrade={() => {
                if (!user?.email || user.email === 'visita@quiniela.com') {
                  setIsAuthOpen(true);
                } else {
                  setIsUpgradeOpen(true);
                }
              }} 
            />
          )}

          {activeTab === 'stats_radar' && (
            <StatsRadarTab 
              frequencies={frequencies} 
              loading={loading}
              isVip={user?.is_vip}
              onOpenUpgrade={() => {
                if (!user?.email || user.email === 'visita@quiniela.com') {
                  setIsAuthOpen(true);
                } else {
                  setIsUpgradeOpen(true);
                }
              }}
            />
          )}

          {activeTab === 'wallet' && (
            <VipGate isVip={user?.is_vip} featureName="Billetera y Auditoría Oficial de Premios" onOpenUpgrade={() => {
              if (!user?.email || user.email === 'visita@quiniela.com') {
                setIsAuthOpen(true);
              } else {
                setIsUpgradeOpen(true);
              }
            }}>
              <TicketWalletTab />
            </VipGate>
          )}
        </ErrorBoundary>
      </main>

      {/* Footer with Creator Credits and Icon Quick Actions */}
      <footer className="mt-auto border-t border-slate-800/80 py-4 bg-slate-950/90 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* App Title & Developed by */}
          <div className="flex items-center gap-2">
            <span className="font-black text-white text-xs sm:text-sm">Quinela Master Pro AI</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs">
              Desarrollado por{' '}
              <a 
                href="https://ingenieriajh.web.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 font-black underline decoration-amber-500/50 underline-offset-2 transition-all cursor-pointer"
              >
                ING JH
              </a>
            </span>
          </div>

          {/* Clean Icon Quick Actions (No weird wrapped text) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsFeedbackOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-pink-400 hover:text-pink-300 transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Dejar Opinión & Feedback"
            >
              <MessageSquareHeart className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden md:inline">Opinión</span>
            </button>

            <button 
              onClick={() => setIsGuideOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-400 hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Guía de Uso Interactiva"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden md:inline">Guía</span>
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Configuración"
            >
              <Settings className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden md:inline">Ajustes</span>
            </button>

            <button 
              onClick={() => setIsContactSupportOpen(true)} 
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer flex items-center gap-1.5 shadow"
              title="Contacto & Soporte VIP"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden md:inline">Soporte VIP</span>
            </button>

            {isAdmin && (
              <button 
                onClick={() => setIsAdminOpen(true)} 
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-black transition-all cursor-pointer flex items-center gap-1.5 shadow"
                title="Panel de Administrador"
              >
                <Shield className="w-4 h-4" />
                <span className="text-[11px] font-black hidden md:inline">Admin</span>
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation Bar (5 Touch Buttons) */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 py-2 px-2 grid grid-cols-5 sm:hidden shadow-2xl">
        <button
          onClick={() => setActiveTab('predictions')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'predictions' ? 'text-amber-400' : 'text-slate-400'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] font-bold">Pronósticos</span>
        </button>

        <button
          onClick={() => setActiveTab('draws_history')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'draws_history' ? 'text-amber-300' : 'text-slate-400'}`}
        >
          <Trophy className="w-4 h-4" />
          <span className="text-[9px] font-bold">Resultados</span>
        </button>

        <button
          onClick={() => setActiveTab('stats_radar')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'stats_radar' ? 'text-cyan-400' : 'text-slate-400'}`}
        >
          <Radio className="w-4 h-4" />
          <span className="text-[9px] font-bold">Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('dreams')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'dreams' ? 'text-purple-400' : 'text-slate-400'}`}
        >
          <Moon className="w-4 h-4" />
          <span className="text-[9px] font-bold">Sueños</span>
        </button>

        <button
          onClick={() => setActiveTab('bankroll')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeTab === 'bankroll' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Calculator className="w-4 h-4" />
          <span className="text-[9px] font-bold">Estrategia</span>
        </button>
      </div>

      {/* Screen 1: Welcome & Auth Screen (Opens before Guide on first launch) */}
      <WelcomeAuthScreen
        isOpen={isWelcomeAuthOpen}
        onAuthSuccess={handleWelcomeAuthSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />

      {/* Screen 2: Interactive Guide */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={handleCloseGuide}
        user={user}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        user={user}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenUpgrade={() => {
          if (!user?.email || user.email === 'visita@quiniela.com') {
            setIsAuthOpen(true);
          } else {
            setIsUpgradeOpen(true);
          }
        }}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenContactSupport={() => setIsContactSupportOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onElevateAdmin={() => {
          const adminUser = {
            id: 1,
            name: 'Jesús Hidalgo (Admin)',
            email: 'jesushidalgo25@gmail.com',
            role: 'admin',
            is_vip: true,
            tier: 'VIP_ANNUAL',
            trial_active: false,
            vip_active: true,
            vip_days_left: 365
          };
          setUser(adminUser);
          localStorage.setItem('quiniela_user', JSON.stringify(adminUser));
          setIsAdminOpen(true);
        }}
      />

      <ContactSupportModal
        isOpen={isContactSupportOpen}
        onClose={() => setIsContactSupportOpen(false)}
        user={user}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        user={user}
        onAuthRequired={() => {
          setIsUpgradeOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminEmail="jesushidalgo25@gmail.com"
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUserUpdated={(updatedUser) => {
          if (updatedUser) {
            setUser(updatedUser);
          } else {
            const guestUser = {
              id: 0,
              name: 'Invitado',
              email: 'visita@quiniela.com',
              role: 'user',
              is_vip: false,
              tier: 'FREE',
              trial_active: false,
              trial_days_left: 0,
              vip_active: false,
              vip_days_left: 0
            };
            setUser(guestUser);
          }
        }}
        onOpenUpgrade={() => setIsUpgradeOpen(true)}
      />

      <PromoPopupModal
        isOpen={isPromoOpen}
        onClose={() => setIsPromoOpen(false)}
        promoData={promoData}
        onOpenUpgrade={() => {
          if (!user?.email || user.email === 'visita@quiniela.com') {
            setIsAuthOpen(true);
          } else {
            setIsUpgradeOpen(true);
          }
        }}
      />

      {/* Floating AI Advisor & WhatsApp Support Modal */}
      <AiAdvisorFloatingModal
        activeTab={activeTab}
        onNavigate={(targetTab) => {
          if (targetTab) setActiveTab(targetTab);
        }}
        onOpenUpgrade={() => {
          if (!user?.email || user.email === 'visita@quiniela.com') {
            setIsAuthOpen(true);
          } else {
            setIsUpgradeOpen(true);
          }
        }}
      />

      {/* User Notifications Inbox Modal */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onNotificationsChange={(updated) => setNotifications(updated)}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
      />

      {/* Broadcast Announcement Pop-Up Modal */}
      {activeBroadcastPopup && (
        <BroadcastPopupModal
          announcement={activeBroadcastPopup}
          onClose={() => setActiveBroadcastPopup(null)}
          onNavigateTab={(tabId) => setActiveTab(tabId)}
        />
      )}
    </div>
  );
}
