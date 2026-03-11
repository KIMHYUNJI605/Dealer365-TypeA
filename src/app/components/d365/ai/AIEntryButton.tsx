import { Sparkles } from 'lucide-react';
import { Button } from '../../ui/button';

export function AIEntryButton({
  onClick,
  count,
  label = 'AI',
}: {
  onClick: () => void;
  count?: number;
  label?: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="gap-2">
      <Sparkles className="size-4" />
      <span className="hidden sm:inline">{label}</span>
      {count != null && count > 0 ? (
        <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
          {count}
        </span>
      ) : null}
    </Button>
  );
}

