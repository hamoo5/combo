import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AlertTriangle,
  Phone,
  Share2,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  X,
  Copy,
  Check,
  MessageSquare,
  Volume2,
  VolumeX,
  ExternalLink,
  Car,
  User,
  Radio,
  Ambulance,
  LifeBuoy,
} from 'lucide-react';

export const EmergencySosModal: React.FC = () => {
  const {
    isSosModalOpen,
    closeSosModal,
    sosInitiatorRole,
    activeRide,
    safetyAlertSent,
    sendSafetyAlert,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const sirenIntervalRef = useRef<any>(null);

  // Default Egyptian emergency authorities
  const EMERGENCY_AUTHORITIES = [
    {
      name: 'شرطة النجدة',
      number: '122',
      badge: 'شرطة نجدة 24/7',
      color: 'bg-rose-600 hover:bg-rose-500 text-white',
    },
    {
      name: 'الإسعاف المصري',
      number: '123',
      badge: 'طوارئ طبية',
      color: 'bg-red-700 hover:bg-red-600 text-white',
    },
    {
      name: 'الحماية المدنية',
      number: '180',
      badge: 'إطفاء وإنقاذ',
      color: 'bg-amber-600 hover:bg-amber-500 text-white',
    },
    {
      name: 'إدارة المرور',
      number: '128',
      badge: 'حوادث الطرق',
      color: 'bg-blue-600 hover:bg-blue-500 text-white',
    },
  ];

  // Pre-configured emergency contacts
  const [trustedContacts] = useState([
    { name: 'الأسرة / الأهل (طوارئ)', phone: '01001234567' },
    { name: 'صديق مقرب (طوارئ)', phone: '01223456789' },
  ]);

  // Coordinates & Landmark based on active ride
  const currentArea = activeRide
    ? `${activeRide.pickup.name} بالقرب من ${activeRide.destination.name}`
    : 'محور 26 يوليو، وسط البلد، القاهرة';
  const simulatedLat = 30.0444;
  const simulatedLng = 31.2357;
  const mapsUrl = `https://www.google.com/maps?q=${simulatedLat},${simulatedLng}`;

  const whoAmI = sosInitiatorRole === 'driver' ? 'الكابتن' : 'الراكب';

  const distressMessage = `🚨 نداء طوارئ واستغاثة SOS عاجل من تطبيق وصلة!
أنا (${whoAmI}) بحاجة لمساعدة عاجلة أثناء رحلة نشطة.
📍 موقعي الحالي المباشر: ${mapsUrl}
📌 المعلم: ${currentArea}
🚗 بيانات الرحلة:
• الكابتن: ${activeRide?.driver?.name || 'كابتن معتمد'}
• السيارة: ${activeRide?.driver?.carModel || 'سيارة معتمدة'} (${activeRide?.driver?.carPlate || 'لوحة رسمية'})
• الراكب: ${activeRide?.riderName || 'راكب وصلة'}
يرجى الاطمئنان ومتابعتي فوراً أو إبلاغ السلطات!`;

  // Handle siren audio toggle using browser Web Audio API
  const startSiren = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(650, ctx.currentTime);
      osc.start();
      oscillatorRef.current = osc;

      let high = false;
      sirenIntervalRef.current = setInterval(() => {
        if (!audioCtxRef.current || !oscillatorRef.current) return;
        high = !high;
        oscillatorRef.current.frequency.setTargetAtTime(
          high ? 950 : 650,
          audioCtxRef.current.currentTime,
          0.1
        );
      }, 350);

      setIsSirenPlaying(true);
    } catch {
      // Audio autoplay may be blocked; fallback gracefully
    }
  };

  const stopSiren = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
    setIsSirenPlaying(false);
  };

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  if (!isSosModalOpen) return null;

  const handleCopyLocation = () => {
    navigator.clipboard?.writeText(distressMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(distressMessage)}`;
  const smsLink = `sms:?body=${encodeURIComponent(distressMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-500 rounded-3xl shadow-2xl shadow-rose-950/50 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Top Header - Flashing SOS Bar */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-900 via-rose-700 to-red-800 text-white flex items-center justify-between border-b border-rose-500/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shrink-0 animate-pulse">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                <h2 className="text-base font-black tracking-wide">
                  طوارئ واستغاثة SOS فوري
                </h2>
              </div>
              <p className="text-[11px] text-rose-100 font-medium">
                مشاركة الموقع المباشر مع السلطات وجهات الاتصال
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSiren();
              closeSosModal();
            }}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 text-slate-100">
          {/* Active Live Location Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-rose-500/40 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>موقعك الجغرافي الفوري الآن</span>
              </div>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-md font-semibold">
                مباشر عبر GPS
              </span>
            </div>

            <div className="text-right text-xs">
              <div className="font-bold text-white text-sm">{currentArea}</div>
              <div className="text-slate-400 font-mono text-[11px] mt-0.5 dir-ltr text-right">
                الإحداثيات: {simulatedLat}° N, {simulatedLng}° E
              </div>
            </div>

            {/* Quick Location Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={handleCopyLocation}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">تم نسخ الموقع والرسالة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-300" />
                    <span>نسخ الموقع ورسالة SOS</span>
                  </>
                )}
              </button>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-teal-300 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <ExternalLink className="w-4 h-4" />
                <span>فتح خرائط Google</span>
              </a>
            </div>
          </div>

          {/* Section 1: Egyptian Emergency Authorities Hotlines */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>الاتصال المباشر بالسلطات الرسمية</span>
              </span>
              <span className="text-[10px] text-slate-400">مكالمة فورية ومجانية</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_AUTHORITIES.map((auth) => (
                <a
                  key={auth.number}
                  href={`tel:${auth.number}`}
                  className={`p-3 rounded-2xl flex items-center justify-between transition-all shadow-md active:scale-95 ${auth.color}`}
                >
                  <div className="text-right">
                    <span className="font-bold text-sm block">{auth.name}</span>
                    <span className="text-[10px] opacity-90 block">{auth.badge}</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-black text-sm tracking-wider">
                    {auth.number}
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Section 2: Share with Family & Emergency Contacts */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-teal-400">
                <Share2 className="w-4 h-4" />
                <span>إرسال الاستغاثة السريعة للأهل والأصدقاء</span>
              </span>
              <span className="text-[10px] text-slate-400">رسالة جاهزة مع الرابط</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>إرسال عبر WhatsApp</span>
              </a>

              <a
                href={smsLink}
                className="p-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950 transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>إرسال رسالة SMS</span>
              </a>
            </div>

            {/* Trusted Contacts Mini List */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-400 text-right">
                جهات اتصال الطوارئ المسجلة:
              </span>
              <div className="flex flex-col gap-1.5">
                {trustedContacts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="font-semibold text-slate-200">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px] font-mono">{c.phone}</span>
                      <a
                        href={`tel:${c.phone}`}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[10px] border border-slate-700"
                      >
                        اتصال
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Wasla 24/7 Safety Command Center Dispatch */}
          <div className="p-3.5 bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <LifeBuoy className="w-4 h-4 text-emerald-400" />
                <span>غرفة عمليات الأمان المركزية لتطبيق وصلة (24/7)</span>
              </div>
              <span className="text-[10px] text-emerald-400">مراقبة حية</span>
            </div>

            {safetyAlertSent ? (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500 text-emerald-300 text-xs text-right animate-fade-in flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white font-bold">
                    تم استلام إشارتك وتحديد موقعك لدى غرفة الطوارئ!
                  </strong>
                  <span className="text-[11px] text-emerald-200/90 mt-0.5 block">
                    يقوم فريق أمان وصلة الآن بمتابعة مسار سيارتك حياً والتواصل مع أقرب جهة أمنية لحمايتك.
                  </span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={sendSafetyAlert}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Radio className="w-4 h-4 animate-ping" />
                <span>إرسال إنذار فوري لغرفة أمان وصلة الآن</span>
              </button>
            )}
          </div>

          {/* Section 4: Audio Siren Warning */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              {isSirenPlaying ? (
                <Volume2 className="w-5 h-5 text-rose-500 animate-pulse" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div className="text-right">
                <span className="font-bold text-white block">صفارة إنذار عالية التردد</span>
                <span className="text-[10px] text-slate-400">
                  لجذب الانتباه وتشتيت أي تهديد محتمل
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={isSirenPlaying ? stopSiren : startSiren}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                isSirenPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSirenPlaying ? 'إيقاف الصفارة 🔇' : 'تشغيل الصفارة 🔊'}
            </button>
          </div>

          {/* Dismiss Safe Button */}
          <div className="pt-2 border-t border-slate-800 flex justify-center">
            <button
              type="button"
              onClick={() => {
                stopSiren();
                closeSosModal();
              }}
              className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              أنا في أمان الآن - إغلاق نافذة الطوارئ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
