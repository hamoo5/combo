import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { LocationPoint } from '../../types';
import { MapProgressTracker } from './MapProgressTracker';
import { MapHeatmapOverlay } from './MapHeatmapOverlay';
import {
  Car,
  MapPin,
  Navigation,
  Compass,
  Plus,
  Minus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Flame,
  Zap,
  Layers,
} from 'lucide-react';

interface LiveMapProps {
  onSelectMapLocation?: (point: LocationPoint, type: 'pickup' | 'destination') => void;
  selectedPickup?: LocationPoint | null;
  selectedDestination?: LocationPoint | null;
  settingMode?: 'pickup' | 'destination' | null;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  onSelectMapLocation,
  selectedPickup,
  selectedDestination,
  settingMode,
}) => {
  const { drivers, activeRide, role, shuttlePassengers, advanceActiveRide } = useApp();
  const [zoom, setZoom] = useState<number>(1);
  const [centerOffset, setCenterOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Live simulation position for assigned driver during active ride
  const [driverSimPos, setDriverSimPos] = useState<{ x: number; y: number } | null>(null);
  const [approachProgress, setApproachProgress] = useState<number>(0);
  const [remainingDistanceKm, setRemainingDistanceKm] = useState<number>(1.8);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(4);
  const [carHeadingDeg, setCarHeadingDeg] = useState<number>(0);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [filterHighSurge, setFilterHighSurge] = useState<boolean>(false);
  const [gpsCountdown, setGpsCountdown] = useState<number>(5);
  const [gpsPulse, setGpsPulse] = useState<boolean>(false);

  // 5-second GPS tracking cycle countdown
  useEffect(() => {
    if (!activeRide || (activeRide.status !== 'driver_assigned' && activeRide.status !== 'arriving')) {
      return;
    }
    const timer = setInterval(() => {
      setGpsCountdown((prev) => {
        if (prev <= 1) {
          setGpsPulse(true);
          setTimeout(() => setGpsPulse(false), 1200);
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRide?.status]);

  // Focus and zoom smoothly on the Captain's moving vehicle
  const handleFocusCaptain = useCallback(() => {
    if (!driverSimPos) return;
    // Map container has coordinate system 0..100% width and height
    // Convert 50,50 center offset
    const offsetX = -(driverSimPos.x - 50) * 5;
    const offsetY = -(driverSimPos.y - 50) * 3.5;
    setCenterOffset({ x: offsetX, y: offsetY });
    setZoom(1.3);
  }, [driverSimPos]);

  // Fast forward arrival for instant testing & fluid demo
  const handleFastForwardArrival = useCallback(() => {
    if (!activeRide) return;
    if (activeRide.status === 'driver_assigned') {
      if (activeRide.pickup) {
        setDriverSimPos({ x: activeRide.pickup.x, y: activeRide.pickup.y });
      }
      setApproachProgress(100);
      setRemainingDistanceKm(0);
      setRemainingMinutes(0);
      advanceActiveRide(); // moves to 'arriving'
    } else if (activeRide.status === 'arriving') {
      advanceActiveRide(); // moves to 'in_progress'
    } else if (activeRide.status === 'in_progress') {
      if (activeRide.destination) {
        setDriverSimPos({ x: activeRide.destination.x, y: activeRide.destination.y });
      }
      advanceActiveRide(); // moves to 'completed'
    }
  }, [activeRide, advanceActiveRide]);

  // Live movement tracking loop
  useEffect(() => {
    if (!activeRide?.driver) {
      setDriverSimPos(null);
      setApproachProgress(0);
      return;
    }

    if (activeRide.status === 'driver_assigned') {
      const startX = activeRide.driver.x;
      const startY = activeRide.driver.y;
      const targetX = activeRide.pickup.x;
      const targetY = activeRide.pickup.y;

      // Realistic approach distance (e.g. 1.2 to 2.4 km)
      const rawDist = Math.hypot(targetX - startX, targetY - startY) * 0.15;
      const totalDistKm = Math.max(0.8, Math.round(rawDist * 10) / 10);

      // Initial rotation
      const initialAngle =
        Math.atan2(targetY - startY, targetX - startX) * (180 / Math.PI);
      setCarHeadingDeg(initialAngle);

      let currentStep = 0;
      const totalSteps = 45; // ~18 seconds total approach duration, or faster via button

      const interval = setInterval(() => {
        currentStep += 1;
        const progressRatio = Math.min(1, currentStep / totalSteps);

        // Smooth cubic ease-out movement
        const ease = 1 - Math.pow(1 - progressRatio, 2);

        const curX = startX + (targetX - startX) * ease;
        const curY = startY + (targetY - startY) * ease;

        setDriverSimPos({ x: curX, y: curY });
        setApproachProgress(progressRatio * 100);

        const remDist = Math.max(0, Math.round(totalDistKm * (1 - ease) * 10) / 10);
        setRemainingDistanceKm(remDist);

        const remMin = Math.max(0.2, Math.round(remDist * 2.2 * 10) / 10);
        setRemainingMinutes(remMin);

        // Heading angle update
        const angle = Math.atan2(targetY - curY, targetX - curX) * (180 / Math.PI);
        setCarHeadingDeg(angle);

        if (progressRatio >= 1) {
          clearInterval(interval);
          setApproachProgress(100);
          setRemainingDistanceKm(0);
          setRemainingMinutes(0);
          // Auto advance to arriving!
          advanceActiveRide();
        }
      }, 400);

      return () => clearInterval(interval);
    } else if (activeRide.status === 'arriving') {
      // Driver has reached rider's pickup point
      setDriverSimPos({ x: activeRide.pickup.x, y: activeRide.pickup.y });
      setApproachProgress(100);
      setRemainingDistanceKm(0);
      setRemainingMinutes(0);
    } else if (activeRide.status === 'in_progress') {
      // Driver moving from pickup to destination
      const startX = activeRide.pickup.x;
      const startY = activeRide.pickup.y;
      const targetX = activeRide.destination.x;
      const targetY = activeRide.destination.y;

      const rawDist = Math.hypot(targetX - startX, targetY - startY) * 0.18;
      const totalTripKm = Math.max(1.5, Math.round(rawDist * 10) / 10);

      let currentStep = 0;
      const totalSteps = 60;

      const interval = setInterval(() => {
        currentStep += 1;
        const progressRatio = Math.min(1, currentStep / totalSteps);
        const ease = 1 - Math.pow(1 - progressRatio, 2);

        const curX = startX + (targetX - startX) * ease;
        const curY = startY + (targetY - startY) * ease;

        setDriverSimPos({ x: curX, y: curY });
        setApproachProgress(progressRatio * 100);

        const remDist = Math.max(0, Math.round(totalTripKm * (1 - ease) * 10) / 10);
        setRemainingDistanceKm(remDist);
        setRemainingMinutes(Math.max(0.5, Math.round(remDist * 2.2 * 10) / 10));

        const angle = Math.atan2(targetY - curY, targetX - curX) * (180 / Math.PI);
        setCarHeadingDeg(angle);

        if (progressRatio >= 1) {
          clearInterval(interval);
          setApproachProgress(100);
          setRemainingDistanceKm(0);
          setRemainingMinutes(0);
          advanceActiveRide(); // moves to completed
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [activeRide?.status, activeRide?.driver?.id, advanceActiveRide]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!settingMode || !onSelectMapLocation || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const customPoint: LocationPoint = {
      id: 'custom_' + Date.now(),
      name: `موقع محدد على الخريطة (${Math.round(clickX)}, ${Math.round(clickY)})`,
      nameEn: `Custom Point (${Math.round(clickX)}, ${Math.round(clickY)})`,
      x: Math.round(clickX),
      y: Math.round(clickY),
      city: 'القاهرة الكبرى',
    };

    onSelectMapLocation(customPoint, settingMode);
  };

  const currentPickup = activeRide?.pickup || selectedPickup;
  const currentDestination = activeRide?.destination || selectedDestination;

  // Active driver position
  const activeDriverPos =
    activeRide?.driver && driverSimPos
      ? driverSimPos
      : activeRide?.driver
      ? { x: activeRide.driver.x, y: activeRide.driver.y }
      : null;

  return (
    <div
      ref={containerRef}
      onClick={handleMapClick}
      className={`relative w-full h-full min-h-[460px] lg:min-h-[640px] bg-slate-950 overflow-hidden select-none rounded-2xl border border-slate-800 shadow-2xl ${
        settingMode ? 'cursor-crosshair' : 'cursor-default'
      }`}
    >
      {/* Visual Live Progress Tracker Overlay Card on Map */}
      {activeRide?.driver &&
        (activeRide.status === 'driver_assigned' ||
          activeRide.status === 'arriving' ||
          activeRide.status === 'in_progress') && (
          <MapProgressTracker
            approachProgress={approachProgress}
            remainingDistanceKm={remainingDistanceKm}
            remainingMinutes={remainingMinutes}
            onFocusCaptain={handleFocusCaptain}
            onFastForwardArrival={handleFastForwardArrival}
          />
        )}

      {/* 5-Second Real-Time GPS Tracking Indicator (Top-Right on LiveMap) */}
      {activeRide?.driver &&
        (activeRide.status === 'driver_assigned' || activeRide.status === 'arriving') && (
          <div className="absolute top-3 right-3 z-30 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-teal-500/40 text-xs flex items-center gap-2 shadow-lg animate-fade-in pointer-events-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  gpsPulse ? 'bg-emerald-300' : 'bg-emerald-400'
                } opacity-75`}
              />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="text-right">
              <span className="text-[11px] font-bold text-white block">
                تتبع مسار الكابتن المباشر 🚖
              </span>
              <span className="text-[9px] text-teal-300 font-mono">
                تحديث الموقع كل 5 ثوانٍ ({gpsCountdown} ث)
              </span>
            </div>
          </div>
        )}

      {/* Background Urban Map Grid & Nile River SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none transition-transform duration-300"
        style={{
          transform: `scale(${zoom}) translate(${centerOffset.x}px, ${centerOffset.y}px)`,
        }}
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Street grid pattern */}
          <pattern id="street-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke="rgba(51, 65, 85, 0.25)"
              strokeWidth="1"
            />
            <path
              d="M 40 0 L 40 80 M 0 40 L 80 40"
              fill="none"
              stroke="rgba(30, 41, 59, 0.35)"
              strokeWidth="0.5"
            />
          </pattern>

          {/* Glow filter for active route */}
          <filter id="route-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Glow filter for Captain Approach route */}
          <filter id="approach-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Map Background with subtle grid */}
        <rect width="1000" height="700" fill="#0b1120" />
        <rect width="1000" height="700" fill="url(#street-grid)" />

        {/* Urban Zones (Districts) */}
        {/* Nile River Curve */}
        <path
          d="M 490 0 C 470 150, 520 280, 480 420 C 440 560, 460 620, 450 700"
          fill="none"
          stroke="#0f344d"
          strokeWidth="32"
          strokeLinecap="round"
        />
        <path
          d="M 490 0 C 470 150, 520 280, 480 420 C 440 560, 460 620, 450 700"
          fill="none"
          stroke="#164e63"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Gezira Island in Nile */}
        <ellipse cx="485" cy="330" rx="14" ry="46" fill="#0b172b" stroke="#164e63" strokeWidth="2" />

        {/* Major Arterial Ring Road (الطريق الدائري) */}
        <ellipse
          cx="520"
          cy="360"
          rx="380"
          ry="260"
          fill="none"
          stroke="rgba(71, 85, 105, 0.45)"
          strokeWidth="6"
          strokeDasharray="12 6"
        />

        {/* 26th July Corridor Highway */}
        <path
          d="M 120 320 Q 300 340, 470 330 T 780 340"
          fill="none"
          stroke="rgba(71, 85, 105, 0.4)"
          strokeWidth="4"
        />

        {/* North 90th Street Highway */}
        <path
          d="M 680 320 L 980 420"
          fill="none"
          stroke="rgba(71, 85, 105, 0.4)"
          strokeWidth="4"
        />

        {/* Autostrad Highway */}
        <path
          d="M 620 180 L 530 620"
          fill="none"
          stroke="rgba(71, 85, 105, 0.4)"
          strokeWidth="4"
        />

        {/* Bridges over the Nile */}
        <line x1="450" y1="280" x2="520" y2="280" stroke="#334155" strokeWidth="4" />
        <line x1="440" y1="360" x2="510" y2="360" stroke="#334155" strokeWidth="4" />
        <line x1="430" y1="440" x2="500" y2="440" stroke="#334155" strokeWidth="4" />

        {/* City District Soft Labels */}
        <text x="495" y="380" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          وسط البلد · التحرير
        </text>
        <text x="640" y="270" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          مصر الجديدة
        </text>
        <text x="700" y="370" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          مدينة نصر
        </text>
        <text x="820" y="440" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          التجمع الخامس
        </text>
        <text x="500" y="580" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          المعادي
        </text>
        <text x="220" y="310" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          الشيخ زايد
        </text>
        <text x="180" y="480" fill="#475569" fontSize="13" fontWeight="bold" fontFamily="Cairo">
          6 أكتوبر
        </text>

        {/* VISUAL APPROACH PATH: From Captain's Live Location to Rider's Pickup */}
        {activeRide?.driver &&
          (activeRide.status === 'driver_assigned' || activeRide.status === 'arriving') &&
          activeDriverPos &&
          currentPickup && (
            <g>
              {/* Glowing background halo */}
              <path
                d={`M ${activeDriverPos.x * 10} ${activeDriverPos.y * 7} Q ${
                  (activeDriverPos.x * 10 + currentPickup.x * 10) / 2 - 15
                } ${(activeDriverPos.y * 7 + currentPickup.y * 7) / 2 + 15}, ${
                  currentPickup.x * 10
                } ${currentPickup.y * 7}`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="9"
                strokeLinecap="round"
                opacity="0.35"
                filter="url(#approach-glow)"
              />
              {/* Animated high-visibility dashed approach line */}
              <path
                d={`M ${activeDriverPos.x * 10} ${activeDriverPos.y * 7} Q ${
                  (activeDriverPos.x * 10 + currentPickup.x * 10) / 2 - 15
                } ${(activeDriverPos.y * 7 + currentPickup.y * 7) / 2 + 15}, ${
                  currentPickup.x * 10
                } ${currentPickup.y * 7}`}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-dash-route"
              />

              {/* Pulsing Sonar Target Rings around the Rider's Pickup Location */}
              <circle
                cx={currentPickup.x * 10}
                cy={currentPickup.y * 7}
                r="22"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                opacity="0.7"
                className="animate-ping"
              />
              <circle
                cx={currentPickup.x * 10}
                cy={currentPickup.y * 7}
                r="36"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.5"
              />
            </g>
          )}

        {/* Destination Route Path if Pickup & Destination exist */}
        {currentPickup && currentDestination && (
          <g>
            {/* Background shadow path */}
            <path
              d={`M ${currentPickup.x * 10} ${currentPickup.y * 7} Q ${
                (currentPickup.x * 10 + currentDestination.x * 10) / 2 + 15
              } ${(currentPickup.y * 7 + currentDestination.y * 7) / 2 - 25}, ${
                currentDestination.x * 10
              } ${currentDestination.y * 7}`}
              fill="none"
              stroke="#065f46"
              strokeWidth="8"
              strokeLinecap="round"
              opacity="0.4"
            />
            {/* Foreground animated glowing route */}
            <path
              d={`M ${currentPickup.x * 10} ${currentPickup.y * 7} Q ${
                (currentPickup.x * 10 + currentDestination.x * 10) / 2 + 15
              } ${(currentPickup.y * 7 + currentDestination.y * 7) / 2 - 25}, ${
                currentDestination.x * 10
              } ${currentDestination.y * 7}`}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 6"
              filter="url(#route-glow)"
              className="animate-pulse"
            />
          </g>
        )}
      </svg>

      {/* D3.js Real-time Passenger Demand Heatmap Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-300"
        style={{
          transform: `scale(${zoom}) translate(${centerOffset.x}px, ${centerOffset.y}px)`,
        }}
      >
        <MapHeatmapOverlay isVisible={showHeatmap} filterHighSurgeOnly={filterHighSurge} />
      </div>

      {/* Interactive Markers Container */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-300"
        style={{
          transform: `scale(${zoom}) translate(${centerOffset.x}px, ${centerOffset.y}px)`,
        }}
      >
        {/* Community Drivers on Map */}
        {drivers.map((drv) => {
          const isActiveAssignedDriver = activeRide?.driver?.id === drv.id;
          const posX = isActiveAssignedDriver && driverSimPos ? driverSimPos.x : drv.x;
          const posY = isActiveAssignedDriver && driverSimPos ? driverSimPos.y : drv.y;

          return (
            <div
              key={drv.id}
              style={{ left: `${posX}%`, top: `${posY}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all ${
                isActiveAssignedDriver ? 'duration-300 ease-linear z-30' : 'duration-700 ease-out z-10'
              }`}
            >
              {/* Dynamic Floating Live Approach Tag pinned over the active moving Captain */}
              {isActiveAssignedDriver && (
                <div className="mb-1.5 px-2.5 py-1 rounded-xl bg-slate-900/95 border border-sky-400 text-[11px] font-bold text-white shadow-xl shadow-sky-950/60 flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                  <span>الكابتن {drv.name.split(' ')[1]}</span>
                  <span className="text-slate-400">·</span>
                  <span className="text-sky-300 tabular-nums">
                    {activeRide.status === 'arriving'
                      ? 'وصل للركوب!'
                      : remainingDistanceKm < 1
                      ? `${Math.max(50, Math.round(remainingDistanceKm * 1000))} م`
                      : `${remainingDistanceKm.toFixed(1)} كم`}
                  </span>
                </div>
              )}

              {/* Driver vehicle bubble with rotation & radar aura */}
              <div className="relative">
                {isActiveAssignedDriver && (
                  <span className="absolute -inset-2 rounded-full bg-sky-500/30 animate-ping pointer-events-none" />
                )}

                <div
                  style={{
                    transform: isActiveAssignedDriver ? `rotate(${carHeadingDeg}deg)` : undefined,
                  }}
                  className={`p-2.5 rounded-full border shadow-xl flex items-center justify-center transition-all ${
                    isActiveAssignedDriver
                      ? 'bg-sky-500 border-sky-200 text-white shadow-sky-500/50 scale-125'
                      : 'bg-slate-900 border-slate-700 text-teal-400 hover:border-teal-400 hover:scale-110'
                  }`}
                >
                  <Car className="w-4 h-4" />
                </div>
              </div>

              {/* Driver info tag (when not already displaying active approach badge) */}
              {!isActiveAssignedDriver && (
                <div className="mt-1 px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] text-slate-200 whitespace-nowrap opacity-80 group-hover:opacity-100 shadow-md">
                  <span>{drv.name.split(' ')[1]}</span>
                  <span className="text-amber-400 mr-1">★{drv.rating}</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Pickup Pin Marker */}
        {currentPickup && (
          <div
            style={{ left: `${currentPickup.x}%`, top: `${currentPickup.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center transition-all duration-300 z-20"
          >
            <div className="px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-950 flex items-center gap-1.5 mb-1 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              <span>نقطة الركوب (الالتقاء)</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Destination Pin Marker */}
        {currentDestination && (
          <div
            style={{ left: `${currentDestination.x}%`, top: `${currentDestination.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center transition-all duration-300 z-10"
          >
            <div className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-950 flex items-center gap-1 mb-1 whitespace-nowrap">
              <span>وجهة الوصول</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-rose-500 border-2 border-white shadow-xl flex items-center justify-center text-white">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Shuttle passenger waypoints on driver map */}
        {role === 'driver' &&
          shuttlePassengers.map(
            (pass) =>
              pass.status !== 'dropped_off' && (
                <div
                  key={'pass_stop_' + pass.id}
                  style={{ left: `${pass.destination.x}%`, top: `${pass.destination.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center z-10"
                >
                  <div className="px-2 py-0.5 rounded bg-teal-900/90 text-teal-200 text-[10px] font-bold border border-teal-500/50 shadow whitespace-nowrap mb-0.5">
                    محطة نزول {pass.name.split(' ')[0]} ({pass.fareEgp} ج.م)
                  </div>
                  <div className="w-5 h-5 rounded-full bg-teal-500 border border-white flex items-center justify-center text-white text-[10px] font-bold shadow">
                    {pass.seatIndex}
                  </div>
                </div>
              )
          )}
      </div>

      {/* Mode Instruction Banner if setting via map */}
      {settingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs sm:text-sm text-slate-100 animate-pulse">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>
            انقر على أي مكان في الخريطة لتحديد{' '}
            <strong className="text-emerald-400">
              {settingMode === 'pickup' ? 'نقطة الانطلاق (الركوب)' : 'وجهة الوصول (النزول)'}
            </strong>
          </span>
        </div>
      )}

      {/* Floating Status & Map Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(1.8, z + 0.15));
          }}
          className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="تكبير الخريطة"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(0.85, z - 0.15));
          }}
          className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="تصغير الخريطة"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom(1);
            setCenterOffset({ x: 0, y: 0 });
          }}
          className="w-9 h-9 rounded-lg bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="إعادة ضبط الموقع"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-time Heatmap Toggle & Live Surge Legend (Top-Left) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 items-start">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-xl">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowHeatmap((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showHeatmap
                ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-md shadow-red-950/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="تبديل طبقة الخريطة الحرارية (D3 Heatmap)"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-200 animate-pulse' : 'text-slate-400'}`} />
            <span>الخريطة الحرارية (Heatmap)</span>
            <span className="text-[9px] bg-black/30 px-1.5 py-0.5 rounded font-mono">D3</span>
          </button>

          {showHeatmap && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFilterHighSurge((prev) => !prev);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                filterHighSurge
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="تصفية مناطق الذروة العالية فقط"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>ذروة &gt; 1.4x</span>
            </button>
          )}
        </div>

        {/* Heatmap Live Demand Spectrum Legend */}
        {showHeatmap && (
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-2.5 text-[10px] text-slate-300 animate-fade-in">
            <span className="font-semibold text-slate-400">مستوى الطلب:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
              <span>نشط</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
              <span>مرتفع (1.5x)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-sm animate-ping" />
              <span className="text-red-400 font-bold">ذروة قصوى (1.8x)</span>
            </div>
          </div>
        )}
      </div>

      {/* Available Drivers Count & City info badge */}
      {(!activeRide || activeRide.status === 'idle') && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>4 كباتن متطوعين ومتاحين بالقرب منك</span>
        </div>
      )}
    </div>
  );
};
