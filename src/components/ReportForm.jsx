/**
 * @file ReportForm.jsx
 * @description Component for logging new operational incidents with live validation.
 */
import React, { useState, useEffect, useRef } from 'react';
import { FileEdit, CheckCircle2, AlertCircle, Sparkles, Clock } from 'lucide-react';
import { validateInput } from '../utils/validateInput.js';

/**
 * ReportForm component allows venue staff to log incidents.
 * Invokes validateInput prior to submitting.
 * Displays real-time character counters, validation errors, and AI processing loaders.
 *
 * @param {Object} props
 * @param {Array} props.zones - Available stadium zones list for selection.
 * @param {Function} props.onSubmitIncident - Action handler to log incident.
 */
export function ReportForm({ zones, onSubmitIncident }) {
  const [description, setDescription] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const cooldownIntervalRef = useRef(null);
  const successTimerRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  // Set default selected zone when list loads
  useEffect(() => {
    if (zones.length > 0 && !selectedZone) {
      setSelectedZone(zones[0].name);
    }
  }, [zones, selectedZone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowSuccess(false);

    try {
      // 1. Validation phase (rejects empty/whitespace, checks length limit)
      const cleanDesc = validateInput(description);

      if (!selectedZone) {
        throw new Error('Please select a valid stadium zone.');
      }

      setIsSubmitting(true);

      // 2. Submit callback (triggers Groq classification & Firestore save)
      await onSubmitIncident(cleanDesc, selectedZone);

      // 3. Clear description and flash success state
      setDescription('');
      setShowSuccess(true);

      // Trigger 5-second cooldown
      setCooldown(5);
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
      cooldownIntervalRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownIntervalRef.current) {
              clearInterval(cooldownIntervalRef.current);
              cooldownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false);
        successTimerRef.current = null;
      }, 4000);
    } catch (err) {
      const isValidationError =
        err.message &&
        (err.message.includes('cannot be empty') ||
          err.message.includes('cannot exceed') ||
          err.message.includes('Input must be a string') ||
          err.message.includes('not allowed') ||
          err.message.includes('select a valid'));
      setError(isValidationError ? err.message : 'Something went wrong, please try again.');
      console.error('Error logging incident');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-850 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/20">
      <div className="mb-6 flex items-center gap-2">
        <FileEdit className="h-5 w-5 text-indigo-400" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-slate-100">Log Operations Incident</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Zone Selection */}
        <div>
          <label
            htmlFor="incident-zone"
            className="block text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Stadium Zone
          </label>
          <select
            id="incident-zone"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            disabled={isSubmitting}
            className="mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            {zones.map((zone) => (
              <option key={zone.id} value={zone.name}>
                {zone.name} (Crowd: {zone.crowdLevel}%)
              </option>
            ))}
          </select>
        </div>

        {/* Incident Description */}
        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="incident-desc"
              className="block text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              Raw Description
            </label>
            <span
              className={`text-[10px] font-bold ${description.length > 500 ? 'text-rose-500' : 'text-slate-500'}`}
            >
              {description.length} / 500 characters
            </span>
          </div>
          <textarea
            id="incident-desc"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            maxLength="500"
            placeholder="E.g., 'A liquid spill is creating a slick surface in front of concession booth B' or 'Large group blockading the entrance corridor.'"
            className="mt-1.5 block w-full rounded-lg border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 resize-none"
          />
        </div>

        {/* Error message Alert */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-2.5 text-xs font-semibold text-rose-500">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Success message Alert */}
        {showSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 text-xs font-semibold text-emerald-400 animate-fadeIn">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>Incident classified by Groq AI and logged in Firestore!</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || cooldown > 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-650 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-650/40 active:scale-[0.98] active:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Analyzing with AI...</span>
            </>
          ) : cooldown > 0 ? (
            <>
              <Clock className="h-4 w-4 text-slate-400 animate-pulse" aria-hidden="true" />
              <span>Cooldown: {cooldown}s</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-300" aria-hidden="true" />
              <span>Analyze &amp; Log Incident</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}

export default ReportForm;
