import { useMemo, useState } from 'react';
import { Clipboard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';
import { AppointmentItem } from '../types';
import { Role } from '../types';
import { getAppointmentCTA, ACTIVE_STATUSES } from '../appointmentUtils';
import { AISheet } from './AISheet';
import { AIEntryButton } from './AIEntryButton';
import { useMockWorkflow } from './useMockWorkflow';

type Props = {
  roleLabel: string;
  items: AppointmentItem[];
  onNavigate?: (nav: string) => void;
  roleId: Role;
};

export function AppointmentAI({ roleLabel, items, onNavigate, roleId }: Props) {
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => {
    const active = items.filter(i => ACTIVE_STATUSES.includes(i.status)).length;
    const flagged = items.filter(i => i.hasFlag).length;
    return { active, flagged, total: items.length };
  }, [items]);

  const topSuggestions = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => (b.hasFlag ? 1 : 0) - (a.hasFlag ? 1 : 0))
      .slice(0, 3);
  }, [items]);

  const steps = useMemo(() => ([
    { id: 'scan', label: 'Scan queue', detail: `Analyze ${counts.total} appointments` },
    { id: 'triage', label: 'Triage next actions', detail: `Prioritize by lifecycle status` },
    { id: 'draft', label: 'Draft recommended moves', detail: `Prepare role-adaptive actions` },
  ]), [counts.total]);

  const workflow = useMockWorkflow(
    steps,
    () => ({
      summary: `${counts.flagged} flagged · ${counts.active} active`,
    }),
    { durationMs: 1600 }
  );

  const aiCount = counts.flagged;

  return (
    <>
      <AIEntryButton onClick={() => setOpen(true)} count={aiCount} label="AI" />

      <AISheet
        open={open}
        onOpenChange={setOpen}
        title="AI Queue Triage"
        description={`${roleLabel} · recommends the next best actions`}
        steps={steps}
        status={workflow.status}
        activeStep={workflow.activeStep}
        progress={workflow.progress}
        result={workflow.result}
        onRun={workflow.start}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested next actions
            </p>
            <Badge variant="secondary" className="tabular-nums">{counts.total} items</Badge>
          </div>

          <div className="space-y-2">
            {topSuggestions.map((item) => {
              const cta = getAppointmentCTA(item, roleId);
              return (
                <div key={item.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                      {item.customerInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{item.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.vehicle}</p>
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-muted-foreground">{item.refNumber}</span>
                        {item.hasFlag ? (
                          <Badge variant="outline" className="text-[10px]">Flagged</Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        if (cta?.navTarget) onNavigate?.(cta.navTarget);
                        toast.success('Mock action queued', { description: cta?.label ?? 'Open' });
                      }}
                      disabled={!cta}
                    >
                      <ArrowRight className="size-4" />
                      {cta?.label ?? 'Open'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = `${item.refNumber} — ${item.customerName} · ${item.vehicle}`;
                        navigator.clipboard?.writeText(text);
                        toast('Copied', { description: text });
                      }}
                    >
                      <Clipboard className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4" />
              This is a mock workflow. No real data is changed.
            </div>
          </div>
        </div>
      </AISheet>
    </>
  );
}

