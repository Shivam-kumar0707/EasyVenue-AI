import React, { useState, useMemo } from 'react';
import { generateSparklinePath } from '../utils/generateSparklinePath.js';
import { getTrendDescription } from '../utils/trendDesc.js';

/**
 * TrendSparkline component renders a small custom SVG sparkline chart.
 * Uses getTrendDescription for screen-reader friendly verbal descriptions.
 * Features downsampled focusable data circles for tooltips to avoid keyboard traps.
 *
 * @param {Object} props
 * @param {string} props.zoneName - Name of the zone (e.g. Gate 1).
 * @param {Array<{crowdLevel: number, timestamp: Date}>} props.history - Chronological crowd level logs.
 * @param {number} props.currentLevel - The latest crowd level percentage.
 */
export function TrendSparkline({ zoneName, history, currentLevel }) {
  const [activePoint, setActivePoint] = useState(null);

  const width = 180;
  const height = 45;

  // Convert points to SVG coordinates (memoized)
  const { linePath, areaPath } = useMemo(() => {
    return generateSparklinePath(history, width, height);
  }, [history, width, height]);

  // Verbal description for screen readers (memoized)
  const trendAriaLabel = useMemo(() => {
    return getTrendDescription(zoneName, history);
  }, [zoneName, history]);

  // Downsample the history to maximum 6 data points to prevent keyboard tab traps (memoized)
  const interactivePoints = useMemo(() => {
    const limit = 6;
    if (!history || history.length === 0) return [];
    return history.length <= limit
      ? history.map((p, i) => ({ ...p, originalIndex: i }))
      : Array.from({ length: limit }, (_, i) => {
          const originalIndex = Math.round(i * ((history.length - 1) / (limit - 1)));
          return {
            ...history[originalIndex],
            originalIndex,
          };
        });
  }, [history]);

  if (!history || history.length === 0) {
    return (
      <div className="mt-4 pt-4 border-t border-slate-800/40 text-center text-[10px] text-slate-500 italic font-semibold">
        Gathering crowd trend history...
      </div>
    );
  }

  // Color theme mapping
  let strokeColorClass = 'text-emerald-400';
  let tooltipValueClass = 'text-emerald-400';

  if (currentLevel >= 50 && currentLevel <= 75) {
    strokeColorClass = 'text-amber-400';
    tooltipValueClass = 'text-amber-400';
  } else if (currentLevel > 75) {
    strokeColorClass = 'text-rose-450';
    tooltipValueClass = 'text-rose-450';
  }

  return (
    <div className="relative mt-4 pt-4 border-t border-slate-850/40 flex flex-col items-center">
      {/* Tooltip display */}
      {activePoint && (
        <div
          className="absolute bottom-[52px] bg-slate-950/95 border border-slate-800 rounded px-2.5 py-1 text-[10px] text-slate-100 shadow-xl shadow-black/60 pointer-events-none whitespace-nowrap animate-fadeIn flex flex-col items-center z-10"
          role="tooltip"
        >
          <span className={`font-bold ${tooltipValueClass}`}>{activePoint.crowdLevel}%</span>
          <span className="text-[9px] text-slate-500 mt-0.5">
            {activePoint.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* SVG Sparkline */}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="overflow-visible"
        aria-label={trendAriaLabel}
        role="img"
        tabIndex="0"
      >
        <defs>
          <linearGradient
            id={`gradient-${zoneName.replace(/\s+/g, '')}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Closed Area */}
        {areaPath && (
          <path
            d={areaPath}
            className={`${strokeColorClass} fill-current`}
            style={{ fill: `url(#gradient-${zoneName.replace(/\s+/g, '')})` }}
          />
        )}

        {/* Sparkline Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            className={`${strokeColorClass} stroke-current`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Hover/Focus interactive circles */}
        {interactivePoints.map((point, i) => {
          const originalIdx = point.originalIndex;
          const cx = history.length > 1 ? (originalIdx / (history.length - 1)) * width : 0;
          const cy = height - (point.crowdLevel / 100) * height;

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="4.5"
              className={`${strokeColorClass} fill-slate-950 stroke-current stroke-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity duration-150`}
              tabIndex="0"
              onFocus={() => setActivePoint(point)}
              onBlur={() => setActivePoint(null)}
              onMouseEnter={() => setActivePoint(point)}
              onMouseLeave={() => setActivePoint(null)}
              aria-label={`Point ${i + 1}: ${point.crowdLevel}% at ${point.timestamp.toLocaleTimeString()}`}
            />
          );
        })}
      </svg>

      <span className="mt-2 text-[8px] font-bold tracking-widest uppercase text-slate-500/80">
        30-Min Crowd Trend
      </span>
    </div>
  );
}

export default TrendSparkline;
