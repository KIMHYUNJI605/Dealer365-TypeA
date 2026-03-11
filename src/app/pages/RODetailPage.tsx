import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, ChevronDown, ChevronRight, ArrowLeft, Clock, MapPin, User,
  Phone, Car, Wrench, Package, MessageSquare, BarChart2, Receipt,
  CheckCircle2, XCircle, AlertTriangle, AlertCircle, Sparkles, Flag,
  Play, Pause, CheckCheck, Send, Paperclip, MoreHorizontal, Plus,
  RefreshCw, Printer, Share2, Edit3, ClipboardList, Shield,
  Timer, DollarSign, Activity, Users, Star, Zap, ChevronLeft,
  ThumbsUp, ThumbsDown, Minus, Circle, Info, Lock, Unlock,
  StickyNote, Search, ExternalLink, Copy, Bell, X,
} from 'lucide-react';
import { motion as m } from 'motion/react';
import { Role } from '../components/d365/types';
import { REPAIR_ORDERS, RepairOrder, ROJob, ROStatus, ROPart } from '../components/d365/repairOrderData';
import { ROAI } from '../components/d365/ai/ROAI';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ROStatus, { label: string; bg: string; text: string; dot: string }> = {
  'write-up':         { label: 'Write-Up',        bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-400',   dot: 'bg-slate-400' },
  'dispatched':       { label: 'Dispatched',       bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-700 dark:text-blue-400',     dot: 'bg-blue-500' },
  'in-progress':      { label: 'In Progress',      bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'waiting-parts':    { label: 'Waiting Parts',    bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
  'waiting-approval': { label: 'Awaiting Auth.',   bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  'quality-check':    { label: 'QC / Inspection',  bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
  'completed':        { label: 'Completed',         bg: 'bg-teal-100 dark:bg-teal-900/30',  text: 'text-teal-700 dark:text-teal-400',    dot: 'bg-teal-500' },
  'delivered':        { label: 'Delivered',         bg: 'bg-teal-100 dark:bg-teal-900/30',  text: 'text-teal-700 dark:text-teal-400',    dot: 'bg-teal-600' },
  'blocked':          { label: 'Blocked',           bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-500' },
  'on-hold':          { label: 'On Hold',           bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-600 dark:text-slate-400',  dot: 'bg-slate-400' },
};

const PRIORITY_STRIP: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-amber-500',
  medium: 'bg-blue-400',
  low:    'bg-slate-300 dark:bg-slate-600',
};

const PRIORITY_BADGE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const JOB_STATUS_CONFIG = {
  'not-started':   { label: 'Not Started',   class: 'text-slate-500', dot: 'bg-slate-300 dark:bg-slate-600' },
  'in-progress':   { label: 'In Progress',   class: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'completed':     { label: 'Completed',     class: 'text-teal-600 dark:text-teal-400', dot: 'bg-teal-500' },
  'waiting-parts': { label: 'Waiting Parts', class: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
};

const PART_STATUS_CONFIG = {
  'in-stock':    { label: 'In Stock',    class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'ordered':     { label: 'Ordered',     class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  'backordered': { label: 'Backordered', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  'received':    { label: 'Received',    class: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' },
};

const JOB_TYPE_COLOR: Record<string, string> = {
  maintenance: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  repair:      'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  diagnostic:  'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
  recall:      'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  warranty:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  install:     'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

type TabId = 'overview' | 'tasks' | 'inspection' | 'parts' | 'communication' | 'timeline' | 'billing';

const ALL_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',       label: 'Overview',       icon: BarChart2 },
  { id: 'tasks',          label: 'Tasks',          icon: ClipboardList },
  { id: 'inspection',     label: 'Inspection',     icon: Shield },
  { id: 'parts',          label: 'Parts',          icon: Package },
  { id: 'communication',  label: 'Messages',       icon: MessageSquare },
  { id: 'timeline',       label: 'Timeline',       icon: Activity },
  { id: 'billing',        label: 'Billing',        icon: Receipt },
];

// Role-based default tab
const ROLE_DEFAULT_TAB: Record<Role, TabId> = {
  technician:  'tasks',
  advisor:     'overview',
  dispatcher:  'overview',
  sales:       'overview',
  manager:     'timeline',
};

// Mock timeline events
const TIMELINE_EVENTS = [
  { id: 't1', time: '8:00 AM', actor: 'System',        avatar: 'SY', event: 'RO created & customer checked in',             type: 'system' },
  { id: 't2', time: '8:05 AM', actor: 'Mia Brooks',    avatar: 'MB', event: 'Advisor wrote up RO — 3 jobs added',           type: 'advisor' },
  { id: 't3', time: '8:12 AM', actor: 'Chris Walters', avatar: 'CW', event: 'Dispatched to Jake M. — Bay 4',                type: 'dispatch' },
  { id: 't4', time: '8:20 AM', actor: 'Jake M.',       avatar: 'JM', event: 'Clocked in — Engine Oil & Filter Change',      type: 'tech' },
  { id: 't5', time: '8:47 AM', actor: 'Jake M.',       avatar: 'JM', event: 'Job complete — Oil & Filter (0.5h)',           type: 'tech' },
  { id: 't6', time: '8:52 AM', actor: 'Jake M.',       avatar: 'JM', event: 'Started — Brake System Inspection',           type: 'tech' },
  { id: 't7', time: '9:14 AM', actor: 'System',        avatar: 'SY', event: 'SMS sent to customer: "Your vehicle is being serviced"', type: 'system' },
  { id: 't8', time: '9:41 AM', actor: 'Mia Brooks',    avatar: 'MB', event: 'Customer note added: Waiting in lobby',        type: 'advisor' },
  { id: 't9', time: 'Now',     actor: 'Jake M.',       avatar: 'JM', event: 'In progress — Brake Inspection',              type: 'current' },
];

const TIMELINE_TYPE_COLOR: Record<string, string> = {
  system:   'bg-slate-400',
  advisor:  'bg-emerald-500',
  dispatch: 'bg-blue-500',
  tech:     'bg-violet-500',
  current:  'bg-orange-500',
};

// Mock communication thread
const MESSAGES = [
  { id: 'm1', from: 'customer', name: 'Marcus Rivera', time: '8:02 AM', text: 'Hi, do you have an ETA for when my car will be ready?' },
  { id: 'm2', from: 'advisor',  name: 'Mia Brooks',    time: '8:09 AM', text: 'Good morning Marcus! We\'ve started work on your vehicle. Current promise time is 12:00 PM. We\'ll text you if anything changes.' },
  { id: 'm3', from: 'customer', name: 'Marcus Rivera', time: '8:11 AM', text: 'Thanks! I\'ll be in the waiting area.' },
  { id: 'm4', from: 'advisor',  name: 'Mia Brooks',    time: '9:14 AM', text: 'Update: Your oil & filter is done ✓ Jake is now inspecting your brakes. Still on track for noon.' },
  { id: 'm5', from: 'customer', name: 'Marcus Rivera', time: '9:16 AM', text: 'Great, thanks for the update!' },
];

// Mock MPI items
const MPI_ITEMS = [
  { id: 'mpi1', category: 'Fluids',       item: 'Engine Oil Level & Condition',    result: 'pass'      as const },
  { id: 'mpi2', category: 'Fluids',       item: 'Coolant Level',                   result: 'pass'      as const },
  { id: 'mpi3', category: 'Fluids',       item: 'Brake Fluid Condition',           result: 'attention' as const },
  { id: 'mpi4', category: 'Fluids',       item: 'Power Steering Fluid',            result: 'pass'      as const },
  { id: 'mpi5', category: 'Brakes',       item: 'Front Brake Pad Thickness',       result: 'attention' as const },
  { id: 'mpi6', category: 'Brakes',       item: 'Rear Brake Pad Thickness',        result: 'pass'      as const },
  { id: 'mpi7', category: 'Brakes',       item: 'Brake Rotor Condition',           result: 'pending'   as const },
  { id: 'mpi8', category: 'Tires',        item: 'Tire Tread Depth — All 4',        result: 'pass'      as const },
  { id: 'mpi9', category: 'Tires',        item: 'Tire Pressure Check',             result: 'attention' as const },
  { id: 'mpi10',category: 'Lights',       item: 'Exterior Lights Functional',      result: 'pass'      as const },
  { id: 'mpi11',category: 'Belts & Hoses',item: 'Serpentine Belt Condition',       result: 'fail'      as const },
  { id: 'mpi12',category: 'Belts & Hoses',item: 'Radiator Hose Condition',         result: 'pass'      as const },
  { id: 'mpi13',category: 'Air Filters',  item: 'Engine Air Filter',               result: 'fail'      as const },
  { id: 'mpi14',category: 'Air Filters',  item: 'Cabin Air Filter',                result: 'attention' as const },
  { id: 'mpi15',category: 'Battery',      item: 'Battery Voltage & CCA',          result: 'pass'      as const },
];

type MpiResult = 'pass' | 'fail' | 'attention' | 'pending';

const MPI_CONFIG: Record<MpiResult, { label: string; icon: React.ElementType; bg: string; text: string; dot: string }> = {
  pass:      { label: 'Pass',      icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
  fail:      { label: 'Fail',      icon: XCircle,      bg: 'bg-red-50 dark:bg-red-900/20',         text: 'text-red-600 dark:text-red-400',         dot: 'bg-red-500' },
  attention: { label: 'Attention', icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500' },
  pending:   { label: 'Pending',   icon: Circle,       bg: 'bg-slate-50 dark:bg-slate-800/60',     text: 'text-slate-500',                         dot: 'bg-slate-300' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ROStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Tab Content: Overview ───────────────────────────────────────────────────

function OverviewTab({ ro, role }: { ro: RepairOrder; role: Role }) {
  const laborPct = ro.laborHoursEstimated > 0 ? Math.min(100, (ro.laborHoursElapsed / ro.laborHoursEstimated) * 100) : 0;
  const laborColor = laborPct >= 100 ? 'bg-red-500' : laborPct >= 80 ? 'bg-amber-500' : 'bg-blue-500';
  const isBlocked = ro.status === 'blocked';
  const needsAuth = ro.status === 'waiting-approval';
  const waitingParts = ro.status === 'waiting-parts';

  const jobsDone = ro.jobs.filter(j => j.status === 'completed').length;
  const jobsTotal = ro.jobs.length;

  const allParts = ro.jobs.flatMap(j => j.parts ?? []);
  const partsPending = allParts.filter(p => p.status === 'ordered' || p.status === 'backordered').length;

  return (
    <div className="space-y-5">
      {/* Alert banners */}
      <AnimatePresence>
        {isBlocked && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">RO Blocked</p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{ro.notes}</p>
            </div>
          </motion.div>
        )}
        {needsAuth && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50">
            <AlertCircle className="size-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Customer Authorization Required</p>
              <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-0.5">{ro.notes ?? `Auth needed for ${ro.estimatedTotal}. Customer contacted via phone and SMS.`}</p>
            </div>
            {(role === 'advisor' || role === 'manager') && (
              <button className="shrink-0 px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition-colors">
                Send Auth Request
              </button>
            )}
          </motion.div>
        )}
        {waitingParts && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <Package className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Parts Pending</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">{partsPending} part{partsPending !== 1 ? 's' : ''} ordered/backordered. {ro.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Labor Progress',
            value: `${ro.laborHoursElapsed}h / ${ro.laborHoursEstimated}h`,
            sub: `${Math.round(laborPct)}% complete`,
            bar: true,
            barPct: laborPct,
            barColor: laborColor,
          },
          {
            label: 'Jobs',
            value: `${jobsDone} / ${jobsTotal}`,
            sub: `${jobsTotal - jobsDone} remaining`,
            icon: ClipboardList,
          },
          {
            label: 'Promise Time',
            value: ro.promisedTime,
            sub: ro.customerWaiting ? '⚠ Customer waiting' : ro.loaner ? 'Loaner issued' : 'Drop-off',
            icon: Clock,
          },
          {
            label: 'Est. Revenue',
            value: ro.estimatedTotal,
            sub: 'Parts + Labor',
            icon: DollarSign,
          },
        ].map((k, i) => (
          <div key={i} className="p-3.5 rounded-xl border border-border bg-background">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">{k.label}</p>
            <p className="text-sm font-bold text-foreground">{k.value}</p>
            {k.bar ? (
              <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${k.barPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${k.barColor}`}
                />
              </div>
            ) : null}
            <p className="text-[10px] text-muted-foreground mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Jobs summary */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Service Jobs</span>
            <span className="text-xs text-muted-foreground">({ro.jobs.length})</span>
          </div>
          {(role === 'advisor' || role === 'manager') && (
            <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Plus className="size-3.5" /> Add Job
            </button>
          )}
        </div>
        <div className="divide-y divide-border/60">
          {ro.jobs.map((job, i) => {
            const jcfg = JOB_STATUS_CONFIG[job.status];
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <span className={`size-2 rounded-full mt-1.5 shrink-0 ${jcfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">{job.opCode}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${JOB_TYPE_COLOR[job.type]}`}>{job.type}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{job.description}</p>
                  <p className={`text-[11px] mt-0.5 font-medium ${jcfg.class}`}>{jcfg.label}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">${(job.laborHours * job.laborRate).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{job.laborHours}h @ ${job.laborRate}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {ro.notes && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-800/30">
          <StickyNote className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Advisor Notes</p>
            <p className="text-sm text-amber-700/90 dark:text-amber-400/80">{ro.notes}</p>
          </div>
        </div>
      )}

      {/* Role NBA */}
      {role === 'technician' && ro.status === 'in-progress' && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">Next Best Action</span>
          </div>
          <p className="text-xs text-blue-700/80 dark:text-blue-400/80">Complete the brake inspection, then run the MPI before flagging for advisor review.</p>
          <button className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            <ClipboardList className="size-3.5" /> Open MPI Checklist
          </button>
        </div>
      )}
      {role === 'advisor' && ro.status === 'waiting-approval' && (
        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="size-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Next Best Action</span>
          </div>
          <p className="text-xs text-orange-700/80 dark:text-orange-400/80">Customer hasn't responded in 42 minutes. Try calling again or send an updated quote link.</p>
          <div className="mt-3 flex gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 text-white text-xs font-semibold rounded-xl hover:bg-orange-700 transition-colors">
              <Phone className="size-3.5" /> Call Customer
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 border border-orange-300 text-orange-700 dark:text-orange-400 text-xs font-semibold rounded-xl hover:bg-orange-100 transition-colors">
              <Send className="size-3.5" /> Send Quote SMS
            </button>
          </div>
        </div>
      )}
      {role === 'manager' && ro.status === 'blocked' && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Manager Attention Required</span>
          </div>
          <p className="text-xs text-red-700/80 dark:text-red-400/80">This RO has been blocked for 2+ hours. Escalate tool procurement or reassign job to external specialist.</p>
          <div className="mt-3 flex gap-2">
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 transition-colors">
              <Flag className="size-3.5" /> Escalate Blocker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Content: Tasks ───────────────────────────────────────────────────────

function TasksTab({ ro, role }: { ro: RepairOrder; role: Role }) {
  const [jobStates, setJobStates] = useState<Record<string, ROJob['status']>>(
    Object.fromEntries(ro.jobs.map(j => [j.id, j.status]))
  );

  const toggleJob = (id: string) => {
    setJobStates(prev => ({
      ...prev,
      [id]: prev[id] === 'completed' ? 'in-progress' : prev[id] === 'in-progress' ? 'completed' : 'in-progress',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Tech clock-in strip — Technician only */}
      {role === 'technician' && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
          <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Timer className="size-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Labor Clock</p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Currently clocked in — Brake Inspection · 0:34 elapsed</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors shrink-0">
            <Pause className="size-3.5" /> Pause
          </button>
        </div>
      )}

      {/* Job cards */}
      {ro.jobs.map((job, i) => {
        const status = jobStates[job.id] ?? job.status;
        const jcfg = JOB_STATUS_CONFIG[status];
        const allParts = job.parts ?? [];
        const laborCost = (job.laborHours * job.laborRate).toLocaleString();
        const partsCost = allParts.reduce((sum, p) => {
          const n = parseFloat(p.price.replace(/[$,]/g, ''));
          return sum + (n * p.qty);
        }, 0);

        return (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="rounded-xl border border-border bg-background overflow-hidden"
          >
            {/* Job header */}
            <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border/60 bg-muted/10">
              <button
                onClick={() => toggleJob(job.id)}
                className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors
                  ${status === 'completed' ? 'border-teal-500 bg-teal-500' : 'border-border hover:border-blue-400'}`}
              >
                {status === 'completed' && <CheckCheck className="size-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground">{job.opCode}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize ${JOB_TYPE_COLOR[job.type]}`}>{job.type}</span>
                  <span className={`text-[10px] font-medium ${jcfg.class}`}>{jcfg.label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground">{job.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">${laborCost}</p>
                <p className="text-[10px] text-muted-foreground">{job.laborHours}h labor</p>
              </div>
            </div>

            {/* Parts */}
            {allParts.length > 0 && (
              <div className="px-4 py-3 border-b border-border/60 bg-muted/5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Parts ({allParts.length})</p>
                <div className="space-y-1.5">
                  {allParts.map(part => {
                    const pcfg = PART_STATUS_CONFIG[part.status];
                    return (
                      <div key={part.partNumber} className="flex items-center gap-2 text-xs">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${pcfg.class}`}>{pcfg.label}</span>
                        <span className="text-foreground font-medium flex-1 truncate">{part.name}</span>
                        <span className="text-muted-foreground font-mono shrink-0">{part.partNumber}</span>
                        <span className="text-muted-foreground shrink-0">×{part.qty}</span>
                        <span className="font-semibold text-foreground shrink-0">{part.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between px-4 py-2.5 gap-3">
              <div className="flex items-center gap-2">
                {job.techInitials && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="size-5 rounded-full bg-violet-600 flex items-center justify-center text-white text-[9px] font-bold">
                      {job.techInitials}
                    </div>
                    <span>{job.techInitials}</span>
                  </div>
                )}
                {partsCost > 0 && (
                  <span className="text-[10px] text-muted-foreground">Parts: ${partsCost.toFixed(0)}</span>
                )}
              </div>
              {role === 'technician' && status !== 'completed' && (
                <div className="flex items-center gap-2">
                  {status === 'not-started' && (
                    <button
                      onClick={() => setJobStates(prev => ({ ...prev, [job.id]: 'in-progress' }))}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      <Play className="size-3" /> Start
                    </button>
                  )}
                  {status === 'in-progress' && (
                    <>
                      <button
                        onClick={() => setJobStates(prev => ({ ...prev, [job.id]: 'not-started' }))}
                        className="flex items-center gap-1 px-3 py-1.5 border border-border text-muted-foreground text-[11px] rounded-lg hover:bg-muted transition-colors"
                      >
                        <Pause className="size-3" /> Pause
                      </button>
                      <button
                        onClick={() => setJobStates(prev => ({ ...prev, [job.id]: 'completed' }))}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 text-white text-[11px] font-semibold rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        <CheckCheck className="size-3" /> Complete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* DVI shortcut — Technician */}
      {role === 'technician' && (
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
          <ClipboardList className="size-4" />
          Open MPI / Vehicle Health Check
        </button>
      )}
    </div>
  );
}

// ─── Tab Content: Inspection ──────────────────────────────────────────────────

function InspectionTab({ ro, role }: { ro: RepairOrder; role: Role }) {
  const [items, setItems] = useState(MPI_ITEMS);
  const categories = [...new Set(items.map(i => i.category))];
  const counts = {
    pass:      items.filter(i => i.result === 'pass').length,
    fail:      items.filter(i => i.result === 'fail').length,
    attention: items.filter(i => i.result === 'attention').length,
    pending:   items.filter(i => i.result === 'pending').length,
  };

  const cycle = (id: string) => {
    const order: MpiResult[] = ['pending', 'pass', 'attention', 'fail'];
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const idx = order.indexOf(item.result);
      return { ...item, result: order[(idx + 1) % order.length] };
    }));
  };

  return (
    <div className="space-y-5">
      {/* Summary chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(Object.entries(counts) as [MpiResult, number][]).map(([r, n]) => {
          const cfg = MPI_CONFIG[r];
          const Icon = cfg.icon;
          return (
            <div key={r} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <Icon className="size-3.5" />
              {n} {cfg.label}
            </div>
          );
        })}
        <div className="ml-auto text-[11px] text-muted-foreground">
          {role === 'technician' ? 'Tap a row to cycle result' : 'Multi-Point Inspection (MPI)'}
        </div>
      </div>

      {/* Items by category */}
      {categories.map(cat => (
        <div key={cat} className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/20 border-b border-border">
            <span className="text-xs font-semibold text-foreground">{cat}</span>
          </div>
          <div className="divide-y divide-border/60">
            {items.filter(i => i.category === cat).map(item => {
              const cfg = MPI_CONFIG[item.result];
              const Icon = cfg.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => role === 'technician' && cycle(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    ${role === 'technician' ? 'hover:bg-muted/30 cursor-pointer' : 'cursor-default'}`}
                >
                  <Icon className={`size-4 shrink-0 ${cfg.text}`} />
                  <span className="flex-1 text-sm text-foreground">{item.item}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Signature */}
      {(role === 'technician' || role === 'advisor') && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
          <div>
            <p className="text-sm font-semibold text-foreground">Sign & Submit MPI</p>
            <p className="text-xs text-muted-foreground mt-0.5">{counts.pending > 0 ? `${counts.pending} items still pending` : 'All items reviewed'}</p>
          </div>
          <button
            disabled={counts.pending > 0}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            <CheckCircle2 className="size-4" /> Submit MPI
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab Content: Parts ───────────────────────────────────────────────────────

function PartsTab({ ro }: { ro: RepairOrder }) {
  const allParts = ro.jobs.flatMap(job =>
    (job.parts ?? []).map(p => ({ ...p, jobDesc: job.description }))
  );
  const totalPartsValue = allParts.reduce((sum, p) => {
    return sum + parseFloat(p.price.replace(/[$,]/g, '')) * p.qty;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Parts header stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Parts', value: allParts.length },
          { label: 'In Stock',    value: allParts.filter(p => p.status === 'in-stock' || p.status === 'received').length, color: 'text-emerald-600' },
          { label: 'Ordered',     value: allParts.filter(p => p.status === 'ordered').length, color: 'text-blue-600' },
          { label: 'Backordered', value: allParts.filter(p => p.status === 'backordered').length, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="p-3 rounded-xl border border-border bg-background text-center">
            <p className={`text-lg font-bold ${s.color ?? 'text-foreground'}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Parts table */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Parts List</span>
          </div>
          <span className="text-sm font-bold text-foreground">Total: ${totalPartsValue.toFixed(2)}</span>
        </div>
        {allParts.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2 text-center">
            <Package className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No parts on this RO</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {allParts.map((part, i) => {
              const pcfg = PART_STATUS_CONFIG[part.status];
              const total = (parseFloat(part.price.replace(/[$,]/g, '')) * part.qty).toFixed(2);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                >
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${pcfg.class}`}>{pcfg.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{part.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-muted-foreground">{part.partNumber}</span>
                      <span className="text-[10px] text-muted-foreground/60 truncate">— {part.jobDesc}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-foreground">${total}</p>
                    <p className="text-[10px] text-muted-foreground">×{part.qty} @ {part.price}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
        <Plus className="size-4" /> Request Additional Parts
      </button>
    </div>
  );
}

// ─── Tab Content: Communication ───────────────────────────────────────────────

function CommunicationTab({ ro, role }: { ro: RepairOrder; role: Role }) {
  const [msg, setMsg] = useState('');
  const [channel, setChannel] = useState<'sms' | 'email'>('sms');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="flex flex-col h-full space-y-0 min-h-[400px]">
      {/* Channel selector */}
      <div className="flex items-center gap-2 mb-4">
        {(['sms', 'email'] as const).map(ch => (
          <button
            key={ch}
            onClick={() => setChannel(ch)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all uppercase tracking-wide
              ${channel === ch ? 'bg-blue-600 text-white border-blue-600' : 'text-muted-foreground border-border hover:border-blue-300'}`}
          >
            {ch}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Phone className="size-3.5" />
          {ro.customerPhone}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 rounded-xl border border-border bg-background overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
          {MESSAGES.map((m, i) => {
            const isMe = m.from !== 'customer';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0
                  ${isMe ? 'bg-blue-600' : 'bg-slate-500'}`}>
                  {m.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${isMe
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                    {m.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{m.time}</span>
                </div>
              </motion.div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Compose */}
        <div className="border-t border-border p-3">
          {/* Templates */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none mb-2 pb-0.5">
            {['Vehicle ready 🎉', 'Parts ordered', 'Awaiting your approval', 'Call us when ready'].map(t => (
              <button
                key={t}
                onClick={() => setMsg(t)}
                className="shrink-0 text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder={`Type a ${channel.toUpperCase()} message to ${ro.customerName}…`}
              rows={2}
              className="flex-1 resize-none text-sm bg-muted/40 rounded-xl px-3 py-2.5 border border-border focus:outline-none focus:border-blue-400 text-foreground placeholder:text-muted-foreground transition-colors"
            />
            <button
              disabled={!msg.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="size-3.5" /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Content: Timeline ────────────────────────────────────────────────────

function TimelineTab({ ro }: { ro: RepairOrder }) {
  return (
    <div className="space-y-0.5">
      {TIMELINE_EVENTS.map((evt, i) => {
        const isLast = i === TIMELINE_EVENTS.length - 1;
        const isCurrent = evt.type === 'current';
        return (
          <motion.div
            key={evt.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3"
          >
            {/* Line + dot */}
            <div className="flex flex-col items-center shrink-0">
              <div className={`size-2.5 rounded-full mt-3.5 z-10 shrink-0 ${TIMELINE_TYPE_COLOR[evt.type]}
                ${isCurrent ? 'ring-2 ring-offset-2 ring-orange-400 ring-offset-background' : ''}`} />
              {!isLast && <div className="w-px flex-1 bg-border my-0.5 min-h-[24px]" />}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 ${isLast ? '' : ''}`}>
              <div className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${isCurrent ? 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200/60 dark:border-orange-800/30' : 'hover:bg-muted/30'}`}>
                <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${TIMELINE_TYPE_COLOR[evt.type]}`}>
                  {evt.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground">{evt.actor}</span>
                    <span className={`text-[10px] shrink-0 ${isCurrent ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-muted-foreground'}`}>{evt.time}</span>
                  </div>
                  <p className={`text-sm ${isCurrent ? 'text-orange-700 dark:text-orange-400 font-medium' : 'text-muted-foreground'}`}>{evt.event}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Tab Content: Billing ─────────────────────────────────────────────────────

function BillingTab({ ro, role }: { ro: RepairOrder; role: Role }) {
  const laborLines = ro.jobs.map(j => ({
    desc: j.description,
    hours: j.laborHours,
    rate: j.laborRate,
    total: j.laborHours * j.laborRate,
  }));
  const partsLines = ro.jobs.flatMap(j =>
    (j.parts ?? []).map(p => ({
      desc: p.name,
      qty: p.qty,
      price: parseFloat(p.price.replace(/[$,]/g, '')),
      total: parseFloat(p.price.replace(/[$,]/g, '')) * p.qty,
    }))
  );
  const laborTotal = laborLines.reduce((s, l) => s + l.total, 0);
  const partsTotal = partsLines.reduce((s, l) => s + l.total, 0);
  const tax = (partsTotal * 0.08);
  const grand = laborTotal + partsTotal + tax;

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border
        ${ro.status === 'completed' ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800/40' : 'bg-muted/20 border-border'}`}>
        {ro.status === 'completed' ? <CheckCircle2 className="size-5 text-teal-600 dark:text-teal-400" /> : <Clock className="size-5 text-muted-foreground" />}
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {ro.status === 'completed' ? 'Work Complete — Ready for Payment' : 'Invoice In Progress'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Estimated total: {ro.estimatedTotal}</p>
        </div>
        {(role === 'advisor' || role === 'manager') && ro.status === 'completed' && (
          <button className="px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
            Process Payment
          </button>
        )}
      </div>

      {/* Labor */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20">
          <span className="text-sm font-semibold text-foreground">Labor</span>
        </div>
        <div className="divide-y divide-border/60">
          {laborLines.map((l, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="flex-1 text-foreground">{l.desc}</span>
              <span className="text-muted-foreground">{l.hours}h × ${l.rate}</span>
              <span className="font-semibold text-foreground w-20 text-right">${l.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10">
            <span className="text-xs font-semibold text-muted-foreground">Labor Subtotal</span>
            <span className="text-sm font-bold text-foreground">${laborTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Parts */}
      {partsLines.length > 0 && (
        <div className="rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <span className="text-sm font-semibold text-foreground">Parts & Materials</span>
          </div>
          <div className="divide-y divide-border/60">
            {partsLines.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 text-foreground">{p.desc}</span>
                <span className="text-muted-foreground">×{p.qty} @ ${p.price.toFixed(2)}</span>
                <span className="font-semibold text-foreground w-20 text-right">${p.total.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2.5 bg-muted/10">
              <span className="text-xs font-semibold text-muted-foreground">Parts Subtotal</span>
              <span className="text-sm font-bold text-foreground">${partsTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="divide-y divide-border/60">
          {[
            { label: 'Labor Subtotal', value: laborTotal },
            { label: 'Parts Subtotal', value: partsTotal },
            { label: 'Tax (8%)',       value: tax },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-medium text-foreground">${row.value.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-4 bg-muted/10">
            <span className="text-sm font-bold text-foreground">Grand Total</span>
            <span className="text-lg font-bold text-foreground">${grand.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {(role === 'advisor' || role === 'manager') && (
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors">
            <Printer className="size-4" /> Print Invoice
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors">
            <Share2 className="size-4" /> Send to Customer
          </button>
          <button className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <DollarSign className="size-4" /> Finalize Invoice
          </button>
        </div>
      )}
    </div>
  );
}

// ─── RO Selector Dropdown ─────────────────────────────────────────────────────

function ROSelector({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = REPAIR_ORDERS.find(r => r.id === selectedId)!;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background hover:border-blue-300 hover:bg-muted/40 transition-all text-sm"
      >
        <FileText className="size-4 text-blue-600 shrink-0" />
        <span className="font-semibold text-foreground">{selected.roNumber}</span>
        <span className="text-muted-foreground hidden sm:inline">— {selected.customerName}</span>
        <ChevronDown className="size-3.5 text-muted-foreground ml-1" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute left-0 top-full mt-1.5 z-50 w-80 bg-card border border-border rounded-xl shadow-xl overflow-hidden py-1"
          >
            <p className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">All Open ROs</p>
            <div className="max-h-72 overflow-y-auto">
              {REPAIR_ORDERS.map(ro => {
                const scfg = STATUS_CONFIG[ro.status];
                const isActive = ro.id === selectedId;
                return (
                  <button
                    key={ro.id}
                    onClick={() => { onSelect(ro.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors
                      ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                  >
                    <div className={`size-2 rounded-full shrink-0 ${PRIORITY_STRIP[ro.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-muted-foreground">{ro.roNumber}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${scfg.bg} ${scfg.text}`}>{scfg.label}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ro.customerName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ro.vehicle}</p>
                    </div>
                    {isActive && <div className="size-1.5 rounded-full bg-blue-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Context Panel ────────────────────────────────────────────────────────────

function ContextPanel({ ro, role }: { ro: RepairOrder; role: Role }) {
  const laborPct = ro.laborHoursEstimated > 0 ? Math.min(100, (ro.laborHoursElapsed / ro.laborHoursEstimated) * 100) : 0;
  const laborBarColor = laborPct >= 100 ? 'bg-red-500' : laborPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-3 overflow-y-auto">
      {/* Customer card */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5">
            <User className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Customer</span>
          </div>
        </div>
        <div className="p-3 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {ro.customerInitials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground leading-tight">{ro.customerName}</p>
              {ro.customerWaiting && (
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">In lobby waiting</span>
              )}
              {ro.loaner && (
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">Loaner issued</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span>{ro.customerPhone}</span>
          </div>
          {(role === 'advisor' || role === 'manager') && (
            <div className="flex gap-1.5">
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                <Phone className="size-3" /> Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                <MessageSquare className="size-3" /> SMS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle card */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Car className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vehicle</span>
          </div>
        </div>
        <div className="p-3 space-y-2.5">
          <p className="text-sm font-semibold text-foreground leading-tight">{ro.vehicle}</p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Mileage In</span>
              <span className="font-medium text-foreground">{ro.mileageIn}</span>
            </div>
            {ro.bay && (
              <div className="flex justify-between">
                <span>Bay</span>
                <span className="font-medium text-foreground">{ro.bay}</span>
              </div>
            )}
          </div>
          {/* Tags */}
          {ro.tags && ro.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {ro.tags.map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-semibold">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assigned team */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Assigned Team</span>
          </div>
        </div>
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {ro.advisorInitials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">{ro.advisorName}</p>
              <p className="text-[10px] text-muted-foreground">Service Advisor</p>
            </div>
          </div>
          {ro.techName && (
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {ro.techInitials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground">{ro.techName}</p>
                <p className="text-[10px] text-muted-foreground">Technician</p>
              </div>
            </div>
          )}
          {!ro.techName && (
            <button className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
              <Plus className="size-3" /> Assign Technician
            </button>
          )}
        </div>
      </div>

      {/* Labor progress mini */}
      <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Labor</span>
          <span className="text-[11px] font-semibold text-foreground tabular-nums">{ro.laborHoursElapsed}h / {ro.laborHoursEstimated}h</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${laborPct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${laborBarColor}`}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{Math.round(laborPct)}% complete</span>
          <span>{ro.estimatedTotal}</span>
        </div>
      </div>

      {/* Key dates */}
      <div className="rounded-xl border border-border bg-background p-3 space-y-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Key Times</span>
        <div className="space-y-1.5 mt-2">
          {[
            { label: 'Checked In',    value: ro.timeIn },
            { label: 'Promise Time',  value: ro.promisedTime },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold text-foreground">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface RODetailPageProps {
  role: Role;
}

export function RODetailPage({ role }: RODetailPageProps) {
  const [selectedROId, setSelectedROId] = useState('ro1');
  const [activeTab, setActiveTab] = useState<TabId>(ROLE_DEFAULT_TAB[role]);
  const [loading, setLoading] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);

  const ro = REPAIR_ORDERS.find(r => r.id === selectedROId) ?? REPAIR_ORDERS[0];
  const scfg = STATUS_CONFIG[ro.status];

  // Animate tab switch on RO change
  useEffect(() => {
    setLoading(true);
    setActiveTab(ROLE_DEFAULT_TAB[role]);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [selectedROId, role]);

  // Visible tabs by role
  const visibleTabs = ALL_TABS.filter(tab => {
    if (role === 'technician' && (tab.id === 'billing' || tab.id === 'communication')) return false;
    if (role === 'dispatcher' && (tab.id === 'billing' || tab.id === 'communication')) return false;
    return true;
  });

  const hasWarning = ro.status === 'blocked' || ro.status === 'waiting-approval';

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Sticky Header ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border bg-background">
        {/* Top row */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <FileText className="size-3.5" />
              <span>RO Detail</span>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground/60" />
          </div>

          {/* RO Selector */}
          <ROSelector selectedId={selectedROId} onSelect={setSelectedROId} />

          <div className="flex items-center gap-2 ml-1">
            <StatusBadge status={ro.status} />
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${PRIORITY_BADGE[ro.priority]}`}>
              {ro.priority}
            </span>
            {ro.hasFlag && <Flag className="size-3.5 text-red-500" />}
            {ro.unreadMessages != null && ro.unreadMessages > 0 && (
              <span className="size-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                {ro.unreadMessages}
              </span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            <ROAI role={role} ro={ro} />
            <button
              onClick={() => setContextOpen(v => !v)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors hidden lg:flex items-center gap-1.5
                ${contextOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:bg-muted'}`}
              title="Toggle context panel"
            >
              <User className="size-4" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Printer className="size-4" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Share2 className="size-4" />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <MoreHorizontal className="size-4" />
            </button>

            {/* Primary CTA by role */}
            {role === 'technician' && ro.status === 'in-progress' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm min-h-[36px]">
                <CheckCheck className="size-4" /> Mark Complete
              </button>
            )}
            {role === 'advisor' && ro.status === 'waiting-approval' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-sm min-h-[36px]">
                <Send className="size-4" /> Send Auth Request
              </button>
            )}
            {role === 'advisor' && ro.status === 'completed' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm min-h-[36px]">
                <DollarSign className="size-4" /> Process Payment
              </button>
            )}
            {role === 'dispatcher' && !ro.techName && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm min-h-[36px]">
                <Users className="size-4" /> Assign Tech
              </button>
            )}
            {role === 'manager' && hasWarning && (
              <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm min-h-[36px]">
                <AlertTriangle className="size-4" /> Escalate
              </button>
            )}
          </div>
        </div>

        {/* Vehicle + RO meta strip */}
        <div className="flex items-center gap-4 px-5 pb-2.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <Car className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{ro.vehicle}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
            <Gauge className="size-3.5" />
            <span>{ro.mileageIn}</span>
          </div>
          {ro.bay && (
            <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              <span>{ro.bay}</span>
            </div>
          )}
          {ro.techName && (
            <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
              <User className="size-3.5" />
              <span>{ro.techName}</span>
            </div>
          )}
          <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>Promise: <strong className="text-foreground">{ro.promisedTime}</strong></span>
          </div>
          {ro.customerWaiting && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold shrink-0">Customer waiting</span>
          )}
          {ro.loaner && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold shrink-0">Loaner out</span>
          )}

          {/* Advisor */}
          <div className="ml-auto flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground">
            <div className="size-5 rounded-full bg-emerald-600 flex items-center justify-center text-[9px] font-bold text-white">
              {ro.advisorInitials}
            </div>
            <span>{ro.advisorName}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-t border-border overflow-x-auto scrollbar-none">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium transition-all whitespace-nowrap
                  ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="size-3.5" />
                {tab.label}
                {/* Badge for communication tab */}
                {tab.id === 'communication' && ro.unreadMessages != null && ro.unreadMessages > 0 && (
                  <span className="size-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">{ro.unreadMessages}</span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key={`${selectedROId}-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === 'overview'      && <OverviewTab      ro={ro} role={role} />}
                {activeTab === 'tasks'         && <TasksTab         ro={ro} role={role} />}
                {activeTab === 'inspection'    && <InspectionTab    ro={ro} role={role} />}
                {activeTab === 'parts'         && <PartsTab         ro={ro} />}
                {activeTab === 'communication' && <CommunicationTab ro={ro} role={role} />}
                {activeTab === 'timeline'      && <TimelineTab      ro={ro} />}
                {activeTab === 'billing'       && <BillingTab       ro={ro} role={role} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Context panel — desktop */}
        <AnimatePresence>
          {contextOpen && (
            <motion.div
              key="context"
              initial={{ opacity: 0, x: 24, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: 24, width: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block border-l border-border overflow-hidden"
            >
              <div className="p-4 h-full overflow-y-auto">
                <ContextPanel ro={ro} role={role} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// small import alias used in header meta
function Gauge({ className }: { className?: string }) {
  return <Activity className={className} />;
}
