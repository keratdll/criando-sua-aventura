// Testes das restrições de ruas (marcações do OpenStreetMap).
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../js/restrictions.js');

const toco = { nome: 'Toco', height: 4.0, width: 2.6, length: 9.5, weight: 16, axles: 2 };
const truck = { nome: 'Truck', height: 4.2, width: 2.6, length: 12.5, weight: 23, axles: 3 };
const carreta = { nome: 'Carreta', height: 4.4, width: 2.6, length: 18.6, weight: 41.5, axles: 5, hazmat: true };

test('lê alturas e pesos em vários formatos', () => {
  assert.equal(R.parseMeters('4.5'), 4.5);
  assert.equal(R.parseMeters('4,2 m'), 4.2);
  assert.ok(Math.abs(R.parseMeters("14'6\"") - 4.42) < 0.01);
  assert.equal(R.parseMeters('default'), null);
  assert.equal(R.parseMeters('none'), null);
  assert.equal(R.parseTonnes('10 t'), 10);
  assert.equal(R.parseTonnes('12000 kg'), 12);
  assert.equal(R.parseTonnes('abc'), null);
});

test('viaduto de 4,3 m: carreta (4,4 m) não passa, truck (4,2 m) passa', () => {
  const tags = { highway: 'primary', maxheight: '4.3' };
  const ev = R.evaluate(tags, carreta);
  assert.equal(ev.status, 'blocked');
  assert.match(ev.reasons[0], /Altura máx\. 4,3 m/);
  assert.equal(R.evaluate(tags, truck), null);
});

test('rua com comprimento máximo de 10 m: só o toco passa', () => {
  const tags = { highway: 'residential', maxlength: '10' };
  assert.equal(R.evaluate(tags, toco), null);
  assert.equal(R.evaluate(tags, truck).status, 'blocked');
  assert.equal(R.evaluate(tags, carreta).status, 'blocked');
});

test('limite de peso e proibição de caminhões', () => {
  assert.equal(R.evaluate({ maxweight: '20' }, toco), null);
  assert.equal(R.evaluate({ maxweight: '20' }, truck).status, 'blocked');
  assert.equal(R.evaluate({ hgv: 'no' }, toco).status, 'blocked');
  assert.equal(R.evaluate({ hgv: 'destination' }, toco).status, 'destination');
  assert.equal(R.evaluate({ 'hgv:conditional': 'no @ (Mo-Fr 05:00-21:00)' }, toco).status, 'conditional');
  assert.equal(R.evaluate({ hazmat: 'no' }, toco), null);
  assert.equal(R.evaluate({ hazmat: 'no' }, carreta).status, 'blocked');
  assert.equal(R.evaluate({ hgv: 'yes', maxheight: 'default' }, carreta), null);
});

test('consulta Overpass inclui a área e as marcações', () => {
  const q = R.overpassQuery(-23.56, -46.66, -23.53, -46.62);
  assert.match(q, /\(-23\.56000,-46\.66000,-23\.53000,-46\.62000\)/);
  for (const k of ['maxheight', 'maxlength', 'maxweight', 'hgv']) assert.ok(q.includes(k), k);
});

test('converte resposta do Overpass e acha o trecho da rua mais próxima', () => {
  const json = {
    elements: [
      { type: 'way', id: 1, tags: { name: 'Rua A' }, geometry: [{ lat: -23.5, lon: -46.6 }, { lat: -23.5, lon: -46.595 }, { lat: -23.5, lon: -46.59 }] },
      { type: 'way', id: 2, tags: { name: 'Rua B' }, geometry: [{ lat: -23.51, lon: -46.6 }, { lat: -23.51, lon: -46.59 }] },
      { type: 'node', id: 3 },
    ],
  };
  const ways = R.parseOverpass(json);
  assert.equal(ways.length, 2);
  const seg = R.nearestWaySegment(ways, [-23.5001, -46.595], 120, 40);
  assert.equal(seg.street, 'Rua A');
  assert.ok(seg.shape.length >= 2);
  assert.equal(R.nearestWaySegment(ways, [-23.505, -46.595], 120, 40), null, 'longe das duas ruas');
});

test('blocos de ~2 km: cobre a área e só busca o que falta', () => {
  const cells = R.cellsForBox([-23.535, -46.645, -23.515, -46.625]);
  assert.ok(cells.length >= 1 && cells.length <= 4, cells.length);
  const box = R.boxForCells(cells);
  assert.ok(box[0] <= -23.535 && box[2] >= -23.515 && box[1] <= -46.645 && box[3] >= -46.625, JSON.stringify(box));
  // mesma área deslocada um pouco usa os mesmos blocos
  const again = R.cellsForBox([-23.534, -46.644, -23.516, -46.626]).map((c) => c.key);
  assert.ok(again.every((k) => cells.some((c) => c.key === k)));
});

test('consulta única com as marcações e sem escapes', () => {
  const q = R.overpassQuery(-23.56, -46.66, -23.53, -46.62);
  assert.ok(q.includes('maxheight|maxheight:physical'));
  assert.ok(!q.includes('\\'));
  assert.equal((q.match(/way\[/g) || []).length, 1);
});
