import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  User,
  MapPin,
  Navigation,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  Sparkles,
  Footprints,
} from 'lucide-react';

export const EnRouteRequestNotification: React.FC = () => {
  const { enRouteRequest, acceptEnRouteRequest, declineEnRouteRequest } = useApp();

  if (!enRouteRequest) return null;

  return (
    <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-bounce-short">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-emerald-500/80 rounded-2xl p-4 shadow-2xl shadow-emerald-950/60 flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>طلب ركوب في سكتك (كرسي فاضي)!</span>
            </span>
          </div>
          <button
            onClick={declineEnRouteRequest}
            className="text-slate-400 hover:text-white text-xs"
          >
            تخطي
          </button>
        </div>

        {/* Rider profile & Extra Cash Fare */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2.5">
            <img
              src={enRouteRequest.riderAvatar}
              alt={enRouteRequest.riderName}
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/50"
            />
            <div className="text-right">
              <div className="font-bold text-xs text-white flex items-center gap-1">
                <span>{enRouteRequest.riderName}</span>
                <span className="text-amber-400 text-[10px]">★{enRouteRequest.riderRating}</span>
              </div>
              <span className="text-[10px] text-teal-300">راكب معتمد في شبكة وصلة</span>
            </div>
          </div>

          <div className="text-left bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            <span className="text-[9px] text-emerald-300 block">دخل إضافي</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">
              +{enRouteRequest.fareEgp} ج.م
            </span>
          </div>
        </div>

        {/* Route & Detour Specs */}
        <div className="text-[11px] space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 text-slate-300">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-400">نقطة الالتقاط:</span>
            <span className="font-semibold truncate">{enRouteRequest.pickup.name}</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
            <span className="text-slate-400">وجهة النزول:</span>
            <span className="font-semibold truncate">{enRouteRequest.destination.name}</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span className="flex items-center gap-1 text-teal-300">
              <Clock className="w-3 h-3" />
              <span>انحراف +{enRouteRequest.detourExtraMinutes} دقيقة فقط في طريقك</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Footprints className="w-3 h-3" />
              <span>الراكب يمشي {enRouteRequest.walkingMeters}م إليك</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={acceptEnRouteRequest}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>قبول الراكب في السكة</span>
          </button>

          <button
            type="button"
            onClick={declineEnRouteRequest}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1 border border-slate-700 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            <span>رفض ومتابعة طريقي</span>
          </button>
        </div>
      </div>
    </div>
  );
};
