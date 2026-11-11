import React from 'react';
import {
  ShieldCheck,
  Banknote,
  Car,
  Users,
  CheckCircle,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';

interface CommunityRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityRulesModal: React.FC<CommunityRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">دليل الكباتن ونظام التسعير</h3>
              <p className="text-xs text-slate-400">على غرار نموذج إن درايف (InDrive)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-xs text-slate-300">
          {/* Banner */}
          <div className="p-4 bg-gradient-to-br from-emerald-950/50 via-slate-900 to-teal-950/40 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <Sparkles className="w-4 h-4" />
              <span>نظام التسعير المسبق الثابت ومكافأة الكابتن الجديد</span>
            </div>
            <p className="leading-relaxed text-slate-300 text-[11px] mt-1">
              في وصلة، نعتمد نظام التسعير المسبق الثابت والعادل! يُحسب السعر مسبقاً بشكل قطعي بناءً على المسافة الفعلية وحالة المرور، وهو ملزم للراكب والكابتن للدفع نقداً كاش بدون أي فصال أو مفاوضات.
            </p>
          </div>

          {/* Captain Pipeline Steps */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white text-xs">شروط ومزايا انضمام الكابتن</h4>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                1
              </div>
              <div>
                <h5 className="font-bold text-white">التسجيل ورفع المستندات الرسمية</h5>
                <p className="text-slate-400 mt-0.5 text-[11px]">
                  يسجل الكابتن برقم الهاتف أو الإيميل، ويرفع صورته الشخصية، وبطاقة الرقم القومي، ولون وموديل السيارة، ورخصة القيادة الشخصية، ورخصة تسيير السيارة.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                2
              </div>
              <div>
                <h5 className="font-bold text-white">مراجعة البيانات وإرسال رسالة القبول</h5>
                <p className="text-slate-400 mt-0.5 text-[11px]">
                  تكون البيانات "قيد المراجعة والتدقيق" للتأكد من سلامة الأوراق، وتصل الكابتن رسالة بالقبول فور الاعتماد.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                3
              </div>
              <div>
                <h5 className="font-bold text-white">أول مشوار مجاناً 100% (بدون أي عمولة)</h5>
                <p className="text-slate-400 mt-0.5 text-[11px]">
                  تكريماً للكابتن، الرحلة الأولى معفاة بالكامل من عمولة التطبيق (0% عمولة) ويأخذ الكابتن الأجرة كاملة كاش من الراكب.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                4
              </div>
              <div>
                <h5 className="font-bold text-white">شحن الرصيد للعمولات (مثل إن درايف)</h5>
                <p className="text-slate-400 mt-0.5 text-[11px]">
                  بعد أول رحلة مجانية، يقوم الكابتن بشحن رصيد محفظته عبر إنستاباي أو فودافون كاش أو فوري لدفع عمولة المنصة الرمزية (10% فقط).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
