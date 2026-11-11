import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CaptainEarningsChart } from './CaptainEarningsChart';
import { CaptainPerformanceCard } from './CaptainPerformanceCard';
import { EarningsProjectionCard } from '../Driver/EarningsProjectionCard';
import {
  Clock,
  Car,
  MapPin,
  Banknote,
  Star,
  CheckCircle,
  X,
  Compass,
  TrendingUp,
  ListOrdered,
  Award,
  Sparkles,
  Users,
  Flame,
  Zap,
  Tag,
  Heart,
  Percent,
} from 'lucide-react';

export interface TripTypeConfig {
  typeKey: 'standard' | 'shared' | 'rush_hour' | 'saver' | 'women_only';
  label: string;
  sublabel: string;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  accentBg: string;
  icon: React.ReactNode;
}

export const getTripTypeConfig = (ride: any): TripTypeConfig => {
  // 1. Shared / Shuttle Ride
  if (ride.category === 'shuttle' || ride.isShuttleTrip) {
    return {
      typeKey: 'shared',
      label: 'مشوار شاتل مشترك (Shared)',
      sublabel: 'مشاركة مقاعد وتقسيم الأجرة (توفير 55%)',
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30',
      badgeText: 'text-emerald-300',
      borderAccent: 'border-r-4 border-r-emerald-500',
      accentBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: <Users className="w-4 h-4" />,
    };
  }

  // 2. Rush-Hour / Surge Ride
  if (ride.isRushHour || (ride.surgeMultiplier && ride.surgeMultiplier > 1)) {
    const surge = ride.surgeMultiplier || 1.5;
    return {
      typeKey: 'rush_hour',
      label: `مشوار ساعة ذروة (Rush Hour ${surge}x)`,
      sublabel: 'تسعير ديناميكي وقت الذروة العالية 🔥',
      badgeBg: 'bg-amber-500/15 border-amber-500/40',
      badgeText: 'text-amber-300',
      borderAccent: 'border-r-4 border-r-amber-500',
      accentBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: <Flame className="w-4 h-4 text-amber-400 animate-pulse" />,
    };
  }

  // 3. Women Only Ride
  if (ride.category === 'women_only') {
    return {
      typeKey: 'women_only',
      label: 'مشوار سيدات (Women Only)',
      sublabel: 'كابتن سيدة ومرافقة آمنة 100%',
      badgeBg: 'bg-rose-500/15 border-rose-500/30',
      badgeText: 'text-rose-300',
      borderAccent: 'border-r-4 border-r-rose-500',
      accentBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
    };
  }

  // 4. Saver / Economy Ride
  if (ride.category === 'saver') {
    return {
      typeKey: 'saver',
      label: 'مشوار اقتصادي (Saver)',
      sublabel: 'أجرة مخفضة تناسب الميزانية',
      badgeBg: 'bg-indigo-500/15 border-indigo-500/30',
      badgeText: 'text-indigo-300',
      borderAccent: 'border-r-4 border-r-indigo-500',
      accentBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      icon: <Tag className="w-4 h-4 text-indigo-400" />,
    };
  }

  // 5. Standard / Comfort Ride
  return {
    typeKey: 'standard',
    label: 'مشوار ملاكي مريح (Standard Comfort)',
    sublabel: 'سيارة سيدان خاصة بدون مشاركة',
    badgeBg: 'bg-sky-500/15 border-sky-500/30',
    badgeText: 'text-sky-300',
    borderAccent: 'border-r-4 border-r-sky-500',
    accentBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    icon: <Car className="w-4 h-4 text-sky-400" />,
  };
};

interface TripsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TripsHistoryModal: React.FC<TripsHistoryModalProps> = ({ isOpen, onClose }) => {
  const { pastRides } = useApp();
  const [activeTab, setActiveTab] = useState<'performance' | 'analytics' | 'list'>('performance');
  const [filter, setFilter] = useState<'all' | 'comfort' | 'shared' | 'rush_hour' | 'saver'>('all');

