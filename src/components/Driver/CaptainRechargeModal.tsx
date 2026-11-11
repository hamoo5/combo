import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wallet,
  Smartphone,
  CreditCard,
  QrCode,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CaptainRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaptainRechargeModal: React.FC<CaptainRechargeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { captainBalanceEgp, rechargeCaptainWallet } = useApp();

  const [selectedMethod, setSelectedMethod] = useState<'vodafone' | 'instapay' | 'fawry' | 'card'>('instapay');
  const [amount, setAmount] = useState<number>(100);
  const [phoneNumber, setPhoneNumber] = useState<string>('01012345678');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    const methodName =
      selectedMethod === 'instapay'
        ? 'إنستاباي (InstaPay)'
        : selectedMethod === 'vodafone'
        ? 'فودافون كاش (Vodafone Cash)'
        : selectedMethod === 'fawry'
        ? 'فوري (Fawry)'
        : 'بطاقة دفع بنكية';

    rechargeCaptainWallet(amount, methodName);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">شحن محفظة الكابتن (عمولات المشاوير)</h3>
              <p className="text-xs text-slate-400">على غرار نظام شحن إن درايف (InDrive)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Balance Banner */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-teal-950/40 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">رصيد حسابك المتاح للعمولات</span>
            <div className="text-2xl font-black text-white tabular-nums mt-0.5">
              {captainBalanceEgp} <span className="text-sm font-bold text-teal-400">ج.م</span>
            </div>
          </div>
          <div className="text-left text-xs text-slate-400">
            <span className="block font-semibold text-slate-300">نسبة العمولة: 10% فقط</span>
            <span>(الأجرة تستلمها كاش 100% من الراكب)</span>
          </div>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">تم شحن الرصيد بنجاح!</h4>
            <p className="text-xs text-slate-400">
              تم إيداع {amount} ج.م في محفظتك. يمكنك الآن الاستمرار في استقبال مشاوير جديدة بدون توقف.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRecharge} className="p-6 flex flex-col gap-4">
            {/* Payment Methods */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                اختر وسيلة الشحن
              </label>
              <div className="grid grid-cols-2 gap-2">
                {/* InstaPay */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('instapay')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                    selectedMethod === 'instapay'
                      ? 'bg-purple-950/40 border-purple-500 text-white ring-1 ring-purple-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">إنستاباي (InstaPay)</span>
                    <span className="text-[10px] text-slate-400">شحن فوري بالـ IPA</span>
                  </div>
                </button>

                {/* Vodafone Cash */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('vodafone')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                    selectedMethod === 'vodafone'
                      ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">فودافون كاش</span>
                    <span className="text-[10px] text-slate-400">محفظة الهاتف الذكي</span>
                  </div>
                </button>

                {/* Fawry */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('fawry')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                    selectedMethod === 'fawry'
                      ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">فوري (Fawry Pay)</span>
                    <span className="text-[10px] text-slate-400">كود دفع فوري</span>
                  </div>
                </button>

                {/* Bank Card */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod('card')}
                  className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                    selectedMethod === 'card'
                      ? 'bg-blue-950/40 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block">فيزا وميزة وبنك</span>
                    <span className="text-[10px] text-slate-400">بطاقة الخصم والائتمان</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Quick Amount Options */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                حدد مبلغ الشحن (بالجنيه المصري)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors tabular-nums ${
                      amount === val
                        ? 'bg-teal-600 border-teal-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {val} ج.م
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet phone / IPA */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {selectedMethod === 'instapay'
                  ? 'معرّف إنستاباي (IPA) أو رقم الهاتف'
                  : 'رقم محفظة فودافون كاش / فوري'}
              </label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500 tabular-nums"
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950 transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <span>تأكيد شحن {amount} ج.م في رصيد الكابتن</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
