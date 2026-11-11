import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Zap,
} from 'lucide-react';

interface CaptainVoiceCommanderProps {
  onAcceptTopRide?: () => void;
  onDeclineTopRide?: () => void;
  onFinishDrive?: () => void;
}

export const CaptainVoiceCommander: React.FC<CaptainVoiceCommanderProps> = ({
  onAcceptTopRide,
  onDeclineTopRide,
  onFinishDrive,
}) => {
  const {
    incomingDriverRides,
    activeRide,
    acceptRideAsDriver,
    declineRideAsDriver,
    completeActiveRide,
    toggleDriverOnline,
    addToast,
  } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  const [lastAction, setLastAction] = useState<{ command: string; label: string; success: boolean } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Synthesis for audio confirmations
  const speakFeedback = (text: string) => {
    if (!audioFeedbackEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-EG';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Process incoming Arabic/English voice commands
  const handleVoiceCommand = (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    setLastTranscript(rawText);

    // 1. ACCEPT COMMANDS (قبول المشوار)
    if (
      text.includes('قبول') ||
      text.includes('اقبل') ||
      text.includes('أقبل') ||
      text.includes('موافق') ||
      text.includes('يلا') ||
      text.includes('تمام') ||
      text.includes('نعم') ||
      text.includes('قبلت') ||
      text.includes('accept') ||
      text.includes('approve') ||
      text.includes('yes')
    ) {
      if (incomingDriverRides.length > 0) {
        const topRide = incomingDriverRides[0];
        if (onAcceptTopRide) {
          onAcceptTopRide();
        } else {
          acceptRideAsDriver(topRide.id);
        }
        setLastAction({
          command: rawText,
          label: `تم قبول رحلة ${topRide.riderName} بسعر ${topRide.finalFareEgp} ج.م كاش!`,
          success: true,
        });
        speakFeedback(`تم قبول الرحلة بالسعر الثابت ${topRide.finalFareEgp} جنيه نقداً. توجه للراكب.`);
        addToast(`🎙️ أمر صوتي: تم قبول رحلة ${topRide.riderName} بالسعر الثابت!`, 'success', {
          title: 'التحكم الصوتي',
        });
      } else {
        setLastAction({
          command: rawText,
          label: 'لا توجد طلبات رحلات جديدة حالياً للقبول.',
          success: false,
        });
        speakFeedback('لا توجد طلبات واردة حالياً.');
      }
      return;
    }

    // 2. DECLINE / REJECT / CANCEL COMMANDS (رفض / تخطي / إلغاء)
    if (
      text.includes('رفض') ||
      text.includes('ارفض') ||
      text.includes('إلغاء') ||
      text.includes('الغاء') ||
      text.includes('تخطي') ||
      text.includes('مش عايز') ||
      text.includes('لا') ||
      text.includes('عدي') ||
      text.includes('decline') ||
      text.includes('cancel') ||
      text.includes('reject') ||
      text.includes('skip')
    ) {
      if (incomingDriverRides.length > 0) {
        const topRide = incomingDriverRides[0];
        if (onDeclineTopRide) {
          onDeclineTopRide();
        } else {
          declineRideAsDriver(topRide.id);
        }
        setLastAction({
          command: rawText,
          label: `تم تخطي طلب ${topRide.riderName} بنجاح.`,
          success: true,
        });
        speakFeedback('تم تخطي الطلب والبحث عن طلبات أخرى.');
        addToast(`🎙️ أمر صوتي: تم تخطي طلب ${topRide.riderName}.`, 'warning', {
          title: 'التحكم الصوتي',
        });
      } else {
        setLastAction({
          command: rawText,
          label: 'لا توجد طلبات لتخطيها.',
          success: false,
        });
        speakFeedback('لا توجد طلبات لتخطيها.');
      }
      return;
    }

    // 3. FINISH / COMPLETE RIDE COMMANDS (إنهاء المشوار واستلام الكاش)
    if (
      text.includes('إنهاء') ||
      text.includes('انهاء') ||
      text.includes('وصلت') ||
      text.includes('تم المشوار') ||
      text.includes('خلصت') ||
      text.includes('finish') ||
      text.includes('done') ||
      text.includes('complete')
    ) {
      if (activeRide) {
        if (onFinishDrive) {
          onFinishDrive();
        } else {
          completeActiveRide();
        }
        setLastAction({
          command: rawText,
          label: `تم إنهاء المشوار واستلام ${activeRide.finalFareEgp} ج.م نقداً!`,
          success: true,
        });
        speakFeedback(`تم إنهاء المشوار بنجاح، استلم ${activeRide.finalFareEgp} جنيه نقداً من الراكب.`);
        addToast(`🎙️ أمر صوتي: تم إنهاء المشوار واستلام الأجرة نقداً.`, 'success', {
          title: 'التحكم الصوتي',
        });
      } else {
        setLastAction({
          command: rawText,
          label: 'لا يوجد مشوار نشط حالياً لإنهائه.',
          success: false,
        });
        speakFeedback('لا يوجد مشوار نشط حالياً.');
      }
      return;
    }

    // 4. TOGGLE AVAILABILITY (استراحة / ابدأ العمل)
    if (text.includes('استراحة') || text.includes('متصل') || text.includes('أوفلاين') || text.includes('أونلاين')) {
      toggleDriverOnline();
      setLastAction({
        command: rawText,
        label: 'تم تبديل حالة اتصال الكابتن.',
        success: true,
      });
      speakFeedback('تم تبديل حالة الاتصال بنجاح.');
      return;
    }

    // Unrecognized command
    setLastAction({
      command: rawText,
      label: `أمر غير معروف: "${rawText}" (جرب: قبول، رفض، أو إنهاء)`,
      success: false,
    });
  };

  // Start / Stop Web Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
      }
      setIsListening(false);
      return;
    }

    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      addToast('متصفحك لا يدعم التعرف الصوتي المباشر. يمكنك استخدام أزرار المحاكاة السريعة.', 'warning', {
        title: 'التحكم الصوتي',
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'ar-EG'; // Egyptian Arabic dialect default

      recognition.onstart = () => {
        setIsListening(true);
        addToast('الميكروفون نشط الآن! تحدث بأمر: "قبول" أو "رفض" أو "إنهاء المشوار" 🎙️', 'info', {
          title: 'وضع القيادة الصوتي',
        });
      };

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        handleVoiceCommand(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          addToast('يرجى السماح بالوصول للميكروفون لاستخدام ميزة التحكم الصوتي أثناء القيادة.', 'warning');
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        // Automatically restart if user hasn't explicitly disabled it
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col gap-3 relative overflow-hidden">
      {/* Background glow when listening */}
      {isListening && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none animate-pulse" />
      )}

      {/* Header with Mic Toggle & Audio feedback switch */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-lg shadow-rose-950/50 animate-pulse'
                : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>التحكم الصوتي للقيادة الآمنة (Hands-Free)</span>
                {isListening && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                )}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isListening ? 'جارٍ الاستماع 🎙️' : 'متوقف'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              قل <strong className="text-emerald-400">&quot;قبول&quot;</strong> للرحلة، أو{' '}
              <strong className="text-rose-400">&quot;رفض / تخطي&quot;</strong>، أو{' '}
              <strong className="text-teal-400">&quot;إنهاء المشوار&quot;</strong> دون لمس الشاشة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Feedback toggle */}
          <button
            type="button"
            onClick={() => setAudioFeedbackEnabled((p) => !p)}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              audioFeedbackEnabled
                ? 'bg-teal-950/40 border-teal-500/30 text-teal-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={audioFeedbackEnabled ? 'تعطيل الرد الصوتي الآلي' : 'تفعيل الرد الصوتي الآلي'}
          >
            {audioFeedbackEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Main Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 animate-pulse'
                : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>إيقاف الاستماع</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>تشغيل الميكروفون 🎙️</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Sound Wave Bar when listening */}
      {isListening && (
        <div className="flex items-center justify-center gap-1.5 py-1.5 bg-slate-900/90 rounded-xl border border-slate-800/80">
          <div className="w-1.5 h-3 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-5 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-7 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          <div className="w-1.5 h-4 bg-teal-300 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
          <div className="w-1.5 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '600ms' }} />
          <span className="text-[11px] text-teal-300 font-bold mr-2">
            الميكروفون يستمع لصوتك الآن... قل: &quot;قبول&quot; أو &quot;رفض&quot;
          </span>
        </div>
      )}

      {/* Recognized Command Transcript and Action Result */}
      {lastAction && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-fade-in ${
            lastAction.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            {lastAction.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <div className="truncate">
              <span className="font-bold block">{lastAction.label}</span>
              <span className="text-[10px] text-slate-400">
                الكلمة المسموعة: &quot;{lastAction.command}&quot;
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 shrink-0">منذ لحظات</span>
        </div>
      )}

      {/* Quick Voice Simulation Buttons (Allows testing commands with 1 click) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-900 text-xs">
        <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>محاكاة الأوامر:</span>
        </span>

        <button
          type="button"
          onClick={() => handleVoiceCommand('قبول')}
          className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition-all shrink-0 active:scale-95"
        >
          🗣️ قل &quot;قبول&quot;
        </button>

        <button
          type="button"
          onClick={() => handleVoiceCommand('رفض')}
          className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition-all shrink-0 active:scale-95"
        >
          🗣️ قل &quot;رفض / تخطي&quot;
        </button>

        <button
          type="button"
          onClick={() => handleVoiceCommand('إنهاء المشوار')}
          className="px-2.5 py-1 rounded-lg bg-teal-950/60 hover:bg-teal-900 border border-teal-500/40 text-teal-300 text-[11px] font-bold transition-all shrink-0 active:scale-95"
        >
          🗣️ قل &quot;إنهاء المشوار&quot;
        </button>

        <button
          type="button"
          onClick={() => handleVoiceCommand('استراحة')}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] transition-all shrink-0 active:scale-95"
        >
          🗣️ قل &quot;استراحة&quot;
        </button>
      </div>
    </div>
  );
};
