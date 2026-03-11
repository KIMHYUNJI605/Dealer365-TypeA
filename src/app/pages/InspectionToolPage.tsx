import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Camera, ChevronDown, ChevronUp, Sparkles,
  Wrench, Car, X, CheckCircle2, AlertTriangle, XCircle,
  Shield, Zap, Package, Loader2, Clipboard, Share2,
  Printer, Mail, MessageSquare, DollarSign, User,
  AlertCircle, Circle, FileText, PenLine, CheckCheck,
  Gauge, Thermometer, Lightbulb,
} from 'lucide-react';
import { Role } from '../components/d365/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Verdict = 'ok' | 'recommend' | 'urgent' | null;
type OutputTab = 'dvi' | 'vhc' | 'approval';

interface InspectionItem {
  id: string;
  label: string;
  description?: string;
  verdict: Verdict;
  notes: string;
  photoCount: number;
  estimatedParts: number;
  estimatedLabor: number;
}

interface InspectionCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  items: InspectionItem[];
}

interface Stats {
  total: number;
  inspected: number;
  ok: number;
  recommend: number;
  urgent: number;
  remaining: number;
  totalEstimate: number;
}

type ItemWithCat = InspectionItem & { catLabel: string };

// ─── Verdict config ───────────────────────────────────────────────────────────

const VERDICT_CFG = {
  ok: {
    label: 'OK',
    Icon: CheckCircle2,
    activeClass: 'bg-emerald-500 text-white border-emerald-500',
    pillBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    pillText: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    stripClass: 'bg-emerald-500',
  },
  recommend: {
    label: 'Recommend',
    Icon: AlertTriangle,
    activeClass: 'bg-amber-500 text-white border-amber-500',
    pillBg: 'bg-amber-50 dark:bg-amber-900/30',
    pillText: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-800',
    stripClass: 'bg-amber-500',
  },
  urgent: {
    label: 'Urgent',
    Icon: XCircle,
    activeClass: 'bg-red-500 text-white border-red-500',
    pillBg: 'bg-red-50 dark:bg-red-900/30',
    pillText: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-200 dark:border-red-800',
    stripClass: 'bg-red-500',
  },
} as const;

// ─── Mock inspection data ─────────────────────────────────────────────────────

