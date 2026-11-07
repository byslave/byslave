export interface LngLat {
  lng: number;
  lat: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface TileSpec {
  z: number;
  x: number;
  y: number;
  left: number;
  top: number;
  size: number;
}

/** Self-contained map math. The iframe runs this string; tests call the same functions. */
export const slippyRuntime = `
function worldSize(zoom) {
  return 256 * Math.pow(2, zoom);
}
function lngLatToWorld(lng, lat, zoom) {
  var size = worldSize(zoom);
  var clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  var x = ((lng + 180) / 360) * size;
  var sin = Math.sin((clamped * Math.PI) / 180);
  var y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size;
  return { x: x, y: y };
}
function worldToLngLat(x, y, zoom) {
  var size = worldSize(zoom);
  var lng = (x / size) * 360 - 180;
  var n = Math.PI - (2 * Math.PI * y) / size;
  var lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return { lng: lng, lat: lat };
}
function screenPoint(target, center, zoom, width, height) {
  var z = Math.round(zoom);
  var scale = Math.pow(2, zoom - z);
  var origin = lngLatToWorld(center.lng, center.lat, z);
  var point = lngLatToWorld(target.lng, target.lat, z);
  return {
    x: (point.x - origin.x) * scale + width / 2,
    y: (point.y - origin.y) * scale + height / 2
  };
}
function visibleTiles(center, zoom, width, height) {
  var z = Math.max(0, Math.min(19, Math.round(zoom)));
  var scale = Math.pow(2, zoom - z);
  var origin = lngLatToWorld(center.lng, center.lat, z);
  var leftWorld = origin.x - width / 2 / scale;
  var topWorld = origin.y - height / 2 / scale;
  var rightWorld = origin.x + width / 2 / scale;
  var bottomWorld = origin.y + height / 2 / scale;
  var n = Math.pow(2, z);
  var x0 = Math.floor(leftWorld / 256);
  var x1 = Math.floor(rightWorld / 256);
  var y0 = Math.floor(topWorld / 256);
  var y1 = Math.floor(bottomWorld / 256);
  var tiles = [];
  for (var x = x0; x <= x1; x += 1) {
    var wrapped = ((x % n) + n) % n;
    for (var y = y0; y <= y1; y += 1) {
      if (y < 0 || y >= n) continue;
      tiles.push({
        z: z,
        x: wrapped,
        y: y,
        left: (x * 256 - origin.x) * scale + width / 2,
        top: (y * 256 - origin.y) * scale + height / 2,
        size: 256 * scale
      });
    }
  }
  return tiles;
}
`;

interface SlippyApi {
  lngLatToWorld: (lng: number, lat: number, zoom: number) => { x: number; y: number };
  worldToLngLat: (x: number, y: number, zoom: number) => LngLat;
  screenPoint: (target: LngLat, center: LngLat, zoom: number, width: number, height: number) => ScreenPoint;
  visibleTiles: (center: LngLat, zoom: number, width: number, height: number) => TileSpec[];
}

function loadSlippy(): SlippyApi {
  const fn = new Function(`${slippyRuntime} return { lngLatToWorld, worldToLngLat, screenPoint, visibleTiles };`);
  return fn() as SlippyApi;
}

const api = loadSlippy();

export const lngLatToWorld = api.lngLatToWorld;
export const worldToLngLat = api.worldToLngLat;
export const screenPoint = api.screenPoint;
export const visibleTiles = api.visibleTiles;
