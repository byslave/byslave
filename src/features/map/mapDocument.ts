import type { MapPin } from '@/src/features/map/cluster';

export interface MapBoot {
  styleUrl: string;
  pins: MapPin[];
  selectedId: string | null;
  center: { lng: number; lat: number };
  zoom: number;
  clusterWord: string;
}

export function buildMapDocument(boot: MapBoot): string {
  const payload = JSON.stringify(boot).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link href="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  html, body, #map { margin: 0; height: 100%; background: #07060C; }
  .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right { bottom: 300px !important; }
  .maplibregl-ctrl-attrib { font-size: 10px; background: rgba(7,6,12,0.7) !important; color: #A79FB4 !important; }
  .maplibregl-ctrl-attrib a { color: #D9CCFF !important; }
  button.pin {
    appearance: none; border: 0; display: flex; align-items: center; gap: 8px;
    height: 40px; padding: 0 12px 0 10px; border-radius: 999px; cursor: pointer;
    background: rgba(18,14,28,0.94); color: #F6F3FB;
    font-family: Inter, system-ui, sans-serif; font-size: 13px; font-weight: 600;
    box-shadow: 0 10px 28px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
  }
  button.pin .count { font-variant-numeric: tabular-nums; }
  button.pin.is-selected {
    height: 48px; background: #D9CCFF; color: #1A1230;
    box-shadow: 0 12px 32px rgba(139,108,255,0.45);
  }
  button.pin .wave {
    width: 18px; height: 18px; border-radius: 999px;
    background: radial-gradient(circle, #D9CCFF 0 35%, transparent 36% 100%);
    box-shadow: 0 0 0 4px rgba(217,204,255,0.18);
  }
  button.pin.is-selected .wave { background: #1A1230; box-shadow: none; }
  @media (prefers-reduced-motion: reduce) { button.pin { transition: none; } }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.js"></script>
<script>
  const boot = ${payload};
  function clusterPins(pins, zoom) {
    if (zoom >= 11 || pins.length === 0) {
      return pins.map(function (pin) {
        return { id: pin.id, lng: pin.lng, lat: pin.lat, count: pin.count, label: pin.label, pinIds: [pin.id] };
      });
    }
    var cell = zoom >= 9.5 ? 0.22 : 0.7;
    var buckets = {};
    pins.forEach(function (pin) {
      var key = Math.floor(pin.lat / cell) + ':' + Math.floor(pin.lng / cell);
      if (!buckets[key]) buckets[key] = [];
      buckets[key].push(pin);
    });
    return Object.keys(buckets).map(function (key) {
      var list = buckets[key];
      var count = 0, lng = 0, lat = 0, pinIds = [];
      list.forEach(function (pin) { count += pin.count; lng += pin.lng; lat += pin.lat; pinIds.push(pin.id); });
      return {
        id: list.length === 1 ? list[0].id : 'cluster:' + key,
        lng: lng / list.length,
        lat: lat / list.length,
        count: count,
        label: list.length === 1 ? list[0].label : '',
        pinIds: pinIds
      };
    });
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }
  function post(message) {
    var raw = JSON.stringify(message);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(raw);
    else if (window.parent) window.parent.postMessage(message, '*');
  }
  var pins = boot.pins;
  var selectedId = boot.selectedId;
  var markers = [];
  var map = new maplibregl.Map({
    container: 'map',
    style: boot.styleUrl,
    center: [boot.center.lng, boot.center.lat],
    zoom: boot.zoom,
    attributionControl: true,
    dragRotate: false,
    pitchWithRotate: false
  });
  function render() {
    markers.forEach(function (marker) { marker.remove(); });
    markers = [];
    clusterPins(pins, map.getZoom()).forEach(function (group) {
      var clustered = group.pinIds.length > 1;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pin' + (clustered ? ' is-cluster' : '') + (!clustered && group.id === selectedId ? ' is-selected' : '');
      button.innerHTML = clustered
        ? '<span class="count">' + group.count + '</span><span>' + group.pinIds.length + ' ' + escapeHtml(boot.clusterWord) + '</span>'
        : '<span class="wave"></span><span>' + escapeHtml(group.label) + '</span><span class="count">' + group.count + '</span>';
      button.setAttribute('aria-label', clustered ? group.count + '' : group.label + ' ' + group.count);
      button.addEventListener('click', function () {
        if (clustered) map.flyTo({ center: [group.lng, group.lat], zoom: Math.min(map.getZoom() + 1.8, 14.5) });
        else {
          selectedId = group.id;
          render();
          post({ type: 'select', id: group.id });
        }
      });
      markers.push(new maplibregl.Marker({ element: button, anchor: 'center' }).setLngLat([group.lng, group.lat]).addTo(map));
    });
  }
  window.__pulse = {
    sync: function (next) {
      if (next.pins) pins = next.pins;
      if (Object.prototype.hasOwnProperty.call(next, 'selectedId')) selectedId = next.selectedId;
      if (next.center) map.easeTo({ center: [next.center.lng, next.center.lat], zoom: next.zoom || map.getZoom(), duration: 600 });
      render();
    },
    fly: function (lng, lat, zoom) {
      map.flyTo({ center: [lng, lat], zoom: zoom || 13 });
    }
  };
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'sync') window.__pulse.sync(data);
    if (data.type === 'fly') window.__pulse.fly(data.lng, data.lat, data.zoom);
  });
  try { render(); post({ type: 'ready' }); } catch (error) { post({ type: 'error', message: String(error) }); }
  map.on('load', function () { try { render(); } catch (error) { post({ type: 'error', message: String(error) }); } });
  map.on('zoomend', function () { render(); });
  map.on('error', function (event) {
    var message = event && event.error && event.error.message ? event.error.message : '';
    if (/style|sprite|glyphs/i.test(message)) post({ type: 'error', message: message });
  });
</script>
</body>
</html>`;
}
