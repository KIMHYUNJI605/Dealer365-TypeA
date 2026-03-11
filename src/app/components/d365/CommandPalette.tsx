import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, FileText, User, CalendarClock, Handshake, Zap, X } from 'lucide-react';
import { COMMAND_ITEMS } from './data';

const TYPE_ICONS: Record<string, React.ElementType> = {
  ro: FileText,
  customer: User,
  appointment: CalendarClock,
  deal: Handshake,
  action: Zap,
};

const TYPE_COLORS: Record<string, string> = {
  ro: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  customer: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
  appointment: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400',
  deal: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
  action: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.length >= 1
    ? COMMAND_ITEMS.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.sub.toLowerCase().includes(query.toLowerCase())
      )
    : COMMAND_ITEMS;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelected(0);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, filtered.length, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
          <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-[10vh]">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                <Search className="size-5 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search RO, customer, appointment, deal..."
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="size-4" />
                  </button>
                )}
                <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono shrink-0">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[360px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results for "{query}"
                  </div>
                ) : (
                  filtered.map((item, i) => {
                    const Icon = TYPE_ICONS[item.type] ?? FileText;
                    const colorClass = TYPE_COLORS[item.type] ?? TYPE_COLORS.action;
                    const isSelected = i === selected;

                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setSelected(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-muted/50'}`}
                      >
                        <span className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                          <Icon className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                        </div>
                        {isSelected && (
                          <kbd className="ml-auto text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono shrink-0">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/30">
                <div className="flex items-center gap-3">
                  {['↑↓ navigate', '↵ open', 'esc close'].map((hint) => (
                    <span key={hint} className="text-[10px] text-muted-foreground font-mono">{hint}</span>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
