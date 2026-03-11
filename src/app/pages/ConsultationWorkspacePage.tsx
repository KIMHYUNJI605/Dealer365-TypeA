import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Sparkles, ChevronDown, ChevronRight,
  Car, Phone, Mail, MessageSquare, Clock,
  Zap, Shield, Route, FileText,
  PenLine, ArrowRight, CheckCircle2, Loader2, Tag,
  TrendingUp,
} from 'lucide-react';
import { Role } from '../components/d365/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type WorkspaceTab = 'overview' | 'test-drive';

// ─── Data ─────────────────────────────────────────────────────────────────────
const CONSULT = {
  refNumber: 'APT-5002', status: 'in-consultation' as const,
  customerName: 'Olivia Pham', initials: 'OP',
  phone: '(310) 555-0182', email: 'olivia.pham@email.com',
  source: 'CRM · Returning Customer', consultant: 'Alex Torres',
  scheduledTime: '9:00 AM', elapsed: '42 min',
  vehicle: { year: 2023, make: 'Toyota', model: 'Camry', trim: 'XSE', msrp: 31200, color: 'Blueprint Blue' },
  interests: ['Financing', 'Extended Warranty', '72-month term', 'Trade-in'],
  tradeIn: { vehicle: '2019 Honda Civic EX', acv: 14500, status: 'pending' as const },
  notes: `Returning customer — purchased a 2020 RAV4 with us 3 yrs ago. Shopping for a sportier daily driver.

Prefers XSE trim for dual-zone A/C and sport suspension. Open to Nightshade if price delta is reasonable.

Pre-approved: Southeast Financial @ 6.9% APR / 72 months. Trade-in offer of $14,500 on 2019 Civic EX — customer hesitant, wants to shop it.`,
};

const DEAL = { score: 74, budgetMonthly: 300, currentMonthly: 292, gap: 8 };

const ACTIVITY = [
  { time: '9:08 AM', text: 'Customer arrived on time. Confirmed interest in XSE trim.' },
  { time: '9:15 AM', text: 'Trade-in ACV completed: $14,500 on 2019 Civic EX. Customer hesitant — wants to shop.' },
  { time: '9:28 AM', text: 'Reviewed financing: pre-approved @ 6.9% / 72mo, ~$292/mo with $3K down.' },
  { time: '9:41 AM', text: 'Expressed interest in Nightshade once price delta shown. Requesting side-by-side quote.' },
];

const LIFECYCLE = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'checked-in', label: 'Checked In' },
  { key: 'in-consultation', label: 'In Consult' },
  { key: 'completed', label: 'Done' },
];

const TD_TIMES = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

const AI_TEXT = `CONSULTATION BRIEF — APT-5002
Olivia Pham · 2023 Camry XSE · 42 min

💰 DEAL POSITION
Offer: $292/mo (72mo · 6.9% · $3K dn · $14.5K trade)
Budget: $300/mo — GAP: $8/mo — close to deal

🎯 NEXT BEST ACTION
Schedule test drive now. Driving conviction converts
hesitant buyers at 68% vs. 31% for desk-only closes.
Then address trade-in gap on the write-up.

📋 SUGGESTED CLOSE LINE
"Olivia, let's put you in it for 15 minutes — then
we'll work the numbers to hit your $300 target."

🔍 CUSTOMER SIGNALS
• Returning buyer — positive relationship
• Payment-sensitive, not price-sensitive
• Trade hesitancy is the main objection`;

// ─── Shared sub-components ────────────────────────────────────────────────────

function DataRow({ label, value, action }: {
  label: string; value: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 min-h-[36px]">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest w-[72px] shrink-0">
        {label}
      </span>
      <span className="text-xs text-foreground flex-1 truncate">{value}</span>
      {action}
    </div>
  );
}

function DealScoreGauge({ score }: { score: number }) {
  const r = 36, cx = 50, cy = 48;
  const arcLen = Math.PI * r;
  const filled = (score / 100) * arcLen;
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  const color = score >= 75 ? '#22c55e' : score >= 55 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Strong' : score >= 55 ? 'Warm' : 'Early';
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 100, height: 56 }}>
        <svg viewBox="0 0 100 54" className="w-full h-full overflow-visible">
          <path d={d} fill="none" strokeWidth={7} className="stroke-muted" strokeLinecap="round" />
          <motion.path d={d} fill="none" strokeWidth={7} stroke={color} strokeLinecap="round"
            strokeDasharray={`0 ${arcLen}`}
            animate={{ strokeDasharray: `${filled} ${arcLen}` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-end pb-1.5 flex-col">
          <span className="text-[22px] font-bold tabular-nums leading-none" style={{ color }}>{score}</span>
        </div>
      </div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
        {label} · Deal Score
      </p>
    </div>
  );
}

