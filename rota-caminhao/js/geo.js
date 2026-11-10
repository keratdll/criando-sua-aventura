/*
 * Funções geográficas puras (sem DOM). Funcionam no navegador (RC.geo)
 * e no Node (require) para os testes.
 */
(function (root, factory) {
  const mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.RC = root.RC || {}; root.RC.geo = mod; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const R = 6371008.8; // raio médio da Terra em metros
  const toRad = (d) => (d * Math.PI) / 180;

  /** Decodifica polyline do Valhalla (precisão 6) em [[lat, lon], ...]. */
  function decodePolyline(str, precision = 6) {
    const factor = Math.pow(10, precision);
    const out = [];
    let index = 0, lat = 0, lon = 0;
    while (index < str.length) {
      for (const which of [0, 1]) {
        let result = 0, shift = 0, b;
        do {
          b = str.charCodeAt(index++) - 63;
          result |= (b & 0x1f) << shift;
          shift += 5;
        } while (b >= 0x20);
        const delta = result & 1 ? ~(result >> 1) : result >> 1;
        if (which === 0) lat += delta; else lon += delta;
      }
      out.push([lat / factor, lon / factor]);
    }
    return out;
  }

  /** Distância em metros entre [lat, lon] e [lat, lon]. */
  function haversine(a, b) {
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /** Ponto [lat, lon] dentro do polígono [[lat, lon], ...] (ray casting). */
  function pointInPolygon(pt, poly) {
    const [y, x] = pt;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i];
      const [yj, xj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  /**
   * Quadrado de lado 2*halfMeters em volta do ponto, no formato do Valhalla
   * (anel fechado de [lon, lat]).
   */
  function squareAround(lat, lon, halfMeters) {
    const dLat = (halfMeters / R) * (180 / Math.PI);
    const dLon = dLat / Math.cos(toRad(lat));
    const r = (v) => Math.round(v * 1e6) / 1e6;
    return [
      [r(lon - dLon), r(lat - dLat)],
      [r(lon + dLon), r(lat - dLat)],
      [r(lon + dLon), r(lat + dLat)],
      [r(lon - dLon), r(lat + dLat)],
      [r(lon - dLon), r(lat - dLat)],
    ];
  }

  /** Perímetro em metros de um anel [lon, lat]. */
  function ringPerimeter(ring) {
    let p = 0;
    for (let i = 1; i < ring.length; i++) {
      p += haversine([ring[i - 1][1], ring[i - 1][0]], [ring[i][1], ring[i][0]]);
    }
    return p;
  }

  /**
   * Projeta o ponto no segmento a-b (projeção plana local).
   * Retorna { t, dist } onde t ∈ [0,1] é a posição ao longo do segmento.
   */
  function projectOnSegment(p, a, b) {
    const k = Math.cos(toRad(p[0]));
    const ax = a[1] * k, ay = a[0], bx = b[1] * k, by = b[0], px = p[1] * k, py = p[0];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const q = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    return { t, dist: haversine(p, q), point: q };
  }

  /**
   * Encontra o segmento do trajeto mais próximo da posição.
   * Retorna { index (início do segmento), t, dist }.
   */
  function nearestOnShape(shape, p) {
    let best = { index: 0, t: 0, dist: Infinity };
    for (let i = 0; i < shape.length - 1; i++) {
      const r = projectOnSegment(p, shape[i], shape[i + 1]);
      if (r.dist < best.dist) best = { index: i, t: r.t, dist: r.dist, point: r.point };
    }
    if (shape.length === 1) best = { index: 0, t: 0, dist: haversine(p, shape[0]), point: shape[0] };
    return best;
  }

  /** Distância acumulada (m) ao longo do trajeto entre os índices i e j (i <= j). */
  function distanceAlong(shape, i, j) {
    let d = 0;
    for (let k = i; k < j && k < shape.length - 1; k++) d += haversine(shape[k], shape[k + 1]);
    return d;
  }

  /** Ponto do trajeto a `meters` metros à frente de (index, t). */
  function pointAhead(shape, index, t, meters) {
    if (!shape.length) return null;
    let i = index;
    let start = shape[i];
    if (i < shape.length - 1) {
      const a = shape[i], b = shape[i + 1];
      start = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    let remaining = meters;
    let cur = start;
    while (i < shape.length - 1) {
      const next = shape[i + 1];
      const seg = haversine(cur, next);
      if (seg >= remaining) {
        const f = seg ? remaining / seg : 0;
        return [cur[0] + (next[0] - cur[0]) * f, cur[1] + (next[1] - cur[1]) * f];
      }
      remaining -= seg;
      cur = next;
      i++;
    }
    return shape[shape.length - 1];
  }

  /** Caixa envolvente [[minLat, minLon], [maxLat, maxLon]] com margem em graus. */
  function bbox(points, marginDeg = 0) {
    let minLat = Infinity, minLon = Infinity, maxLat = -Infinity, maxLon = -Infinity;
    for (const [la, lo] of points) {
      minLat = Math.min(minLat, la); maxLat = Math.max(maxLat, la);
      minLon = Math.min(minLon, lo); maxLon = Math.max(maxLon, lo);
    }
    return [[minLat - marginDeg, minLon - marginDeg], [maxLat + marginDeg, maxLon + marginDeg]];
  }

  function inBbox(p, box) {
    return p[0] >= box[0][0] && p[0] <= box[1][0] && p[1] >= box[0][1] && p[1] <= box[1][1];
  }

  function formatDistance(m) {
    if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
    const km = m / 1000;
    return `${km < 10 ? km.toFixed(1).replace('.', ',') : Math.round(km)} km`;
  }

  function formatDuration(sec) {
    const min = Math.round(sec / 60);
    if (min < 60) return `${Math.max(1, min)} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
  }

  function formatClock(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Verifica se a data/hora cai na janela de restrição. `windows` é um mapa
   * dia-da-semana (0 = domingo) -> lista de [horaInicio, horaFim] em horas decimais.
   */
  function isWithinWindows(date, windows) {
    const list = windows[date.getDay()] || [];
    const h = date.getHours() + date.getMinutes() / 60;
    return list.some(([a, b]) => h >= a && h < b);
  }

  return {
    decodePolyline, haversine, pointInPolygon, squareAround, ringPerimeter,
    projectOnSegment, nearestOnShape, distanceAlong, pointAhead, bbox, inBbox,
    formatDistance, formatDuration, formatClock, isWithinWindows,
  };
});
