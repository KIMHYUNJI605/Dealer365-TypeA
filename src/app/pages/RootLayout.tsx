import { useState, useEffect, useCallback } from 'react';
import { Role } from '../components/d365/types';
import { Sidebar } from '../components/d365/Sidebar';
import { TopHeader } from '../components/d365/TopHeader';
import { CommandPalette } from '../components/d365/CommandPalette';
import { Toaster } from '../components/ui/sonner';
import { DashboardPage } from './DashboardPage';
import { AppointmentQueuePage } from './AppointmentQueuePage';
import { ServiceWorkbenchPage } from './ServiceWorkbenchPage';
import { DispatchBoardPage } from './DispatchBoardPage';
import { RODetailPage } from './RODetailPage';
import { WalkaroundPage } from './WalkaroundPage';
import { InspectionToolPage } from './InspectionToolPage';
import { ConsultationWorkspacePage } from './ConsultationWorkspacePage';

export function RootLayout() {
  const [role, setRole] = useState<Role>('advisor');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [activeNav, setActiveNav] = useState('consultation');

  // Cmd+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandOpen((v) => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Detect system dark preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        role={role}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        onMobileClose={() => setMobileMenuOpen(false)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader
          role={role}
          onRoleChange={(r) => { setRole(r); setActiveNav('dashboard'); }}
          onMenuOpen={() => setMobileMenuOpen(true)}
          onCommandOpen={() => setCommandOpen(true)}
          isDark={isDark}
          onThemeToggle={() => setIsDark((v) => !v)}
        />

        {/* Main content area */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeNav === 'dashboard' ? (
            <DashboardPage role={role} />
          ) : activeNav === 'appointments' ? (
            <AppointmentQueuePage role={role} onNavigate={setActiveNav} />
          ) : activeNav === 'service-workbench' || activeNav === 'service-queue' || activeNav === 'my-jobs' ? (
            <ServiceWorkbenchPage role={role} />
          ) : activeNav === 'dispatch' ? (
            <DispatchBoardPage role={role} />
          ) : activeNav === 'ros' ? (
            <RODetailPage role={role} />
          ) : activeNav === 'walkaround' ? (
            <WalkaroundPage role={role} onNavigate={setActiveNav} />
          ) : activeNav === 'inspection' ? (
            <InspectionToolPage role={role} onNavigate={setActiveNav} />
          ) : activeNav === 'consultation' ? (
            <ConsultationWorkspacePage role={role} onNavigate={setActiveNav} />
          ) : (
            <PlaceholderPage navId={activeNav} onBack={() => setActiveNav('dashboard')} />
          )}
        </main>
      </div>

      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <Toaster />
    </div>
  );
}

// Placeholder for non-built pages
function PlaceholderPage({ navId, onBack }: { navId: string; onBack: () => void }) {
  const labels: Record<string, string> = {
    'my-jobs': 'My Jobs',
    'clock': 'Time & Labor',
    'parts': 'Parts & Inventory',
    'appointments': 'Appointments',
    'service-workbench': 'Service Workbench',
    'service-queue': 'Service Workbench',
    'ros': 'Repair Orders',
    'customers': 'Customers',
    'vehicles': 'Vehicles',
    'dispatch': 'Dispatch Board',
    'technicians': 'Technicians',
    'leads': 'My Leads',
    'vehicles-inv': 'Inventory',
    'test-drives': 'Test Drives',
    'deals': 'Deals',
    'operations': 'Operations',
    'reports': 'Reports',
    'service': 'Service Department',
    'sales': 'Sales Department',
    'team': 'Team',
    'settings': 'Settings',
    // Appointment CTA targets
    'consultation': 'Sales Consultation',
    'test-drive': 'Test Drive',
    'history': 'Customer History',
    'inspection': 'Inspection Tool',
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="size-20 rounded-3xl bg-muted flex items-center justify-center">
        <div className="size-8 rounded-full bg-blue-600/20 flex items-center justify-center">
          <div className="size-3 rounded-full bg-blue-600" />
        </div>
      </div>
      <div>
        <h2 className="text-foreground">{labels[navId] ?? 'Page'}</h2>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
          This module is part of the Dealer365 platform. Navigate back to the dashboard to continue.
        </p>
      </div>
      <button
        onClick={onBack}
        className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
      >
        Back to Dashboard
      </button>
    </div>
  );
}