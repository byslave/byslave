import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';

import { AppText } from '@/src/components/ui/AppText';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { StatBlock } from '@/src/components/ui/StatBlock';
import { acceptJumps } from '@/src/features/session/jumps';
import { formatNumber } from '@/src/lib/format';
import { useAppStore } from '@/src/stores/appStore';
import { colors } from '@/src/theme/tokens';

export default function SessionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addFinishedNight = useAppStore((state) => state.addFinishedNight);
  const setConsent = useAppStore((state) => state.setConsent);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [denied, setDenied] = useState(false);
  const [baseMs, setBaseMs] = useState(0);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [jumps, setJumps] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef<string | null>(null);
  const anchorRef = useRef<number | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);
  const lastMag = useRef<number | null>(null);
  const lastJumpAt = useRef(0);
  const elapsed = baseMs + (running && !paused && anchor ? now - anchor : 0);
  const minutes = Math.max(0, Math.round(elapsed / 60000));
  const verdict = acceptJumps({ jumps, minutes: Math.max(minutes, 1) });

  useEffect(() => {
    if (!running || paused) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [paused, running]);

  useEffect(() => {
    if (!running || paused || denied) return;
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const onMotion = (event: Event) => {
      const motion = event as DeviceMotionEvent;
      const acc = motion.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.hypot(acc.x ?? 0, acc.y ?? 0, acc.z ?? 0);
      const previous = lastMag.current;
      lastMag.current = mag;
      if (previous === null) return;
      const stamp = Date.now();
      if (Math.abs(mag - previous) > 8 && stamp - lastJumpAt.current > 280) {
        lastJumpAt.current = stamp;
        setJumps((value) => value + 1);
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [denied, paused, running]);

  function freeze() {
    if (!anchorRef.current) return;
    const extra = Date.now() - anchorRef.current;
    anchorRef.current = null;
    setAnchor(null);
    setBaseMs((value) => value + extra);
    setPaused(true);
  }

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') freeze();
    });
    const onHide = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') freeze();
    };
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onHide);
    return () => {
      sub.remove();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  async function start() {
    setConsent('motion', true);
    const motionEvent = typeof DeviceMotionEvent === 'undefined' ? undefined : DeviceMotionEvent;
    const ask = motionEvent as { requestPermission?: () => Promise<string> } | undefined;
    if (ask?.requestPermission) {
      try {
        const result = await ask.requestPermission();
        if (result !== 'granted') {
          setDenied(true);
          setConsent('motion', false);
        }
      } catch {
        setDenied(true);
        setConsent('motion', false);
      }
    }
    const nav = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } });
    if (nav?.wakeLock) {
      try {
        wakeLock.current = await nav.wakeLock.request('screen');
      } catch {
        wakeLock.current = null;
      }
    }
    if (!startedAt.current) startedAt.current = new Date().toISOString();
    const stamp = Date.now();
    anchorRef.current = stamp;
    setAnchor(stamp);
    setPaused(false);
    setRunning(true);
    setDone(false);
  }

  async function stop() {
    const total = baseMs + (anchor ? Date.now() - anchor : 0);
    const storedMinutes = Math.max(1, Math.round(total / 60000));
    const result = acceptJumps({ jumps, minutes: storedMinutes });
    addFinishedNight({
      id: `night-${Date.now()}`,
      startedAt: startedAt.current ?? new Date().toISOString(),
      minutes: storedMinutes,
      jumps: result.accepted ? result.jumps : jumps,
      rankable: result.accepted,
    });
    setRunning(false);
    setPaused(false);
    anchorRef.current = null;
    setAnchor(null);
    setDone(true);
    if (wakeLock.current) {
      await wakeLock.current.release().catch(() => undefined);
      wakeLock.current = null;
    }
  }

  const clock = `${String(Math.floor(elapsed / 3600000)).padStart(2, '0')}:${String(Math.floor(elapsed / 60000) % 60).padStart(2, '0')}:${String(Math.floor(elapsed / 1000) % 60).padStart(2, '0')}`;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
        <ChevronLeft color={colors.text} size={22} />
      </Pressable>
      <AppText variant="display">{t('session.title')}</AppText>
      <AppText variant="body">{t('session.background')}</AppText>
      <Card style={styles.card}>
        <AppText variant="muted">{t('session.sample')}</AppText>
        <View style={styles.stats}>
          <StatBlock label={t('session.duration')} value={clock} />
          <StatBlock label={t('session.jumps')} value={formatNumber(jumps, i18n.language)} />
        </View>
        <AppText variant="body">{paused ? t('session.paused') : running ? t('session.running') : t('session.idle')}</AppText>
        {denied ? <AppText variant="muted">{t('session.denied')}</AppText> : null}
        {done && jumps === 0 ? <AppText variant="muted">{t('session.zero')}</AppText> : null}
        {done && !verdict.accepted ? <AppText variant="muted">{t('session.capped')}</AppText> : null}
        {done ? <AppText variant="body">{t('session.done')}</AppText> : null}
      </Card>
      <View style={styles.spacer} />
      {!running ? <Button label={baseMs > 0 && !done ? t('session.resume') : t('session.start')} onPress={() => void start()} /> : null}
      {running && paused ? <Button label={t('session.resume')} onPress={() => void start()} /> : null}
      {running ? <Button label={t('session.stop')} variant="secondary" onPress={() => void stop()} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20, gap: 14 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 12 },
  stats: { flexDirection: 'row', gap: 12 },
  spacer: { flex: 1 },
});
