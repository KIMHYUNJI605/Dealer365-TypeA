import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Wrench, Clock, Package, Car, Users, ListChecks,
  FileText, Trello, UserCheck, Target, TrendingUp, BarChart3, Activity,
  Settings, X, ChevronLeft, ChevronRight, CalendarClock, Handshake, Route,
  ClipboardList,
} from 'lucide-react';
import { NavItem, Role } from './types';
import { ROLE_CONFIGS } from './data';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Wrench, Clock, Package, Car, Users, ListChecks,
  FileText, Trello, UserCheck, Target, TrendingUp, BarChart3, Activity,
  Settings, CalendarClock, Handshake, Route, ClipboardList,
  RouteIcon: Route,
};

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  activeNav: string;
  onNavChange: (id: string) => void;
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

interface NavBtnProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}

function NavBtn({ item, collapsed, active, onClick }: NavBtnProps) {
  const Icon = ICON_MAP[item.icon] ?? LayoutDashboard;

  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group
        ${active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
          : 'text-slate-400 hover:text-white hover:bg-white/8'
        }
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
        ${collapsed ? 'justify-center' : ''}`}
    >
      <Icon className="size-[18px] shrink-0" />
      {!collapsed && (
        <>
          <span className="text-sm font-medium truncate flex-1 text-left">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
              ${active ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'}`}>
              {item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className="absolute top-1 right-1 size-2 bg-blue-500 rounded-full" />
      )}
    </button>
  );
}

function SidebarContent({
  role, collapsed, activeNav, onNavChange,
}: Pick<SidebarProps, 'role' | 'collapsed' | 'activeNav' | 'onNavChange'>) {
  const config = ROLE_CONFIGS[role];
  const grouped: Record<string, NavItem[]> = {};
  for (const item of config.navItems) {
    const section = item.section ?? 'Main';
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(item);
  }

  return (
    <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-none">
      {Object.entries(grouped).map(([section, items]) => (
        <NavGroup key={section} label={!collapsed ? section : ''}>
          {items.map((item) => (
            <NavBtn
              key={item.id}
              item={item}
              collapsed={collapsed}
              active={activeNav === item.id}
              onClick={() => onNavChange(item.id)}
            />
          ))}
        </NavGroup>
      ))}
    </nav>
  );
}

export function Sidebar({
  role, collapsed, mobileOpen, onToggleCollapse, onMobileClose, activeNav, onNavChange,
}: SidebarProps) {
  const config = ROLE_CONFIGS[role];

  const sidebarInner = (
    <div className="flex flex-col h-full bg-[#0f172a] text-white">
      {/* Logo */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'px-4'} py-4 border-b border-white/8`}>
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">D3</span>
          </div>
          {!collapsed && (
            <div>
              <span className="text-sm font-bold text-white">Dealer365</span>
              <p className="text-[10px] text-slate-500 leading-none mt-0.5">{config.label}</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto text-slate-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/8 hidden lg:block"
          >
            <ChevronLeft className="size-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <SidebarContent role={role} collapsed={collapsed} activeNav={activeNav} onNavChange={onNavChange} />

      {/* Collapse expand button at bottom */}
      {collapsed && (
        <div className="px-2 py-3 border-t border-white/8">
          <button
            onClick={onToggleCollapse}
            className="w-full flex justify-center text-slate-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/8"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* User */}
      <div className={`px-3 py-3 border-t border-white/8 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <div className={`size-8 rounded-full ${config.avatarColor} flex items-center justify-center shrink-0`}>
          <span className="text-xs font-semibold text-white">JD</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">Jordan Davis</p>
            <p className="text-[10px] text-slate-500 truncate">{config.label}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden"
      >
        {sidebarInner}
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[240px] flex flex-col"
            >
              <button
                onClick={onMobileClose}
                className="absolute top-4 right-4 text-slate-500 hover:text-white z-10"
              >
                <X className="size-5" />
              </button>
              {sidebarInner}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}