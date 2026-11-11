import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Flame, Zap, TrendingUp, Users, Info, X } from 'lucide-react';

export interface HeatmapHotspot {
  id: string;
  name: string;
  x: number; // 0..1000 scale (matching LiveMap viewBox)
  y: number; // 0..700 scale
  radius: number;
  intensity: number; // 0..1
  surgeMultiplier: number;
  requestsPerMin: number;
  avgFareEgp: number;
  recommendation: string;
}

export const CAIRO_HEATMAP_HOTSPOTS: HeatmapHotspot[] = [
  {
    id: 'spot-tagamoa',
    name: 'التجمع الخامس (شارع التسعين والمستقبل)',
    x: 820,
    y: 440,
    radius: 95,
    intensity: 0.96,
    surgeMultiplier: 1.85,
    requestsPerMin: 24,
    avgFareEgp: 145,
    recommendation: 'ذروة فائقة مستمرة: طلبات شركات ومولات مع قبول فوري للمشاوير.',
  },
  {
    id: 'spot-zayed',
    name: 'الشيخ زايد (أركان وهايبر وان)',
    x: 220,
    y: 310,
    radius: 85,
    intensity: 0.88,
    surgeMultiplier: 1.6,
    requestsPerMin: 18,
    avgFareEgp: 130,
    recommendation: 'طلب نشط جداً للمشاوير المتجهة للمهندسين ووسط البلد.',
  },
  {
    id: 'spot-korba',
    name: 'مصر الجديدة والكوربة (روكسي والميرغني)',
    x: 640,
    y: 270,
    radius: 80,
    intensity: 0.86,
    surgeMultiplier: 1.5,
    requestsPerMin: 19,
    avgFareEgp: 95,
    recommendation: 'حركة ركاب سريعة ومسارات قصيرة مربحة مع خطوط الشاتل.',
  },
  {
    id: 'spot-tahrir',
    name: 'وسط البلد وميدان التحرير',
    x: 500,
    y: 350,
    radius: 85,
    intensity: 0.82,
    surgeMultiplier: 1.4,
    requestsPerMin: 21,
    avgFareEgp: 85,
    recommendation: 'محور تنقلات مركزي يربط شرق وغرب القاهرة.',
  },
  {
    id: 'spot-nasr',
    name: 'مدينة نصر (عباس العقاد وسيتي ستارز)',
    x: 710,
    y: 370,
    radius: 78,
    intensity: 0.79,
    surgeMultiplier: 1.35,
    requestsPerMin: 15,
    avgFareEgp: 90,
    recommendation: 'كثافة ركاب مرتفعة بالقرب من المراكز التجارية ومحطات المترو.',
  },
  {
    id: 'spot-maadi',
    name: 'المعادي ودجلة (شارع 9)',
    x: 500,
    y: 580,
    radius: 72,
    intensity: 0.74,
    surgeMultiplier: 1.3,
    requestsPerMin: 12,
    avgFareEgp: 105,
    recommendation: 'رحلات هادئة ومربحة تربط المعادي بالتجمع وأكتوبر.',
  },
  {
    id: 'spot-dokki',
    name: 'الدقي والمهندسين (مصدق وجامعة الدول)',
    x: 420,
    y: 370,
    radius: 68,
    intensity: 0.7,
    surgeMultiplier: 1.25,
    requestsPerMin: 13,
    avgFareEgp: 75,
    recommendation: 'طلب مستمر على مدار الساعة ومناسب لملء المقاعد الشاغرة.',
  },
];

interface MapHeatmapOverlayProps {
  isVisible: boolean;
  filterHighSurgeOnly?: boolean;
}

