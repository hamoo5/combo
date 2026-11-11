import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriverConsole } from './DriverConsole';
import { LiveMap } from '../Map/LiveMap';
import { CaptainPerformanceCard } from '../Trips/CaptainPerformanceCard';
import { EarningsProjectionCard } from './EarningsProjectionCard';
import { CaptainFinancialHealthCard } from './CaptainFinancialHealthCard';
import { DailyNetEarningsBanner } from './DailyNetEarningsBanner';
import { POPULAR_LOCATIONS } from '../../data/mockData';
import { LocationPoint } from '../../types';
import {
  Car,
  Power,
  Wallet,
  TrendingUp,
  Clock,
  Award,
  Sparkles,
  Banknote,
  Plus,
  CheckCircle2,
  Zap,
  Mic,
  Navigation,
  Radio,
} from 'lucide-react';

interface DriverPageProps {
  onOpenRegister: () => void;
  onOpenRecharge: () => void;
  onOpenRules: () => void;
  onOpenReviews: () => void;
}

export const DriverPage: React.FC<DriverPageProps> = ({
  onOpenRegister,
  onOpenRecharge,
  onOpenReviews,
}) => {
  const {
    setRole,
    captainStatus,
    captainApplication,
    isDriverOnline,
    toggleDriverOnline,
    isFirstRideFreeUsed,
    captainBalanceEgp,
    driverEarningsTodayEgp,
    completedRidesCountToday,
    captainScore,
    incomingDriverRides,
  } = useApp();

  const [activeDriverTab, setActiveDriverTab] = useState<'cockpit' | 'earnings' | 'kpis' | 'wallet'>('cockpit');
  const [selectedPickup, setSelectedPickup] = useState<LocationPoint>(POPULAR_LOCATIONS[0]);
  const [selectedDestination, setSelectedDestination] = useState<LocationPoint>(POPULAR_LOCATIONS[3]);

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      {/* 1. UBER DRIVER COCKPIT TOP BANNER */}
      <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-emerald-950/90 border border-teal-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Status & Vehicle Info */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-lg transition-all ${
                isDriverOnline
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-emerald-950'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Car className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-teal-400 font-bold tracking-wider uppercase">
                  تطبيق الكابتن · Uber Driver Cockpit
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    captainStatus === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : captainStatus === 'pending'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {captainStatus === 'approved'
                    ? 'كابتن معتمد 100%'
                    : captainStatus === 'pending'
                    ? 'الأوراق قيد الفحص'
                    : 'تسجيل غير مكتمل'}
                </span>

                <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono font-bold">
                  ★ {captainScore}
                </span>
              </div>

              <h1 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>
                  كابتن {captainApplication?.fullName || 'وصلة المعتمد'}
                </span>
                {captainApplication && (
                  <span className="text-xs font-normal text-slate-300">
                    ({captainApplication.carColor} {captainApplication.carMake} {captainApplication.carModel} - {captainApplication.carPlate})
                  </span>
                )}
              </h1>

              <p className="text-xs text-slate-400 mt-0.5">
                استقبل طلبات الركاب بسعر ثابت مقطوع، اكسب كاش بيدك، واستمتع بنظام حوافز عادل!
              </p>
            </div>
          </div>

          {/* Iconic Uber Driver "GO" / Online Toggle Button + Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={toggleDriverOnline}
              className={`relative px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2.5 active:scale-95 ${
                isDriverOnline
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <span
                className={`w-3 h-3 rounded-full ${
                  isDriverOnline ? 'bg-white animate-ping' : 'bg-slate-500'
                }`}
              />
              <Power className="w-4 h-4" />
              <span>
                {isDriverOnline ? 'متصل - جاهز لتلقي الطلبات (ONLINE)' : 'ابدأ العمل (GO) - متوقف'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setRole('rider')}
              className="px-4 py-2.5 rounded-2xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              title="الانتقال إلى تطبيق الراكب"
            >
              <span>تطبيق الراكب &larr;</span>
            </button>
          </div>
        </div>

        {/* Live Daily Metric Ribbon */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">دخل اليوم كاش</span>
              <span className="text-emerald-400 font-black text-base tabular-nums">
                {driverEarningsTodayEgp} ج.م
              </span>
            </div>
            <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">مشاوير مكتملة اليوم</span>
              <span className="text-teal-300 font-black text-base tabular-nums">
                {completedRidesCountToday} مشاوير
              </span>
            </div>
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">رصيد محفظة العمولات</span>
              <span className="text-white font-black text-base tabular-nums">
                {captainBalanceEgp} ج.م
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenRecharge}
              className="px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-bold"
            >
              شحن
            </button>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">عرض الرحلة الأولى</span>
              <span className="text-emerald-300 font-bold text-xs">
                {!isFirstRideFreeUsed ? '0% عمولة مجاناً 🎉' : 'عمولة 15% عادية'}
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
        </div>

        {/* Smart Driving Assistance Strip: Hands-Free Voice Control & 5-Second Geolocation Firestore Updates */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 font-bold">
              <Mic className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>التحكم الصوتي متاح: قل &quot;قبول&quot; أو &quot;رفض&quot; دون لمس الشاشة</span>
            </span>

            <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" />
              <span>Geolocation API: تحديث إحداثيات GPS في Firestore كل 5 ثوانٍ 📡</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
            <Radio className="w-3 h-3 text-emerald-400 animate-ping" />
            <span>بث حي ومباشر</span>
          </div>
        </div>
      </div>

      {/* 2. DRIVER TABS NAVIGATION */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveDriverTab('cockpit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeDriverTab === 'cockpit'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>غرفة القيادة والطلبات الحية ({incomingDriverRides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDriverTab('earnings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeDriverTab === 'earnings'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>تحليل الأرباح وتوقعات الدخل (D3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDriverTab('kpis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeDriverTab === 'kpis'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>مؤشرات الأداء ورتبة الكابتن</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveDriverTab('wallet')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeDriverTab === 'wallet'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>محفظة الكابتن وتوثيق الرخص</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReviews}
          className="text-xs text-amber-300 font-bold px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/30 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>مركز تقييم الركاب والكباتن</span>
        </button>
      </div>

      {/* 3. DRIVER TAB CONTENTS */}

      {/* TAB 1: COCKPIT */}
      {activeDriverTab === 'cockpit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <DriverConsole
              onOpenRegister={onOpenRegister}
              onOpenRecharge={onOpenRecharge}
            />
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <LiveMap
              settingMode={null}
              selectedPickup={selectedPickup}
              selectedDestination={selectedDestination}
              onSelectMapLocation={(point, type) => {
                if (type === 'pickup') setSelectedPickup(point);
                else setSelectedDestination(point);
              }}
            />
          </div>
        </div>
      )}

      {/* TAB 2: EARNINGS & D3 FORECAST CHARTS */}
      {activeDriverTab === 'earnings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span>التحليل المالي وتوقعات أرباح الكابتن للأيام الـ 7 القادمة (D3.js)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                توقعات مدعومة بالذكاء التحليلي وساعات الذروة وهامش الربح الصافي بعد خصم استهلاك البنزين
              </p>
            </div>
          </div>

          <DailyNetEarningsBanner
            grossEarningsToday={driverEarningsTodayEgp}
            isFirstRideFree={!isFirstRideFreeUsed}
            completedRidesCount={completedRidesCountToday}
          />

          <EarningsProjectionCard />

          <CaptainFinancialHealthCard />
        </div>
      )}

      {/* TAB 3: CAPTAIN PERFORMANCE KPIS & BADGES */}
      {activeDriverTab === 'kpis' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-400" />
                <span>لوحة مؤشرات أداء الكابتن (KPIs) ورتبة التميز</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                رسوم بيانية دائرية بتقنية D3.js لمعدل قبول الطلبات، وقت الانتظار، ونسبة إتمام الرحلات
              </p>
            </div>
          </div>

          <CaptainPerformanceCard />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Zap className="w-4 h-4" />
                <span>أولوية التوزيع في ساعات الذروة</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                الحفاظ على معدل قبول أعلى من 90% يمنحك الأولوية التلقائية في استلام المشاوير المربحة القريبة منك.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>حماية وقت الانتظار</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                مؤقت الـ 3 دقائق التلقائي يحسب رسوم انتظار إضافية كاش لصالح الكابتن في حال تأخر الراكب عند نقطة الركوب.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Award className="w-4 h-4" />
                <span>وسام الكابتن الماسي</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                تقييمك الحالي ★ {captainScore} يضعك ضمن فئة الكباتن المميزين الأعلى ثقة في مجتمع وصلة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WALLET & VERIFICATION */}
      {activeDriverTab === 'wallet' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-400" />
                <span>محفظة عمولات الكابتن وتوثيق المستندات</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة رصيد العمولات، طرق الشحن الفوري عبر إنستاباي وفودافون كاش، ومراجعة أوراق السيارة
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenRecharge}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>شحن رصيد المحفظة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">الرصيد المتاح حالياً</span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">
                  {captainBalanceEgp} ج.م
                </span>
              </div>

              {!isFirstRideFreeUsed && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  🎉 <strong>هدية الاعتماد:</strong> أول مشوار بدون أي عمولة 0% للتطبيق وتستلم الأجرة كاش بالكامل!
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed">
                تُخصم عمولة المنصة (15%) تلقائياً من محفظتك بعد إتمام كل رحلة تستلم أجرتها كاش بالكامل من الراكب.
              </p>

              <button
                type="button"
                onClick={onOpenRecharge}
                className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all shadow-md"
              >
                شحن رصيد العمولات عبر إنستاباي / فودافون كاش &larr;
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">بيانات المركبة والتوثيق</span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {captainStatus === 'approved' ? 'موثق ومعتمد ✓' : 'قيد المراجعة'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">السيارة:</span>
                  <span className="font-bold text-white">
                    {captainApplication?.carColor} {captainApplication?.carMake} {captainApplication?.carModel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم اللوحة المعدنية:</span>
                  <span className="font-mono font-bold text-teal-300">{captainApplication?.carPlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">سنة الصنع:</span>
                  <span className="font-mono text-white">{captainApplication?.carYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الهاتف المسجل:</span>
                  <span className="font-mono text-white">{captainApplication?.phone}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenRegister}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
              >
                تحديث أوراق السيارة والرخص &larr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
