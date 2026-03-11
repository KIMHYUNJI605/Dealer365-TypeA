import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, CalendarDays, Clock, List, X, SlidersHorizontal,
  ChevronDown, UserCheck, RefreshCw, CalendarClock, LayoutGrid,
  Sunrise, Sun, Sunset, Flag, Phone, Mail, MessageSquare, Car,
  User, FileText, Wrench, CheckCircle2,
} from 'lucide-react';
import { Role, AppointmentItem, AppointmentType, AppointmentStatus } from '../components/d365/types';
import { APPOINTMENT_DATA } from '../components/d365/appointmentData';
import { AppointmentRow } from '../components/d365/AppointmentRow';
import {
  getAppointmentCTA, getSecondaryActions, getLifecycleSteps,
  ACTIVE_STATUSES,
} from '../components/d365/appointmentUtils';
import { ROLE_CONFIGS } from '../components/d365/data';
import { AppointmentAI } from '../components/d365/ai/AppointmentAI';
import { ShortcutHint } from '../components/d365/ShortcutHint';

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'today',    label: 'Today',     Icon: CalendarDays },
  { id: 'upcoming', label: 'Upcoming',  Icon: Clock },
  { id: 'all',      label: 'All Queue', Icon: List },
] as const;
type TabId = typeof TABS[number]['id'];

const TYPE_FILTERS: { label: string; value: AppointmentType | 'all' }[] = [
  { label: 'All',        value: 'all' },
  { label: 'Service',    value: 'service' },
  { label: 'Sales',      value: 'sales-consultation' },
  { label: 'Test Drive', value: 'test-drive' },
  { label: 'Walk-in',    value: 'walk-in' },
  { label: 'Follow-up',  value: 'follow-up' },
];

const STATUS_FILTERS: { label: string; value: AppointmentStatus | 'all' | 'active' }[] = [
  { label: 'All Status',    value: 'all' },
  { label: 'Active',        value: 'active' },
  { label: 'Pending',       value: 'pending' },
  { label: 'Confirmed',     value: 'confirmed' },
  { label: 'Checked In',    value: 'checked-in' },
  { label: 'Walkaround',    value: 'walkaround' },
  { label: 'RO Created',    value: 'ro-created' },
  { label: 'In Service',    value: 'in-service' },
  { label: 'Completed',     value: 'completed' },
  { label: 'No Show',       value: 'no-show' },
  { label: 'Canceled',      value: 'canceled' },
];

const TIME_GROUPS = [
  { id: 'morning',   label: 'Morning',   range: '8 AM – 12 PM', Icon: Sunrise },
  { id: 'afternoon', label: 'Afternoon', range: '12 PM – 5 PM', Icon: Sun },
  { id: 'evening',   label: 'Evening',   range: '5 PM+',        Icon: Sunset },
] as const;

const ROLE_DEFAULT_TYPE: Record<Role, AppointmentType | 'all'> = {
  technician:  'all',
  advisor:     'service',
  dispatcher:  'service',
  sales:       'sales-consultation',
  manager:     'all',
};

// ─── Type / Status label & color maps ────────────────────────────────────────

const TYPE_LABEL: Record<AppointmentType, string> = {
  'service': 'Service', 'sales-consultation': 'Sales Consultation',
  'test-drive': 'Test Drive', 'walk-in': 'Walk-in', 'follow-up': 'Follow-up',
};
const TYPE_COLOR: Record<AppointmentType, string> = {
  'service':             'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  'sales-consultation':  'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400',
  'test-drive':          'text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400',
  'walk-in':             'text-teal-700 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400',
  'follow-up':           'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  'pending':         'Pending',
  'confirmed':       'Confirmed',
  'checked-in':      'Checked In',
  'walkaround':      'Walkaround',
  'ro-created':      'RO Created',
  'in-service':      'In Service',
  'in-consultation': 'In Consultation',
  'completed':       'Completed',
  'no-show':         'No Show',
  'canceled':        'Canceled',
};
const STATUS_COLOR: Record<AppointmentStatus, string> = {
  'pending':         'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
  'confirmed':       'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  'checked-in':      'text-teal-700 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-400',
  'walkaround':      'text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400',
  'ro-created':      'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400',
  'in-service':      'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  'in-consultation': 'text-purple-700 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400',
  'completed':       'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
  'no-show':         'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
  'canceled':        'text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400',
};

// ─── Summary strip ────────────────────────────────────────────────────────────

