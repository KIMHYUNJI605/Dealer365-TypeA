import { ItemStatus } from './types';

interface StatusConfig {
  label: string;
  dot: string;
  bg: string;
  text: string;
}

const STATUS_MAP: Record<ItemStatus, StatusConfig> = {
  'not-started':       { label: 'Not Started',       dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-400' },
  'in-progress':       { label: 'In Progress',        dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400' },
  'waiting-parts':     { label: 'Waiting Parts',      dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' },
  'waiting-approval':  { label: 'Awaiting Approval',  dot: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/30',text: 'text-orange-700 dark:text-orange-400' },
  'completed':         { label: 'Completed',          dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  'blocked':           { label: 'Blocked',            dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-700 dark:text-red-400' },
  'delayed':           { label: 'Delayed',            dot: 'bg-red-400',     bg: 'bg-red-50 dark:bg-red-900/30',     text: 'text-red-600 dark:text-red-400' },
  'confirmed':         { label: 'Confirmed',           dot: 'bg-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/30',   text: 'text-teal-700 dark:text-teal-400' },
  'checked-in':        { label: 'Checked In',          dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  'unassigned':        { label: 'Unassigned',          dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-500 dark:text-slate-400' },
  'new':               { label: 'New Lead',            dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30',   text: 'text-blue-700 dark:text-blue-400' },
  'scheduled':         { label: 'Scheduled',           dot: 'bg-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/30',text: 'text-indigo-700 dark:text-indigo-400' },
  'test-drive':        { label: 'Test Drive',          dot: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/30',text: 'text-violet-700 dark:text-violet-400' },
  'negotiation':       { label: 'Negotiation',         dot: 'bg-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/30',text: 'text-purple-700 dark:text-purple-400' },
  'closed-won':        { label: 'Closed Won',          dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',text: 'text-emerald-700 dark:text-emerald-400' },
  'closed-lost':       { label: 'Closed Lost',         dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-700',   text: 'text-slate-500 dark:text-slate-400' },
};

interface StatusBadgeProps {
  status: ItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP['not-started'];
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${padding} ${cfg.bg} ${cfg.text} ${textSize} font-medium whitespace-nowrap`}>
      <span className={`size-1.5 rounded-full ${cfg.dot} shrink-0`} />
      {cfg.label}
    </span>
  );
}
