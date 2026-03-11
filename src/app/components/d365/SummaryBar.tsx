import { motion } from 'motion/react';
import { SummaryItem } from './types';

const COLOR_MAP = {
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200/60 dark:border-emerald-700/30',
    count: 'text-emerald-700 dark:text-emerald-400',
    label: 'text-emerald-600/80 dark:text-emerald-500/80',
    dot: 'bg-emerald-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200/60 dark:border-amber-700/30',
    count: 'text-amber-700 dark:text-amber-400',
    label: 'text-amber-600/80 dark:text-amber-500/80',
    dot: 'bg-amber-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200/60 dark:border-red-700/30',
    count: 'text-red-700 dark:text-red-400',
    label: 'text-red-600/80 dark:text-red-500/80',
    dot: 'bg-red-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200/60 dark:border-blue-700/30',
    count: 'text-blue-700 dark:text-blue-400',
    label: 'text-blue-600/80 dark:text-blue-500/80',
    dot: 'bg-blue-500',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200/60 dark:border-slate-700/30',
    count: 'text-slate-700 dark:text-slate-300',
    label: 'text-slate-500 dark:text-slate-400',
    dot: 'bg-slate-400',
  },
};

interface SummaryBarProps {
  items: SummaryItem[];
}

export function SummaryBar({ items }: SummaryBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => {
        const c = COLOR_MAP[item.color];
        const displayCount = typeof item.count === 'number' && item.count >= 1000
          ? `$${(item.count / 1000).toFixed(1)}k`
          : item.count;

        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            className={`flex flex-col gap-1 p-4 rounded-xl border ${c.bg} ${c.border}`}
          >
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${c.dot}`} />
              <span className={`text-xs font-medium ${c.label}`}>{item.label}</span>
            </div>
            <span className={`text-2xl font-semibold tracking-tight ${c.count}`}>
              {displayCount}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
