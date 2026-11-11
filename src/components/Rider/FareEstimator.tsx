import React, { useState, useMemo } from 'react';
import { RideCategory } from '../../types';
import {
  Calculator,
  Sliders,
  Car,
  Users,
  Shield,
  Tag,
  Flame,
  Clock,
  Banknote,
  Percent,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Info,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

export interface TrafficZone {
  id: string;
  name: string;
  zoneDesc: string;
  multiplier: number;
  badgeColor: string;
  icon: string;
}

export const TRAFFIC_ZONES: TrafficZone[] = [
  {
    id: 'normal',
    name: 'سير انسيابي عادي',
    zoneDesc: 'طرق سريعة ومفتوحة بدون أي تكدس مروري',
    multiplier: 1.0,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    icon: '🟢',
  },
  {
    id: 'moderate',
    name: 'وسط البلد والتحرير والدقي',
    zoneDesc: 'كثافة مرورية معتادة وإشارات وسط العاصمة (+20%)',
    multiplier: 1.2,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    icon: '🟡',
  },
  {
    id: 'highways',
    name: 'المحاور والدائري ومحور 26 يوليو',
    zoneDesc: 'تباطؤ في الحركة مع زحام على الكباري والمطالع (+35%)',
    multiplier: 1.35,
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    icon: '🟠',
  },
  {
    id: 'peak_tagamoa',
    name: 'شارع التسعين والتجمع ومدينة نصر',
    zoneDesc: 'ساعات ذروة مسائية وصباحية شديدة وطلب مرتفع 🔥 (+50%)',
    multiplier: 1.5,
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    icon: '🔴',
  },
  {
    id: 'extreme_weather',
    name: 'ذروة قصوى أو طقس ماطر',
    zoneDesc: 'أقصى ضغط طلبات وظروف قيادة خاصة استثنائية (+75%)',
    multiplier: 1.75,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    icon: '⚡',
  },
];

interface FareEstimatorProps {
  currentDistanceKm: number;
  currentCategory: RideCategory;
  pickupName?: string;
  destinationName?: string;
  onApplyEstimatedFare: (
    estimatedFare: number,
    category: RideCategory,
    isFixedFare: boolean,
    details: {
      distanceKm: number;
      trafficZone: TrafficZone;
      commissionEgp: number;
      captainNetEgp: number;
    }
  ) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export const FareEstimator: React.FC<FareEstimatorProps> = ({
  currentDistanceKm,
  currentCategory,
  pickupName,
  destinationName,
  onApplyEstimatedFare,
  onClose,
  isInline = false,
}) => {
  // Simulator internal states
  const [distanceKm, setDistanceKm] = useState<number>(currentDistanceKm || 12);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('normal');
  const [category, setCategory] = useState<RideCategory>(currentCategory || 'comfort');
  const [isFixedFareMode, setIsFixedFareMode] = useState<boolean>(true); // Default: Guaranteed Fixed Price (ممنوع التفاوض)
  const [justApplied, setJustApplied] = useState<boolean>(false);

  const selectedZone = useMemo(
    () => TRAFFIC_ZONES.find((z) => z.id === selectedZoneId) || TRAFFIC_ZONES[0],
    [selectedZoneId]
  );

  // Fare calculation formulas based on vehicle type and Cairo market rates
  const calculation = useMemo(() => {
    let baseOpenDoor = 20; // ج.م فتح العداد
    let perKmRate = 6.5; // ج.م لكل كم

    if (category === 'shuttle') {
      baseOpenDoor = 12;
      perKmRate = 3.2; // 50-55% saving
    } else if (category === 'saver') {
      baseOpenDoor = 16;
      perKmRate = 5.2;
    } else if (category === 'women_only') {
      baseOpenDoor = 22;
      perKmRate = 6.8;
    }

    // Base fare before traffic
    const rawBase = baseOpenDoor + distanceKm * perKmRate;

    // Apply traffic congestion multiplier
    const rawWithTraffic = rawBase * selectedZone.multiplier;

    // Fixed fare buffer: add slight safety cushion (5 ج.م) for fixed fare guarantees
    const finalRiderFare = Math.max(
      category === 'shuttle' ? 20 : 25,
      Math.round(isFixedFareMode ? rawWithTraffic : rawWithTraffic)
    );

    // Platform commission is strictly 15%
    const commissionPercent = 15;
    const commissionEgp = Math.round(finalRiderFare * 0.15);
    const captainNetEgp = Math.max(0, finalRiderFare - commissionEgp);

    // Estimated travel time in minutes (factors in congestion)
    const speedKmH =
      selectedZone.multiplier >= 1.5
        ? 20 // very congested
        : selectedZone.multiplier >= 1.2
        ? 30
        : 45; // smooth
    const travelTimeMinutes = Math.round((distanceKm / speedKmH) * 60 + 4);

    // Estimated traditional taxi / other apps fare
    const traditionalTaxiFare = Math.round(finalRiderFare * 1.35 + 10);
    const savingsEgp = Math.max(15, traditionalTaxiFare - finalRiderFare);

    return {
      baseOpenDoor,
      perKmRate,
      finalRiderFare,
      commissionEgp,
      commissionPercent,
      captainNetEgp,
      travelTimeMinutes,
      traditionalTaxiFare,
      savingsEgp,
    };
  }, [category, distanceKm, selectedZone, isFixedFareMode]);

  const handleApply = () => {
    onApplyEstimatedFare(
      calculation.finalRiderFare,
      category,
      isFixedFareMode,
      {
        distanceKm,
        trafficZone: selectedZone,
        commissionEgp: calculation.commissionEgp,
        captainNetEgp: calculation.captainNetEgp,
      }
    );
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
      if (onClose) onClose();
    }, 900);
  };

  const handleResetToCurrentRoute = () => {
    setDistanceKm(currentDistanceKm || 12);
    setCategory(currentCategory || 'comfort');
    setSelectedZoneId('normal');
    setIsFixedFareMode(true);
  };

  return (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-2xl transition-all ${
        isInline ? 'p-4 sm:p-5' : 'p-5 sm:p-6 max-w-2xl w-full mx-auto'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center shrink-0 shadow-inner">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                محاكي الأجرة وحساب العمولة
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                تسعير شفاف 100%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              احسب تكلفة مشوارك بناءً على المسافة والزحام، وحدد سعراً ثابتاً ممنوع الفصال مع عرض صافي الكابتن
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetToCurrentRoute}
            title="استعادة مسافة المشوار الحالي"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">إعادة ضبط</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="py-4 space-y-5">
        {/* Route context indicator if provided */}
        {(pickupName || destinationName) && (
          <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 truncate">
                المسار المختار: <strong className="text-white">{pickupName || 'نقطة الانطلاق'}</strong> &larr; <strong className="text-white">{destinationName || 'وجهة الوصول'}</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 shrink-0">
              مسافة فعلية: {currentDistanceKm} كم
            </span>
          </div>
        )}

        {/* 1. DISTANCE SIMULATOR SLIDER */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>المسافة التقديرية للمشوار:</span>
            </label>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-xl font-black text-teal-400">{distanceKm}</span>
              <span className="text-slate-400 text-xs">كم</span>
            </div>
          </div>

          {/* Slider input */}
          <div className="space-y-1">
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={distanceKm}
              onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 كم</span>
              <span>15 كم</span>
              <span>30 كم</span>
              <span>50 كم</span>
            </div>
          </div>

          {/* Quick distance preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-slate-400">نماذج سريعة:</span>
            {[
              { label: 'وسط البلد (4 كم)', km: 4 },
              { label: 'المعادي - التحرير (12 كم)', km: 12 },
              { label: 'مدينة نصر - التجمع (22 كم)', km: 22 },
              { label: 'أكتوبر - التجمع (38 كم)', km: 38 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDistanceKm(preset.km)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all ${
                  distanceKm === preset.km
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. CONGESTION & TRAFFIC ZONES SELECTOR */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>المناطق المزدحمة ومعدل الذروة (Cairo Traffic Multiplier):</span>
            </span>
            <span className="text-[11px] font-bold text-amber-400 font-mono">
              معامل: {selectedZone.multiplier}x
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TRAFFIC_ZONES.map((zone) => {
              const isSelected = zone.id === selectedZoneId;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-amber-950/20 border-amber-500 text-white shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/40'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-base select-none shrink-0 mt-0.5">{zone.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate">{zone.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${zone.badgeColor}`}>
                        {zone.multiplier}x
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{zone.zoneDesc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. RIDE CATEGORY (CAR TYPE) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-200 block">
            نوع السيارة والخدمة:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: 'comfort' as RideCategory,
                name: 'ملاكي مريح',
                desc: 'سيدان خاصة مكيفة',
                icon: <Car className="w-3.5 h-3.5" />,
                badge: 'الأكثر طلباً',
                color: 'sky',
              },
              {
                id: 'shuttle' as RideCategory,
                name: 'وصلة شاتل',
                desc: 'مقعد شاغر (وفر 50%)',
                icon: <Users className="w-3.5 h-3.5" />,
                badge: 'توفير قياسي',
                color: 'emerald',
              },
              {
                id: 'saver' as RideCategory,
                name: 'اقتصادي',
                desc: 'سيارة توفير مناسب',
                icon: <Tag className="w-3.5 h-3.5" />,
                badge: 'سعر مخفض',
                color: 'teal',
              },
              {
                id: 'women_only' as RideCategory,
                name: 'مشوار سيدات',
                desc: 'كابتن سيدة معتمدة',
                icon: <Shield className="w-3.5 h-3.5" />,
                badge: 'خصوصية 100%',
                color: 'rose',
              },
            ].map((cat) => {
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-slate-800 border-teal-500 text-white ring-1 ring-teal-500/40 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      {cat.icon}
                      {cat.name}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-slate-900 border border-slate-700 text-slate-300">
                      {cat.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{cat.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. PERMANENT FIXED FARE POLICY (NO NEGOTIATION / NO BARGAINING) */}
        <div className="p-3.5 bg-slate-950 rounded-2xl border border-teal-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>ميثاق السعر الثابت المعتمد (إلغاء التفاوض والفصال نهائياً):</span>
            </span>
            <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/30">
              تسعير قطعي إلزامي
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            🔒 <strong>لا تفاوض ولا مزايدات:</strong> هذا السعر قطعي ومحسوب سلفاً بدقة بناءً على المسافة الفعلية ومعدل زحام الطريق. يلتزم به الراكب ويدفعه كاش، ويلتزم به الكابتن دون طلب أي زيادة أو مساومة.
          </p>
        </div>

        {/* 5. FINANCIAL TRANSPARENCY CARD: RIDER TOTAL & CAPTAIN NET AFTER 15% COMMISSION */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-teal-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>تفصيل الأجرة وحساب العمولة العادلة:</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              عمولة المنصة 15% فقط (الأقل في مصر)
            </span>
          </div>

          {/* Large Price Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Box 1: Rider Pays (سعر الراكب الثابت) */}
            <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-teal-500/30 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-medium">
                  {isFixedFareMode ? 'سعر ثابت للراكب (ممنوع الفصال):' : 'السعر المقترح للراكب:'}
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-black text-white tabular-nums">
                    {calculation.finalRiderFare}
                  </span>
                  <span className="text-sm font-bold text-emerald-400">ج.م كاش</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>المسافة التقديرية:</span>
                  <span className="font-mono text-slate-200">{distanceKm} كم</span>
                </div>
                <div className="flex justify-between">
                  <span>الزمن التقريبي مع الزحام:</span>
                  <span className="font-mono text-teal-300">~{calculation.travelTimeMinutes} دقيقة</span>
                </div>
              </div>
            </div>

            {/* Box 2: Captain Net Payout (صافي دخل الكابتن المستلم بعد خصم العمولة) */}
            <div className="p-3.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-300 block font-bold">
                    صافي دخل الكابتن الصافي (85%):
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    كاش فوراً
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-3xl font-black text-emerald-400 tabular-nums">
                    {calculation.captainNetEgp}
                  </span>
                  <span className="text-sm font-bold text-emerald-300">ج.م صافي</span>
                </div>
              </div>

              {/* Commission deduction breakdown */}
              <div className="mt-2.5 pt-2 border-t border-emerald-500/20 text-[10px] text-slate-300 space-y-0.5">
                <div className="flex justify-between text-amber-300 font-semibold">
                  <span>عمولة وصلة (15% فقط):</span>
                  <span className="font-mono">- {calculation.commissionEgp} ج.م</span>
                </div>
                <div className="text-[9px] text-slate-400">
                  تشمل التأمين التكافلي، الخرائط الحية والدعم 24/7
                </div>
              </div>
            </div>
          </div>

          {/* Value Comparison / Savings against other apps */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span className="text-slate-300 text-[11px]">
                متوسط التاكسي والتطبيقات الأخرى لنفس المشوار: <span className="line-through text-slate-500 font-mono">{calculation.traditionalTaxiFare} ج.م</span>
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-400 font-mono">
              توفير {calculation.savingsEgp} ج.م 🔥
            </span>
          </div>
        </div>

        {/* 6. PRIMARY ACTION: APPLY ESTIMATED FARE TO BOOKING */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleApply}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.98] ${
              justApplied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/50'
            }`}
          >
            {justApplied ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-slate-950 animate-bounce" />
                <span>تم اعتماد وتطبيق السعر ({calculation.finalRiderFare} ج.م) بنجاح!</span>
              </>
            ) : (
              <>
                <Banknote className="w-5 h-5" />
                <span>
                  اعتماد هذا السعر في طلب المشوار ({calculation.finalRiderFare} ج.م {isFixedFareMode ? 'سعر ثابت 🔒' : 'عرض سعر'})
                </span>
                <ArrowRight className="w-4 h-4 mr-1" />
              </>
            )}
          </button>

          <p className="text-[10px] text-center text-slate-400">
            بالنقر على اعتماد السعر، سيتم تحديث شاشة الحجز فوراً واستخدام هذا التسعير عند تأكيد طلبك
          </p>
        </div>
      </div>
    </div>
  );
};
