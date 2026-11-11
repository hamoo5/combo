import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import {
  Activity,
  TrendingUp,
  Percent,
  Banknote,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Info,
  DollarSign,
  PieChart,
} from 'lucide-react';

export interface DayFinancialRecord {
  dateStr: string;
  dayLabel: string;
  shortDate: string;
  grossIncome: number;
  commissionDeducted: number;
  netIncome: number;
  profitMarginPercent: number;
  tripsCount: number;
}

export const CaptainFinancialHealthCard: React.FC = () => {
  const { driverEarningsTodayEgp, isFirstRideFreeUsed } = useApp();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedSeries, setSelectedSeries] = useState<'both' | 'net' | 'commission'>('both');
  const [hoveredRecord, setHoveredRecord] = useState<DayFinancialRecord | null>(null);

  // 14-day historical data generator
  const financialData: DayFinancialRecord[] = useMemo(() => {
    const records: DayFinancialRecord[] = [];
    const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const now = new Date();

    // Baseline historical distribution over 14 days
    const baseDailyEarnings = [
      380, 420, 510, 480, 390, 620, 560,
      440, 490, 530, 470, 610, 680,
      Math.max(350, driverEarningsTodayEgp),
    ];

    const baseTrips = [
      4, 5, 6, 6, 5, 8, 7,
      5, 6, 7, 6, 8, 9,
      Math.max(4, Math.round(driverEarningsTodayEgp / 80)),
    ];

    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayIndex = d.getDay();
      const dateKey = d.toISOString().split('T')[0];

      const gross = baseDailyEarnings[13 - i];
      const trips = baseTrips[13 - i];

      // Platform commission is 15% (or 0% for Day 0 if first trip free)
      const commissionRate = (i === 13 && !isFirstRideFreeUsed) ? 0 : 0.15;
      const commission = Math.round(gross * commissionRate);
      const net = gross - commission;
      const margin = Math.round((net / gross) * 100);

      records.push({
        dateStr: dateKey,
        dayLabel: i === 0 ? 'اليوم' : i === 1 ? 'أمس' : arabicDays[dayIndex],
        shortDate: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'numeric' }),
        grossIncome: gross,
        commissionDeducted: commission,
        netIncome: net,
        profitMarginPercent: margin,
        tripsCount: trips,
      });
    }

    return records;
  }, [driverEarningsTodayEgp, isFirstRideFreeUsed]);

  // Aggregate 14-day statistics
  const totalNet = useMemo(() => financialData.reduce((s, r) => s + r.netIncome, 0), [financialData]);
  const totalCommission = useMemo(() => financialData.reduce((s, r) => s + r.commissionDeducted, 0), [financialData]);
  const totalGross = useMemo(() => financialData.reduce((s, r) => s + r.grossIncome, 0), [financialData]);
  const avgMargin = Math.round((totalNet / totalGross) * 100);

  // Render D3 Line Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !isExpanded) return;

    const container = containerRef.current;
    const width = container.clientWidth || 440;
    const height = 210;
    const margin = { top: 20, right: 30, bottom: 30, left: 45 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const defs = svg.append('defs');

    // Net income gradient fill
    const netGradient = defs
      .append('linearGradient')
      .attr('id', 'netIncomeGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    netGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    netGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Commission gradient fill
    const commGradient = defs
      .append('linearGradient')
      .attr('id', 'commGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    commGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.25);
    commGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (14 days)
    const xScale = d3
      .scalePoint<string>()
      .domain(financialData.map((d) => d.shortDate))
      .range([0, innerWidth])
      .padding(0.1);

    // Y Scale (Amount in EGP)
    const maxVal = d3.max(financialData, (d) => Math.max(d.netIncome, d.grossIncome)) || 700;
    const yScale = d3
      .scaleLinear()
      .domain([0, Math.ceil((maxVal * 1.15) / 50) * 50])
      .range([innerHeight, 0])
      .nice();

    // Horizontal Grid Lines
    const gridAxis = d3.axisLeft(yScale).ticks(4).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'chart-grid')
      .call(gridAxis)
      .selectAll('line')
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.8);

    g.select('.chart-grid').select('.domain').remove();

    // D3 Line Generators
    const netLine = d3
      .line<DayFinancialRecord>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y((d) => yScale(d.netIncome))
      .curve(d3.curveMonotoneX);

    const netArea = d3
      .area<DayFinancialRecord>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.netIncome))
      .curve(d3.curveMonotoneX);

    const commLine = d3
      .line<DayFinancialRecord>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y((d) => yScale(d.commissionDeducted))
      .curve(d3.curveMonotoneX);

    const commArea = d3
      .area<DayFinancialRecord>()
      .x((d) => xScale(d.shortDate) ?? 0)
      .y0(innerHeight)
      .y1((d) => yScale(d.commissionDeducted))
      .curve(d3.curveMonotoneX);

    // Render Net Income Line & Area
    if (selectedSeries === 'both' || selectedSeries === 'net') {
      g.append('path')
        .datum(financialData)
        .attr('fill', 'url(#netIncomeGradient)')
        .attr('d', netArea);

      const netPath = g
        .append('path')
        .datum(financialData)
        .attr('fill', 'none')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.8)
        .attr('stroke-linecap', 'round')
        .attr('d', netLine);

      const netLen = netPath.node()?.getTotalLength() || 600;
      netPath
        .attr('stroke-dasharray', `${netLen} ${netLen}`)
        .attr('stroke-dashoffset', netLen)
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Points
      g.selectAll('.net-dot')
        .data(financialData)
        .enter()
        .append('circle')
        .attr('class', 'net-dot')
        .attr('cx', (d) => xScale(d.shortDate) ?? 0)
        .attr('cy', (d) => yScale(d.netIncome))
        .attr('r', 3.5)
        .attr('fill', '#059669')
        .attr('stroke', '#ecfdf5')
        .attr('stroke-width', 1.5);
    }

    // Render Commission Deductions Line & Area (15%)
    if (selectedSeries === 'both' || selectedSeries === 'commission') {
      g.append('path')
        .datum(financialData)
        .attr('fill', 'url(#commGradient)')
        .attr('d', commArea);

      const commPath = g
        .append('path')
        .datum(financialData)
        .attr('fill', 'none')
        .attr('stroke', '#f43f5e')
        .attr('stroke-width', 2)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', selectedSeries === 'both' ? '3 3' : 'none')
        .attr('d', commLine);

      const commLen = commPath.node()?.getTotalLength() || 600;
      commPath
        .attr('stroke-dasharray', `${commLen} ${commLen}`)
        .attr('stroke-dashoffset', commLen)
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);

      // Points
      g.selectAll('.comm-dot')
        .data(financialData)
        .enter()
        .append('circle')
        .attr('class', 'comm-dot')
        .attr('cx', (d) => xScale(d.shortDate) ?? 0)
        .attr('cy', (d) => yScale(d.commissionDeducted))
        .attr('r', 3)
        .attr('fill', '#f43f5e')
        .attr('stroke', '#fff1f2')
        .attr('stroke-width', 1.2);
    }

    // X Axis with every 2nd label to keep clean on mobile
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues(financialData.filter((_, idx) => idx % 2 === 0).map((d) => d.shortDate));

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9.5px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('dy', '1em');

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}ج`);

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').attr('stroke', '#334155');
    yAxisGroup
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '9px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif');

    // Interactive Hover Columns
    const colWidth = innerWidth / 14;
    financialData.forEach((d) => {
      const xPos = (xScale(d.shortDate) ?? 0) - colWidth / 2;
      g.append('rect')
        .attr('x', Math.max(0, xPos))
        .attr('y', 0)
        .attr('width', colWidth)
        .attr('height', innerHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredRecord(d))
        .on('mouseleave', () => setHoveredRecord(null));
    });

  }, [financialData, selectedSeries, isExpanded]);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-3.5 bg-slate-900/90 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                الصحة المالية وهوامش الربح (Financial Health)
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                14 يوماً
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              تتبع تقلبات صافي الدخل مقابل استقطاعات عمولة التطبيق (15%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-400">{avgMargin}%</span>
            <span className="text-slate-400">هامش ربحك</span>
          </div>
          <button
            type="button"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 flex flex-col gap-3.5 animate-fade-in">
          {/* Summary KPIs Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">صافي دخلك (14 يوم)</span>
              <div className="text-emerald-400 font-black text-sm tabular-nums mt-0.5">
                {totalNet.toLocaleString()} ج.م
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">عمولة التطبيق (15%)</span>
              <div className="text-rose-400 font-black text-sm tabular-nums mt-0.5">
                {totalCommission.toLocaleString()} ج.م
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">متوسط هامش الربح</span>
              <div className="text-teal-300 font-black text-sm tabular-nums mt-0.5">
                {avgMargin}% احتفاظ بالأجرة
              </div>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">مؤشر الصحة المالية</span>
              <div className="text-purple-300 font-black text-xs mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>ممتاز ومستقر</span>
              </div>
            </div>
          </div>

          {/* D3 Filter Series Tabs */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
              <span>رسم بياني D3.js لتحليل التقلبات:</span>
            </span>

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
              <button
                onClick={() => setSelectedSeries('both')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  selectedSeries === 'both' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                المؤشرين معاً
              </button>
              <button
                onClick={() => setSelectedSeries('net')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  selectedSeries === 'net' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                صافي الدخل
              </button>
              <button
                onClick={() => setSelectedSeries('commission')}
                className={`px-2 py-0.5 rounded font-bold transition-colors ${
                  selectedSeries === 'commission' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                استقطاع 15%
              </button>
            </div>
          </div>

          {/* D3 SVG Chart Container */}
          <div
            ref={containerRef}
            className="w-full relative bg-slate-900/60 rounded-xl border border-slate-800/80 pt-1 pb-2 overflow-hidden"
          >
            <svg ref={svgRef} className="overflow-visible block w-full"></svg>

            {/* Hover Floating Tooltip */}
            {hoveredRecord && (
              <div className="absolute top-2 left-2.5 bg-slate-900/95 border border-emerald-500/40 rounded-xl p-2.5 text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in pointer-events-none z-10">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">
                    {hoveredRecord.dayLabel} ({hoveredRecord.shortDate})
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-bold text-emerald-400">
                      صافي: {hoveredRecord.netIncome} ج.م
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="font-bold text-rose-400">
                      العمولة: {hoveredRecord.commissionDeducted} ج.م
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 border-r border-slate-800 pr-2">
                  <div>هامش الربح: <strong className="text-teal-300">{hoveredRecord.profitMarginPercent}%</strong></div>
                  <div>المشاوير: <strong className="text-white">{hoveredRecord.tripsCount}</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Profit Margin Insight Footer */}
          <div className="p-2.5 bg-emerald-950/20 border border-emerald-800/30 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
              <span>
                تحتفظ بـ <strong className="text-emerald-400 font-bold">85% من إجمالي الأجرة</strong> مباشرة في جيبك، مع رسوم خدمة ثابتة 15% تُخصم من المحفظة مسبقة الدفع.
              </span>
            </div>
            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:inline">تحديث فوري</span>
          </div>
        </div>
      )}
    </div>
  );
};
