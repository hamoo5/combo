import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  User,
  CheckCircle2,
  Phone,
  Banknote,
  MapPin,
  Sparkles,
  Plus,
  LogOut,
} from 'lucide-react';

export const ShuttleSeatVisualizer: React.FC = () => {
  const {
    shuttlePassengers,
    dropOffShuttlePassenger,
    boardShuttlePassenger,
    triggerDemoEnRouteRequest,
  } = useApp();

  // 3 passenger seats
  const seat1 = shuttlePassengers.find((p) => p.seatIndex === 1 && p.status !== 'dropped_off');
  const seat2 = shuttlePassengers.find((p) => p.seatIndex === 2 && p.status !== 'dropped_off');
  const seat3 = shuttlePassengers.find((p) => p.seatIndex === 3 && p.status !== 'dropped_off');

  const occupiedCount = [seat1, seat2, seat3].filter(Boolean).length;
  const vacantCount = 3 - occupiedCount;

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col gap-3 shadow-inner">
      {/* Title & Stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-teal-400" />
          <span className="font-bold text-white">مقصورة ركاب الشاتل ومشاركة المقاعد</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">
            المقاعد: <strong className="text-emerald-400 font-bold tabular-nums">{occupiedCount} محجوز</strong> · <strong className="text-amber-400 font-bold tabular-nums">{vacantCount} فاضي</strong>
          </span>
        </div>
      </div>

      {/* Visual Car Seats Layout Grid */}
      <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-900/80 rounded-xl border border-slate-800/80">
        {/* Front Row Left: Driver */}
        <div className="p-2.5 bg-slate-800/90 rounded-xl border border-slate-700 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs">
            <Car className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">مقعد القيادة</span>
            <span className="text-xs font-bold text-white">أنت (الكابتن)</span>
          </div>
        </div>

        {/* Front Row Right: Passenger Seat 1 */}
        {seat1 ? (
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/60 flex flex-col justify-between gap-1 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <img src={seat1.avatar} alt={seat1.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                <span className="text-xs font-bold text-white truncate">{seat1.name.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold tabular-nums">+{seat1.fareEgp} ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              نزول: {seat1.destination.name.split('،')[0]}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {seat1.status === 'waiting_pickup' ? (
                <button
                  type="button"
                  onClick={() => boardShuttlePassenger(seat1.id)}
                  className="w-full py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold"
                >
                  إركاب الآن
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dropOffShuttlePassenger(seat1.id)}
                  className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                  title="إنهاء رحلة هذا الراكب ونزوله واستلام كاش"
                >
                  <LogOut className="w-3 h-3" />
                  <span>نزول الراكب واستلام {seat1.fareEgp} ج.م</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-amber-500/40 flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[11px] font-bold text-amber-300">مقعد أمامي فاضي</span>
            <span className="text-[9px] text-slate-500">متاح لراكب في السكة</span>
          </div>
        )}

        {/* Rear Row Left: Passenger Seat 3 */}
        {seat3 ? (
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/60 flex flex-col justify-between gap-1 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <img src={seat3.avatar} alt={seat3.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                <span className="text-xs font-bold text-white truncate">{seat3.name.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold tabular-nums">+{seat3.fareEgp} ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              نزول: {seat3.destination.name.split('،')[0]}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {seat3.status === 'waiting_pickup' ? (
                <button
                  type="button"
                  onClick={() => boardShuttlePassenger(seat3.id)}
                  className="w-full py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold"
                >
                  إركاب الآن
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dropOffShuttlePassenger(seat3.id)}
                  className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                  title="إنهاء رحلة هذا الراكب ونزوله واستلام كاش"
                >
                  <LogOut className="w-3 h-3" />
                  <span>نزول الراكب واستلام {seat3.fareEgp} ج.م</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-amber-500/40 flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[11px] font-bold text-amber-300">مقعد خلفي فاضي</span>
            <span className="text-[9px] text-slate-500">متاح لراكب في السكة</span>
          </div>
        )}

        {/* Rear Row Right: Passenger Seat 2 */}
        {seat2 ? (
          <div className="p-2.5 bg-emerald-950/40 rounded-xl border border-emerald-500/60 flex flex-col justify-between gap-1 text-right">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <img src={seat2.avatar} alt={seat2.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                <span className="text-xs font-bold text-white truncate">{seat2.name.split(' ')[0]}</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold tabular-nums">+{seat2.fareEgp} ج.م</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              نزول: {seat2.destination.name.split('،')[0]}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {seat2.status === 'waiting_pickup' ? (
                <button
                  type="button"
                  onClick={() => boardShuttlePassenger(seat2.id)}
                  className="w-full py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold"
                >
                  إركاب الآن
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => dropOffShuttlePassenger(seat2.id)}
                  className="w-full py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm"
                  title="إنهاء رحلة هذا الراكب ونزوله واستلام كاش"
                >
                  <LogOut className="w-3 h-3" />
                  <span>نزول الراكب واستلام {seat2.fareEgp} ج.م</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-amber-500/40 flex flex-col items-center justify-center text-center gap-1">
            <span className="text-[11px] font-bold text-amber-300">مقعد خلفي فاضي</span>
            <span className="text-[9px] text-slate-500">متاح لراكب في السكة</span>
          </div>
        )}
      </div>

      {/* Simulator helper banner */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-slate-400">
          💡 عند نزول أي راكب، يفتح مكانه تلقائياً ككرسي شاغر للركاب المتجهين لنفس وجهتك!
        </span>
        <button
          type="button"
          onClick={triggerDemoEnRouteRequest}
          className="text-[10px] text-teal-400 hover:text-teal-300 font-bold underline whitespace-nowrap mr-2"
        >
          (تجربة طلب في السكة الآن)
        </button>
      </div>
    </div>
  );
};
