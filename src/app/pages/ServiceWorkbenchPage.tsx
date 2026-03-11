import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, RefreshCw, X, SlidersHorizontal, ChevronDown, Wrench,
  Clock, Package, CheckCircle2, AlertTriangle, Flag, Phone, MessageSquare,
  FileText, Car, User, MapPin, MoreHorizontal, Zap, Shield, Hash,
  DollarSign, Users, ClipboardList, ArrowRight, ReceiptText, ChevronRight,
  Timer, Activity, XCircle, CircleDot, Circle, CheckCheck, AlertCircle,
  Mail, Gauge,
} from 'lucide-react';
import { Role } from '../components/d365/types';
import {
  REPAIR_ORDERS, RepairOrder, ROStatus, ROJob, ROPart, ALL_BAYS,
} from '../components/d365/repairOrderData';
import { ROLE_CONFIGS } from '../components/d365/data';
import { ServiceWorkbenchAI } from '../components/d365/ai/ServiceWorkbenchAI';
import { ShortcutHint } from '../components/d365/ShortcutHint';

// ─── Constants & helpers ──────────────────────────────────────────────────────

const ACTIVE_STATUSES: ROStatus[] = ['write-up', 'dispatched', 'in-progress', 'waiting-approval', 'blocked'];
const PARTS_STATUSES: ROStatus[] = ['waiting-parts'];
const QC_STATUSES: ROStatus[] = ['quality-check'];
const DONE_STATUSES: ROStatus[] = ['completed', 'delivered'];

const PRIORITY_STRIP: Record<string, string> = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  medium: 'bg-blue-400',
  low: 'bg-slate-300 dark:bg-slate-600',
};

