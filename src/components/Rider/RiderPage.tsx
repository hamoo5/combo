import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LiveMap } from '../Map/LiveMap';
import { RideBookingPanel } from './RideBookingPanel';
import { LocationPoint } from '../../types';
import { POPULAR_LOCATIONS } from '../../data/mockData';
import { getTripTypeConfig } from '../Trips/TripsHistoryModal';
import {
  Car,
  MapPin,
  Navigation,
  Clock,
  ShieldCheck,
  Star,
  Share2,
  ShieldAlert,
  Banknote,
  CheckCircle2,
  Tag,
  Compass,
  RotateCcw,
} from 'lucide-react';

interface RiderPageProps {
  onOpenHistory: () => void;
  onOpenReviews: () => void;
  onOpenRules: () => void;
  onOpenRegister: () => void;
}

export const RiderPage: React.FC<RiderPageProps> = ({
  onOpenHistory,
  onOpenReviews,
  onOpenRules,
  onOpenRegister,
}) => {
  const {
    setRole,
    riderScore,
    authUser,
    pastRides,
    openSosModal,
  } = useApp();

  const [activeRiderTab, setActiveRiderTab] = useState<'book' | 'history' | 'safety' | 'offers'>('book');
  const [selectedPickup, setSelectedPickup] = useState<LocationPoint>(POPULAR_LOCATIONS[0]);
  const [selectedDestination, setSelectedDestination] = useState<LocationPoint>(POPULAR_LOCATIONS[3]);
  const [settingMode, setSettingMode] = useState<'pickup' | 'destination' | null>(null);
  const [copiedShareUrl, setCopiedShareUrl] = useState(false);

  const handleSelectMapLocation = (point: LocationPoint, type: 'pickup' | 'destination') => {
    if (type === 'pickup') {
      setSelectedPickup(point);
    } else {
      setSelectedDestination(point);
    }
    setSettingMode(null);
  };

  const handleSelectPreset = (point: LocationPoint) => {
    setSelectedDestination(point);
    setActiveRiderTab('book');
  };

  const handleRebookTrip = (ride: any) => {
    setSelectedPickup(ride.pickup);
    setSelectedDestination(ride.destination);
    setActiveRiderTab('book');
  };

  const handleShareTrip = () => {
    const text = `أنا في طريقي الآن عبر تطبيق وصلة للرحلات من ${selectedPickup.name} إلى ${selectedDestination.name}. يمكنك الاطمئنان!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShareUrl(true);
      setTimeout(() => setCopiedShareUrl(false), 4000);
    }
  };

  const riderName = authUser?.displayName || 'عزيزي الراكب';

  return (
    <div className="flex flex-col gap-4 w-full animate-fade-in">
      {/* 1. UBER RIDER PORTAL BANNER & GREETING */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Greeting & Rider Status */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-emerald-400 font-bold tracking-wider uppercase">
                  تطبيق الراكب · Wasla Rider
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                  سعر ثابت ومضمون
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white mt-0.5 flex items-center gap-2">
                <span>أهلاً بك، {riderName}</span>
                <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>{riderScore}</span>
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                مشاوير آمنة، سيارات مكيفة حديثة، تسعير عادل قطعي بدون أي فصال أو مفاجآت!
              </p>
            </div>
          </div>

          {/* Switch to Captain App + SOS Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => openSosModal('rider')}
              className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-950"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>طوارئ الراكب SOS</span>
            </button>

            {/* Seamless Switch to Driver App */}
            <button
              type="button"
              onClick={() => setRole('driver')}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-teal-950 flex items-center gap-2 group"
              title="الانتقال إلى لوحة تحكم وتطبيق الكابتن"
            >
              <Car className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              <span>التبديل لتطبيق الكابتن &larr;</span>
            </button>
          </div>
        </div>

        {/* Quick Destination Hotspots ("Where to?" like Uber) */}
        <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span>وجهات سريعة:</span>
          </span>

          {POPULAR_LOCATIONS.map((loc) => (
            <button
              key={'quick_hotspot_' + loc.id}
              onClick={() => handleSelectPreset(loc)}
              className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 flex items-center gap-1.5 font-medium ${
                selectedDestination.id === loc.id
                  ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>{loc.name.split('،')[0]}</span>
              <span className="text-[10px] text-slate-500">({loc.city})</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. RIDER TABS NAVIGATION */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveRiderTab('book')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRiderTab === 'book'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>طلب مشوار وخريطة حية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRiderTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRiderTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل رحلاتي ({pastRides.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRiderTab('safety')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRiderTab === 'safety'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>مركز الأمان وسلامة الراكب</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRiderTab('offers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeRiderTab === 'offers'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>شاتل وعروض التوفير 50%</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenReviews}
          className="text-xs text-amber-300 font-bold px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/30 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>تقييمات مجتمع وصلة</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: BOOK RIDE + LIVE MAP */}
      {activeRiderTab === 'book' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-5 flex flex-col gap-4">
            <RideBookingPanel
              onActivateMapPick={(mode) => setSettingMode(mode)}
              selectedPickup={selectedPickup}
              selectedDestination={selectedDestination}
              onSetPickup={setSelectedPickup}
              onSetDestination={setSelectedDestination}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onOpenRules}
                className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-right transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>سعر ثابت مضمون</span>
                  <Banknote className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  لا مزايدات ولا فصال، السعر المتفق عليه هو ما يدفعه الراكب نقداً للكابتن.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveRiderTab('safety')}
                className="p-3 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 rounded-xl text-right transition-colors"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>أمانك أولاً</span>
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  كباتن مفحوصين جنائياً، فحص رخصة القيادة والسيارة، وزر طوارئ SOS فوري.
                </p>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <LiveMap
              settingMode={settingMode}
              selectedPickup={selectedPickup}
              selectedDestination={selectedDestination}
              onSelectMapLocation={handleSelectMapLocation}
            />
          </div>
        </div>
      )}

      {/* TAB 2: RIDER TRIPS HISTORY */}
      {activeRiderTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>سجل رحلات الراكب السابقة</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                استعرض تفاصيل مشاويرك السابقة، الفواتير، والكباتن الذين قادوا معك
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenHistory}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 transition-colors"
            >
              عرض السجل التفصيلي الشامل &larr;
            </button>
          </div>

          {pastRides.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">لا توجد رحلات سابقة حتى الآن في حسابك.</p>
              <button
                type="button"
                onClick={() => setActiveRiderTab('book')}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                طلب مشوارك الأول الآن
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pastRides.map((ride) => {
                const cfg = getTripTypeConfig(ride);
                return (
                  <div
                    key={'rider_trip_' + ride.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl ${cfg.accentBg} flex items-center justify-center shrink-0`}>
                          {cfg.icon}
                        </div>
                        <div>
                          <span className="font-bold text-white text-xs block">{cfg.label}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(ride.createdAt).toLocaleDateString('ar-EG', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-left">
                        <span className="text-emerald-400 font-bold tabular-nums text-sm">
                          {ride.finalFareEgp} ج.م
                        </span>
                        <span className="text-[10px] text-slate-500 block">مدفوع نقداً</span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-slate-300">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-slate-400">من:</span>
                        <span className="truncate">{ride.pickup.name}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-slate-400">إلى:</span>
                        <span className="truncate">{ride.destination.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                      <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                        <span>الكابتن: <strong className="text-slate-200">{ride.driver?.name || 'كابتن معتمد'}</strong></span>
                        <span>·</span>
                        <span className="text-amber-400 font-bold">★ {ride.driver?.rating || 4.9}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRebookTrip(ride)}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>طلب مجدداً</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAFETY & TRUST */}
      {activeRiderTab === 'safety' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                <span>مركز أمان الراكب (Wasla Safety Center)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                أدوات حماية متطورة مصممة خصيصاً لراحتك وأمان رحلتك وعائلتك مثل أوبر
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950 rounded-2xl border border-rose-500/40 flex flex-col justify-between gap-3 shadow-lg">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">زر استغاثة وطوارئ SOS</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  اتصال فوري بشرطة النجدة (122) أو الإسعاف (123) ومشاركة موقعك الجغرافي اللحظي بضغطة زر واحدة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openSosModal('rider')}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                تفعيل زر الطوارئ SOS الآن
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2.5">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">مشاركة مسار المشوار مع العائلة</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  شارك رابط تتبع رحلتك مع أهلك وأصدقائك عبر واتساب ليروا خط سيرك وموعد وصولك مباشرة.
                </p>
              </div>
              <button
                type="button"
                onClick={handleShareTrip}
                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedShareUrl ? 'تم نسخ بيانات الرحلة بنجاح! ✓' : 'نسخ مسار الرحلة للمشاركة'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">فحص وتوثيق الكباتن 100%</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  لا يقبل أي كابتن إلا بعد مراجعة بطاقة الرقم القومي ورخصة القيادة ورخصة السيارة مع فحص الأمان الجنائي.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRules}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
              >
                معايير الأمان والشروط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OFFERS & SHUTTLE SAVINGS */}
      {activeRiderTab === 'offers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                <span>عروض التوفير وخدمة شاتل الموفرة (Wasla Shuttle)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                وفر حتى 50% من تكلفة المشوار اليومي بمشاركة مقاعد على نفس خط سيرك
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gradient-to-br from-teal-950/60 to-slate-950 rounded-2xl border border-teal-500/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                  خصم 50% دائم
                </span>
                <span className="text-2xl font-black text-emerald-400">وفر نصف الأجرة</span>
              </div>
              <h3 className="text-sm font-bold text-white">وصلة شاتل (Wasla Shuttle)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ركوب مشترك مع ركاب على نفس خط السير (مثل التجمع &larr; المعادي، أو أكتوبر &larr; المهندسين). نفس راحة السيارة الملاكي المكيفة بنصف السعر.
              </p>
              <button
                type="button"
                onClick={() => setActiveRiderTab('book')}
                className="mt-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-all text-center"
              >
                احجز مقعدك في شاتل الآن &larr;
              </button>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-950/40 to-slate-950 rounded-2xl border border-purple-500/40 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
                  أول مشوار للكابتن
                </span>
                <span className="text-2xl font-black text-purple-300">0% عمولة</span>
              </div>
              <h3 className="text-sm font-bold text-white">هل تمتلك سيارة وتريد زيادة دخلك؟</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                انضم ككابتن في شبكة وصلة اليوم، واستمتع بأول رحلة مجاناً 100% بدون أي عمولة للتطبيق واستلم أجرتك كاش كاملة بيدك.
              </p>
              <button
                type="button"
                onClick={onOpenRegister}
                className="mt-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all text-center"
              >
                تسجيل وتوثيق كابتن جديد &larr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
