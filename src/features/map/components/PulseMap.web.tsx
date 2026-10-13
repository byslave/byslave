import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { MapPin } from '@/src/features/map/cluster';
import { buildMapDocument } from '@/src/features/map/mapDocument';
import { colors } from '@/src/theme/tokens';

export interface PulseMapHandle {
  recenter: (lng: number, lat: number) => void;
}

interface PulseMapProps {
  pins: MapPin[];
  selectedId: string | null;
  center: { lng: number; lat: number };
  zoom: number;
  clusterWord: string;
  styleUrl: string;
  onSelect: (id: string) => void;
  onError: () => void;
  onReady: () => void;
}

export const PulseMap = forwardRef<PulseMapHandle, PulseMapProps>(function PulseMap(
  { pins, selectedId, center, zoom, clusterWord, styleUrl, onSelect, onError, onReady },
  ref,
) {
  const hostRef = useRef<View>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const latest = useRef({ pins, selectedId, center, zoom });
  latest.current = { pins, selectedId, center, zoom };
  const html = useMemo(
    () => buildMapDocument({ styleUrl, pins, selectedId, center, zoom, clusterWord }),
    // Rebuild only when the basemap changes. Pin updates use postMessage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [styleUrl, clusterWord],
  );

  useImperativeHandle(ref, () => ({
    recenter(lng, lat) {
      frameRef.current?.contentWindow?.postMessage({ type: 'fly', lng, lat, zoom: 13 }, '*');
    },
  }));

  useEffect(() => {
    const parent = hostRef.current as unknown as HTMLElement | null;
    if (!parent) return undefined;
    const iframe = document.createElement('iframe');
    iframe.title = 'PULSE map';
    iframe.style.cssText = 'border:0;width:100%;height:100%;position:absolute;inset:0;background:#07060C;';
    iframe.srcdoc = html;
    parent.appendChild(iframe);
    frameRef.current = iframe;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data as { type?: string; id?: string };
      if (data?.type === 'ready') {
        ready.current = true;
        onReady();
        iframe.contentWindow?.postMessage({ type: 'sync', ...latest.current }, '*');
      } else if (data?.type === 'select' && data.id) onSelect(data.id);
      else if (data?.type === 'error') onError();
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
      ready.current = false;
    };
    // The iframe is mounted once per document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  useEffect(() => {
    if (!ready.current) return;
    frameRef.current?.contentWindow?.postMessage({ type: 'sync', pins, selectedId, center, zoom }, '*');
  }, [pins, selectedId, center, zoom]);

  return <View ref={hostRef} style={styles.fill} />;
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg, position: 'relative', overflow: 'hidden' },
});
