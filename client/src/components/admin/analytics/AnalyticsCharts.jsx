import React, { useState } from 'react';

/**
 * Responsive SVG Trend Area Chart
 */
export function SimpleAreaChart({
  data = [],
  xKey = 'label',
  yKey = 'value',
  height = 240,
  strokeColor = '#1F8A82',
  fillGradientStart = 'rgba(31, 138, 130, 0.35)',
  fillGradientEnd = 'rgba(31, 138, 130, 0.02)',
  tooltipLabel = 'Visits'
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">
        No trend data available for this range
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = 0;
  const paddingX = 40;
  const paddingY = 25;
  const width = 600;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = height - paddingY - ((Number(d[yKey]) || 0) / maxVal) * chartHeight;
    return { x, y, data: d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  // Generate 4 horizontal grid lines
  const gridLines = [0, 0.33, 0.66, 1].map(ratio => {
    const y = height - paddingY - ratio * chartHeight;
    const val = Math.round(minVal + ratio * (maxVal - minVal));
    return { y, val };
  });

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillGradientStart} />
            <stop offset="100%" stopColor={fillGradientEnd} />
          </linearGradient>
        </defs>

        {/* Grid lines & Y-axis labels */}
        {gridLines.map((line, idx) => (
          <g key={idx}>
            <line
              x1={paddingX}
              y1={line.y}
              x2={width - paddingX}
              y2={line.y}
              stroke="#E5E7EB"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text
              x={paddingX - 8}
              y={line.y + 4}
              textAnchor="end"
              className="text-[10px] fill-gray-400 font-mono font-medium"
            >
              {line.val}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Line stroke */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots & interaction */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === idx ? 6 : 4}
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth={hoveredIndex === idx ? 3 : 2}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          </g>
        ))}

        {/* X-axis labels (sampled so they don't overlap) */}
        {points.map((p, idx) => {
          const step = Math.ceil(data.length / 7);
          const isKeyPoint = idx % step === 0 || idx === data.length - 1;
          if (!isKeyPoint) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 6}
              textAnchor="middle"
              className="text-[10px] fill-gray-500 font-medium"
            >
              {p.data[xKey]}
            </text>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-gray-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl -translate-x-1/2 -translate-y-full transition-all"
          style={{
            left: `${(points[hoveredIndex].x / width) * 100}%`,
            top: `${(points[hoveredIndex].y / height) * 100 - 8}%`
          }}
        >
          <div className="font-bold text-gray-200">{points[hoveredIndex].data[xKey]}</div>
          <div className="text-teal font-extrabold text-sm">
            {points[hoveredIndex].data[yKey]} {tooltipLabel}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Vertical Bar Chart
 */
export function SimpleBarChart({
  data = [],
  xKey = 'label',
  yKey = 'value',
  height = 220,
  barColor = '#1F8A82',
  onBarClick = null,
  activeKey = null
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm font-medium">
        No records available
      </div>
    );
  }

  const values = data.map(d => Number(d[yKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const width = 500;
  const paddingX = 30;
  const paddingBottom = 40;
  const paddingTop = 20;
  const chartHeight = height - paddingBottom - paddingTop;
  const availableWidth = width - paddingX * 2;
  const barWidth = Math.min(36, (availableWidth / data.length) * 0.65);
  const gap = availableWidth / data.length;

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible select-none"
      >
        {/* Horizontal Baseline */}
        <line
          x1={paddingX}
          y1={height - paddingBottom}
          x2={width - paddingX}
          y2={height - paddingBottom}
          stroke="#E5E7EB"
          strokeWidth="1.5"
        />

        {data.map((d, i) => {
          const val = Number(d[yKey]) || 0;
          const barH = (val / maxVal) * chartHeight;
          const x = paddingX + i * gap + (gap - barWidth) / 2;
          const y = height - paddingBottom - barH;
          const isSelected = activeKey && d[xKey] === activeKey;
          const isHovered = hoveredIndex === i;

          return (
            <g
              key={i}
              className={onBarClick ? 'cursor-pointer' : ''}
              onClick={() => onBarClick && onBarClick(d)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 3)}
                rx={5}
                fill={isSelected ? '#FF6F4D' : (isHovered ? '#186f68' : barColor)}
                className="transition-all duration-200"
              />

              {/* Value on top of bar */}
              {val > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-gray-700 font-mono"
                >
                  {val}
                </text>
              )}

              {/* Category label */}
              <text
                x={x + barWidth / 2}
                y={height - paddingBottom + 16}
                textAnchor="middle"
                className={`text-[10px] font-medium transition-colors ${
                  isSelected ? 'fill-coral font-bold' : 'fill-gray-500'
                }`}
              >
                {d[xKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Responsive Horizontal Bar Chart for Services
 */
export function SimpleHorizontalBarChart({
  data = [],
  labelKey = 'name',
  valueKey = 'completedVisits',
  secondaryKey = 'revenue',
  maxItems = 10,
  onItemClick = null
}) {
  const items = data.slice(0, maxItems);
  const values = items.map(d => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-gray-400 text-sm">
        No service visits recorded in this period.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const percent = Math.round((val / maxVal) * 100);

        return (
          <div
            key={idx}
            className={`p-3 rounded-2xl border transition-all ${
              onItemClick
                ? 'cursor-pointer hover:border-teal/50 hover:bg-teal/5'
                : 'bg-white border-gray-100'
            }`}
            onClick={() => onItemClick && onItemClick(item)}
          >
            <div className="flex justify-between items-center mb-1.5 text-xs font-bold text-ink">
              <span className="truncate pr-2">{item[labelKey]}</span>
              <div className="flex items-center gap-3 shrink-0">
                {secondaryKey && item[secondaryKey] !== undefined && (
                  <span className="text-teal font-mono">₹{item[secondaryKey].toLocaleString()}</span>
                )}
                <span className="bg-teal/10 text-teal px-2 py-0.5 rounded-full font-mono text-[11px]">
                  {val} visit{val === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Bar Track */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal to-[#16a085] h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Interactive SVG Donut Chart
 */
export function SimpleDonutChart({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  size = 200,
  strokeWidth = 32,
  centerTitle = 'Total',
  centerSubtitle = ''
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const colors = ['#1F8A82', '#FF6F4D', '#F39C12', '#9B59B6', '#3498DB', '#95A5A6'];
  const total = data.reduce((sum, d) => sum + (Number(d[valueKey]) || 0), 0);

  if (total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No recorded entries for this category
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = -90; // Start at 12 o'clock

  const slices = data.map((d, i) => {
    const val = Number(d[valueKey]) || 0;
    const fraction = total > 0 ? val / total : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const rotation = accumulatedAngle;
    accumulatedAngle += fraction * 360;
    const color = colors[i % colors.length];

    return {
      ...d,
      index: i,
      fraction,
      percentage: Math.round(fraction * 100),
      strokeDasharray,
      rotation,
      color
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice, i) => {
            if (slice.fraction === 0) return null;
            const isHovered = hoveredIdx === i;

            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={0}
                transform={`rotate(${slice.rotation} ${size / 2} ${size / 2})`}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {hoveredIdx !== null ? slices[hoveredIdx][labelKey] : centerTitle}
          </span>
          <span className="text-2xl font-black text-ink font-mono">
            {hoveredIdx !== null ? `${slices[hoveredIdx].percentage}%` : total}
          </span>
          {centerSubtitle && hoveredIdx === null && (
            <span className="text-[10px] text-gray-400 font-medium">{centerSubtitle}</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        {slices.map((slice, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className={`flex items-center justify-between gap-3 p-1.5 rounded-lg transition-colors cursor-pointer text-xs ${
              hoveredIdx === i ? 'bg-gray-100 font-bold' : ''
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-700 truncate">{slice[labelKey]}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 font-mono">
              <span className="font-bold text-ink">{slice[valueKey]}</span>
              <span className="text-gray-400 text-[10px]">({slice.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Weekly Rush Heatmap Grid
 * Rows: Monday to Sunday
 * Columns: Standard clinic time slots
 */
export function RushHeatmap({ heatmapData = [], onCellClick = null }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [hoveredCell, setHoveredCell] = useState(null);

  // Index heatmap cells by "day-slot"
  const cellMap = {};
  let maxCompleted = 0;
  heatmapData.forEach(cell => {
    const key = `${cell.day}-${cell.timeSlot}`;
    cellMap[key] = cell;
    if (cell.completed > maxCompleted) maxCompleted = cell.completed;
  });

  const slots = [
    '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  const getHeatmapColor = (count, max) => {
    if (count === 0 || max === 0) return '#F9FAFB'; // very light gray
    const ratio = count / max;
    if (ratio < 0.25) return '#E0F2F1'; // lightest teal
    if (ratio < 0.50) return '#80CBC4'; // light teal
    if (ratio < 0.75) return '#26A69A'; // medium teal
    if (ratio < 0.90) return '#00897B'; // deep teal
    return '#E65100'; // peak rush deep amber/coral
  };

  const getTextColor = (count, max) => {
    if (count === 0 || max === 0) return '#9CA3AF';
    const ratio = count / max;
    return ratio >= 0.5 ? '#FFFFFF' : '#111827';
  };

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="min-w-[720px]">
        {/* Header row with time slots */}
        <div className="grid grid-cols-[100px_repeat(14,_1fr)] gap-1 mb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
          <div className="text-left pl-2">Day</div>
          {slots.map(s => (
            <div key={s} className="truncate">
              {s.replace(':00', '').replace(' ', '')}
            </div>
          ))}
        </div>

        {/* Rows for each day */}
        {days.map(day => (
          <div key={day} className="grid grid-cols-[100px_repeat(14,_1fr)] gap-1 mb-1 items-center">
            <div className="text-xs font-bold text-ink pl-2 truncate">{day.slice(0, 3)}</div>
            {slots.map(slot => {
              const key = `${day}-${slot}`;
              const cell = cellMap[key] || { day, timeSlot: slot, completed: 0, scheduled: 0 };
              const count = cell.completed;
              const bgColor = getHeatmapColor(count, maxCompleted);
              const txtColor = getTextColor(count, maxCompleted);

              return (
                <div
                  key={slot}
                  onClick={() => onCellClick && onCellClick(cell)}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  style={{ backgroundColor: bgColor, color: txtColor }}
                  className="h-9 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-transform hover:scale-110 cursor-pointer shadow-2xs relative"
                  title={`${day} at ${slot}: ${count} completed visits`}
                >
                  {count > 0 ? count : '·'}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
          <span className="font-medium">
            Hover or click cells to inspect clinic patient density.
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">Low</span>
            <span className="w-4 h-4 rounded bg-[#E0F2F1] inline-block" />
            <span className="w-4 h-4 rounded bg-[#80CBC4] inline-block" />
            <span className="w-4 h-4 rounded bg-[#26A69A] inline-block" />
            <span className="w-4 h-4 rounded bg-[#00897B] inline-block" />
            <span className="w-4 h-4 rounded bg-[#E65100] inline-block" />
            <span className="text-[11px] text-gray-400">Peak Rush</span>
          </div>
        </div>
      </div>
    </div>
  );
}
