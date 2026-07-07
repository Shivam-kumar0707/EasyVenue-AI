import React, { useEffect } from 'react';
import { Shield, Radio, Activity } from 'lucide-react';
import { useLiveCrowdData } from '../hooks/useLiveCrowdData.js';
import { useIncidents } from '../hooks/useIncidents.js';
import { seedIfEmpty } from '../utils/seedDemoData.js';
import { AlertBanner } from '../components/AlertBanner.jsx';
import { Heatmap } from '../components/Heatmap.jsx';
import { ReportForm } from '../components/ReportForm.jsx';
import { IncidentFeed } from '../components/IncidentFeed.jsx';
import { SummaryPanel } from '../components/SummaryPanel.jsx';
import { AnnouncementDrafter } from '../components/AnnouncementDrafter.jsx';
import { useAnnouncements } from '../hooks/useAnnouncements.js';

/**
 * EasyVenue AI Organizer & Venue Staff Dashboard Page.
 * Seeds data if necessary, sets up the live subscriptions, and structures the semantic layout grid.
 */
export function Dashboard() {
  // 1. Seed demo database on mount
  useEffect(() => {
    seedIfEmpty();
  }, []);

  // 2. Fetch live data streams from hooks
  const { zones, loading: zonesLoading, activeAlert, dismissAlert } = useLiveCrowdData();
  const {
    incidents,
    loading: incidentsLoading,
    addIncident,
    acknowledgeIncident,
    resolveIncident,
  } = useIncidents();

  const { announcements, loading: announcementsLoading, createAnnouncement } = useAnnouncements();

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col font-sans selection:bg-indigo-550 selection:text-white antialiased">
      {/* Header bar with Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-900 bg-[#080b11]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Branding Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-650/15 border border-indigo-500/30 text-indigo-400">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white m-0 leading-none">
                  EasyVenue <span className="text-indigo-400">AI</span>
                </h1>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Stadium Operations Center
                </p>
              </div>
            </div>

            {/* Live Badges (Status visual markers) */}
            <nav className="flex items-center gap-2" aria-label="System status">
              <div className="hidden md:flex items-center gap-1.5 rounded-full bg-slate-950/60 border border-slate-850 px-3 py-1.5 text-xs font-bold text-slate-400">
                <span
                  className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"
                  aria-hidden="true"
                />
                <span>Simulated Live Data</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-slate-950/60 border border-slate-850 px-3 py-1.5 text-[10px] sm:text-xs font-bold text-slate-400">
                <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" aria-hidden="true" />
                <span className="sm:inline hidden">FIFA World Cup 2026</span>
                <span className="sm:hidden inline">WC '26</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Dismissible Crowd Surge alert banner */}
        <AlertBanner alert={activeAlert} onDismiss={dismissAlert} />

        {/* Mobile / Tablet Stacking Layout (hidden on desktop lg) */}
        <div className="flex flex-col gap-6 lg:hidden">
          <Heatmap zones={zones} loading={zonesLoading} />
          <ReportForm zones={zones} onSubmitIncident={addIncident} />
          <AnnouncementDrafter
            announcements={announcements}
            loading={announcementsLoading}
            onCreateAnnouncement={createAnnouncement}
          />
          <IncidentFeed
            incidents={incidents}
            loading={incidentsLoading}
            onAcknowledge={acknowledgeIncident}
            onResolve={resolveIncident}
          />
          <SummaryPanel incidents={incidents} />
        </div>

        {/* Desktop Layout (lg and above) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Main Column: Heatmap and AI Summary compilation */}
          <div className="lg:col-span-2 space-y-6">
            <Heatmap zones={zones} loading={zonesLoading} />
            <SummaryPanel incidents={incidents} />
          </div>

          {/* Sidebar Column: Log Incident & Incident Feed */}
          <div className="space-y-6">
            <ReportForm zones={zones} onSubmitIncident={addIncident} />
            <AnnouncementDrafter
              announcements={announcements}
              loading={announcementsLoading}
              onCreateAnnouncement={createAnnouncement}
            />
            <IncidentFeed
              incidents={incidents}
              loading={incidentsLoading}
              onAcknowledge={acknowledgeIncident}
              onResolve={resolveIncident}
            />
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-900 bg-slate-950/30 py-4 text-center text-xs text-slate-600">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 EasyVenue AI. FIFA World Cup 2026 GenAI Challenge Submission.</p>
          <p className="flex items-center gap-1.5 font-semibold text-slate-500">
            <Activity className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
            <span>Venue Staff &amp; Organizer vertical</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
