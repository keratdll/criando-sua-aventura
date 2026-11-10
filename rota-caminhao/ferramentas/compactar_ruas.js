#!/usr/bin/env node
/*
 * Gera dados/ruas-restritas.json a partir da saída de extrair_ruas.py.
 * Mantém só as ruas que podem restringir ALGUM caminhão (usa a mesma regra
 * do app) e grava num formato compacto.
 *
 * Uso: node ferramentas/compactar_ruas.js /tmp/ruas-brutas.json dados/ruas-restritas.json
 */
const fs = require('fs');
const path = require('path');
const R = require('../js/restrictions.js');

const [, , input, output] = process.argv;
const raw = JSON.parse(fs.readFileSync(input, 'utf8'));

// "Pior caso" dentro dos limites do formulário do app.
const extremo = { height: 5, width: 3.2, length: 30, weight: 80, axles: 2, hazmat: true };

const ways = raw
  .filter((w) => R.evaluate(w.tags, extremo))
  .map((w) => [w.id, w.tags, w.shape.flat()]);

const data = {
  versao: 1,
  gerado: new Date().toISOString().slice(0, 10),
  fonte: '© colaboradores do OpenStreetMap (ODbL) — extrato openstreetmap.fr',
  ways,
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify(data));
console.log(`${ways.length} ruas gravadas em ${output} (${Math.round(fs.statSync(output).size / 1024)} KB)`);
