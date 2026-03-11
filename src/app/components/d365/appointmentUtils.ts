import { AppointmentItem, AppointmentStatus, AppointmentType, Role } from './types';

// ─── CTA Config ──────────────────────────────────────────────────────────────

export interface CTAConfig {
  label: string;
  variant: 'primary' | 'secondary';
  navTarget?: string;
}

// ─── Lifecycle Steps ──────────────────────────────────────────────────────────

export interface LifecycleStep {
  key: AppointmentStatus;
  short: string;
}

export const SERVICE_LIFECYCLE: LifecycleStep[] = [
  { key: 'pending',    short: 'Pending' },
  { key: 'confirmed',  short: 'Confirmed' },
  { key: 'checked-in', short: 'Checked In' },
  { key: 'walkaround', short: 'Walkaround' },
  { key: 'ro-created', short: 'RO Created' },
  { key: 'in-service', short: 'In Service' },
  { key: 'completed',  short: 'Done' },
];

export const SALES_LIFECYCLE: LifecycleStep[] = [
  { key: 'pending',         short: 'Pending' },
  { key: 'confirmed',       short: 'Confirmed' },
  { key: 'checked-in',      short: 'Checked In' },
  { key: 'in-consultation', short: 'In Consult' },
  { key: 'completed',       short: 'Done' },
];

export function getLifecycleSteps(type: AppointmentType): LifecycleStep[] {
  return (type === 'service' || type === 'walk-in') ? SERVICE_LIFECYCLE : SALES_LIFECYCLE;
}

// ─── Active statuses ─────────────────────────────────────────────────────────

export const ACTIVE_STATUSES: AppointmentStatus[] = [
  'checked-in', 'walkaround', 'ro-created', 'in-service', 'in-consultation',
];

// ─── Primary CTA (used in BOTH list row and detail panel — must match) ────────

export function getAppointmentCTA(item: AppointmentItem, role: Role): CTAConfig | null {
  const { status, type } = item;
  const isService = type === 'service' || type === 'walk-in';
  const isTerminal = ['completed', 'no-show', 'canceled'].includes(status);
  const v = (label: string, navTarget?: string): CTAConfig => ({
    label,
    variant: isTerminal ? 'secondary' : 'primary',
    navTarget,
  });

  // Technician: read-only, only View RO for active service work
  if (role === 'technician') {
    if (status === 'ro-created' || status === 'in-service') {
      return { label: 'View RO', variant: 'secondary', navTarget: 'ros' };
    }
    return null;
  }

  // Manager: sees all, secondary variant
  if (role === 'manager') {
    const cta = isService
      ? getServiceCTA(status)
      : getSalesCTA(status, type);
    if (!cta) return { label: 'View', variant: 'secondary' };
    return { ...cta, variant: 'secondary' };
  }

  // Advisor / Dispatcher: service + walk-in only
  if (role === 'advisor' || role === 'dispatcher') {
    if (!isService) return null;
    const cta = getServiceCTA(status);
    if (!cta) return null;
    return { ...cta, variant: isTerminal ? 'secondary' : 'primary' };
  }

  // Sales: sales-consultation / test-drive / follow-up only
  if (role === 'sales') {
    if (isService) return null;
    const cta = getSalesCTA(status, type);
    if (!cta) return null;
    return { ...cta, variant: isTerminal ? 'secondary' : 'primary' };
  }

  return null;
}

function getServiceCTA(status: AppointmentStatus): { label: string; navTarget?: string } | null {
  switch (status) {
    case 'pending':    return { label: 'Confirm' };
    case 'confirmed':  return { label: 'Check In' };
    case 'checked-in': return { label: 'Walkaround', navTarget: 'walkaround' };
    case 'walkaround': return { label: 'Create RO',  navTarget: 'ros' };
    case 'ro-created': return { label: 'View RO',    navTarget: 'ros' };
    case 'in-service': return { label: 'View RO',    navTarget: 'ros' };
    case 'completed':  return { label: 'View History' };
    case 'no-show':    return { label: 'Reschedule' };
    case 'canceled':   return { label: 'Rebook' };
    default:           return null;
  }
}

function getSalesCTA(status: AppointmentStatus, type: AppointmentType): { label: string; navTarget?: string } | null {
  switch (status) {
    case 'pending':         return { label: 'Confirm' };
    case 'confirmed':       return type === 'test-drive'
                              ? { label: 'Start Drive', navTarget: 'test-drive' }
                              : { label: 'Check In' };
    case 'checked-in':      return { label: 'Open Consult', navTarget: 'consultation' };
    case 'in-consultation': return { label: 'Continue',     navTarget: 'consultation' };
    case 'completed':       return { label: 'View History' };
    case 'no-show':         return { label: 'Reschedule' };
    case 'canceled':        return { label: 'Rebook' };
    default:                return null;
  }
}

// ─── Secondary actions (detail panel only) ───────────────────────────────────

export function getSecondaryActions(status: AppointmentStatus): string[] {
  switch (status) {
    case 'pending':         return ['Contact Customer', 'Cancel'];
    case 'confirmed':       return ['Reschedule', 'Open Record'];
    case 'checked-in':      return ['Reschedule', 'Open Record'];
    case 'walkaround':      return ['Open Record'];
    case 'ro-created':      return ['Open Record', 'Contact Customer'];
    case 'in-service':      return ['Open Record', 'Contact Customer'];
    case 'in-consultation': return ['Open Record', 'Contact Customer'];
    case 'completed':       return ['Open Record', 'Contact Customer'];
    case 'no-show':         return ['Open Record', 'Contact Customer'];
    case 'canceled':        return ['Open Record'];
    default:                return ['Open Record'];
  }
}
