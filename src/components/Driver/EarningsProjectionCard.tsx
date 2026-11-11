import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  Sun,
  Moon,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export interface DayProjection {
  dayOffset: number; // 1 to 7
  dateStr: string;
  dayName: string;
  shortDate: string;
  isWeekend: boolean;
  isPeakDay: boolean;
  projectedIncome: number;
  baseHourlyRate: number;
  effectiveHourlyRate: number;
  peakMultiplier: number;
  estimatedTrips: number;
  bestPeakWindow: string;
  demandLevel: 'high' | 'very_high' | 'normal';
}

export const EarningsProjectionCard: React.FC = () => {
  const { driverEarningsTodayEgp, isFirstRideFreeUsed } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [dailyHours, setDailyHours] = useState<number>(6); // Default 6 hours/day
  const [strategy, setStrategy] = useState<'peak' | 'balanced' | 'relaxed'>('peak');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [hoveredDay, setHoveredDay] = useState<DayProjection | null>(null);

  // Compute 7-day projection data based on historical peak patterns & hourly rates
  const projectionData: DayProjection[] = useMemo(() => {
    const list: DayProjection[] = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const now = new Date();

    // Baseline hourly rate in EGP (average Cairo rideshare captain)
    const baseRate = 75; // 75 EGP/hr

    for (let i = 1; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      const dayOfWeek = d.getDay(); // 0 is Sun, 4 is Thu, 5 is Fri, 6 is Sat
      const dayName = arabicDays[dayOfWeek];
      const isThursday = dayOfWeek === 4;
      const isFriday = dayOfWeek === 5;
      const isWeekend = isThursday || isFriday || dayOfWeek === 6;

      // Historical peak multiplier based on day patterns in Egypt
      // Thursday & Friday have intense social/nightlife and rush hour
      // Sunday & Monday have heavy back-to-work / school rush
      let dayMultiplier = 1.0;
      let demand: 'high' | 'very_high' | 'normal' = 'normal';
      let peakWindow = '7:30 ص - 10:30 ص';

      if (isThursday) {
        dayMultiplier = 1.45; // Thursday massive night & evening demand
        demand = 'very_high';
        peakWindow = '4:00 م - 11:00 م (ذروة نهاية الأسبوع)';
      } else if (isFriday) {
        dayMultiplier = 1.35; // Friday afternoon & evening family/mall trips
        demand = 'very_high';
        peakWindow = '1:30 م - 9:00 م (عطلة الجمعة)';
      } else if (dayOfWeek === 0 || dayOfWeek === 1) {
        // Sunday / Monday
        dayMultiplier = 1.25;
        demand = 'high';
        peakWindow = '7:00 ص - 10:30 ص & 4:30 م - 7:30 م';
      } else {
        // Tue / Wed / Sat
        dayMultiplier = 1.15;
        demand = 'normal';
        peakWindow = '8:00 ص - 11:00 ص & 5:00 م - 8:00 م';
      }

      // Strategy adjustments
      let strategyBonus = 1.0;
      if (strategy === 'peak') {
        strategyBonus = 1.25; // Focused strictly on rush hours gives +25% efficiency
      } else if (strategy === 'balanced') {
        strategyBonus = 1.05;
      } else {
        strategyBonus = 0.9; // Relaxed / off-peak
      }

      const effectiveHourly = Math.round(baseRate * dayMultiplier * strategyBonus);
      const totalProjected = Math.round(effectiveHourly * dailyHours);
      const estimatedTrips = Math.max(3, Math.round(totalProjected / 65));

      list.push({
        dayOffset: i,
        dateStr: d.toISOString().split('T')[0],
        dayName: i === 1 ? `غداً (${dayName})` : dayName,
        shortDate: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }),
        isWeekend,
        isPeakDay: isThursday || isFriday,
        projectedIncome: totalProjected,
        baseHourlyRate: baseRate,
        effectiveHourlyRate: effectiveHourly,
        peakMultiplier: Number((dayMultiplier * strategyBonus).toFixed(2)),
        estimatedTrips,
        bestPeakWindow: peakWindow,
        demandLevel: demand,
      });
    }

    return list;
  }, [dailyHours, strategy]);

  // Totals & stats
  const totalWeeklyProjected = useMemo(
    () => projectionData.reduce((acc, d) => acc + d.projectedIncome, 0),
    [projectionData]
  );
  const highestDay = useMemo(() => {
    return [...projectionData].sort((a, b) => b.projectedIncome - a.projectedIncome)[0];
  }, [projectionData]);
  const avgHourlyRate = useMemo(() => {
    return Math.round(
      projectionData.reduce((acc, d) => acc + d.effectiveHourlyRate, 0) / projectionData.length
    );
  }, [projectionData]);

  // Selected Day data for detailed breakdown
  const activeDay = hoveredDay || projectionData[selectedDayIndex] || projectionData[0];

  // Render D3 Bar Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isExpanded) return;

    const container = containerRef.current;
    const width = container.clientWidth || 440;
    const height = 210;
    const margin = { top: 30, right: 16, bottom: 38, left: 38 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

    // Defs for gradients & filters
    const defs = svg.append('defs');

    // Emerald gradient for normal days
    const gradNormal = defs
      .append('linearGradient')
      .attr('id', 'grad-bar-normal')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradNormal.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    gradNormal.append('stop').attr('offset', '100%').attr('stop-color', '#047857');

    // Purple / Indigo gradient for high demand
    const gradHigh = defs
      .append('linearGradient')
      .attr('id', 'grad-bar-high')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradHigh.append('stop').attr('offset', '0%').attr('stop-color', '#8b5cf6');
    gradHigh.append('stop').attr('offset', '100%').attr('stop-color', '#4c1d95');

    // Amber / Rose gradient for super peak (Thursday/Friday)
    const gradPeak = defs
      .append('linearGradient')
      .attr('id', 'grad-bar-peak')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    gradPeak.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b');
    gradPeak.append('stop').attr('offset', '100%').attr('stop-color', '#b45309');

    // Main G container
    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X Scale (band)
    const xScale = d3
      .scaleBand()
      .domain(projectionData.map((d) => d.dayName))
      .range([0, innerWidth])
      .padding(0.24);

    // Y Scale (linear)
    const maxVal = d3.max(projectionData, (d) => d.projectedIncome) || 800;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxVal * 1.18])
      .nice()
      .range([innerHeight, 0]);

    // Horizontal Grid Lines
    const yTicks = yScale.ticks(4);
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3');

    // Y Axis labels
    g.append('g')
      .attr('class', 'y-axis-labels')
      .selectAll('text')
      .data(yTicks)
      .enter()
      .append('text')
      .attr('x', -8)
      .attr('y', (d) => yScale(d) + 3)
      .attr('text-anchor', 'end')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'Cairo, sans-serif')
      .text((d) => `${d}`);

    // Bars
    const barGroups = g
      .selectAll('.bar-group')
      .data(projectionData)
      .enter()
      .append('g')
      .attr('class', 'bar-group')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        setHoveredDay(d);
      })
      .on('mouseleave', () => {
        setHoveredDay(null);
      })
      .on('click', (event, d) => {
        const idx = projectionData.findIndex((p) => p.dayOffset === d.dayOffset);
        if (idx !== -1) setSelectedDayIndex(idx);
      });

    // Bar rects with animated transitions
    barGroups
      .append('rect')
      .attr('x', (d) => xScale(d.dayName) || 0)
      .attr('width', xScale.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) => {
        if (d.isPeakDay) return 'url(#grad-bar-peak)';
        if (d.demandLevel === 'high') return 'url(#grad-bar-high)';
        return 'url(#grad-bar-normal)';
      })
      .attr('stroke', (d) => {
        if (activeDay.dayOffset === d.dayOffset) return '#ffffff';
        if (d.isPeakDay) return '#f59e0b';
        return '#334155';
      })
      .attr('stroke-width', (d) => (activeDay.dayOffset === d.dayOffset ? 2 : 1))
      .transition()
      .duration(750)
      .delay((d, i) => i * 65)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.projectedIncome))
      .attr('height', (d) => innerHeight - yScale(d.projectedIncome));

    // Value Labels on top of each bar
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.dayName) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (d.isPeakDay ? '#fbbf24' : '#f1f5f9'))
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'Cairo, sans-serif')
      .text((d) => `${d.projectedIncome}`)
      .transition()
      .duration(750)
      .delay((d, i) => i * 65)
      .ease(d3.easeCubicOut)
      .attr('y', (d) => yScale(d.projectedIncome) - 7);

    // Peak badge indicator for top days
    barGroups
      .filter((d) => d.isPeakDay)
      .append('text')
      .attr('x', (d) => (xScale(d.dayName) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) => yScale(d.projectedIncome) - 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .text('🔥 ذروة');

    // X Axis Labels (Day Name & Short Date)
    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.dayName) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + 16)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => (activeDay.dayOffset === d.dayOffset ? '#38bdf8' : '#94a3b8'))
      .attr('font-size', '11px')
      .attr('font-weight', (d) => (activeDay.dayOffset === d.dayOffset ? 'bold' : 'normal'))
      .attr('font-family', 'Cairo, sans-serif')
      .text((d) => d.dayName.replace(/ \(.+\)/, ''));

    barGroups
      .append('text')
      .attr('x', (d) => (xScale(d.dayName) || 0) + xScale.bandwidth() / 2)
      .attr('y', innerHeight + 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '9px')
      .attr('font-family', 'Cairo, sans-serif')
      .text((d) => d.shortDate);
  }, [projectionData, isExpanded, activeDay.dayOffset]);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                توقعات أرباح الـ 7 أيام القادمة (Earnings Projection)
              </h3>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>مخطط D3 أعمدة</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              تنبؤ ذكي للدخل المتوقع بناءً على ساعات العمل وأسعار الذروة التاريخية
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 flex flex-col gap-4 animate-fade-in">
          {/* Controls: Daily Hours Slider & Strategy Presets */}
          <div className="p-3 bg-slate-900/70 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Hours worked per day */}
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-semibold flex items-center gap-1.5 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  عدد ساعات القيادة اليومية:
                </span>
                <span className="font-bold text-emerald-400 font-mono text-sm">
                  {dailyHours} ساعات/يوم
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>2س (بارت تايم)</span>
                <span>6س (متوسط)</span>
                <span>8س (دوام كامل)</span>
                <span>12س (أقصى مجهود)</span>
              </div>
            </div>

            {/* Strategy Selector */}
            <div className="flex flex-col gap-1 sm:border-r sm:border-slate-800 sm:pr-3">
              <span className="text-[10px] text-slate-400 font-semibold">استراتيجية القيادة:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStrategy('peak')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    strategy === 'peak'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>اقتناص الذروة 🔥</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('balanced')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    strategy === 'balanced'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3 h-3 text-emerald-300" />
                  <span>متوازن ⚖️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStrategy('relaxed')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    strategy === 'relaxed'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3 h-3 text-slate-300" />
                  <span>هادئ ☕</span>
                </button>
              </div>
            </div>
          </div>

          {/* D3 Bar Chart Container */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1 text-slate-300 font-bold">
                <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                توزيع الدخل اليومي التقديري (ج.م):
              </span>
              <span className="text-[10px] text-slate-500">
                انقر على أي عمود لاستعراض تفاصيل اليوم وساعات الذروة
              </span>
            </div>

            <div
              ref={containerRef}
              className="w-full bg-slate-900/90 rounded-2xl p-2.5 border border-slate-800/80 shadow-inner overflow-hidden"
            >
              <svg ref={svgRef} className="w-full h-auto block overflow-visible" />
            </div>
          </div>

          {/* Selected / Hovered Day Interactive Detail Card */}
          <div className="p-3 bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] text-slate-400">اليوم</span>
                <span className="text-xs font-bold text-white">{activeDay.shortDate}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-white text-sm">{activeDay.dayName}</h4>
                  {activeDay.isPeakDay && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                      أعلى عائد في الأسبوع 🚀
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  أفضل أوقات الذروة الموصى بها: <strong className="text-amber-300 font-bold">{activeDay.bestPeakWindow}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800/90 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
              <div>
                <span className="text-[10px] text-slate-400 block">الدخل المتوقع:</span>
                <span className="text-base font-black text-emerald-400 tabular-nums">
                  {activeDay.projectedIncome} ج.م
                </span>
              </div>
              <div className="border-r border-slate-800 pr-3">
                <span className="text-[10px] text-slate-400 block">العائد بالساعة:</span>
                <span className="text-xs font-bold text-teal-300 tabular-nums">
                  {activeDay.effectiveHourlyRate} ج.م/ساعة
                </span>
              </div>
              <div className="border-r border-slate-800 pr-3">
                <span className="text-[10px] text-slate-400 block">عدد الرحلات المقدر:</span>
                <span className="text-xs font-bold text-purple-300 tabular-nums">
                  ~{activeDay.estimatedTrips} رحلة
                </span>
              </div>
            </div>
          </div>

          {/* 7-Day Aggregate KPI Summary */}
          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">إجمالي أسبوعي متوقع</span>
              <span className="text-emerald-400 font-black text-sm sm:text-base tabular-nums mt-0.5">
                {totalWeeklyProjected.toLocaleString('ar-EG')} <span className="text-[10px] text-slate-400 font-normal">ج.م</span>
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">بناءً على {dailyHours * 7} ساعة قيادة</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">أعلى يوم ذروة</span>
              <span className="text-amber-400 font-black text-sm sm:text-base tabular-nums mt-0.5">
                {highestDay.dayName.replace(/ \(.+\)/, '')} ({highestDay.projectedIncome} ج.م)
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">عائد {highestDay.effectiveHourlyRate} ج.م/س</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col">
              <span className="text-[10px] text-slate-400 font-medium">متوسط سعر الساعة</span>
              <span className="text-teal-300 font-black text-sm sm:text-base tabular-nums mt-0.5">
                {avgHourlyRate} <span className="text-[10px] text-slate-400 font-normal">ج.م/ساعة</span>
              </span>
              <span className="text-[9px] text-slate-500 mt-0.5">يشمل علاوات الذروة</span>
            </div>
          </div>

          {/* AI Smart Optimization Advice Banner */}
          <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-xl flex items-start gap-2.5 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-300 block">
                توصية ذكية لمضاعفة الأرباح:
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                استغلال فترات الذروة الصباحية (7:30 ص - 10:30 ص) والمسائية (4:30 م - 9:00 م) يومي الخميس والجمعة يرفع متوسط دخلك بالساعة إلى أكثر من <strong className="text-amber-300 font-bold">135 ج.م/ساعة</strong>، مع الاستفادة من ميزة المسار المفتوح (Uber Shuttle En-Route) لملء المقاعد الشاغرة دون قطع مسافات إضافية!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
