import { useMemo, useState } from 'react';
import { ArrowRight, Clipboard, Sparkles, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { REPAIR_ORDERS, RepairOrder } from '../repairOrderData';
import { AISheet } from './AISheet';
import { AIEntryButton } from './AIEntryButton';
import { useMockWorkflow } from './useMockWorkflow';

type Preset = 'blocked' | 'approval' | 'parts';

export function ServiceWorkbenchAI({
  roleLabel,
  onApplyPreset,
  onOpenRO,
}: {
  roleLabel: string;
  onApplyPreset: (preset: Preset) => void;
  onOpenRO: (ro: RepairOrder) => void;
}) {
  const [open, setOpen] = useState(false);

  const counts = useMemo(() => {
    const blocked = REPAIR_ORDERS.filter(r => r.status === 'blocked').length;
    const approval = REPAIR_ORDERS.filter(r => r.status === 'waiting-approval').length;
    const parts = REPAIR_ORDERS.filter(r => r.status === 'waiting-parts').length;
    return { blocked, approval, parts };
  }, []);

  const top = useMemo(() => {
    return REPAIR_ORDERS
      .filter(r => ['blocked', 'waiting-approval', 'waiting-parts'].includes(r.status))
      .slice(0, 4);
  }, []);

  const steps = useMemo(() => ([
    { id: 'scan', label: 'Scan open work', detail: 'Identify blockers & holds' },
    { id: 'cluster', label: 'Cluster by cause', detail: 'Blocked · Approval · Parts' },
    { id: 'recommend', label: 'Recommend next actions', detail: 'Role-adaptive shortcuts' },
  ]), []);

  const workflow = useMockWorkflow(
    steps,
    () => ({ ...counts }),
    { durationMs: 1500 }
  );

  const aiCount = counts.blocked + counts.approval + counts.parts;

  return (
    <>
      <AIEntryButton onClick={() => setOpen(true)} count={aiCount} label="AI" />

      <AISheet
        open={open}
        onOpenChange={setOpen}
        title="AI Blocker Scan"
        description={`${roleLabel} · highlights what needs attention`}
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
              Quick presets
            </p>
            <Badge variant="secondary" className="tabular-nums">
              {aiCount} signals
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'blocked' as const, label: 'Blocked', count: counts.blocked },
              { id: 'approval' as const, label: 'Approval', count: counts.approval },
              { id: 'parts' as const, label: 'Parts', count: counts.parts },
            ]).map(p => (
              <Button
                key={p.id}
                type="button"
                variant="outline"
                onClick={() => {
                  onApplyPreset(p.id);
                  toast('Preset applied', { description: p.label });
                }}
                className="justify-between"
              >
                <span className="text-xs font-semibold">{p.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{p.count}</span>
              </Button>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested focus items
            </p>
            <div className="space-y-2">
              {top.map((ro) => (
                <div key={ro.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                      {ro.customerInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{ro.roNumber}</span>
                        <Badge variant="outline" className="capitalize">
                          {ro.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground truncate">{ro.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">{ro.vehicle}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        onOpenRO(ro);
                        toast.success('Opened', { description: ro.roNumber });
                      }}
                    >
                      <ArrowRight className="size-4" />
                      Open
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const text = `${ro.roNumber} — ${ro.customerName} · ${ro.vehicle}`;
                        navigator.clipboard?.writeText(text);
                        toast('Copied', { description: text });
                      }}
                    >
                      <Clipboard className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TriangleAlert className="size-4" />
              Mock workflow only. No real dispatch/RO state is persisted.
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Sparkles className="size-3.5" />
            Uses token-based UI + Shadcn components.
          </div>
        </div>
      </AISheet>
    </>
  );
}

