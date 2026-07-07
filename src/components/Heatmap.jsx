import React from 'react';
import { Users, AlertTriangle } from 'lucide-react';

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
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
        <h2 className="mb-4 text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400 animate-pulse" />
          Loading Live Crowd Levels...
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-xl bg-slate-800/40 border border-slate-800"
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-100">Live Crowd Heatmap</h2>
        </div>

        {/* Color Legend (Accessibility: Pairing colors with explicit text) */}
        <div className="flex flex-wrap gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Low (&lt;50%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Moderate (50-75%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Critical (&gt;75%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map((zone) => {
          const level = zone.crowdLevel;
          let themeClasses = '';
          let barBg = '';
          let flowText = '';

          if (level < 50) {
            themeClasses = 'border-emerald-500/20 bg-emerald-950/10 text-emerald-400';
            barBg = 'bg-emerald-500';
            flowText = 'Low / Normal Flow';
          } else if (level <= 75) {
            themeClasses = 'border-amber-500/20 bg-amber-950/10 text-amber-400';
            barBg = 'bg-amber-500';
            flowText = 'Moderate / Heavy Flow';
          } else {
            themeClasses = 'border-rose-500/20 bg-rose-950/10 text-rose-400';
            barBg = 'bg-rose-500';
            flowText = 'Critical / Surge Risk';
          }

          // Calculate occupants estimated based on percentage of max capacity
          const estOccupants = Math.round((level / 100) * zone.capacity);

          return (
            <div
              key={zone.id}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${themeClasses}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm tracking-wide">
                    {zone.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Est. Crowd:{' '}
                    <span className="font-semibold text-slate-200">
                      {estOccupants.toLocaleString()}
                    </span>{' '}
                    / {zone.capacity.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xl font-extrabold tracking-tight">{level}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {flowText.split(' / ')[0]}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="mt-4 h-2 w-full rounded-full bg-slate-950/40 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${barBg} transition-all duration-1000 ease-in-out`}
                  style={{ width: `${level}%` }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span>Updated {zone.lastUpdated.toLocaleTimeString()}</span>
                {level > 75 && (
                  <span className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                    <AlertTriangle className="h-3.5 w-3.5" /> High Risk
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Heatmap;
