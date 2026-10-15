import type { MapPin } from './cluster';
import { slippyRuntime } from './slippy';

export interface MapBoot {
  styleUrl: string;
  pins: MapPin[];
  selectedId: string | null;
  center: { lng: number; lat: number };
  zoom: number;
  clusterWord: string;
}

const pinCss = `
  html, body, #map { margin: 0; height: 100%; background: #07060C; overflow: hidden; touch-action: none; }
  #tiles, #pins { position: absolute; inset: 0; }
  #tiles, #tiles img { pointer-events: none; }
  #pins { pointer-events: none; }
  #tiles img { position: absolute; }
  #attrib {
    position: absolute; left: 8px; bottom: 300px; z-index: 2;
    font: 10px/1.3 Inter, system-ui, sans-serif; color: #A79FB4;
    background: rgba(7,6,12,0.7); padding: 3px 6px; border-radius: 6px;
  }
  #attrib a { color: #D9CCFF; text-decoration: none; }
  button.pin {
    appearance: none; border: 0; position: absolute; transform: translate(-50%, -50%);
    pointer-events: auto; display: flex; align-items: center; gap: 8px;
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
`;

function payloadOf(boot: MapBoot): string {
  return JSON.stringify(boot).replace(/</g, '\\u003c');
}

function rasterDocument(payload: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>${pinCss}</style>
</head>
<body>
<div id="map">
  <div id="tiles"></div>
  <div id="pins"></div>
  <div id="attrib">© <a href="https://www.esri.com/en-us/legal/terms/data-attributions" target="_blank" rel="noreferrer">Esri</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></div>
</div>
<script>
  ${slippyRuntime}
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
  var map = document.getElementById('map');
  var tilesEl = document.getElementById('tiles');
  var pinsEl = document.getElementById('pins');
  var pins = boot.pins;
  var selectedId = boot.selectedId;
  var view = { lng: boot.center.lng, lat: boot.center.lat, zoom: boot.zoom };
  var pool = {};
  var tileOk = 0;
  var tileFail = 0;
  var failedPosted = false;
  var drag = null;
  var flyFrame = 0;
  function renderTiles() {
    var tiles = visibleTiles(view, view.zoom, map.clientWidth, map.clientHeight);
    var seen = {};
    tiles.forEach(function (tile) {
      var layers = [
        {
          name: 'base',
          src: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/' + tile.z + '/' + tile.y + '/' + tile.x,
          count: true
        },
        {
          name: 'label',
          src: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/' + tile.z + '/' + tile.y + '/' + tile.x,
          count: false
        }
      ];
      layers.forEach(function (layer) {
        var key = layer.name + ':' + tile.z + '/' + tile.x + '/' + tile.y;
        seen[key] = true;
        var img = pool[key];
        if (!img) {
          img = document.createElement('img');
          img.alt = '';
          img.draggable = false;
          img.src = layer.src;
          if (layer.name === 'label') img.style.zIndex = '1';
          if (layer.count) {
            img.onload = function () { tileOk += 1; };
            img.onerror = function () {
              tileFail += 1;
              if (!failedPosted && tileFail >= 6 && tileOk === 0) {
                failedPosted = true;
                post({ type: 'error', message: 'tiles' });
              }
            };
          }
          tilesEl.appendChild(img);
          pool[key] = img;
        }
        img.style.left = tile.left + 'px';
        img.style.top = tile.top + 'px';
        img.style.width = tile.size + 'px';
        img.style.height = tile.size + 'px';
      });
    });
    Object.keys(pool).forEach(function (key) {
      if (!seen[key]) {
        pool[key].remove();
        delete pool[key];
      }
    });
  }
  function renderPins() {
    pinsEl.replaceChildren();
    var width = map.clientWidth;
    var height = map.clientHeight;
    clusterPins(pins, view.zoom).forEach(function (group) {
      var clustered = group.pinIds.length > 1;
      var point = screenPoint({ lng: group.lng, lat: group.lat }, view, view.zoom, width, height);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'pin' + (clustered ? ' is-cluster' : '') + (!clustered && group.id === selectedId ? ' is-selected' : '');
      button.innerHTML = clustered
        ? '<span class="count">' + group.count + '</span><span>' + group.pinIds.length + ' ' + escapeHtml(boot.clusterWord) + '</span>'
        : '<span class="wave"></span><span>' + escapeHtml(group.label) + '</span><span class="count">' + group.count + '</span>';
      button.setAttribute('aria-label', clustered ? String(group.count) : group.label + ' ' + group.count);
      button.style.left = point.x + 'px';
      button.style.top = point.y + 'px';
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        if (clustered) flyTo(group.lng, group.lat, Math.min(view.zoom + 1.8, 14.5));
        else {
          selectedId = group.id;
          renderPins();
          post({ type: 'select', id: group.id });
        }
      });
      pinsEl.appendChild(button);
    });
  }
  function render() {
    if (!map.clientWidth || !map.clientHeight) return;
    renderTiles();
    renderPins();
  }
  function postMove() {
    post({ type: 'move', lng: view.lng, lat: view.lat, zoom: view.zoom });
  }
  function flyTo(lng, lat, zoom) {
    cancelAnimationFrame(flyFrame);
    var start = { lng: view.lng, lat: view.lat, zoom: view.zoom };
    var targetZoom = zoom == null ? view.zoom : zoom;
    var t0 = performance.now();
    function step(now) {
      var t = Math.min(1, (now - t0) / 600);
      var eased = 1 - Math.pow(1 - t, 3);
      view.lng = start.lng + (lng - start.lng) * eased;
      view.lat = start.lat + (lat - start.lat) * eased;
      view.zoom = start.zoom + (targetZoom - start.zoom) * eased;
      render();
      if (t < 1) flyFrame = requestAnimationFrame(step);
      else postMove();
    }
    flyFrame = requestAnimationFrame(step);
  }
  window.__pulse = {
    sync: function (next) {
      if (next.pins) pins = next.pins;
      if (Object.prototype.hasOwnProperty.call(next, 'selectedId')) selectedId = next.selectedId;
      renderPins();
    },
    fly: function (lng, lat, zoom) { flyTo(lng, lat, zoom || 13); }
  };
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'sync') window.__pulse.sync(data);
    if (data.type === 'fly') window.__pulse.fly(data.lng, data.lat, data.zoom);
  });
  map.addEventListener('pointerdown', function (event) {
    if (event.target.closest && event.target.closest('button.pin')) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lng: view.lng,
      lat: view.lat,
      z: Math.round(view.zoom)
    };
    map.setPointerCapture(event.pointerId);
  });
  map.addEventListener('pointermove', function (event) {
    if (!drag || drag.id !== event.pointerId) return;
    var scale = Math.pow(2, view.zoom - drag.z);
    var origin = lngLatToWorld(drag.lng, drag.lat, drag.z);
    var next = worldToLngLat(origin.x - (event.clientX - drag.x) / scale, origin.y - (event.clientY - drag.y) / scale, drag.z);
    view.lng = next.lng;
    view.lat = Math.max(-85, Math.min(85, next.lat));
    render();
  });
  function endDrag(event) {
    if (!drag || drag.id !== event.pointerId) return;
    drag = null;
    postMove();
  }
  map.addEventListener('pointerup', endDrag);
  map.addEventListener('pointercancel', endDrag);
  map.addEventListener('wheel', function (event) {
    event.preventDefault();
    var direction = event.deltaY > 0 ? -1 : 1;
    view.zoom = Math.max(3, Math.min(16, view.zoom + direction * 0.6));
    render();
    postMove();
  }, { passive: false });
  map.addEventListener('dblclick', function (event) {
    var z = Math.round(view.zoom);
    var scale = Math.pow(2, view.zoom - z);
    var origin = lngLatToWorld(view.lng, view.lat, z);
    var next = worldToLngLat(origin.x + (event.clientX - map.clientWidth / 2) / scale, origin.y + (event.clientY - map.clientHeight / 2) / scale, z);
    flyTo(next.lng, next.lat, Math.min(16, view.zoom + 1));
  });
  if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(map);
  try { render(); post({ type: 'ready' }); } catch (error) { post({ type: 'error', message: String(error) }); }
