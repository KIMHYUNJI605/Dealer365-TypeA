import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Trello, RefreshCw, Plus, Flag, Clock, MapPin, User, Package,
  AlertTriangle, Sparkles, X, CheckCircle2, ChevronDown, LayoutGrid,
  List, Filter, Zap, Shield, Star, UserCheck, Circle, ArrowRight,
  GripVertical, AlertCircle, Timer, BarChart2, Gauge, Users,
} from 'lucide-react';
import { Role } from '../components/d365/types';
import { REPAIR_ORDERS, RepairOrder } from '../components/d365/repairOrderData';
import { DispatchAI } from '../components/d365/ai/DispatchAI';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ColumnId = 'unassigned' | 'assigned' | 'repairing' | 'inspection' | 'ready';

interface BoardCard {
  roId: string;
  columnId: ColumnId;
  techName?: string;
  bay?: string;
}

interface DragItem {
  roId: string;
  fromColumn: ColumnId;
}

const DRAG_TYPE = 'RO_CARD';

// ─── Static data ──────────────────────────────────────────────────────────────

interface Technician {
  id: string;
  name: string;
  initials: string;
  level: 'A' | 'B' | 'C';
  skills: string[];
  currentLoad: number;  // active RO hours
  capacity: number;     // max hours
  primaryBay: string;
  status: 'available' | 'busy' | 'on-break' | 'off';
}

const TECHNICIANS: Technician[] = [
  { id: 't1', name: 'Jake M.',   initials: 'JM', level: 'A', skills: ['Engine', 'EV', 'Brakes'],        currentLoad: 2.0, capacity: 4, primaryBay: 'Bay 4',       status: 'available' },
  { id: 't2', name: 'Sarah T.',  initials: 'ST', level: 'A', skills: ['EV', 'Diagnostic', 'HV'],        currentLoad: 4.0, capacity: 4, primaryBay: 'EV Bay 1',    status: 'busy' },
  { id: 't3', name: 'Mike R.',   initials: 'MR', level: 'B', skills: ['Engine', 'Brakes', 'Alignment'], currentLoad: 3.5, capacity: 4, primaryBay: 'Bay 5',        status: 'busy' },
  { id: 't4', name: 'Carlos D.', initials: 'CD', level: 'B', skills: ['Maint.', 'Transmission'],       currentLoad: 1.0, capacity: 3, primaryBay: 'Bay 6',        status: 'available' },
  { id: 't5', name: 'Tony F.',   initials: 'TF', level: 'A', skills: ['BMW', 'Audi', 'Euro'],           currentLoad: 5.0, capacity: 6, primaryBay: 'Bay 3',        status: 'busy' },
  { id: 't6', name: 'Marcus H.', initials: 'MH', level: 'B', skills: ['Alignment', 'Tires', 'Maint.'], currentLoad: 0.8, capacity: 3, primaryBay: 'Align. Bay',   status: 'available' },
  { id: 't7', name: 'Kevin W.',  initials: 'KW', level: 'C', skills: ['Lube', 'Maint.', 'Tires'],      currentLoad: 1.5, capacity: 4, primaryBay: 'Bay 7',        status: 'available' },
  { id: 't8', name: 'Lisa B.',   initials: 'LB', level: 'B', skills: ['Install', 'Suspension'],        currentLoad: 2.5, capacity: 3, primaryBay: 'Bay 9',        status: 'busy' },
];

const ALL_BAYS = [
  'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5', 'Bay 6',
  'Bay 7', 'Bay 8', 'Bay 9', 'Bay 10', 'Bay 11', 'Bay 12',
  'EV Bay 1', 'Alignment Bay', 'Lube Bay',
];

