import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, RefreshCw, SlidersHorizontal, Clock, ArrowUpDown } from 'lucide-react';
import { Role, QueueItem, ItemStatus } from '../components/d365/types';
import { ROLE_CONFIGS } from '../components/d365/data';
import { SummaryBar } from '../components/d365/SummaryBar';
import { NBACard } from '../components/d365/NBACard';
import { QueueRow } from '../components/d365/QueueRow';
import { SkeletonQueue } from '../components/d365/SkeletonQueue';
import { WorkItemDetail } from '../components/d365/WorkItemDetail';
import { ManagerMetrics } from '../components/d365/ManagerMetrics';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Urgent', value: 'urgent' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Waiting', value: 'waiting' },
  { label: 'Blocked', value: 'blocked' },
  { label: 'Completed', value: 'completed' },
];

interface DashboardPageProps {
  role: Role;
}

export function DashboardPage({ role }: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'time'>('priority');

  const config = ROLE_CONFIGS[role];

  // Simulate loading
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [role]);

  // Filter + sort queue
  const filteredQueue = config.queue
    .filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'urgent') return item.priority === 'urgent';
      if (activeFilter === 'waiting') return item.status.includes('waiting') || item.status === 'unassigned';
      if (activeFilter === 'blocked') return item.status === 'blocked' || item.status === 'delayed';
      if (activeFilter === 'completed') return item.status === 'completed' || item.status === 'closed-won';
      return item.status === activeFilter || item.status.includes(activeFilter as ItemStatus);
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      return 0;
    });

  const isManager = role === 'manager';
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <div className={`flex-1 min-h-0 flex ${isManager ? 'gap-0' : ''}`}>
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`size-2 rounded-full ${config.avatarColor} animate-pulse`} />
                  <span className="text-xs text-muted-foreground font-medium">{config.label} View</span>
                </div>
                <h1 className="text-foreground">{config.primarySectionTitle}</h1>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {timeStr} · {dateStr}
                </p>
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                <RefreshCw className="size-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Summary stats */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role + '-summary'}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <SummaryBar items={config.summary} />
              </motion.div>
            </AnimatePresence>

            {/* Next Best Action */}
            <AnimatePresence mode="wait">
              <motion.div
                key={role + '-nba'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <NBACard nba={config.nba} />
              </motion.div>
            </AnimatePresence>

            {/* Queue section */}
            <div className="space-y-3">
              {/* Section header + filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-foreground flex-1">{config.primarySectionTitle}</h2>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setSortBy(s => s === 'priority' ? 'time' : 'priority')}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <ArrowUpDown className="size-3.5" />
                    {sortBy === 'priority' ? 'Priority' : 'Time'}
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                    <SlidersHorizontal className="size-3.5" />
                    Filter
                  </button>
                </div>
              </div>

              {/* Filter chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all font-medium
                      ${activeFilter === f.value
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-background text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
                      }`}
                  >
                    {f.label}
                    {f.value === 'all' && ` (${config.queue.length})`}
                  </button>
                ))}
              </div>

              {/* Queue list */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <SkeletonQueue count={4} />
                  </motion.div>
                ) : filteredQueue.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                  >
                    <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                      <Filter className="size-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No items found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try changing the filter or refreshing the queue</p>
                    </div>
                    <button
                      onClick={() => setActiveFilter('all')}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Clear filter
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key={role + '-' + activeFilter + '-queue'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-2.5"
                  >
                    {filteredQueue.map((item, i) => (
                      <QueueRow
                        key={item.id}
                        item={item}
                        index={i}
                        role={role}
                        onOpen={setSelectedItem}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Manager right rail */}
        {isManager && (
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="hidden xl:block w-80 shrink-0 border-l border-border overflow-y-auto"
          >
            <div className="p-5 space-y-1">
              <h2 className="text-foreground mb-4">Live Metrics</h2>
              <ManagerMetrics />
            </div>
          </motion.aside>
        )}
      </div>

      {/* Work item slide-over */}
      <WorkItemDetail
        item={selectedItem}
        role={role}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
