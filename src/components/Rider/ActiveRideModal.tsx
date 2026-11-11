import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriverOffer } from '../../types';
import { LiveCaptainApproachTracker } from './LiveCaptainApproachTracker';
import {
  Car,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Share2,
  AlertTriangle,
  Star,
  CheckCircle2,
  X,
  Send,
  ShieldCheck,
  Banknote,
  Clock,
  ChevronRight,
  ShieldAlert,
  Lock,
} from 'lucide-react';

export const ActiveRideModal: React.FC = () => {
  const {
    activeRide,
    acceptDriverOffer,
    cancelRide,
    advanceActiveRide,
    submitRiderRatingOfCaptain,
    chatMessages,
    sendChatMessage,
    isRideModalMinimized,
    setIsRideModalMinimized,
    openSosModal,
  } = useApp();

  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'قيادة آمنة',
    'سيارة نظيفة ومكيفة',
    'سائق محترم وخلوق',
  ]);
  const [riderComment, setRiderComment] = useState('');
  const [showShareNotice, setShowShareNotice] = useState(false);
  const [sosTriggered, setSosTriggered] = useState(false);

  if (!activeRide) return null;

  // When minimized during an ongoing/approaching ride, render a sleek floating bottom pill
  if (
    isRideModalMinimized &&
    (activeRide.status === 'driver_assigned' ||
      activeRide.status === 'arriving' ||
      activeRide.status === 'in_progress')
  ) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-fade-in pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500 overflow-hidden shrink-0">
              <img
                src={activeRide.driver?.avatar}
                alt={activeRide.driver?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs text-white">
                  {activeRide.driver?.name}
                </span>
                <span className="text-[10px] text-amber-400 font-bold">
                  ★{activeRide.driver?.rating}
                </span>
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                {activeRide.status === 'arriving'
                  ? 'الكابتن وصل لنقطة الركوب!'
                  : activeRide.status === 'driver_assigned'
                  ? 'الكابتن في الطريق إليك'
                  : 'الرحلة جارية نحو الوجهة'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => openSosModal('rider')}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950 transition-all active:scale-95 flex items-center gap-1 animate-pulse"
              title="طوارئ SOS ومشاركة الموقع"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>طوارئ SOS</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRideModalMinimized(false)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all active:scale-95 flex items-center gap-1"
            >
              <span>تفاصيل المشوار</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFinishRating = () => {
    submitRiderRatingOfCaptain(activeRide.id, rating, selectedTags, riderComment);
  };

  const handleShareTrip = () => {
    setShowShareNotice(true);
    navigator.clipboard?.writeText(
      `أنا في مشوار عبر وصلة من ${activeRide.pickup.name} إلى ${activeRide.destination.name} مع الكابتن ${activeRide.driver?.name || 'وصلة'}.`
    );
    setTimeout(() => setShowShareNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">
              {activeRide.status === 'searching' && 'جاري توجيه أقرب كابتن إليك بالسعر الثابت...'}
              {activeRide.status === 'offers_received' && 'الكباتن المتاحون بالسعر الثابت!'}
              {activeRide.status === 'driver_assigned' && 'تم تأكيد المشوار بالسعر الثابت! الكابتن في الطريق إليك'}
              {activeRide.status === 'arriving' && 'الكابتن وصل الآن عند نقطة الالتقاء'}
              {activeRide.status === 'in_progress' && 'الرحلة جارية نحو وجهتك بالسعر الثابت'}
              {activeRide.status === 'completed' && 'وصلت بالسلامة! دفع الأجرة النقدية الثابتة'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(activeRide.status === 'driver_assigned' ||
              activeRide.status === 'arriving' ||
              activeRide.status === 'in_progress') && (
              <button
                type="button"
                onClick={() => setIsRideModalMinimized(true)}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold px-2.5 py-1 rounded-lg bg-teal-950/60 border border-teal-500/40 hover:bg-teal-900/60 transition-colors flex items-center gap-1"
                title="مشاهدة الخريطة وتتبع الكابتن مباشرة"
              >
                <span>الخريطة المباشرة 🗺️</span>
              </button>
            )}

            {(activeRide.status === 'searching' || activeRide.status === 'offers_received') && (
              <button
                onClick={cancelRide}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
              >
                إلغاء المشوار
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* SEARCHING STATE */}
          {activeRide.status === 'searching' && (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-radar" />
                <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 z-10">
                  <Car className="w-7 h-7" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-teal-300 bg-teal-500/20 border border-teal-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3 text-teal-400" />
                    سعر ثابت قطعي (ممنوع الفصال نهائياً)
                  </span>
                </div>
                <h4 className="text-base font-bold text-white">
                  الأجرة الثابتة: {activeRide.finalFareEgp} ج.م كاش
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  جاري تعيين وتوجيه أقرب كابتن متاح إليك مباشرة بالسعر الثابت المعتمد بدون أي فصال أو مساومة.
                </p>
              </div>

              <div className="w-full bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <div className="text-right truncate max-w-[200px]">
                  <span className="text-[11px] text-slate-400 block">المسار</span>
                  <span className="font-semibold truncate">
                    {activeRide.pickup.name.split('،')[0]} &larr; {activeRide.destination.name.split('،')[0]}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[11px] text-slate-400 block">المسافة</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {activeRide.distanceKm} كم (~{activeRide.estimatedMinutes} دقيقة)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* OFFERS RECEIVED (InDrive Counter Bids) */}
          {activeRide.status === 'offers_received' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">
                  عروض الكباتن المتاحة ({activeRide.offers.length})
                </span>
                <span className="text-slate-400 text-[11px]">اختر العرض والسيارة الأفضل</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {activeRide.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-500/70 transition-all flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                        <img src={offer.avatar} alt={offer.driverName} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-white">{offer.driverName}</span>
                          <span className="text-amber-400 text-xs">★{offer.rating}</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-0.5">
                          {offer.carModel} · {offer.carColor}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>يبعد {offer.distanceAwayKm} كم</span>
                          <span>·</span>
                          <span className="text-emerald-400">يصل خلال {offer.etaMinutes} دقائق</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-black text-emerald-400 tabular-nums">
                          {offer.offeredFareEgp}
                        </span>
                        <span className="text-xs text-slate-300 mr-1">ج.م</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => acceptDriverOffer(offer)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all active:scale-95"
                      >
                        قبول العرض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVE ONGOING TRIP (ASSIGNED, ARRIVING, IN PROGRESS) */}
          {(activeRide.status === 'driver_assigned' ||
            activeRide.status === 'arriving' ||
            activeRide.status === 'in_progress') &&
            activeRide.driver && (
              <div className="flex flex-col gap-4">
                {/* Driver Info Card */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-emerald-500/70 overflow-hidden flex items-center justify-center shrink-0">
                      <img
                        src={activeRide.driver.avatar}
                        alt={activeRide.driver.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white">{activeRide.driver.name}</h4>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold">
                          معتمد
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {activeRide.driver.carModel} · {activeRide.driver.carColor}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="text-amber-400 font-bold">★ {activeRide.driver.rating}</span>
                        <span>·</span>
                        <span>{activeRide.driver.totalTrips} رحلة</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-center">
                    <div className="text-[9px] text-slate-400">مصر EGYPT</div>
                    <div className="text-xs font-black text-white tracking-wider mt-0.5">
                      {activeRide.driver.carPlate}
                    </div>
                  </div>
                </div>

                {/* Real-time Captain Approach Tracking System (Updated every 5 seconds) */}
                {(activeRide.status === 'driver_assigned' || activeRide.status === 'arriving') && (
                  <LiveCaptainApproachTracker />
                )}

                {/* Agreed Fare Callout */}
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>{activeRide.isFixedFare ? 'سعر ثابت قطعي ممنوع الفصال (كاش):' : 'الأجرة المتفق عليها للدفع كاش:'}</span>
                    </div>
                    <span className="font-black text-emerald-400 text-sm tabular-nums">
                      {activeRide.finalFareEgp} ج.م كاش
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-500/20">
                    <span>عمولة المنصة 15% ({activeRide.commissionEgp} ج.م)</span>
                    <span className="text-emerald-300 font-semibold">
                      صافي ما يستلمه الكابتن في يده: {activeRide.captainNetFareEgp || (activeRide.finalFareEgp - activeRide.commissionEgp)} ج.م
                    </span>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div
                    className={`p-2 rounded-xl border ${
                      activeRide.status === 'driver_assigned'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    1. الكابتن في الطريق
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      activeRide.status === 'arriving'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    2. في نقطة الركوب
                  </div>
                  <div
                    className={`p-2 rounded-xl border ${
                      activeRide.status === 'in_progress'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    3. الرحلة جارية
                  </div>
                </div>

                {/* Actions (Call, Chat, Share, SOS) */}
                <div className="grid grid-cols-4 gap-2">
                  <a
                    href={`tel:${activeRide.driver.phone}`}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>اتصال</span>
                  </a>

                  <button
                    onClick={() => setShowChat((p) => !p)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors relative"
                  >
                    <MessageCircle className="w-4 h-4 text-teal-400" />
                    <span>دردشة</span>
                    {chatMessages.length > 0 && (
                      <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-teal-400" />
                    )}
                  </button>

                  <button
                    onClick={handleShareTrip}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>مشاركة</span>
                  </button>

                  <button
                    onClick={() => openSosModal('rider')}
                    className="p-2.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-600/70 flex flex-col items-center justify-center gap-1 text-[11px] transition-colors shadow-sm shadow-rose-950 animate-pulse"
                    title="زر طوارئ واستغاثة SOS فوري"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span className="font-bold text-rose-200">طوارئ SOS</span>
                  </button>
                </div>

                {/* In-Ride Chat */}
                {showChat && (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold text-slate-300">
                      <span>محادثة سريعة مع الكابتن</span>
                      <button onClick={() => setShowChat(false)} className="text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="max-h-36 overflow-y-auto flex flex-col gap-1.5 p-1">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`text-xs p-2 rounded-xl max-w-[85%] ${
                            msg.sender === 'rider'
                              ? 'bg-emerald-600 text-white self-start'
                              : 'bg-slate-800 text-slate-200 self-end text-right'
                          }`}
                        >
                          {msg.text}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="اكتب رسالة للكابتن..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}

                {/* Simulation Step Advance */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    الحالة: <strong className="text-white">{activeRide.status === 'driver_assigned' ? 'الكابتن يقترب' : activeRide.status === 'arriving' ? 'الكابتن وصل' : 'في الطريق'}</strong>
                  </div>
                  <button
                    onClick={advanceActiveRide}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>
                      {activeRide.status === 'driver_assigned' && 'تسريع: الكابتن وصل'}
                      {activeRide.status === 'arriving' && 'بدء التحرك نحو الوجهة'}
                      {activeRide.status === 'in_progress' && 'الوصول وإنهاء الرحلة'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          {/* COMPLETED STATE & CASH PAYMENT RECEIPT */}
          {activeRide.status === 'completed' && (
            <div className="flex flex-col items-center justify-center py-4 text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">وصلت بالسلامة إلى وجهتك!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  يرجى تسليم الأجرة النقدية للكابتن <strong className="text-slate-200">{activeRide.driver?.name}</strong>.
                </p>
              </div>

              {/* Cash Due Card */}
              <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Banknote className="w-6 h-6 text-emerald-400" />
                  <div className="text-right">
                    <span className="font-bold text-white block">الأجرة النقدية المطلوبة</span>
                    <span className="text-[11px] text-slate-400">تدفع كاش يداً بيد للكابتن</span>
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">
                  {activeRide.finalFareEgp} ج.م
                </div>
              </div>

              {/* Rating */}
              <div className="w-full flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">
                  قيّم تجربة المشوار مع الكابتن ({activeRide.driver?.name})
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Praise tags */}
              <div className="w-full">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 text-right">
                  إشادات الكابتن الإيجابية:
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {[
                    'قيادة آمنة',
                    'سيارة نظيفة ومكيفة',
                    'سائق محترم وخلوق',
                    'التزام بالموعد',
                    'طريق سلس',
                    'عدم التدخين',
                  ].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-xl border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment text area */}
              <div className="w-full text-right">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                  رأيك في الكابتن (يساعد في رفع تقييمه بالمجتمع):
                </span>
                <textarea
                  rows={2}
                  value={riderComment}
                  onChange={(e) => setRiderComment(e.target.value)}
                  placeholder="اكتب كلمة طيبة عن الكابتن وطريقة القيادة..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Confirm Completion */}
              <button
                type="button"
                onClick={handleFinishRating}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition-all active:scale-[0.98]"
              >
                تأكيد تقييم الكابتن وإنهاء المشوار
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
