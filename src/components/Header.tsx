import { useApp } from '../context/AppContext';
import {
  Wallet,
  Car,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Star,
  ShieldAlert,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  onOpenRecharge: () => void;
  onOpenRegister: () => void;
  onOpenHistory: () => void;
  onOpenRules: () => void;
  onOpenReviews: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRecharge,
  onOpenRegister,
  onOpenHistory,
  onOpenRules,
  onOpenReviews,
}) => {
  const {
    role,
    setRole,
    captainStatus,
    captainBalanceEgp,
    isFirstRideFreeUsed,
    riderScore,
    captainScore,
    activeRide,
    openSosModal,
    authUser,
    isAuthLoading,
    signInWithGoogle,
    signOutUser,
    theme,
    toggleTheme,
  } = useApp();

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark with role-specific app badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg text-white font-black text-xl transition-all ${
            role === 'rider'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/20'
              : 'bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-teal-500/20'
          }`}>
            و
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white whitespace-nowrap leading-tight">
              وصلة Wasla
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded w-fit ${
              role === 'rider'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-teal-500/20 text-teal-300'
            }`}>
              {role === 'rider' ? '🚗 تطبيق الراكب' : '🚖 تطبيق الكابتن'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links tailored to active app */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
          {role === 'rider' ? (
            <>
              <button
                type="button"
                onClick={() => {}}
                className="text-white hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1 font-bold"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>طلب مشوار</span>
              </button>
              <button
                type="button"
                onClick={onOpenHistory}
                className="hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>سجل رحلاتي</span>
              </button>
              <button
                type="button"
                onClick={onOpenReviews}
                className="hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>التقييمات والثقة</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('driver')}
                className="text-teal-300 hover:text-teal-200 transition-colors whitespace-nowrap flex items-center gap-1.5 bg-teal-950/60 border border-teal-500/30 px-2.5 py-1 rounded-lg"
              >
                <Car className="w-3.5 h-3.5 text-teal-400" />
                <span>التبديل لتطبيق الكابتن 🚖</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {}}
                className="text-white hover:text-teal-400 transition-colors whitespace-nowrap flex items-center gap-1 font-bold"
              >
                <Car className="w-3.5 h-3.5 text-teal-400" />
                <span>غرفة القيادة والطلبات</span>
              </button>
              <button
                type="button"
                onClick={onOpenHistory}
                className="hover:text-teal-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>تحليل الأرباح D3</span>
              </button>
              <button
                type="button"
                onClick={onOpenRecharge}
                className="hover:text-teal-400 transition-colors whitespace-nowrap flex items-center gap-1.5"
              >
                <Wallet className="w-3.5 h-3.5 text-teal-400" />
                <span>شحن المحفظة</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('rider')}
                className="text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>التبديل لتطبيق الراكب 👤</span>
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Active Ride Emergency SOS Quick Trigger */}
          {activeRide && (
            <button
              type="button"
              onClick={() => openSosModal(role)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-950 transition-all active:scale-95 animate-pulse"
              title="زر طوارئ واستغاثة SOS فوري"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>طوارئ SOS</span>
            </button>
          )}

          {/* Reputation Badge Pill Button */}
          <button
            onClick={onOpenReviews}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors"
            title="تقييمك المجتمعي"
          >
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="tabular-nums">
              {role === 'rider' ? riderScore : captainScore}
            </span>
          </button>

          {/* Captain Verification Status Badge / Recharge */}
          {role === 'driver' && (
            <div className="flex items-center gap-2">
              {captainStatus === 'not_registered' ? (
                <button
                  onClick={onOpenRegister}
                  className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  توثيق الكابتن
                </button>
              ) : captainStatus === 'pending' ? (
                <button
                  onClick={onOpenRegister}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-semibold"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>الأوراق قيد المراجعة</span>
                </button>
              ) : (
                <button
                  onClick={onOpenRecharge}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-colors"
                >
                  <Wallet className="w-3.5 h-3.5 text-teal-400" />
                  <span className="tabular-nums">{captainBalanceEgp} ج.م</span>
                  {!isFirstRideFreeUsed ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                      أول رحلة مجاناً
                    </span>
                  ) : (
                    <span className="text-[10px] text-teal-300">شحن</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Global Theme Toggle (Dark vs High Contrast Light for Daytime & Outdoor Driving) */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all active:scale-95 shadow-sm theme-toggle-btn ${
              theme === 'light'
                ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title={
              theme === 'dark'
                ? 'التبديل إلى وضع ضوء النهار عالي التباين (High Contrast Light) لتحسين الرؤية تحت أشعة الشمس'
                : 'التبديل إلى الوضع الليلي الداكن (Dark Mode)'
            }
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-amber-200">وضع النهار ☀️</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-700 fill-indigo-700" />
                <span className="hidden sm:inline text-slate-900">وضع ليلي 🌙</span>
              </>
            )}
          </button>

          {/* Uber App Portal Switcher (Wasla Rider / Wasla Driver) */}
          <div className="flex items-center p-1 bg-slate-950/80 rounded-xl border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setRole('rider')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                role === 'rider'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 ring-1 ring-emerald-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="صفحة تطبيق الراكب (Wasla Rider)"
            >
              <User className="w-3.5 h-3.5 animate-subtle-pulse" />
              <span>تطبيق الراكب</span>
            </button>
            <button
              type="button"
              onClick={() => setRole('driver')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                role === 'driver'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950 ring-1 ring-teal-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="صفحة تطبيق الكابتن (Wasla Driver)"
            >
              <Car className="w-3.5 h-3.5" />
              <span>تطبيق الكابتن</span>
            </button>
          </div>

          {/* Google Firebase Auth Sign-in / Profile Pill */}
          {authUser ? (
            <div className="flex items-center gap-2 bg-slate-800/80 pl-2 pr-1.5 py-1 rounded-xl border border-slate-700/80 text-xs">
              {authUser.photoURL ? (
                <img
                  src={authUser.photoURL}
                  alt={authUser.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-emerald-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {authUser.displayName?.[0] || 'U'}
                </div>
              )}
              <span className="font-semibold text-white max-w-[90px] truncate hidden sm:inline text-[11px]">
                {authUser.displayName || authUser.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={signOutUser}
                className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                title="تسجيل الخروج من الحساب"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              disabled={isAuthLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-all active:scale-95 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>دخول Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
