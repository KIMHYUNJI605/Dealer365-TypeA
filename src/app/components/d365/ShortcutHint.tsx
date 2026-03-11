import { Keyboard } from 'lucide-react';

export function ShortcutHint({
  combo,
  label,
  className,
}: {
  combo: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="inline-flex items-center gap-2 text-[10px] text-muted-foreground">
        <Keyboard className="size-3.5" />
        <span>{label}</span>
        <kbd className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded font-mono">
          {combo}
        </kbd>
      </div>
    </div>
  );
}

