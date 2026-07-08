/**
 * @file incidentConfig.js
 * @description Visual styles, labels, and icons configuration for incident categories and severities.
 */
import {
  Users,
  Activity,
  ShieldAlert,
  Wrench,
  UserX,
  HelpCircle,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

// Maps incident categories to icons, labels and HSL background classes
export const categoryMap = {
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
export const severityMap = {
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
