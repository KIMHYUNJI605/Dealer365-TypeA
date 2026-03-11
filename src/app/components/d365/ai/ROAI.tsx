import { useMemo, useState } from 'react';
import { Clipboard, MessageSquareText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import { Badge } from '../../ui/badge';
import { RepairOrder } from '../repairOrderData';
import { Role } from '../types';
import { AISheet } from './AISheet';
import { AIEntryButton } from './AIEntryButton';
import { useMockWorkflow } from './useMockWorkflow';

function buildCustomerUpdate(ro: RepairOrder) {
  const statusText =
    ro.status === 'waiting-approval'
      ? 'we need your approval to continue'
      : ro.status === 'waiting-parts'
        ? 'we’re waiting on parts to arrive'
        : ro.status === 'blocked'
          ? 'we hit a temporary blocker and are resolving it now'
          : ro.status === 'completed'
            ? 'your vehicle service is complete'
            : 'your vehicle is currently being serviced';

  return `Hi ${ro.customerName.split(' ')[0]} — quick update on ${ro.roNumber}.
${statusText}. Current promise time is ${ro.promisedTime}.
Reply YES to proceed or call us if you have any questions.`;
}

function buildAuthDraft(ro: RepairOrder) {
  return `AUTH REQUEST — ${ro.roNumber}
Customer: ${ro.customerName}
Vehicle: ${ro.vehicle}

Summary: Technician flagged items requiring authorization. Estimated total: ${ro.estimatedTotal}.
Next step: Approve to continue work today.`;
}

export function ROAI({ role, ro }: { role: Role; ro: RepairOrder }) {
  const [open, setOpen] = useState(false);

  const steps = useMemo(() => ([
    { id: 'context', label: 'Read RO context', detail: `${ro.roNumber} · ${ro.status.replace('-', ' ')}` },
    { id: 'draft', label: 'Draft communication', detail: 'Customer update + approval draft' },
    { id: 'next', label: 'Recommend next action', detail: 'Role-adaptive CTA hint' },
  ]), [ro.roNumber, ro.status]);

  const workflow = useMockWorkflow(
    steps,
    () => ({
      customerUpdate: buildCustomerUpdate(ro),
      authDraft: buildAuthDraft(ro),
      next:
        role === 'advisor'
          ? 'Send customer update, then follow up on authorization.'
          : role === 'technician'
            ? 'Continue active jobs and flag advisor when ready.'
            : 'Review blockers and rebalance workload.',
    }),
    { durationMs: 1600 }
  );

  const result = workflow.result?.status === 'done' ? workflow.result.data : null;

  return (
    <>
      <AIEntryButton onClick={() => setOpen(true)} label="AI" />

      <AISheet
        open={open}
        onOpenChange={setOpen}
        title="AI RO Assistant"
        description="Drafts updates & next best action (mock)"
        steps={steps}
        status={workflow.status}
        activeStep={workflow.activeStep}
        progress={workflow.progress}
        result={workflow.result}
        onRun={workflow.start}
      >
        {result ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Drafts
              </p>
              <Badge variant="secondary" className="capitalize">{role}</Badge>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <MessageSquareText className="size-4 text-muted-foreground" />
                Customer update
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {result.customerUpdate}
              </pre>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.customerUpdate);
                    toast('Copied', { description: 'Customer update' });
                  }}
                >
                  <Clipboard className="size-4" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Sparkles className="size-4 text-muted-foreground" />
                Approval package draft
              </div>
              <pre className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                {result.authDraft}
              </pre>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(result.authDraft);
                    toast('Copied', { description: 'Approval draft' });
                  }}
                >
                  <Clipboard className="size-4" />
                  Copy
                </Button>
              </div>
            </div>

            <Separator />

            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Next best action:</span>{' '}
                {result.next}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Run the workflow to generate drafts for this RO.
          </div>
        )}
      </AISheet>
    </>
  );
}

