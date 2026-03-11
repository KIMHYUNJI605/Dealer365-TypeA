import { Priority } from './types';

// ─── RO-specific types ────────────────────────────────────────────────────────

export type ROStatus =
  | 'write-up'
  | 'dispatched'
  | 'in-progress'
  | 'waiting-parts'
  | 'waiting-approval'
  | 'quality-check'
  | 'completed'
  | 'delivered'
  | 'blocked'
  | 'on-hold';

export type JobType =
  | 'maintenance'
  | 'repair'
  | 'diagnostic'
  | 'recall'
  | 'warranty'
  | 'install';

export interface ROPart {
  name: string;
  partNumber: string;
  qty: number;
  price: string;
  status: 'in-stock' | 'ordered' | 'backordered' | 'received';
}

export interface ROJob {
  id: string;
  opCode: string;
  description: string;
  type: JobType;
  laborHours: number;
  laborRate: number;
  techInitials?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'waiting-parts';
  parts?: ROPart[];
}

export interface RepairOrder {
  id: string;
  roNumber: string;
  customerName: string;
  customerInitials: string;
  customerPhone: string;
  vehicle: string;
  mileageIn: string;
  bay?: string;
  techName?: string;
  techInitials?: string;
  advisorName: string;
  advisorInitials: string;
  status: ROStatus;
  priority: Priority;
  jobs: ROJob[];
  laborHoursEstimated: number;
  laborHoursElapsed: number;
  estimatedTotal: string;
  timeIn: string;
  promisedTime: string;
  tags?: string[];
  hasFlag?: boolean;
  unreadMessages?: number;
  customerWaiting?: boolean;
  loaner?: boolean;
  notes?: string;
}

// ─── Mock Repair Orders (16 records) ─────────────────────────────────────────