</script>
</body>
</html>`;
}

function mapboxDocument(payload: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<link href="https://unpkg.com/maplibre-gl@5.6.2/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  ${pinCss}
  .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right { bottom: 300px !important; }
  .maplibregl-ctrl-attrib { font-size: 10px; background: rgba(7,6,12,0.7) !important; color: #A79FB4 !important; }
  .maplibregl-ctrl-attrib a { color: #D9CCFF !important; }
  button.pin { position: static; transform: none; }
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
      button.setAttribute('aria-label', clustered ? String(group.count) : group.label + ' ' + group.count);
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
  function postMove() {
    var center = map.getCenter();
    post({ type: 'move', lng: center.lng, lat: center.lat, zoom: map.getZoom() });
  }
  window.__pulse = {
    sync: function (next) {
      if (next.pins) pins = next.pins;
      if (Object.prototype.hasOwnProperty.call(next, 'selectedId')) selectedId = next.selectedId;
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
  map.on('moveend', postMove);
  map.on('error', function (event) {
    var message = event && event.error && event.error.message ? event.error.message : '';
    if (/style|sprite|glyphs/i.test(message)) post({ type: 'error', message: message });
  });
</script>
</body>
</html>`;
}

export function buildMapDocument(boot: MapBoot): string {
  const payload = payloadOf(boot);
  if (boot.styleUrl.includes('api.mapbox.com')) return mapboxDocument(payload);
  return rasterDocument(payload);
}
