import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Camera, ChevronRight, ChevronLeft, Check, X, AlertTriangle,
  Fuel, Gauge, Clipboard, PenLine, Car, User, Phone, FileText,
  Zap, Shield, Plus, Trash2, RotateCcw, CheckCircle2, AlertCircle,
  Clock, RefreshCw, Wrench, Send, Flag, Activity, Thermometer,
  CircleSlash, Navigation, Droplets, ArrowRight, Printer,
  MapPin, CheckSquare, Square, ScanLine, TriangleAlert, Hash,
  ChevronDown, ChevronUp, Eye, BadgeCheck, Sparkles,
} from 'lucide-react';
import { Role } from '../components/d365/types';
import { REPAIR_ORDERS } from '../components/d365/repairOrderData';

// ─── Types ────────────────────────────────────────────────────────────────────

type DamageType = 'scratch' | 'dent' | 'crack' | 'chip' | 'other';
type FuelLevel = 0 | 1 | 2 | 3 | 4; // E, 1/4, 1/2, 3/4, F

interface ZoneDamage {
  types: DamageType[];
  note: string;
  photoCount: number;
}

interface Concern {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
}

interface WalkaroundData {
  mileageIn: string;
  fuelLevel: FuelLevel;
  warningLights: string[];
  zoneDamage: Record<string, ZoneDamage>;
  concerns: Concern[];
  internalNotes: string;
  isSigned: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WARNING_LIGHTS: Array<{
  id: string; label: string; Icon: React.ElementType; severity: 'critical' | 'high' | 'medium' | 'low';
}> = [
  { id: 'check-engine',    label: 'Check Engine',    Icon: Zap,          severity: 'high'     },
  { id: 'oil-pressure',    label: 'Oil Pressure',    Icon: Droplets,     severity: 'critical' },
  { id: 'battery',         label: 'Battery',         Icon: Activity,     severity: 'high'     },
  { id: 'temperature',     label: 'Engine Temp',     Icon: Thermometer,  severity: 'critical' },
  { id: 'tpms',           label: 'Tire Pressure',   Icon: AlertCircle,  severity: 'medium'   },
  { id: 'brake',           label: 'Brake System',    Icon: CircleSlash,  severity: 'critical' },
  { id: 'abs',             label: 'ABS',             Icon: Shield,       severity: 'high'     },
  { id: 'airbag',          label: 'Airbag / SRS',    Icon: User,         severity: 'critical' },
  { id: 'transmission',    label: 'Transmission',    Icon: RefreshCw,    severity: 'high'     },
  { id: 'service-due',     label: 'Service Due',     Icon: Wrench,       severity: 'low'      },
  { id: 'stability',       label: 'Stability Ctrl',  Icon: Navigation,   severity: 'medium'   },
  { id: 'fuel-low',        label: 'Low Fuel',        Icon: Fuel,         severity: 'low'      },
  { id: 'power-steering',  label: 'Power Steering',  Icon: RotateCcw,    severity: 'medium'   },
  { id: 'coolant',         label: 'Low Coolant',     Icon: Droplets,     severity: 'high'     },
  { id: 'traction',        label: 'Traction Ctrl',   Icon: Car,          severity: 'medium'   },
];

const SEVERITY_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-900/30',    text: 'text-red-600 dark:text-red-400',    ring: 'ring-red-400' },
  high:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', ring: 'ring-orange-400' },
  medium:   { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-400' },
  low:      { bg: 'bg-blue-100 dark:bg-blue-900/30',  text: 'text-blue-600 dark:text-blue-400',  ring: 'ring-blue-400' },
};

const FUEL_LABELS: Record<FuelLevel, string> = { 0: 'Empty', 1: '¼ Tank', 2: '½ Tank', 3: '¾ Tank', 4: 'Full' };
const FUEL_COLORS: Record<FuelLevel, string> = {
  0: 'bg-red-500', 1: 'bg-orange-500', 2: 'bg-amber-500', 3: 'bg-emerald-500', 4: 'bg-emerald-600',
};

const DAMAGE_TYPES: Array<{ id: DamageType; label: string; color: string; activeColor: string }> = [
  { id: 'scratch', label: 'Scratch',  color: 'border-amber-300  bg-amber-50  text-amber-700  dark:bg-amber-900/20  dark:text-amber-400',  activeColor: 'bg-amber-500  text-white border-amber-500' },
  { id: 'dent',    label: 'Dent',     color: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400', activeColor: 'bg-orange-500 text-white border-orange-500' },
  { id: 'crack',   label: 'Crack',    color: 'border-red-300    bg-red-50    text-red-700    dark:bg-red-900/20    dark:text-red-400',    activeColor: 'bg-red-500    text-white border-red-500' },
  { id: 'chip',    label: 'Chip',     color: 'border-blue-300   bg-blue-50   text-blue-700   dark:bg-blue-900/20   dark:text-blue-400',   activeColor: 'bg-blue-500   text-white border-blue-500' },
  { id: 'other',   label: 'Other',    color: 'border-violet-300 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400', activeColor: 'bg-violet-500 text-white border-violet-500' },
];

const DAMAGE_ZONE_COLOR: Record<DamageType, string> = {
  scratch: 'rgba(245,158,11,0.55)',
  dent:    'rgba(249,115,22,0.55)',
  crack:   'rgba(239,68,68,0.55)',
  chip:    'rgba(59,130,246,0.55)',
  other:   'rgba(139,92,246,0.55)',
};

const VEHICLE_ZONES: Array<{ id: string; label: string; group: string }> = [
  { id: 'front-bumper',          label: 'Front Bumper',      group: 'front'     },
  { id: 'hood',                  label: 'Hood',              group: 'front'     },
  { id: 'windshield',            label: 'Windshield',        group: 'center'    },
  { id: 'roof',                  label: 'Roof',              group: 'center'    },
  { id: 'rear-windshield',       label: 'Rear Windshield',   group: 'rear'      },
  { id: 'trunk',                 label: 'Trunk',             group: 'rear'      },
  { id: 'rear-bumper',           label: 'Rear Bumper',       group: 'rear'      },
  { id: 'driver-fender',         label: 'Driver Fender',     group: 'driver'    },
  { id: 'driver-door-front',     label: 'Driver Door (F)',   group: 'driver'    },
  { id: 'driver-door-rear',      label: 'Driver Door (R)',   group: 'driver'    },
  { id: 'driver-quarter',        label: 'Driver Quarter',    group: 'driver'    },
  { id: 'driver-mirror',         label: 'Driver Mirror',     group: 'driver'    },
  { id: 'passenger-fender',      label: 'Pax. Fender',       group: 'passenger' },
  { id: 'passenger-door-front',  label: 'Pax. Door (F)',     group: 'passenger' },
  { id: 'passenger-door-rear',   label: 'Pax. Door (R)',     group: 'passenger' },
  { id: 'passenger-quarter',     label: 'Pax. Quarter',      group: 'passenger' },
  { id: 'passenger-mirror',      label: 'Pax. Mirror',       group: 'passenger' },
];

// SVG zone geometry (viewBox 0 0 250 510)
const SVG_ZONES: Array<{ id: string; x: number; y: number; w: number; h: number; rx?: number }> = [
  // Center zones (top → bottom)
  { id: 'front-bumper',          x: 52, y: 16,  w: 146, h: 32,  rx: 16 },
  { id: 'hood',                  x: 52, y: 48,  w: 146, h: 103       },
  { id: 'windshield',            x: 56, y: 151, w: 138, h: 66        },
  { id: 'roof',                  x: 56, y: 217, w: 138, h: 96        },
  { id: 'rear-windshield',       x: 56, y: 313, w: 138, h: 66        },
  { id: 'trunk',                 x: 52, y: 379, w: 146, h: 88        },
  { id: 'rear-bumper',           x: 52, y: 467, w: 146, h: 30, rx: 15 },
  // Driver side (left)
  { id: 'driver-fender',         x: 28, y: 55,  w: 28,  h: 98        },
  { id: 'driver-door-front',     x: 28, y: 158, w: 28,  h: 95        },
  { id: 'driver-door-rear',      x: 28, y: 257, w: 28,  h: 95        },
  { id: 'driver-quarter',        x: 28, y: 356, w: 28,  h: 95        },
  { id: 'driver-mirror',         x: 8,  y: 160, w: 22,  h: 30, rx: 5  },
  // Passenger side (right)
  { id: 'passenger-fender',      x: 194, y: 55,  w: 28, h: 98        },
  { id: 'passenger-door-front',  x: 194, y: 158, w: 28, h: 95        },
  { id: 'passenger-door-rear',   x: 194, y: 257, w: 28, h: 95        },
  { id: 'passenger-quarter',     x: 194, y: 356, w: 28, h: 95        },
  { id: 'passenger-mirror',      x: 220, y: 160, w: 22, h: 30, rx: 5  },
];

// ─── Car SVG Diagram ──────────────────────────────────────────────────────────

function CarDiagram({
  damage,
  selectedZone,
  onZoneClick,
}: {
  damage: Record<string, ZoneDamage>;
  selectedZone: string | null;
  onZoneClick: (zoneId: string) => void;
}) {
  const getDamageColor = (zoneId: string): string | null => {
    const d = damage[zoneId];
    if (!d || d.types.length === 0) return null;
    return DAMAGE_ZONE_COLOR[d.types[0]];
  };

  // Proper sedan silhouette with wheel-arch cutouts
  const BODY = 'M 76,18 C 52,18 46,30 46,48 L 46,92 Q 18,104 18,125 Q 18,146 46,158 L 46,340 Q 18,352 18,373 Q 18,394 46,406 L 46,464 C 46,480 60,488 76,488 L 174,488 C 190,488 204,480 204,464 L 204,406 Q 232,394 232,373 Q 232,352 204,340 L 204,158 Q 232,146 232,125 Q 232,104 204,92 L 204,48 C 204,30 198,18 174,18 Z';

  return (
    <svg
      viewBox="0 0 250 510"
      className="w-full select-none"
      style={{ maxWidth: 210 }}
      aria-label="Vehicle diagram — click zones to mark damage"
    >
      <defs>
        <filter id="bodyShad" x="-10%" y="-2%" width="120%" height="106%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.13" />
        </filter>
      </defs>

      {/* ── TIRES ─────────────────────────────────────────────────────────── */}
      {([
        { x: 8,   y: 96,  w: 34, h: 58, cx: 25,  cy: 125 },
        { x: 208, y: 96,  w: 34, h: 58, cx: 225, cy: 125 },
        { x: 8,   y: 342, w: 34, h: 58, cx: 25,  cy: 371 },
        { x: 208, y: 342, w: 34, h: 58, cx: 225, cy: 371 },
      ] as const).map((t, i) => (
        <g key={`tire-${i}`}>
          <rect x={t.x} y={t.y} width={t.w} height={t.h} rx={10} fill="#1e293b" />
          <rect x={t.x + 2} y={t.y + 2} width={t.w - 4} height={t.h - 4} rx={8}
            fill="none" stroke="#334155" strokeWidth={1} />
          <rect x={t.cx - 10} y={t.y + 7} width={20} height={t.h - 14} rx={6}
            fill="#4b5563" stroke="#374151" strokeWidth={0.5} />
          <line x1={t.cx} y1={t.y + 9} x2={t.cx} y2={t.y + t.h - 9}
            stroke="#6b7280" strokeWidth={1.5} />
          <line x1={t.cx - 8} y1={t.cy} x2={t.cx + 8} y2={t.cy}
            stroke="#6b7280" strokeWidth={1.5} />
          <circle cx={t.cx} cy={t.cy} r={5} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.5} />
          <circle cx={t.cx} cy={t.cy} r={2.5} fill="#d1d5db" />
        </g>
      ))}

      {/* ── BODY SILHOUETTE ───────────────────────────────────────────────── */}
      <path d={BODY} className="fill-slate-100 dark:fill-slate-700" filter="url(#bodyShad)" />
      <path d={BODY} fill="none" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />

      {/* Wheel-arch inner rim lines (depth cue) */}
      {[
        'M 46,92 Q 18,104 18,125 Q 18,146 46,158',
        'M 204,92 Q 232,104 232,125 Q 232,146 204,158',
        'M 46,340 Q 18,352 18,373 Q 18,394 46,406',
        'M 204,340 Q 232,352 232,373 Q 232,394 204,406',
      ].map((d, i) => (
        <path key={`arch-${i}`} d={d} fill="none"
          className="stroke-slate-300 dark:stroke-slate-600" strokeWidth={2.5} />
      ))}

      {/* ── FRONT HEADLIGHTS ──────────────────────────────────────────────── */}
      <path d="M 46,22 L 46,52 L 78,52 L 82,42 L 82,22 Z"
        className="fill-amber-50 dark:fill-amber-900/30 stroke-amber-300 dark:stroke-amber-700" strokeWidth={0.75} />
      <line x1={48} y1={27} x2={80} y2={27} stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={60} cy={41} rx={10} ry={7.5}
        className="fill-white dark:fill-slate-200 stroke-amber-200 dark:stroke-amber-700" strokeWidth={0.75} />
      <ellipse cx={60} cy={41} rx={5.5} ry={4} fill="rgba(253,224,71,0.5)" />
      <rect x={70} y={37} width={9} height={5} rx={2} fill="rgba(251,191,36,0.45)" />

      <path d="M 204,22 L 204,52 L 172,52 L 168,42 L 168,22 Z"
        className="fill-amber-50 dark:fill-amber-900/30 stroke-amber-300 dark:stroke-amber-700" strokeWidth={0.75} />
      <line x1={202} y1={27} x2={170} y2={27} stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={190} cy={41} rx={10} ry={7.5}
        className="fill-white dark:fill-slate-200 stroke-amber-200 dark:stroke-amber-700" strokeWidth={0.75} />
      <ellipse cx={190} cy={41} rx={5.5} ry={4} fill="rgba(253,224,71,0.5)" />
      <rect x={171} y={37} width={9} height={5} rx={2} fill="rgba(251,191,36,0.45)" />

      {/* ── FRONT GRILLE ──────────────────────────────────────────────────── */}
      <rect x={84} y={24} width={82} height={28} rx={4}
        className="fill-slate-300 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500" strokeWidth={0.75} />
      {[31, 37, 43].map(y => (
        <line key={y} x1={86} y1={y} x2={164} y2={y}
          className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={0.6} />
      ))}
      <line x1={125} y1={24} x2={125} y2={52}
        className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={0.5} />
      <rect x={116} y={32} width={18} height={12} rx={2}
        className="fill-slate-400 dark:fill-slate-500" />
      <line x1={46} y1={52} x2={204} y2={52}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1} />

      {/* ── HOOD PANEL ────────────────────────────────────────────────────── */}
      <line x1={125} y1={56} x2={125} y2={146}
        className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={0.75} />
      <line x1={96}  y1={60} x2={96}  y2={144}
        className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={0.5} />
      <line x1={154} y1={60} x2={154} y2={144}
        className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={0.5} />
      <line x1={48} y1={151} x2={202} y2={151}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1} />