  if (!isOpen) return null;

  const filteredTrips = pastRides.filter((ride) => {
    if (filter === 'all') return true;
    if (filter === 'shared') return ride.category === 'shuttle' || (ride as any).isShuttleTrip;
    if (filter === 'rush_hour') return (ride as any).isRushHour || ((ride as any).surgeMultiplier && (ride as any).surgeMultiplier > 1);
    if (filter === 'comfort') return ride.category === 'comfort' && !(ride as any).isRushHour;
    if (filter === 'saver') return ride.category === 'saver';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">سجل المشاوير وملخص أداء الكابتن</h3>
              <p className="text-xs text-slate-400">مؤشرات الأداء KPIs الدائرية (D3.js) ومخطط الأرباح وسجل الرحلات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation: Performance KPIs vs Analytics Chart vs Detailed List */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 text-xs gap-2 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => setActiveTab('performance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'performance'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>ملخص الأداء KPIs (D3)</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>مخطط الأرباح</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>سجل الرحلات ({pastRides.length})</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg shrink-0 overflow-x-auto max-w-full">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({pastRides.length})
              </button>
              <button
                onClick={() => setFilter('comfort')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  filter === 'comfort'
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-3 h-3 text-sky-400" />
                <span>ملاكي خاص</span>
              </button>
              <button
                onClick={() => setFilter('shared')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  filter === 'shared'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3 h-3 text-emerald-400" />
                <span>مشترك شاتل</span>
              </button>
              <button
                onClick={() => setFilter('rush_hour')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  filter === 'rush_hour'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-400" />
                <span>ساعات الذروة</span>
              </button>
              <button
                onClick={() => setFilter('saver')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                  filter === 'saver'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>اقتصادي</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {activeTab === 'performance' ? (
            <div className="flex flex-col gap-4">
              {/* Captain Performance Card with circular D3 gauges */}
              <CaptainPerformanceCard />

              {/* Benchmarking & Performance Guidelines */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    معايير التميز والأولوية في توزيع المشاوير
                  </span>
                  <span className="text-[10px] text-slate-400">يتم التحديث فورياً بعد كل مشوار</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[11px] text-emerald-400 font-bold">1. قبول الطلبات (&gt; 90%)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      قبول المشاوير القريبة فوراً يرفع تصنيفك ويمنحك فرصة استقبال عروض المسار المفتوح (Shuttle En-Route).
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[11px] text-cyan-400 font-bold">2. سرعة الوصول (&lt; 3 دقائق)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      الضغط على &quot;وصلت لمكان الراكب&quot; في الموعد يبدأ مؤقت الـ 3 دقائق ويحمي حقك في غرامة الانتظار.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-[11px] text-purple-400 font-bold">3. إتمام الرحلات (&gt; 98%)</span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      تجنب الإلغاء المتكرر يحافظ على نسبة العمولة المخفضة (7.5%) ومكافآت برنامج الإحالة النشط.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400">
                    هل تريد مراجعة تفاصيل أرباح الـ 7 أيام الماضية؟
                  </span>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    الانتقال لمخطط الأرباح &larr;
                  </button>
                </div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <div className="flex flex-col gap-4">
              {/* Performance Card Summary inside Analytics */}
              <CaptainPerformanceCard />

              {/* D3.js Chart Component (Past 7 Days Line Chart) */}
              <CaptainEarningsChart />

              {/* 7-Day Forward Earnings Projection (D3.js Bar Chart) */}
              <EarningsProjectionCard />

              {/* Quick Summary of recent activity below chart */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">أحدث الرحلات في السجل:</span>
                  <button
                    onClick={() => setActiveTab('list')}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    عرض القائمة بالكامل &larr;
                  </button>
                </div>
                {pastRides.length > 0 ? (
                  <div className="space-y-2">
                    {pastRides.slice(0, 3).map((r) => {
                      const rCfg = getTripTypeConfig(r);
                      return (
                        <div key={r.id} className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg ${rCfg.accentBg} flex items-center justify-center shrink-0`}>
                              {rCfg.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-white font-bold">{r.pickup.name.split('،')[0]} &larr; {r.destination.name.split('،')[0]}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${rCfg.badgeBg} ${rCfg.badgeText}`}>
                                  {rCfg.typeKey === 'rush_hour' ? 'ذروة 🔥' : rCfg.typeKey === 'shared' ? 'مشترك 👥' : rCfg.typeKey === 'women_only' ? 'سيدات 🌸' : 'ملاكي 🚗'}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">{r.distanceKm} كم</span>
                            </div>
                          </div>
                          <span className="text-emerald-400 font-bold tabular-nums">{r.finalFareEgp} ج.م</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    يمكنك تجربة إتمام رحلة جديدة لتشاهد تحديث البيانات الحية تلقائياً على المخطط البياني.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Captain Performance Card right alongside / atop the trips history list */}
              <CaptainPerformanceCard />

              {filteredTrips.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                <Compass className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-300">لا توجد رحلات سابقة مسجلة حتى الآن.</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                اطلب مشوارك الأول الآن بالسعر الثابت العادل بدون أي فصال أو مفاوضات!
              </p>
            </div>
          ) : (
            filteredTrips.map((ride) => {
              const cfg = getTripTypeConfig(ride);
              return (
                <div
                  key={ride.id}
                  className={`p-4 bg-slate-950 rounded-2xl border border-slate-800 ${cfg.borderAccent} flex flex-col gap-3 text-xs shadow-md transition-all hover:border-slate-700`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Distinct SVG Icon Container */}
                      <div
                        className={`w-10 h-10 rounded-2xl ${cfg.accentBg} flex items-center justify-center shrink-0 border shadow-inner`}
                        title={cfg.label}
                      >
                        {cfg.icon}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-xs sm:text-sm">{cfg.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cfg.badgeBg} ${cfg.badgeText}`}>
                            {cfg.sublabel}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
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

                    <div className="flex flex-col items-end shrink-0">
                      <div className="flex items-center gap-1 text-emerald-400 font-bold tabular-nums text-sm">
                        <Banknote className="w-4 h-4" />
                        <span>{ride.finalFareEgp} ج.م نقدي</span>
                      </div>
                      {(ride as any).surgeMultiplier && (ride as any).surgeMultiplier > 1 ? (
                        <span className="text-[9px] text-amber-300 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded mt-0.5">
                          🔥 تسعير ذروة مرتفع
                        </span>
                      ) : ((ride as any).category === 'shuttle' || (ride as any).isShuttleTrip) ? (
                        <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded mt-0.5">
                          👥 مقاعد مشتركة
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="space-y-1.5 text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                      <span className="font-medium">{ride.pickup.name}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 shadow-sm" />
                      <span className="font-medium">{ride.destination.name}</span>
                    </div>
                  </div>

                  {/* Driver & Mutual Rating footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      <span>الكابتن: <strong className="text-slate-300">{ride.driver?.name || 'كابتن معتمد'}</strong></span>
                      <span>·</span>
                      <span className="font-mono">{ride.distanceKm} كم</span>
                      <span>·</span>
                      <span>{ride.estimatedMinutes} دقيقة</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {ride.captainRatingGivenByRider && (
                        <div className="flex items-center gap-1 text-amber-400 font-bold" title="تقييم الراكب للكابتن">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>كابتن: {ride.captainRatingGivenByRider}★</span>
                        </div>
                      )}
                      {ride.riderRatingGivenByCaptain && (
                        <div className="flex items-center gap-1 text-teal-300 font-bold" title="تقييم الكابتن للراكب">
                          <Star className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
                          <span>راكب: {ride.riderRatingGivenByCaptain}★</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
