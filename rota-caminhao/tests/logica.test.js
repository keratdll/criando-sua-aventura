// Testes da lógica pura. Rode com: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const geo = require('../js/geo.js');
const reports = require('../js/reports.js');
const guidance = require('../js/guidance.js');

const TYPES = {
  ponte_baixa: { field: 'height' },
  peso: { field: 'weight' },
  rua_estreita: { field: 'length' },
  proibido: {},
  congestionamento: { ttlMinutes: 60 },
};
const carreta = { height: 4.4, width: 2.6, length: 18.6, weight: 41.5, axles: 5 };
const toco = { height: 3.6, width: 2.5, length: 9, weight: 16, axles: 2 };

test('decodifica polyline de precisão 6', () => {
  // Codificação de [[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]] com precisão 6.
  const pts = geo.decodePolyline('_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI', 6);
  assert.equal(pts.length, 3);
  assert.deepEqual(pts[0], [38.5, -120.2]);
  assert.deepEqual(pts[2], [43.252, -126.453]);
});

test('haversine: Praça da Sé → Santos ≈ 54 km em linha reta', () => {
  const d = geo.haversine([-23.5505, -46.6340], [-23.9608, -46.3336]);
  assert.ok(d > 52000 && d < 56000, d);
});

test('quadrado de exclusão fechado, em [lon, lat] e com perímetro esperado', () => {
  const ring = geo.squareAround(-23.5, -46.6, 20);
  assert.equal(ring.length, 5);
  assert.deepEqual(ring[0], ring[4]);
  assert.ok(ring[0][0] < -46.59 && ring[0][1] < -23.49, 'ordem lon, lat');
  const p = geo.ringPerimeter(ring);
  assert.ok(p > 150 && p < 170, p);
});

test('ponto no polígono', () => {
  const sq = [[0, 0], [0, 1], [1, 1], [1, 0]];
  assert.equal(geo.pointInPolygon([0.5, 0.5], sq), true);
  assert.equal(geo.pointInPolygon([1.5, 0.5], sq), false);
});

test('ponte baixa só afeta caminhão mais alto que a altura livre', () => {
  const r = { type: 'ponte_baixa', value: 4.0 };
  assert.equal(reports.affectsTruck(r, carreta), true);
  assert.equal(reports.affectsTruck(r, toco), false);
  assert.equal(reports.affectsTruck({ type: 'ponte_baixa', value: '' }, toco), true, 'sem altura = afeta todos');
  assert.equal(reports.affectsTruck({ type: 'peso', value: 20 }, toco), false);
  assert.equal(reports.affectsTruck({ type: 'peso', value: 20 }, carreta), true);
  assert.equal(reports.affectsTruck({ type: 'rua_estreita', value: 12 }, carreta), true);
  assert.equal(reports.affectsTruck({ type: 'proibido' }, toco), true);
});

test('congestionamento expira após 1 hora', () => {
  const now = Date.now();
  assert.equal(reports.isActive({ type: 'congestionamento', createdAt: now - 30 * 60000 }, TYPES, now), true);
  assert.equal(reports.isActive({ type: 'congestionamento', createdAt: now - 61 * 60000 }, TYPES, now), false);
  assert.equal(reports.isActive({ type: 'proibido', createdAt: 0 }, TYPES, now), true);
});

test('polígonos de exclusão respeitam região, caminhão e limite de perímetro', () => {
  const box = [[-24, -47], [-23, -46]];
  const list = [];
  for (let i = 0; i < 100; i++) list.push({ id: 'r' + i, type: 'proibido', lat: -23.5 + i * 0.001, lon: -46.5, createdAt: 0 });
  list.push({ id: 'longe', type: 'proibido', lat: -20, lon: -40, createdAt: 0 });
  list.push({ id: 'ponte', type: 'ponte_baixa', value: 4.0, lat: -23.5, lon: -46.6, createdAt: 0 });
  const out = reports.excludePolygons(list, TYPES, toco, box, { halfMeters: 20, maxPerimeter: 9500 });
  assert.ok(!out.used.includes('longe'));
  assert.ok(!out.used.includes('ponte'), 'ponte de 4 m não afeta toco de 3,6 m');
  const total = out.polygons.reduce((s, r) => s + geo.ringPerimeter(r), 0);
  assert.ok(total <= 9500, total);
  assert.ok(out.skipped > 0, 'deve avisar que alguns ficaram de fora');
});

test('janela de restrição da ZMRC', () => {
  const w = { 1: [[5, 21]], 6: [[10, 14]] };
  assert.equal(geo.isWithinWindows(new Date(2026, 10, 9, 8, 0), w), true);   // segunda 8h
  assert.equal(geo.isWithinWindows(new Date(2026, 10, 9, 22, 0), w), false); // segunda 22h
  assert.equal(geo.isWithinWindows(new Date(2026, 10, 14, 15, 0), w), false); // sábado 15h
  assert.equal(geo.isWithinWindows(new Date(2026, 10, 15, 12, 0), w), false); // domingo
});

test('orientação: próxima manobra, distância e saída de rota', () => {
  // Trajeto reto para o norte (~1,1 km) e depois para o leste.
  const shape = [[-23.60, -46.60], [-23.595, -46.60], [-23.59, -46.60], [-23.59, -46.595]];
  const leg = {
    shape,
    maneuvers: [
      { type: 1, instruction: 'Siga para o norte', begin_shape_index: 0 },
      { type: 10, instruction: 'Vire à direita', begin_shape_index: 2 },
      { type: 4, instruction: 'Chegada', begin_shape_index: 3 },
    ],
  };
  const p = guidance.progress(leg, [-23.597, -46.60]);
  assert.equal(p.offRoute, false);
  assert.equal(p.nextManeuver.instruction, 'Vire à direita');
  assert.ok(Math.abs(p.distToNext - 778) < 20, p.distToNext);
  assert.ok(p.distToEnd > p.distToNext);

  const off = guidance.progress(leg, [-23.597, -46.59]);
  assert.equal(off.offRoute, true);

  const ahead = geo.pointAhead(shape, p.index, p.t, 500);
  assert.ok(Math.abs(geo.haversine([-23.597, -46.60], ahead) - 500) < 5);
});