      {/* ── FRONT WINDSHIELD ──────────────────────────────────────────────── */}
      <polygon points="56,218 63,153 187,153 194,218"
        className="fill-sky-100 dark:fill-sky-900/40 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} />
      <line x1={72} y1={157} x2={63} y2={214}
        stroke="white" strokeWidth={2} strokeOpacity="0.45" strokeLinecap="round" />
      <line x1={80} y1={216} x2={150} y2={216}
        className="stroke-slate-400 dark:stroke-slate-500" strokeWidth={0.75} strokeDasharray="3 2" />

      {/* ── ROOF / CABIN ──────────────────────────────────────────────────── */}
      <rect x={46} y={220} width={12} height={88} rx={1}
        className="fill-sky-100 dark:fill-sky-900/40 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.5} />
      <rect x={192} y={220} width={12} height={88} rx={1}
        className="fill-sky-100 dark:fill-sky-900/40 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.5} />
      <rect x={58} y={218} width={134} height={92} rx={4}
        className="fill-slate-300 dark:fill-slate-500" />
      <rect x={78} y={228} width={94} height={66} rx={7}
        className="fill-slate-200 dark:fill-slate-600 stroke-slate-400 dark:stroke-slate-500" strokeWidth={0.75} />
      <rect x={80} y={230} width={90} height={62} rx={6}
        className="fill-sky-100 dark:fill-sky-800/50" />
      <line x1={87} y1={233} x2={81} y2={289}
        stroke="white" strokeWidth={1.5} strokeOpacity="0.3" strokeLinecap="round" />
      {/* A-pillars */}
      <rect x={54} y={216} width={6} height={6} rx={1} className="fill-slate-400 dark:fill-slate-500" />
      <rect x={190} y={216} width={6} height={6} rx={1} className="fill-slate-400 dark:fill-slate-500" />
      {/* B-pillars */}
      <rect x={54} y={251} width={5} height={22} rx={1} className="fill-slate-400 dark:fill-slate-500" />
      <rect x={191} y={251} width={5} height={22} rx={1} className="fill-slate-400 dark:fill-slate-500" />
      {/* C-pillars */}
      <rect x={54} y={308} width={6} height={6} rx={1} className="fill-slate-400 dark:fill-slate-500" />
      <rect x={190} y={308} width={6} height={6} rx={1} className="fill-slate-400 dark:fill-slate-500" />

