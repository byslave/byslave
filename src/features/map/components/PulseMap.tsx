import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildMapDocument, type MapBoot } from '@/src/features/map/mapDocument';
import type { MapPin } from '@/src/features/map/cluster';
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
  onMove?: (view: { lng: number; lat: number; zoom: number }) => void;
  onError: () => void;
  onReady: () => void;
}

export const PulseMap = forwardRef<PulseMapHandle, PulseMapProps>(function PulseMap(
  { pins, selectedId, center, zoom, clusterWord, styleUrl, onSelect, onMove, onError, onReady },
  ref,
) {
  const webRef = useRef<WebView>(null);
  const ready = useRef(false);
  const latest = useRef({ pins, selectedId, center, zoom });
  latest.current = { pins, selectedId, center, zoom };
  const boot = useMemo<MapBoot>(
    () => ({ styleUrl, pins, selectedId, center, zoom, clusterWord }),
    // The document is built once per style. Later updates go through injected JavaScript.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [styleUrl],
  );
  const html = useMemo(() => buildMapDocument(boot), [boot]);

  useImperativeHandle(ref, () => ({
    recenter(lng, lat) {
      webRef.current?.injectJavaScript(`window.__pulse && window.__pulse.fly(${lng}, ${lat}, 13); true;`);
    },
  }));

  useEffect(() => {
    const payload = JSON.stringify({ pins, selectedId, center, zoom });
    const script = `window.__pulse && window.__pulse.sync(${payload}); true;`;
    if (ready.current) webRef.current?.injectJavaScript(script);
  }, [pins, selectedId, center, zoom]);

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        id?: string;
        lng?: number;
        lat?: number;
        zoom?: number;
      };
      if (data.type === 'ready') {
        ready.current = true;
        onReady();
        const payload = JSON.stringify(latest.current);
        webRef.current?.injectJavaScript(`window.__pulse && window.__pulse.sync(${payload}); true;`);
      } else if (data.type === 'select' && data.id) onSelect(data.id);
      else if (data.type === 'move' && typeof data.lng === 'number' && typeof data.lat === 'number' && typeof data.zoom === 'number') {
        onMove?.({ lng: data.lng, lat: data.lat, zoom: data.zoom });
      } else if (data.type === 'error') onError();
    } catch {
      onError();
    }
  }

  return (
    <View style={styles.fill}>
      <WebView
        ref={webRef}
        source={{ html }}
        style={styles.fill}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
});
