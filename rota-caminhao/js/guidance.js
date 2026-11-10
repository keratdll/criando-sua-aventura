/*
 * Orientação durante a navegação: dada a posição do GPS e o trecho atual,
 * descobre a próxima manobra, a distância até ela e se o motorista saiu da rota.
 */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.RC = root.RC || {}; root.RC.guidance = mod; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const geo = (root.RC && root.RC.geo) || (typeof require === 'function' ? require('./geo.js') : null);

  /**
   * @param leg { shape: [[lat,lon]], maneuvers: [{begin_shape_index, end_shape_index, ...}] }
   * @param pos [lat, lon]
   * @returns { offRoute, distFromRoute, maneuver, nextManeuver, distToNext, distToEnd, index, t }
   */
  function progress(leg, pos) {
    const shape = leg.shape;
    const near = geo.nearestOnShape(shape, pos);
    const idx = near.index;

    // Manobra em andamento = a última cujo início está antes da posição atual.
    let current = 0;
    for (let i = 0; i < leg.maneuvers.length; i++) {
      if (leg.maneuvers[i].begin_shape_index <= idx) current = i; else break;
    }
    const next = leg.maneuvers[current + 1] || null;

    const segLen = idx < shape.length - 1 ? geo.haversine(shape[idx], shape[idx + 1]) : 0;
    const doneInSeg = segLen * near.t;
    const distTo = (target) => Math.max(0, geo.distanceAlong(shape, idx, target) - doneInSeg);

    return {
      offRoute: near.dist > 70,
      distFromRoute: near.dist,
      index: idx,
      t: near.t,
      maneuver: leg.maneuvers[current],
      maneuverIndex: current,
      nextManeuver: next,
      distToNext: next ? distTo(next.begin_shape_index) : distTo(shape.length - 1),
      distToEnd: distTo(shape.length - 1),
    };
  }

  return { progress };
});
