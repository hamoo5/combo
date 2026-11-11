import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShuttleSeatVisualizer } from '../Shuttle/ShuttleSeatVisualizer';
import { CaptainFinancialHealthCard } from './CaptainFinancialHealthCard';
import { CaptainPerformanceCard } from '../Trips/CaptainPerformanceCard';
import { EarningsProjectionCard } from './EarningsProjectionCard';
import { DailyNetEarningsBanner } from './DailyNetEarningsBanner';
import { CaptainVoiceCommander } from './CaptainVoiceCommander';
import { CaptainGeolocationTracker } from './CaptainGeolocationTracker';
import {
  Car,
  Power,
  Wallet,
  TrendingUp,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  Phone,
  MessageCircle,
  Award,
  Sparkles,
  AlertCircle,
  Banknote,
  Send,
  Plus,
  ShieldAlert,
  Lock,
  Flame,
} from 'lucide-react';

interface DriverConsoleProps {
  onOpenRegister: () => void;
  onOpenRecharge: () => void;
}

export const DriverConsole: React.FC<DriverConsoleProps> = ({
  onOpenRegister,
  onOpenRecharge,
}) => {
  const {
    captainStatus,
    captainApplication,
    approveCaptainApplication,
    isDriverOnline,
    toggleDriverOnline,
    isFirstRideFreeUsed,
    captainBalanceEgp,
    incomingDriverRides,
    acceptRideAsDriver,
    counterOfferAsDriver,
    declineRideAsDriver,
    activeRide,
    completeActiveRide,
    driverEarningsTodayEgp,
    completedRidesCountToday,
    chatMessages,
    sendChatMessage,
    openSosModal,
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [showDriverChat, setShowDriverChat] = useState(false);

  const isDrivingActiveRide = activeRide && activeRide.driver?.id === 'current_user_driver';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const handleFinishDrive = () => {
    if (!activeRide) return;
    completeActiveRide();
  };

  // 1. IF NOT REGISTERED YET
  if (captainStatus === 'not_registered') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30">
          <Car className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">انضم ككابتن معتمد في شبكة وصلة</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            سجل بالهاتف أو البريد، ارفع صورة البطاقة ورخصة القيادة والسيارة، واكسب دخل يومي كاش مع <strong className="text-emerald-400 font-bold">أول مشوار مجاناً بدون أي عمولة</strong>!
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 text-right space-y-2 max-w-sm mx-auto w-full">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تسجيل سريع بالهاتف أو البريد الإلكتروني</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>رفع صور البطاقة ورخصة القيادة ورخصة السيارة</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>أول رحلة 100% مجاناً بدون خصم أي عمولة للتطبيق</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>شحن رصيد العمولات بعدها عبر إنستاباي أو فودافون كاش</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenRegister}
          className="w-full max-w-sm mx-auto py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950 transition-all active:scale-95"
        >
          ابدأ تسجيل وتوثيق أوراق الكابتن الآن &larr;
        </button>
      </div>
    );
  }

  // 2. IF PENDING REVIEW
  if (captainStatus === 'pending') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/80 text-amber-400 flex items-center justify-center mx-auto animate-pulse">
          <Clock className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">بياناتك قيد المراجعة والتدقيق</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            تم استلام بيانات الكابتن <strong className="text-white">{captainApplication?.fullName}</strong> وسيارتك <strong className="text-white">{captainApplication?.carColor} {captainApplication?.carMake} {captainApplication?.carModel} ({captainApplication?.carPlate})</strong>.
          </p>
        </div>

        <div className="p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 text-right">
          <p className="font-semibold text-white">حالة الطلب: في انتظار موافقة الإدارة</p>
          <p className="text-[11px] text-amber-300/80 mt-1">
            يتم فحص بطاقة الرقم القومي ورخص القيادة والسيارة للتأكد من سلامتها. بعد الموافقة ستصلك رسالة بالقبول لتفعيل أول رحلة مجاناً فوراً!
          </p>
        </div>

        {/* Admin test approval trigger */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-right">
          <div>
            <span className="text-xs font-bold text-white block">زر مراجعة الإدارة (للتجربة)</span>
            <span className="text-[10px] text-slate-400">اعتماد الكابتن وإرسال رسالة القبول</span>
          </div>
          <button
            type="button"
            onClick={approveCaptainApplication}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            قبول الكابتن الآن
          </button>
        </div>
      </div>
    );
  }

  // 3. APPROVED CAPTAIN COCKPIT
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Daily Net Earnings Interactive Banner & Goal Tracker */}
      <DailyNetEarningsBanner
        grossEarningsToday={driverEarningsTodayEgp}
        isFirstRideFree={!isFirstRideFreeUsed}
        completedRidesCount={completedRidesCountToday}
      />

      {/* Header & Online Switch */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span>لوحة تحكم الكابتن</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">
              معتمد وموثق
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {captainApplication?.carColor} {captainApplication?.carMake} {captainApplication?.carModel} ({captainApplication?.carPlate})
          </p>
        </div>

        <button
          type="button"
          onClick={toggleDriverOnline}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all shadow-lg ${
            isDriverOnline
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isDriverOnline ? 'متصل ومتاح' : 'غير متصل (استراحة)'}</span>
        </button>
      </div>

      {/* Geolocation API -> Firestore Telemetry Sync (Every 5 seconds while available) */}
      <CaptainGeolocationTracker />

      {/* Hands-Free Voice Control for Driver (Accept/Decline/Finish via Voice Commands) */}
      <CaptainVoiceCommander
        onAcceptTopRide={() => {
          if (incomingDriverRides.length > 0) {
            acceptRideAsDriver(incomingDriverRides[0].id);
          }
        }}
        onDeclineTopRide={() => {
          if (incomingDriverRides.length > 0) {
            declineRideAsDriver(incomingDriverRides[0].id);
          }
        }}
        onFinishDrive={handleFinishDrive}
      />

      {/* First Trip Free OR Commission Recharge Strip */}
      {!isFirstRideFreeUsed ? (
        <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-300 animate-pulse">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">أول رحلة لك مجاناً 100%!</span>
              <span className="text-[11px] text-emerald-200/90">
                لن يتم خصم أي عمولة للتطبيق من هذه الرحلة، وستستلم الأجرة كاش بالكامل من الراكب.
              </span>
            </div>
          </div>
          <span className="text-xs font-black bg-emerald-500 text-slate-950 px-2 py-1 rounded-md shrink-0">
            0% عمولة
          </span>
        </div>
      ) : (
        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-teal-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">رصيد محفظة العمولات</span>
              <span className="font-bold text-white tabular-nums text-sm">
                {captainBalanceEgp} ج.م
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenRecharge}
            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>شحن رصيد (إنستاباي / كاش)</span>
          </button>
        </div>
      )}

      {/* Driver Daily Earnings Strip */}
      <div className="grid grid-cols-3 gap-2 text-right">
        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block">دخل اليوم كاش</span>
          <div className="text-emerald-400 font-black text-base tabular-nums mt-0.5">
            {driverEarningsTodayEgp} <span className="text-[10px] text-slate-400">ج.م</span>
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block">مشاوير مكتملة</span>
          <div className="text-teal-300 font-black text-base tabular-nums mt-0.5">
            {completedRidesCountToday}
          </div>
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400 block">تقييم الكابتن</span>
          <div className="text-amber-400 font-black text-base tabular-nums mt-0.5">
            ★ 4.95
          </div>
        </div>
      </div>

      {/* Captain Performance Summary KPIs (D3.js circular gauges) */}
      <CaptainPerformanceCard />

      {/* Financial Health & 14-Day Profit Margin Analysis (D3.js) */}
      <CaptainFinancialHealthCard />

      {/* 7-Day Earnings Projection Widget (D3.js Bar Chart) */}
      <EarningsProjectionCard />

      {/* Multi-Passenger Carpool & Shuttle Seats Visualizer */}
      <ShuttleSeatVisualizer />

      {/* ACTIVE DRIVING TRIP VIEW */}
      {isDrivingActiveRide && (
        <div className="bg-slate-950 border-2 border-teal-500/60 rounded-2xl p-4 flex flex-col gap-3 animate-fade-in shadow-xl shadow-teal-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                مشوار نشط حالياً مع الراكب
              </span>
            </div>
            <div className="flex items-center gap-2">
              {activeRide.isFixedFare && (
                <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                  <Lock className="w-3 h-3 text-teal-400" />
                  سعر ثابت مضمون
                </span>
              )}
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Banknote className="w-4 h-4" />
                <span>{activeRide.finalFareEgp} ج.م كاش</span>
              </div>
            </div>
          </div>

          {/* Commission and Captain Net Breakdown */}
          <div className="p-2.5 bg-slate-900 rounded-xl text-[11px] border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-300">
              <span>إجمالي المبلغ المطلوب من الراكب:</span>
              <span className="font-bold text-white tabular-nums">{activeRide.finalFareEgp} ج.م كاش</span>
            </div>
            <div className="flex items-center justify-between text-amber-300">
              <span>عمولة المنصة (15%):</span>
              {activeRide.isFirstRideFreeCommission ? (
                <span className="text-emerald-400 font-bold">0 ج.م (معفاة لأنها أول رحلة 🎉)</span>
              ) : (
                <span className="font-bold tabular-nums">- {activeRide.commissionEgp} ج.م</span>
              )}
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between font-bold text-emerald-400">
              <span className="flex items-center gap-1">
                <span>صافي دخل الكابتن الصافي:</span>
                <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded font-normal text-emerald-300">يستلم كاش</span>
              </span>
              <span className="text-sm font-black tabular-nums">
                {activeRide.captainNetFareEgp || (activeRide.finalFareEgp - (activeRide.isFirstRideFreeCommission ? 0 : activeRide.commissionEgp))} ج.م
              </span>
            </div>
          </div>

          {/* Rider summary */}
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div>
              <div className="text-sm font-bold text-white">{activeRide.riderName}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                التقييم: <span className="text-amber-400">★ {activeRide.riderRating}</span> · راكب موثوق
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`tel:${activeRide.riderPhone}`}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                title="اتصال هاتفي"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => setShowDriverChat((p) => !p)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700"
                title="محادثة الراكب"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => openSosModal('driver')}
                className="p-2 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/70 animate-pulse"
                title="طوارئ واستغاثة SOS فوري للكابتن"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Route details */}
          <div className="text-xs space-y-1.5 py-1">
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-400">نقطة الركوب:</span>
              <span className="font-semibold truncate">{activeRide.pickup.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 truncate">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span className="text-slate-400">وجهة النزول:</span>
              <span className="font-semibold truncate">{activeRide.destination.name}</span>
            </div>
          </div>

          {/* Emergency SOS Banner for Captain */}
          <button
            type="button"
            onClick={() => openSosModal('driver')}
            className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>طوارئ SOS: مشاركة موقعي مع النجدة وجهات الاتصال</span>
          </button>

          {/* Chat drawer */}
          {showDriverChat && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex flex-col gap-2">
              <div className="max-h-28 overflow-y-auto flex flex-col gap-1 text-xs">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-1.5 rounded-lg max-w-[85%] ${
                      m.sender === 'driver'
                        ? 'bg-teal-600 text-white self-start'
                        : 'bg-slate-800 text-slate-200 self-end'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <form onSubmit={handleSend} className="flex gap-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="رد على الراكب..."
                  className="flex-1 px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded text-white"
                />
                <button type="submit" className="px-2 py-1 bg-teal-600 rounded text-white text-xs">
                  إرسال
                </button>
              </form>
            </div>
          )}

          {/* Finish Ride CTA */}
          <button
            type="button"
            onClick={handleFinishDrive}
            className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>إنهاء المشوار واستلام {activeRide.finalFareEgp} ج.م كاش يداً بيد</span>
          </button>
        </div>
      )}

      {/* INCOMING RIDE REQUESTS (FIXED UPFRONT PRICING - NO BIDDING) */}
      {!isDrivingActiveRide && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>طلبات المشاوير الواردة بالسعر الثابت المعتمد (لا فصال)</span>
            </span>
            <span className="text-slate-400 tabular-nums">
              {incomingDriverRides.length} طلب متاح
            </span>
          </div>

          {!isDriverOnline ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              <Power className="w-6 h-6 mx-auto mb-2 text-slate-600" />
              <p>أنت في وضع الاستراحة حالياً.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                انقر على زر "متصل ومتاح" بالأعلى لبدء استقبال طلبات الركاب.
              </p>
            </div>
          ) : incomingDriverRides.length === 0 ? (
            <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
              <div className="w-8 h-8 rounded-full border border-teal-500/40 animate-spin mx-auto mb-2" />
              <p className="font-semibold text-slate-300">الرادار يبحث عن طلبات ركاب بالقرب منك...</p>
              <p className="text-[11px] text-slate-500 mt-1">
                تظهر الطلبات مع السعر الثابت المحدد مسبقاً ونقطة الركوب والنزول فور توفرها.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {incomingDriverRides.map((req) => (
                <div
                  key={req.id}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-sm text-white flex items-center gap-1.5">
                          <span>{req.riderName}</span>
                          <span className="text-amber-400 text-xs">★ {req.riderRating}</span>
                        </div>
                        <span className="text-[10px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-teal-400" />
                          سعر ثابت قطعي (ممنوع الفصال)
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>المسافة: {req.distanceKm} كم · ~{req.estimatedMinutes} دقيقة</span>
                        {req.trafficZoneName && (
                          <span className="text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            {req.trafficZoneName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-left bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl shrink-0">
                      <span className="text-[10px] text-emerald-300 block font-semibold">السعر الثابت</span>
                      <div className="text-base font-black text-emerald-400 tabular-nums">
                        {req.finalFareEgp} ج.م
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="text-xs space-y-1 text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                    <div className="truncate">
                      <span className="text-slate-400">من: </span>
                      {req.pickup.name}
                    </div>
                    <div className="truncate">
                      <span className="text-slate-400">إلى: </span>
                      {req.destination.name}
                    </div>
                  </div>

                  {/* Transparent Net Income for Captain */}
                  <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800 text-[11px] flex items-center justify-between">
                    <div className="text-slate-400">
                      عمولة وصلة (15%): <span className="text-amber-400 font-mono">-{req.commissionEgp} ج.م</span>
                    </div>
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <span>صافي ما تستلمه كاش:</span>
                      <span className="text-sm font-black text-emerald-300 font-mono">
                        {req.captainNetFareEgp || (req.finalFareEgp - req.commissionEgp)} ج.م
                      </span>
                    </div>
                  </div>

                  {/* Fixed Price Captain Direct Actions (No Negotiation / No Counter Bidding) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => acceptRideAsDriver(req.id)}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all active:scale-[0.98]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        قبول بالسعر الثابت {req.finalFareEgp} ج.م (صافيك {req.captainNetFareEgp || (req.finalFareEgp - req.commissionEgp)} ج.م كاش)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => declineRideAsDriver(req.id)}
                      className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 text-xs transition-colors font-medium"
                      title="تخطي الطلب"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
