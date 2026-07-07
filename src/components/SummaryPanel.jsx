import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle2 } from 'lucide-react';
import { summarizeActivity } from '../ai/summarizeActivity.js';

/**
 * SummaryPanel component lets organizers run an AI compilation of the last hour's events.
 * It filters active logs, skips AI calls when zero incidents exist, and renders bullet points.
 *
 * @param {Object} props
 * @param {Array} props.incidents - Full incident documents list.
 */
export function SummaryPanel({ incidents }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    setSummary('');

    try {
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      // Filter incidents reported in the last 60 minutes
      const lastHourIncidents = incidents.filter((inc) => {
        const date = inc.reportedAt ? new Date(inc.reportedAt) : new Date(0);
        return date.getTime() >= oneHourAgo;
      });

      if (lastHourIncidents.length === 0) {
        // Optimize API consumption: skip the Groq call and set static summary
        setSummary('No incidents in the last hour. Operations normal.');
      } else {
        const result = await summarizeActivity(lastHourIncidents);
        setSummary(result);
      }
    } catch (error) {
      console.error('Failed to compile activity summary:', error);
      setSummary('- Failed to compile automated summary. Please review the live feed.');
    } finally {
      setLoading(false);
    }
  };

  // Parsing helper to split returned markdown string into separate bullet points safely
  const bulletPoints = summary
    ? summary
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.replace(/^[-*•]\s*/, '')) // strip bullet characters
    : [];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      {/* Panel title and actions */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-400" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-slate-100">AI Activity Summary</h2>
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-650 px-4 py-2 text-xs font-bold text-white shadow shadow-indigo-650/10 hover:bg-indigo-500 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-300" aria-hidden="true" />
          <span>Summarize Last Hour</span>
        </button>
      </div>

      {/* Summary report block */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/25 p-5 min-h-[110px] flex flex-col justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-slate-350">Generating summary...</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Groq Llama-3.3-70B is analyzing hourly logs.
            </p>
          </div>
        ) : summary ? (
          <div>
            {bulletPoints.length === 1 && bulletPoints[0].includes('No incidents') ? (
              <div className="flex items-center gap-2.5 text-sm text-emerald-450 font-semibold py-2">
                <CheckCircle2
                  className="h-5 w-5 text-emerald-500 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{bulletPoints[0]}</span>
              </div>
            ) : (
              <ul className="space-y-3" aria-label="Incident summary bullet points">
                {bulletPoints.map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2.5 text-sm text-slate-300 leading-normal font-normal"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500"
                      aria-hidden="true"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="py-2 text-center text-xs text-slate-550 italic font-medium">
            Click &quot;Summarize Last Hour&quot; to compile a GenAI report of recent operations.
          </div>
        )}
      </div>
    </section>
  );
}

export default SummaryPanel;
