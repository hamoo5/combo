import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  Navigation,
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  Gauge,
  Sparkles,
  Maximize2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';

interface MapProgressTrackerProps {
  approachProgress: number; // 0 to 100
  remainingDistanceKm: number;
  remainingMinutes: number;
  onFocusCaptain: () => void;
  onFastForwardArrival: () => void;
}

export const MapProgressTracker: React.FC<MapProgressTrackerProps> = ({
  approachProgress,
  remainingDistanceKm,
  remainingMinutes,
  onFocusCaptain,
  onFastForwardArrival,
}) => {
  const { activeRide, setIsRideModalMinimized, openSosModal } = useApp();

  if (!activeRide || !activeRide.driver) return null;

  const isHeadingToPickup =
    activeRide.status === 'driver_assigned' || activeRide.status === 'arriving';
  const isArrivedAtPickup = activeRide.status === 'arriving';
  const isInProgress = activeRide.status === 'in_progress';

  // Distance label: e.g. 850 م or 1.4 كم
  const formattedDistance =
    remainingDistanceKm < 1
      ? `${Math.max(50, Math.round(remainingDistanceKm * 1000))} متر`
      : `${remainingDistanceKm.toFixed(1)} كم`;

  // ETA label
  const formattedEta = isArrivedAtPickup
    ? 'وصل الكابتن الآن!'
    : remainingMinutes <= 1
    ? 'أقل من دقيقة واحدة'
    : `خلال ${Math.ceil(remainingMinutes)} دقيقة`;

  return (
    <div className="absolute top-3 left-3 right-3 sm:right-auto sm:left-4 sm:w-96 z-30 flex flex-col gap-2 pointer-events-auto animate-fade-in">
      {/* Main Glassmorphic Tracking Card */}
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 flex flex-col gap-3 text-slate-100">
        {/* Top Header: Live Status Badge & ETA */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-right">
              <span className="text-xs font-bold text-white block">
                {isArrivedAtPickup
                  ? 'الكابتن وصل عند نقطة الركوب!'
                  : isHeadingToPickup
                  ? 'الكابتن في الطريق لنقطة ركوبك'
                  : 'الرحلة جارية نحو وجهتك'}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                متابعة حركة السيارة المباشرة عبر الأقمار
              </span>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-right">
            <span className="text-[10px] text-slate-400 block">وقت الوصول</span>
            <span className="text-xs font-black text-emerald-300 tabular-nums">
              {formattedEta}
            </span>
          </div>
        </div>

        {/* 5-Second Real-Time GPS Tracking Badge */}
        {isHeadingToPickup && !isArrivedAtPickup && (
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-teal-500/30 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-teal-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>تتبع مسار الكابتن: تحديث الموقع كل 5 ثوانٍ عبر GPS 📡</span>
            </div>
            <span className="text-emerald-400 font-bold font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              بث مباشر
            </span>
          </div>
        )}

        {/* Step-by-Step Progress Pipeline */}
        <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
          <div className="flex flex-col items-center">
            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold mb-1 shadow-sm shadow-emerald-900">
              ✓
            </div>
            <span className="text-slate-300 font-semibold truncate w-full">تم القبول</span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 transition-colors ${
                isHeadingToPickup && !isArrivedAtPickup
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50 animate-pulse'
                  : isArrivedAtPickup || isInProgress
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isArrivedAtPickup || isInProgress ? '✓' : '2'}
            </div>
            <span
              className={`truncate w-full font-semibold ${
                isHeadingToPickup ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              في الطريق
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 transition-colors ${
                isArrivedAtPickup
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50 animate-pulse'
                  : isInProgress
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isInProgress ? '✓' : '3'}
            </div>
            <span
              className={`truncate w-full font-semibold ${
                isArrivedAtPickup ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              عند الركوب
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 ${
                isInProgress
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-400/50 animate-pulse'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              4
            </div>
            <span
              className={`truncate w-full font-semibold ${
                isInProgress ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              نحو الوجهة
            </span>
          </div>
        </div>

        {/* Live Animated Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-teal-400" />
              <span>المسافة المتبقية: <strong className="text-white">{formattedDistance}</strong></span>
            </span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {Math.round(approachProgress)}%
            </span>
          </div>

          <div className="relative w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-green-400 transition-all duration-500 ease-out rounded-full relative"
              style={{ width: `${Math.min(100, Math.max(5, approachProgress))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Captain & Vehicle Card */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/90 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={activeRide.driver.avatar}
                alt={activeRide.driver.name}
                className="w-11 h-11 rounded-full object-cover border border-emerald-500/60"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-600 border border-slate-950 flex items-center justify-center text-[9px] text-white">
                ✓
              </span>
            </div>

            <div className="text-right truncate">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-white truncate">
                  {activeRide.driver.name}
                </span>
                <span className="text-amber-400 text-[10px] font-bold shrink-0">
                  ★{activeRide.driver.rating}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                {activeRide.driver.carModel} · {activeRide.driver.carColor}
              </div>
            </div>
          </div>

          {/* Plate Number */}
          <div className="bg-slate-900 border border-slate-700 px-2 py-1 rounded-lg text-center shrink-0">
            <span className="text-[8px] text-slate-400 block leading-none">مصر</span>
            <span className="text-[11px] font-black text-white tracking-wider">
              {activeRide.driver.carPlate}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            type="button"
            onClick={onFocusCaptain}
            className="py-1.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
            title="توسيط الخريطة على سيارة الكابتن"
          >
            <Navigation className="w-3 h-3" />
            <span>متابعة</span>
          </button>

          <a
            href={`tel:${activeRide.driver.phone}`}
            className="py-1.5 px-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-[10px] font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <Phone className="w-3 h-3" />
            <span>اتصال</span>
          </a>

          <button
            type="button"
            onClick={() => setIsRideModalMinimized(false)}
            className="py-1.5 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-md shadow-emerald-950 flex items-center justify-center gap-1 transition-all active:scale-95"
          >
            <Maximize2 className="w-3 h-3" />
            <span>تفاصيل</span>
          </button>

          <button
            type="button"
            onClick={() => openSosModal('rider')}
            className="py-1.5 px-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] shadow-md shadow-rose-950 flex items-center justify-center gap-1 transition-all active:scale-95 animate-pulse"
            title="زر طوارئ واستغاثة SOS فوري"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>SOS</span>
          </button>
        </div>

        {/* Quick Fast-Forward / Advance for Testing & Seamless Flow */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <span className="text-slate-400">
            الأجرة المتفق عليها: <strong className="text-emerald-400 font-bold">{activeRide.finalFareEgp} ج.م نقداً</strong>
          </span>

          <button
            type="button"
            onClick={onFastForwardArrival}
            className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>
              {isHeadingToPickup && !isArrivedAtPickup && 'تسريع: وصل الكابتن الآن'}
              {isArrivedAtPickup && 'بدء الرحلة للوجهة'}
              {isInProgress && 'تسريع: الوصول للوجهة'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
