import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  User,
  Phone,
  Mail,
  Upload,
  Camera,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface CaptainRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CaptainRegistrationModal: React.FC<CaptainRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    captainStatus,
    captainApplication,
    submitCaptainApplication,
    approveCaptainApplication,
  } = useApp();

  const [regMode, setRegMode] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [fullName, setFullName] = useState(captainApplication?.fullName || '');
  const [phone, setPhone] = useState(captainApplication?.phone || '');
  const [email, setEmail] = useState(captainApplication?.email || '');
  const [carMake, setCarMake] = useState(captainApplication?.carMake || 'تويوتا');
  const [carModel, setCarModel] = useState(captainApplication?.carModel || 'كورولا');
  const [carColor, setCarColor] = useState(captainApplication?.carColor || 'أبيض لؤلؤي');
  const [carYear, setCarYear] = useState(captainApplication?.carYear || 2022);
  const [carPlate, setCarPlate] = useState(captainApplication?.carPlate || 'س ق ج 7291');

  // Document Mock/Uploaded Data URLs
  const [avatarUrl, setAvatarUrl] = useState<string>(
    captainApplication?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80'
  );
  const [nationalIdUrl, setNationalIdUrl] = useState<string>(
    captainApplication?.nationalIdUrl ||
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80'
  );
  const [driverLicenseUrl, setDriverLicenseUrl] = useState<string>(
    captainApplication?.driverLicenseUrl ||
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80'
  );
  const [carLicenseUrl, setCarLicenseUrl] = useState<string>(
    captainApplication?.carLicenseUrl ||
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=400&q=80'
  );

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle generic file preview
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim() || (regMode === 'phone' && !phone.trim()) || (regMode === 'email' && !email.trim())) {
        setFormError('يرجى ملء الاسم ووسيلة التسجيل (الهاتف أو البريد).');
        return;
      }
      setFormError(null);
      setStep(2);
    } else if (step === 2) {
      if (!carMake.trim() || !carModel.trim() || !carColor.trim() || !carPlate.trim()) {
        setFormError('يرجى إكمال بيانات السيارة بالكامل.');
        return;
      }
      setFormError(null);
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    submitCaptainApplication({
      fullName,
      phone: phone || '01012345678',
      email: email || 'captain@wasla.app',
      avatarUrl,
      nationalIdUrl,
      driverLicenseUrl,
      carLicenseUrl,
      carMake,
      carModel,
      carColor,
      carYear: Number(carYear),
      carPlate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">تسجيل وتوثيق كابتن جديد</h3>
              <p className="text-xs text-slate-400">انضم لمنصة وصلة واكسب مع أول رحلة مجاناً 100%</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* First Trip Free Incentive Strip */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border-b border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            هدية اعتماد الكابتن: <strong>أول مشوار تقوم به مجاناً تماماً بدون أي استقطاع لعمولة التطبيق (0% عمولة)</strong>، وبعدها يمكنك شحن رصيد المحفظة للاستمرار!
          </span>
        </div>

        {/* BODY: IF PENDING REVIEW */}
        {captainStatus === 'pending' ? (
          <div className="p-8 overflow-y-auto flex flex-col items-center justify-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 animate-pulse shadow-xl shadow-amber-950">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">بياناتك قيد المراجعة والتدقيق</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                شكراً لتسجيلك يا كابتن <strong className="text-slate-200">{captainApplication?.fullName}</strong>. يقوم فريق التدقيق الآن بمطابقة بطاقة الرقم القومي ورخصة القيادة الشخصية ورخصة السيارة.
              </p>
            </div>

            {/* Uploaded Documents Quick Preview Grid */}
            <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[11px] text-slate-400">الصورة الشخصية</span>
                <span className="font-semibold text-white">تم الرفع بنجاح</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[11px] text-slate-400">بطاقة الرقم القومي</span>
                <span className="font-semibold text-white">مرفقة وموثقة</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[11px] text-slate-400">رخصة القيادة</span>
                <span className="font-semibold text-white">سارية ومرفقة</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="block text-[11px] text-slate-400">رخصة تسيير السيارة</span>
                <span className="font-semibold text-white">{captainApplication?.carPlate}</span>
              </div>
            </div>

            {/* Instant Admin Approval Simulation Action */}
            <div className="w-full p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div>
                <span className="text-xs font-bold text-white block">زر محاكاة فحص وقبول الإدارة</span>
                <span className="text-[11px] text-slate-400">
                  انقر هنا لمحاكاة وصول رسالة "تم القبول" واعتماد الكابتن فوراً لتجربة أول رحلة مجاناً
                </span>
              </div>
              <button
                type="button"
                onClick={approveCaptainApplication}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap shadow-lg shadow-emerald-950 transition-all active:scale-95"
              >
                تأكيد القبول وإرسال الرسالة &larr;
              </button>
            </div>
          </div>
        ) : captainStatus === 'approved' ? (
          /* APPROVED STATE */
          <div className="p-8 overflow-y-auto flex flex-col items-center justify-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-950">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-white">تم قبولك ككابتن رسمي معتمد!</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
                تم التحقق من هويتك ورخصك بنجاح. أصبحت سيارتك <strong className="text-slate-200">{captainApplication?.carColor} {captainApplication?.carMake} {captainApplication?.carModel} ({captainApplication?.carPlate})</strong> جاهزة لاستقبال المشاوير.
              </p>
            </div>

            <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 text-center max-w-md">
              <div className="font-bold text-sm mb-1 text-white">أول رحلة لك 100% مجانية بدون أي عمولة!</div>
              <p className="text-[11px] text-emerald-200/80">
                استلم الأجرة كاش بالكامل من الراكب. بعد إكمال أول رحلة، يمكنك شحن رصيد المحفظة عبر فودافون كاش أو إنستاباي لدفع عمولة التطبيق الرمزية.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-sm py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950 transition-all active:scale-95"
            >
              الانتقال إلى لوحة تحكم الكابتن وبدء المشاوير
            </button>
          </div>
        ) : (
          /* REGISTRATION MULTI-STEP FORM */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
            {/* Steps indicator */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div
                className={`p-2 rounded-xl border ${
                  step === 1
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                1. البيانات والحساب
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  step === 2
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                2. بيانات السيارة
              </div>
              <div
                className={`p-2 rounded-xl border ${
                  step === 3
                    ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                3. رفع الرخص والأوراق
              </div>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* STEP 1: Personal Info & Registration channel */}
            {step === 1 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Registration Method Switch: Phone vs Email */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    طريقة التسجيل المفضلة
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setRegMode('phone')}
                      className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        regMode === 'phone'
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>التسجيل برقم الهاتف</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegMode('email')}
                      className={`py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        regMode === 'email'
                          ? 'bg-teal-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>التسجيل بالبريد الإلكتروني</span>
                    </button>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    الاسم رباعي (كما في البطاقة الشخصية)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد سامي عبد الرحمن محمود"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Phone & Email inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      رقم الهاتف المحمول (للتواصل وإرسال الرمز)
                    </label>
                    <input
                      type="tel"
                      required={regMode === 'phone'}
                      placeholder="010XXXXXXXX أو 011/012/015"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      required={regMode === 'email'}
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Personal Selfie / Photo Upload */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    الصورة الشخصية للكابتن (واضحة بدون نظارة شمس)
                  </label>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal-500/60 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={avatarUrl}
                        alt="صورة الكابتن"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold border border-slate-700">
                        <Camera className="w-3.5 h-3.5" />
                        <span>التقاط أو رفع صورة شخصية</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, setAvatarUrl)}
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ستظهر هذه الصورة للركاب لزيادة الأمان والموثوقية.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Car Specs */}
            {step === 2 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      ماركة السيارة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: تويوتا، هيونداي، كيا، نيسان"
                      value={carMake}
                      onChange={(e) => setCarMake(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      موديل / طراز السيارة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: كورولا، إلنترا، سيراتو، صني"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      لون السيارة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أبيض، أسود، رمادي، كحلي"
                      value={carColor}
                      onChange={(e) => setCarColor(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      سنة الصنع
                    </label>
                    <input
                      type="number"
                      min="2008"
                      max="2026"
                      value={carYear}
                      onChange={(e) => setCarYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      رقم لوحة السيارة
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: س ق ج 7291"
                      value={carPlate}
                      onChange={(e) => setCarPlate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Documents Upload (National ID, Driving License, Car License) */}
            {step === 3 && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <p className="text-xs text-slate-400">
                  يرجى التقاط أو رفع صور واضحة للمستندات التالية لمطابقتها من قبل إدارة المنصة:
                </p>

                {/* 1. National ID Upload */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={nationalIdUrl} alt="البطاقة الشخصية" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">صورة بطاقة الرقم القومي</span>
                      <span className="text-[10px] text-slate-400">وجه البطاقة بوضوح تام</span>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير / رفع</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setNationalIdUrl)}
                    />
                  </label>
                </div>

                {/* 2. Driving License Upload */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={driverLicenseUrl} alt="رخصة القيادة" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">صورة رخصة القيادة الشخصية</span>
                      <span className="text-[10px] text-slate-400">سارية المفعول</span>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير / رفع</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setDriverLicenseUrl)}
                    />
                  </label>
                </div>

                {/* 3. Car Registration License Upload */}
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                      <img src={carLicenseUrl} alt="رخصة تسيير السيارة" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">صورة رخصة تسيير السيارة</span>
                      <span className="text-[10px] text-slate-400">وجه الرخصة ومطابقة رقم اللوحة</span>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير / رفع</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, setCarLicenseUrl)}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-950"
                >
                  <span>التالي (بيانات {step === 1 ? 'السيارة' : 'الرخص'})</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>إرسال البيانات للمراجعة والتدقيق</span>
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
