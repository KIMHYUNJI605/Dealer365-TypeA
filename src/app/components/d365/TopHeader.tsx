import { useState } from 'react';
import { Search, Bell, Sun, Moon, Menu, Command, ChevronDown, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Role } from './types';
import { ROLE_CONFIGS } from './data';

const ROLE_OPTIONS: { id: Role; label: string; desc: string }[] = [
  { id: 'technician', label: 'Technician', desc: 'Jobs & Time' },
  { id: 'advisor', label: 'Service Advisor', desc: 'Appointments' },
  { id: 'dispatcher', label: 'Dispatcher', desc: 'Dispatch Board' },
  { id: 'sales', label: 'Sales Consultant', desc: 'Leads & Deals' },
  { id: 'manager', label: 'Manager', desc: 'Operations' },
];

interface TopHeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  onMenuOpen: () => void;
  onCommandOpen: () => void;
  isDark: boolean;
  onThemeToggle: () => void;
}

export function TopHeader({
  role, onRoleChange, onMenuOpen, onCommandOpen, isDark, onThemeToggle,
}: TopHeaderProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const config = ROLE_CONFIGS[role];

  const notifications = [
    { id: 1, title: 'RO-10291 Parts Arrived', time: '2m ago', dot: 'bg-emerald-500' },
    { id: 2, title: 'Approval needed — Patricia Moore', time: '8m ago', dot: 'bg-orange-500' },
    { id: 3, title: 'Bay 8 job blocked', time: '12m ago', dot: 'bg-red-500' },
    { id: 4, title: 'Test drive started — Brandon Hicks', time: '18m ago', dot: 'bg-blue-500' },
  ];

  return (
    <header className="h-14 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 flex items-center px-4 gap-3">
      {/* Mobile menu */}
      <button
        onClick={onMenuOpen}
        className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Menu className="size-5" />
      </button>

      {/* D365 brand pill (mobile) */}
      <div className="lg:hidden flex items-center gap-1.5">
        <div className="size-6 rounded-md bg-blue-600 flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">D3</span>
        </div>
        <span className="text-sm font-bold text-foreground">Dealer365</span>
      </div>

      {/* Search bar */}
      <button
        onClick={onCommandOpen}
        className="flex-1 max-w-md flex items-center gap-2.5 px-3 py-2 rounded-lg bg-muted/60 border border-border
                   text-muted-foreground text-sm hover:border-blue-300 hover:bg-muted transition-all group"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Search RO, customer, deal...</span>
        <div className="hidden sm:flex items-center gap-1 ml-auto">
          <kbd className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono">⌘</kbd>
          <kbd className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono">K</kbd>
        </div>
        <Mic className="size-3.5 shrink-0 hidden sm:block" />
      </button>

      <div className="flex items-center gap-1 ml-auto">
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen((v) => !v)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-sm
                       hover:border-blue-300 hover:bg-muted transition-all"
          >
            <div className={`size-2 rounded-full ${config.avatarColor}`} />
            <span className="font-medium text-foreground truncate max-w-[120px]">{config.label}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>

          <AnimatePresence>
            {roleMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-52 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1"
                >
                  <p className="px-3 py-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Switch Role</p>
                  {ROLE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { onRoleChange(opt.id); setRoleMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors
                        ${role === opt.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                    >
                      <div className={`size-2 rounded-full ${ROLE_CONFIGS[opt.id].avatarColor}`} />
                      <div>
                        <p className={`text-sm font-medium ${role === opt.id ? 'text-blue-700 dark:text-blue-400' : 'text-foreground'}`}>
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                      </div>
                      {role === opt.id && (
                        <div className="ml-auto size-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Bell className="size-5" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-foreground">Notifications</span>
                    <span className="text-xs text-blue-600 cursor-pointer hover:underline">Mark all read</span>
                  </div>
                  <div className="divide-y divide-border">
                    {notifications.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <span className={`size-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                        <div>
                          <p className="text-sm text-foreground font-medium">{n.title}</p>
                          <p className="text-xs text-muted-foreground">{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t border-border">
                    <button className="text-xs text-blue-600 hover:underline">View all notifications</button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        {/* Command shortcut */}
        <button
          onClick={onCommandOpen}
          className="hidden md:flex items-center gap-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Command Palette (⌘K)"
        >
          <Command className="size-5" />
        </button>
      </div>
    </header>
  );
}
