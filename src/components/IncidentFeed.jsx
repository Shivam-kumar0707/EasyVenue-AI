/**
 * @file IncidentFeed.jsx
 * @description Component displaying lists of logged incidents with status filter tabs.
 */
import React, { useState, useMemo } from 'react';
import { ShieldAlert, Inbox, CheckCircle2 } from 'lucide-react';
import { IncidentCard } from './IncidentCard.jsx';

/**
 * IncidentFeed component displays the list of logs, sorted by severity and time.
 * Provides custom status tabs (Active, Resolved, All) and handles empty states.
 *
 * @param {Object} props
 * @param {Array} props.incidents - Sorted incidents list from custom hook.
 * @param {boolean} props.loading - Loading state from hook.
 * @param {Function} props.onAcknowledge - Action trigger.
 * @param {Function} props.onResolve - Action trigger.
 */
export function IncidentFeed({ incidents, loading, onAcknowledge, onResolve }) {
  const [filter, setFilter] = useState('active'); // 'active' | 'resolved' | 'all'

  // Filter criteria logic (memoized)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      if (filter === 'active') return inc.status !== 'resolved';
      if (filter === 'resolved') return inc.status === 'resolved';
      return true;
    });
  }, [incidents, filter]);

  // Count active and resolved incidents in a single memoized pass
  const { activeCount, resolvedCount } = useMemo(() => {
    let active = 0;
    let resolved = 0;
    incidents.forEach((inc) => {
      if (inc.status === 'resolved') {
        resolved++;
      } else {
        active++;
      }
    });
    return { activeCount: active, resolvedCount: resolved };
  }, [incidents]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
        <h2 className="mb-4 text-lg font-semibold text-slate-100 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400 animate-pulse" />
          Loading Incident Feed...
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl bg-slate-800/40 border border-slate-800"
            />
          ))}
        </div>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      {/* Feed header controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-100">Live Incident Feed</h2>
        </div>

        {/* Tab Filters */}
        <div className="flex rounded-lg bg-slate-950/40 p-1 border border-slate-850 text-[11px] font-bold">
          <button
            onClick={() => setFilter('active')}
            className={`rounded-md px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              filter === 'active'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`rounded-md px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              filter === 'resolved'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 transition-all duration-200 cursor-pointer ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow shadow-indigo-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({incidents.length})
          </button>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
        {filteredIncidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/10 py-12 text-center px-4">
            {filter === 'active' ? (
              <>
                <CheckCircle2 className="h-10 w-10 text-emerald-500/80 mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-300">No active incidents</p>
                <p className="text-xs text-slate-500 mt-1">
                  Operations are currently normal across all zones.
                </p>
              </>
            ) : (
              <>
                <Inbox className="h-10 w-10 text-slate-600 mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-300">No incidents in feed</p>
                <p className="text-xs text-slate-500 mt-1">
                  There are no records matching the filter.
                </p>
              </>
            )}
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default IncidentFeed;
