import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Star,
  ShieldCheck,
  Award,
  User,
  Car,
  X,
  MessageSquare,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';

interface CommunityReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityReviewsModal: React.FC<CommunityReviewsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { communityReviews, riderScore, captainScore } = useApp();
  const [activeTab, setActiveTab] = useState<'all' | 'captains' | 'riders'>('all');

  if (!isOpen) return null;

  const filteredReviews = communityReviews.filter((rev) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'captains') return rev.targetRole === 'driver';
    return rev.targetRole === 'rider';
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">مركز التقييمات والثقة المجتمعية</h3>
              <p className="text-xs text-slate-400">تقييم متبادل بعد كل رحلة لتعزيز الأمان والاحترام</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Rating Scorecards Banner */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-emerald-950/40 border-b border-slate-800 grid grid-cols-2 gap-3">
          {/* Captains Score */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-right">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>متوسط تقييم الكباتن</span>
              <Car className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline gap-1 text-amber-400 font-black text-2xl tabular-nums">
              <span>★ {captainScore}</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              98% قيادة آمنة وسيارات نظيفة
            </span>
          </div>

          {/* Riders Score */}
          <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-right">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>متوسط تقييم الركاب</span>
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1 text-amber-400 font-black text-2xl tabular-nums">
              <span>★ {riderScore}</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <span className="text-[10px] text-teal-300 mt-1 block">
              99% التزام بالمواعيد والدفع كاش
            </span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            إجمالي الآراء: <strong className="text-white tabular-nums">{communityReviews.length}</strong>
          </span>

          <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setActiveTab('captains')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'captains'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تقييمات الكباتن
            </button>
            <button
              onClick={() => setActiveTab('riders')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'riders'
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تقييمات الركاب
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-3">
          {filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                    {rev.reviewerName.charAt(0)}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <span>{rev.reviewerName}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        قيّم {rev.targetRole === 'driver' ? 'الكابتن' : 'الراكب'} {rev.targetName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(rev.timestamp).toLocaleDateString('ar-EG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400 font-bold tabular-nums">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span>{rev.rating}.0</span>
                </div>
              </div>

              {/* Comment text */}
              <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                "{rev.comment}"
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex flex-wrap gap-1">
                  {rev.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 text-[10px] border border-slate-700/60"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <span className="text-[10px] text-slate-500 truncate max-w-[180px]">
                  {rev.tripRoute}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>التقييمات دورية ومحمية ضد التلاعب لضمان سلامة المجتمع</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
