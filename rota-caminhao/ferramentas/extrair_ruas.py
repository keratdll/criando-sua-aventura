#!/usr/bin/env python3
"""
Extrai do mapa do OpenStreetMap (arquivo .osm.pbf) as ruas com alguma
marcação de restrição para caminhão (altura, largura, comprimento, peso,
proibição...) dentro da Grande São Paulo + Baixada Santista.

Uso:
    pip install osmium
    curl -O https://download.openstreetmap.fr/extracts/south-america/brazil/southeast/sao-paulo.osm.pbf
    python3 ferramentas/extrair_ruas.py sao-paulo.osm.pbf /tmp/ruas-brutas.json
    node ferramentas/compactar_ruas.js /tmp/ruas-brutas.json dados/ruas-restritas.json

Duas passadas para usar pouca memória: 1) acha as ruas e os pontos que
elas usam; 2) pega as coordenadas só desses pontos.
"""
import json
import sys

import osmium

# Mesmo recorte e mesmas listas do app (js/config.js e js/restrictions.js).
SUL, OESTE, NORTE, LESTE = -24.35, -47.25, -23.15, -45.65
ROAD_TYPES = set((
    'motorway motorway_link trunk trunk_link primary primary_link secondary secondary_link '
    'tertiary tertiary_link unclassified residential living_street service road'
).split())
TAG_KEYS = (
    'maxheight maxheight:physical maxwidth maxwidth:physical maxlength maxlength:hgv '
    'maxweight maxweight:hgv maxaxleload hgv hgv:conditional maxweight:conditional '
    'maxlength:conditional hazmat'
).split()
KEEP_TAGS = set(TAG_KEYS) | {'name', 'ref', 'highway'}


class Ruas(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.ways = []
        self.node_ids = set()

    def way(self, w):
        if w.tags.get('highway') not in ROAD_TYPES:
            return
        if not any(k in w.tags for k in TAG_KEYS):
            return
        refs = [n.ref for n in w.nodes]
        tags = {t.k: t.v for t in w.tags if t.k in KEEP_TAGS}
        self.ways.append((w.id, tags, refs))
        self.node_ids.update(refs)


class Pontos(osmium.SimpleHandler):
    def __init__(self, wanted):
        super().__init__()
        self.wanted = wanted
        self.coords = {}

    def node(self, n):
        if n.id in self.wanted:
            self.coords[n.id] = (round(n.location.lat, 5), round(n.location.lon, 5))


def main(pbf, out):
    ruas = Ruas()
    ruas.apply_file(pbf)
    pontos = Pontos(ruas.node_ids)
    pontos.apply_file(pbf)

    result = []
    for wid, tags, refs in ruas.ways:
        shape = [pontos.coords[r] for r in refs if r in pontos.coords]
        if len(shape) < 2:
            continue
        # mantém só ruas que tocam o recorte da região
        if not any(SUL <= la <= NORTE and OESTE <= lo <= LESTE for la, lo in shape):
            continue
        result.append({'id': wid, 'tags': tags, 'shape': shape})

    with open(out, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False)
    print(f'{len(result)} ruas com marcações na região (de {len(ruas.ways)} no estado)')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
