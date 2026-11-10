/*
 * Regras dos problemas reportados pelos motoristas (pontes baixas, ruas
 * estreitas, congestionamentos...). Sem DOM: testável no Node.
 */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.RC = root.RC || {}; root.RC.reports = mod; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const geo = (root.RC && root.RC.geo) || (typeof require === 'function' ? require('./geo.js') : null);

  /** O alerta ainda vale? (congestionamento e obras expiram) */
  function isActive(report, types, now = Date.now()) {
    const type = types[report.type];
    if (!type) return false;
    if (!type.ttlMinutes) return true;
    return now - report.createdAt < type.ttlMinutes * 60000;
  }

  /** O alerta afeta este caminhão? */
  function affectsTruck(report, truck) {
    const v = Number(report.value);
    const hasValue = report.value !== '' && report.value != null && !Number.isNaN(v) && v > 0;
    switch (report.type) {
      case 'ponte_baixa': return !hasValue || truck.height + 0.1 > v; // 10 cm de folga
      case 'peso': return !hasValue || truck.weight > v;
      case 'rua_estreita': return !hasValue || truck.length > v;
      default: return true;
    }
  }

  function minutesLeft(report, types, now = Date.now()) {
    const type = types[report.type];
    if (!type || !type.ttlMinutes) return null;
    return Math.max(0, Math.round((report.createdAt + type.ttlMinutes * 60000 - now) / 60000));
  }

  /**
   * Gera os polígonos de exclusão (formato Valhalla) para os alertas que valem
   * para o caminhão e ficam perto da rota. Respeita o limite de perímetro do
   * servidor, priorizando os alertas mais próximos do centro da rota.
   */
  function excludePolygons(reports, types, truck, box, opts) {
    const half = opts.halfMeters || 20;
    const maxPerimeter = opts.maxPerimeter || 9500;
    const now = opts.now || Date.now();
    const center = [(box[0][0] + box[1][0]) / 2, (box[0][1] + box[1][1]) / 2];
    const candidates = reports
      .filter((r) => isActive(r, types, now) && affectsTruck(r, truck))
      .filter((r) => geo.inBbox([r.lat, r.lon], box))
      .sort((a, b) => geo.haversine(center, [a.lat, a.lon]) - geo.haversine(center, [b.lat, b.lon]));

    const polygons = [];
    const used = [];
    let total = 0;
    for (const r of candidates) {
      const ring = geo.squareAround(r.lat, r.lon, half);
      const p = geo.ringPerimeter(ring);
      if (total + p > maxPerimeter) break;
      total += p;
      polygons.push(ring);
      used.push(r.id);
    }
    return { polygons, used, skipped: candidates.length - used.length };
  }

  return { isActive, affectsTruck, minutesLeft, excludePolygons };
});
