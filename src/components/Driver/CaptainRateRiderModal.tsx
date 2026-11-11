import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  User,
  CheckCircle2,
  Banknote,
  ShieldCheck,
  X,
  MessageSquare,
  Award,
} from 'lucide-react';

export const CaptainRateRiderModal: React.FC = () => {
  const {
    pendingCaptainReviewRide,
    submitCaptainRatingOfRider,
    dismissPendingCaptainReview,
  } = useApp();

  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'التزام بالموعد',
    'دفع الأجرة كاش فوراً',
    'تعامل راقٍ ومحترم',
  ]);
  const [comment, setComment] = useState<string>('');

  if (!pendingCaptainReviewRide) return null;

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCaptainRatingOfRider(
      pendingCaptainReviewRide.id,
      rating,
      selectedTags,
      comment
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تقييم الكابتن للراكب</h3>
              <p className="text-xs text-slate-400">لتعزيز الأمان والموثوقية في مجتمع وصلة</p>
            </div>
          </div>
          <button
            onClick={dismissPendingCaptainReview}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trip completed cash summary */}
        <div className="p-4 bg-gradient-to-r from-emerald-950/50 to-teal-950/50 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">الأجرة النقدية المستلمة</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xl tabular-nums">
              <Banknote className="w-5 h-5" />
              <span>{pendingCaptainReviewRide.finalFareEgp} ج.م كاش</span>
            </div>
          </div>
          <div className="text-left text-xs text-slate-300">
            <span className="text-slate-400 block text-[10px]">الراكب</span>
            <span className="font-bold text-white">{pendingCaptainReviewRide.riderName}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Rating stars */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-300">
              كيف كانت تجربتك مع هذا الراكب؟
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-125 transition-transform"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs text-amber-400 font-bold tabular-nums">
              {rating === 5 && 'ممتاز جداً وخلوق'}
              {rating === 4 && 'جيد جداً'}
              {rating === 3 && 'متوسط'}
              {rating <= 2 && 'يحتاج لتحسين'}
            </span>
          </div>

          {/* Passenger Praise Tags */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              إشادات الراكب الإيجابية
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'التزام بالموعد',
                'دفع الأجرة كاش فوراً',
                'تعامل راقٍ ومحترم',
                'مكان التقاء دقيق',
                'احترام نظافة السيارة',
                'تواصل سريع وسلس',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 text-xs rounded-xl border transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              تعليق إضافي للراكب (اختياري)
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب ملاحظاتك لتعزيز موثوقية الراكب داخل مجتمع وصلة..."
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950 transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تأكيد تقييم الراكب وإنهاء المشوار</span>
          </button>
        </form>
      </div>
    </div>
  );
};