interface ColumnDef {
  id: ColumnId;
  label: string;
  sublabel: string;
  accentClass: string;        // border-top color
  headerBg: string;
  dropHighlight: string;
  countBg: string;
  icon: React.ElementType;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'unassigned',
    label: 'Unassigned',
    sublabel: 'Needs dispatch',
    accentClass: 'bg-red-500',
    headerBg: 'bg-red-50 dark:bg-red-950/20',
    dropHighlight: 'bg-red-50/80 dark:bg-red-950/30 border-red-400',
    countBg: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    icon: AlertCircle,
  },
  {
    id: 'assigned',
    label: 'Assigned',
    sublabel: 'Dispatched, pending start',
    accentClass: 'bg-blue-500',
    headerBg: 'bg-blue-50 dark:bg-blue-950/20',
    dropHighlight: 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-400',
    countBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    icon: UserCheck,
  },
  {
    id: 'repairing',
    label: 'Repairing',
    sublabel: 'Active work in bay',
    accentClass: 'bg-emerald-500',
    headerBg: 'bg-emerald-50 dark:bg-emerald-950/20',
    dropHighlight: 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400',
    countBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    icon: Gauge,
  },
  {
    id: 'inspection',
    label: 'Inspection',
    sublabel: 'QC & approval hold',
    accentClass: 'bg-violet-500',
    headerBg: 'bg-violet-50 dark:bg-violet-950/20',
    dropHighlight: 'bg-violet-50/80 dark:bg-violet-950/30 border-violet-400',
    countBg: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    icon: Shield,
  },
  {
    id: 'ready',
    label: 'Ready',
    sublabel: 'Complete, awaiting pickup',
    accentClass: 'bg-teal-500',
    headerBg: 'bg-teal-50 dark:bg-teal-950/20',
    dropHighlight: 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-400',
    countBg: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
    icon: CheckCircle2,
  },
];

const PRIORITY_STRIP: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-amber-500',
  medium: 'bg-blue-400',
  low:    'bg-slate-300 dark:bg-slate-600',
};

const PRIORITY_LABEL_COLOR: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  high:   'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  low:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const TECH_STATUS_COLOR: Record<Technician['status'], string> = {
  available: 'bg-emerald-500',
  busy:      'bg-amber-500',
  'on-break': 'bg-slate-400',
  off:       'bg-slate-300',
};

const LEVEL_COLOR: Record<string, string> = {
  A: 'text-amber-600 dark:text-amber-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-slate-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitialColumn(ro: RepairOrder): ColumnId {
  if (!ro.techName) return 'unassigned';
  if (ro.status === 'dispatched')  return 'assigned';
  if (['in-progress', 'waiting-parts', 'waiting-approval', 'blocked', 'on-hold'].includes(ro.status)) return 'repairing';
  if (ro.status === 'quality-check') return 'inspection';
  if (['completed', 'delivered'].includes(ro.status)) return 'ready';
  return 'unassigned';
}

function suggestTech(ro: RepairOrder): Technician | null {
  const available = TECHNICIANS.filter(t => t.status === 'available' && t.currentLoad < t.capacity);
  if (!available.length) return null;
  return available.sort((a, b) => (a.currentLoad / a.capacity) - (b.currentLoad / b.capacity))[0];
}

function suggestBay(ro: RepairOrder, usedBays: string[]): string {
  const free = ALL_BAYS.filter(b => !usedBays.includes(b));
  const isEV = ro.vehicle.toLowerCase().includes('tesla') || ro.vehicle.toLowerCase().includes('ev');
  if (isEV) {
    const evBay = free.find(b => b.toLowerCase().includes('ev'));
    if (evBay) return evBay;
  }
  return free[0] ?? 'Bay 1';
}

