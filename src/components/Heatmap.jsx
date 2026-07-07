/**
 * @file Heatmap.jsx
 * @description Component rendering live stadium zone cards, capacities, and visual crowd levels.
 */
import React from 'react';
import { Users } from 'lucide-react';
import { ZoneCard } from './ZoneCard.jsx';

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
