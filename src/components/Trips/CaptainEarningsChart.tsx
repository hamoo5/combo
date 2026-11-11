import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Banknote,
  Car,
  Calendar,
  Sparkles,
  Info,
  Award,
} from 'lucide-react';

export interface DayAnalytics {
  dateStr: string;
  dayLabel: string;
  fullDate: string;
  netEarnings: number;
  tripsCount: number;
  totalDistanceKm: number;
}

export const CaptainEarningsChart: React.FC = () => {
  const { pastRides, driverEarningsTodayEgp, completedRidesCountToday } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'both' | 'earnings' | 'trips'>('both');
  const [hoveredDay, setHoveredDay] = useState<DayAnalytics | null>(null);

  // Generate 7-day dataset combining real past rides + baseline captain historical record
  const weeklyData: DayAnalytics[] = useMemo(() => {
    const days: DayAnalytics[] = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const now = new Date();

    // Baseline historical patterns for 7 days
    const mockBaseline = [
      { earnings: 320, trips: 4, dist: 46 },
      { earnings: 450, trips: 6, dist: 68 },
      { earnings: 280, trips: 3, dist: 38 },
      { earnings: 520, trips: 7, dist: 82 },
      { earnings: 610, trips: 8, dist: 94 },
      { earnings: 490, trips: 6, dist: 71 },
      { earnings: Math.max(180, driverEarningsTodayEgp), trips: Math.max(2, completedRidesCountToday), dist: 55 },
    ];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayIndex = d.getDay();
      const dateKey = d.toISOString().split('T')[0];

      // Check if any rides in pastRides match this day
      const ridesThisDay = pastRides.filter((r) => {
        const rideDate = new Date(r.createdAt).toISOString().split('T')[0];
        return rideDate === dateKey;
      });

      const base = mockBaseline[6 - i];
      const addedEarnings = ridesThisDay.reduce((acc, r) => acc + (r.finalFareEgp || 0), 0);
      const addedTrips = ridesThisDay.length;

      days.push({
        dateStr: dateKey,
        dayLabel: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : arabicDays[dayIndex],
        fullDate: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
        netEarnings: base.earnings + addedEarnings,
        tripsCount: base.trips + addedTrips,
        totalDistanceKm: base.dist + ridesThisDay.reduce((acc, r) => acc + (r.distanceKm || 0), 0),
      });
    }

    return days;
  }, [pastRides, driverEarningsTodayEgp, completedRidesCountToday]);

  // Aggregate stats
  const totalEarnings = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.netEarnings, 0),
    [weeklyData]
  );
  const totalTrips = useMemo(
    () => weeklyData.reduce((sum, d) => sum + d.tripsCount, 0),
    [weeklyData]
  );
  const avgDailyEarnings = Math.round(totalEarnings / 7);
  const bestDay = useMemo(
    () => [...weeklyData].sort((a, b) => b.netEarnings - a.netEarnings)[0],
    [weeklyData]
  );

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 520;
    const height = 230;
    const margin = { top: 25, right: 35, bottom: 35, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear previous render

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Defs for gradients & shadow filters
    const defs = svg.append('defs');

    // Emerald gradient for earnings area
    const earningsGradient = defs
      .append('linearGradient')
      .attr('id', 'earningsAreaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    earningsGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.45);

    earningsGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    // Amber gradient for trips area
    const tripsGradient = defs
      .append('linearGradient')
      .attr('id', 'tripsAreaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    tripsGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.35);

    tripsGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#f59e0b')
      .attr('stop-opacity', 0.0);

    // Chart group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Points along the 7 days)
    const xScale = d3
      .scalePoint<string>()
      .domain(weeklyData.map((d) => d.dayLabel))
      .range([0, innerWidth])
      .padding(0.15);

    // Y Scale Left (Earnings in EGP)
    const maxEarnings = d3.max(weeklyData, (d) => d.netEarnings) || 600;
    const yScaleEarnings = d3
      .scaleLinear()
      .domain([0, Math.ceil((maxEarnings * 1.15) / 50) * 50])
      .range([innerHeight, 0])
      .nice();

    // Y Scale Right (Trips Count)
    const maxTrips = d3.max(weeklyData, (d) => d.tripsCount) || 10;
    const yScaleTrips = d3
      .scaleLinear()
      .domain([0, Math.max(8, maxTrips + 2)])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const yAxisGrid = d3
      .axisLeft(yScaleEarnings)
      .ticks(4)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.7);

    g.select('.grid-lines').select('.domain').remove();

    // D3 Line Generator for Earnings
    const earningsLine = d3
      .line<DayAnalytics>()
      .x((d) => xScale(d.dayLabel) ?? 0)
      .y((d) => yScaleEarnings(d.netEarnings))
      .curve(d3.curveMonotoneX);

    // D3 Area Generator for Earnings
    const earningsArea = d3
      .area<DayAnalytics>()
      .x((d) => xScale(d.dayLabel) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScaleEarnings(d.netEarnings))
      .curve(d3.curveMonotoneX);

    // D3 Line Generator for Trips Count
    const tripsLine = d3
      .line<DayAnalytics>()
      .x((d) => xScale(d.dayLabel) ?? 0)
      .y((d) => yScaleTrips(d.tripsCount))
      .curve(d3.curveMonotoneX);

    // --- DRAW EARNINGS AREA & LINE ---
    if (selectedMetric === 'both' || selectedMetric === 'earnings') {
      // Area Fill
      g.append('path')
        .datum(weeklyData)
        .attr('fill', 'url(#earningsAreaGradient)')
        .attr('d', earningsArea);

      // Line Path with draw-in animation
      const earningsPath = g
        .append('path')
        .datum(weeklyData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.8)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .attr('d', earningsLine);

      const pathLength = earningsPath.node()?.getTotalLength() || 600;
      earningsPath
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Dots on points
      g.selectAll('.earnings-dot')
        .data(weeklyData)
        .enter()
        .append('circle')
        .attr('class', 'earnings-dot')
        .attr('cx', (d) => xScale(d.dayLabel) ?? 0)
        .attr('cy', (d) => yScaleEarnings(d.netEarnings))
        .attr('r', 4.5)
        .attr('fill', '#059669')
        .attr('stroke', '#ecfdf5')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');
    }

    // --- DRAW TRIPS FREQUENCY LINE ---
    if (selectedMetric === 'both' || selectedMetric === 'trips') {
      const tripsPath = g
        .append('path')
        .datum(weeklyData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2.2)
        .attr('stroke-dasharray', selectedMetric === 'both' ? '4 3' : 'none')
        .attr('stroke-linecap', 'round')
        .attr('d', tripsLine);

      const tLength = tripsPath.node()?.getTotalLength() || 600;
      tripsPath
        .attr('stroke-dasharray', `${tLength} ${tLength}`)
        .attr('stroke-dashoffset', tLength)
        .transition()
        .duration(850)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Dots for Trips
      g.selectAll('.trips-dot')
        .data(weeklyData)
        .enter()
        .append('circle')
        .attr('class', 'trips-dot')
        .attr('cx', (d) => xScale(d.dayLabel) ?? 0)
        .attr('cy', (d) => yScaleTrips(d.tripsCount))
        .attr('r', 3.8)
        .attr('fill', '#f59e0b')
        .attr('stroke', '#fffbeb')
        .attr('stroke-width', 1.5)
        .style('cursor', 'pointer');
    }

    // X Axis
    const xAxis = d3.axisBottom(xScale);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10.5px')
      .attr('font-family', 'Cairo, sans-serif')
      .attr('dy', '1em');

    // Left Y Axis (Earnings in EGP)
    const yAxisLeft = d3
      .axisLeft(yScaleEarnings)
      .ticks(4)
      .tickFormat((d) => `${d} ج`);

    const yAxisLeftGroup = g.append('g').call(yAxisLeft);
    yAxisLeftGroup.select('.domain').attr('stroke', '#334155');
    yAxisLeftGroup
      .selectAll('text')
      .attr('fill', '#10b981')
      .attr('font-size', '9.5px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif');

    // Right Y Axis (Trips Count)
    if (selectedMetric === 'both' || selectedMetric === 'trips') {
      const yAxisRight = d3
        .axisRight(yScaleTrips)
        .ticks(4)
        .tickFormat((d) => `${d} ر`);

      const yAxisRightGroup = g
        .append('g')
        .attr('transform', `translate(${innerWidth}, 0)`)
        .call(yAxisRight);

      yAxisRightGroup.select('.domain').remove();
      yAxisRightGroup
        .selectAll('text')
        .attr('fill', '#f59e0b')
        .attr('font-size', '9.5px')
        .attr('font-family', 'Plus Jakarta Sans, sans-serif');
    }

    // Interactive Hover Overlay (Voronoi/Rectangles per column)
    const stepWidth = innerWidth / 7;
    weeklyData.forEach((d) => {
      const xPos = (xScale(d.dayLabel) ?? 0) - stepWidth / 2;
      g.append('rect')
        .attr('x', Math.max(0, xPos))
        .attr('y', 0)
        .attr('width', stepWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredDay(d))
        .on('mouseleave', () => setHoveredDay(null));
    });

  }, [weeklyData, selectedMetric]);

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      {/* Chart Header & Metric Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>تحليل الأرباح والرحلات لآخر 7 أيام (D3.js)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                كابتن معتمد
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              تتبع بياني تفاعلي لصافي أرباح الكابتن ووتيرة تكرار المشاوير
            </p>
          </div>
        </div>

        {/* Metric Switcher */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-0.5 rounded-xl text-[11px] self-start sm:self-auto">
          <button
            onClick={() => setSelectedMetric('both')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedMetric === 'both'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            المؤشرين معاً
          </button>
          <button
            onClick={() => setSelectedMetric('earnings')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedMetric === 'earnings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            صافي الأرباح (ج.م)
          </button>
          <button
            onClick={() => setSelectedMetric('trips')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              selectedMetric === 'trips'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            تكرار الرحلات
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400">إجمالي الأرباح</span>
            <div className="text-sm font-black text-emerald-400 tabular-nums">
              {totalEarnings} ج.م
            </div>
          </div>
          <Banknote className="w-4 h-4 text-emerald-400 shrink-0 opacity-80" />
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400">إجمالي الرحلات</span>
            <div className="text-sm font-black text-amber-400 tabular-nums">
              {totalTrips} رحلة
            </div>
          </div>
          <Car className="w-4 h-4 text-amber-400 shrink-0 opacity-80" />
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400">متوسط الدخل اليومي</span>
            <div className="text-sm font-black text-teal-300 tabular-nums">
              {avgDailyEarnings} ج.م / يوم
            </div>
          </div>
          <Calendar className="w-4 h-4 text-teal-400 shrink-0 opacity-80" />
        </div>

        <div className="p-2.5 bg-slate-900/80 border border-slate-800/80 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400">أعلى يوم إنتاجية</span>
            <div className="text-xs font-black text-purple-300 truncate">
              {bestDay.dayLabel} ({bestDay.netEarnings} ج)
            </div>
          </div>
          <Award className="w-4 h-4 text-purple-400 shrink-0 opacity-80" />
        </div>
      </div>

      {/* D3 SVG Container */}
      <div
        ref={containerRef}
        className="w-full relative bg-slate-900/50 rounded-xl border border-slate-800/80 pt-1 pb-2 overflow-hidden"
      >
        <svg ref={svgRef} className="overflow-visible block w-full"></svg>

        {/* Hover Floating Details Card */}
        {hoveredDay && (
          <div className="absolute top-2 left-3 bg-slate-900/95 border border-emerald-500/40 rounded-xl p-2.5 text-xs shadow-xl backdrop-blur-md flex items-center gap-3 animate-fade-in pointer-events-none z-10">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">
                {hoveredDay.dayLabel} ({hoveredDay.fullDate})
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-black text-emerald-400">
                  {hoveredDay.netEarnings} ج.م صافي
                </span>
                <span className="text-slate-600">|</span>
                <span className="font-bold text-amber-400">
                  {hoveredDay.tripsCount} رحلات
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 border-r border-slate-800 pr-2">
              <div>المسافة: <strong className="text-slate-200">{hoveredDay.totalDistanceKm} كم</strong></div>
              <div>المتوسط: <strong className="text-teal-300">{Math.round(hoveredDay.netEarnings / hoveredDay.tripsCount)} ج/مشوار</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Privacy Reminder */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300 font-medium">صافي الأرباح (أخضر زمردي)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300 font-medium">تكرار الرحلات (أصفر عنبري)</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Info className="w-3 h-3 text-slate-400" />
          <span>الأرباح المعروضة هي الصافية تماماً بعد خصم أي عمولات مجتمعية</span>
        </div>
      </div>
    </div>
  );
};
