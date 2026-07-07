import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * AlertBanner component displays critical crowd anomalies and AI recommendations.
 * Uses semantic accessibility attributes (role="alert", aria-live="polite").
 * @param {Object} props
 * @param {Object} props.alert - The active alert details.
 * @param {Function} props.onDismiss - Callback to clear/dismiss the banner.
 */
export function AlertBanner({ alert, onDismiss }) {
  if (!alert) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/30 bg-amber-500/10 px-5 py-4 rounded-xl backdrop-blur-md shadow-lg shadow-amber-500/5 animate-pulse"
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0 text-amber-500" aria-hidden="true">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-amber-400 uppercase">
            Crowd Anomaly Detected — {alert.zoneName}
          </h2>
          <p className="mt-1 text-sm text-slate-200">
            Crowd level surged from{' '}
            <span className="font-bold text-amber-500">{alert.beforeValue}%</span> to{' '}
            <span className="font-bold text-amber-500">{alert.afterValue}%</span>.
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              AI Action Plan:
            </span>
            <span>{alert.recommendation}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onDismiss}
        className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label={`Dismiss anomaly alert for ${alert.zoneName}`}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

export default AlertBanner;