const RO_STATUS_CFG: Record<ROStatus, { label: string; dot: string; bg: string; text: string }> = {
  'write-up':         { label: 'Write-Up',         dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-600 dark:text-slate-400' },
  'dispatched':       { label: 'Dispatched',        dot: 'bg-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/30',        text: 'text-blue-700 dark:text-blue-300' },
  'in-progress':      { label: 'In Progress',       dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400' },
  'waiting-parts':    { label: 'Waiting Parts',     dot: 'bg-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/30',      text: 'text-amber-700 dark:text-amber-400' },
  'waiting-approval': { label: 'Awaiting Approval', dot: 'bg-orange-500',  bg: 'bg-orange-50 dark:bg-orange-900/30',    text: 'text-orange-700 dark:text-orange-400' },
  'quality-check':    { label: 'Quality Check',     dot: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/30',    text: 'text-violet-700 dark:text-violet-400' },
  'completed':        { label: 'Completed',         dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30',  text: 'text-emerald-700 dark:text-emerald-400' },
  'delivered':        { label: 'Delivered',         dot: 'bg-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/30',        text: 'text-teal-700 dark:text-teal-400' },
  'blocked':          { label: 'Blocked',           dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-900/30',          text: 'text-red-700 dark:text-red-400' },
  'on-hold':          { label: 'On Hold',           dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-700',        text: 'text-slate-600 dark:text-slate-400' },
};

const JOB_TYPE_CFG: Record<string, { label: string; color: string }> = {
  maintenance:  { label: 'Maint',      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
  repair:       { label: 'Repair',     color: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  diagnostic:   { label: 'Diag',      color: 'text-violet-700 bg-violet-50 dark:bg-violet-900/30 dark:text-violet-400' },
  recall:       { label: 'Recall',     color: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400' },
  warranty:     { label: 'Warranty',   color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
  install:      { label: 'Install',    color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' },
};

const JOB_STATUS_CFG: Record<string, { icon: React.ElementType; color: string }> = {
  'not-started':   { icon: Circle,        color: 'text-slate-400' },
  'in-progress':   { icon: CircleDot,     color: 'text-blue-500' },
  'completed':     { icon: CheckCircle2,  color: 'text-emerald-500' },
  'waiting-parts': { icon: Package,       color: 'text-amber-500' },
};

const PART_STATUS_CFG: Record<string, { label: string; color: string }> = {
  'in-stock':    { label: 'In Stock',    color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  'ordered':     { label: 'Ordered',     color: 'text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  'backordered': { label: 'Backordered', color: 'text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400' },
  'received':    { label: 'Received',    color: 'text-teal-700 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400' },
};

const BAY_STATUS_COLOR: Record<ROStatus, string> = {
  'write-up':         'bg-slate-300 dark:bg-slate-600',
  'dispatched':       'bg-blue-400',
  'in-progress':      'bg-emerald-500',
  'waiting-parts':    'bg-amber-400',
  'waiting-approval': 'bg-orange-500',
  'quality-check':    'bg-violet-500',
  'completed':        'bg-emerald-300 dark:bg-emerald-700',
  'delivered':        'bg-teal-400',
  'blocked':          'bg-red-500',
  'on-hold':          'bg-slate-300',
};

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'active',    label: 'Active',         statuses: ACTIVE_STATUSES,  Icon: Activity },
  { id: 'parts',     label: 'Waiting Parts',  statuses: PARTS_STATUSES,   Icon: Package },
  { id: 'qc',        label: 'QC',             statuses: QC_STATUSES,      Icon: CheckCheck },
  { id: 'completed', label: 'Completed',      statuses: DONE_STATUSES,    Icon: CheckCircle2 },
  { id: 'all',       label: 'All ROs',        statuses: null,             Icon: ClipboardList },
] as const;
type TabId = typeof TABS[number]['id'];

// Role-adaptive defaults
const ROLE_TAB_DEFAULT: Record<Role, TabId> = {
  technician: 'active',
  advisor:    'active',
  dispatcher: 'active',
  sales:      'all',
  manager:    'all',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ROStatusBadge({ status, size = 'sm' }: { status: ROStatus; size?: 'sm' | 'md' }) {
  const cfg = RO_STATUS_CFG[status];
  const pad = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const txt = size === 'sm' ? 'text-[11px]' : 'text-xs';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${pad} ${txt} ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function LaborBar({ elapsed, estimated, compact = false }: { elapsed: number; estimated: number; compact?: boolean }) {
  const pct = estimated > 0 ? Math.min(100, (elapsed / estimated) * 100) : 0;
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
  const textColor = pct >= 100 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground';
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      <div className="flex items-center justify-between gap-2">
        <Timer className="size-3 text-muted-foreground shrink-0" />
        <span className={`text-[11px] tabular-nums font-medium ${textColor}`}>
          {elapsed}h / {estimated}h
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

// ─── Bay Map Strip ─────────────────────────────────────────────────────────────

function BayMapStrip({ ros, onSelectRO }: { ros: RepairOrder[]; onSelectRO: (ro: RepairOrder) => void }) {
  const bayMap = useMemo(() => {
    const m: Record<string, RepairOrder | undefined> = {};
    for (const ro of ros) {
      if (ro.bay) m[ro.bay] = ro;
    }
    return m;
  }, [ros]);

  return (
    <div className="shrink-0 px-5 py-3 border-b border-border">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Bay Overview</span>
        <span className="text-[10px] text-muted-foreground/60 ml-1">
          {ALL_BAYS.filter(b => bayMap[b]).length}/{ALL_BAYS.length} occupied
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {ALL_BAYS.map(bayName => {
          const ro = bayMap[bayName];
          const isFree = !ro;
          return (
            <button
              key={bayName}
              onClick={() => { if (ro) onSelectRO(ro); }}
              disabled={isFree}
              title={ro ? `${ro.roNumber} · ${ro.customerName} · ${RO_STATUS_CFG[ro.status].label}` : `${bayName} — Available`}
              className={`
                shrink-0 flex flex-col items-start gap-1 px-2.5 py-1.5 rounded-lg border transition-all duration-150 min-w-[84px]
                ${isFree
                  ? 'border-dashed border-border/60 bg-transparent cursor-default'
                  : 'border-border bg-background hover:border-blue-300 hover:shadow-sm cursor-pointer'
                }
              `}
            >
              <div className="flex items-center gap-1.5 w-full">
                <span
                  className={`size-2 rounded-full shrink-0 ${isFree ? 'bg-slate-200 dark:bg-slate-700' : BAY_STATUS_COLOR[ro!.status]}`}
                />
                <span className="text-[10px] font-semibold text-muted-foreground truncate">{bayName}</span>
              </div>
              {isFree ? (
                <span className="text-[10px] text-muted-foreground/50">Free</span>
              ) : (
                <span className="text-[10px] text-foreground truncate w-full leading-tight">
                  {ro!.customerInitials} · {ro!.roNumber.replace('RO-', '#')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── RO Row ───────────────────────────────────────────────────────────────────

interface RORowProps {
  ro: RepairOrder;
  index: number;
  role: Role;
  onOpen: (ro: RepairOrder) => void;
}

function RORow({ ro, index, role, onOpen }: RORowProps) {
  const cfg = RO_STATUS_CFG[ro.status];
  const pct = ro.laborHoursEstimated > 0 ? Math.min(100, (ro.laborHoursElapsed / ro.laborHoursEstimated) * 100) : 0;
  const laborColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
  const laborTextColor = pct >= 100 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground';

  // Role-adaptive quick action label
  const quickAction = useMemo(() => {
    if (role === 'technician') {
      if (ro.status === 'dispatched') return 'Clock In';
      if (ro.status === 'in-progress') return 'Update';
      return null;
    }
    if (role === 'advisor') {
      if (ro.status === 'write-up') return 'Dispatch';
      if (ro.status === 'waiting-approval') return 'Send Auth';
      if (ro.status === 'quality-check') return 'Close RO';
      return 'Open RO';
    }
    if (role === 'dispatcher') {
      if (!ro.bay || !ro.techName) return 'Assign';
      if (ro.status === 'dispatched') return 'Dispatch';
      return 'Manage';
    }
    return 'Review';
  }, [role, ro]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, delay: index * 0.03 }}
      className="relative flex items-center gap-0 hover:bg-muted/30 transition-colors duration-100 border-b border-border/60 group"
    >
      {/* Priority strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm ${PRIORITY_STRIP[ro.priority]}`} />

      {/* RO# + Flags — fixed width */}
      <div className="pl-4 pr-2 py-3.5 w-32 shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-semibold text-foreground">{ro.roNumber}</span>
          {ro.hasFlag && <Flag className="size-3 text-red-500 shrink-0" />}
          {ro.unreadMessages != null && ro.unreadMessages > 0 && (
            <span className="size-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {ro.unreadMessages}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {ro.customerWaiting && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">Waiting</span>
          )}
          {ro.loaner && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium">Loaner</span>
          )}
        </div>
      </div>

      {/* Customer & Vehicle */}
      <div className="flex items-center gap-3 flex-1 min-w-0 py-3.5 pr-3">
        <div className="size-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{ro.customerInitials}</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">{ro.customerName}</span>
            {ro.tags?.slice(0, 1).map(tag => (
              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium shrink-0 hidden sm:inline-flex">{tag}</span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Car className="size-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{ro.vehicle}</span>
            <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden md:inline">{ro.mileageIn}</span>
          </div>
        </div>
      </div>

      {/* Bay & Tech — hidden on mobile */}
      <div className="hidden md:block w-32 shrink-0 py-3.5 pr-3">
        {ro.bay ? (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="size-3 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-foreground">{ro.bay}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="size-3 text-muted-foreground/40 shrink-0" />
            <span className="text-xs text-muted-foreground/60 italic">Unassigned</span>
          </div>
        )}
        {ro.techName ? (
          <div className="flex items-center gap-1">
            <User className="size-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{ro.techName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <User className="size-3 text-muted-foreground/40 shrink-0" />
            <span className="text-xs text-muted-foreground/60 italic">No tech</span>
          </div>
        )}
      </div>

      {/* Operations summary — lg only */}
      <div className="hidden lg:block w-48 shrink-0 py-3.5 pr-3">
        <div className="space-y-0.5">
          {ro.jobs.slice(0, 2).map(job => {
            const jsCfg = JOB_STATUS_CFG[job.status] ?? JOB_STATUS_CFG['not-started'];
            const jTypeCfg = JOB_TYPE_CFG[job.type];
            return (
              <div key={job.id} className="flex items-center gap-1.5">
                <jsCfg.icon className={`size-3 shrink-0 ${jsCfg.color}`} />
                <span className={`text-[9px] px-1 py-0.5 rounded font-medium shrink-0 ${jTypeCfg.color}`}>{jTypeCfg.label}</span>
                <span className="text-xs text-muted-foreground truncate">{job.description}</span>
              </div>
            );
          })}
          {ro.jobs.length > 2 && (
            <span className="text-[10px] text-muted-foreground/60 pl-3.5">+{ro.jobs.length - 2} more op{ro.jobs.length - 2 > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Labor progress — xl only */}
      <div className="hidden xl:block w-32 shrink-0 py-3.5 pr-3">
        {ro.laborHoursEstimated > 0 ? (
          <LaborBar elapsed={ro.laborHoursElapsed} estimated={ro.laborHoursEstimated} compact />
        ) : (
          <span className="text-xs text-muted-foreground/60">—</span>
        )}
      </div>

      {/* Promised time — hidden on mobile */}
      <div className="hidden md:block w-24 shrink-0 py-3.5 pr-3">
        <div className="flex items-center gap-1">
          <Clock className="size-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{ro.promisedTime}</span>
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <DollarSign className="size-3 text-muted-foreground shrink-0" />
          <span className="text-xs font-medium text-foreground">{ro.estimatedTotal}</span>
        </div>
      </div>

      {/* Status badge */}
      <div className="w-32 shrink-0 py-3.5 pr-3 hidden sm:flex">
        <ROStatusBadge status={ro.status} />
      </div>

      {/* Actions */}
      <div className="pr-4 py-3.5 flex items-center gap-1.5 shrink-0">
        {quickAction && (
          <button
            onClick={() => onOpen(ro)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 whitespace-nowrap opacity-0 group-hover:opacity-100"
          >
            {quickAction}
          </button>
        )}
        <button
          onClick={() => onOpen(ro)}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── RO Detail Panel ──────────────────────────────────────────────────────────

interface DetailPanelProps {
  ro: RepairOrder;
  role: Role;
  onClose: () => void;
}

function RODetailPanel({ ro, role, onClose }: DetailPanelProps) {
  const totalLaborDollars = ro.jobs.reduce((sum, j) => sum + j.laborHours * j.laborRate, 0);
  const allParts = ro.jobs.flatMap(j => j.parts ?? []);
  const totalPartsDollars = allParts.reduce((sum, p) => {
    const num = parseFloat(p.price.replace(/[$,]/g, ''));
    return sum + (isNaN(num) ? 0 : num * p.qty);
  }, 0);
  const grandTotal = totalLaborDollars + totalPartsDollars;
  const tax = grandTotal * 0.085;

  // Role-adaptive primary actions
  const primaryActions = useMemo(() => {
    if (role === 'technician') {
      if (ro.status === 'dispatched') return [{ label: 'Clock In & Start', color: 'blue' }];
      if (ro.status === 'in-progress') return [{ label: 'Complete Job', color: 'emerald' }, { label: 'Request Parts', color: 'amber' }];
      if (ro.status === 'quality-check') return [{ label: 'Sign Off', color: 'violet' }];
      return [];
    }
    if (role === 'advisor') {
      if (ro.status === 'write-up') return [{ label: 'Dispatch to Shop', color: 'blue' }];
      if (ro.status === 'waiting-approval') return [{ label: 'Send Auth Request', color: 'orange' }, { label: 'Call Customer', color: 'slate' }];
      if (ro.status === 'quality-check') return [{ label: 'Close RO', color: 'emerald' }];
      if (ro.status === 'completed') return [{ label: 'Schedule Delivery', color: 'teal' }];
      return [{ label: 'Open Full RO', color: 'blue' }];
    }
    if (role === 'dispatcher') {
      if (!ro.bay || !ro.techName) return [{ label: 'Assign Bay & Tech', color: 'blue' }];
      if (ro.status === 'dispatched') return [{ label: 'Confirm Dispatch', color: 'blue' }];
      return [{ label: 'Reassign Tech', color: 'slate' }];
    }
    if (role === 'manager') {
      return [{ label: 'Override Priority', color: 'slate' }, { label: 'Escalate', color: 'red' }];
    }
    return [{ label: 'View Details', color: 'blue' }];
  }, [role, ro]);

  const ACTION_COLORS: Record<string, string> = {
    blue:    'bg-blue-600 hover:bg-blue-700 text-white',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    amber:   'bg-amber-500 hover:bg-amber-600 text-white',
    orange:  'bg-orange-500 hover:bg-orange-600 text-white',
    violet:  'bg-violet-600 hover:bg-violet-700 text-white',
    teal:    'bg-teal-600 hover:bg-teal-700 text-white',
    red:     'bg-red-600 hover:bg-red-700 text-white',
    slate:   'bg-muted border border-border hover:bg-muted/80 text-foreground',
  };

  const pct = ro.laborHoursEstimated > 0 ? Math.min(100, (ro.laborHoursElapsed / ro.laborHoursEstimated) * 100) : 0;
  const laborBarColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="relative flex items-start gap-3 p-5 border-b border-border shrink-0">
        <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-tl-lg rounded-bl-lg ${PRIORITY_STRIP[ro.priority]}`} />
        <div className="size-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0 ml-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{ro.customerInitials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{ro.roNumber}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${PRIORITY_STRIP[ro.priority].includes('red') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ro.priority === 'high' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ro.priority === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-muted text-muted-foreground'}`}>
              {PRIORITY_LABEL[ro.priority]}
            </span>
            {ro.hasFlag && <Flag className="size-3.5 text-red-500 shrink-0" />}
          </div>
          <h3 className="text-base font-semibold text-foreground mt-0.5">{ro.customerName}</h3>
          <p className="text-sm text-muted-foreground truncate">{ro.vehicle}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Status + Quick stats */}
      <div className="shrink-0 px-5 py-3 border-b border-border flex items-center gap-3 flex-wrap">
        <ROStatusBadge status={ro.status} size="md" />
        <span className="text-sm font-semibold text-foreground">{ro.estimatedTotal}</span>
        <div className="flex items-center gap-1 ml-2">
          {ro.customerWaiting && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">Customer Waiting</span>
          )}
          {ro.loaner && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium">Loaner Out</span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Info grid */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { Icon: Car,     label: 'Vehicle',   value: ro.vehicle },
              { Icon: Gauge,   label: 'Mileage',   value: ro.mileageIn },
              { Icon: Clock,   label: 'Time In',   value: ro.timeIn },
              { Icon: Timer,   label: 'Promised',  value: ro.promisedTime },
              ...(ro.bay ? [{ Icon: MapPin, label: 'Bay', value: ro.bay }] : []),
              ...(ro.techName ? [{ Icon: User, label: 'Technician', value: ro.techName }] : []),
              { Icon: Users,   label: 'Advisor',   value: ro.advisorName },
              { Icon: Phone,   label: 'Customer',  value: ro.customerPhone },
            ].map(({ Icon, label, value }) => (
              <div key={label} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>

          {/* Labor progress */}
          {ro.laborHoursEstimated > 0 && (
            <div className="bg-muted/40 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Labor Progress</span>
                <span className={`text-xs font-semibold tabular-nums ${pct >= 100 ? 'text-red-600 dark:text-red-400' : pct >= 80 ? 'text-amber-600' : 'text-foreground'}`}>
                  {ro.laborHoursElapsed}h elapsed / {ro.laborHoursEstimated}h est.
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                  className={`h-full rounded-full ${laborBarColor}`}
                />
              </div>
            </div>
          )}

          {/* Operations / Job Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Operations ({ro.jobs.length})</span>
              <span className="text-xs text-muted-foreground">{ro.jobs.filter(j => j.status === 'completed').length}/{ro.jobs.length} done</span>
            </div>
            <div className="space-y-2">
              {ro.jobs.map(job => {
                const jsCfg = JOB_STATUS_CFG[job.status] ?? JOB_STATUS_CFG['not-started'];
                const jTypeCfg = JOB_TYPE_CFG[job.type];
                return (
                  <div key={job.id} className="bg-muted/30 border border-border/50 rounded-xl p-3">
                    <div className="flex items-start gap-2.5">
                      <jsCfg.icon className={`size-4 shrink-0 mt-0.5 ${jsCfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground">{job.opCode}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${jTypeCfg.color}`}>{jTypeCfg.label}</span>
                          {job.techInitials && (
                            <span className="text-[10px] text-muted-foreground">Tech: <strong>{job.techInitials}</strong></span>
                          )}
                          <span className="text-[10px] text-muted-foreground ml-auto">{job.laborHours}h @ ${job.laborRate}/h</span>
                        </div>
                        <p className="text-xs font-medium text-foreground">{job.description}</p>
                        {/* Parts for this job */}
                        {job.parts && job.parts.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {job.parts.map((part, pi) => {
                              const pCfg = PART_STATUS_CFG[part.status];
                              return (
                                <div key={pi} className="flex items-center gap-2 pl-1">
                                  <Package className="size-3 text-muted-foreground shrink-0" />
                                  <span className="text-[10px] text-muted-foreground flex-1 truncate">{part.name}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">×{part.qty}</span>
                                  <span className="text-[10px] font-medium text-foreground shrink-0">{part.price}</span>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0 ${pCfg.color}`}>{pCfg.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Financial Summary */}
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Estimate Summary</span>
            <div className="bg-muted/40 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Labor ({ro.jobs.reduce((s, j) => s + j.laborHours, 0)}h)</span>
                <span className="font-medium text-foreground">${totalLaborDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {allParts.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Parts ({allParts.length} items)</span>
                  <span className="font-medium text-foreground">${totalPartsDollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tax (8.5%)</span>
                <span className="font-medium text-foreground">${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Estimated Total</span>
                <span className="text-base font-bold text-foreground">${(grandTotal + tax).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {ro.notes && (
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Internal Notes</span>
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
                <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">{ro.notes}</p>
              </div>
            </div>
          )}

          {/* Contact */}
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Contact Customer</span>
            <div className="flex gap-2">
              {([
                { Icon: Phone,          label: 'Call' },
                { Icon: MessageSquare,  label: 'SMS' },
                { Icon: Mail,           label: 'Email' },
              ] as Array<{ Icon: React.ElementType; label: string }>).map(({ Icon, label }) => (
                <button
                  key={label}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/60 border border-border
                             hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-muted-foreground hover:text-blue-600"
                >
                  <Icon className="size-4" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          {ro.tags && ro.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ro.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Activity */}
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Activity</span>
            <div className="space-y-2">
              {[
                { text: 'Status updated to ' + RO_STATUS_CFG[ro.status].label, time: '5m ago', by: 'System' },
                { text: 'RO opened in workbench', time: '12m ago', by: 'Jordan D.' },
                { text: 'Customer notified via SMS', time: '1h ago', by: 'System' },
              ].map((act, i) => (
                <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="size-1.5 bg-slate-300 dark:bg-slate-600 rounded-full shrink-0" />
                  <span className="flex-1">{act.text}</span>
                  <span className="text-muted-foreground/60 shrink-0">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="shrink-0 p-4 border-t border-border space-y-2">
        <div className="flex gap-2">
          {primaryActions.slice(0, 2).map((action, i) => (
            <button
              key={i}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${ACTION_COLORS[action.color]}`}
            >
              {action.label}
            </button>
          ))}
        </div>
        <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <ReceiptText className="size-4" />
          Open Full Repair Order
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface ServiceWorkbenchPageProps {
  role: Role;
}

export function ServiceWorkbenchPage({ role }: ServiceWorkbenchPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>(ROLE_TAB_DEFAULT[role]);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'time' | 'priority' | 'total'>('priority');
  const [loading, setLoading] = useState(true);
  const [selectedRO, setSelectedRO] = useState<RepairOrder | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Reset on role change
  useEffect(() => {
    setActiveTab(ROLE_TAB_DEFAULT[role]);
    setSearch('');
    setPriorityFilter('all');
    setAdvisorFilter('all');
    setTechFilter('all');
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, [role]);

  // '/' focuses search
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

  // Unique advisors & techs for filters
  const advisors = useMemo(() => {
    const set = new Set(REPAIR_ORDERS.map(r => r.advisorName));
    return Array.from(set);
  }, []);
  const techs = useMemo(() => {
    const set = new Set(REPAIR_ORDERS.map(r => r.techName).filter(Boolean) as string[]);
    return Array.from(set);
  }, []);

  // Filter by tab
  const tabFiltered = useMemo(() => {
    const tab = TABS.find(t => t.id === activeTab)!;
    if (!tab.statuses) return REPAIR_ORDERS;

    // For technician: only show their jobs
    let base = REPAIR_ORDERS;
    if (role === 'technician') {
      base = REPAIR_ORDERS.filter(r => r.techInitials === 'JM' || r.techName?.includes('Jake'));
    }
    return base.filter(r => (tab.statuses as ROStatus[]).includes(r.status));
  }, [activeTab, role]);

  // Apply filters & search
  const filtered = useMemo(() => {
    let items = tabFiltered;
    if (priorityFilter !== 'all') items = items.filter(r => r.priority === priorityFilter);
    if (advisorFilter !== 'all') items = items.filter(r => r.advisorName === advisorFilter);
    if (techFilter !== 'all') items = items.filter(r => r.techName === techFilter);
    if (search.length >= 2) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.roNumber.toLowerCase().includes(q) ||
        r.vehicle.toLowerCase().includes(q) ||
        r.bay?.toLowerCase().includes(q) ||
        r.techName?.toLowerCase().includes(q) ||
        r.jobs.some(j => j.description.toLowerCase().includes(q))
      );
    }
    // Sort
    return [...items].sort((a, b) => {
      if (sortField === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      }
      if (sortField === 'total') {
        const av = parseFloat(a.estimatedTotal.replace(/[$,]/g, ''));
        const bv = parseFloat(b.estimatedTotal.replace(/[$,]/g, ''));
        return bv - av;
      }
      return 0;
    });
  }, [tabFiltered, priorityFilter, advisorFilter, techFilter, search, sortField]);

  // Summary metrics
  const summary = useMemo(() => {
    const all = REPAIR_ORDERS;
    return {
      openROs:          all.filter(r => !DONE_STATUSES.includes(r.status)).length,
      inProgress:       all.filter(r => r.status === 'in-progress').length,
      waitingParts:     all.filter(r => r.status === 'waiting-parts').length,
      awaitingApproval: all.filter(r => r.status === 'waiting-approval').length,
      blocked:          all.filter(r => r.status === 'blocked').length,
      qc:               all.filter(r => r.status === 'quality-check').length,
      completedToday:   all.filter(r => DONE_STATUSES.includes(r.status)).length,
      revenueToday:     all.filter(r => DONE_STATUSES.includes(r.status))
                           .reduce((s, r) => s + parseFloat(r.estimatedTotal.replace(/[$,]/g, '')), 0),
      customerWaiting:  all.filter(r => r.customerWaiting).length,
      flagged:          all.filter(r => r.hasFlag).length,
    };
  }, []);

  // Tab counts
  const tabCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of TABS) {
      let base = REPAIR_ORDERS;
      if (role === 'technician') {
        base = REPAIR_ORDERS.filter(r => r.techInitials === 'JM' || r.techName?.includes('Jake'));
      }
      map[tab.id] = tab.statuses
        ? base.filter(r => (tab.statuses as ROStatus[]).includes(r.status)).length
        : base.length;
    }
    return map;
  }, [role]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const canCreate = role !== 'technician';
  const roleLabel = ROLE_CONFIGS[role].label;
  const activeFilterCount = [
    priorityFilter !== 'all', advisorFilter !== 'all', techFilter !== 'all',
  ].filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-5 pb-0 space-y-4">

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Wrench className="size-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Service Workbench</span>
            </div>
            <h1 className="text-foreground">Service Workbench</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Refresh">
              <RefreshCw className="size-4" />
            </button>
            <ServiceWorkbenchAI
              roleLabel={roleLabel}
              onApplyPreset={(preset) => {
                // Minimal, non-destructive wiring: jump to a relevant tab and open a representative RO.
                if (preset === 'parts') setActiveTab('parts');
                else setActiveTab('active');

                const targetStatus =
                  preset === 'blocked' ? 'blocked'
                    : preset === 'approval' ? 'waiting-approval'
                      : 'waiting-parts';
                const ro = REPAIR_ORDERS.find(r => r.status === targetStatus) ?? REPAIR_ORDERS[0];
                if (ro) setSelectedRO(ro);
              }}
              onOpenRO={(ro) => setSelectedRO(ro)}
            />
            {canCreate && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25 min-h-[40px]">
                <Plus className="size-4" />
                <span className="text-sm hidden sm:inline">New RO</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary strip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={role + '-sw-summary'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-4 py-3 border-b border-border overflow-x-auto scrollbar-none"
          >
            {[
              { label: 'Open ROs',      value: summary.openROs,                               color: 'text-foreground' },
              { label: 'In Progress',   value: summary.inProgress,                            color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Waiting Parts', value: summary.waitingParts,                          color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Approval',      value: summary.awaitingApproval,                      color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Blocked',       value: summary.blocked,                               color: 'text-red-600 dark:text-red-400' },
              { label: 'QC',            value: summary.qc,                                    color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Done Today',    value: summary.completedToday,                        color: 'text-emerald-600 dark:text-emerald-400' },
            ].map((s, i) => (
              <div
                key={s.label}
                className={`flex items-center gap-1.5 shrink-0 ${i > 0 ? 'pl-4 border-l border-border' : ''}`}
              >
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <span className={`text-sm font-semibold tabular-nums ${s.color}`}>{s.value}</span>
              </div>
            ))}
            <div className="ml-auto shrink-0 flex items-center gap-2 pl-4 border-l border-border">
              <DollarSign className="size-3.5 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                ${summary.revenueToday.toLocaleString()} today
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none" role="tablist">
          {TABS.map(({ id, label, Icon }) => {
            const count = tabCounts[id] ?? 0;
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-t-lg border-b-2 transition-all duration-150 shrink-0
                  ${isActive
                    ? 'border-blue-600 text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="font-medium whitespace-nowrap">{label}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Bay Map ──────────────────────────────────────────────────────────── */}
      <BayMapStrip ros={REPAIR_ORDERS} onSelectRO={setSelectedRO} />

      {/* ── Filter bar ───────────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-3 flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search RO, customer, vehicle…"
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

        {/* Priority chips */}
        <div className="flex items-center gap-1.5">
          {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium whitespace-nowrap capitalize
                ${priorityFilter === p
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
                }`}
            >
              {p === 'all' ? 'All Priority' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Advanced filter + sort */}
        <div className="ml-auto flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as typeof sortField)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs border border-border rounded-lg bg-background text-muted-foreground hover:border-blue-300 transition-all cursor-pointer outline-none"
            >
              <option value="priority">Sort: Priority</option>
              <option value="time">Sort: Time In</option>
              <option value="total">Sort: Value</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setFilterMenuOpen(v => !v)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border rounded-lg transition-all
                ${activeFilterCount > 0
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-blue-300'
                }`}
            >
              <SlidersHorizontal className="size-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="size-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {filterMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setFilterMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-full mt-1 z-30 w-56 bg-card border border-border rounded-xl shadow-lg p-3 space-y-3"
                  >
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Advisor</p>
                      <select
                        value={advisorFilter}
                        onChange={e => setAdvisorFilter(e.target.value)}
                        className="w-full pl-2 pr-6 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground outline-none"
                      >
                        <option value="all">All Advisors</option>
                        {advisors.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Technician</p>
                      <select
                        value={techFilter}
                        onChange={e => setTechFilter(e.target.value)}
                        className="w-full pl-2 pr-6 py-1.5 text-xs border border-border rounded-lg bg-background text-foreground outline-none"
                      >
                        <option value="all">All Technicians</option>
                        {techs.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setAdvisorFilter('all'); setTechFilter('all'); setPriorityFilter('all'); }}
                        className="w-full text-xs text-blue-600 hover:underline font-medium text-left"
                      >
                        Clear all filters
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Column headers ────────────────────────────────────────────────────── */}
      <div className="shrink-0 hidden lg:flex items-center px-0 py-2 border-b border-border/60 bg-muted/10">
        <div className="w-32 pl-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">RO #</div>
        <div className="flex-1 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer & Vehicle</div>
        <div className="w-32 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:block">Bay / Tech</div>
        <div className="w-48 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden lg:block">Operations</div>
        <div className="w-32 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden xl:block">Labor</div>
        <div className="w-24 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden md:block">Promised / Est.</div>
        <div className="w-32 px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">Status</div>
        <div className="w-28 pr-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</div>
      </div>

      {/* ── RO List ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Loading skeleton */}
          {loading && (
            <motion.div key="skeleton-sw" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="divide-y divide-border"
            >
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                  <div className="w-24 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-12" />
                  </div>
                  <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-36" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                  </div>
                  <div className="hidden md:block w-28 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                  </div>
                  <div className="hidden lg:block w-44 space-y-1.5">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  </div>
                  <div className="hidden xl:block w-28 space-y-1.5">
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                  </div>
                  <div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <div className="w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                </div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              key="empty-sw"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-64 gap-4 text-center px-8"
            >
              <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
                <Wrench className="size-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No repair orders found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  {search.length >= 2
                    ? `No results for "${search}". Try a different search.`
                    : 'Try adjusting your filters or switching tabs.'}
                </p>
              </div>
              <button
                onClick={() => { setPriorityFilter('all'); setAdvisorFilter('all'); setTechFilter('all'); setSearch(''); }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Clear all filters
              </button>
            </motion.div>
          )}

          {/* RO rows */}
          {!loading && filtered.length > 0 && (
            <motion.div
              key={`${activeTab}-${role}-${priorityFilter}-${search}-${sortField}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {filtered.map((ro, i) => (
                <RORow key={ro.id} ro={ro} index={i} role={role} onOpen={setSelectedRO} />
              ))}

              {/* Footer count */}
              <div className="px-5 py-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border/40">
                <span>{filtered.length} repair order{filtered.length !== 1 ? 's' : ''} shown</span>
                <span>
                  Total value: <strong className="text-foreground">
                    ${filtered.reduce((s, r) => s + parseFloat(r.estimatedTotal.replace(/[$,]/g, '')), 0).toLocaleString()}
                  </strong>
                </span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Detail slide-over ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedRO && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRO(null)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col"
            >
              <RODetailPanel
                ro={selectedRO}
                role={role}
                onClose={() => setSelectedRO(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