// ─── Deal strip — persistent financial context row ────────────────────────────
function DealStrip() {
  return (
    <div className="flex items-center px-4 py-2 bg-muted/20 border-b border-border overflow-x-auto scrollbar-none gap-0">
      {/* Vehicle */}
      <div className="flex items-center gap-2 shrink-0 pr-4 mr-4 border-r border-border">
        <div className="size-5 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
          <Car className="size-3 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-foreground leading-tight">
            {CONSULT.vehicle.year} {CONSULT.vehicle.make} {CONSULT.vehicle.model}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight">{CONSULT.vehicle.trim}</p>
        </div>
      </div>
      {/* MSRP */}
      <div className="shrink-0 pr-4 mr-4 border-r border-border">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">MSRP</p>
        <p className="text-[12px] font-bold text-foreground tabular-nums leading-tight">
          ${CONSULT.vehicle.msrp.toLocaleString()}
        </p>
      </div>
      {/* Est. Monthly */}
      <div className="shrink-0 pr-4 mr-4 border-r border-border">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">Est. Monthly</p>
        <p className="text-[12px] font-bold text-blue-600 dark:text-blue-400 tabular-nums leading-tight">
          ${DEAL.currentMonthly}/mo
        </p>
      </div>
      {/* Trade-in */}
      <div className="shrink-0 pr-4 mr-4 border-r border-border hidden sm:block">
        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">Trade-In</p>
        <div className="flex items-center gap-1">
          <p className="text-[12px] font-bold text-foreground tabular-nums leading-tight">
            ${CONSULT.tradeIn.acv.toLocaleString()}
          </p>
          <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending</span>
        </div>
      </div>
      {/* Gap indicator */}
      <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <TrendingUp className="size-3 text-amber-600 dark:text-amber-400" />
        <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
          ${DEAL.gap}/mo to close
        </span>
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function ConsultationHeader({ onBack }: { onBack: () => void }) {
  const idx = LIFECYCLE.findIndex(s => s.key === CONSULT.status);
  return (
    <div className="shrink-0 bg-background border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={onBack}
          className="p-2 -ml-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors size-11 flex items-center justify-center shrink-0">
          <ArrowLeft className="size-5" />
        </button>
        <div className="size-9 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white">{CONSULT.initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{CONSULT.customerName}</span>
            <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {CONSULT.refNumber}
            </span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold">
              In Consultation
            </span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="size-2.5" /> {CONSULT.elapsed}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {CONSULT.consultant} · {CONSULT.source}
          </p>
        </div>
        {/* Lifecycle stepper */}
        <div className="hidden lg:flex items-center gap-0 shrink-0">
          {LIFECYCLE.map((step, i) => {
            const done = i < idx, active = i === idx;
            return (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold transition-all
                  ${active ? 'bg-blue-600 text-white' : done ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}`}>
                  {done
                    ? <CheckCircle2 className="size-3 shrink-0" />
                    : <div className={`size-1.5 rounded-full shrink-0 ${active ? 'bg-white/60' : 'bg-current'}`} />
                  }
                  {step.label}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div className={`w-3 h-px mx-0.5 ${i < idx ? 'bg-emerald-400' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <DealStrip />
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────
const TABS: { id: WorkspaceTab; label: string; Icon: React.ElementType }[] = [
  { id: 'overview',   label: 'Overview',   Icon: FileText },
  { id: 'test-drive', label: 'Test Drive', Icon: Route    },
];

function TabBar({ active, onChange }: { active: WorkspaceTab; onChange: (t: WorkspaceTab) => void }) {
  return (
    <div className="shrink-0 flex border-b border-border bg-background">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all
            ${active === id
              ? 'border-blue-600 text-blue-700 dark:text-blue-400'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}>
          <Icon className="size-3.5 shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Per-tab sticky CTA bar ───────────────────────────────────────────────────
function TabCTABar({ tab, testDriveReady, onTabChange }: {
  tab: WorkspaceTab; testDriveReady: boolean; onTabChange: (t: WorkspaceTab) => void;
}) {
  const [booked, setBooked] = useState(false);
  const base = 'shrink-0 px-4 py-3 border-t border-border bg-background/98 backdrop-blur-sm flex items-center gap-3';

  if (tab === 'overview') return (
    <div className={base}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">Next recommended action</p>
        <p className="text-xs font-semibold text-foreground">Schedule a test drive to build conviction</p>
      </div>
      <button onClick={() => onTabChange('test-drive')}
        className="shrink-0 flex items-center gap-2 px-5 py-3.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors min-h-[56px] shadow-sm shadow-blue-600/20">
        Book Test Drive <ArrowRight className="size-4" />
      </button>
    </div>
  );

  if (tab === 'test-drive') return (
    <div className={base}>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground">
          {testDriveReady ? 'Ready to confirm' : 'Select a date and time slot'}
        </p>
        <p className="text-xs font-semibold text-foreground">2023 Camry XSE · Standard Route A</p>
      </div>
      <button
        disabled={!testDriveReady}
        onClick={() => testDriveReady && setBooked(true)}
        className={`shrink-0 flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[56px]
          ${!testDriveReady
            ? 'bg-muted text-muted-foreground cursor-default'
            : booked
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20'
          }`}>
        {booked
          ? <><CheckCircle2 className="size-4" /> Booked!</>
          : <><Route className="size-4" /> Confirm Booking</>
        }
      </button>
    </div>
  );

  return null;
}

// ─── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({ onSwitchTab }: { onSwitchTab: (t: WorkspaceTab) => void }) {
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState(CONSULT.notes);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNotesChange = (v: string) => {
    setNotes(v);
    setSaving(true);
    setJustSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { setSaving(false); setJustSaved(true); }, 1400);
  };

  return (
    <div className="md:grid md:grid-cols-[1fr_280px] md:gap-6 space-y-4 md:space-y-0">

      {/* Left: Customer + Vehicle + Notes */}
      <div className="space-y-4">

        {/* Customer card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Customer</span>
            <div className="flex items-center gap-1">
              {([Phone, Mail, MessageSquare] as const).map((Icon, i) => (
                <button key={i} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors size-9 flex items-center justify-center">
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-1 divide-y divide-border/40">
            <DataRow label="Name"      value={CONSULT.customerName} />
            <DataRow label="Phone"     value={CONSULT.phone}
              action={<button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline shrink-0">Call</button>} />
            <DataRow label="Email"     value={CONSULT.email} />
            <DataRow label="Source"    value={CONSULT.source} />
            <DataRow label="Advisor"   value={CONSULT.consultant} />
            <DataRow label="Scheduled" value={CONSULT.scheduledTime} />
          </div>
        </div>

        {/* Vehicle interest */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Vehicle Interest</span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30">
              In Stock
            </span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <Car className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground leading-snug">
                  {CONSULT.vehicle.year} {CONSULT.vehicle.make} {CONSULT.vehicle.model}
                </p>
                <p className="text-xs text-muted-foreground">{CONSULT.vehicle.trim} · {CONSULT.vehicle.color}</p>
                <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
                  ${CONSULT.vehicle.msrp.toLocaleString()}
                </p>
              </div>
            </div>
            {/* Interest tags */}
            <div className="flex flex-wrap gap-1.5">
              {CONSULT.interests.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium border border-blue-100 dark:border-blue-900/40">
                  {tag}
                </span>
              ))}
            </div>
            {/* Trade-in */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-800/40">
              <Tag className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground">{CONSULT.tradeIn.vehicle}</p>
                <p className="text-[10px] text-muted-foreground">ACV offered: ${CONSULT.tradeIn.acv.toLocaleString()}</p>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide shrink-0">
                Pending
              </span>
            </div>
            {/* Test drive shortcut */}
            <button onClick={() => onSwitchTab('test-drive')}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-muted/30 transition-colors text-left">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-blue-500 shrink-0" />
                <span className="text-xs font-semibold text-foreground">Schedule a Test Drive</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Notes</span>
            <span className={`flex items-center gap-1 text-[10px] font-semibold transition-all duration-300
              ${saving ? 'text-amber-500' : justSaved ? 'text-emerald-500' : 'text-muted-foreground/40'}`}>
              {saving ? 'Saving…' : justSaved ? <><CheckCircle2 className="size-3" /> Saved</> : 'Auto-saved'}
            </span>
          </div>
          <div className="p-5">
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              rows={8}
              className="w-full text-xs text-foreground bg-muted/20 border border-border rounded-xl px-4 py-3 resize-none outline-none focus:border-blue-400 focus:bg-background transition-all leading-relaxed placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </div>

      {/* Right: Activity timeline */}
      <div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Activity</span>
          </div>
          <div className="px-5 py-4">
            {ACTIVITY.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div className="size-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  {i < ACTIVITY.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                </div>
                <div className={`min-w-0 ${i < ACTIVITY.length - 1 ? 'pb-4' : 'pb-0'}`}>
                  <p className="text-[11px] font-bold text-foreground mb-0.5">{entry.time}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{entry.text}</p>
                </div>
              </div>
            ))}
            {/* Inline note input */}
            <div className="flex gap-3 pt-4">
              <div className="size-2 rounded-full border-2 border-border bg-background mt-1.5 shrink-0" />
              <div className="flex-1 flex gap-2 min-w-0">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add note…"
                  rows={2}
                  className="flex-1 text-xs bg-muted/40 border border-border rounded-xl px-3 py-2 resize-none outline-none focus:border-blue-400 focus:bg-background transition-all placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => setNoteText('')}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shrink-0 self-start size-[44px] flex items-center justify-center">
                  <PenLine className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Test drive tab ───────────────────────────────────────────────────────────
function TestDriveTab({ onReadyChange }: { onReadyChange: (ready: boolean) => void }) {
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i); return d;
  });
  const [selDay, setSelDay] = useState(0);
  const [selTime, setSelTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const BUSY = ['11:00 AM', '3:00 PM'];

  const handleTime = (t: string) => { setSelTime(t); onReadyChange(true); };
  const handleDay  = (i: number) => { setSelDay(i); setSelTime(null); onReadyChange(false); };

  if (confirmed) return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-10 text-center space-y-4">
      <div className="size-16 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto">
        <CheckCircle2 className="size-8 text-white" />
      </div>
      <div>
        <p className="text-base font-bold text-emerald-800 dark:text-emerald-200">Test Drive Confirmed</p>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/70 mt-1">
          {days[selDay].toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {selTime}
        </p>
        <p className="text-xs text-emerald-600/60 dark:text-emerald-500/60 mt-0.5">
          2023 Camry XSE · Standard Route A · ~15 min
        </p>
      </div>
      <button onClick={() => { setConfirmed(false); setSelTime(null); onReadyChange(false); }}
        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline">
        Change booking
      </button>
    </motion.div>
  );

  return (
    <div className="space-y-5">
      {/* Vehicle */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
          <Car className="size-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">2023 Toyota Camry XSE</p>
          <p className="text-xs text-muted-foreground">Blueprint Blue · VIN: 4T1B11HK5PU00xxxx</p>
          <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="size-2.5" /> Available
          </span>
        </div>
      </div>

      {/* Date strip */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Select Date</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {days.map((d, i) => (
            <button key={i} onClick={() => handleDay(i)}
              className={`flex flex-col items-center gap-0.5 px-3.5 py-3 rounded-2xl border shrink-0 min-w-[60px] min-h-[64px] transition-all
                ${selDay === i
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-card border-border text-muted-foreground hover:border-blue-300 hover:text-foreground'
                }`}>
              <span className="text-[9px] font-bold uppercase">{i === 0 ? 'Today' : DAY_LABELS[d.getDay()]}</span>
              <span className="text-lg font-bold leading-tight">{d.getDate()}</span>
              <span className="text-[9px]">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Available Times</p>
        <div className="grid grid-cols-4 gap-2">
          {TD_TIMES.map(time => {
            const busy = BUSY.includes(time) && selDay === 0;
            return (
              <button key={time} disabled={busy} onClick={() => !busy && handleTime(time)}
                className={`py-3 rounded-xl text-xs font-bold border transition-all
                  ${busy
                    ? 'border-border text-muted-foreground/30 line-through cursor-not-allowed bg-muted/10'
                    : selTime === time
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-border text-muted-foreground hover:border-blue-300 hover:text-foreground'
                  }`}>
                {time}
              </button>
            );
          })}
        </div>
      </div>

      {/* Drive details */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Drive Details</p>
        {[
          { Icon: Route,  text: 'Standard Route A — ~15 min · Highway + local roads' },
          { Icon: Shield, text: 'License verified · Insurance confirmed on file' },
        ].map(({ Icon, text }) => (
          <div key={text} className="flex items-center gap-3 text-xs text-muted-foreground">
            <Icon className="size-4 shrink-0 text-blue-500" />
            {text}
          </div>
        ))}
        <textarea placeholder="Notes for test drive…" rows={2}
          className="w-full text-xs bg-muted/30 border border-border rounded-xl px-3 py-2.5 resize-none outline-none focus:border-blue-400 transition-all placeholder:text-muted-foreground mt-1" />
      </div>
    </div>
  );
}

// ─── Right rail ───────────────────────────────────────────────────────────────
function RightRail({ onTabChange }: { onTabChange: (t: WorkspaceTab) => void }) {
  const [aiOpen, setAiOpen]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  const triggerAI = () => {
    if (aiReady) { setAiOpen(v => !v); return; }
    setAiOpen(true); setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setAiReady(true); }, 1800);
  };

  return (
    <div className="w-72 xl:w-80 shrink-0 flex flex-col overflow-y-auto scrollbar-none p-4 gap-4 bg-muted/10">

      {/* Deal score gauge */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <DealScoreGauge score={DEAL.score} />
        <div className="mt-4 space-y-2">
          {[
            { label: 'Budget target', value: `$${DEAL.budgetMonthly}/mo`,       color: '' },
            { label: 'Current offer', value: `$${DEAL.currentMonthly}/mo`,      color: 'text-foreground' },
            { label: 'Gap to close',  value: `$${DEAL.gap}/mo`,                 color: 'text-amber-600 dark:text-amber-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">{row.label}</span>
              <span className={`text-[11px] font-bold tabular-nums ${row.color || 'text-muted-foreground'}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* NBA */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200/60 dark:border-amber-800/60">
          <Zap className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200">Next Best Action</span>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
            Schedule the test drive now. Customers who drive convert at 2× the rate of desk-only closes. Then address the $8/mo trade-in gap on the write-up.
          </p>
          <button onClick={() => onTabChange('test-drive')}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white rounded-xl text-[11px] font-bold hover:bg-amber-600 transition-colors min-h-[44px]">
            Book Test Drive <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>

      {/* AI Deal Brief */}
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
        <button onClick={triggerAI}
          className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
          <Sparkles className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-200 flex-1 text-left">AI Deal Brief</span>
          <motion.div animate={{ rotate: aiOpen ? 180 : 0 }} transition={{ duration: 0.18 }}>
            <ChevronDown className="size-4 text-blue-500" />
          </motion.div>
        </button>
        <AnimatePresence initial={false}>
          {aiOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="p-4 border-t border-blue-200 dark:border-blue-800">
                {aiLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span className="text-[11px]">Analyzing consultation…</span>
                    </div>
                    {[88, 66, 80, 58].map((w, i) => (
                      <div key={i} className="h-2 bg-blue-200/60 dark:bg-blue-800/60 rounded-full animate-pulse"
                        style={{ width: `${w}%` }} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <pre className="text-[10px] text-blue-900 dark:text-blue-100 whitespace-pre-wrap leading-relaxed font-sans">
                      {AI_TEXT}
                    </pre>
                    <div className="flex gap-3 pt-1">
                      <button className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                        <MessageSquare className="size-3" /> Draft SMS
                      </button>
                      <span className="text-blue-300 dark:text-blue-700">·</span>
                      <button className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                        <FileText className="size-3" /> Save to Notes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick contact */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Contact</p>
        <div className="grid grid-cols-3 gap-2">
          {[{ Icon: Phone, label: 'Call' }, { Icon: MessageSquare, label: 'SMS' }, { Icon: Mail, label: 'Email' }].map(
            ({ Icon, label }) => (
              <button key={label}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[56px]">
                <Icon className="size-4" />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="h-2" />
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
interface ConsultationWorkspacePageProps {
  role: Role;
  onNavigate?: (nav: string) => void;
}

export function ConsultationWorkspacePage({ onNavigate }: ConsultationWorkspacePageProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [testDriveReady, setTestDriveReady] = useState(false);

  const handleTabChange = useCallback((t: WorkspaceTab) => setActiveTab(t), []);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">

      <ConsultationHeader onBack={() => onNavigate?.('appointments')} />
      <TabBar active={activeTab} onChange={handleTabChange} />

      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* Main content + sticky CTA */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-5 md:px-6">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.14, ease: 'easeOut' }}>
                  {activeTab === 'overview'   && <OverviewTab onSwitchTab={handleTabChange} />}
                  {activeTab === 'test-drive' && <TestDriveTab onReadyChange={setTestDriveReady} />}
                </motion.div>
              </AnimatePresence>
              <div className="h-6" />
            </div>
          </div>

          <TabCTABar
            tab={activeTab}
            testDriveReady={testDriveReady}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Right rail — desktop only */}
        <div className="hidden lg:flex border-l border-border">
          <RightRail onTabChange={handleTabChange} />
        </div>
      </div>
    </div>
  );
}
