import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../../context/AppContext';
import {
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Percent,
  Compass,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CircularMetricProps {
  label: string;
  sublabel: string;
  value: number; // percentage (0 - 100)
  displayValue: string;
  color: string;
  statusBadge: string;
}

const CircularDonutGauge: React.FC<CircularMetricProps> = ({
  label,
  sublabel,
  value,
  displayValue,
  color,
  statusBadge,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 84;
    const height = 84;
    const radius = Math.min(width, height) / 2;
    const thickness = 8;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', width).attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Background track arc
    const arcBackground = d3
      .arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    g.append('path')
      .attr('d', arcBackground as any)
      .attr('fill', '#1e293b');

    // Foreground animated value arc
    const arcForeground = d3
      .arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius)
      .cornerRadius(4)
      .startAngle(0);

    const targetAngle = (Math.min(100, Math.max(0, value)) / 100) * 2 * Math.PI;

    const foregroundPath = g
      .append('path')
      .attr('fill', color)
      .datum({ endAngle: 0 });

    foregroundPath
      .transition()
      .duration(950)
      .ease(d3.easeCubicOut)
      .attrTween('d', function (d: any) {
        const interpolate = d3.interpolate(d.endAngle, targetAngle);
        return function (t: number) {
          d.endAngle = interpolate(t);
          return (arcForeground as any)(d);
        };
      });
  }, [value, color]);

  return (
    <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all">
      <div className="relative flex items-center justify-center">
        <svg ref={svgRef} className="block overflow-visible" />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs font-black text-white font-mono tracking-tight tabular-nums">
            {displayValue}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center">
        <span className="text-xs font-bold text-slate-200">{label}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">{sublabel}</span>
        <span
          className="mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {statusBadge}
        </span>
      </div>
    </div>
  );
};

export const CaptainPerformanceCard: React.FC = () => {
  const { captainScore, completedRidesCountToday, pastRides } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Dynamic calculations based on activity
  const completedTotal = Math.max(pastRides.length, completedRidesCountToday);
  const acceptanceRate = 96; // 96%
  const waitTimeMinutes = 2.3; // 2.3 mins
  const completionRate = 99.2; // 99.2%
  const ratingPercent = Math.round((captainScore / 5) * 100);

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed((prev) => !prev)}
        className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white">
                لوحة ملخص أداء الكابتن (Performance KPIs)
              </h3>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-bold">
                رسوم دائرية D3
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              مؤشرات الجودة والالتزام لضمان الأولوية في استقبال المشاوير
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
        >
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Gauges Grid */}
      {!isCollapsed && (
        <div className="p-3.5 sm:p-4 flex flex-col gap-3 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* KPI 1: معدل قبول الطلبات */}
            <CircularDonutGauge
              label="قبول الطلبات"
              sublabel="نسبة الموافقة الفورية"
              value={acceptanceRate}
              displayValue={`${acceptanceRate}%`}
              color="#10b981"
              statusBadge="ممتاز (فوق 90%)"
            />

            {/* KPI 2: متوسط وقت الانتظار */}
            <CircularDonutGauge
              label="وقت الانتظار"
              sublabel="سرعة الوصول للراكب"
              value={Math.round((5 - waitTimeMinutes) * 20)} // 5 min max scale
              displayValue={`${waitTimeMinutes} د`}
              color="#06b6d4"
              statusBadge="فائق السرعة ⚡"
            />

            {/* KPI 3: معدل إتمام الرحلات */}
            <CircularDonutGauge
              label="إتمام الرحلات"
              sublabel="الرحلات المكتملة بدون إلغاء"
              value={completionRate}
              displayValue={`${completionRate}%`}
              color="#8b5cf6"
              statusBadge="التزام استثنائي"
            />

            {/* KPI 4: تقييم الركاب الإجمالي */}
            <CircularDonutGauge
              label="التقييم العام"
              sublabel="متوسط ثقة الركاب"
              value={ratingPercent}
              displayValue={`★ ${captainScore}`}
              color="#f59e0b"
              statusBadge="كابتن متميز 🏆"
            />
          </div>

          {/* Performance Tier Note */}
          <div className="p-2.5 bg-purple-950/20 border border-purple-900/40 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                أداؤك الحالي يؤهلك لـ <strong className="text-purple-300 font-bold">الفئة الذهبية (Gold Tier)</strong>: أولوية في الطلبات القريبة وخصم 50% على عمولات المشاوير عند دعوة الأصدقاء!
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold shrink-0 hidden sm:inline">مستوى ممتاز</span>
          </div>
        </div>
      )}
    </div>
  );
};
