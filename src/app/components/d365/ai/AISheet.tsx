import type { ReactNode } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Progress } from '../../ui/progress';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../ui/sheet';
import { MockWorkflowResult, MockWorkflowStatus, MockWorkflowStep } from './useMockWorkflow';

type Props<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: MockWorkflowStep[];
  status: MockWorkflowStatus;
  activeStep: number;
  progress: number;
  result: MockWorkflowResult<T> | null;
  onRun: () => void;
  children?: ReactNode;
};

export function AISheet<T>({
  open,
  onOpenChange,
  title,
  description,
  steps,
  status,
  activeStep,
  progress,
  result,
  onRun,
  children,
}: Props<T>) {
  const isRunning = status === 'running';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-muted">
              <Sparkles className="size-4 text-foreground" />
            </span>
            <div className="min-w-0">
              <SheetTitle className="truncate">{title}</SheetTitle>
              {description ? <SheetDescription>{description}</SheetDescription> : null}
            </div>
          </div>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={isDone ? 'secondary' : 'default'}
              onClick={onRun}
              disabled={isRunning}
              className="w-full"
            >
              <Sparkles className="size-4" />
              {isRunning ? 'Running…' : isDone ? 'Run again' : 'Run AI workflow'}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Steps
            </p>
            <div className="space-y-1.5">
              {steps.map((s, idx) => {
                const state =
                  status === 'idle'
                    ? 'idle'
                    : idx < activeStep
                      ? 'done'
                      : idx === activeStep
                        ? 'active'
                        : 'todo';
                return (
                  <div key={s.id} className="flex items-start gap-2">
                    <Badge
                      variant={state === 'done' ? 'secondary' : 'outline'}
                      className="mt-0.5"
                    >
                      {state === 'done' ? <CheckCircle2 className="size-3" /> : <span className="text-[10px]">{idx + 1}</span>}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.label}</p>
                      {s.detail ? <p className="text-xs text-muted-foreground">{s.detail}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(isDone || isError) && result ? (
            <Alert variant={isError ? 'destructive' : 'default'}>
              <AlertTitle className="flex items-center gap-2">
                {isError ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
                {isError ? 'Workflow failed' : 'Workflow complete'}
              </AlertTitle>
              <AlertDescription className="mt-1">
                {result.status === 'error'
                  ? result.message
                  : 'Review the AI suggestions below.'}
              </AlertDescription>
            </Alert>
          ) : null}

          {children ? <div className="pt-1">{children}</div> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