const INITIAL_CATEGORIES: InspectionCategory[] = [
  {
    id: 'brakes', label: 'Brakes', icon: Shield,
    accentClass: 'text-red-600 dark:text-red-400',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    items: [
      { id: 'b1', label: 'Front Brake Pad Thickness', description: 'Service limit: 3 mm', verdict: 'urgent', notes: 'FL: 1.5 mm / FR: 1.8 mm — below service limit', photoCount: 2, estimatedParts: 185, estimatedLabor: 120 },
      { id: 'b2', label: 'Rear Brake Pad Thickness', description: 'Service limit: 3 mm', verdict: 'recommend', notes: 'RL: 3.2 mm / RR: 3.0 mm — approaching limit', photoCount: 1, estimatedParts: 145, estimatedLabor: 100 },
      { id: 'b3', label: 'Front Rotor Condition', description: 'Check scoring, warping, minimum thickness', verdict: 'urgent', notes: 'Visible scoring on both rotors — replacement recommended with pad service', photoCount: 1, estimatedParts: 220, estimatedLabor: 80 },
      { id: 'b4', label: 'Rear Rotor Condition', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'b5', label: 'Brake Fluid Level & Condition', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'b6', label: 'Brake Lines & Hoses', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'tires', label: 'Tires & Wheels', icon: Circle,
    accentClass: 'text-amber-600 dark:text-amber-400',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    items: [
      { id: 't1', label: 'Front Left Tread Depth', description: 'Legal min: 2/32" · Recommended: 4/32"', verdict: 'recommend', notes: '4/32" — approaching replacement threshold', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 't2', label: 'Front Right Tread Depth', verdict: 'ok', notes: '6/32" — good condition', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 't3', label: 'Rear Left Tread Depth', verdict: 'ok', notes: '7/32" — good condition', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 't4', label: 'Rear Right Tread Depth', verdict: 'ok', notes: '7/32" — good condition', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 't5', label: 'Tire Pressure (all 4)', verdict: 'recommend', notes: 'FL: 28 psi (low, spec 35 psi) — adjusted during visit', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 't6', label: 'Wheel Condition & Lug Torque', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'fluids', label: 'Fluids', icon: Package,
    accentClass: 'text-blue-600 dark:text-blue-400',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    items: [
      { id: 'f1', label: 'Engine Oil Level & Condition', verdict: 'ok', notes: 'Recently changed — clean and at full mark', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'f2', label: 'Coolant Level & Condition', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'f3', label: 'Transmission Fluid', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'f4', label: 'Power Steering Fluid', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'f5', label: 'Windshield Washer Fluid', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'battery', label: 'Battery & Electrical', icon: Zap,
    accentClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
    items: [
      { id: 'ba1', label: 'Battery Voltage & Health', verdict: 'recommend', notes: '11.9 V cold — weak reading, approx. 3 years old', photoCount: 1, estimatedParts: 145, estimatedLabor: 30 },
      { id: 'ba2', label: 'Alternator Output', verdict: 'ok', notes: '13.8 V — within spec', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'ba3', label: 'Starter Motor Function', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'ba4', label: 'Battery Terminals & Connections', verdict: 'ok', notes: 'Clean — no corrosion present', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'engine', label: 'Engine', icon: Wrench,
    accentClass: 'text-slate-600 dark:text-slate-400',
    bgClass: 'bg-slate-100 dark:bg-slate-800',
    items: [
      { id: 'e1', label: 'Air Filter Condition', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'e2', label: 'Drive Belts & Tensioners', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'e3', label: 'Engine Hoses', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'e4', label: 'Engine Mounts', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'e5', label: 'Exhaust System', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'suspension', label: 'Suspension & Steering', icon: Car,
    accentClass: 'text-violet-600 dark:text-violet-400',
    bgClass: 'bg-violet-100 dark:bg-violet-900/30',
    items: [
      { id: 's1', label: 'Front Struts / Shocks', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 's2', label: 'Rear Shocks', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 's3', label: 'Tie Rod Ends', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 's4', label: 'Ball Joints', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 's5', label: 'CV Boots & Axles', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
  {
    id: 'lights', label: 'Lights & Visibility', icon: Lightbulb,
    accentClass: 'text-emerald-600 dark:text-emerald-400',
    bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
    items: [
      { id: 'l1', label: 'Headlights & DRL', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'l2', label: 'Brake & Tail Lights', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'l3', label: 'Turn Signals & Hazards', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'l4', label: 'Windshield & Wiper Blades', verdict: 'recommend', notes: 'Streaking on both blades — worn, recommend replacement', photoCount: 0, estimatedParts: 35, estimatedLabor: 15 },
    ],
  },
  {
    id: 'hvac', label: 'HVAC & Interior', icon: Thermometer,
    accentClass: 'text-teal-600 dark:text-teal-400',
    bgClass: 'bg-teal-100 dark:bg-teal-900/30',
    items: [
      { id: 'h1', label: 'Cabin Air Filter', verdict: 'recommend', notes: 'Heavily soiled — recommend immediate replacement', photoCount: 1, estimatedParts: 28, estimatedLabor: 15 },
      { id: 'h2', label: 'A/C System Function', verdict: 'ok', notes: 'Blowing cold at 38 °F — system normal', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'h3', label: 'Heater Function', verdict: 'ok', notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
      { id: 'h4', label: 'Interior Lights & Controls', verdict: null, notes: '', photoCount: 0, estimatedParts: 0, estimatedLabor: 0 },
    ],
  },
];

// ─── AI Summary content (mock) ────────────────────────────────────────────────

const AI_SUMMARY = `INSPECTION SUMMARY — RO-10284
Vehicle: 2022 Honda Accord Sport · Bay 4
Technician: Jordan Davis

🔴 URGENT (2 items — immediate action required):
• Front Brake Pads: 1.5–1.8 mm (below 3 mm service limit). Vehicle unsafe without brake service. Parts + labor: $305.
• Front Rotors: Scoring visible on both rotors. Replacement recommended alongside pad service. Est: $300.

🟡 RECOMMENDED (6 items — customer advisement):
• Rear brake pads approaching limit (3.0–3.2 mm)
• Front left tire tread at threshold (4/32")
• Front left tire pressure adjusted (28→35 psi)
• Battery showing weak voltage — 3 yrs old, pre-winter replacement advised — $175
• Wiper blades streaking — $50
• Cabin air filter heavily soiled — $43

✅ OK — 12 items inspected and within specification.

💬 Suggested customer message:
"Hi Marcus — we completed your Multi-Point Inspection on your Accord. Your front brakes need immediate attention (pads below the safety limit with rotor scoring). I'm also flagging 6 items worth discussing. I'll send the full report with pricing now — just say the word and we'll take care of everything today."`;

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ inspected, total, size = 52 }: { inspected: number; total: number; size?: number }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? inspected / total : 0;
  const urgentColor = ''; // handled via className
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size} height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          className="stroke-muted" strokeWidth={4.5} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          className="stroke-blue-600" strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - pct * circ }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-[10px] font-bold text-foreground tabular-nums leading-none">{inspected}</span>
        <span className="text-[8px] text-muted-foreground leading-none mt-0.5">/{total}</span>
      </div>
    </div>
  );
}

// ─── Vehicle Context Bar ──────────────────────────────────────────────────────

function VehicleContextBar({ onBack, stats }: { onBack?: () => void; stats: Stats }) {
  return (
    <div className="shrink-0 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Back to My Jobs"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono text-muted-foreground tracking-wide">RO-10284</span>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">Multi-Point Inspection</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground">Marcus Rivera</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground truncate">2022 Honda Accord Sport</span>
          </div>
        </div>

        <ProgressRing inspected={stats.inspected} total={stats.total} />
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
        <span className="flex items-center gap-1.5 shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
          <CheckCircle2 className="size-3" /> {stats.ok} OK
        </span>
        <span className="flex items-center gap-1.5 shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
          <AlertTriangle className="size-3" /> {stats.recommend} Rec.
        </span>
        {stats.urgent > 0 && (
          <motion.span
            initial={{ scale: 0.9 }} animate={{ scale: 1 }}
            className="flex items-center gap-1.5 shrink-0 text-[11px] px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium"
          >
            <XCircle className="size-3" /> {stats.urgent} Urgent
          </motion.span>
        )}
        {stats.remaining > 0 && (
          <span className="text-[11px] text-muted-foreground shrink-0 ml-1">{stats.remaining} remaining</span>
        )}
        {stats.totalEstimate > 0 && (
          <span className="text-[11px] font-semibold text-foreground shrink-0 ml-auto tabular-nums">
            Est. ${stats.totalEstimate.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Checklist Row ────────────────────────────────────────────────────────────

function ChecklistRow({ item, onChange }: {
  item: InspectionItem;
  onChange: (update: Partial<InspectionItem>) => void;
}) {
  const [expanded, setExpanded] = useState(
    item.verdict === 'recommend' || item.verdict === 'urgent'
  );

  useEffect(() => {
    if (item.verdict === 'recommend' || item.verdict === 'urgent') {
      setExpanded(true);
    }
  }, [item.verdict]);

  const needsExpansion = item.verdict === 'recommend' || item.verdict === 'urgent';
  const verdictCfg = item.verdict ? VERDICT_CFG[item.verdict] : null;

  const rowBg =
    item.verdict === 'urgent' ? 'bg-red-50/40 dark:bg-red-950/10' :
    item.verdict === 'recommend' ? 'bg-amber-50/40 dark:bg-amber-950/10' : '';

  return (
    <div className={`border-b border-border/40 last:border-0 transition-colors ${rowBg}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3 min-h-[56px]">
        {/* Verdict color strip */}
        <div className={`w-[3px] self-stretch rounded-full shrink-0 transition-colors ${
          item.verdict ? VERDICT_CFG[item.verdict].stripClass : 'bg-border'
        }`} />

        {/* Label + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{item.label}</p>
          {item.description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
          )}
          {item.photoCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Camera className="size-3 text-blue-500" />
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                {item.photoCount} photo{item.photoCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Verdict buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(['ok', 'recommend', 'urgent'] as const).map(v => {
            const cfg = VERDICT_CFG[v];
            const isActive = item.verdict === v;
            return (
              <motion.button
                key={v}
                onClick={() => onChange({ verdict: item.verdict === v ? null : v })}
                whileTap={{ scale: 0.88 }}
                title={cfg.label}
                aria-label={`Mark as ${cfg.label}`}
                aria-pressed={isActive}
                className={`size-9 rounded-full border flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                  ${isActive ? cfg.activeClass : 'border-border text-muted-foreground hover:border-slate-400 dark:hover:border-slate-500'}`}
              >
                <cfg.Icon className="size-[15px]" />
              </motion.button>
            );
          })}
        </div>

        {/* Expand toggle */}
        {item.verdict !== null && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted shrink-0"
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        )}
      </div>

      {/* Expanded section */}
      <AnimatePresence initial={false}>
        {expanded && item.verdict !== null && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 ml-4 border-l-2 border-border/30 ml-5 pl-4">

              {/* Notes */}
              <textarea
                value={item.notes}
                onChange={e => onChange({ notes: e.target.value })}
                placeholder={`Technician notes${needsExpansion ? ' — required for approval request' : ''}…`}
                rows={2}
                className="w-full text-xs bg-muted/40 border border-border rounded-xl px-3 py-2.5 resize-none
                           outline-none focus:border-blue-400 focus:bg-background transition-all
                           placeholder:text-muted-foreground"
              />

              {/* Parts & labor estimate */}
              {needsExpansion && (
                <div className="flex items-center gap-2">
                  <DollarSign className="size-3.5 text-muted-foreground shrink-0" />
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">Parts</span>
                      <input
                        type="number"
                        value={item.estimatedParts || ''}
                        onChange={e => onChange({ estimatedParts: Number(e.target.value) })}
                        placeholder="0"
                        className="w-20 text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5
                                   outline-none focus:border-blue-400 text-right tabular-nums"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[10px] text-muted-foreground shrink-0">Labor</span>
                      <input
                        type="number"
                        value={item.estimatedLabor || ''}
                        onChange={e => onChange({ estimatedLabor: Number(e.target.value) })}
                        placeholder="0"
                        className="w-20 text-xs bg-muted/40 border border-border rounded-lg px-2 py-1.5
                                   outline-none focus:border-blue-400 text-right tabular-nums"
                      />
                    </div>
                    {(item.estimatedParts + item.estimatedLabor) > 0 && (
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        = ${(item.estimatedParts + item.estimatedLabor).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Photo attachment (simulated) */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => onChange({ photoCount: item.photoCount + 1 })}
                  className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <Camera className="size-3.5" /> Add photo
                </button>
                {item.photoCount > 0 && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">
                      {item.photoCount} attached
                    </span>
                    <button
                      onClick={() => onChange({ photoCount: Math.max(0, item.photoCount - 1) })}
                      className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Remove last
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ category, expanded, onToggle, onItemChange }: {
  category: InspectionCategory;
  expanded: boolean;
  onToggle: () => void;
  onItemChange: (itemId: string, update: Partial<InspectionItem>) => void;
}) {
  const total = category.items.length;
  const inspected = category.items.filter(i => i.verdict !== null).length;
  const urgent = category.items.filter(i => i.verdict === 'urgent').length;
  const recommend = category.items.filter(i => i.verdict === 'recommend').length;
  const Icon = category.icon;
  const progressPct = total > 0 ? (inspected / total) * 100 : 0;
  const barColor = urgent > 0 ? 'bg-red-500' : recommend > 0 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-muted/20 hover:bg-muted/40 transition-colors text-left min-h-[56px]"
        aria-expanded={expanded}
      >
        <div className={`size-8 rounded-xl ${category.bgClass} flex items-center justify-center shrink-0`}>
          <Icon className={`size-4 ${category.accentClass}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{category.label}</span>
            {urgent > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 uppercase tracking-wide">
                {urgent} urgent
              </span>
            )}
            {recommend > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                {recommend} rec.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground tabular-nums">{inspected}/{total}</span>
          <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${barColor}`}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border/40">
              {category.items.map(item => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onChange={update => onItemChange(item.id, update)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────

function AIPanel({ loading, onClose, stats }: { loading: boolean; onClose: () => void; stats: Stats }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="mx-4 mt-4 mb-2 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-200/60 dark:border-blue-800/60">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">AI Inspection Summary</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-blue-700 dark:text-blue-300">
              <Loader2 className="size-4 animate-spin shrink-0" />
              <span className="text-sm">Analyzing {stats.inspected} inspection points…</span>
            </div>
            <div className="space-y-2">
              {[80, 60, 90, 70].map((w, i) => (
                <div key={i} className="h-2.5 bg-blue-200/60 dark:bg-blue-800/60 rounded-full animate-pulse"
                  style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <pre className="text-xs text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed font-sans">
              {AI_SUMMARY}
            </pre>
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <Clipboard className="size-3.5" /> Copy to clipboard
              </button>
              <span className="text-blue-300 dark:text-blue-700 text-xs">·</span>
              <button className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                <MessageSquare className="size-3.5" /> Draft SMS to customer
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Submit Bar ───────────────────────────────────────────────────────────────

function SubmitBar({ stats, onAI, aiActive, onSubmit }: {
  stats: Stats;
  onAI: () => void;
  aiActive: boolean;
  onSubmit: () => void;
}) {
  const canSubmit = stats.remaining === 0 || stats.urgent > 0;
  const pct = stats.total > 0 ? (stats.inspected / stats.total) * 100 : 0;

  return (
    <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-4 pt-3 pb-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600 rounded-full"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {stats.inspected}/{stats.total} inspected
        </span>
        {stats.totalEstimate > 0 && (
          <span className="text-xs font-semibold text-foreground tabular-nums shrink-0">
            ${stats.totalEstimate.toLocaleString()} est.
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* AI button */}
        <button
          onClick={onAI}
          className={`flex items-center gap-2 px-3.5 py-3 rounded-xl border text-sm font-medium transition-all min-h-[48px] shrink-0
            ${aiActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
              : 'border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600'
            }`}
        >
          <Sparkles className="size-4 shrink-0" />
          <span className="hidden sm:inline text-sm">AI Summary</span>
        </button>

        {/* Submit */}
        <motion.button
          onClick={canSubmit ? onSubmit : undefined}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[56px]
            ${canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-default'
            }`}
          aria-disabled={!canSubmit}
        >
          {stats.remaining === 0 ? (
            <><CheckCheck className="size-4" /> Submit Inspection</>
          ) : stats.urgent > 0 ? (
            <><AlertTriangle className="size-4" /> Submit with {stats.urgent} Urgent</>
          ) : (
            <><Circle className="size-4" /> {stats.remaining} items remaining</>
          )}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Output Panel (post-submit bottom sheet) ──────────────────────────────────

function OutputPanel({ categories, stats, onClose, activeTab, onTabChange }: {
  categories: InspectionCategory[];
  stats: Stats;
  onClose: () => void;
  activeTab: OutputTab;
  onTabChange: (t: OutputTab) => void;
}) {
  const urgentItems: ItemWithCat[] = categories.flatMap(c =>
    c.items.filter(i => i.verdict === 'urgent').map(i => ({ ...i, catLabel: c.label }))
  );
  const recommendItems: ItemWithCat[] = categories.flatMap(c =>
    c.items.filter(i => i.verdict === 'recommend').map(i => ({ ...i, catLabel: c.label }))
  );
  const okItems: ItemWithCat[] = categories.flatMap(c =>
    c.items.filter(i => i.verdict === 'ok').map(i => ({ ...i, catLabel: c.label }))
  );

  const tabs = [
    { id: 'dvi' as const,      label: 'Internal DVI',  Icon: Clipboard },
    { id: 'vhc' as const,      label: 'Customer VHC',  Icon: User },
    { id: 'approval' as const, label: 'Approval Pkg',  Icon: FileText },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background rounded-t-3xl shadow-2xl border-t border-border"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/25 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <span className="text-sm font-semibold text-foreground">Inspection Recorded</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              RO-10284 · Marcus Rivera · {stats.inspected}/{stats.total} items
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-border shrink-0 overflow-x-auto scrollbar-none">
          {stats.urgent > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 shrink-0">
              <XCircle className="size-3.5" />
              <span className="text-xs font-semibold">{stats.urgent} Urgent</span>
            </div>
          )}
          {stats.recommend > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 shrink-0">
              <AlertTriangle className="size-3.5" />
              <span className="text-xs font-semibold">{stats.recommend} Recommend</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="size-3.5" />
            <span className="text-xs font-semibold">{stats.ok} OK</span>
          </div>
          {stats.totalEstimate > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted shrink-0 ml-auto">
              <DollarSign className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">
                ${stats.totalEstimate.toLocaleString()} est.
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium border-b-2 transition-all
                ${activeTab === id
                  ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'dvi' && <DVITab urgentItems={urgentItems} recommendItems={recommendItems} okItems={okItems} />}
          {activeTab === 'vhc' && <VHCTab urgentItems={urgentItems} recommendItems={recommendItems} okItems={okItems} />}
          {activeTab === 'approval' && <ApprovalTab urgentItems={urgentItems} recommendItems={recommendItems} stats={stats} />}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-5 py-4 border-t border-border flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[48px]">
            <Printer className="size-4" /> Print
          </button>
          <button className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors min-h-[48px]">
            <Share2 className="size-4" /> Share
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[48px] shadow-sm shadow-blue-600/20">
            <Mail className="size-4" /> Send to Customer
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── DVI Tab — internal record ────────────────────────────────────────────────

function ItemCard({ item, colorClass, borderClass }: {
  item: ItemWithCat;
  colorClass: string;
  borderClass: string;
}) {
  const est = item.estimatedParts + item.estimatedLabor;
  return (
    <div className={`rounded-xl border ${borderClass} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground">{item.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{item.catLabel}</p>
        </div>
        {est > 0 && (
          <span className="text-xs font-bold text-foreground shrink-0 tabular-nums">${est.toLocaleString()}</span>
        )}
      </div>
      {item.notes && (
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.notes}</p>
      )}
      {item.photoCount > 0 && (
        <div className="flex items-center gap-1 mt-1.5">
          <Camera className="size-3 text-blue-500" />
          <span className="text-[10px] text-blue-600 dark:text-blue-400">{item.photoCount} photo{item.photoCount > 1 ? 's' : ''} attached</span>
        </div>
      )}
    </div>
  );
}

function DVITab({ urgentItems, recommendItems, okItems }: {
  urgentItems: ItemWithCat[]; recommendItems: ItemWithCat[]; okItems: ItemWithCat[];
}) {
  const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Internal DVI Record</span>
        <span className="text-muted-foreground/30">·</span>
        <span>Jordan Davis</span>
        <span className="text-muted-foreground/30">·</span>
        <span>{now}</span>
      </div>

      {urgentItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="size-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
              Urgent ({urgentItems.length})
            </span>
          </div>
          <div className="space-y-2">
            {urgentItems.map(item => (
              <ItemCard key={item.id} item={item}
                colorClass="bg-red-50 dark:bg-red-950/30"
                borderClass="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
              />
            ))}
          </div>
        </div>
      )}

      {recommendItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Recommended ({recommendItems.length})
            </span>
          </div>
          <div className="space-y-2">
            {recommendItems.map(item => (
              <ItemCard key={item.id} item={item}
                colorClass="bg-amber-50 dark:bg-amber-950/30"
                borderClass="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
              />
            ))}
          </div>
        </div>
      )}

      {okItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Within Spec ({okItems.length})
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {okItems.map(item => (
              <div key={item.id}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50"
              >
                <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                <span className="text-xs text-foreground leading-tight truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VHC Tab — customer-facing ────────────────────────────────────────────────

function VHCTab({ urgentItems, recommendItems, okItems }: {
  urgentItems: ItemWithCat[]; recommendItems: ItemWithCat[]; okItems: ItemWithCat[];
}) {
  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="rounded-2xl border border-border p-4 bg-muted/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
            <Car className="size-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Vehicle Health Check</p>
            <p className="text-xs text-muted-foreground">2022 Honda Accord Sport · Marcus Rivera</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Our certified technician completed a full Multi-Point Inspection on your vehicle. Here's a clear summary of findings to help keep your Accord safe and running at its best.
        </p>
      </div>

      {urgentItems.length > 0 && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500 text-white">
            <XCircle className="size-4" />
            <span className="text-sm font-semibold">Needs Immediate Attention</span>
          </div>
          <div className="divide-y divide-red-100 dark:divide-red-900/60">
            {urgentItems.map(item => {
              const est = item.estimatedParts + item.estimatedLabor;
              return (
                <div key={item.id} className="px-4 py-3 bg-red-50 dark:bg-red-950/20">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {est > 0 && <span className="text-sm font-bold text-foreground shrink-0">${est.toLocaleString()}</span>}
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recommendItems.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white">
            <AlertTriangle className="size-4" />
            <span className="text-sm font-semibold">Recommended Services</span>
          </div>
          <div className="divide-y divide-amber-100 dark:divide-amber-900/60">
            {recommendItems.map(item => {
              const est = item.estimatedParts + item.estimatedLabor;
              return (
                <div key={item.id} className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    {est > 0 && <span className="text-sm font-bold text-foreground shrink-0">${est.toLocaleString()}</span>}
                  </div>
                  {item.notes && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.notes}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 bg-emerald-50 dark:bg-emerald-950/20 flex items-start gap-3">
        <CheckCircle2 className="size-5 text-emerald-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {okItems.length} items inspected and within specification
          </p>
          <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-0.5">
            Engine oil, coolant, belts, lights, and more — all green.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Tab ─────────────────────────────────────────────────────────────

function ApprovalTab({ urgentItems, recommendItems, stats }: {
  urgentItems: ItemWithCat[]; recommendItems: ItemWithCat[]; stats: Stats;
}) {
  const urgentTotal = urgentItems.reduce((s, i) => s + i.estimatedParts + i.estimatedLabor, 0);
  const recommendTotal = recommendItems.reduce((s, i) => s + i.estimatedParts + i.estimatedLabor, 0);
  const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* RO info */}
      <div className="rounded-2xl border border-border p-4 space-y-2.5 bg-muted/10">
        {[
          { label: 'Customer',   value: 'Marcus Rivera' },
          { label: 'Vehicle',    value: '2022 Honda Accord Sport' },
          { label: 'RO Number',  value: 'RO-10284', mono: true },
          { label: 'Technician', value: 'Jordan Davis' },
          { label: 'Date',       value: now },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
            <span className={`text-xs font-medium text-foreground text-right ${row.mono ? 'font-mono' : ''}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* Urgent line items */}
      {urgentItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Urgent — Authorization Required
          </p>
          <div className="space-y-2">
            {urgentItems.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-3.5 py-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {item.estimatedParts > 0 && <span>Parts: ${item.estimatedParts}</span>}
                    {item.estimatedParts > 0 && item.estimatedLabor > 0 && <span>·</span>}
                    {item.estimatedLabor > 0 && <span>Labor: ${item.estimatedLabor}</span>}
                  </div>
                </div>
                {(item.estimatedParts + item.estimatedLabor) > 0 && (
                  <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                    ${(item.estimatedParts + item.estimatedLabor).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended line items */}
      {recommendItems.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Recommended — Optional
          </p>
          <div className="space-y-2">
            {recommendItems.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3 px-3.5 py-3 rounded-xl bg-muted/30 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    {item.estimatedParts > 0 && <span>Parts: ${item.estimatedParts}</span>}
                    {item.estimatedParts > 0 && item.estimatedLabor > 0 && <span>·</span>}
                    {item.estimatedLabor > 0 && <span>Labor: ${item.estimatedLabor}</span>}
                  </div>
                </div>
                {(item.estimatedParts + item.estimatedLabor) > 0 && (
                  <span className="text-sm font-bold text-foreground tabular-nums shrink-0">
                    ${(item.estimatedParts + item.estimatedLabor).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
        {urgentTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Urgent repairs</span>
            <span className="font-semibold text-red-600 dark:text-red-400 tabular-nums">${urgentTotal.toLocaleString()}</span>
          </div>
        )}
        {recommendTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recommended services</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">${recommendTotal.toLocaleString()}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm font-semibold text-foreground">Total estimate</span>
          <span className="text-base font-bold text-foreground tabular-nums">${stats.totalEstimate.toLocaleString()}</span>
        </div>
      </div>

      {/* E-signature placeholder */}
      <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center space-y-2">
        <PenLine className="size-6 text-muted-foreground mx-auto" />
        <p className="text-sm font-medium text-foreground">Customer Authorization</p>
        <p className="text-xs text-muted-foreground">Send via SMS or email to collect e-signature</p>
        <button className="mx-auto mt-1 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
          <MessageSquare className="size-3.5" /> Send Approval Request
        </button>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface InspectionToolPageProps {
  role: Role;
  onNavigate?: (nav: string) => void;
}

export function InspectionToolPage({ role, onNavigate }: InspectionToolPageProps) {
  const [categories, setCategories] = useState<InspectionCategory[]>(INITIAL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['brakes', 'tires'])
  );
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [outputTab, setOutputTab] = useState<OutputTab>('dvi');

  const stats = useMemo<Stats>(() => {
    const all = categories.flatMap(c => c.items);
    const ok = all.filter(i => i.verdict === 'ok').length;
    const recommend = all.filter(i => i.verdict === 'recommend').length;
    const urgent = all.filter(i => i.verdict === 'urgent').length;
    const inspected = ok + recommend + urgent;
    const total = all.length;
    const totalEstimate = all.reduce((s, i) => s + i.estimatedParts + i.estimatedLabor, 0);
    return { total, inspected, ok, recommend, urgent, remaining: total - inspected, totalEstimate };
  }, [categories]);

  const updateItem = useCallback((catId: string, itemId: string, update: Partial<InspectionItem>) => {
    setCategories(prev => prev.map(cat =>
      cat.id !== catId ? cat
        : { ...cat, items: cat.items.map(it => it.id !== itemId ? it : { ...it, ...update }) }
    ));
  }, []);

  const toggleCategory = useCallback((id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleAI = () => {
    if (aiDone) { setShowAI(v => !v); return; }
    setShowAI(true);
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setAiDone(true); }, 2200);
  };

  const displayCategories = activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === activeCategory);

  // Category chip data
  const chips = [
    { id: 'all', label: 'All', urgent: stats.urgent },
    ...categories.map(c => ({
      id: c.id,
      label: c.label,
      urgent: c.items.filter(i => i.verdict === 'urgent').length,
    })),
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">

      {/* ── Vehicle context + progress ──────────────────────────────────────── */}
      <VehicleContextBar onBack={() => onNavigate?.('my-jobs')} stats={stats} />

      {/* ── Category filter chips (sticky) ─────────────────────────────────── */}
      <div className="shrink-0 flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-border bg-background/95 backdrop-blur-sm">
        {chips.map(chip => (
          <button
            key={chip.id}
            onClick={() => setActiveCategory(chip.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all min-h-[34px]
              ${activeCategory === chip.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            {chip.label}
            {chip.urgent > 0 && (
              <span className={`flex items-center justify-center size-4 text-[9px] font-bold rounded-full shrink-0
                ${activeCategory === chip.id ? 'bg-white/30 text-white' : 'bg-red-500 text-white'}`}>
                {chip.urgent}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Scrollable main content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* AI Panel */}
        <AnimatePresence>
          {showAI && (
            <AIPanel
              loading={aiLoading}
              onClose={() => setShowAI(false)}
              stats={stats}
            />
          )}
        </AnimatePresence>

        {/* Category sections */}
        <div className="divide-y divide-border">
          {displayCategories.map(category => (
            <CategorySection
              key={category.id}
              category={category}
              expanded={expandedCategories.has(category.id)}
              onToggle={() => toggleCategory(category.id)}
              onItemChange={(itemId, update) => updateItem(category.id, itemId, update)}
            />
          ))}
        </div>

        {/* Bottom padding for submit bar */}
        <div className="h-4" />
      </div>

      {/* ── Sticky submit bar ───────────────────────────────────────────────── */}
      <SubmitBar
        stats={stats}
        onAI={handleAI}
        aiActive={showAI}
        onSubmit={() => { setSubmitted(true); setOutputTab('dvi'); }}
      />

      {/* ── Output bottom sheet ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {submitted && (
          <OutputPanel
            categories={categories}
            stats={stats}
            onClose={() => setSubmitted(false)}
            activeTab={outputTab}
            onTabChange={setOutputTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
