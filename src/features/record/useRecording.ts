import { useEffect, useRef, useState } from 'react';
import { openMotionSource, type MotionKind } from '../../motion/source';
import type { ActivitySample } from '../../domain/types';

export function useRecording() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'paused'>('idle');
  const [samples, setSamples] = useState<ActivitySample[]>([]);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [kind, setKind] = useState<MotionKind | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const samplesRef = useRef<ActivitySample[]>([]);
  const kindRef = useRef<MotionKind | null>(null);
  const accumulated = useRef(0);
  const runningSince = useRef<number | null>(null);

  const stopSource = () => {
    stopRef.current?.();
    stopRef.current = null;
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
    if (runningSince.current) {
      accumulated.current += (Date.now() - runningSince.current) / 1000;
      runningSince.current = null;
    }
    setActiveSeconds(accumulated.current);
  };

  const begin = async (reset: boolean) => {
    stopSource();
    if (reset) {
      samplesRef.current = [];
      setSamples([]);
      accumulated.current = 0;
      setActiveSeconds(0);
    }
    setPhase('running');
    const opened = await openMotionSource((sample) => {
      samplesRef.current = [...samplesRef.current, sample];
      setSamples(samplesRef.current);
    });
    kindRef.current = opened.kind;
    setKind(opened.kind);
    stopRef.current = opened.stop;
    runningSince.current = Date.now();
    clockRef.current = setInterval(() => {
      const extra = runningSince.current ? (Date.now() - runningSince.current) / 1000 : 0;
      setActiveSeconds(accumulated.current + extra);
    }, 200);
  };

  useEffect(() => () => stopSource(), []);

  return {
    phase,
    samples,
    activeSeconds,
    kind,
    start: () => begin(true),
    resume: () => begin(false),
    pause: () => {
      stopSource();
      setPhase('paused');
    },
    discard: () => {
      stopSource();
      samplesRef.current = [];
      setSamples([]);
      accumulated.current = 0;
      setActiveSeconds(0);
      setKind(null);
      setPhase('idle');
    },
    finish: () => {
      stopSource();
      const snapshot = {
        samples: samplesRef.current,
        activeSeconds: accumulated.current,
        kind: kindRef.current,
      };
      samplesRef.current = [];
      setSamples([]);
      accumulated.current = 0;
      setActiveSeconds(0);
      setKind(null);
      setPhase('idle');
      return snapshot;
    },
  };
}
