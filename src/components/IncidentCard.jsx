/**
 * @file IncidentCard.jsx
 * @description Component to render detailed status cards for logged operations incidents.
 */
import React from 'react';
import {
  Users,
  ShieldAlert,
  Activity,
  Wrench,
  UserX,
  HelpCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

// Maps incident categories to icons, labels and HSL background classes
const categoryMap = {
  crowd_control: {
    label: 'Crowd Control',
    icon: Users,
    styles: 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400',
  },
  medical: {
    label: 'Medical Emergency',
    icon: Activity,
    styles: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400',
  },
  security: {
    label: 'Security Alert',
    icon: ShieldAlert,
    styles: 'bg-rose-950/20 border-rose-500/30 text-rose-400',
  },
  facility: {
    label: 'Facility Issue',
    icon: Wrench,
    styles: 'bg-amber-950/20 border-amber-500/30 text-amber-400',
  },
  lost_person: {
    label: 'Lost Person',
    icon: UserX,
    styles: 'bg-purple-950/20 border-purple-500/30 text-purple-400',
  },
  unclassified: {
    label: 'Needs Review',
    icon: HelpCircle,
    styles: 'bg-slate-850/20 border-slate-700/30 text-slate-400',
  },
};

// Maps severity levels to colors, icons and labels
const severityMap = {
  high: {
    label: 'High Severity',
    icon: AlertCircle,
    styles: 'bg-rose-950/30 border-rose-500/40 text-rose-300',
  },
  medium: {
    label: 'Medium Severity',
    icon: AlertTriangle,
    styles: 'bg-amber-950/30 border-amber-500/40 text-amber-300',
  },
  low: {
    label: 'Low Severity',
    icon: Info,
    styles: 'bg-sky-950/30 border-sky-500/40 text-sky-300',
  },
  unclassified: {
    label: 'Unclassified',
    icon: HelpCircle,
    styles: 'bg-slate-950/30 border-slate-700/40 text-slate-300',
  },
};

/**
 * Renders detail of a single incident.
 * Contains action buttons to Acknowledge or Resolve it, using tailored accessible labels.
 *
 * @param {Object} props
 * @param {Object} props.incident - Incident record.
 * @param {Function} props.onAcknowledge - Action callback.
 * @param {Function} props.onResolve - Action callback.
 */
export function IncidentCard({ incident, onAcknowledge, onResolve }) {
  const categoryInfo = categoryMap[incident.category] || categoryMap.unclassified;
  const severityInfo = severityMap[incident.severity] || severityMap.unclassified;

  const CategoryIcon = categoryInfo.icon;
  const SeverityIcon = severityInfo.icon;

  const formattedTime = incident.reportedAt
    ? incident.reportedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Unknown Time';

  const statusColors = {
    open: 'bg-red-500/10 text-red-400 border-red-500/20',
    acknowledged: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    resolved: 'bg-slate-800/40 text-slate-400 border-slate-850',
  };

  // Compose dynamic aria-label text based on incident summary and location
  const summaryText = incident.summary || incident.rawText;
  const ackAriaLabel = `Acknowledge incident: ${summaryText} at ${incident.zone}`;
  const resolveAriaLabel = `Resolve incident: ${summaryText} at ${incident.zone}`;

  return (
    <article className="group rounded-xl border border-slate-800 bg-slate-900/30 p-5 shadow-md shadow-slate-950/10 transition-all duration-200 hover:border-slate-700/80">
      {/* Category, Severity, and Status badging row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${categoryInfo.styles}`}
          >
            <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{categoryInfo.label}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${severityInfo.styles}`}
          >
            <SeverityIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{severityInfo.label}</span>
          </div>
        </div>

        <div>
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColors[incident.status]}`}
          >
            {incident.status}
          </span>
        </div>
      </div>

      {/* Main Incident details */}
      <div className="mt-3">
        <h3 className="text-base font-bold text-slate-100 leading-tight">
          {incident.summary || 'Pending Summary'}
        </h3>
        <p className="mt-1.5 text-sm text-slate-400 leading-relaxed font-normal">
          {incident.rawText}
        </p>
      </div>

      {/* Location, Timestamp, and Action Button Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/40 pt-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
            <span>{incident.zone}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <span>{formattedTime}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {incident.status === 'open' && (
            <button
              onClick={() => onAcknowledge(incident.id)}
              className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all hover:bg-amber-500/20 hover:text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={ackAriaLabel}
            >
              Acknowledge
            </button>
          )}

          {incident.status !== 'resolved' && (
            <button
              onClick={() => onResolve(incident.id)}
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label={resolveAriaLabel}
            >
              Resolve
            </button>
          )}

          {incident.status === 'resolved' && (
            <span className="flex items-center gap-1 text-slate-500 font-bold px-2 py-1 bg-slate-800/20 rounded border border-slate-850">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
              <span>Resolved</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default IncidentCard;
