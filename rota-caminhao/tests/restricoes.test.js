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

test('acha o trecho da rua mais próxima', () => {
  const ways = [
    { tags: { name: 'Rua A' }, shape: [[-23.5, -46.6], [-23.5, -46.595], [-23.5, -46.59]] },
    { tags: { name: 'Rua B' }, shape: [[-23.51, -46.6], [-23.51, -46.59]] },
  ];
  const seg = R.nearestWaySegment(ways, [-23.5001, -46.595], 120, 40);
  assert.equal(seg.street, 'Rua A');
  assert.ok(seg.shape.length >= 2);
  assert.equal(R.nearestWaySegment(ways, [-23.505, -46.595], 120, 40), null, 'longe das duas ruas');
});

test('horários e outros valores de restrição', () => {
  assert.equal(R.describeConditional('no @ (Mo-Fr 05:00-21:00; Sa 10:00-14:00)'), 'Proibida seg–sex 05:00–21:00; sáb 10:00–14:00');
  assert.equal(R.evaluate({ hgv: 'permit' }, toco).status, 'conditional');
  assert.equal(R.evaluate({ hgv: 'local' }, toco).status, 'destination');
  assert.equal(R.evaluate({ hgv: 'designated' }, carreta), null);
});

test('arquivo de ruas da região: formato e quantidade por caminhão', () => {
  const data = require('../dados/ruas-restritas.json');
  assert.ok(data.ways.length > 500, data.ways.length);
  const [id, tags, flat] = data.ways[0];
  assert.ok(Number.isInteger(id) && typeof tags === 'object' && flat.length >= 4 && flat.length % 2 === 0);
  const count = (t) => data.ways.filter((w) => R.evaluate(w[1], t)).length;
  const nToco = count(toco); const nTruck = count(truck); const nCarreta = count(carreta);
  assert.ok(nToco > 0 && nToco <= nTruck && nTruck <= nCarreta, `${nToco} ${nTruck} ${nCarreta}`);
  // todas as coordenadas dentro (ou perto) da Grande SP + Baixada
  for (const w of data.ways) for (let i = 0; i < w[2].length; i += 2) {
    assert.ok(w[2][i] > -24.6 && w[2][i] < -22.9 && w[2][i + 1] > -47.5 && w[2][i + 1] < -45.4);
  }
});
