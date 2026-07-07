import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { useZoneHistory } from '../hooks/useZoneHistory.js';
import { TrendSparkline } from './TrendSparkline.jsx';

/**
 * Sub-component to render an individual Zone Card.
 * Invokes the useZoneHistory hook to load real-time trend data.
 *
 * @param {Object} props
 * @param {Object} props.zone - Stadium zone object.
 */
function ZoneCard({ zone }) {
  const { history } = useZoneHistory(zone.id);

  const level = zone.crowdLevel;
  let themeClasses = '';
  let barBg = '';
  let flowText = '';

  if (level < 50) {
    themeClasses =
      'border-emerald-500/15 bg-emerald-950/15 text-emerald-400 hover:border-emerald-500/30';
    barBg = 'bg-gradient-to-r from-emerald-600 to-emerald-400';
    flowText = 'Low / Normal Flow';
  } else if (level <= 75) {
    themeClasses = 'border-amber-500/15 bg-amber-950/15 text-amber-400 hover:border-amber-500/30';
    barBg = 'bg-gradient-to-r from-amber-600 to-amber-400';
    flowText = 'Moderate / Heavy Flow';
  } else {
    themeClasses = 'border-rose-500/15 bg-rose-950/15 text-rose-450 hover:border-rose-500/30';
    barBg = 'bg-gradient-to-r from-rose-600 to-rose-400';
    flowText = 'Critical / Surge Risk';
  }

  // Calculate occupants estimated based on percentage of max capacity
  const estOccupants = Math.round((level / 100) * zone.capacity);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-lg shadow-slate-950/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-slate-950/20 ${themeClasses}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-slate-100 text-sm tracking-wide">{zone.name}</h3>
          <p className="mt-1 text-[11px] sm:text-xs text-slate-400/90">
            Est. Crowd:{' '}
            <span className="font-semibold text-slate-200">{estOccupants.toLocaleString()}</span> /{' '}
            {zone.capacity.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100 leading-none">
            {level}%
          </span>
          <span className="text-[9px] font-extrabold uppercase tracking-widest opacity-90 mt-1">
            {flowText.split(' / ')[0]}
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-950/50 overflow-hidden border border-slate-900/60 p-[1.5px]">
        <div
          className={`h-full rounded-full ${barBg} transition-all duration-500 ease-out shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]`}
          style={{ width: `${level}%` }}
        />
      </div>

      {/* Interactive historical sparkline */}
      <TrendSparkline zoneName={zone.name} history={history} currentLevel={level} />

      <div className="mt-4 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/30 pt-3">
        <span className="font-medium text-slate-500/80">
          Updated {zone.lastUpdated.toLocaleTimeString()}
        </span>
        {level > 75 && (
          <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" /> High Risk
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Heatmap component renders a grid of zone cards.
 * Color codes zones based on crowd Level (green <50%, amber 50-75%, red >75%).
 * Pairs colors with clear textual labels and numbers for accessibility.
 * Uses a smooth transition when values change.
 *
 * @param {Object} props
 * @param {Array} props.zones - List of zones.
 * @param {boolean} props.loading - Whether the zones are loading.
 */
export function Heatmap({ zones, loading }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
        <h2 className="mb-4 text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400 animate-pulse" />
          Loading Live Crowd Levels...
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl bg-slate-850/40 border border-slate-800/60"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-100">Live Crowd Heatmap</h2>
        </div>

        {/* Color Legend (Accessibility: Pairing colors with explicit text) */}
        <div className="flex flex-wrap gap-2 sm:gap-4 text-[11px] sm:text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Low (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Moderate (50-75%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.05)]">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Critical (&gt;75%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}
      </div>
    </section>
  );
}

export default Heatmap;
