import { Priority } from './types';

const PRIORITY_COLORS: Record<Priority, string> = {
  low:    'bg-slate-300 dark:bg-slate-600',
  medium: 'bg-blue-400',
  high:   'bg-amber-500',
  urgent: 'bg-red-500',
};

interface PriorityBarProps {
  priority: Priority;
}

export function PriorityBar({ priority }: PriorityBarProps) {
  return (
    <div
      className={`absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl ${PRIORITY_COLORS[priority]}`}
      title={`Priority: ${priority}`}
    />
  );
}
