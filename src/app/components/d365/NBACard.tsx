import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';
import { NBAConfig } from './types';

interface NBACardProps {
  nba: NBAConfig;
}

export function NBACard({ nba }: NBACardProps) {
  const isHigh = nba.urgency === 'high';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`relative overflow-hidden rounded-xl p-4 flex items-center justify-between gap-4
        ${isHigh
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800'
          : 'bg-gradient-to-r from-slate-700 to-slate-800'}
        shadow-lg shadow-blue-600/20`}
    >
      {/* Background decoration */}
      <div className="absolute right-0 top-0 size-32 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute right-12 bottom-0 size-20 rounded-full bg-white/5 translate-y-1/2" />

      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 size-9 rounded-lg bg-white/20 flex items-center justify-center">
          <Zap className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Next Best Action</span>
            {nba.count && nba.count > 0 ? (
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">
                {nba.count}
              </span>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-white truncate">{nba.label}</p>
          <p className="text-xs text-blue-200 truncate">{nba.description}</p>
        </div>
      </div>

      <button
        className="shrink-0 flex items-center gap-1.5 bg-white text-blue-700 text-sm font-semibold
                   px-4 py-2.5 rounded-lg hover:bg-blue-50 transition-colors focus-visible:outline-none
                   focus-visible:ring-2 focus-visible:ring-white/50 min-h-[44px]"
      >
        Take Action
        <ArrowRight className="size-4" />
      </button>
    </motion.div>
  );
}
