import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type MockWorkflowStatus = 'idle' | 'running' | 'done' | 'error';

export type MockWorkflowStep = {
  id: string;
  label: string;
  detail?: string;
};

export type MockWorkflowResult<T> =
  | { status: 'done'; data: T }
  | { status: 'error'; message: string };

type Options = {
  durationMs?: number;
};

export function useMockWorkflow<T>(
  steps: MockWorkflowStep[],
  run: () => Promise<T> | T,
  options: Options = {}
) {
  const durationMs = options.durationMs ?? 1800;

  const [status, setStatus] = useState<MockWorkflowStatus>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<MockWorkflowResult<T> | null>(null);

  const timersRef = useRef<number[]>([]);

  const progress = useMemo(() => {
    if (status === 'idle') return 0;
    if (status === 'done') return 100;
    const denom = Math.max(1, steps.length);
    return Math.min(99, Math.round(((activeStep + 1) / denom) * 100));
  }, [activeStep, status, steps.length]);

  const reset = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
    setStatus('idle');
    setActiveStep(0);
    setResult(null);
  }, []);

  const start = useCallback(async () => {
    if (status === 'running') return;

    reset();
    setStatus('running');

    // Step tick simulation (UI-only)
    const stepDelay = Math.max(120, Math.round(durationMs / Math.max(1, steps.length)));
    for (let i = 0; i < steps.length; i += 1) {
      const t = window.setTimeout(() => setActiveStep(i), i * stepDelay);
      timersRef.current.push(t);
    }

    try {
      const data = await run();
      const t = window.setTimeout(() => {
        setStatus('done');
        setResult({ status: 'done', data });
      }, durationMs);
      timersRef.current.push(t);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      const t = window.setTimeout(() => {
        setStatus('error');
        setResult({ status: 'error', message });
      }, Math.min(600, durationMs));
      timersRef.current.push(t);
    }
  }, [durationMs, reset, run, status, steps.length]);

  useEffect(() => () => reset(), [reset]);

  return {
    status,
    activeStep,
    progress,
    result,
    start,
    reset,
  };
}

