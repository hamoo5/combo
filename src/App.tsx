import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { RiderPage } from './components/Rider/RiderPage';
import { DriverPage } from './components/Driver/DriverPage';
import { ActiveRideModal } from './components/Rider/ActiveRideModal';
import { CaptainRegistrationModal } from './components/Driver/CaptainRegistrationModal';
import { CaptainRechargeModal } from './components/Driver/CaptainRechargeModal';
import { CaptainRateRiderModal } from './components/Driver/CaptainRateRiderModal';
import { TripsHistoryModal } from './components/Trips/TripsHistoryModal';
import { CommunityRulesModal } from './components/Community/CommunityRulesModal';
import { CommunityReviewsModal } from './components/Community/CommunityReviewsModal';
import { EnRouteRequestNotification } from './components/Shuttle/EnRouteRequestNotification';
import { EmergencySosModal } from './components/Safety/EmergencySosModal';
import { ToastContainer } from './components/UI/ToastContainer';
import {
  Car,
  User,
  ShieldCheck,
  Clock,
  Sparkles,
  Banknote,
  CheckCircle2,
  X,
  Wallet,
  Star,
  Award,
  TrendingUp,
} from 'lucide-react';

const MainApp: React.FC = () => {
  const {
    role,
    setRole,
    acceptanceNotification,
    dismissAcceptanceNotification,
    theme,
    toasts,
    removeToast,
  } = useApp();

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  return (
    <div
      className={`min-h-screen ${
        theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
      } flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-16 lg:pb-6 transition-colors duration-200`}
    >
      {/* Top Header */}
      <Header
        onOpenRecharge={() => setIsRechargeOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenReviews={() => setIsReviewsOpen(true)}
      />

      {/* Acceptance Notification Alert Banner */}
      {acceptanceNotification && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 shadow-lg flex items-center justify-between animate-fade-in z-20">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-bold">{acceptanceNotification}</span>
          </div>
          <button
            onClick={dismissAcceptanceNotification}
            className="p-1 rounded-md hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container - Dedicated Portal based on Role */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-4">
        {role === 'rider' ? (
          <RiderPage
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenReviews={() => setIsReviewsOpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
          />
        ) : (
          <DriverPage
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenRecharge={() => setIsRechargeOpen(true)}
            onOpenRules={() => setIsRulesOpen(true)}
            onOpenReviews={() => setIsReviewsOpen(true)}
          />
        )}
      </main>

      {/* Role-Adapted Mobile Bottom Bar (Dedicated for Rider vs Driver) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl">
        {role === 'rider' ? (
          <>
            <button
              type="button"
              onClick={() => {}}
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-400"
            >
              <Car className="w-4 h-4" />
              <span>طلب مشوار</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>رحلاتي</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>الأمان</span>
            </button>

            <button
              type="button"
              onClick={() => setIsReviewsOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-400 transition-colors"
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>التقييمات</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('driver')}
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/30"
              title="التبديل إلى تطبيق الكابتن"
            >
              <Car className="w-4 h-4" />
              <span>تطبيق الكابتن</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {}}
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-teal-400"
            >
              <Car className="w-4 h-4" />
              <span>غرفة القيادة</span>
            </button>

            <button
              type="button"
              onClick={() => setIsHistoryOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-teal-400 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>الأرباح D3</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRechargeOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-teal-400 transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>المحفظة</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRegisterOpen(true)}
              className="flex flex-col items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-teal-400 transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>التوثيق</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('rider')}
              className="flex flex-col items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30"
              title="التبديل إلى تطبيق الراكب"
            >
              <User className="w-4 h-4" />
              <span>تطبيق الراكب</span>
            </button>
          </>
        )}
      </div>

      {/* Global Toast Notifications (Non-intrusive floating toasts) */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Modals & Overlays */}
      <EmergencySosModal />
      <EnRouteRequestNotification />
      <ActiveRideModal />
      <CaptainRateRiderModal />
      <CommunityReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
      />
      <CaptainRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />
      <CaptainRechargeModal
        isOpen={isRechargeOpen}
        onClose={() => setIsRechargeOpen(false)}
      />
      <TripsHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />
      <CommunityRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