export const MapHeatmapOverlay: React.FC<MapHeatmapOverlayProps> = ({
  isVisible,
  filterHighSurgeOnly = false,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<HeatmapHotspot | null>(null);
  const [spots, setSpots] = useState<HeatmapHotspot[]>(CAIRO_HEATMAP_HOTSPOTS);

  // Subtle real-time fluctuation in demand to simulate live passenger bookings
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setSpots((prev) =>
        prev.map((spot) => {
          const delta = (Math.random() - 0.48) * 0.04;
          const newIntensity = Math.min(0.99, Math.max(0.65, spot.intensity + delta));
          const newReqs = Math.max(8, Math.round(newIntensity * 25));
          return {
            ...spot,
            intensity: Number(newIntensity.toFixed(2)),
            requestsPerMin: newReqs,
          };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [isVisible]);

  const filteredSpots = useMemo(() => {
    if (!filterHighSurgeOnly) return spots;
    return spots.filter((s) => s.surgeMultiplier >= 1.4);
  }, [spots, filterHighSurgeOnly]);

  // Render D3 Heatmap Gradients & Concentric Wave Rings
  useEffect(() => {
    if (!svgRef.current || !isVisible) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // Filter for smooth organic blur
    const filter = defs
      .append('filter')
      .attr('id', 'd3-heat-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter
      .append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', 14);

    // Glow filter for badges
    const badgeGlow = defs.append('filter').attr('id', 'heat-badge-glow');
    badgeGlow
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 4)
      .attr('flood-color', '#ef4444')
      .attr('flood-opacity', 0.6);

    // Dynamic radial gradient for each hotspot
    filteredSpots.forEach((spot) => {
      const gradId = `heat-grad-${spot.id}`;
      const grad = defs
        .append('radialGradient')
        .attr('id', gradId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%')
        .attr('fx', '50%')
        .attr('fy', '50%');

      // Core intensity color (Red/Magenta for super high surge, Amber for moderate)
      const coreColor = spot.intensity > 0.9 ? '#ef4444' : spot.intensity > 0.8 ? '#f59e0b' : '#10b981';
      const midColor = spot.intensity > 0.9 ? '#f97316' : '#10b981';

      grad
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', coreColor)
        .attr('stop-opacity', spot.intensity * 0.72);

      grad
        .append('stop')
        .attr('offset', '45%')
        .attr('stop-color', midColor)
        .attr('stop-opacity', spot.intensity * 0.45);

      grad
        .append('stop')
        .attr('offset', '75%')
        .attr('stop-color', '#06b6d4')
        .attr('stop-opacity', spot.intensity * 0.22);

      grad
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#06b6d4')
        .attr('stop-opacity', 0);
    });

    const g = svg.append('g').attr('class', 'heatmap-layer');

    // 1. Heat Diffusion Circles
    filteredSpots.forEach((spot) => {
      const spotG = g
        .append('g')
        .attr('class', `spot-group-${spot.id}`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setSelectedSpot(spot);
        });

      // Ambient blur blob
      spotG
        .append('circle')
        .attr('cx', spot.x)
        .attr('cy', spot.y)
        .attr('r', spot.radius)
        .attr('fill', `url(#heat-grad-${spot.id})`)
        .attr('filter', 'url(#d3-heat-blur)')
        .attr('opacity', 0)
        .transition()
        .duration(850)
        .attr('opacity', 1);

      // Pulsing outer ripple radar wave
      spotG
        .append('circle')
        .attr('cx', spot.x)
        .attr('cy', spot.y)
        .attr('r', spot.radius * 0.45)
        .attr('fill', 'none')
        .attr('stroke', spot.intensity > 0.85 ? '#ef4444' : '#f59e0b')
        .attr('stroke-width', 1.8)
        .attr('stroke-opacity', 0.8)
        .attr('class', 'animate-ping');

      // Inner concentrated core circle
      spotG
        .append('circle')
        .attr('cx', spot.x)
        .attr('cy', spot.y)
        .attr('r', 18)
        .attr('fill', spot.intensity > 0.85 ? '#ef4444' : '#f59e0b')
        .attr('fill-opacity', 0.85)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .attr('filter', 'url(#heat-badge-glow)');

      // Surge icon inside core
      spotG
        .append('text')
        .attr('x', spot.x)
        .attr('y', spot.y + 4.5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text('🔥');

      // Surge Multiplier Tag Pill
      const tagG = spotG.append('g').attr('transform', `translate(${spot.x}, ${spot.y - 28})`);

      const labelText = `${spot.surgeMultiplier}x`;
      tagG
        .append('rect')
        .attr('x', -22)
        .attr('y', -10)
        .attr('width', 44)
        .attr('height', 20)
        .attr('rx', 6)
        .attr('fill', spot.intensity > 0.85 ? '#991b1b' : '#78350f')
        .attr('stroke', spot.intensity > 0.85 ? '#ef4444' : '#f59e0b')
        .attr('stroke-width', 1.2);

      tagG
        .append('text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fef08a')
        .attr('font-size', '10px')
        .attr('font-weight', '900')
        .attr('font-family', 'Cairo, sans-serif')
        .text(labelText);

      // Area label below core
      spotG
        .append('text')
        .attr('x', spot.x)
        .attr('y', spot.y + 36)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'Cairo, sans-serif')
        .style('text-shadow', '0 2px 4px rgba(0,0,0,0.9)')
        .text(spot.name.split(' (')[0]);
    });
  }, [filteredSpots, isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* SVG Layer for Heatmap Rendering */}
      <svg
        ref={svgRef}
        viewBox="0 0 1000 700"
        className="absolute inset-0 w-full h-full pointer-events-auto z-15"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Selected Hotspot Detail Popup Card */}
      {selectedSpot && (
        <div className="absolute top-16 left-4 z-40 max-w-xs bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md animate-fade-in text-xs text-slate-100 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">{selectedSpot.name}</h4>
                <span className="text-[10px] text-amber-300 font-bold">
                  معدل تسعير ديناميكي {selectedSpot.surgeMultiplier}x Surge
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSpot(null)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[10px]">الطلبات الحالية</span>
              <span className="text-emerald-400 font-black text-sm">
                ~{selectedSpot.requestsPerMin} طلب/د
              </span>
            </div>
            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-slate-400 text-[10px]">متوسط الأجرة</span>
              <span className="text-teal-300 font-black text-sm">
                {selectedSpot.avgFareEgp} ج.م
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed bg-amber-950/30 p-2 rounded-xl border border-amber-900/40">
            💡 <strong className="text-amber-300">نصيحة التواجد:</strong> {selectedSpot.recommendation}
          </p>

          <button
            type="button"
            onClick={() => setSelectedSpot(null)}
            className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      )}
    </>
  );
};