export const REPAIR_ORDERS: RepairOrder[] = [
  {
    id: 'ro1',
    roNumber: 'RO-10284',
    customerName: 'Marcus Rivera',
    customerInitials: 'MR',
    customerPhone: '(555) 291-4821',
    vehicle: '2022 Honda Accord Sport',
    mileageIn: '24,310 mi',
    bay: 'Bay 4',
    techName: 'Jake M.',
    techInitials: 'JM',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'in-progress',
    priority: 'high',
    jobs: [
      {
        id: 'ro1-j1', opCode: '0010', description: 'Engine Oil & Filter Change', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, techInitials: 'JM', status: 'completed',
        parts: [{ name: 'Mobil 1 5W-30 5QT', partNumber: 'M1-5W30-5', qty: 1, price: '$42.00', status: 'received' }],
      },
      {
        id: 'ro1-j2', opCode: '0540', description: 'Brake System Inspection — All 4 Corners', type: 'diagnostic',
        laborHours: 1.0, laborRate: 145, techInitials: 'JM', status: 'in-progress',
      },
      {
        id: 'ro1-j3', opCode: '0030', description: 'Tire Rotation & Balance', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, status: 'not-started',
      },
    ],
    laborHoursEstimated: 2.0,
    laborHoursElapsed: 1.2,
    estimatedTotal: '$412',
    timeIn: '8:15 AM',
    promisedTime: '12:00 PM',
    customerWaiting: true,
    tags: ['Warranty'],
  },
  {
    id: 'ro2',
    roNumber: 'RO-10291',
    customerName: 'Sarah Chen',
    customerInitials: 'SC',
    customerPhone: '(555) 482-7731',
    vehicle: '2019 Toyota Camry LE',
    mileageIn: '67,820 mi',
    bay: 'Bay 2',
    techName: 'Sarah T.',
    techInitials: 'ST',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'waiting-parts',
    priority: 'medium',
    jobs: [
      {
        id: 'ro2-j1', opCode: '1240', description: 'Alternator Replacement', type: 'repair',
        laborHours: 3.0, laborRate: 145, techInitials: 'ST', status: 'waiting-parts',
        parts: [
          { name: 'Denso Alternator OEM', partNumber: 'D-27060-0T090', qty: 1, price: '$318.00', status: 'ordered' },
          { name: 'Drive Belt', partNumber: 'A-90916-02683', qty: 1, price: '$24.00', status: 'in-stock' },
        ],
      },
    ],
    laborHoursEstimated: 3.0,
    laborHoursElapsed: 0,
    estimatedTotal: '$778',
    timeIn: '7:30 AM',
    promisedTime: '4:00 PM',
    tags: ['Parts Ordered'],
    notes: 'Parts ETA 1:30 PM per AutoZone Pro. Customer notified via text.',
  },
  {
    id: 'ro3',
    roNumber: 'RO-10277',
    customerName: 'David Thompson',
    customerInitials: 'DT',
    customerPhone: '(555) 671-2209',
    vehicle: '2020 Ford F-150 XLT',
    mileageIn: '52,100 mi',
    bay: 'Bay 6',
    techName: 'Carlos D.',
    techInitials: 'CD',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'dispatched',
    priority: 'medium',
    jobs: [
      {
        id: 'ro3-j1', opCode: '0720', description: 'Automatic Transmission Service', type: 'maintenance',
        laborHours: 2.5, laborRate: 145, techInitials: 'CD', status: 'not-started',
        parts: [
          { name: 'Mercon LV ATF 5QT', partNumber: 'F-XT5QMC', qty: 2, price: '$56.00', status: 'in-stock' },
          { name: 'Trans Pan Gasket', partNumber: 'F-BC3Z7D100A', qty: 1, price: '$28.00', status: 'in-stock' },
        ],
      },
    ],
    laborHoursEstimated: 2.5,
    laborHoursElapsed: 0,
    estimatedTotal: '$506',
    timeIn: '2:00 PM',
    promisedTime: '5:00 PM',
  },
  {
    id: 'ro4',
    roNumber: 'RO-10302',
    customerName: 'Amara Johnson',
    customerInitials: 'AJ',
    customerPhone: '(555) 904-3317',
    vehicle: '2019 Mercedes-Benz GLC 300',
    mileageIn: '38,540 mi',
    bay: 'Bay 8',
    techName: 'Mike R.',
    techInitials: 'MR',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'blocked',
    priority: 'urgent',
    jobs: [
      {
        id: 'ro4-j1', opCode: '2210', description: 'Front CV Axle Replacement — Driver Side', type: 'repair',
        laborHours: 2.5, laborRate: 165, techInitials: 'MR', status: 'in-progress',
        parts: [{ name: 'GKN CV Axle Assembly', partNumber: 'GKN-SK-8719', qty: 1, price: '$284.00', status: 'in-stock' }],
      },
      {
        id: 'ro4-j2', opCode: '3100', description: '4-Wheel Alignment', type: 'maintenance',
        laborHours: 1.0, laborRate: 165, status: 'not-started',
      },
    ],
    laborHoursEstimated: 3.5,
    laborHoursElapsed: 2.1,
    estimatedTotal: '$840',
    timeIn: '7:00 AM',
    promisedTime: '11:00 AM',
    hasFlag: true,
    tags: ['Premium', 'Overdue'],
    loaner: true,
    notes: 'BLOCKED: Special extraction tool #MB4421 required for CV axle. Pending OEM supplier. Customer has loaner.',
  },
  {
    id: 'ro5',
    roNumber: 'RO-10279',
    customerName: 'Chris Nolan',
    customerInitials: 'CN',
    customerPhone: '(555) 238-0091',
    vehicle: '2022 Tesla Model 3 Long Range',
    mileageIn: '18,920 mi',
    bay: 'EV Bay 1',
    techName: 'Sarah T.',
    techInitials: 'ST',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'waiting-parts',
    priority: 'high',
    jobs: [
      {
        id: 'ro5-j1', opCode: 'EV-480', description: 'HV Battery Module Replacement — Cell Pack B', type: 'repair',
        laborHours: 4.0, laborRate: 195, techInitials: 'ST', status: 'waiting-parts',
        parts: [
          { name: 'Tesla HV Cell Module Pack B', partNumber: 'T-1120082-00-F', qty: 1, price: '$2,140.00', status: 'backordered' },
        ],
      },
    ],
    laborHoursEstimated: 4.0,
    laborHoursElapsed: 0,
    estimatedTotal: '$2,920',
    timeIn: '8:00 AM',
    promisedTime: '5:00 PM',
    hasFlag: true,
    tags: ['EV', 'High Voltage', 'Backordered'],
    loaner: true,
    notes: 'Tesla OEM part backordered. Sourcing alternative from Tesla Service Network. Loaner provided.',
  },
  {
    id: 'ro6',
    roNumber: 'RO-10316',
    customerName: 'Emily Santos',
    customerInitials: 'ES',
    customerPhone: '(555) 773-4490',
    vehicle: '2020 Subaru Forester XT',
    mileageIn: '41,200 mi',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'write-up',
    priority: 'medium',
    jobs: [
      {
        id: 'ro6-j1', opCode: '0541', description: 'Front Brake Pads & Rotors', type: 'repair',
        laborHours: 1.5, laborRate: 145, status: 'not-started',
        parts: [
          { name: 'Bosch QuietCast Brake Pad Set', partNumber: 'BC-BP0793010', qty: 1, price: '$64.00', status: 'in-stock' },
          { name: 'Subaru OE Rotor Pair', partNumber: 'SU-26300FE020', qty: 2, price: '$88.00', status: 'in-stock' },
        ],
      },
      {
        id: 'ro6-j2', opCode: '0030', description: 'Tire Rotation', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, status: 'not-started',
      },
    ],
    laborHoursEstimated: 2.0,
    laborHoursElapsed: 0,
    estimatedTotal: '$397',
    timeIn: '9:45 AM',
    promisedTime: '1:30 PM',
    customerWaiting: true,
  },
  {
    id: 'ro7',
    roNumber: 'RO-10320',
    customerName: 'James Liu',
    customerInitials: 'JL',
    customerPhone: '(555) 512-8847',
    vehicle: '2019 BMW 530i xDrive',
    mileageIn: '58,740 mi',
    bay: 'Bay 3',
    techName: 'Tony F.',
    techInitials: 'TF',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'quality-check',
    priority: 'high',
    jobs: [
      {
        id: 'ro7-j1', opCode: '1180', description: 'Timing Chain Kit Replacement', type: 'repair',
        laborHours: 6.0, laborRate: 165, techInitials: 'TF', status: 'completed',
        parts: [
          { name: 'BMW Timing Chain Kit OEM', partNumber: 'B-11318636606', qty: 1, price: '$680.00', status: 'received' },
          { name: 'Timing Cover Gasket Set', partNumber: 'B-11141438725', qty: 1, price: '$92.00', status: 'received' },
        ],
      },
      {
        id: 'ro7-j2', opCode: '1410', description: 'Water Pump Replacement', type: 'repair',
        laborHours: 1.0, laborRate: 165, techInitials: 'TF', status: 'completed',
        parts: [{ name: 'BMW Water Pump Assembly', partNumber: 'B-11517597715', qty: 1, price: '$225.00', status: 'received' }],
      },
    ],
    laborHoursEstimated: 7.0,
    laborHoursElapsed: 7.2,
    estimatedTotal: '$1,940',
    timeIn: '7:00 AM',
    promisedTime: '3:00 PM',
    tags: ['Premium'],
  },
  {
    id: 'ro8',
    roNumber: 'RO-10311',
    customerName: 'Karen Walsh',
    customerInitials: 'KW',
    customerPhone: '(555) 348-6621',
    vehicle: '2021 Jeep Grand Cherokee L',
    mileageIn: '29,900 mi',
    bay: 'Alignment Bay',
    techName: 'Marcus H.',
    techInitials: 'MH',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'in-progress',
    priority: 'medium',
    jobs: [
      {
        id: 'ro8-j1', opCode: '3100', description: '4-Wheel Laser Alignment', type: 'maintenance',
        laborHours: 1.0, laborRate: 145, techInitials: 'MH', status: 'in-progress',
      },
      {
        id: 'ro8-j2', opCode: '0030', description: 'Tire Rotation', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, status: 'not-started',
      },
    ],
    laborHoursEstimated: 1.5,
    laborHoursElapsed: 0.8,
    estimatedTotal: '$218',
    timeIn: '10:15 AM',
    promisedTime: '12:30 PM',
    customerWaiting: true,
  },
  {
    id: 'ro9',
    roNumber: 'RO-10325',
    customerName: 'Tony Garcia',
    customerInitials: 'TG',
    customerPhone: '(555) 109-5503',
    vehicle: '2021 Ram 1500 Laramie',
    mileageIn: '44,210 mi',
    bay: 'Bay 5',
    techName: 'Mike R.',
    techInitials: 'MR',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'waiting-approval',
    priority: 'urgent',
    jobs: [
      {
        id: 'ro9-j1', opCode: '0900', description: 'Engine Performance Diagnostic', type: 'diagnostic',
        laborHours: 1.0, laborRate: 145, techInitials: 'MR', status: 'completed',
      },
      {
        id: 'ro9-j2', opCode: '0940', description: 'Spark Plug Replacement — All 8', type: 'repair',
        laborHours: 2.0, laborRate: 145, techInitials: 'MR', status: 'waiting-parts',
        parts: [{ name: 'NGK Iridium Spark Plug ×8', partNumber: 'NGK-LFR6AIX-11', qty: 8, price: '$112.00', status: 'in-stock' }],
      },
      {
        id: 'ro9-j3', opCode: '0950', description: 'Fuel Injector Cleaning', type: 'maintenance',
        laborHours: 1.5, laborRate: 145, techInitials: 'MR', status: 'not-started',
      },
    ],
    laborHoursEstimated: 4.5,
    laborHoursElapsed: 1.0,
    estimatedTotal: '$1,890',
    timeIn: '9:00 AM',
    promisedTime: '3:00 PM',
    hasFlag: true,
    unreadMessages: 2,
    notes: 'Approval required for repair ops. Auth for $1,890. Called twice — no answer. Text sent 42 min ago.',
  },
  {
    id: 'ro10',
    roNumber: 'RO-10295',
    customerName: 'Thomas Bailey',
    customerInitials: 'TB',
    customerPhone: '(555) 820-0044',
    vehicle: '2021 Ram 1500 Big Horn',
    mileageIn: '71,400 mi',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'dispatched',
    priority: 'urgent',
    jobs: [
      {
        id: 'ro10-j1', opCode: '0721', description: 'Automatic Transmission Replacement — 8HP70', type: 'repair',
        laborHours: 8.0, laborRate: 145, status: 'not-started',
        parts: [
          { name: 'Reman. 8HP70 Transmission Assembly', partNumber: 'ZF-8HP70-RAM', qty: 1, price: '$3,200.00', status: 'in-stock' },
        ],
      },
    ],
    laborHoursEstimated: 8.0,
    laborHoursElapsed: 0,
    estimatedTotal: '$4,360',
    timeIn: '9:00 AM',
    promisedTime: 'Tomorrow 4:00 PM',
    hasFlag: true,
    tags: ['Unassigned'],
    notes: 'Waiting for bay and tech assignment. All primary bays currently occupied.',
  },
  {
    id: 'ro11',
    roNumber: 'RO-10308',
    customerName: 'Helen Park',
    customerInitials: 'HP',
    customerPhone: '(555) 672-8801',
    vehicle: '2021 Hyundai Tucson N Line',
    mileageIn: '30,140 mi',
    bay: 'Bay 7',
    techName: 'Kevin W.',
    techInitials: 'KW',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'in-progress',
    priority: 'low',
    jobs: [
      {
        id: 'ro11-j1', opCode: '0100', description: '30,000-Mile Scheduled Maintenance', type: 'maintenance',
        laborHours: 3.0, laborRate: 145, techInitials: 'KW', status: 'in-progress',
        parts: [
          { name: 'Engine Air Filter', partNumber: 'HY-28113D3000', qty: 1, price: '$24.00', status: 'in-stock' },
          { name: 'Cabin Air Filter', partNumber: 'HY-97133C1000', qty: 1, price: '$18.00', status: 'in-stock' },
          { name: 'Engine Oil & Filter Kit', partNumber: 'HY-0W20-5QT', qty: 1, price: '$48.00', status: 'in-stock' },
        ],
      },
    ],
    laborHoursEstimated: 3.0,
    laborHoursElapsed: 1.5,
    estimatedTotal: '$528',
    timeIn: '11:00 AM',
    promisedTime: '3:00 PM',
    customerWaiting: true,
  },
  {
    id: 'ro12',
    roNumber: 'RO-10299',
    customerName: 'Frank Ortiz',
    customerInitials: 'FO',
    customerPhone: '(555) 441-9987',
    vehicle: '2017 Jeep Wrangler JK Sport',
    mileageIn: '88,200 mi',
    bay: 'Bay 9',
    techName: 'Lisa B.',
    techInitials: 'LB',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'in-progress',
    priority: 'medium',
    jobs: [
      {
        id: 'ro12-j1', opCode: '4100', description: '4" Lift Kit Installation', type: 'install',
        laborHours: 4.0, laborRate: 145, techInitials: 'LB', status: 'in-progress',
        parts: [{ name: 'Rough Country 4" Lift Kit', partNumber: 'RC-633.20', qty: 1, price: '$520.00', status: 'received' }],
      },
      {
        id: 'ro12-j2', opCode: '4110', description: 'Skid Plate Installation', type: 'install',
        laborHours: 1.0, laborRate: 145, status: 'not-started',
        parts: [{ name: 'Mopar Skid Plate', partNumber: 'MP-82215429', qty: 1, price: '$188.00', status: 'in-stock' }],
      },
    ],
    laborHoursEstimated: 5.0,
    laborHoursElapsed: 2.5,
    estimatedTotal: '$1,274',
    timeIn: '8:30 AM',
    promisedTime: '5:00 PM',
    tags: ['Aftermarket'],
  },
  {
    id: 'ro13',
    roNumber: 'RO-10330',
    customerName: 'Priya Sharma',
    customerInitials: 'PS',
    customerPhone: '(555) 260-3348',
    vehicle: '2020 Audi A4 Premium Plus',
    mileageIn: '45,660 mi',
    bay: 'Bay 10',
    techName: 'Tony F.',
    techInitials: 'TF',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'waiting-parts',
    priority: 'high',
    jobs: [
      {
        id: 'ro13-j1', opCode: '1620', description: 'Turbocharger Assembly Replacement', type: 'repair',
        laborHours: 5.0, laborRate: 165, techInitials: 'TF', status: 'waiting-parts',
        parts: [
          { name: 'Audi OEM Turbo Assembly 2.0T', partNumber: 'A-06K145722S', qty: 1, price: '$1,480.00', status: 'ordered' },
          { name: 'Turbo Inlet Gasket Set', partNumber: 'A-06J253039G', qty: 1, price: '$48.00', status: 'in-stock' },
          { name: 'Oil Feed Line', partNumber: 'A-06H145536K', qty: 1, price: '$68.00', status: 'in-stock' },
        ],
      },
    ],
    laborHoursEstimated: 5.0,
    laborHoursElapsed: 0,
    estimatedTotal: '$2,420',
    timeIn: '8:00 AM',
    promisedTime: '5:00 PM',
    tags: ['Premium', 'Parts Ordered'],
    loaner: true,
    notes: 'OEM turbo ordered, ETA 3:00 PM. Pre-authorized up to $2,500.',
  },
  {
    id: 'ro14',
    roNumber: 'RO-10267',
    customerName: 'Bob Martinez',
    customerInitials: 'BM',
    customerPhone: '(555) 819-2234',
    vehicle: '2019 Toyota Sienna XLE',
    mileageIn: '82,400 mi',
    bay: 'Lube Bay',
    techName: 'Carlos D.',
    techInitials: 'CD',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'completed',
    priority: 'low',
    jobs: [
      {
        id: 'ro14-j1', opCode: '0010', description: 'Engine Oil & Filter Change', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, techInitials: 'CD', status: 'completed',
        parts: [
          { name: 'Toyota Genuine Oil Filter', partNumber: 'TO-90915YZZD3', qty: 1, price: '$12.00', status: 'received' },
          { name: '5W-30 Synthetic Oil 5QT', partNumber: 'T-0W20-5QT', qty: 1, price: '$38.00', status: 'received' },
        ],
      },
      {
        id: 'ro14-j2', opCode: '0020', description: 'Cabin Air Filter Replacement', type: 'maintenance',
        laborHours: 0.25, laborRate: 145, techInitials: 'CD', status: 'completed',
        parts: [{ name: 'Denso Cabin Filter', partNumber: 'D-453-3067', qty: 1, price: '$22.00', status: 'received' }],
      },
      {
        id: 'ro14-j3', opCode: '0040', description: 'Wiper Blade Set Replacement', type: 'maintenance',
        laborHours: 0.25, laborRate: 145, techInitials: 'CD', status: 'completed',
        parts: [{ name: 'Rain-X Wiper Set', partNumber: 'RX-5079274-2', qty: 1, price: '$28.00', status: 'received' }],
      },
    ],
    laborHoursEstimated: 1.0,
    laborHoursElapsed: 1.0,
    estimatedTotal: '$215',
    timeIn: '7:15 AM',
    promisedTime: '9:30 AM',
  },
  {
    id: 'ro15',
    roNumber: 'RO-10258',
    customerName: 'Linda Chen',
    customerInitials: 'LC',
    customerPhone: '(555) 534-7712',
    vehicle: '2021 Honda Pilot EX-L',
    mileageIn: '31,700 mi',
    bay: 'Bay 1',
    techName: 'Jake M.',
    techInitials: 'JM',
    advisorName: 'Chris Walters',
    advisorInitials: 'CW',
    status: 'completed',
    priority: 'low',
    jobs: [
      {
        id: 'ro15-j1', opCode: '0820', description: 'Brake Fluid Flush', type: 'maintenance',
        laborHours: 1.0, laborRate: 145, techInitials: 'JM', status: 'completed',
        parts: [{ name: 'Honda Brake Fluid DOT3', partNumber: 'H-08798-9008', qty: 2, price: '$24.00', status: 'received' }],
      },
      {
        id: 'ro15-j2', opCode: '0030', description: 'Tire Rotation', type: 'maintenance',
        laborHours: 0.5, laborRate: 145, techInitials: 'JM', status: 'completed',
      },
      {
        id: 'ro15-j3', opCode: '0070', description: 'Multi-Point Vehicle Inspection', type: 'diagnostic',
        laborHours: 0.5, laborRate: 145, techInitials: 'JM', status: 'completed',
      },
    ],
    laborHoursEstimated: 2.0,
    laborHoursElapsed: 1.8,
    estimatedTotal: '$332',
    timeIn: '9:00 AM',
    promisedTime: '11:30 AM',
  },
  {
    id: 'ro16',
    roNumber: 'RO-10344',
    customerName: 'Alex Turner',
    customerInitials: 'AT',
    customerPhone: '(555) 677-4419',
    vehicle: '2022 Chevrolet Silverado 1500 LT',
    mileageIn: '22,800 mi',
    advisorName: 'Mia Brooks',
    advisorInitials: 'MB',
    status: 'write-up',
    priority: 'medium',
    jobs: [
      {
        id: 'ro16-j1', opCode: '1800', description: 'AC System Diagnostic', type: 'diagnostic',
        laborHours: 1.0, laborRate: 145, status: 'not-started',
      },
      {
        id: 'ro16-j2', opCode: '1810', description: 'AC System Recharge — R-134A', type: 'repair',
        laborHours: 0.5, laborRate: 145, status: 'not-started',
        parts: [{ name: 'R-134A Refrigerant 30oz', partNumber: 'AC-R134A-30', qty: 1, price: '$42.00', status: 'in-stock' }],
      },
    ],
    laborHoursEstimated: 1.5,
    laborHoursElapsed: 0,
    estimatedTotal: '$258',
    timeIn: '12:30 PM',
    promisedTime: '4:00 PM',
    customerWaiting: true,
  },
];

// ─── Bay metadata for Bay Map ─────────────────────────────────────────────────

export const ALL_BAYS = [
  'Bay 1', 'Bay 2', 'Bay 3', 'Bay 4', 'Bay 5',
  'Bay 6', 'Bay 7', 'Bay 8', 'Bay 9', 'Bay 10',
  'Bay 11', 'Bay 12',
  'EV Bay 1', 'Alignment Bay', 'Lube Bay',
];
