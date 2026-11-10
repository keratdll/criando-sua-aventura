/*
 * Acesso aos serviços externos:
 *  - Valhalla (rota de caminhão com altura/peso/largura/comprimento)
 *  - ViaCEP (CEP -> endereço)
 *  - Nominatim/OpenStreetMap (endereço -> coordenadas e vice-versa)
 */
(function (root) {
  'use strict';
  const RC = root.RC;
  const cfg = RC.config;
  const geo = RC.geo;

  class ServiceError extends Error {
    constructor(message, detail) { super(message); this.detail = detail; }
  }

  async function fetchJson(url, timeoutMs = 30000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      let data = null;
      try { data = await res.json(); } catch (_) { /* resposta sem JSON */ }
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      if (err.name === 'AbortError') throw new ServiceError('O serviço demorou demais para responder. Tente de novo.');
      throw new ServiceError('Sem conexão com a internet ou serviço indisponível.', err);
    } finally {
      clearTimeout(timer);
    }
  }

  /* ---------------------------- Rotas (Valhalla) ---------------------------- */

  function truckCosting(truck, opts) {
    return {
      height: truck.height,
      width: truck.width,
      length: truck.length,
      weight: truck.weight,
      axle_count: truck.axles,
      // Peso por eixo aproximado, limitado a 10 t (eixo simples).
      axle_load: Math.min(10, Math.round((truck.weight / truck.axles) * 100) / 100),
      hazmat: !!truck.hazmat,
      use_tolls: opts.avoidTolls ? 0 : 0.5,
      use_highways: 0.8, // caminhão prefere vias principais
    };
  }

  function friendlyRouteError(data) {
    const code = data && data.error_code;
    if (code === 442 || code === 443) {
      return 'Não existe rota possível para este caminhão. Alguma restrição (altura, peso, rua proibida ou um ponto que você marcou para evitar) bloqueia o acesso a uma das paradas.';
    }
    if (code === 171 || code === 170) {
      return 'Uma das paradas fica longe de qualquer rua onde este caminhão pode passar. Confira o endereço.';
    }
    if (code === 167) return 'Há pontos demais marcados para evitar. Apague alguns na aba "Alertas".';
    if (code === 154 || code === 150) return 'A rota está longa demais para o servidor gratuito. Divida as entregas em duas rotas.';
    return (data && data.error) ? `Erro ao calcular a rota: ${data.error}` : 'Erro ao calcular a rota.';
  }

  function normalizeTrip(trip) {
    const legs = trip.legs.map((leg) => ({
      shape: geo.decodePolyline(leg.shape, 6),
      maneuvers: leg.maneuvers,
      meters: leg.summary.length * 1000,
      seconds: leg.summary.time,
    }));
    return {
      legs,
      meters: trip.summary.length * 1000,
      seconds: trip.summary.time,
      hasToll: !!trip.summary.has_toll,
      hasHighway: !!trip.summary.has_highway,
      shape: legs.flatMap((l) => l.shape),
    };
  }

  /**
   * Calcula a rota passando pelos pontos na ordem dada.
   * Retorna uma lista de trajetos: [principal, ...alternativas].
   */
  async function route(points, truck, opts = {}) {
    const body = {
      locations: points.map((p) => ({ lat: p.lat, lon: p.lon, type: 'break' })),
      costing: 'truck',
      costing_options: { truck: truckCosting(truck, opts) },
      language: 'pt-BR',
      units: 'kilometers',
    };
    if (opts.exclude && opts.exclude.length) body.exclude_polygons = opts.exclude;
    // O Valhalla só gera alternativas para rotas com 2 pontos.
    if (opts.alternates && points.length === 2) body.alternates = opts.alternates;

    const url = `${cfg.valhallaUrl}/route?json=${encodeURIComponent(JSON.stringify(body))}`;
    const res = await fetchJson(url);
    if (!res.ok || !res.data || !res.data.trip) throw new ServiceError(friendlyRouteError(res.data), res.data);
    const trips = [res.data.trip, ...(res.data.alternates || []).map((a) => a.trip)];
    return trips.map(normalizeTrip);
  }

  /**
   * Sugere a melhor ordem das paradas (o primeiro e o último ponto ficam fixos).
   * Retorna a lista de índices originais na nova ordem.
   */
  async function optimizeOrder(points, truck, opts = {}) {
    const body = {
      locations: points.map((p) => ({ lat: p.lat, lon: p.lon })),
      costing: 'truck',
      costing_options: { truck: truckCosting(truck, opts) },
      units: 'kilometers',
    };
    if (opts.exclude && opts.exclude.length) body.exclude_polygons = opts.exclude;
    const url = `${cfg.valhallaUrl}/optimized_route?json=${encodeURIComponent(JSON.stringify(body))}`;
    const res = await fetchJson(url, 45000);
    if (!res.ok || !res.data || !res.data.trip) throw new ServiceError(friendlyRouteError(res.data), res.data);
    return res.data.trip.locations.map((l) => l.original_index);
  }

  /* ------------------------- Endereços (CEP / OSM) ------------------------- */

  // O Nominatim pede no máximo 1 requisição por segundo: fila simples.
  let lastNominatim = 0;
  async function nominatim(path, params) {
    const wait = lastNominatim + 1100 - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastNominatim = Date.now();
    const qs = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'pt-BR', ...params });
    const res = await fetchJson(`${cfg.nominatimUrl}/${path}?${qs}`, 15000);
    if (!res.ok) throw new ServiceError('A busca de endereços está indisponível agora. Tente em instantes.');
    return res.data;
  }

  function shortLabel(item) {
    const a = item.address || {};
    const street = a.road || a.pedestrian || a.industrial || a.commercial || item.name || '';
    const number = a.house_number ? `, ${a.house_number}` : '';
    const area = a.suburb || a.neighbourhood || a.quarter || a.city_district || '';
    const city = a.city || a.town || a.municipality || a.village || '';
    const first = item.name && item.name !== street ? `${item.name} – ` : '';
    const parts = [`${first}${street}${number}`.trim(), area, city].filter(Boolean);
    return parts.length ? parts.join(' · ') : item.display_name;
  }

  function toResults(list) {
    return (list || []).map((i) => ({
      label: shortLabel(i),
      full: i.display_name,
      lat: Number(i.lat),
      lon: Number(i.lon),
    }));
  }

  const CEP_RE = /^\s*(\d{5})-?(\d{3})\s*(?:[,\s]+(?:n[ºo°.]?\s*)?(\d+[a-zA-Z]?))?\s*$/;

  async function lookupCep(cep, number) {
    const res = await fetchJson(`${cfg.viacepUrl}/${cep}/json/`, 12000);
    if (!res.ok || !res.data || res.data.erro) throw new ServiceError(`CEP ${cep.slice(0, 5)}-${cep.slice(5)} não encontrado.`);
    const c = res.data;
    const vb = cfg.regionViewbox.join(',');
    const street = c.logradouro ? `${number ? number + ' ' : ''}${c.logradouro}` : '';
    // 1) Busca estruturada pela rua + cidade
    let found = [];
    if (street) {
      found = await nominatim('search', {
        street, city: c.localidade, state: c.uf, country: 'Brasil', limit: 5, addressdetails: 1,
      });
    }
    // 2) Busca livre por rua, bairro e cidade
    if (!found.length) {
      found = await nominatim('search', {
        q: [c.logradouro, c.bairro, c.localidade, c.uf].filter(Boolean).join(', '),
        countrycodes: 'br', viewbox: vb, limit: 5, addressdetails: 1,
      });
    }
    // 3) Pelo próprio CEP
    if (!found.length) {
      found = await nominatim('search', { postalcode: `${cep.slice(0, 5)}-${cep.slice(5)}`, country: 'Brasil', limit: 5, addressdetails: 1 });
    }
    const label = `${c.logradouro || c.bairro || c.localidade}${number ? ', ' + number : ''} · ${c.localidade}`;
    if (!found.length) throw new ServiceError(`Achamos o CEP (${label}), mas não a posição no mapa. Tente digitar o endereço ou toque no mapa.`);
    // Mantém o rótulo amigável vindo do CEP para o primeiro resultado.
    const results = toResults(found);
    results[0] = { ...results[0], label: `${label} (CEP ${c.cep})` };
    return results;
  }

  /** Busca por CEP ("01310-100" ou "01310-100, 1000") ou por endereço livre. */
  async function searchAddress(text) {
    const q = text.trim();
    if (!q) return [];
    const m = q.match(CEP_RE);
    if (m) return lookupCep(m[1] + m[2], m[3]);

    const vb = cfg.regionViewbox.join(',');
    let found = await nominatim('search', {
      q, countrycodes: 'br', viewbox: vb, bounded: 1, limit: 6, addressdetails: 1,
    });
    if (!found.length) {
      found = await nominatim('search', { q, countrycodes: 'br', viewbox: vb, limit: 6, addressdetails: 1 });
    }
    if (!found.length) throw new ServiceError('Endereço não encontrado. Tente incluir número, bairro e cidade, ou use o CEP.');
    return toResults(found);
  }

  async function reverse(lat, lon) {
    try {
      const item = await nominatim('reverse', { lat, lon, zoom: 18, addressdetails: 1 });
      if (item && !item.error) return shortLabel(item);
    } catch (_) { /* sem nome: usa coordenadas */ }
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }

  RC.services = { route, optimizeOrder, searchAddress, reverse, ServiceError, CEP_RE };
})(typeof self !== 'undefined' ? self : this);
