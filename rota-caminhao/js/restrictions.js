/*
 * Restrições de ruas para caminhão a partir das marcações do OpenStreetMap
 * (altura, largura, comprimento, peso, eixo, proibição para caminhão).
 * Sem DOM: testável no Node.
 */
(function (root, factory) {
  const mod = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else { root.RC = root.RC || {}; root.RC.restrictions = mod; }
})(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  const geo = (root.RC && root.RC.geo) || (typeof require === 'function' ? require('./geo.js') : null);

  const fmt = (v) => String(Math.round(v * 100) / 100).replace('.', ',');

  /** "4.5", "4,5 m", "14'6\"" -> metros; "none"/"default" -> null */
  function parseMeters(value) {
    if (value == null) return null;
    const s = String(value).trim().toLowerCase();
    const ft = s.match(/^(\d+(?:\.\d+)?)\s*'\s*(?:(\d+(?:\.\d+)?)\s*")?$/);
    if (ft) return Number(ft[1]) * 0.3048 + Number(ft[2] || 0) * 0.0254;
    const m = s.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(m|metros?)?$/);
    return m ? Number(m[1]) : null;
  }

  /** "10", "10 t", "10000 kg" -> toneladas */
  function parseTonnes(value) {
    if (value == null) return null;
    const s = String(value).trim().toLowerCase().replace(',', '.');
    const m = s.match(/^(\d+(?:\.\d+)?)\s*(t|ton|tons|toneladas?|kg)?$/);
    if (!m) return null;
    return m[2] === 'kg' ? Number(m[1]) / 1000 : Number(m[1]);
  }

  /**
   * Avalia uma rua (tags do OSM) para um caminhão.
   * Retorna null (pode passar) ou { status, reasons } com
   * status: 'blocked' (proibida), 'destination' (só carga/descarga) ou 'conditional' (por horário).
   */
  function evaluate(tags, truck) {
    if (!tags) return null;
    const reasons = [];
    let sign = ''; // texto da placa no mapa (ex.: "4,3 m")
    const limit = (keys, parse, actual, label, unit) => {
      for (const k of keys) {
        const max = parse(tags[k]);
        if (max != null && actual > max) {
          reasons.push(`${label} máx. ${fmt(max)} ${unit} (seu caminhão: ${fmt(actual)} ${unit})`);
          if (!sign) sign = `${fmt(max)} ${unit}`;
          return;
        }
      }
    };
    limit(['maxheight', 'maxheight:physical'], parseMeters, truck.height, 'Altura', 'm');
    limit(['maxwidth', 'maxwidth:physical'], parseMeters, truck.width, 'Largura', 'm');
    limit(['maxlength', 'maxlength:hgv'], parseMeters, truck.length, 'Comprimento', 'm');
    limit(['maxweight:hgv', 'maxweight'], parseTonnes, truck.weight, 'Peso', 't');
    limit(['maxaxleload'], parseTonnes, truck.weight / Math.max(1, truck.axles), 'Peso por eixo', 't');

    const hgv = String(tags.hgv || '').toLowerCase();
    if (hgv === 'no' || hgv === 'private') reasons.push('Proibido para caminhões');
    if (truck.hazmat && String(tags.hazmat || '').toLowerCase() === 'no') reasons.push('Proibido para carga perigosa');

    if (reasons.length) return { status: 'blocked', reasons, sign: sign || '⛔' };

    if (hgv === 'destination' || hgv === 'delivery' || hgv === 'local') {
      return { status: 'destination', reasons: ['Caminhão só para carga e descarga nesta rua'] };
    }
    const cond = tags['hgv:conditional'] || tags['maxweight:conditional'] || tags['maxlength:conditional'];
    if (cond && /\bno\b|@/.test(String(cond))) {
      return { status: 'conditional', reasons: [describeConditional(cond)] };
    }
    if (hgv === 'permit') return { status: 'conditional', reasons: ['Caminhão só com autorização especial'] };
    if (hgv === 'discouraged') return { status: 'conditional', reasons: ['Via não recomendada para caminhões'] };
    return null;
  }

  const DAYS = { Mo: 'seg', Tu: 'ter', We: 'qua', Th: 'qui', Fr: 'sex', Sa: 'sáb', Su: 'dom', PH: 'feriados' };

  /** "no @ (Mo-Fr 05:00-21:00; Sa 10:00-14:00)" -> "Proibida seg–sex 05:00–21:00; sáb 10:00–14:00" */
  function describeConditional(cond) {
    const m = String(cond).match(/^\s*no\s*@\s*\(?(.*?)\)?\s*$/i);
    if (!m) return `Restrição por horário: ${cond}`;
    const when = m[1]
      .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d])
      .replace(/(\d{2}:\d{2})-(\d{2}:\d{2})/g, '$1–$2')
      .replace(/([a-zá]{3})-([a-zá]{3})/g, '$1–$2')
      .replace(/,/g, ', ');
    return `Proibida ${when}`;
  }

  /**
   * Rua mais próxima do ponto e o trecho dela num raio de `keepMeters`,
   * para desenhar o alerta como um pedaço de rua tracejado.
   */
  function nearestWaySegment(ways, pt, keepMeters = 120, maxDist = 40) {
    let best = null;
    for (const w of ways) {
      const near = geo.nearestOnShape(w.shape, pt);
      if (near.dist <= maxDist && (!best || near.dist < best.near.dist)) best = { way: w, near };
    }
    if (!best) return null;
    const shape = best.way.shape;
    const i = best.near.index;
    const out = [best.near.point];
    // anda para trás e para frente até a distância limite
    let d = 0;
    for (let k = i; k >= 0; k--) {
      d += geo.haversine(out[0], shape[k]);
      if (d > keepMeters) break;
      out.unshift(shape[k]);
    }
    d = 0;
    for (let k = i + 1; k < shape.length; k++) {
      d += geo.haversine(out[out.length - 1], shape[k]);
      if (d > keepMeters) break;
      out.push(shape[k]);
    }
    const t = best.way.tags;
    return { street: t.name || t.ref || '', shape: out.map(([a, b]) => [Math.round(a * 1e6) / 1e6, Math.round(b * 1e6) / 1e6]) };
  }

  return { parseMeters, parseTonnes, evaluate, describeConditional, nearestWaySegment };
});
