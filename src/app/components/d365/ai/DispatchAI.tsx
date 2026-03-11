import { useMemo, useState } from 'react';
import { Clipboard, Sparkles, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { REPAIR_ORDERS } from '../repairOrderData';
import { AISheet } from './AISheet';
import { AIEntryButton } from './AIEntryButton';
import { useMockWorkflow } from './useMockWorkflow';

export function DispatchAI() {
  const [open, setOpen] = useState(false);

  const signals = useMemo(() => {
    const unassigned = REPAIR_ORDERS.filter(r => !r.techName || !r.bay).length;
    const blocked = REPAIR_ORDERS.filter(r => r.status === 'blocked').length;
    const urgent = REPAIR_ORDERS.filter(r => r.priority === 'urgent').length;
    return { unassigned, blocked, urgent, total: REPAIR_ORDERS.length };
  }, []);

  const steps = useMemo(() => ([
    { id: 'scan', label: 'Scan board state', detail: `${signals.total} ROs` },
    { id: 'detect', label: 'Detect blockers', detail: `${signals.blocked} blocked · ${signals.urgent} urgent` },
    { id: 'balance', label: 'Suggest balancing', detail: `Prioritize unassigned first` },
  ]), [signals.blocked, signals.total, signals.urgent]);

  const workflow = useMockWorkflow(
    steps,
    () => ({ ...signals }),
    { durationMs: 1500 }
  );

  const top = useMemo(() => {
    return REPAIR_ORDERS
      .slice()
      .sort((a, b) => (b.priority === 'urgent' ? 1 : 0) - (a.priority === 'urgent' ? 1 : 0))
      .slice(0, 4);
  }, []);

  const aiCount = signals.unassigned + signals.blocked;

  return (
    <>
      <AIEntryButton onClick={() => setOpen(true)} count={aiCount} label="AI" />

      <AISheet
        open={open}
        onOpenChange={setOpen}
        title="AI Dispatch Brief"
        description="Mock insights for assignment & blockers"
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
              Signals
            </p>
            <Badge variant="secondary" className="tabular-nums">{signals.total} ROs</Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Unassigned', value: signals.unassigned },
              { label: 'Blocked', value: signals.blocked },
              { label: 'Urgent', value: signals.urgent },
            ].map(s => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-3 text-center">
                <div className="text-lg font-bold text-foreground tabular-nums">{s.value}</div>
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested focus list
            </p>
            <div className="space-y-2">
              {top.map(ro => (
                <div key={ro.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                      {ro.customerInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{ro.roNumber}</span>
                        <Badge variant="outline" className="capitalize">{ro.priority}</Badge>
                        {ro.status === 'blocked' ? (
                          <Badge variant="outline" className="gap-1">
                            <TriangleAlert className="size-3" /> blocked
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{ro.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{ro.vehicle}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = `${ro.roNumber} — ${ro.customerName} · ${ro.vehicle}`;
                        navigator.clipboard?.writeText(text);
                        toast('Copied', { description: text });
                      }}
                      className="w-full"
                    >
                      <Clipboard className="size-4" />
                      Copy summary
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-4" />
              Mock workflow only. This does not change board assignments.
            </div>
          </div>
        </div>
      </AISheet>
    </>
  );
}

