import React, { useState } from 'react';
import { Volume2, Copy, Check, AlertCircle, Sparkles, Clock, FileText } from 'lucide-react';
import { validateInput } from '../utils/validateInput.js';

/**
 * AnnouncementDrafter component lets organizers write events and draft PA scripts via Groq.
 * Renders character counters, validates inputs, and outputs live logs from Firestore.
 *
 * @param {Object} props
 * @param {Array} props.announcements - Latest 5 announcement records from the hook.
 * @param {boolean} props.loading - Fetching status from the hook.
 * @param {Function} props.onCreateAnnouncement - Action callback.
 */
export function AnnouncementDrafter({ announcements, loading, onCreateAnnouncement }) {
  const [situation, setSituation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestDraft, setLatestDraft] = useState(null);
  const [copied, setCopied] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLatestDraft(null);
    setCopied(false);

    try {
      // 1. Validation Phase
      const cleanInput = validateInput(situation);

      if (cleanInput.length > 300) {
        throw new Error('Situation description cannot exceed 300 characters.');
      }

      setIsSubmitting(true);

      // 2. Trigger drafting and db insertion
      const record = await onCreateAnnouncement(cleanInput);
      setLatestDraft(record);
      setSituation('');

      // Trigger 5-second cooldown
      setCooldown(5);
      const cooldownInterval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const isValidationError =
        err.message &&
        (err.message.includes('cannot be empty') ||
          err.message.includes('cannot exceed') ||
          err.message.includes('Input must be a string') ||
          err.message.includes('not allowed'));
      setError(isValidationError ? err.message : 'Something went wrong, please try again.');
      console.error('Error drafting announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
      });
  };

  return (
    <section className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-indigo-400" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-100">AI Announcement Drafter</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Situation Description Input */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="situation-desc"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Describe the situation
            </label>
            <span
              id="char-count-ann"
              className={`text-[10px] font-bold ${situation.length > 300 ? 'text-rose-450' : 'text-slate-500'}`}
              aria-live="polite"
            >
              {situation.length} / 300 characters
            </span>
          </div>
          <textarea
            id="situation-desc"
            rows="3"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            disabled={isSubmitting}
            aria-describedby="char-count-ann"
            placeholder="E.g., 'Gate 2 is heavily congested, redirect incoming ticket holders to Gate 3.'"
            className="mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-650 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Error message Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-semibold text-rose-450 animate-fadeIn">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || cooldown > 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-650 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-650/40 active:scale-[0.98] active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden="true"
              />
              <span>Drafting Announcement...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock className="h-4 w-4 text-slate-400 animate-pulse" aria-hidden="true" />
              <span>Cooldown: {cooldown}s</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-350 animate-pulse" aria-hidden="true" />
              <span>Draft Announcement</span>
            </>
          )}
        </button>
      </form>

      {/* Latest Output Card */}
      {latestDraft && (
        <div
          aria-live="polite"
          className="mt-5 rounded-xl border border-slate-800 bg-slate-950/20 p-4 shadow-inner"
        >
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Drafted PA Script
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[9px] text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {(() => {
                  const dateVal =
                    latestDraft.timestamp instanceof Date
                      ? latestDraft.timestamp
                      : latestDraft.timestamp?.toDate
                        ? latestDraft.timestamp.toDate()
                        : new Date(latestDraft.timestamp);
                  return dateVal.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                })()}
              </span>

              <button
                onClick={() => handleCopy(latestDraft.text)}
                className="flex items-center gap-1 rounded bg-slate-850 hover:bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                aria-label="Copy announcement to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-400" aria-hidden="true" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-200 font-medium leading-relaxed italic border-l-2 border-indigo-500 pl-3 bg-indigo-950/5 py-1">
            &quot;{latestDraft.text}&quot;
          </p>
        </div>
      )}

      {/* Scrollable Broadcast Log */}
      <div className="mt-6 border-t border-slate-805 pt-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-slate-500" aria-hidden="true" />
          Recent Announcements (Log)
        </h3>

        {loading ? (
          <div className="py-4 text-center text-xs text-slate-500 animate-pulse">
            Loading logs...
          </div>
        ) : announcements.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-650 italic font-medium">
            No announcements logged yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="rounded-lg border border-slate-850 bg-slate-950/10 p-3 text-xs flex flex-col gap-1.5 hover:border-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                  <span className="truncate max-w-[160px] text-slate-400 font-medium">
                    Situation: &quot;{ann.situationInput}&quot;
                  </span>
                  <span>
                    {ann.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-350 leading-relaxed font-normal">{ann.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default AnnouncementDrafter;
