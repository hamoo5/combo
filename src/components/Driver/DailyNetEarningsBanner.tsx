import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Target,
  CheckCircle2,
  Sparkles,
  Zap,
  Award,
  ChevronRight,
  Flame,
  Plus,
} from 'lucide-react';

interface DailyNetEarningsBannerProps {
  grossEarningsToday: number;
  isFirstRideFree: boolean;
  completedRidesCount: number;
}

export const DailyNetEarningsBanner: React.FC<DailyNetEarningsBannerProps> = ({
  grossEarningsToday,
  isFirstRideFree,
  completedRidesCount,
}) => {
  // Configurable daily profit target (default 400 EGP)
  const [dailyTarget, setDailyTarget] = useState<number>(400);
  const [showTargetOptions, setShowTargetOptions] = useState<boolean>(false);
  const [simulatedExtra, setSimulatedExtra] = useState<number>(0);

  // Calculate Net Earnings: (if first ride is free: 100%, else 85% net after 15% commission)
  const effectiveGross = grossEarningsToday + simulatedExtra;
  const actualNetEarnings = isFirstRideFree
    ? effectiveGross
    : Math.round(effectiveGross * 0.85);

  // Animated Counter State
  const [displayedEarnings, setDisplayedEarnings] = useState<number>(actualNetEarnings);
  const [isCounterAnimating, setIsCounterAnimating] = useState<boolean>(false);
  const prevValueRef = useRef<number>(actualNetEarnings);

  // Smooth counter animation on earnings change
  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = actualNetEarnings;

    if (startValue === endValue) {
      setDisplayedEarnings(endValue);
      return;
    }

    setIsCounterAnimating(true);
    const duration = 900; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * easedProgress);

      setDisplayedEarnings(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        prevValueRef.current = endValue;
        setIsCounterAnimating(false);
      }
    };

    const animFrame = requestAnimationFrame(updateCounter);
    return () => cancelAnimationFrame(animFrame);
  }, [actualNetEarnings]);

  const isTargetAchieved = displayedEarnings >= dailyTarget;
  const progressPercent = Math.min(100, Math.round((displayedEarnings / dailyTarget) * 100));
  const remainingToTarget = Math.max(0, dailyTarget - displayedEarnings);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 shadow-xl ${
        isTargetAchieved
          ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 border-emerald-500/70 shadow-emerald-950/50'
          : 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-slate-800 shadow-slate-950'
      }`}
    >
      {/* Decorative Glow Effect when target achieved */}
      {isTargetAchieved && (
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none animate-pulse" />
      )}

      <div className="p-3.5 sm:p-4 flex flex-col gap-3 relative z-10">
        {/* Top Info Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                isTargetAchieved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md shadow-emerald-950'
                  : 'bg-slate-800 text-teal-400 border-slate-700'
              }`}
            >
              {isTargetAchieved ? (
                <Sparkles className="w-5 h-5 animate-bounce" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">
                  صافي الدخل اليومي للكابتن
                </span>
                {isTargetAchieved ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full shadow-sm">
                    <CheckCircle2 className="w-3 h-3" />
                    تم تحقيق الهدف! 🎯
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                    متبقي {remainingToTarget} ج.م للهدف
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                الربح الصافي الفعلي بعد خصم عمولة المنصة (15%) أو الإعفاء التام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSimulatedExtra((p) => p + 100)}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-600/40 px-2.5 py-1 rounded-lg transition-colors shadow-sm"
              title="محاكاة إتمام مشوار لرفع العداد والوصول للون الأخضر فوراً"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>+100 ج.م تجربة</span>
            </button>

            {/* Target Changer Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTargetOptions((p) => !p)}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
                title="تعديل هدف الربح اليومي"
              >
                <Target className="w-3.5 h-3.5 text-teal-400" />
                <span>الهدف: {dailyTarget} ج.م</span>
              </button>

            {/* Quick dropdown for choosing daily target */}
            {showTargetOptions && (
              <div className="absolute left-0 top-8 z-30 bg-slate-900 border border-slate-700 rounded-xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[130px] animate-fade-in text-xs">
                <div className="text-[10px] text-slate-400 px-2 py-1 font-bold border-b border-slate-800">
                  اختر هدفك لليوم:
                </div>
                {[300, 400, 500, 700, 1000].map((tgt) => (
                  <button
                    key={tgt}
                    type="button"
                    onClick={() => {
                      setDailyTarget(tgt);
                      setShowTargetOptions(false);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-right font-bold transition-colors ${
                      dailyTarget === tgt
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {tgt} ج.م / يوم
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Counter Display & Progress */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 border-t border-slate-800/80">
          <div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span>الأرباح الصافية المجمعة اليوم:</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {completedRidesCount} مشاوير مكتملة
              </span>
            </div>

            {/* THE INTERACTIVE ANIMATED COUNTER */}
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`font-mono text-3xl sm:text-4xl font-black tracking-tight tabular-nums transition-all duration-300 ${
                  isTargetAchieved
                    ? 'text-emerald-400 drop-shadow-[0_0_16px_rgba(16,185,129,0.55)] scale-105'
                    : 'text-slate-100'
                } ${isCounterAnimating ? 'animate-pulse' : ''}`}
              >
                {displayedEarnings}
              </span>
              <span
                className={`text-sm font-bold ${
                  isTargetAchieved ? 'text-emerald-300' : 'text-slate-400'
                }`}
              >
                ج.م صافي
              </span>

              {isTargetAchieved && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-0.5 mr-2">
                  <Flame className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400 animate-pulse" />
                  <span>هدف مكتمل بنسبة {progressPercent}%</span>
                </span>
              )}
            </div>
          </div>

          {/* Quick Metrics on the side */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">إجمالي الدخل قبل الخصم:</span>
              <span className="font-bold text-slate-200 tabular-nums">{grossEarningsToday} ج.م</span>
            </div>
            <div className="w-px h-7 bg-slate-800" />
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">نسبة الإنجاز:</span>
              <span
                className={`font-black tabular-nums ${
                  isTargetAchieved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar toward Daily Profit Target */}
        <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isTargetAchieved
                ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                : 'bg-gradient-to-r from-amber-500 to-teal-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Feedback message */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span className="flex items-center gap-1.5">
            {isTargetAchieved ? (
              <span className="text-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                أحسنت يا كابتن! لقد تجاوزت هدفك اليومي بنجاح والأرقام تضيء بالأخضر.
              </span>
            ) : (
              <span>
                كل رحلة تكملها ترفع العداد تلقائياً نحو لون الإنجاز الأخضر 🚀
              </span>
            )}
          </span>
          <span className="text-slate-400 text-[10px] tabular-nums">
            الهدف: {dailyTarget} ج.م
          </span>
        </div>
      </div>
    </div>
  );
};
