export type Role = 'technician' | 'advisor' | 'dispatcher' | 'sales' | 'manager';

export type ItemStatus =
  | 'not-started'
  | 'in-progress'
  | 'waiting-parts'
  | 'waiting-approval'
  | 'completed'
  | 'blocked'
  | 'delayed'
  | 'confirmed'
  | 'checked-in'
  | 'unassigned'
  | 'new'
  | 'scheduled'
  | 'test-drive'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface QueueItem {
  id: string;
  refNumber: string;
  customerName: string;
  customerInitials: string;
  vehicle: string;
  status: ItemStatus;
  priority: Priority;
  timeLabel: string;
  subLabel?: string;
  estimatedValue?: string;
  bay?: string;
  techAssigned?: string;
  hoursElapsed?: number;
  totalHours?: number;
  source?: string;
  nextAction?: string;
  tags?: string[];
  unreadMessages?: number;
  hasFlag?: boolean;
}

export interface SummaryItem {
  label: string;
  count: number;
  color: 'green' | 'amber' | 'red' | 'blue' | 'slate';
}

export interface NBAConfig {
  label: string;
  description: string;
  count?: number;
  urgency: 'normal' | 'medium' | 'high';
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
  path: string;
  section?: string;
}

export interface RoleConfig {
  id: Role;
  label: string;
  avatarColor: string;
  primarySectionTitle: string;
  secondarySectionTitle: string;
  summary: SummaryItem[];
  nba: NBAConfig;
  queue: QueueItem[];
  navItems: NavItem[];
}

// ─── Appointment Queue ──────────────────────────────────────────────────────

export type AppointmentType =
  | 'service'
  | 'sales-consultation'
  | 'test-drive'
  | 'walk-in'
  | 'follow-up';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'walkaround'        // appointment is in walkaround phase
  | 'ro-created'        // RO has been created from walkaround
  | 'in-service'        // vehicle actively being worked on
  | 'in-consultation'   // sales consultation in progress
  | 'completed'
  | 'no-show'
  | 'canceled';

export type AppointmentSource =
  | 'portal'
  | 'phone'
  | 'walk-in'
  | 'crm'
  | 'autotrader'
  | 'referral'
  | 'showroom';

export interface AppointmentItem {
  id: string;
  refNumber: string;
  type: AppointmentType;
  customerName: string;
  customerInitials: string;
  vehicle: string;
  scheduledTime: string;          // e.g. "9:30 AM"
  timeGroup: 'morning' | 'afternoon' | 'evening';
  assignedTo: string;
  assignedRole: 'advisor' | 'sales';
  status: AppointmentStatus;
  source: AppointmentSource;
  services?: string[];
  estimatedValue?: string;
  estimatedDuration?: string;
  hasFlag?: boolean;
  unreadMessages?: number;
  notes?: string;
  roNumber?: string;
}