      {/* ── DOOR DETAILS ──────────────────────────────────────────────────── */}
      <line x1={46} y1={259} x2={58} y2={259}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
      <line x1={192} y1={259} x2={204} y2={259}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1.5} />
      {/* Door handles */}
      {[228, 274].map(y => (
        <g key={`dh-${y}`}>
          <rect x={47} y={y} width={7} height={13} rx={2}
            className="fill-slate-300 dark:fill-slate-500 stroke-slate-400 dark:stroke-slate-400" strokeWidth={0.5} />
          <rect x={196} y={y} width={7} height={13} rx={2}
            className="fill-slate-300 dark:fill-slate-500 stroke-slate-400 dark:stroke-slate-400" strokeWidth={0.5} />
        </g>
      ))}

      {/* ── REAR WINDSHIELD ───────────────────────────────────────────────── */}
      <line x1={48} y1={310} x2={202} y2={310}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1} />
      <polygon points="56,310 63,378 187,378 194,310"
        className="fill-sky-100 dark:fill-sky-900/40 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} />
      {[323, 333, 343, 353, 363].map(y => (
        <line key={y} x1={69} y1={y} x2={181} y2={y}
          className="stroke-sky-200 dark:stroke-sky-700" strokeWidth={0.55} />
      ))}
      <line x1={178} y1={314} x2={185} y2={373}
        stroke="white" strokeWidth={1.5} strokeOpacity="0.3" strokeLinecap="round" />
      <line x1={48} y1={378} x2={202} y2={378}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={1} />

      {/* ── TRUNK PANEL ───────────────────────────────────────────────────── */}
      <line x1={100} y1={382} x2={100} y2={458}
        className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={0.5} />
      <line x1={150} y1={382} x2={150} y2={458}
        className="stroke-slate-200 dark:stroke-slate-600" strokeWidth={0.5} />
      <line x1={70} y1={458} x2={180} y2={458}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} strokeDasharray="4 2.5" />
      <rect x={101} y={465} width={48} height={14} rx={2}
        className="fill-slate-200 dark:fill-slate-600 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} />
      <line x1={125} y1={465} x2={125} y2={479}
        className="stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.5} />

      {/* ── REAR TAILLIGHTS ───────────────────────────────────────────────── */}
      <path d="M 46,458 L 46,486 L 78,486 L 82,476 L 82,458 Z"
        className="fill-red-50 dark:fill-red-900/30 stroke-red-400 dark:stroke-red-700" strokeWidth={0.75} />
      <line x1={48} y1={464} x2={80} y2={464} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={60} cy={476} rx={10} ry={6}
        className="fill-red-300 dark:fill-red-500/60 stroke-red-400 dark:stroke-red-600" strokeWidth={0.5} />
      <ellipse cx={60} cy={476} rx={4.5} ry={2.5} fill="rgba(239,68,68,0.85)" />

      <path d="M 204,458 L 204,486 L 172,486 L 168,476 L 168,458 Z"
        className="fill-red-50 dark:fill-red-900/30 stroke-red-400 dark:stroke-red-700" strokeWidth={0.75} />
      <line x1={202} y1={464} x2={170} y2={464} stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" />
      <ellipse cx={190} cy={476} rx={10} ry={6}
        className="fill-red-300 dark:fill-red-500/60 stroke-red-400 dark:stroke-red-600" strokeWidth={0.5} />
      <ellipse cx={190} cy={476} rx={4.5} ry={2.5} fill="rgba(239,68,68,0.85)" />

      {/* ── SIDE MIRRORS ──────────────────────────────────────────────────── */}
      <path d="M 46,162 L 10,168 Q 7,176 10,184 L 46,188 Z"
        className="fill-slate-200 dark:fill-slate-600 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} />
      <path d="M 46,164 L 12,170 Q 10,176 12,183 L 46,186 Z"
        className="fill-sky-100 dark:fill-slate-500" />
      <path d="M 204,162 L 240,168 Q 243,176 240,184 L 204,188 Z"
        className="fill-slate-200 dark:fill-slate-600 stroke-slate-300 dark:stroke-slate-500" strokeWidth={0.75} />
      <path d="M 204,164 L 238,170 Q 240,176 238,183 L 204,186 Z"
        className="fill-sky-100 dark:fill-slate-500" />

      {/* ── CLICKABLE DAMAGE OVERLAY ZONES ───────────────────────────────── */}
      {SVG_ZONES.map(zone => {
        const dmgColor = getDamageColor(zone.id);
        const isSelected = selectedZone === zone.id;
        const hasDamage = !!damage[zone.id]?.types.length;
        return (
          <g key={zone.id} onClick={() => onZoneClick(zone.id)} style={{ cursor: 'pointer' }}>
            <rect
              x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx={zone.rx ?? 2}
              fill={dmgColor ?? (isSelected ? 'rgba(59,130,246,0.18)' : 'transparent')}
              stroke={isSelected ? 'rgb(59,130,246)' : hasDamage ? 'rgba(239,68,68,0.7)' : 'transparent'}
              strokeWidth={isSelected ? 2 : 1.5}
              strokeDasharray={hasDamage && !isSelected ? '3 2' : undefined}
            />
            {/* Hover area (slightly larger invisible rect for touch) */}
            <rect
              x={zone.x - 2} y={zone.y - 2} width={zone.w + 4} height={zone.h + 4} rx={(zone.rx ?? 2) + 2}
              fill="transparent"
            />
          </g>
        );
      })}

      {/* Damage count badges */}
      {SVG_ZONES.map(zone => {
        const d = damage[zone.id];
        if (!d?.types.length) return null;
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;
        return (
          <g key={`badge-${zone.id}`} style={{ pointerEvents: 'none' }}>
            <circle cx={cx} cy={cy} r={10} fill="rgb(239,68,68)" />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={10}
              fill="white" fontWeight="bold" fontFamily="system-ui">
              {d.types.length}
            </text>
          </g>
        );
      })}

      {/* Labels: DRIVER / PASSENGER */}
      <text x={18} y={258} textAnchor="middle" fontSize={7} fontWeight="600"
        className="fill-slate-400 dark:fill-slate-500" fontFamily="system-ui"
        transform="rotate(-90, 18, 258)">DRIVER</text>
      <text x={232} y={258} textAnchor="middle" fontSize={7} fontWeight="600"
        className="fill-slate-400 dark:fill-slate-500" fontFamily="system-ui"
        transform="rotate(90, 232, 258)">PASS.</text>
    </svg>
  );
}

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignaturePad({
  isSigned,
  onSigned,
  onClear,
}: { isSigned: boolean; onSigned: () => void; onClear: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    onSigned();
  }, [onSigned]);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
          aria-label="Signature pad — draw your signature"
        />
        {!isSigned && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
              <PenLine className="size-6" />
              <span className="text-sm">Sign here</span>
            </div>
          </div>
        )}
        {/* Baseline */}
        <div className="absolute bottom-10 left-6 right-6 h-px bg-border pointer-events-none" />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {isSigned ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" /> Signature captured
            </span>
          ) : (
            'Draw signature above'
          )}
        </p>
        {isSigned && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="size-3.5" /> Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Photo Capture Zone ───────────────────────────────────────────────────────

const PHOTO_COLORS = [
  'from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600',
  'from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
  'from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40',
];

function PhotoCapture({
  zoneId,
  zoneLabel,
  count,
  onAdd,
  onRemove,
}: { zoneId: string; zoneLabel: string; count: number; onAdd: () => void; onRemove: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Photos</span>
        {count > 0 && (
          <button onClick={onRemove} className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors">
            Remove last
          </button>
        )}
      </div>
      <div className="flex items-start gap-2 flex-wrap">
        {/* Existing mock photos */}
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${PHOTO_COLORS[i % PHOTO_COLORS.length]} flex flex-col items-center justify-center border border-border`}
          >
            <Camera className="size-5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight px-1 truncate w-full text-center">
              {zoneLabel}
            </span>
            <div className="absolute -top-1 -right-1 size-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check className="size-2.5 text-white" />
            </div>
          </motion.div>
        ))}

        {/* Add photo button */}
        {count < 4 && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAdd}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-border hover:border-blue-400 bg-muted/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex flex-col items-center justify-center gap-1 transition-all text-muted-foreground hover:text-blue-600"
          >
            <Camera className="size-5" />
            <span className="text-[9px] font-medium">Capture</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────

// Step 1: Vehicle Confirm
function StepVehicle({
  ro,
  data,
  role,
  onChange,
}: { ro: (typeof REPAIR_ORDERS)[0]; data: WalkaroundData; role: Role; onChange: (d: Partial<WalkaroundData>) => void }) {
  const isTech = role === 'technician';
  return (
    <div className="space-y-5">
      {!isTech && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-0.5">Advisor-led Walkaround</p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
            Walk around the vehicle with the customer and document pre-existing conditions before service begins.
          </p>
        </div>
      )}

      {/* Vehicle card */}
      <div className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shrink-0">
            <Car className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">{ro.vehicle}</p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <Hash className="size-3" />
              <span className="font-mono">{ro.roNumber}</span>
              <span className="text-muted-foreground/40">·</span>
              <User className="size-3" />
              <span>{ro.customerName}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {[
            { label: 'Advisor',  value: ro.advisorName, Icon: User },
            { label: 'Phone',    value: ro.customerPhone, Icon: Phone },
            { label: 'Time In',  value: ro.timeIn, Icon: Clock },
            { label: 'Promise',  value: ro.promisedTime, Icon: Flag },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="bg-background rounded-xl p-2.5 border border-border/60">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="size-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-xs font-medium text-foreground">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mileage input */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Odometer Reading <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Gauge className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            inputMode="numeric"
            value={data.mileageIn}
            onChange={e => onChange({ mileageIn: e.target.value })}
            placeholder={ro.mileageIn}
            className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all
                       placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <ScanLine className="size-3.5" />
          {isTech ? 'Confirm current odometer reading' : 'Enter the mileage shown on the dashboard'}
        </p>
      </div>

      {/* Odometer photo capture */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Odometer Photo</p>
        <PhotoCapture
          zoneId="odometer"
          zoneLabel="Odometer"
          count={data.zoneDamage['odometer']?.photoCount ?? 0}
          onAdd={() => onChange({
            zoneDamage: { ...data.zoneDamage, odometer: { types: [], note: '', photoCount: (data.zoneDamage['odometer']?.photoCount ?? 0) + 1 } },
          })}
          onRemove={() => onChange({
            zoneDamage: { ...data.zoneDamage, odometer: { types: [], note: '', photoCount: Math.max(0, (data.zoneDamage['odometer']?.photoCount ?? 1) - 1) } },
          })}
        />
      </div>
    </div>
  );
}

// Step 2: Warning Lights
function StepWarningLights({
  data,
  onChange,
}: { data: WalkaroundData; onChange: (d: Partial<WalkaroundData>) => void }) {
  const toggle = (id: string) => {
    const lights = data.warningLights.includes(id)
      ? data.warningLights.filter(l => l !== id)
      : [...data.warningLights, id];
    onChange({ warningLights: lights });
  };

  const noneObserved = data.warningLights.length === 0;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tap any warning lights currently illuminated on the dashboard. Select all that apply.
      </p>

      {/* None observed toggle */}
      <button
        onClick={() => onChange({ warningLights: [] })}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
          noneObserved
            ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'border-border bg-muted/20 text-muted-foreground hover:border-emerald-300'
        }`}
      >
        {noneObserved ? <CheckCircle2 className="size-5 shrink-0" /> : <Square className="size-5 shrink-0" />}
        <span className="text-sm font-semibold">No warning lights observed</span>
      </button>

      {/* Warning light grid */}
      <div className="grid grid-cols-3 gap-2">
        {WARNING_LIGHTS.map(light => {
          const isActive = data.warningLights.includes(light.id);
          const style = SEVERITY_STYLE[light.severity];
          const Icon = light.Icon;
          return (
            <motion.button
              key={light.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(light.id)}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all min-h-[76px] justify-center
                ${isActive
                  ? `${style.bg} border-current ${style.text} ring-2 ${style.ring} ring-offset-1`
                  : 'bg-muted/20 border-border text-muted-foreground hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
              <Icon className={`size-5 shrink-0 ${isActive ? '' : 'text-muted-foreground'}`} />
              <span className="text-[10px] font-semibold text-center leading-tight">{light.label}</span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 size-4 bg-current rounded-full flex items-center justify-center"
                >
                  <Check className="size-2.5 text-white" style={{ color: 'white' }} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {data.warningLights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30"
        >
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            {data.warningLights.length} light{data.warningLights.length !== 1 ? 's' : ''} flagged
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.warningLights.map(id => {
              const light = WARNING_LIGHTS.find(l => l.id === id)!;
              return (
                <span key={id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${SEVERITY_STYLE[light.severity].bg} ${SEVERITY_STYLE[light.severity].text}`}>
                  {light.label}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Step 3: Fuel Level
function StepFuel({
  data,
  onChange,
}: { data: WalkaroundData; onChange: (d: Partial<WalkaroundData>) => void }) {
  const levels: FuelLevel[] = [0, 1, 2, 3, 4];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Record the current fuel level for documentation and any related service recommendations.
      </p>

      {/* Visual fuel gauge */}
      <div className="p-5 rounded-2xl border border-border bg-muted/10">
        {/* Gauge label */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Fuel className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">Fuel Level</span>
          </div>
          <span className={`text-sm font-bold ${
            data.fuelLevel === 0 ? 'text-red-600' :
            data.fuelLevel === 1 ? 'text-orange-500' :
            data.fuelLevel === 2 ? 'text-amber-500' :
            'text-emerald-600 dark:text-emerald-400'
          }`}>{FUEL_LABELS[data.fuelLevel]}</span>
        </div>

        {/* Gauge bar */}
        <div className="relative h-8 bg-muted rounded-xl overflow-hidden mb-4">
          <motion.div
            animate={{ width: `${(data.fuelLevel / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className={`h-full rounded-xl ${FUEL_COLORS[data.fuelLevel]} transition-colors`}
          />
          {/* Tick marks */}
          {[1, 2, 3].map(tick => (
            <div key={tick} className="absolute top-0 bottom-0 w-px bg-background/60" style={{ left: `${tick * 25}%` }} />
          ))}
          {/* E / F labels */}
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-background/80">E</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-background/80">F</span>
        </div>

        {/* Segment buttons */}
        <div className="grid grid-cols-5 gap-1.5">
          {levels.map(level => (
            <motion.button
              key={level}
              whileTap={{ scale: 0.94 }}
              onClick={() => onChange({ fuelLevel: level })}
              className={`py-3 rounded-xl text-xs font-bold transition-all border-2
                ${data.fuelLevel === level
                  ? `${FUEL_COLORS[level]} text-white border-transparent shadow-md`
                  : 'bg-muted/40 text-muted-foreground border-border hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
              {level === 0 ? 'E' : level === 4 ? 'F' : `${level}/4`}
            </motion.button>
          ))}
        </div>
      </div>

      {data.fuelLevel <= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-3.5 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30"
        >
          <AlertTriangle className="size-4 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400">Low Fuel</p>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/70 mt-0.5">
              Customer notified. Recommend adding fuel before road testing.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Step 4: Exterior Damage
function StepExterior({
  data,
  onChange,
  selectedZone,
  onSelectZone,
}: {
  data: WalkaroundData;
  onChange: (d: Partial<WalkaroundData>) => void;
  selectedZone: string | null;
  onSelectZone: (id: string | null) => void;
}) {
  const zone = selectedZone ? VEHICLE_ZONES.find(z => z.id === selectedZone) : null;
  const zoneDmg = selectedZone ? (data.zoneDamage[selectedZone] ?? { types: [], note: '', photoCount: 0 }) : null;

  const updateZone = (update: Partial<ZoneDamage>) => {
    if (!selectedZone) return;
    onChange({
      zoneDamage: {
        ...data.zoneDamage,
        [selectedZone]: { ...zoneDmg!, ...update },
      },
    });
  };

  const toggleDamageType = (type: DamageType) => {
    if (!zoneDmg) return;
    const types = zoneDmg.types.includes(type)
      ? zoneDmg.types.filter(t => t !== type)
      : [...zoneDmg.types, type];
    updateZone({ types });
  };

  const damagedZones = VEHICLE_ZONES.filter(z => data.zoneDamage[z.id]?.types.length);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Tap zones on the diagram to mark pre-existing damage. Document all conditions before service.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Zone list (mobile) / Diagram control */}
        <div className="space-y-3">
          {/* Zone group selector */}
          {(['front', 'driver', 'center', 'passenger', 'rear'] as const).map(group => {
            const groupZones = VEHICLE_ZONES.filter(z => z.group === group);
            const groupLabel: Record<string, string> = {
              front: 'Front', driver: 'Driver Side', center: 'Center', passenger: 'Passenger Side', rear: 'Rear',
            };
            return (
              <div key={group}>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{groupLabel[group]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {groupZones.map(z => {
                    const hasDmg = !!data.zoneDamage[z.id]?.types.length;
                    const isSelected = selectedZone === z.id;
                    return (
                      <button
                        key={z.id}
                        onClick={() => onSelectZone(isSelected ? null : z.id)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all font-medium
                          ${isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : hasDmg
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                              : 'bg-muted/40 border-border text-muted-foreground hover:border-blue-300 hover:text-blue-600'
                          }`}
                      >
                        {hasDmg && !isSelected && <span className="mr-1">⚠</span>}
                        {z.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Zone detail panel */}
        <div>
          <AnimatePresence mode="wait">
            {!selectedZone ? (
              <motion.div
                key="no-zone"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3 text-center p-6 rounded-2xl border-2 border-dashed border-border bg-muted/10"
              >
                <Car className="size-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Select a zone</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">Tap a button or click the diagram</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={selectedZone}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="p-4 rounded-2xl border border-border bg-background space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{zone?.label}</p>
                    <p className="text-xs text-muted-foreground">Mark pre-existing damage</p>
                  </div>
                  <button
                    onClick={() => onSelectZone(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Damage types */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Damage Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DAMAGE_TYPES.map(dt => {
                      const isActive = zoneDmg?.types.includes(dt.id);
                      return (
                        <motion.button
                          key={dt.id}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => toggleDamageType(dt.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                            ${isActive ? dt.activeColor : dt.color}`}
                        >
                          {dt.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Note</p>
                  <textarea
                    value={zoneDmg?.note ?? ''}
                    onChange={e => updateZone({ note: e.target.value })}
                    placeholder="Describe the damage location and severity…"
                    rows={2}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-muted/40 text-foreground
                               focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all
                               placeholder:text-muted-foreground resize-none"
                  />
                </div>

                {/* Photos */}
                <PhotoCapture
                  zoneId={selectedZone}
                  zoneLabel={zone?.label ?? selectedZone}
                  count={zoneDmg?.photoCount ?? 0}
                  onAdd={() => updateZone({ photoCount: (zoneDmg?.photoCount ?? 0) + 1 })}
                  onRemove={() => updateZone({ photoCount: Math.max(0, (zoneDmg?.photoCount ?? 1) - 1) })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Damage summary */}
      {damagedZones.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 rounded-xl border border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/10"
        >
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">
            {damagedZones.length} zone{damagedZones.length !== 1 ? 's' : ''} with pre-existing damage
          </p>
          <div className="flex flex-wrap gap-1.5">
            {damagedZones.map(z => (
              <button
                key={z.id}
                onClick={() => onSelectZone(z.id)}
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
              >
                {z.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Step 5: Customer Concerns
function StepConcerns({
  data,
  onChange,
}: { data: WalkaroundData; onChange: (d: Partial<WalkaroundData>) => void }) {
  const [newConcern, setNewConcern] = useState('');

  const addConcern = () => {
    if (!newConcern.trim()) return;
    onChange({
      concerns: [
        ...data.concerns,
        { id: `c-${Date.now()}`, text: newConcern.trim(), priority: 'medium' },
      ],
    });
    setNewConcern('');
  };

  const updatePriority = (id: string, priority: Concern['priority']) => {
    onChange({ concerns: data.concerns.map(c => c.id === id ? { ...c, priority } : c) });
  };

  const removeConcern = (id: string) => {
    onChange({ concerns: data.concerns.filter(c => c.id !== id) });
  };

  const PRIORITY_STYLES: Record<Concern['priority'], string> = {
    low:    'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    medium: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    high:   'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
  };

  return (
    <div className="space-y-5">
      {/* Customer concerns */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-foreground">Customer Concerns</p>
            <p className="text-xs text-muted-foreground mt-0.5">Document what the customer says about the vehicle</p>
          </div>
        </div>

        {/* Existing concerns */}
        <AnimatePresence>
          {data.concerns.length > 0 && (
            <div className="space-y-2 mb-3">
              {data.concerns.map((concern, i) => (
                <motion.div
                  key={concern.id}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                  className="flex items-start gap-2.5 p-3 bg-muted/30 border border-border/60 rounded-xl"
                >
                  <div className="flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="flex-1 text-sm text-foreground">{concern.text}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => updatePriority(concern.id, p)}
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold capitalize transition-all
                          ${concern.priority === p ? PRIORITY_STYLES[p] : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => removeConcern(concern.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Add concern */}
        <div className="flex items-start gap-2">
          <textarea
            value={newConcern}
            onChange={e => setNewConcern(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addConcern(); } }}
            placeholder={`"Customer states vehicle pulls to the right…"`}
            rows={2}
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground
                       focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all
                       placeholder:text-muted-foreground resize-none"
          />
          <button
            onClick={addConcern}
            disabled={!newConcern.trim()}
            className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Internal notes */}
      <div>
        <p className="text-sm font-bold text-foreground mb-1">Internal Notes</p>
        <p className="text-xs text-muted-foreground mb-2">Not visible to the customer</p>
        <textarea
          value={data.internalNotes}
          onChange={e => onChange({ internalNotes: e.target.value })}
          placeholder="Additional observations, service recommendations, or handoff notes…"
          rows={3}
          className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-muted/40 text-foreground
                     focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all
                     placeholder:text-muted-foreground resize-none"
        />
      </div>

      {/* AI suggestion */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-800/30"
      >
        <Sparkles className="size-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">AI Suggest</p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-0.5">
            Based on mileage and customer concerns, consider recommending a brake fluid test and cabin air filter inspection.
          </p>
          <button className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Add to concerns →
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Step 6: Signature
function StepSignature({
  ro,
  data,
  onChange,
}: { ro: (typeof REPAIR_ORDERS)[0]; data: WalkaroundData; onChange: (d: Partial<WalkaroundData>) => void }) {
  return (
    <div className="space-y-5">
      {/* Summary of what they're signing */}
      <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acknowledgment Summary</p>
        <div className="space-y-2">
          {[
            { label: 'Odometer at check-in', value: data.mileageIn || 'Not recorded' },
            { label: 'Warning lights observed', value: data.warningLights.length > 0 ? `${data.warningLights.length} light(s) flagged` : 'None' },
            { label: 'Fuel level', value: FUEL_LABELS[data.fuelLevel] },
            { label: 'Pre-existing damage zones', value: Object.values(data.zoneDamage).filter(d => d.types.length > 0).length.toString() || '0' },
            { label: 'Customer concerns', value: `${data.concerns.length} concern(s)` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-semibold text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acknowledgment text */}
      <div className="p-4 rounded-2xl border border-border bg-background">
        <p className="text-sm text-foreground leading-relaxed">
          I, <strong>{ro.customerName}</strong>, acknowledge that the above vehicle condition, including any pre-existing
          damage and warning lights, has been documented at the time of check-in for repair order{' '}
          <strong>{ro.roNumber}</strong>. I authorize the dealership to perform the requested services.
        </p>
      </div>

      {/* Signature pad */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Customer Signature</p>
        <SignaturePad
          isSigned={data.isSigned}
          onSigned={() => onChange({ isSigned: true })}
          onClear={() => onChange({ isSigned: false })}
        />
      </div>

      {/* Checkbox */}
      <button
        onClick={() => onChange({ isSigned: !data.isSigned })}
        className="flex items-start gap-3 w-full text-left"
      >
        <div className={`size-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
          ${data.isSigned ? 'bg-blue-600 border-blue-600' : 'border-border bg-background'}`}>
          {data.isSigned && <Check className="size-3.5 text-white" />}
        </div>
        <p className="text-sm text-foreground">
          Customer has reviewed and acknowledges the documented vehicle condition.
        </p>
      </button>
    </div>
  );
}

// Step 7: Summary
function StepSummary({
  ro,
  data,
  role,
  onOpenRO,
}: { ro: (typeof REPAIR_ORDERS)[0]; data: WalkaroundData; role: Role; onOpenRO: () => void }) {
  const damagedZones = VEHICLE_ZONES.filter(z => data.zoneDamage[z.id]?.types.length);
  const totalPhotos = Object.values(data.zoneDamage).reduce((s, d) => s + (d.photoCount ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Completion header */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="flex flex-col items-center text-center gap-3 py-4"
      >
        <div className="size-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
          <BadgeCheck className="size-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">Walkaround Complete</p>
          <p className="text-sm text-muted-foreground mt-0.5">All conditions documented and ready for handoff</p>
        </div>
      </motion.div>

      {/* Summary card */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Walkaround Summary</span>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="divide-y divide-border/60">
          {[
            {
              label: 'Vehicle',
              value: ro.vehicle,
              sub: `${ro.roNumber} · ${ro.customerName}`,
              Icon: Car,
              color: 'text-blue-500',
            },
            {
              label: 'Mileage In',
              value: data.mileageIn || ro.mileageIn,
              Icon: Gauge,
              color: 'text-slate-500',
            },
            {
              label: 'Fuel Level',
              value: FUEL_LABELS[data.fuelLevel],
              Icon: Fuel,
              color: data.fuelLevel <= 1 ? 'text-red-500' : 'text-emerald-500',
            },
            {
              label: 'Warning Lights',
              value: data.warningLights.length > 0 ? `${data.warningLights.length} flagged` : 'None observed',
              Icon: AlertTriangle,
              color: data.warningLights.length > 0 ? 'text-amber-500' : 'text-emerald-500',
            },
            {
              label: 'Pre-existing Damage',
              value: damagedZones.length > 0 ? `${damagedZones.length} zone(s) documented` : 'No damage noted',
              Icon: Shield,
              color: damagedZones.length > 0 ? 'text-orange-500' : 'text-emerald-500',
            },
            {
              label: 'Photos Captured',
              value: `${totalPhotos} photo${totalPhotos !== 1 ? 's' : ''}`,
              Icon: Camera,
              color: 'text-blue-500',
            },
            {
              label: 'Customer Concerns',
              value: `${data.concerns.length} concern${data.concerns.length !== 1 ? 's' : ''} logged`,
              Icon: Clipboard,
              color: 'text-violet-500',
            },
            ...(role !== 'technician' ? [{
              label: 'Signature',
              value: data.isSigned ? 'Customer signed' : 'Not signed',
              Icon: PenLine,
              color: data.isSigned ? 'text-emerald-500' : 'text-muted-foreground',
            }] : []),
          ].map(({ label, value, sub, Icon, color }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3">
              <Icon className={`size-4 shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
              </div>
              <p className="text-sm font-semibold text-foreground text-right">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline event preview */}
      <div className="p-3.5 rounded-xl bg-muted/20 border border-border">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Timeline Event</p>
        <div className="flex items-start gap-3">
          <div className="size-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <Wrench className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Walkaround completed at check-in</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {role === 'advisor' ? `${ro.advisorName} · ` : `${ro.techName} · `}
              {ro.roNumber} · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {data.warningLights.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold">
                  {data.warningLights.length} Warning Light{data.warningLights.length !== 1 ? 's' : ''}
                </span>
              )}
              {damagedZones.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold">
                  {damagedZones.length} Damage Zone{damagedZones.length !== 1 ? 's' : ''}
                </span>
              )}
              {totalPhotos > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold">
                  {totalPhotos} Photo{totalPhotos !== 1 ? 's' : ''}
                </span>
              )}
              {data.isSigned && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-semibold">
                  Signed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Open RO', Icon: ArrowRight, primary: true },
          { label: 'Print', Icon: Printer, primary: false },
          { label: 'Send to Customer', Icon: Send, primary: false },
        ].map(({ label, Icon, primary }) => (
          <button
            key={label}
            onClick={primary ? onOpenRO : undefined}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all text-sm font-medium
              ${primary
                ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/20 col-span-3'
                : 'bg-muted/40 text-muted-foreground border-border hover:border-blue-300 hover:text-blue-600'
              }`}
          >
            {primary ? (
              <div className="flex items-center gap-2">
                <Icon className="size-4" />
                <span>Open RO Workspace</span>
              </div>
            ) : (
              <>
                <Icon className="size-4" />
                <span className="text-xs">{label}</span>
              </>
            )}
          </button>
        ))}
        <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:border-blue-300 hover:text-blue-600 transition-all">
          <Printer className="size-4" />
          <span className="text-xs">Print</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:border-blue-300 hover:text-blue-600 transition-all">
          <Send className="size-4" />
          <span className="text-xs">Send to Customer</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ADVISOR_STEPS = [
  { id: 'vehicle',        label: 'Vehicle',         Icon: Car          },
  { id: 'warning-lights', label: 'Warning Lights',  Icon: AlertTriangle },
  { id: 'fuel',           label: 'Fuel Level',      Icon: Fuel         },
  { id: 'exterior',       label: 'Exterior',        Icon: Shield       },
  { id: 'concerns',       label: 'Concerns',        Icon: Clipboard    },
  { id: 'signature',      label: 'Signature',       Icon: PenLine      },
  { id: 'summary',        label: 'Summary',         Icon: CheckCircle2 },
];

const TECH_STEPS = [
  { id: 'vehicle',        label: 'Vehicle',         Icon: Car          },
  { id: 'warning-lights', label: 'Warning Lights',  Icon: AlertTriangle },
  { id: 'fuel',           label: 'Fuel',            Icon: Fuel         },
  { id: 'exterior',       label: 'Exterior',        Icon: Shield       },
  { id: 'concerns',       label: 'Notes',           Icon: Clipboard    },
  { id: 'summary',        label: 'Done',            Icon: CheckCircle2 },
];

export function WalkaroundPage({ role, onNavigate }: { role: Role; onNavigate?: (nav: string) => void }) {
  const isTech = role === 'technician';
  const steps = isTech ? TECH_STEPS : ADVISOR_STEPS;
  const ro = REPAIR_ORDERS.find(r => r.status === 'write-up') ?? REPAIR_ORDERS[0];

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [diagramExpanded, setDiagramExpanded] = useState(false);
  const [data, setData] = useState<WalkaroundData>({
    mileageIn: '',
    fuelLevel: 2,
    warningLights: [],
    zoneDamage: {},
    concerns: [],
    internalNotes: '',
    isSigned: false,
  });

  const updateData = useCallback((update: Partial<WalkaroundData>) => {
    setData(prev => ({ ...prev, ...update }));
  }, []);

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(s => s + 1);
      setSelectedZone(null);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(s => s - 1);
      setSelectedZone(null);
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isSummary = steps[currentStep].id === 'summary';
  const stepId = steps[currentStep].id;

  // Completion % for header bar
  const completionPct = Math.round((currentStep / (steps.length - 1)) * 100);

  // Damage count for header badge
  const damagedCount = Object.values(data.zoneDamage).filter(d => d.types.length > 0).length;
  const totalPhotos = Object.values(data.zoneDamage).reduce((s, d) => s + (d.photoCount ?? 0), 0);

  const stepVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">

      {/* ── Sticky Header ────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
        {/* Title row */}
        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
          <div className="size-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Car className="size-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Walkaround Capture</span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs font-mono text-muted-foreground">{ro.roNumber}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${
                isTech
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}>
                {isTech ? 'Tech Mode' : 'Advisor Mode'}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground">{ro.vehicle}</p>
          </div>
          {/* Live stat badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {damagedCount > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold">
                {damagedCount} zone{damagedCount !== 1 ? 's' : ''}
              </span>
            )}
            {totalPhotos > 0 && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold">
                {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-muted mx-5 rounded-full overflow-hidden mb-3">
          <motion.div
            animate={{ width: `${completionPct}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-blue-600 rounded-full"
          />
        </div>

        {/* Step pills */}
        <div className="flex items-center gap-1 px-5 pb-3 overflow-x-auto scrollbar-none">
          {steps.map((step, i) => {
            const isDone = i < currentStep;
            const isCurrent = i === currentStep;
            const Icon = step.Icon;
            return (
              <button
                key={step.id}
                onClick={() => { if (isDone) { setDirection(i < currentStep ? -1 : 1); setCurrentStep(i); } }}
                disabled={i > currentStep}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0
                  ${isCurrent
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isDone
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-pointer'
                      : 'bg-muted/40 text-muted-foreground/60 cursor-not-allowed'
                  }`}
              >
                {isDone ? <Check className="size-3" /> : <Icon className="size-3" />}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">

        {/* ── Left: step content ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full">
            {/* Step header */}
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2 mb-0.5">
                {(() => {
                  const Icon = steps[currentStep].Icon;
                  return <Icon className="size-4 text-blue-600" />;
                })()}
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h2 className="text-foreground">{steps[currentStep].label}</h2>
            </div>

            {/* Animated step content */}
            <div className="px-5 pb-8">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={stepId}
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  {stepId === 'vehicle' && (
                    <StepVehicle ro={ro} data={data} role={role} onChange={updateData} />
                  )}
                  {stepId === 'warning-lights' && (
                    <StepWarningLights data={data} onChange={updateData} />
                  )}
                  {stepId === 'fuel' && (
                    <StepFuel data={data} onChange={updateData} />
                  )}
                  {stepId === 'exterior' && (
                    <StepExterior
                      data={data}
                      onChange={updateData}
                      selectedZone={selectedZone}
                      onSelectZone={setSelectedZone}
                    />
                  )}
                  {stepId === 'concerns' && (
                    <StepConcerns data={data} onChange={updateData} />
                  )}
                  {stepId === 'signature' && (
                    <StepSignature ro={ro} data={data} onChange={updateData} />
                  )}
                  {stepId === 'summary' && (
                    <StepSummary
                      ro={ro}
                      data={data}
                      role={role}
                      onOpenRO={() => onNavigate?.('ros')}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── Right: sticky car diagram (md+) ──────────────────────────────── */}
        {!isTech && (
          <div className="hidden xl:flex w-[280px] shrink-0 flex-col border-l border-border bg-muted/5">
            <div className="p-4 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Vehicle Diagram</p>
              <p className="text-xs text-muted-foreground mt-0.5">Click zones to mark damage</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-center">
                <CarDiagram
                  damage={data.zoneDamage}
                  selectedZone={selectedZone}
                  onZoneClick={id => {
                    setCurrentStep(steps.findIndex(s => s.id === 'exterior'));
                    setSelectedZone(prev => prev === id ? null : id);
                  }}
                />
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Damage Legend</p>
                {DAMAGE_TYPES.map(dt => (
                  <div key={dt.id} className="flex items-center gap-2">
                    <div className="size-3 rounded-full shrink-0" style={{ background: DAMAGE_ZONE_COLOR[dt.id] }} />
                    <span className="text-xs text-muted-foreground">{dt.label}</span>
                  </div>
                ))}
              </div>

              {/* Damage summary */}
              {Object.entries(data.zoneDamage).some(([, d]) => d.types.length > 0) && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Documented</p>
                  {Object.entries(data.zoneDamage)
                    .filter(([, d]) => d.types.length > 0)
                    .map(([zoneId, d]) => {
                      const zone = VEHICLE_ZONES.find(z => z.id === zoneId);
                      return (
                        <button
                          key={zoneId}
                          onClick={() => { setCurrentStep(steps.findIndex(s => s.id === 'exterior')); setSelectedZone(zoneId); }}
                          className="w-full text-left p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">{zone?.label}</p>
                          <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">
                            {d.types.join(', ')}
                            {d.photoCount > 0 && ` · ${d.photoCount} photo${d.photoCount !== 1 ? 's' : ''}`}
                          </p>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer navigation ─────────────────────────────────────────────────── */}
      {!isSummary && (
        <div className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm px-5 py-3.5">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={goBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" /> Back
            </button>

            <div className="flex-1 flex items-center gap-1.5">
              {steps.slice(0, -1).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < currentStep ? 'bg-blue-600' : i === currentStep ? 'bg-blue-400' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 min-h-[48px]"
            >
              {currentStep === steps.length - 2 ? 'Complete' : 'Continue'}
              <ChevronRight className="size-4" />
            </motion.button>
          </div>
        </div>
      )}

      {/* ── Technician: collapsible diagram (mobile) ──────────────────────────── */}
      {isTech && stepId === 'exterior' && (
        <div className="xl:hidden shrink-0 border-t border-border bg-background/95">
          <button
            onClick={() => setDiagramExpanded(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-foreground"
          >
            <div className="flex items-center gap-2">
              <Car className="size-4 text-muted-foreground" />
              <span>Vehicle Diagram</span>
              {damagedCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold">
                  {damagedCount} marked
                </span>
              )}
            </div>
            {diagramExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronUp className="size-4 text-muted-foreground" />}
          </button>
          <AnimatePresence>
            {diagramExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="flex justify-center px-5 py-4">
                  <CarDiagram
                    damage={data.zoneDamage}
                    selectedZone={selectedZone}
                    onZoneClick={id => setSelectedZone(prev => prev === id ? null : id)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
