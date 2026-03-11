import { TrendingUp, TrendingDown, Minus, Users, Wrench, DollarSign, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

const metrics = [
  { label: 'Revenue Today', value: '$24,800', change: +12, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  { label: 'Active ROs', value: '18', change: +3, icon: Wrench, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
  { label: 'Techs Active', value: '8 / 10', change: 0, icon: Users, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
  { label: 'Avg RO Value', value: '$1,378', change: -5, icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' },
];

const serviceSummary = [
  { label: 'Waiting Approval', count: 2, color: 'text-orange-600 dark:text-orange-400' },
  { label: 'Parts Delayed', count: 3, color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Blocked', count: 1, color: 'text-red-600 dark:text-red-400' },
  { label: 'Est. Recovery', value: '$4,200', color: 'text-emerald-600 dark:text-emerald-400' },
];

const salesMetrics = [
  { label: 'Leads Today', value: '12' },
  { label: 'Test Drives', value: '4' },
  { label: 'Deals Pending', value: '7' },
  { label: 'Closed Today', value: '2' },
];

export function ManagerMetrics() {
  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Operations KPIs</p>
        {metrics.map((m, i) => {
          const Icon = m.icon;
          const TrendIcon = m.change > 0 ? TrendingUp : m.change < 0 ? TrendingDown : Minus;
          const trendColor = m.change > 0 ? 'text-emerald-500' : m.change < 0 ? 'text-red-500' : 'text-slate-400';

          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
            >
              <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
                <Icon className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-base font-semibold text-foreground">{m.value}</p>
              </div>
              <div className={`flex items-center gap-0.5 ${trendColor}`}>
                <TrendIcon className="size-3.5" />
                {m.change !== 0 && <span className="text-xs">{Math.abs(m.change)}%</span>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Service Health */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-amber-500" />
          <p className="text-xs font-semibold text-foreground">Service Health</p>
        </div>
        <div className="space-y-2">
          {serviceSummary.map((s) => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={`text-sm font-semibold ${s.color}`}>
                {s.count !== undefined ? s.count : s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sales Snapshot */}
      <div className="p-4 bg-card border border-border rounded-xl space-y-3">
        <p className="text-xs font-semibold text-foreground">Sales Today</p>
        <div className="grid grid-cols-2 gap-2">
          {salesMetrics.map((s) => (
            <div key={s.label} className="bg-muted/50 rounded-lg p-2.5">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