function buildSummary(items: AppointmentItem[]) {
  return [
    { label: 'Total',     count: items.length,                                                        colorClass: 'text-foreground' },
    { label: 'Active',    count: items.filter(i => ACTIVE_STATUSES.includes(i.status)).length,        colorClass: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Confirmed', count: items.filter(i => i.status === 'confirmed').length,                  colorClass: 'text-blue-600 dark:text-blue-400' },
    { label: 'Pending',   count: items.filter(i => i.status === 'pending').length,                    colorClass: 'text-amber-600 dark:text-amber-400' },
    { label: 'Flagged',   count: items.filter(i => i.hasFlag).length,                                 colorClass: 'text-red-600 dark:text-red-400' },
  ];
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface AppointmentQueuePageProps {
  role: Role;
  onNavigate?: (nav: string) => void;
}

export function AppointmentQueuePage({ role, onNavigate }: AppointmentQueuePageProps) {
  const [activeTab, setActiveTab]           = useState<TabId>('today');
  const [typeFilter, setTypeFilter]         = useState<AppointmentType | 'all'>(ROLE_DEFAULT_TYPE[role]);
  const [statusFilter, setStatusFilter]     = useState<AppointmentStatus | 'all' | 'active'>('all');
  const [search, setSearch]                 = useState('');
  const [loading, setLoading]               = useState(true);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem]     = useState<AppointmentItem | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTypeFilter(ROLE_DEFAULT_TYPE[role]);
    setStatusFilter('all');
    setSearch('');
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, [role]);

  const baseItems = useMemo<AppointmentItem[]>(() => {
    if (activeTab === 'upcoming') {
      return APPOINTMENT_DATA.slice(0, 8).map(i => ({
        ...i, id: i.id + '-u', status: 'confirmed' as AppointmentStatus,
      }));
    }
    return APPOINTMENT_DATA;
  }, [activeTab]);

  const filtered = useMemo(() => {
    let items = baseItems;
    if (typeFilter !== 'all') items = items.filter(i => i.type === typeFilter);
    if (statusFilter === 'active') {
      items = items.filter(i => ACTIVE_STATUSES.includes(i.status));
    } else if (statusFilter !== 'all') {
      items = items.filter(i => i.status === statusFilter);
    }
    if (search.length >= 3) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.customerName.toLowerCase().includes(q) ||
        i.vehicle.toLowerCase().includes(q) ||
        i.refNumber.toLowerCase().includes(q) ||
        i.assignedTo.toLowerCase().includes(q) ||
        i.services?.some(s => s.toLowerCase().includes(q))
      );
    }
    return items;
  }, [baseItems, typeFilter, statusFilter, search]);

  const grouped = useMemo<Record<string, AppointmentItem[]> | null>(() => {
    if (activeTab !== 'today') return null;
    const g: Record<string, AppointmentItem[]> = { morning: [], afternoon: [], evening: [] };
    for (const item of filtered) {
      if (g[item.timeGroup]) g[item.timeGroup].push(item);
    }
    return g;
  }, [activeTab, filtered]);

  const summary = useMemo(() => buildSummary(APPOINTMENT_DATA), []);

  // '/' shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const canCreate = role !== 'technician';
  const roleLabel = ROLE_CONFIGS[role].label;

  const colHeaders = (
    <div className="hidden lg:flex items-center gap-0 px-0 py-2 border-b border-border/60 bg-muted/10">
      <div className="w-20 pl-5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Time</div>
      <div className="w-28 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Type</div>
      <div className="flex-1 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer &amp; Vehicle</div>
      <div className="w-32 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</div>
      <div className="w-24 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Source</div>
      <div className="w-20 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Value</div>
      <div className="w-32 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Status</div>
      <div className="w-28 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">Action</div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-5 pb-0 space-y-4">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <CalendarClock className="size-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Appointment Queue</span>
            </div>
            <h1 className="text-foreground">Appointments</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Refresh"
            >
              <RefreshCw className="size-4" />
            </button>
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Calendar view"
            >
              <LayoutGrid className="size-4" />
            </button>
            <AppointmentAI
              roleLabel={roleLabel}
              roleId={role}
              items={APPOINTMENT_DATA}
              onNavigate={onNavigate}
            />
            {canCreate && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25 min-h-[40px]">
                <Plus className="size-4" />
                <span className="text-sm hidden sm:inline">New Appointment</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary strip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role + '-apt-summary'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-4 py-3 border-b border-border overflow-x-auto scrollbar-none"
          >
            {summary.map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-1.5 shrink-0 ${i > 0 ? 'pl-4 border-l border-border' : ''}`}
              >
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-semibold tabular-nums ${s.colorClass}`}>{s.count}</span>
              </div>
            ))}
            <div className="ml-auto shrink-0 flex items-center gap-1.5 pl-4 border-l border-border">
              <UserCheck className="size-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">3 Advisors · 3 Consultants on duty</span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex items-center gap-1" role="tablist">
          {TABS.map(({ id, label, Icon }) => {
            const count = id === 'today' ? APPOINTMENT_DATA.length
              : id === 'upcoming' ? 8
              : APPOINTMENT_DATA.length;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg border-b-2 transition-all duration-150
                  ${isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="font-medium">{label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                  ${isActive ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Sticky filter bar ────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-3 flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, vehicle, RO…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-muted/60 border border-border rounded-lg outline-none
                       focus:border-blue-400 focus:bg-background transition-all placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>
        <ShortcutHint
          combo="/"
          label="Focus search"
          className="hidden xl:block"
        />

        {/* Type chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium whitespace-nowrap
                ${typeFilter === f.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <div className="relative ml-auto">
          <button
            onClick={() => setStatusMenuOpen(v => !v)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs border border-border rounded-lg bg-background
                       text-muted-foreground hover:text-foreground hover:border-blue-300 transition-all"
          >
            <SlidersHorizontal className="size-3.5" />
            {STATUS_FILTERS.find(f => f.value === statusFilter)?.label ?? 'All Status'}
            <ChevronDown className="size-3" />
          </button>
          <AnimatePresence>
            {statusMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setStatusMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 z-30 w-44 bg-card border border-border rounded-xl shadow-lg py-1 overflow-hidden"
                >
                  {STATUS_FILTERS.map(f => (
                    <button
                      key={f.value}
                      onClick={() => { setStatusFilter(f.value); setStatusMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-muted transition-colors
                        ${statusFilter === f.value
                          ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-foreground'
                        }`}
                    >
                      <span className={`size-1.5 rounded-full shrink-0 ${statusFilter === f.value ? 'bg-blue-600' : 'bg-transparent'}`} />
                      {f.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main list area ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Loading skeleton */}
          {loading && (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="divide-y divide-border"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-16 space-y-1.5">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-10" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-6" />
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-md w-20" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-36" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-52" />
                  </div>
                  <div className="hidden md:block w-28">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                  </div>
                  <div className="w-24 hidden sm:block">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
                  </div>
                  <div className="w-24">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-20" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8"
            >
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <CalendarDays className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No appointments found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {search.length >= 3
                    ? `No results for "${search}". Try a different search term.`
                    : 'Try adjusting your filters or switching tabs.'}
                </p>
              </div>
              <button
                onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Clear all filters
              </button>
            </motion.div>
          )}

          {/* Grouped list — Today tab */}
          {!loading && filtered.length > 0 && activeTab === 'today' && grouped && (
            <motion.div
              key={`today-${role}-${typeFilter}-${statusFilter}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {TIME_GROUPS.map(({ id, label, range, Icon: GroupIcon }) => {
                const groupItems = grouped[id] ?? [];
                if (groupItems.length === 0) return null;
                return (
                  <div key={id}>
                    <div className="flex items-center gap-3 px-5 py-2 bg-muted/30 border-b border-t border-border sticky top-0 z-[5]">
                      <GroupIcon className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                      <span className="text-[10px] text-muted-foreground/60">{range}</span>
                      <span className="ml-auto text-[10px] font-semibold text-muted-foreground">
                        {groupItems.length} appt{groupItems.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {colHeaders}
                    <div className="divide-y divide-border/60">
                      {groupItems.map((item, i) => (
                        <AppointmentRow
                          key={item.id}
                          item={item}
                          index={i}
                          role={role}
                          onOpen={setSelectedItem}
                          onNavigate={onNavigate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Flat list — Upcoming / All Queue tabs */}
          {!loading && filtered.length > 0 && activeTab !== 'today' && (
            <motion.div
              key={`${activeTab}-${role}-${typeFilter}-${statusFilter}-${search}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="sticky top-0 z-[5]">{colHeaders}</div>
              <div className="divide-y divide-border/60">
                {filtered.map((item, i) => (
                  <AppointmentRow
                    key={item.id}
                    item={item}
                    index={i}
                    role={role}
                    onOpen={setSelectedItem}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Detail slide-over panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
            >
              <AppointmentDetailPanel
                item={selectedItem}
                role={role}
                onClose={() => setSelectedItem(null)}
                onNavigate={onNavigate}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Lifecycle Progress Component ─────────────────────────────────────────────

function LifecycleProgress({ item }: { item: AppointmentItem }) {
  const { status, type } = item;

  if (status === 'no-show' || status === 'canceled') {
    return (
      <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
        status === 'no-show'
          ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
      }`}>
        {STATUS_LABEL[status]}
      </span>
    );
  }

  const steps = getLifecycleSteps(type);
  const currentIdx = steps.findIndex(s => s.key === status);
  const displayIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="flex-1 space-y-1.5">
      <div className="flex gap-0.5">
        {steps.map((step, i) => (
          <div
            key={step.key}
            className={`h-1 flex-1 rounded-full transition-all ${
              i <= displayIdx ? 'bg-blue-500' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <span className="text-[9px] text-muted-foreground/50">{steps[0].short}</span>
        <span className="text-[9px] text-blue-600 dark:text-blue-400 font-semibold">{steps[displayIdx]?.short}</span>
        <span className="text-[9px] text-muted-foreground/50">{steps[steps.length - 1].short}</span>
      </div>
    </div>
  );
}

// ─── Detail Panel Component ───────────────────────────────────────────────────

interface DetailPanelProps {
  item: AppointmentItem;
  role: Role;
  onClose: () => void;
  onNavigate?: (nav: string) => void;
}

function AppointmentDetailPanel({ item, role, onClose, onNavigate }: DetailPanelProps) {
  const cta       = getAppointmentCTA(item, role);
  const secondary = getSecondaryActions(item.status);
  const isActive  = ACTIVE_STATUSES.includes(item.status);

  const infoGrid: Array<{ Icon: React.ElementType; label: string; value: string }> = [
    { Icon: CalendarClock, label: 'Scheduled',    value: item.scheduledTime },
    { Icon: Car,           label: 'Vehicle',      value: item.vehicle },
    { Icon: User,          label: 'Assigned To',  value: item.assignedTo },
    { Icon: FileText,      label: 'Source',       value: item.source.charAt(0).toUpperCase() + item.source.slice(1) },
    ...(item.estimatedDuration ? [{ Icon: Clock, label: 'Est. Duration', value: item.estimatedDuration }] : []),
    ...(item.roNumber        ? [{ Icon: Wrench,  label: 'Linked RO',    value: item.roNumber }]           : []),
  ];

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-5 border-b border-border shrink-0">
        <div className="size-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.customerInitials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-[10px] font-mono text-muted-foreground">{item.refNumber}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${TYPE_COLOR[item.type]}`}>
              {TYPE_LABEL[item.type]}
            </span>
            {item.hasFlag && <Flag className="size-3 text-red-500 shrink-0" />}
          </div>
          <h3 className="text-base font-semibold text-foreground leading-tight">{item.customerName}</h3>
          <p className="text-sm text-muted-foreground truncate">{item.vehicle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* ── Status + Lifecycle ──────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLOR[item.status]}`}>
          <span className={`size-1.5 rounded-full bg-current shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
          {STATUS_LABEL[item.status]}
        </span>
        {item.estimatedValue && (
          <span className="text-sm font-semibold text-foreground shrink-0">{item.estimatedValue}</span>
        )}
        <LifecycleProgress item={item} />
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Context Information */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Context Information</p>
          <div className="grid grid-cols-2 gap-2.5">
            {infoGrid.map((info, i) => (
              <div key={i} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <info.Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{info.label}</span>
                </div>
                <p className="text-sm font-medium text-foreground leading-snug">{info.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Contact */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer Contact</p>
          <div className="flex gap-2">
            {([
              { Icon: Phone,         label: 'Call' },
              { Icon: Mail,          label: 'Email' },
              { Icon: MessageSquare, label: 'SMS' },
            ] as { Icon: React.ElementType; label: string }[]).map(({ Icon: Ic, label }) => (
              <button
                key={label}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/60 border border-border
                           hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-muted-foreground hover:text-blue-600"
              >
                <Ic className="size-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Appointment Notes — Services */}
        {item.services && item.services.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Services Requested</p>
            <div className="flex flex-wrap gap-2">
              {item.services.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/25 text-blue-700 dark:text-blue-400 font-medium"
                >
                  <CheckCircle2 className="size-3" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Appointment Notes — Text */}
        {item.notes && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Appointment Notes</p>
            <div className="bg-muted/40 rounded-xl p-3.5">
              <p className="text-sm text-foreground leading-relaxed">{item.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer CTAs ─────────────────────────────────────────────────────── */}
      <div className="p-4 border-t border-border space-y-2 shrink-0">

        {/* Primary Action — must match list row CTA */}
        {cta && (
          <button
            onClick={() => {
              if (cta.navTarget) onNavigate?.(cta.navTarget);
            }}
            className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors min-h-[48px]
              ${cta.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25'
                : 'border border-border text-foreground hover:bg-muted'
              }`}
          >
            {cta.label}
          </button>
        )}

        {/* Secondary Actions */}
        {secondary.length > 0 && (
          <div className="flex gap-2">
            {secondary.map(label => (
              <button
                key={label}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}