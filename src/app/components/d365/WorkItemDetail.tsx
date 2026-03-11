import { AnimatePresence, motion } from 'motion/react';
import { X, Phone, Mail, MessageSquare, Clock, Car, FileText, User, Flag, Wrench, Edit3 } from 'lucide-react';
import { QueueItem, Role } from './types';
import { StatusBadge } from './StatusBadge';
import { PriorityBar } from './PriorityBar';

interface WorkItemDetailProps {
  item: QueueItem | null;
  role: Role;
  onClose: () => void;
}

export function WorkItemDetail({ item, role, onClose }: WorkItemDetailProps) {
  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="relative flex items-start gap-3 p-5 border-b border-border">
              <PriorityBar priority={item.priority} />
              <div className="size-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0 ml-2">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.customerInitials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">{item.refNumber}</span>
                  {item.hasFlag && <Flag className="size-3 text-red-500" />}
                </div>
                <h3 className="text-base font-semibold text-foreground">{item.customerName}</h3>
                <p className="text-sm text-muted-foreground">{item.vehicle}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Status + Actions */}
            <div className="px-5 py-4 border-b border-border flex items-center gap-3 flex-wrap">
              <StatusBadge status={item.status} size="md" />
              {item.estimatedValue && (
                <span className="text-sm font-semibold text-foreground">{item.estimatedValue}</span>
              )}
              <div className="ml-auto flex gap-2">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  <Edit3 className="size-3.5" />
                  Update Status
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { icon: Clock, label: 'Time', value: item.timeLabel },
                  { icon: Car, label: 'Vehicle', value: item.vehicle },
                  item.bay ? { icon: Wrench, label: 'Bay', value: item.bay } : null,
                  item.techAssigned ? { icon: User, label: 'Technician', value: item.techAssigned } : null,
                  item.source ? { icon: FileText, label: 'Source', value: item.source } : null,
                  item.nextAction ? { icon: FileText, label: 'Next Action', value: item.nextAction } : null,
                ] as Array<{ icon: React.ElementType; label: string; value: string } | null>)
                  .filter((x): x is { icon: React.ElementType; label: string; value: string } => x !== null)
                  .map((info, i) => (
                  <div key={i} className="bg-muted/40 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <info.icon className="size-3.5 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{info.label}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Description */}
              {item.subLabel && (
                <div className="bg-muted/40 rounded-xl p-4">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Service Description</p>
                  <p className="text-sm text-foreground">{item.subLabel}</p>
                </div>
              )}

              {/* Progress */}
              {item.hoursElapsed !== undefined && item.totalHours && (
                <div className="bg-muted/40 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Labor Progress</p>
                    <span className="text-xs text-foreground font-medium">{item.hoursElapsed}h / {item.totalHours}h</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (item.hoursElapsed / item.totalHours) * 100)}%` }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="h-full bg-blue-500 rounded-full"
                    />
                  </div>
                </div>
              )}

              {/* Contact Actions */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Contact Customer</p>
                <div className="flex gap-2">
                  {[
                    { icon: Phone, label: 'Call' },
                    { icon: Mail, label: 'Email' },
                    { icon: MessageSquare, label: 'SMS' },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted/60 border border-border
                                 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-muted-foreground hover:text-blue-600"
                    >
                      <Icon className="size-5" />
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Activity</p>
                <div className="space-y-2">
                  {[
                    { text: 'Status updated to current', time: '5m ago', by: 'System' },
                    { text: 'Record opened', time: '12m ago', by: 'Jordan D.' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="size-1.5 bg-slate-300 dark:bg-slate-600 rounded-full shrink-0" />
                      <span className="flex-1">{act.text}</span>
                      <span className="text-muted-foreground/60">{act.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-border flex gap-2">
              <button className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Open Full Record
              </button>
              <button className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                Quick Update
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}