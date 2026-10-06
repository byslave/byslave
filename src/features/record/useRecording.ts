import { useCallback, useEffect, useRef, useState } from 'react';
import { openMotionSource, type MotionKind } from '../../motion/source';
import { addSample, emptyTotals, type LiveTotals } from '../../domain/liveStats';
import { currentHeartRate } from '../../health/bleHeartRate';
import type { ActivitySample, PermissionChoice } from '../../domain/types';
import { loadOpenNight, clearOpenNight, saveOpenNight, type OpenNight } from './openNight';

const uiRefreshMs = 1000;
const persistMs = 10_000;

export type RecordContext = {
  eventId: string | null;
  nightKind: string;
  note: string;
  shared: boolean;
  locationShared: boolean;
};

export function useRecording() {
  const [phase, setPhase] = useState<'idle' | 'running' | 'paused'>('idle');
  const [totals, setTotals] = useState<LiveTotals>(() => emptyTotals());
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [kind, setKind] = useState<MotionKind | null>(null);
  const [permissions, setPermissions] = useState<{ motion: PermissionChoice; location: PermissionChoice } | null>(null);
  const [pending, setPending] = useState<OpenNight | null>(null);

  const totalsRef = useRef<LiveTotals>(emptyTotals());
  const contextRef = useRef<RecordContext | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accumulated = useRef(0);
  const runningSince = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  const secondsNow = () =>
    accumulated.current + (runningSince.current ? (Date.now() - runningSince.current) / 1000 : 0);

  useEffect(() => {
    let alive = true;
    void loadOpenNight().then((found) => {
      if (alive && found) setPending(found);
    });
    return () => {
      alive = false;
    };
  }, []);

  const persist = useCallback(() => {
    if (!startedAt.current) return;
    void saveOpenNight({
      startedAt: startedAt.current,
      activeSeconds: secondsNow(),
      savedAt: Date.now(),
      totals: totalsRef.current,
      context: contextRef.current,
    });
  }, []);

  const stopSource = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    if (clockRef.current) clearInterval(clockRef.current);
    clockRef.current = null;
    if (runningSince.current) {
      accumulated.current += (Date.now() - runningSince.current) / 1000;
      runningSince.current = null;
    }
    setActiveSeconds(accumulated.current);
    setTotals({ ...totalsRef.current });
  }, []);

  const reset = useCallback(() => {
    totalsRef.current = emptyTotals();
    setTotals(totalsRef.current);
    accumulated.current = 0;
    startedAt.current = null;
    setActiveSeconds(0);
    setKind(null);
    setPhase('idle');
    void clearOpenNight();
  }, []);

  const begin = useCallback(
    async (fresh: boolean) => {
      stopSource();
      if (fresh) {
        totalsRef.current = emptyTotals();
        setTotals(totalsRef.current);
        accumulated.current = 0;
        setActiveSeconds(0);
        startedAt.current = Date.now();
      } else if (!startedAt.current) {
        startedAt.current = Date.now() - accumulated.current * 1000;
      }
      setPhase('running');
      setPending(null);
      const opened = await openMotionSource((sample: ActivitySample) => {
        addSample(totalsRef.current, { ...sample, heartRate: currentHeartRate() });
      });
      setKind(opened.kind);
      setPermissions({ motion: opened.motion, location: opened.location });
      stopRef.current = opened.stop;
      runningSince.current = Date.now();
      let sincePersist = 0;
      clockRef.current = setInterval(() => {
        setActiveSeconds(secondsNow());
        setTotals({ ...totalsRef.current });
        sincePersist += uiRefreshMs;
        if (sincePersist >= persistMs) {
          sincePersist = 0;
          persist();
        }
      }, uiRefreshMs);
    },
    [persist, stopSource],
  );

  useEffect(() => () => stopSource(), [stopSource]);

  return {
    phase,
    totals,
    activeSeconds,
    kind,
    permissions,
    /** Uygulama kapanınca yarım kalan gece. */
    pending,
    setContext: (context: RecordContext) => {
      contextRef.current = context;
    },
    start: () => begin(true),
    resume: () => begin(false),
    /** Yarım kalan geceyi geri yükler, kayda devam eder. */
    continuePending: async (found: OpenNight) => {
      totalsRef.current = found.totals;
      setTotals({ ...found.totals });
      accumulated.current = found.activeSeconds;
      setActiveSeconds(found.activeSeconds);
      startedAt.current = found.startedAt;
      await begin(false);
    },
    dropPending: () => {
      setPending(null);
      void clearOpenNight();
    },
    pause: () => {
      stopSource();
      setPhase('paused');
      persist();
    },
    discard: () => {
      stopSource();
      reset();
    },
    finish: () => {
      stopSource();
      const snapshot = {
        totals: totalsRef.current,
        activeSeconds: accumulated.current,
        startedAt: startedAt.current,
        kind,
      };
      reset();
      return snapshot;
    },
  };
}
