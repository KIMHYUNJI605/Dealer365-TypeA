import { motion } from 'motion/react';
import {
  Wrench, Handshake, Car, Phone, Flag, User,
  LogIn, ChevronRight, Globe, ArrowRightLeft,
  ClipboardCheck, ExternalLink, MessageSquare,
} from 'lucide-react';
import { AppointmentItem, AppointmentType, AppointmentStatus, AppointmentSource, Role } from './types';
import { getAppointmentCTA, ACTIVE_STATUSES } from './appointmentUtils';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_MAP: Record<AppointmentType, {
  label: string; Icon: React.ElementType; dot: string; bg: string; text: string;
}> = {
  'service':            { label: 'Service',      Icon: Wrench,    dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/25',    text: 'text-blue-700 dark:text-blue-400' },
  'sales-consultation': { label: 'Sales',        Icon: Handshake, dot: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/25', text: 'text-purple-700 dark:text-purple-400' },
  'test-drive':         { label: 'Test Drive',   Icon: Car,       dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/25', text: 'text-violet-700 dark:text-violet-400' },
  'walk-in':            { label: 'Walk-in',      Icon: LogIn,     dot: 'bg-teal-500',   bg: 'bg-teal-50 dark:bg-teal-900/25',   text: 'text-teal-700 dark:text-teal-400' },
  'follow-up':          { label: 'Follow-up',    Icon: Phone,     dot: 'bg-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/25', text: 'text-amber-700 dark:text-amber-400' },
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<AppointmentStatus, {
  label: string; dot: string; bg: string; text: string;
}> = {
  'pending':          { label: 'Pending',         dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800',       text: 'text-slate-600 dark:text-slate-400' },
  'confirmed':        { label: 'Confirmed',        dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400' },
  'checked-in':       { label: 'Checked In',       dot: 'bg-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/30',       text: 'text-teal-700 dark:text-teal-400' },
  'walkaround':       { label: 'Walkaround',       dot: 'bg-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/30',   text: 'text-violet-700 dark:text-violet-400' },
  'ro-created':       { label: 'RO Created',       dot: 'bg-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/30',   text: 'text-indigo-700 dark:text-indigo-400' },
  'in-service':       { label: 'In Service',       dot: 'bg-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-400' },
  'in-consultation':  { label: 'In Consultation',  dot: 'bg-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/30',   text: 'text-purple-700 dark:text-purple-400' },
  'completed':        { label: 'Completed',        dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' },
  'no-show':          { label: 'No Show',          dot: 'bg-red-500',     bg: 'bg-red-50 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-400' },
  'canceled':         { label: 'Canceled',         dot: 'bg-slate-400',   bg: 'bg-slate-100 dark:bg-slate-700',       text: 'text-slate-500 dark:text-slate-400' },
};

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_MAP: Record<AppointmentSource, { label: string; Icon: React.ElementType }> = {
  'portal':     { label: 'Portal',     Icon: Globe },
  'phone':      { label: 'Phone',      Icon: Phone },
  'walk-in':    { label: 'Walk-in',    Icon: LogIn },
  'crm':        { label: 'CRM',        Icon: ClipboardCheck },
  'autotrader': { label: 'AutoTrader', Icon: ExternalLink },
  'referral':   { label: 'Referral',   Icon: ArrowRightLeft },
  'showroom':   { label: 'Showroom',   Icon: User },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AppointmentRowProps {
  item: AppointmentItem;
  index: number;
  role: Role;
  onOpen?: (item: AppointmentItem) => void;
  onNavigate?: (nav: string) => void;
}

export function AppointmentRow({ item, index, role, onOpen, onNavigate }: AppointmentRowProps) {
  const type       = TYPE_MAP[item.type];
  const statusCfg  = STATUS_MAP[item.status];
  const sourceInfo = SOURCE_MAP[item.source];
  const cta        = getAppointmentCTA(item, role);
  const TypeIcon   = type.Icon;
  const SourceIcon = sourceInfo.Icon;

  const isActive = ACTIVE_STATUSES.includes(item.status);
  const isDimmed = item.status === 'completed' || item.status === 'no-show' || item.status === 'canceled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.035, duration: 0.2, ease: 'easeOut' }}
      onClick={() => onOpen?.(item)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(item)}
      className={`group relative flex items-center gap-0 border-b border-border last:border-0 cursor-pointer
                  transition-colors duration-150
                  hover:bg-blue-50/50 dark:hover:bg-blue-950/20
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50
                  ${isDimmed ? 'opacity-60' : ''}
                  ${isActive ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
    >
      {/* Active pulse indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 rounded-r-full bg-blue-500" />
      )}

      {/* Time block */}
      <div className="w-20 shrink-0 pl-5 pr-3 py-4 flex flex-col items-start gap-0.5">
        <span className="text-sm font-semibold text-foreground tabular-nums leading-none">{item.scheduledTime.split(' ')[0]}</span>
        <span className="text-[10px] text-muted-foreground">{item.scheduledTime.split(' ')[1]}</span>
        {item.estimatedDuration && (
          <span className="text-[9px] text-muted-foreground/60 mt-0.5">{item.estimatedDuration}</span>
        )}
      </div>

      {/* Type badge */}
      <div className="w-28 shrink-0 px-2 py-4 hidden sm:flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold ${type.bg} ${type.text}`}>
          <TypeIcon className="size-3 shrink-0" />
          {type.label}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 px-2 py-4">
        {/* Ref + flags */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-mono text-muted-foreground">{item.refNumber}</span>
          {item.hasFlag && <Flag className="size-3 text-red-500 shrink-0" />}
          {item.unreadMessages && item.unreadMessages > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
              <MessageSquare className="size-2.5" />
              {item.unreadMessages}
            </span>
          ) : null}
          {/* Mobile type badge */}
          <span className={`sm:hidden inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${type.bg} ${type.text}`}>
            {type.label}
          </span>
        </div>

        {/* Customer + vehicle */}
        <p className="text-sm font-medium text-foreground truncate leading-snug">{item.customerName}</p>
        <p className="text-xs text-muted-foreground truncate">{item.vehicle}</p>

        {/* Services */}
        {item.services && item.services.length > 0 && (
          <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
            {item.services.join(' · ')}
          </p>
        )}
        {item.notes && !item.services && (
          <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5 italic">{item.notes}</p>
        )}
      </div>

      {/* Assigned advisor / consultant */}
      <div className="hidden md:flex w-32 shrink-0 px-2 py-4 items-center gap-1.5">
        <div className="size-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <User className="size-3 text-slate-500 dark:text-slate-400" />
        </div>
        <span className="text-xs text-muted-foreground truncate">
          {item.assignedTo.split(' ')[0]} {item.assignedTo.split(' ')[1]?.[0]}.
        </span>
      </div>

      {/* Source */}
      <div className="hidden lg:flex w-24 shrink-0 px-2 py-4 items-center gap-1.5">
        <SourceIcon className="size-3 text-muted-foreground shrink-0" />
        <span className="text-[10px] text-muted-foreground truncate">{sourceInfo.label}</span>
      </div>

      {/* Estimated value */}
      {item.estimatedValue && (
        <div className="hidden xl:flex w-20 shrink-0 px-2 py-4 items-center justify-end">
          <span className="text-xs font-semibold text-foreground tabular-nums">{item.estimatedValue}</span>
        </div>
      )}

      {/* Status badge */}
      <div className="shrink-0 px-2 py-4 hidden sm:flex items-center">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`size-1.5 rounded-full ${statusCfg.dot} shrink-0 ${isActive ? 'animate-pulse' : ''}`} />
          {statusCfg.label}
        </span>
      </div>

      {/* CTA + chevron */}
      <div className="shrink-0 px-4 py-4 flex items-center gap-2">
        {cta && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (cta.navTarget) onNavigate?.(cta.navTarget);
            }}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap
              ${cta.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/25'
                : 'border border-border text-foreground hover:bg-muted'
              }`}
          >
            {cta.label}
          </button>
        )}
        <ChevronRight className="size-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
      </div>
    </motion.div>
  );
}
