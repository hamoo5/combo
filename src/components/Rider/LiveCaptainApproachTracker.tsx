import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Car,
  Navigation,
  MapPin,
  Clock,
  Compass,
  Radio,
  Maximize2,
  CheckCircle2,
  Gauge,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  Zap,
  RotateCcw
} from 'lucide-react';

interface LiveCaptainApproachTrackerProps {
  onExpandFullMap?: () => void;
}

export const LiveCaptainApproachTracker: React.FC<LiveCaptainApproachTrackerProps> = ({
  onExpandFullMap,
}) => {
  const { activeRide, advanceActiveRide, setIsRideModalMinimized } = useApp();

  // Position coordinates on 0-100 scale
  const [captainPos, setCaptainPos] = useState<{ x: number; y: number }>({ x: 35, y: 45 });
  const [approachPercent, setApproachPercent] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(2.4);
  const [etaMinutes, setEtaMinutes] = useState<number>(5);
  const [speedKmh, setSpeedKmh] = useState<number>(36);
  const [headingDeg, setHeadingDeg] = useState<number>(45);
  const [nextManeuver, setNextManeuver] = useState<string>('السير إلى الأمام في شارع التسعين');
  
  // 5-second live countdown state
  const [countdownSeconds, setCountdownSeconds] = useState<number>(5);
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  const [justUpdatedPulse, setJustUpdatedPulse] = useState<boolean>(false);
  const [updateCount, setUpdateCount] = useState<number>(0);

  const startPosRef = useRef<{ x: number; y: number }>({ x: 28, y: 38 });
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });

  // Initialize start & target from activeRide
  useEffect(() => {
    if (activeRide?.pickup) {
      targetPosRef.current = { x: activeRide.pickup.x, y: activeRide.pickup.y };
    }
    if (activeRide?.driver) {
      startPosRef.current = {
        x: activeRide.driver.x || Math.max(15, (activeRide.pickup?.x || 50) - 16),
        y: activeRide.driver.y || Math.max(20, (activeRide.pickup?.y || 50) + 12),
      };
      setCaptainPos(startPosRef.current);
    }
  }, [activeRide?.driver?.id, activeRide?.pickup?.id]);

  // Main 1-second timer that drives the 5-second GPS updates
  useEffect(() => {
    if (!activeRide || (activeRide.status !== 'driver_assigned' && activeRide.status !== 'arriving')) {
      return;
    }

    const interval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          // 5-SECOND TICK: Update captain position, distance, speed and direction
          performFiveSecondGpsUpdate();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRide?.status]);

  // Function called precisely every 5 seconds to simulate real-world cellular GPS ping
  const performFiveSecondGpsUpdate = () => {
    setUpdateCount((c) => c + 1);
    setLastUpdateTimestamp(Date.now());
    setJustUpdatedPulse(true);
    setTimeout(() => setJustUpdatedPulse(false), 1200);

    setApproachPercent((currentPercent) => {
      const nextPercent = Math.min(100, currentPercent + 15); // moves ~15% every 5s (~30s total arrival)

      const start = startPosRef.current;
      const target = targetPosRef.current;
      const ratio = nextPercent / 100;

      // Cubic ease-out calculation for smooth realistic street movement
      const ease = 1 - Math.pow(1 - ratio, 2);
      const newX = start.x + (target.x - start.x) * ease;
      const newY = start.y + (target.y - start.y) * ease;

      setCaptainPos({ x: newX, y: newY });

      // Calculate bearing angle
      const angle = Math.atan2(target.y - newY, target.x - newX) * (180 / Math.PI);
      setHeadingDeg(Math.round(angle));

      // Update remaining distance & ETA
      const remainingRatio = Math.max(0, 1 - ratio);
      const remKm = Math.round(2.4 * remainingRatio * 10) / 10;
      setDistanceKm(remKm);
      setEtaMinutes(Math.max(1, Math.ceil(remKm * 2.1)));

      // Realistic speed fluctuation (30 - 45 km/h)
      const randomSpeed = Math.floor(32 + Math.random() * 12);
      setSpeedKmh(randomSpeed);

      // Maneuvers
      if (nextPercent < 30) {
        setNextManeuver('السير في الطريق الرئيسي مباشرة');
      } else if (nextPercent < 65) {
        setNextManeuver('الانعطاف يميناً عند الميدان نحو مسارك');
      } else if (nextPercent < 90) {
        setNextManeuver('الاقتراب من موقع الركوب والبحث عنك');
      } else {
        setNextManeuver('وصل الكابتن الآن أمام نقطة التجمع!');
      }

      // If arrived at 100%, trigger arrival
      if (nextPercent >= 100 && activeRide?.status === 'driver_assigned') {
        advanceActiveRide();
      }

      return nextPercent;
    });
  };

  // Instant fast-forward for demo
  const handleFastForward = () => {
    performFiveSecondGpsUpdate();
  };

  const isArrived = activeRide?.status === 'arriving' || approachPercent >= 100;

  return (
    <div className="bg-slate-950 rounded-2xl border border-teal-500/40 p-4 shadow-xl flex flex-col gap-3 overflow-hidden transition-all">
      {/* Real-time Tracking Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>تتبع مسار الكابتن المباشر (Live GPS Tracking)</span>
            </h4>
            <span className="text-[10px] text-teal-300">
              {isArrived
                ? '📍 الكابتن وصل الآن عند نقطة الالتقاء'
                : 'الكابتن يتحرك الآن في الطريق نحو موقعك'}
            </span>
          </div>
        </div>

        {/* 5-second GPS Update Pulse Badge */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-teal-500/30 text-xs">
          <Radio className={`w-3.5 h-3.5 ${justUpdatedPulse ? 'text-emerald-400 animate-spin' : 'text-teal-400'}`} />
          <div className="text-right">
            <span className="text-[9px] text-slate-400 block leading-tight">تحديث الموقع:</span>
            <span className="font-mono font-bold text-[10px] text-emerald-400">
              {isArrived ? 'متصل ومستقر' : `كل 5 ثوانٍ (${countdownSeconds} ث)`}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Micro Radar / Approach Path SVG Map */}
      <div className="relative w-full h-44 sm:h-52 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
        {/* Background Street Grid */}
        <svg className="w-full h-full" viewBox="0 0 400 220" preserveAspectRatio="none">
          <defs>
            <pattern id="mini-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" />
            </pattern>
            <filter id="mini-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="400" height="220" fill="#0f172a" />
          <rect width="400" height="220" fill="url(#mini-grid)" />

          {/* Stylized River or Highway */}
          <path
            d="M 190 0 C 180 60, 220 140, 195 220"
            fill="none"
            stroke="#164e63"
            strokeWidth="14"
            opacity="0.6"
          />

          {/* APPROACH PATH LINE: From Captain Live Pos to Rider Pickup Target */}
          {(() => {
            const startX = (captainPos.x / 100) * 400;
            const startY = (captainPos.y / 100) * 220;
            const endX = (targetPosRef.current.x / 100) * 400;
            const endY = (targetPosRef.current.y / 100) * 220;

            const midX = (startX + endX) / 2 + 15;
            const midY = (startY + endY) / 2 - 20;

            return (
              <g>
                {/* Glowing Outer Halo */}
                <path
                  d={`M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`}
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="6"
                  opacity="0.4"
                  filter="url(#mini-glow)"
                />
                {/* Animated Dashed Route Line */}
                <path
                  d={`M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-dash-route"
                />

                {/* Target Pickup Beacon (Rider's location) */}
                <circle cx={endX} cy={endY} r="16" fill="none" stroke="#10b981" strokeWidth="2" className="animate-ping" />
                <circle cx={endX} cy={endY} r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <text x={endX} y={endY - 12} fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="Cairo">
                  موقعك (الركوب) 📍
                </text>

                {/* Captain's Live Moving Vehicle */}
                <g transform={`translate(${startX}, ${startY}) rotate(${headingDeg})`}>
                  {/* Pulse ripple behind captain */}
                  <circle cx="0" cy="0" r="14" fill="rgba(14, 165, 233, 0.25)" className="animate-pulse" />
                  {/* Car circle base */}
                  <circle cx="0" cy="0" r="10" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                  {/* Direction arrow pointer */}
                  <polygon points="0,-14 -4,-9 4,-9" fill="#38bdf8" />
                </g>

                <text x={startX} y={startY + 18} fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="Cairo">
                  الكابتن ({speedKmh} كم/س) 🚖
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Floating Top Mini Overlay inside radar: Telemetry stats */}
        <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px] space-y-0.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">المسافة للكابتن:</span>
            <span className="font-bold text-white font-mono">
              {isArrived ? '0 م' : `${distanceKm} كم`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400">الوقت المتوقع:</span>
            <span className="font-bold text-emerald-400 font-mono">
              {isArrived ? 'وصل الآن' : `~${etaMinutes} دقيقة`}
            </span>
          </div>
        </div>

        {/* Floating Bottom Left: Expand Map Button */}
        <button
          type="button"
          onClick={() => {
            setIsRideModalMinimized(true);
            if (onExpandFullMap) onExpandFullMap();
          }}
          className="absolute bottom-2 left-2 px-2.5 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-900 border border-slate-700 text-teal-300 text-[10px] font-bold flex items-center gap-1 transition-all shadow-md active:scale-95"
          title="عرض الخريطة الكاملة وتتبع الكابتن"
        >
          <Maximize2 className="w-3 h-3" />
          <span>تتبع ملء الشاشة 🗺️</span>
        </button>
      </div>

      {/* 5-Second GPS Sync Heartbeat Bar */}
      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${justUpdatedPulse ? 'bg-emerald-400 scale-125' : 'bg-teal-500'} transition-all`} />
          <span className="text-slate-300 text-[11px]">
            التحديث القادم بعد: <strong className="text-emerald-400 font-mono font-bold">{countdownSeconds} ثوانٍ</strong>
          </span>
          <span className="text-[9px] text-slate-500 hidden sm:inline">
            (إجمالي التحديثات الحية: {updateCount})
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-teal-300 font-semibold">
          <Navigation className="w-3 h-3" />
          <span className="truncate max-w-[170px] sm:max-w-[220px]">{nextManeuver}</span>
        </div>
      </div>

      {/* Quick Action: Fast-Forward Demo for testing */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>تريد تسريع وصول الكابتن للتجربة؟</span>
        <button
          type="button"
          onClick={handleFastForward}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1 transition-all"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>تحديث فوري الآن ⚡</span>
        </button>
      </div>
    </div>
  );
};