// ─── Toast System ─────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'info';
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium max-w-xs
              ${t.type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
                t.type === 'warning' ? 'bg-amber-500 text-white border-amber-600' :
                'bg-background text-foreground border-border'}`}
          >
            {t.type === 'success' && <CheckCircle2 className="size-4 shrink-0" />}
            {t.type === 'warning' && <AlertTriangle className="size-4 shrink-0" />}
            {t.type === 'info'    && <Zap className="size-4 shrink-0" />}
            <span>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-70 hover:opacity-100">
              <X className="size-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Technician Rail ──────────────────────────────────────────────────────────

function TechnicianRail({ cards }: { cards: BoardCard[] }) {
  // Count active ROs per tech from current board state
  const techROCount = (name: string) =>
    cards.filter(c => c.techName === name && c.columnId !== 'ready').length;

  return (
    <div className="shrink-0 border-b border-border bg-muted/20 px-5 py-2.5">
      <div className="flex items-center gap-2 mb-2">
        <Users className="size-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Technicians On Duty</span>
        <span className="text-[10px] text-muted-foreground/60 ml-1">
          {TECHNICIANS.filter(t => t.status === 'available').length} available · {TECHNICIANS.filter(t => t.status === 'busy').length} busy
        </span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
        {TECHNICIANS.map(tech => {
          const active = techROCount(tech.name);
          const loadPct = Math.min(100, (tech.currentLoad / tech.capacity) * 100);
          const loadColor = loadPct >= 90 ? 'bg-red-500' : loadPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <div
              key={tech.id}
              className="shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border bg-background hover:border-blue-300 transition-all cursor-default"
              title={`${tech.name} · ${tech.skills.join(', ')} · ${tech.currentLoad}/${tech.capacity}h`}
            >
              <div className="relative">
                <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                  ${tech.status === 'available' ? 'bg-emerald-600' :
                    tech.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                  {tech.initials}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-background ${TECH_STATUS_COLOR[tech.status]}`} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">{tech.name}</span>
                  <span className={`text-[9px] font-bold ${LEVEL_COLOR[tech.level]}`}>Lv.{tech.level}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${loadColor}`}
                      style={{ width: `${loadPct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground tabular-nums">{tech.currentLoad}/{tech.capacity}h</span>
                </div>
              </div>
              {active > 0 && (
                <span className="size-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{active}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── RO Kanban Card ───────────────────────────────────────────────────────────

interface ROCardProps {
  ro: RepairOrder;
  card: BoardCard;
  role: Role;
  onAssign: (ro: RepairOrder) => void;
  allCards: BoardCard[];
}

function ROCard({ ro, card, role, onAssign, allCards }: ROCardProps) {
  const [{ isDragging }, drag, preview] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: DRAG_TYPE,
    item: { roId: ro.id, fromColumn: card.columnId },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  const sugTech = suggestTech(ro);
  const usedBays = allCards.filter(c => c.bay).map(c => c.bay!);
  const sugBay   = suggestBay(ro, usedBays);
  const isOverdue = ro.promisedTime !== 'Tomorrow 4:00 PM'; // simplified flag
  const pct = ro.laborHoursEstimated > 0 ? Math.min(100, (ro.laborHoursElapsed / ro.laborHoursEstimated) * 100) : 0;
  const laborColor = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500';

  // Special flags
  const isBlocked  = ro.status === 'blocked';
  const isWaiting  = ro.status === 'waiting-parts';
  const needsAuth  = ro.status === 'waiting-approval';
  const isEV       = ro.vehicle.toLowerCase().includes('tesla') || ro.vehicle.toLowerCase().includes('ev');

  return (
    <div
      ref={preview}
      className={`relative group rounded-xl border bg-background shadow-sm transition-all duration-150
        ${isDragging ? 'opacity-40 shadow-none' : 'hover:shadow-md hover:-translate-y-0.5'}
        ${isBlocked ? 'border-red-300 dark:border-red-800' : 'border-border'}
      `}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      {/* Priority strip */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${PRIORITY_STRIP[ro.priority]}`} />

      {/* Drag handle */}
      <div
        ref={drag}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
        title="Drag to move"
      >
        <GripVertical className="size-3.5" />
      </div>

      <div className="pl-4 pr-3 pt-3 pb-3">
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground">{ro.roNumber}</span>
              {ro.hasFlag && <Flag className="size-3 text-red-500 shrink-0" />}
              {ro.unreadMessages != null && ro.unreadMessages > 0 && (
                <span className="size-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">{ro.unreadMessages}</span>
              )}
              {isEV && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">EV</span>
              )}
            </div>
            <p className="text-sm font-semibold text-foreground mt-0.5 leading-tight">{ro.customerName}</p>
            <p className="text-[11px] text-muted-foreground leading-snug truncate">{ro.vehicle}</p>
          </div>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${PRIORITY_LABEL_COLOR[ro.priority]}`}>
            {ro.priority}
          </span>
        </div>

        {/* Job summary */}
        {ro.jobs.length > 0 && (
          <div className="mb-2 space-y-0.5">
            {ro.jobs.slice(0, 2).map(job => (
              <div key={job.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Circle className="size-2 shrink-0" />
                <span className="truncate">{job.description}</span>
              </div>
            ))}
            {ro.jobs.length > 2 && (
              <span className="text-[10px] text-muted-foreground/60 pl-3.5">+{ro.jobs.length - 2} more</span>
            )}
          </div>
        )}

        {/* Bay / Tech chips */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
          {card.bay ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              <MapPin className="size-2.5 shrink-0" />
              {card.bay}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground/60">
              <MapPin className="size-2.5 shrink-0" />
              No bay
            </span>
          )}
          {card.techName ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium">
              <User className="size-2.5 shrink-0" />
              {card.techName}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border text-muted-foreground/60">
              <User className="size-2.5 shrink-0" />
              No tech
            </span>
          )}
          {ro.customerWaiting && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold">Waiting</span>
          )}
          {ro.loaner && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-semibold">Loaner</span>
          )}
        </div>

        {/* Status chips */}
        {(isBlocked || isWaiting || needsAuth) && (
          <div className="mb-2.5">
            {isBlocked && (
              <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400">
                <AlertTriangle className="size-3 shrink-0" />
                <span className="font-medium">Blocked — tool missing</span>
              </div>
            )}
            {isWaiting && !isBlocked && (
              <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-400">
                <Package className="size-3 shrink-0" />
                <span className="font-medium">Parts pending</span>
              </div>
            )}
            {needsAuth && (
              <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/40 text-orange-700 dark:text-orange-400">
                <AlertCircle className="size-3 shrink-0" />
                <span className="font-medium">Awaiting auth.</span>
              </div>
            )}
          </div>
        )}

        {/* Labor progress */}
        {ro.laborHoursEstimated > 0 && ro.laborHoursElapsed > 0 && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1">
                <Timer className="size-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Labor</span>
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">{ro.laborHoursElapsed}h / {ro.laborHoursEstimated}h</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${laborColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="size-3 shrink-0" />
            <span className="truncate">{ro.promisedTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-semibold text-foreground">{ro.estimatedTotal}</span>
          </div>
        </div>

        {/* AI suggestion row (unassigned only) */}
        {card.columnId === 'unassigned' && sugTech && (
          <div className="mt-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-[10px] text-violet-700 dark:text-violet-400">
              <Sparkles className="size-3 shrink-0" />
              <span className="font-medium">Suggest: <strong>{sugTech.name}</strong> · {sugBay}</span>
            </div>
          </div>
        )}

        {/* Assign button (unassigned / assigned) */}
        {(card.columnId === 'unassigned' || (card.columnId === 'assigned' && !card.techName)) && (
          <button
            onClick={() => onAssign(ro)}
            className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserCheck className="size-3.5" />
            Assign Tech & Bay
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Board Column ─────────────────────────────────────────────────────────────

interface BoardColumnProps {
  colDef: ColumnDef;
  cards: BoardCard[];
  ros: RepairOrder[];
  role: Role;
  onDrop: (roId: string, fromColumn: ColumnId, toColumn: ColumnId) => void;
  onAssign: (ro: RepairOrder) => void;
  allCards: BoardCard[];
}

function BoardColumn({ colDef, cards, ros, role, onDrop, onAssign, allCards }: BoardColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: DRAG_TYPE,
    drop: (item) => {
      if (item.fromColumn !== colDef.id) {
        onDrop(item.roId, item.fromColumn, colDef.id);
      }
    },
    canDrop: (item) => item.fromColumn !== colDef.id,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const colROs = cards
    .filter(c => c.columnId === colDef.id)
    .map(c => ({ card: c, ro: ros.find(r => r.id === c.roId)! }))
    .filter(x => x.ro);

  const urgentCount = colROs.filter(x => x.ro.priority === 'urgent').length;
  const flaggedCount = colROs.filter(x => x.ro.hasFlag).length;

  const isActive = isOver && canDrop;

  return (
    <div
      className="flex flex-col h-full min-w-[280px] max-w-[320px] flex-1 rounded-xl border border-border overflow-hidden"
    >
      {/* Column header */}
      <div className={`shrink-0 px-3 py-2.5 ${colDef.headerBg}`}>
        {/* Accent bar */}
        <div className={`h-0.5 w-full rounded-full mb-2.5 ${colDef.accentClass}`} />
        <div className="flex items-center gap-2 mb-0.5">
          <colDef.icon className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground">{colDef.label}</span>
          <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${colDef.countBg}`}>
            {colROs.length}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground">{colDef.sublabel}</p>
        {/* Alerts */}
        {(urgentCount > 0 || flaggedCount > 0) && (
          <div className="mt-1.5 flex items-center gap-2">
            {urgentCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-red-600 dark:text-red-400 font-semibold">
                <AlertTriangle className="size-2.5" />
                {urgentCount} urgent
              </span>
            )}
            {flaggedCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                <Flag className="size-2.5" />
                {flaggedCount} flagged
              </span>
            )}
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={drop}
        className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors duration-150 min-h-[120px]
          ${isActive ? `border-2 border-dashed rounded-b-xl ${colDef.dropHighlight}` : 'border-2 border-transparent'}
        `}
      >
        {/* Drop hint when hovering */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="flex items-center justify-center h-12 rounded-xl border-2 border-dashed border-current text-muted-foreground text-xs font-medium gap-2 opacity-60"
            >
              <ArrowRight className="size-3.5" />
              Move here
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cards */}
        <AnimatePresence>
          {colROs.map(({ card, ro }, i) => (
            <motion.div
              key={ro.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18, delay: i * 0.03 }}
            >
              <ROCard
                ro={ro}
                card={card}
                role={role}
                onAssign={onAssign}
                allCards={allCards}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty state */}
        {colROs.length === 0 && !isActive && (
          <div className="flex flex-col items-center justify-center h-24 gap-2 text-center">
            <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
              <colDef.icon className="size-4 text-muted-foreground/50" />
            </div>
            <span className="text-[11px] text-muted-foreground/60">No ROs here</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Assignment Modal ─────────────────────────────────────────────────────────

interface AssignModalProps {
  ro: RepairOrder;
  onConfirm: (roId: string, techName: string, bay: string) => void;
  onClose: () => void;
  allCards: BoardCard[];
}

function AssignModal({ ro, onConfirm, onClose, allCards }: AssignModalProps) {
  const sugTech = suggestTech(ro);
  const usedBays = allCards.filter(c => c.bay).map(c => c.bay!);
  const sugBay = suggestBay(ro, usedBays);

  const [selectedTech, setSelectedTech] = useState(sugTech?.name ?? '');
  const [selectedBay, setSelectedBay]   = useState(sugBay);

  const availableTechs = TECHNICIANS.filter(t => t.status !== 'off');
  const freeBays = ALL_BAYS.filter(b => !usedBays.includes(b) || b === ro.bay);

  const chosenTech = TECHNICIANS.find(t => t.name === selectedTech);
  const loadPct = chosenTech
    ? Math.min(100, (chosenTech.currentLoad / chosenTech.capacity) * 100)
    : 0;
  const loadColor = loadPct >= 90 ? 'text-red-600' : loadPct >= 70 ? 'text-amber-600' : 'text-emerald-600';

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative flex items-start gap-3 p-5 border-b border-border bg-muted/30">
            <div className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-tl-2xl rounded-bl-2xl ${PRIORITY_STRIP[ro.priority]}`} />
            <div className="ml-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <UserCheck className="size-4 text-blue-600" />
                <span className="text-sm font-semibold text-foreground">Assign Technician & Bay</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ro.roNumber} · {ro.customerName} · {ro.vehicle}
              </p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* AI Suggestion banner */}
            {sugTech && (
              <div className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/40">
                <Sparkles className="size-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">AI Recommendation</p>
                  <p className="text-xs text-violet-700 dark:text-violet-400/80 mt-0.5">
                    <strong>{sugTech.name}</strong> is best matched — lowest workload ({sugTech.currentLoad}/{sugTech.capacity}h), skills: {sugTech.skills.join(', ')}.
                    Suggested bay: <strong>{sugBay}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Technician select */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Technician</label>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {availableTechs.map(tech => {
                  const lp = Math.min(100, (tech.currentLoad / tech.capacity) * 100);
                  const lc = lp >= 90 ? 'bg-red-500' : lp >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                  const isSelected = selectedTech === tech.name;
                  return (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTech(tech.name)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left
                        ${isSelected
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-border bg-background hover:border-blue-200 hover:bg-muted/40'
                        }`}
                    >
                      <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0
                        ${tech.status === 'available' ? 'bg-emerald-600' :
                          tech.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'}`}>
                        {tech.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground">{tech.name}</span>
                          <span className={`text-[9px] font-bold ${LEVEL_COLOR[tech.level]}`}>Lv.{tech.level}</span>
                          <span className={`ml-auto text-[10px] shrink-0 capitalize font-medium
                            ${tech.status === 'available' ? 'text-emerald-600' :
                              tech.status === 'busy' ? 'text-amber-600' : 'text-slate-500'}`}>
                            {tech.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${lc}`} style={{ width: `${lp}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{tech.currentLoad}/{tech.capacity}h</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tech.skills.join(' · ')}</p>
                      </div>
                      {isSelected && (
                        <div className="size-4 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="size-3 text-white" />
                        </div>
                      )}
                      {tech.name === sugTech?.name && !isSelected && (
                        <Sparkles className="size-3.5 text-violet-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
              {chosenTech && (
                <div className={`mt-2 text-[11px] font-medium ${loadColor}`}>
                  Current load: {chosenTech.currentLoad}h / {chosenTech.capacity}h capacity
                  {loadPct >= 90 ? ' — ⚠ Near capacity' : loadPct >= 70 ? ' — Moderate' : ' — Good availability'}
                </div>
              )}
            </div>

            {/* Bay select */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bay Assignment</label>
              <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
                {ALL_BAYS.map(bay => {
                  const isOccupied = usedBays.includes(bay) && bay !== ro.bay;
                  const isSelected = selectedBay === bay;
                  return (
                    <button
                      key={bay}
                      onClick={() => !isOccupied && setSelectedBay(bay)}
                      disabled={isOccupied}
                      className={`px-2 py-2 text-[11px] rounded-lg border font-medium transition-all text-center
                        ${isSelected
                          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                          : isOccupied
                          ? 'border-border/40 bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
                          : 'border-border bg-background hover:border-blue-200 text-foreground hover:bg-muted/40'
                        }`}
                    >
                      {bay}
                      {isSelected && <span className="ml-1 text-blue-600">✓</span>}
                      {bay === sugBay && !isSelected && !isOccupied && (
                        <span className="ml-0.5 text-violet-500">✦</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-5 flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTech && selectedBay && onConfirm(ro.id, selectedTech, selectedBay)}
              disabled={!selectedTech || !selectedBay}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Assignment
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── AI Assign Panel ──────────────────────────────────────────────────────────

interface AISuggestion {
  ro: RepairOrder;
  tech: Technician;
  bay: string;
}

interface AIAssignPanelProps {
  unassignedCards: BoardCard[];
  allCards: BoardCard[];
  onAssign: (ro: RepairOrder) => void;
  onApplyAll: (suggestions: AISuggestion[]) => void;
}

function AIAssignPanel({ unassignedCards, allCards, onAssign, onApplyAll }: AIAssignPanelProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const availableTechs = TECHNICIANS.filter(t => t.status === 'available');

  const suggestions = useMemo<AISuggestion[]>(() => {
    const usedBays = new Set(allCards.filter(c => c.bay).map(c => c.bay!));
    const techLoad: Record<string, number> = {};
    TECHNICIANS.forEach(t => { techLoad[t.id] = t.currentLoad; });

    return unassignedCards.flatMap(card => {
      const ro = REPAIR_ORDERS.find(r => r.id === card.roId);
      if (!ro) return [];
      const isEV = ro.vehicle.toLowerCase().includes('tesla') || ro.vehicle.toLowerCase().includes('ev');

      const candidates = availableTechs
        .filter(t => techLoad[t.id] < t.capacity)
        .sort((a, b) => {
          const aEV = isEV && a.skills.some(s => s === 'EV' || s === 'HV') ? -1 : 0;
          const bEV = isEV && b.skills.some(s => s === 'EV' || s === 'HV') ? -1 : 0;
          if (aEV !== bEV) return aEV - bEV;
          return (techLoad[a.id] / a.capacity) - (techLoad[b.id] / b.capacity);
        });

      if (!candidates.length) return [];
      const tech = candidates[0];

      const freeBays = ALL_BAYS.filter(b => !usedBays.has(b));
      let bay = freeBays[0];
      if (isEV) {
        const evBay = freeBays.find(b => b.toLowerCase().includes('ev'));
        if (evBay) bay = evBay;
      }
      if (!bay) return [];

      usedBays.add(bay);
      techLoad[tech.id] = (techLoad[tech.id] ?? 0) + ro.laborHoursEstimated;
      return [{ ro, tech, bay }];
    });
  }, [unassignedCards, allCards, availableTechs]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={panelRef} className="ml-auto shrink-0 flex items-center gap-2 pl-5 border-l border-border relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all
          ${open
            ? 'bg-violet-600 text-white border-violet-600 shadow-sm shadow-violet-600/25'
            : 'text-violet-700 dark:text-violet-400 border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50'
          }`}
      >
        <Sparkles className="size-3.5" />
        AI: {availableTechs.length} tech{availableTechs.length !== 1 ? 's' : ''} available
        {suggestions.length > 0 && (
          <span className={`size-4 rounded-full text-[9px] font-bold flex items-center justify-center
            ${open ? 'bg-white/30 text-white' : 'bg-violet-600 text-white'}`}>
            {suggestions.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50 w-[420px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border bg-violet-50/60 dark:bg-violet-950/20">
              <div className="size-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">AI Dispatch Recommendations</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {suggestions.length} optimal pairing{suggestions.length !== 1 ? 's' : ''} · balanced by load, skills &amp; bay type
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Available technicians strip */}
            <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Available Now ({availableTechs.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableTechs.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">No technicians available right now</span>
                ) : availableTechs.map(tech => {
                  const pct = Math.min(100, (tech.currentLoad / tech.capacity) * 100);
                  const dotColor = pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <div
                      key={tech.id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background border border-border text-xs"
                      title={`${tech.name} · ${tech.currentLoad}/${tech.capacity}h · ${tech.skills.join(', ')}`}
                    >
                      <span className={`size-2 rounded-full shrink-0 ${dotColor}`} />
                      <span className="font-medium text-foreground">{tech.name}</span>
                      <span className={`text-[9px] font-bold ${LEVEL_COLOR[tech.level]}`}>Lv.{tech.level}</span>
                      <span className="text-muted-foreground tabular-nums">{tech.currentLoad}/{tech.capacity}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Suggestions */}
            <div className="max-h-64 overflow-y-auto divide-y divide-border/60">
              {suggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-6">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                    <CheckCircle2 className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All caught up</p>
                  <p className="text-xs text-muted-foreground">No unassigned ROs to pair right now.</p>
                </div>
              ) : suggestions.map(({ ro, tech, bay }, i) => {
                const loadAfter = Math.min(100, ((tech.currentLoad + ro.laborHoursEstimated) / tech.capacity) * 100);
                const loadBarColor = loadAfter >= 90 ? 'bg-red-500' : loadAfter >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
                const isEV = ro.vehicle.toLowerCase().includes('tesla') || ro.vehicle.toLowerCase().includes('ev');
                return (
                  <motion.div
                    key={ro.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors group"
                  >
                    <div className={`size-2 rounded-full shrink-0 ${PRIORITY_STRIP[ro.priority]}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono text-muted-foreground">{ro.roNumber}</span>
                        {isEV && <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">EV</span>}
                        {ro.hasFlag && <Flag className="size-2.5 text-red-500" />}
                      </div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{ro.customerName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ro.vehicle}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="size-3 text-muted-foreground/40" />
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-xs font-semibold text-foreground">{tech.name}</span>
                          <span className={`text-[9px] font-bold ${LEVEL_COLOR[tech.level]}`}>Lv.{tech.level}</span>
                        </div>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <MapPin className="size-2.5 text-muted-foreground" />
                          <span className="text-[11px] text-muted-foreground">{bay}</span>
                        </div>
                        <div className="w-20 h-1 bg-muted rounded-full overflow-hidden mt-1 ml-auto" title={`Load after: ${Math.round(loadAfter)}%`}>
                          <div className={`h-full rounded-full transition-all ${loadBarColor}`} style={{ width: `${loadAfter}%` }} />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => { onAssign(ro); setOpen(false); }}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold
                                 hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shadow-sm"
                    >
                      Assign
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            {suggestions.length > 0 && (
              <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground">
                  Click <strong>Assign</strong> to review, or apply all at once
                </p>
                <button
                  onClick={() => { onApplyAll(suggestions); setOpen(false); }}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold
                             hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/25"
                >
                  <Sparkles className="size-3.5" />
                  Apply All ({suggestions.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Board Page ──────────────────────────────────────────────────────────

interface DispatchBoardPageProps {
  role: Role;
}

function DispatchBoardInner({ role }: DispatchBoardPageProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cards, setCards] = useState<BoardCard[]>(() =>
    REPAIR_ORDERS.map(ro => ({
      roId: ro.id,
      columnId: getInitialColumn(ro),
      techName: ro.techName,
      bay: ro.bay,
    }))
  );
  const [assigningRO, setAssigningRO] = useState<RepairOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'compact'>('board');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const toastIdRef = useRef(0);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [role]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = String(++toastIdRef.current);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleDrop = useCallback((roId: string, fromColumn: ColumnId, toColumn: ColumnId) => {
    const ro = REPAIR_ORDERS.find(r => r.id === roId)!;

    setCards(prev => prev.map(c => c.roId === roId ? { ...c, columnId: toColumn } : c));

    const col = COLUMNS.find(c => c.id === toColumn)!;

    // If moving to assigned with no tech, open assignment modal
    if (toColumn === 'assigned') {
      const card = cards.find(c => c.roId === roId);
      if (!card?.techName) {
        setAssigningRO(ro);
        addToast(`${ro.roNumber} moved to ${col.label} — assign a tech`, 'info');
        return;
      }
    }

    addToast(`${ro.roNumber} → ${col.label}`, 'success');
  }, [cards, addToast]);

  const handleAssign = useCallback((ro: RepairOrder) => {
    setAssigningRO(ro);
  }, []);

  const handleAssignConfirm = useCallback((roId: string, techName: string, bay: string) => {
    const ro = REPAIR_ORDERS.find(r => r.id === roId)!;
    setCards(prev => prev.map(c =>
      c.roId === roId
        ? { ...c, columnId: 'assigned', techName, bay }
        : c
    ));
    setAssigningRO(null);
    addToast(`${ro.roNumber} assigned to ${techName} · ${bay}`, 'success');
  }, [addToast]);

  const handleApplyAll = useCallback((suggestions: AISuggestion[]) => {
    setCards(prev => {
      let next = [...prev];
      for (const { ro, tech, bay } of suggestions) {
        next = next.map(c =>
          c.roId === ro.id ? { ...c, columnId: 'assigned', techName: tech.name, bay } : c
        );
      }
      return next;
    });
    addToast(`AI assigned ${suggestions.length} RO${suggestions.length !== 1 ? 's' : ''} — review in Assigned column`, 'success');
  }, [addToast]);

  // Summary counts
  const colCounts = Object.fromEntries(
    COLUMNS.map(col => [col.id, cards.filter(c => c.columnId === col.id).length])
  );
  const unassignedCount = colCounts['unassigned'] ?? 0;
  const inProgressCount = (colCounts['assigned'] ?? 0) + (colCounts['repairing'] ?? 0);
  const urgentCount = cards.filter(c => {
    const ro = REPAIR_ORDERS.find(r => r.id === c.roId);
    return ro?.priority === 'urgent';
  }).length;

  // Filtered ROs
  const filteredCards = filterPriority === 'all'
    ? cards
    : cards.filter(c => {
        const ro = REPAIR_ORDERS.find(r => r.id === c.roId);
        return ro?.priority === filterPriority;
      });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="shrink-0 px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-36 animate-pulse" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 px-5 pb-5 flex gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 min-w-[280px] bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-5 pt-5 pb-3 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Trello className="size-4 text-blue-600" />
              <span className="text-xs text-muted-foreground font-medium">Dispatch Board</span>
            </div>
            <h1 className="text-foreground">Shop Dispatch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr} · {timeStr}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Priority filter */}
            <div className="hidden sm:flex items-center gap-1">
              {['all', 'urgent', 'high', 'medium'].map(p => (
                <button
                  key={p}
                  onClick={() => setFilterPriority(p)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium capitalize whitespace-nowrap
                    ${filterPriority === p
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
                    }`}
                >
                  {p === 'all' ? 'All' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('board')}
                className={`p-2 transition-colors ${viewMode === 'board' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                title="Board view"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 transition-colors ${viewMode === 'compact' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
                title="Compact view"
              >
                <List className="size-3.5" />
              </button>
            </div>

            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Refresh">
              <RefreshCw className="size-4" />
            </button>
            <DispatchAI />
            {(role === 'dispatcher' || role === 'manager') && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/25 min-h-[36px]">
                <Plus className="size-4" />
                <span className="text-sm hidden sm:inline">New RO</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary strip */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-5 overflow-x-auto scrollbar-none"
        >
          {[
            { label: 'Unassigned',  value: unassignedCount,               color: unassignedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground' },
            { label: 'Active',      value: inProgressCount,               color: 'text-blue-600 dark:text-blue-400' },
            { label: 'QC / Ready',  value: (colCounts['inspection'] ?? 0) + (colCounts['ready'] ?? 0), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Urgent',      value: urgentCount,                   color: urgentCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground' },
            { label: 'Total ROs',   value: cards.length,                  color: 'text-foreground' },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-1.5 shrink-0 ${i > 0 ? 'pl-5 border-l border-border' : ''}`}>
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={`text-sm font-semibold tabular-nums ${s.color}`}>{s.value}</span>
            </div>
          ))}

          {/* AI Assign Panel */}
          {unassignedCount > 0 && (
            <AIAssignPanel
              unassignedCards={cards.filter(c => c.columnId === 'unassigned')}
              allCards={cards}
              onAssign={handleAssign}
              onApplyAll={handleApplyAll}
            />
          )}
        </motion.div>
      </div>

      {/* ── Technician Rail ────────────────────────────────────────────────── */}
      <TechnicianRail cards={filteredCards} />

      {/* ── Kanban Board ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-max">
          {COLUMNS.map(colDef => {
            const colCards = filteredCards.filter(c => c.columnId === colDef.id);
            return (
              <BoardColumn
                key={colDef.id}
                colDef={colDef}
                cards={colCards}
                ros={REPAIR_ORDERS}
                role={role}
                onDrop={handleDrop}
                onAssign={handleAssign}
                allCards={cards}
              />
            );
          })}
        </div>
      </div>

      {/* ── Assignment Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {assigningRO && (
          <AssignModal
            ro={assigningRO}
            onConfirm={handleAssignConfirm}
            onClose={() => setAssigningRO(null)}
            allCards={cards}
          />
        )}
      </AnimatePresence>

      {/* ── Toast stack ─────────────────────────────────────────────────────── */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// Wrap with DndProvider
export function DispatchBoardPage({ role }: DispatchBoardPageProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DispatchBoardInner role={role} />
    </DndProvider>
  );
}
