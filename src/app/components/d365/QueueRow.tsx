import { motion } from 'motion/react';
import { MessageSquare, Flag, Paperclip, ChevronRight, User } from 'lucide-react';
import { QueueItem, Role } from './types';
import { StatusBadge } from './StatusBadge';
import { PriorityBar } from './PriorityBar';

interface QueueRowProps {
  item: QueueItem;
  index: number;
  role: Role;
  onOpen?: (item: QueueItem) => void;
}

export function QueueRow({ item, index, role, onOpen }: QueueRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2, ease: 'easeOut' }}
      onClick={() => onOpen?.(item)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen?.(item)}
      className="group relative flex items-center gap-4 bg-card border border-border rounded-xl px-5 py-4 cursor-pointer
                 hover:border-blue-300 hover:shadow-[0_2px_12px_rgba(59,130,246,0.08)] dark:hover:border-blue-700
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50
                 transition-all duration-150 overflow-hidden"
    >
      <PriorityBar priority={item.priority} />

      {/* Avatar */}
      <div className="shrink-0 size-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 
                      flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {item.customerInitials}
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{item.refNumber}</span>
          {item.hasFlag && (
            <Flag className="size-3 text-red-500 mt-0.5 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-sm font-medium text-foreground truncate">{item.customerName}</span>
          {item.unreadMessages && item.unreadMessages > 0 ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
              <MessageSquare className="size-2.5" />
              {item.unreadMessages}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.vehicle}</p>
        {item.subLabel && (
          <p className="text-xs text-muted-foreground/80 truncate">{item.subLabel}</p>
        )}
        {/* Tags row */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <StatusBadge status={item.status} />
          {item.tags?.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              {tag}
            </span>
          ))}
          {item.bay && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              {item.bay}
            </span>
          )}
          {item.techAssigned && (
            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <User className="size-2.5" />
              {item.techAssigned}
            </span>
          )}
        </div>
      </div>

      {/* Right section */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 ml-2">
        {item.estimatedValue && (
          <span className="text-sm font-semibold text-foreground">{item.estimatedValue}</span>
        )}
        {item.hoursElapsed !== undefined && item.totalHours && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{item.hoursElapsed}h / {item.totalHours}h</span>
            <div className="w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (item.hoursElapsed / item.totalHours) * 100)}%` }}
              />
            </div>
          </div>
        )}
        <span className="text-[11px] text-muted-foreground text-right">{item.timeLabel}</span>
        <ChevronRight className="size-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors mt-0.5" />
      </div>
    </motion.div>
  );
}
