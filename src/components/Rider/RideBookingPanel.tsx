import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LocationPoint, RideCategory } from '../../types';
import { POPULAR_LOCATIONS } from '../../data/mockData';
import { FareEstimator, TrafficZone } from './FareEstimator';
import {
  MapPin,
  Navigation,
  ArrowUpDown,
  Car,
  Users,
  Shield,
  Briefcase,
  Minus,
  Plus,
  Banknote,
  Sparkles,
  Calculator,
  Sliders,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
  Flame,
} from 'lucide-react';

interface RideBookingPanelProps {
  onActivateMapPick: (mode: 'pickup' | 'destination') => void;
  selectedPickup: LocationPoint;
  selectedDestination: LocationPoint;
  onSetPickup: (point: LocationPoint) => void;
  onSetDestination: (point: LocationPoint) => void;
}

export const RideBookingPanel: React.FC<RideBookingPanelProps> = ({
  onActivateMapPick,
  selectedPickup,
  selectedDestination,
  onSetPickup,
  onSetDestination,
}) => {
  const { requestRide, activeRide, addToast } = useApp();
  const [category, setCategory] = useState<RideCategory>('comfort');
  const [showLocationList, setShowLocationList] = useState<'pickup' | 'destination' | null>(null);
  const [showFareEstimator, setShowFareEstimator] = useState<boolean>(false);
  const [isFixedFare, setIsFixedFare] = useState<boolean>(true); // Fixed Guaranteed Fare (ممنوع التفاوض)
  const [selectedTrafficZone, setSelectedTrafficZone] = useState<TrafficZone | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate distance
  const dx = selectedDestination.x - selectedPickup.x;
  const dy = selectedDestination.y - selectedPickup.y;
  const rawDist = Math.sqrt(dx * dx + dy * dy) * 0.45;
  const distanceKm = Math.max(2.5, Math.round(rawDist * 10) / 10);
  const estMinutes = Math.round(distanceKm * 2.2 + 4);

  // InDrive recommended baseline fare calculation in EGP
  const normalFare = Math.max(25, Math.round(20 + distanceKm * 6.5));
  const shuttleFare = Math.max(20, Math.round(normalFare * 0.55));
  const baseCalculatedFare = category === 'shuttle' ? shuttleFare : normalFare;
  const [userOfferedFare, setUserOfferedFare] = useState<number>(baseCalculatedFare);

  const handleCategoryChange = (cat: RideCategory) => {
    setCategory(cat);
    if (cat === 'shuttle') {
      setUserOfferedFare(shuttleFare);
    } else {
      setUserOfferedFare(normalFare);
    }
  };

  const handleSwap = () => {
    const temp = selectedPickup;
    onSetPickup(selectedDestination);
    onSetDestination(temp);
  };

  // Called when passenger clicks "اعتماد هذا السعر" in the Fare Estimator
  const handleApplyFromEstimator = (
    estimatedFare: number,
    newCategory: RideCategory,
    fixedMode: boolean,
    details: {
      distanceKm: number;
      trafficZone: TrafficZone;
      commissionEgp: number;
      captainNetEgp: number;
    }
  ) => {
    setUserOfferedFare(estimatedFare);
    setCategory(newCategory);
    setIsFixedFare(fixedMode);
    setSelectedTrafficZone(details.trafficZone);
    setShowFareEstimator(false);
    setToastMessage(
      `✨ تم اعتماد السعر (${estimatedFare} ج.م) بنجاح! ${
        fixedMode ? '🔒 سعر ثابت مضمون (ممنوع الفصال)' : '🤝 عرض سعر مرن'
      } · صافي الكابتن: ${details.captainNetEgp} ج.م`
    );
    addToast(
      `تم اعتماد السعر العادل (${estimatedFare} ج.م كاش)! 🔒 سعر ثابت مضمون (صافي الكابتن: ${details.captainNetEgp} ج.م)`,
      'success',
      { title: 'محاكي الأجرة' }
    );
    setTimeout(() => setToastMessage(null), 6000);
  };

  // Commission is 15%
  const commissionEgp = Math.round(userOfferedFare * 0.15);
  const captainNetFare = Math.max(0, userOfferedFare - commissionEgp);

  const handleBooking = () => {
    requestRide(selectedPickup, selectedDestination, category, userOfferedFare, {
      isFixedFare,
      trafficCongestionMultiplier: selectedTrafficZone?.multiplier || 1.0,
      trafficZoneName: selectedTrafficZone?.name,
      captainNetFareEgp: captainNetFare,
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Panel Heading */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>حجز مشوار بسعر ثابت ومضمون</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
              تسعير قطعي (ممنوع الفصال)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            حدد وجهتك، واعرف سعرك الثابت العادل مسبقاً دون أي مفاوضات أو مزايدات
          </p>
        </div>
        <div className="text-left bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block">الدفع مباشرة</span>
          <span className="text-xs font-bold text-emerald-400">نقدي كاش للكابتن</span>
        </div>
      </div>

      {/* Origin & Destination Inputs */}
      <div className="relative flex flex-col gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        {/* Pickup */}
        <div className="relative">
          <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            نقطة الانطلاق (الركوب)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLocationList(showLocationList === 'pickup' ? null : 'pickup')}
              className="flex-1 text-right px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-sm text-slate-200 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {selectedPickup.name}
            </button>
            <button
              type="button"
              onClick={() => onActivateMapPick('pickup')}
              title="تحديد من الخريطة"
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs border border-slate-700 flex items-center gap-1 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الخريطة</span>
            </button>
          </div>

          {/* Quick Pickup Dropdown */}
          {showLocationList === 'pickup' && (
            <div className="absolute top-full right-0 left-0 mt-1 z-30 max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] text-slate-400 font-semibold">
                أبرز محطات وميادين القاهرة والجيزة
              </div>
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={'pick_' + loc.id}
                  onClick={() => {
                    onSetPickup(loc);
                    setShowLocationList(null);
                  }}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedPickup.id === loc.id
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] text-slate-400">{loc.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-1 z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-emerald-400 flex items-center justify-center shadow-md active:rotate-180 transition-all"
            title="تبديل نقطة الركوب والوجهة"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination */}
        <div className="relative">
          <label className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            وجهة الوصول (النزول)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setShowLocationList(showLocationList === 'destination' ? null : 'destination')
              }
              className="flex-1 text-right px-3 py-2 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-sm text-slate-200 truncate focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {selectedDestination.name}
            </button>
            <button
              type="button"
              onClick={() => onActivateMapPick('destination')}
              title="تحديد من الخريطة"
              className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs border border-slate-700 flex items-center gap-1 whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">الخريطة</span>
            </button>
          </div>

          {/* Quick Destination Dropdown */}
          {showLocationList === 'destination' && (
            <div className="absolute top-full right-0 left-0 mt-1 z-30 max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1">
              <div className="px-2 py-1 text-[11px] text-slate-400 font-semibold">
                اختر وجهتك
              </div>
              {POPULAR_LOCATIONS.map((loc) => (
                <button
                  key={'dest_' + loc.id}
                  onClick={() => {
                    onSetDestination(loc);
                    setShowLocationList(null);
                  }}
                  className={`w-full text-right px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedDestination.id === loc.id
                      ? 'bg-rose-500/20 text-rose-300 font-bold'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>{loc.name}</span>
                  <span className="text-[10px] text-slate-400">{loc.city}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification when Fare Estimator applies price */}
      {toastMessage && (
        <div className="bg-emerald-950/90 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-400 hover:text-white p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Fare Estimator Accordion / Trigger Button */}
      <div className="bg-slate-950/80 rounded-2xl border border-teal-500/30 overflow-hidden shadow-md">
        <button
          type="button"
          onClick={() => setShowFareEstimator((prev) => !prev)}
          className="w-full p-3.5 flex items-center justify-between hover:bg-slate-900/60 transition-colors text-right"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  محاكي الأجرة والتسعير العادل (Fare Estimator)
                </span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                  تقدير الزحام والمسافة
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                احسب تكلفة مشوارك، طبق معامل الزحام، وحدد سعراً ثابتاً ممنوع الفصال مع معرفة صافي الكابتن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 shrink-0">
            <span>{showFareEstimator ? 'إخفاء المحاكي' : 'فتح المحاكي'}</span>
            {showFareEstimator ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showFareEstimator && (
          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/70">
            <FareEstimator
              currentDistanceKm={distanceKm}
              currentCategory={category}
              pickupName={selectedPickup.name}
              destinationName={selectedDestination.name}
              isInline={true}
              onApplyEstimatedFare={handleApplyFromEstimator}
              onClose={() => setShowFareEstimator(false)}
            />
          </div>
        )}
      </div>

      {/* Ride Category Selection including Shuttle */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Shuttle (Uber Shuttle) */}
        <button
          type="button"
          onClick={() => handleCategoryChange('shuttle')}
          className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 ${
            category === 'shuttle'
              ? 'bg-teal-950/60 border-teal-500 text-white ring-1 ring-teal-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-white">وصلة شاتل</span>
            <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1 py-0.5 rounded font-bold">
              وفر 50%
            </span>
          </div>
          <span className="text-[10px] text-teal-400 font-semibold">مقعد شاغر بالسكة</span>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange('comfort')}
          className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 ${
            category === 'comfort'
              ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-white">مريح (فردي)</span>
            <Car className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-400">سيدان مكيفة حديثة</span>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange('saver')}
          className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 ${
            category === 'saver'
              ? 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-white">اقتصادي</span>
            <Users className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <span className="text-[10px] text-slate-400">توفير مناسب</span>
        </button>

        <button
          type="button"
          onClick={() => handleCategoryChange('women_only')}
          className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 ${
            category === 'women_only'
              ? 'bg-pink-950/40 border-pink-500 text-white ring-1 ring-pink-500/50'
              : 'bg-slate-950/40 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-white">سيدات فقط</span>
            <Shield className="w-3.5 h-3.5 text-pink-400" />
          </div>
          <span className="text-[10px] text-slate-400">كابتن سيدة معتمدة</span>
        </button>
      </div>

      {/* Pricing & Transparency Section */}
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
        {/* Fixed Fare Guarantee Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <span className="flex items-center gap-1.5 text-xs font-bold text-teal-300 bg-teal-500/15 border border-teal-500/30 px-3 py-1 rounded-xl">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            سعر ثابت قطعي معتمد (ممنوع الفصال والتفاوض نهائياً)
          </span>

          <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
            مضمون 100%
          </span>
        </div>

        {/* Selected traffic zone indicator if configured */}
        {selectedTrafficZone && (
          <div className="p-2 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>معدل زحام المنطقة: <strong className="text-white">{selectedTrafficZone.name}</strong></span>
            </div>
            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded text-[10px]">
              {selectedTrafficZone.multiplier}x
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">الأجرة الثابتة المعتمدة للمشوار</span>
          <span className="text-slate-400 tabular-nums">
            المسافة: {distanceKm} كم · ~{estMinutes} دقيقة
          </span>
        </div>

        {/* Big Fixed Fare Display (No negotiation +/- buttons) */}
        <div className="p-4 bg-slate-900/90 rounded-2xl border border-teal-500/30 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-400">إجمالي الأجرة المستحقة نقداً:</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">
                {userOfferedFare}
              </span>
              <span className="text-sm font-bold text-white">ج.م كاش</span>
            </div>
          </div>

          <div className="text-left bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] text-teal-300 font-bold block flex items-center gap-1">
              <Lock className="w-3 h-3 text-teal-400" />
              سعر نهائي ثابت
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              لا زيادة ولا فصال بعد الركوب
            </span>
          </div>
        </div>

        {/* Clear transparent financial split: What passenger pays vs what captain keeps */}
        <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">إجمالي دفع الراكب:</span>
            <div className="text-sm font-black text-white mt-0.5 tabular-nums">
              {userOfferedFare} ج.م
              <span className="text-[10px] font-normal text-slate-400 mr-1">(نقدي)</span>
            </div>
            <span className="text-[9px] text-amber-400 block mt-0.5">
              - عمولة المنصة 15% ({commissionEgp} ج.م)
            </span>
          </div>

          <div className="p-2.5 bg-emerald-950/20 rounded-xl border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-300 font-bold block">صافي ربح الكابتن:</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono px-1 rounded">85%</span>
            </div>
            <div className="text-sm font-black text-emerald-400 mt-0.5 tabular-nums">
              {captainNetFare} ج.م
              <span className="text-[10px] font-normal text-emerald-300 mr-1">صافي كاش</span>
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              يستلمها الكابتن مباشرة في يده
            </span>
          </div>
        </div>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        disabled={!!activeRide}
        onClick={handleBooking}
        className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
          activeRide
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
        }`}
      >
        <Banknote className="w-4 h-4" />
        <span>
          تأكيد طلب المشوار بالسعر الثابت {userOfferedFare} ج.م (صافي الكابتن {captainNetFare} ج.م)
        </span>
      </button>
    </div>
  );
};
