/* Rota Caminhão — lógica da interface. */
(function () {
  'use strict';
  const RC = window.RC;
  const cfg = RC.config;
  const geo = RC.geo;
  const svc = RC.services;
  const rep = RC.reports;

  /* =============================== Utilidades =============================== */

  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const fmtNum = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
  const isDesktop = () => window.matchMedia('(min-width: 900px)').matches;

  let toastTimer;
  function toast(msg, opts = {}) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (opts.error ? ' error' : '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, opts.ms || (opts.error ? 6000 : 3200));
  }

  function loading(on, text) {
    $('#loading').hidden = !on;
    if (text) $('#loading-text').textContent = text;
  }

  function errMsg(err) {
    return err instanceof svc.ServiceError ? err.message : 'Algo deu errado. Tente novamente.';
  }

  /* ============================ Estado e storage ============================ */

  const STORE_KEY = 'rotaCaminhao.v1';

  const state = {
    truckId: 'carreta',
    trucks: JSON.parse(JSON.stringify(cfg.truckPresets)),
    origin: null,          // { label, lat, lon, isGps }
    stops: [],             // { id, label, lat, lon, done }
    reports: [],           // { id, type, lat, lon, value, note, createdAt }
    options: { returnToOrigin: false, avoidTolls: false, voice: true, showZmrc: true, showRestrictions: true, tomtomKey: '' },
    // não persistidos:
    trips: [], selected: 0, routePoints: [], etas: {}, skippedReports: 0,
    mapMode: null,
    lastPos: null,
    nav: { active: false },
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s.truckId && cfg.truckPresets[s.truckId]) state.truckId = s.truckId;
      if (s.trucks) for (const id of Object.keys(cfg.truckPresets)) Object.assign(state.trucks[id], s.trucks[id] || {});
      if (s.origin) state.origin = s.origin;
      if (Array.isArray(s.stops)) state.stops = s.stops;
      if (Array.isArray(s.reports)) state.reports = s.reports;
      if (s.options) Object.assign(state.options, s.options);
    } catch (_) { /* armazenamento indisponível: segue com padrão */ }
  }

  function save() {
    try {
      const { truckId, trucks, origin, stops, reports, options } = state;
      localStorage.setItem(STORE_KEY, JSON.stringify({ truckId, trucks, origin, stops, reports, options }));
    } catch (_) { /* modo privado etc. */ }
  }

  const truck = () => state.trucks[state.truckId];
  const pendingStops = () => state.stops.filter((s) => !s.done);

  /* ================================== Mapa ================================== */

  const map = L.map('map', { zoomControl: false, attributionControl: true }).setView(cfg.mapCenter, cfg.mapZoom);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · rotas © Valhalla',
  }).addTo(map);
  map.createPane('traffic').style.zIndex = 350;
  map.createPane('restrictions').style.zIndex = 390; // abaixo da rota (400)
  const restrRenderer = L.canvas({ pane: 'restrictions', padding: 0.3 });

  const layers = {
    zmrc: L.polygon(cfg.zmrc.polygon, {
      color: '#dc2626', weight: 2, dashArray: '6 6', fillOpacity: 0.06, interactive: false,
    }),
    routes: L.layerGroup().addTo(map),
    reports: L.layerGroup().addTo(map),
    stops: L.layerGroup().addTo(map),
    me: null,
    traffic: null,
    restrictions: L.layerGroup().addTo(map),
  };

  function cssVar(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function pinIcon(cls, text) {
    return L.divIcon({ className: '', html: `<div class="pin ${cls}"><span>${esc(text)}</span></div>`, iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -30] });
  }

  function fitTo(latlngs) {
    if (!latlngs.length) return;
    const sheetH = $('#sheet').offsetHeight;
    const opts = isDesktop()
      ? { paddingTopLeft: [460, 40], paddingBottomRight: [40, 40] }
      : { paddingTopLeft: [24, 80], paddingBottomRight: [24, sheetH + 16] };
    map.fitBounds(L.latLngBounds(latlngs), { ...opts, maxZoom: 16 });
  }

  /* ================================= Gaveta ================================= */

  const sheet = $('#sheet');
  const SHEET_ORDER = ['collapsed', 'half', 'full'];
  function setSheet(s) { sheet.dataset.state = s; }

  (function sheetGestures() {
    const handle = $('#sheet-handle');
    let startY = null;
    handle.addEventListener('pointerdown', (e) => { startY = e.clientY; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener('pointerup', (e) => {
      if (startY == null) return;
      const dy = e.clientY - startY;
      startY = null;
      const i = SHEET_ORDER.indexOf(sheet.dataset.state);
      if (dy < -30) setSheet(SHEET_ORDER[Math.min(2, i + 1)]);
      else if (dy > 30) setSheet(SHEET_ORDER[Math.max(0, i - 1)]);
      else setSheet(SHEET_ORDER[(i + 1) % 3]);
    });
  })();

  function showTab(name) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${name}`));
    if (sheet.dataset.state === 'collapsed') setSheet('half');
  }
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => showTab(t.dataset.tab)));

  /* ================================ Caminhão ================================ */

  const TRUCK_SVG = {
    toco: '<svg viewBox="0 0 100 40"><rect x="4" y="6" width="58" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M62 14h16l10 9v7H62z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="33" r="5" fill="currentColor"/><circle cx="78" cy="33" r="5" fill="currentColor"/></svg>',
    truck: '<svg viewBox="0 0 100 40"><rect x="2" y="4" width="66" height="26" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M68 13h14l10 10v7H68z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="14" cy="33" r="5" fill="currentColor"/><circle cx="26" cy="33" r="5" fill="currentColor"/><circle cx="84" cy="33" r="5" fill="currentColor"/></svg>',
    carreta: '<svg viewBox="0 0 100 40"><rect x="1" y="4" width="72" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><path d="M76 12h11l10 10v8H76z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><circle cx="9" cy="33" r="4" fill="currentColor"/><circle cx="19" cy="33" r="4" fill="currentColor"/><circle cx="29" cy="33" r="4" fill="currentColor"/><circle cx="80" cy="33" r="4" fill="currentColor"/><circle cx="91" cy="33" r="4" fill="currentColor"/></svg>',
  };

  // Campo do formulário -> propriedade do caminhão ("length" não pode ser nome de
  // campo: form.elements.length é a quantidade de campos).
  const TRUCK_FIELDS = [['height', 'height'], ['width', 'width'], ['comprimento', 'length'], ['weight', 'weight'], ['axles', 'axles']];

  function renderTruck() {
    const t = truck();
    $('#truck-chip-label').textContent = `${t.nome} · ${fmtNum(t.height)} m · ${fmtNum(t.weight)} t`;
    $('#truck-cards').innerHTML = Object.values(state.trucks).map((tr) => `
      <button type="button" class="truck-card ${tr.id === state.truckId ? 'active' : ''}" data-id="${tr.id}" aria-pressed="${tr.id === state.truckId}">
        ${TRUCK_SVG[tr.id] || ''}
        <strong>${esc(tr.nome)}</strong>
        <small>${fmtNum(tr.height)} m alt.<br>${fmtNum(tr.weight)} t</small>
      </button>`).join('');
    const f = $('#truck-form');
    for (const [field, k] of TRUCK_FIELDS) f.elements[field].value = t[k];
    f.elements.hazmat.checked = !!t.hazmat;
  }

  $('#truck-cards').addEventListener('click', (e) => {
    const card = e.target.closest('.truck-card');
    if (!card) return;
    state.truckId = card.dataset.id;
    save(); renderTruck(); renderReports(); renderRestrictions(); routeInvalidated();
    toast(`Caminhão: ${truck().nome}`);
  });

  $('#truck-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    const t = truck();
    for (const [field, k] of TRUCK_FIELDS) {
      const v = Number(String(f.elements[field].value).replace(',', '.'));
      if (!Number.isFinite(v) || v <= 0) { toast('Confira as medidas.', { error: true }); return; }
      t[k] = k === 'axles' ? Math.round(v) : v;
    }
    t.hazmat = f.elements.hazmat.checked;
    save(); renderTruck(); renderReports(); renderRestrictions(); routeInvalidated();
    toast('Medidas salvas.');
  });

  $('#truck-reset').addEventListener('click', () => {
    state.trucks[state.truckId] = { ...cfg.truckPresets[state.truckId] };
    save(); renderTruck(); renderReports(); renderRestrictions(); routeInvalidated();
  });

  $('#truck-chip').addEventListener('click', () => { showTab('caminhao'); if (sheet.dataset.state === 'collapsed') setSheet('half'); });

  /* ========================== Partida e entregas ========================== */

  function renderStops() {
    const o = state.origin;
    const ol = $('#origin-label');
    ol.textContent = o ? o.label : 'Defina o ponto de partida';
    ol.classList.toggle('muted', !o);

    const list = $('#stops-list');
    $('#stops-empty').hidden = state.stops.length > 0;
    const pend = pendingStops().length;
    $('#stops-count').textContent = state.stops.length ? `(${pend} pendente${pend === 1 ? '' : 's'})` : '';

    let n = 0;
    list.innerHTML = state.stops.map((s, i) => {
      if (!s.done) n++;
      const eta = state.etas[s.id];
      return `
      <li class="stop ${s.done ? 'done' : ''}" data-id="${s.id}">
        <div class="stop-num">${s.done ? '✓' : n}</div>
        <div class="stop-text">
          <div class="stop-label">${esc(s.label)}</div>
          ${s.done ? '<div class="stop-eta">Entregue</div>' : eta ? `<div class="stop-eta">Chegada prevista ${geo.formatClock(eta)}</div>` : ''}
        </div>
        <div class="stop-tools">
          ${s.done
            ? '<button class="icon-btn" data-act="undo" aria-label="Marcar como pendente" title="Desfazer">↺</button>'
            : `<button class="icon-btn" data-act="up" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>↑</button>
               <button class="icon-btn" data-act="down" aria-label="Descer" ${i === state.stops.length - 1 ? 'disabled' : ''}>↓</button>`}
          <button class="icon-btn" data-act="del" aria-label="Remover">✕</button>
        </div>
      </li>`;
    }).join('');
    drawStops();
  }

  $('#stops-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.stop').dataset.id;
    const i = state.stops.findIndex((s) => s.id === id);
    if (i < 0) return;
    const act = btn.dataset.act;
    if (act === 'up' && i > 0) [state.stops[i - 1], state.stops[i]] = [state.stops[i], state.stops[i - 1]];
    if (act === 'down' && i < state.stops.length - 1) [state.stops[i + 1], state.stops[i]] = [state.stops[i], state.stops[i + 1]];
    if (act === 'del') state.stops.splice(i, 1);
    if (act === 'undo') state.stops[i].done = false;
    save(); routeInvalidated(); renderStops();
  });

  $('#stops-list').addEventListener('dblclick', (e) => {
    const li = e.target.closest('.stop');
    const s = li && state.stops.find((x) => x.id === li.dataset.id);
    if (s) map.setView([s.lat, s.lon], 17);
  });

  function addStop(place) {
    state.stops.push({ id: uid(), label: place.label, lat: place.lat, lon: place.lon, done: false });
    save(); routeInvalidated(); renderStops();
    toast(`Entrega ${pendingStops().length} adicionada.`);
    return state.stops[state.stops.length - 1];
  }

  function setOrigin(place) {
    state.origin = { label: place.label, lat: place.lat, lon: place.lon, isGps: !!place.isGps };
    save(); routeInvalidated(); renderStops();
  }

  function drawStops() {
    layers.stops.clearLayers();
    if (state.origin) {
      L.marker([state.origin.lat, state.origin.lon], { icon: pinIcon('pin-origin', 'P'), title: 'Partida' })
        .bindPopup(`<strong>Partida</strong><br>${esc(state.origin.label)}`).addTo(layers.stops);
    }
    let n = 0;
    for (const s of state.stops) {
      if (!s.done) n++;
      L.marker([s.lat, s.lon], { icon: pinIcon(s.done ? 'pin-done' : 'pin-stop', s.done ? '✓' : n), title: s.label })
        .bindPopup(`<strong>${s.done ? 'Entregue' : `Entrega ${n}`}</strong><br>${esc(s.label)}`).addTo(layers.stops);
    }
  }

  function getPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new svc.ServiceError('Este navegador não informa a localização.')); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve([p.coords.latitude, p.coords.longitude]),
        (err) => reject(new svc.ServiceError(err.code === 1
          ? 'Permita o acesso à localização nas configurações do navegador.'
          : 'Não foi possível obter sua localização agora.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    });
  }

  function showMe(pos) {
    state.lastPos = pos;
    if (!layers.me) {
      layers.me = L.marker(pos, {
        icon: L.divIcon({ className: '', html: '<div class="me-dot"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
        zIndexOffset: 1000, interactive: false,
      }).addTo(map);
    } else layers.me.setLatLng(pos);
  }

  $('#btn-origin-gps').addEventListener('click', async () => {
    try {
      loading(true, 'Buscando sua localização…');
      const pos = await getPosition();
      showMe(pos);
      setOrigin({ label: 'Minha localização', lat: pos[0], lon: pos[1], isGps: true });
      map.setView(pos, 15);
    } catch (err) { toast(errMsg(err), { error: true }); } finally { loading(false); }
  });

  $('#btn-locate').addEventListener('click', async () => {
    if (state.nav.active) { state.nav.userPanned = false; if (state.lastPos) map.setView(state.lastPos, 17); return; }
    try {
      const pos = await getPosition();
      showMe(pos);
      map.setView(pos, 16);
    } catch (err) { toast(errMsg(err), { error: true }); }
  });

  /* Busca por CEP ou endereço */
  const searchTarget = () => document.querySelector('input[name="target"]:checked').value;

  function useResult(place) {
    $('#search-results').hidden = true;
    $('#search-input').value = '';
    if (searchTarget() === 'origin') {
      setOrigin(place);
      document.querySelector('input[name="target"][value="stop"]').checked = true;
      toast('Partida definida.');
    } else addStop(place);
    map.setView([place.lat, place.lon], 15);
  }

  $('#search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = $('#search-input').value;
    if (!q.trim()) return;
    const btn = $('#search-btn');
    btn.disabled = true; btn.textContent = 'Buscando…';
    try {
      const results = await svc.searchAddress(q);
      if (results.length === 1) { useResult(results[0]); return; }
      const ul = $('#search-results');
      ul.innerHTML = results.map((r, i) => `<li><button type="button" data-i="${i}">${esc(r.label)}<small>${esc(r.full)}</small></button></li>`).join('');
      ul.hidden = false;
      ul.onclick = (ev) => {
        const b = ev.target.closest('button[data-i]');
        if (b) useResult(results[Number(b.dataset.i)]);
      };
    } catch (err) {
      toast(errMsg(err), { error: true });
    } finally {
      btn.disabled = false; btn.textContent = 'Adicionar';
    }
  });

  /* Opções */
  $('#opt-return').addEventListener('change', (e) => { state.options.returnToOrigin = e.target.checked; save(); routeInvalidated(); });
  $('#opt-tolls').addEventListener('change', (e) => { state.options.avoidTolls = e.target.checked; save(); routeInvalidated(); });

  /* ================================== Rota ================================== */

  function routeInvalidated() {
    if (state.nav.active) return; // durante a navegação a rota é recalculada pelos botões
    state.trips = []; state.etas = {};
    layers.routes.clearLayers();
    $('#route-result').hidden = true;
    $('#btn-calc').textContent = 'Calcular rota';
  }

  function excludeFor(points) {
    const box = geo.bbox(points.map((p) => [p.lat, p.lon]), 0.25);
    return rep.excludePolygons(state.reports, cfg.reportTypes, truck(), box, {
      halfMeters: cfg.excludeSquareHalfMeters, maxPerimeter: cfg.excludeMaxPerimeter,
    });
  }

  async function buildPoints(startOverride) {
    let start = startOverride;
    if (!start) {
      if (!state.origin) throw new svc.ServiceError('Defina o ponto de partida (CEP, endereço ou "Minha localização").');
      if (state.origin.isGps) {
        const pos = await getPosition();
        showMe(pos);
        state.origin = { ...state.origin, lat: pos[0], lon: pos[1] };
        save();
      }
      start = { lat: state.origin.lat, lon: state.origin.lon, label: state.origin.label, kind: 'origin' };
    }
    const pts = [start, ...pendingStops().map((s) => ({ lat: s.lat, lon: s.lon, label: s.label, kind: 'stop', stopId: s.id }))];
    if (state.options.returnToOrigin && state.origin) {
      pts.push({ lat: state.origin.lat, lon: state.origin.lon, label: `Volta: ${state.origin.label}`, kind: 'return' });
    }
    return pts;
  }

  async function calculate(opts = {}) {
    const startOverride = opts.from ? { lat: opts.from[0], lon: opts.from[1], label: 'Sua posição', kind: 'gps' } : null;
    try {
      if (!opts.silent) loading(true, 'Calculando rota para o caminhão…');
      const points = await buildPoints(startOverride);
      if (points.length < 2) throw new svc.ServiceError('Adicione pelo menos uma entrega.');
      const ex = excludeFor(points);
      const trips = await svc.route(points, truck(), {
        avoidTolls: state.options.avoidTolls,
        exclude: ex.polygons,
        alternates: opts.noAlternates ? 0 : 2,
      });
      state.trips = trips;
      state.selected = 0;
      state.routePoints = points;
      state.skippedReports = ex.skipped;
      showRoute(!opts.keepView);
      return true;
    } catch (err) {
      toast(errMsg(err), { error: true });
      return false;
    } finally {
      loading(false);
    }
  }

  $('#btn-calc').addEventListener('click', () => calculate());

  $('#btn-optimize').addEventListener('click', async () => {
    const pend = pendingStops();
    if (pend.length < 2) { toast('Precisa de pelo menos 2 entregas pendentes.'); return; }
    if (pend.length < 3 && !state.options.returnToOrigin) {
      toast('Com 2 entregas e sem volta, a melhor ordem é a do menor tempo: calcule as duas ordens trocando com ↑↓.', { ms: 5000 });
      return;
    }
    try {
      loading(true, 'Procurando a melhor ordem…');
      const points = await buildPoints();
      const order = await svc.optimizeOrder(points, truck(), { avoidTolls: state.options.avoidTolls, exclude: excludeFor(points).polygons });
      const newPending = order.map((i) => points[i]).filter((p) => p.kind === 'stop').map((p) => state.stops.find((s) => s.id === p.stopId));
      const done = state.stops.filter((s) => s.done);
      const changed = newPending.some((s, i) => s !== pend[i]);
      state.stops = [...done, ...newPending];
      save(); renderStops();
      loading(false);
      toast(changed
        ? (state.options.returnToOrigin ? 'Entregas reordenadas.' : 'Entregas reordenadas (a última entrega foi mantida no fim).')
        : 'A ordem atual já é a melhor.', { ms: 4500 });
      await calculate();
    } catch (err) {
      loading(false);
      toast(errMsg(err), { error: true });
    }
  });

  function showRoute(fit) {
    const trip = state.trips[state.selected];
    drawRoutes();
    computeEtas(trip);
    renderSummary(trip);
    renderWarnings(trip);
    renderInstructions(trip);
    renderStops();
    $('#route-result').hidden = false;
    $('#btn-calc').textContent = 'Recalcular rota';
    if (!state.nav.active && sheet.dataset.state === 'collapsed') setSheet('half');
    if (fit) {
      fitTo(trip.shape);
      $('#route-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function drawRoutes() {
    layers.routes.clearLayers();
    const routeColor = cssVar('--route') || '#1d4ed8';
    const casing = cssVar('--route-casing') || '#fff';
    const alt = cssVar('--alt-route') || '#7c8a84';
    state.trips.forEach((t, i) => {
      if (i === state.selected) return;
      const line = L.polyline(t.shape, { color: alt, weight: 6, opacity: 0.75 }).addTo(layers.routes);
      line.on('click', () => selectTrip(i));
      line.bindTooltip(`Alternativa: ${geo.formatDuration(t.seconds)} · ${geo.formatDistance(t.meters)}`, { sticky: true });
    });
    const t = state.trips[state.selected];
    L.polyline(t.shape, { color: casing, weight: 10, opacity: 0.9, interactive: false }).addTo(layers.routes);
    L.polyline(t.shape, { color: routeColor, weight: 6, opacity: 1, interactive: false }).addTo(layers.routes);
  }

  function selectTrip(i) {
    state.selected = i;
    showRoute(false);
  }

  function computeEtas(trip) {
    state.etas = {};
    let t = Date.now();
    trip.legs.forEach((leg, i) => {
      t += leg.seconds * 1000;
      const p = state.routePoints[i + 1];
      if (p && p.stopId) state.etas[p.stopId] = new Date(t);
    });
  }

  function renderSummary(trip) {
    $('#sum-time').textContent = geo.formatDuration(trip.seconds);
    $('#sum-dist').textContent = geo.formatDistance(trip.meters);
    const end = new Date(Date.now() + trip.seconds * 1000);
    const nStops = state.routePoints.filter((p) => p.kind === 'stop').length;
    $('#sum-eta').textContent = `${nStops} entrega${nStops === 1 ? '' : 's'} · término às ${geo.formatClock(end)} (sem contar paradas)`;

    const altBox = $('#alternatives');
    if (state.trips.length > 1) {
      altBox.innerHTML = state.trips.map((t, i) => `
        <button type="button" class="alt ${i === state.selected ? 'active' : ''}" data-i="${i}">
          <strong>${i === 0 ? 'Recomendada' : `Alternativa ${i}`}</strong>
          <small>${geo.formatDuration(t.seconds)} · ${geo.formatDistance(t.meters)}${t.hasToll ? ' · pedágio' : ''}</small>
        </button>`).join('');
      altBox.hidden = false;
      altBox.onclick = (e) => { const b = e.target.closest('.alt'); if (b) selectTrip(Number(b.dataset.i)); };
    } else {
      altBox.innerHTML = '';
      altBox.hidden = true;
    }
  }

  function renderWarnings(trip) {
    const items = [];
    const z = cfg.zmrc;
    const start = Date.now();

    // ZMRC: verifica por trecho, com a hora prevista de passagem.
    let elapsed = 0;
    const restrictedLegs = [];
    const freeLegs = [];
    trip.legs.forEach((leg, i) => {
      const legStart = new Date(start + elapsed * 1000);
      elapsed += leg.seconds;
      const legEnd = new Date(start + elapsed * 1000);
      const passes = leg.shape.some((p, k) => k % 2 === 0 && geo.pointInPolygon(p, z.polygon));
      if (!passes) return;
      const label = state.routePoints[i + 1] ? state.routePoints[i + 1].label : `trecho ${i + 1}`;
      if (geo.isWithinWindows(legStart, z.windows) || geo.isWithinWindows(legEnd, z.windows)) {
        restrictedLegs.push(`no trecho até ${label} (≈${geo.formatClock(legStart)}–${geo.formatClock(legEnd)})`);
      } else freeLegs.push(label);
    });
    if (restrictedLegs.length) {
      items.push(['danger', `⛔ A rota entra na ZMRC (área aproximada) em horário de restrição, ${restrictedLegs.join('; ')}. ${z.rulesText}`]);
    } else if (freeLegs.length) {
      items.push(['warn', `⚠️ A rota passa pela ZMRC (área aproximada), mas pela previsão fora do horário de restrição. ${z.rulesText}`]);
    }

    // Alertas reportados que continuam perto da rota (ex.: na porta da entrega).
    const near = state.reports.filter((r) => rep.isActive(r, cfg.reportTypes) && rep.affectsTruck(r, truck()))
      .filter((r) => geo.nearestOnShape(trip.shape, [r.lat, r.lon]).dist < 35);
    for (const r of near) {
      items.push(['danger', `${cfg.reportTypes[r.type].icon} A rota passa por um ponto marcado: ${cfg.reportTypes[r.type].label}${r.note ? ` (${r.note})` : ''}. Não foi possível desviar.`]);
    }
    if (state.skippedReports > 0) {
      items.push(['warn', `Há ${state.skippedReports} alerta(s) nesta região que não puderam ser considerados (limite do servidor). Apague alertas antigos.`]);
    }

    if (trip.hasToll) {
      items.push(state.options.avoidTolls
        ? ['warn', 'Não foi possível evitar todos os pedágios nesta rota.']
        : ['info', 'A rota tem pedágio.']);
    }
    if (truck().hazmat) items.push(['info', 'Carga perigosa: a rota evita vias proibidas para produtos perigosos que estão cadastradas no mapa.']);
    items.push(['info', 'A rota não usa trânsito ao vivo. Antes de sair, toque em 🚦 para conferir o trânsito; se houver congestionamento, marque-o e recalcule.']);

    $('#warnings').innerHTML = items.map(([cls, txt]) => `<li class="warning ${cls}">${esc(txt)}</li>`).join('');
  }

  function renderInstructions(trip) {
    const html = [];
    trip.legs.forEach((leg, i) => {
      const p = state.routePoints[i + 1];
      html.push(`<li class="leg-title">Até ${esc(p ? p.label : `parada ${i + 1}`)} — ${geo.formatDistance(leg.meters)}, ${geo.formatDuration(leg.seconds)}</li>`);
      for (const m of leg.maneuvers) {
        const d = m.length ? `<small>${geo.formatDistance(m.length * 1000)}</small>` : '';
        html.push(`<li>${esc(m.instruction)}${d}</li>`);
      }
    });
    $('#instructions-list').innerHTML = html.join('');
  }

  /* ================================ Trânsito ================================ */

  function openGoogleTraffic(center, zoom) {
    const url = `https://www.google.com/maps/@?api=1&map_action=map&center=${center[0].toFixed(5)},${center[1].toFixed(5)}&zoom=${zoom}&layer=traffic`;
    window.open(url, '_blank', 'noopener');
  }

  function toggleTrafficLayer() {
    if (layers.traffic) {
      map.removeLayer(layers.traffic);
      layers.traffic = null;
      $('#btn-traffic').classList.remove('on');
      return;
    }
    const url = cfg.tomtomTrafficUrl.replace('{key}', encodeURIComponent(state.options.tomtomKey));
    layers.traffic = L.tileLayer(url, { pane: 'traffic', opacity: 0.85, maxZoom: 19, attribution: 'Trânsito © TomTom' });
    layers.traffic.on('tileerror', () => toast('Não foi possível carregar o trânsito. Confira a chave da TomTom em Ajustes.', { error: true }));
    layers.traffic.addTo(map);
    $('#btn-traffic').classList.add('on');
  }

  $('#btn-traffic').addEventListener('click', () => {
    if (state.options.tomtomKey) { toggleTrafficLayer(); return; }
    const c = map.getCenter();
    openGoogleTraffic([c.lat, c.lng], Math.min(15, Math.max(11, map.getZoom())));
  });

  $('#btn-traffic-google').addEventListener('click', () => {
    const trip = state.trips[state.selected];
    if (!trip) return;
    const b = L.latLngBounds(trip.shape);
    const c = b.getCenter();
    const zoom = Math.max(10, Math.min(15, map.getBoundsZoom(b) - 1));
    openGoogleTraffic([c.lat, c.lng], zoom);
  });

  /* ============================== Modos do mapa ============================== */

  function setMapMode(mode, text) {
    state.mapMode = mode;
    $('#mode-banner').hidden = !mode;
    if (mode) {
      $('#mode-text').textContent = text;
      if (!isDesktop()) setSheet('collapsed');
    }
    map.getContainer().style.cursor = mode ? 'crosshair' : '';
  }
  $('#mode-cancel').addEventListener('click', () => setMapMode(null));

  $('#btn-mark-jam').addEventListener('click', () => setMapMode('jam', 'Toque no local do congestionamento'));
  $('#btn-new-report').addEventListener('click', () => setMapMode('report', 'Toque no local do problema'));

  map.on('click', (e) => handleMapTap(e));

  /**
   * Toque numa rua tracejada: no modo "reportar"/"congestionamento" vale como
   * toque no mapa; fora dele, mostra o motivo da restrição.
   */
  function onRestrictedTap(html) {
    return (e) => {
      if (state.mapMode) { handleMapTap(e); return; }
      L.popup().setLatLng(e.latlng).setContent(html).openOn(map);
    };
  }

  function handleMapTap(e) {
    if (state.nav.active) return;
    const ll = [e.latlng.lat, e.latlng.lng];
    if (state.mapMode === 'jam') {
      setMapMode(null);
      addReport({ type: 'congestionamento', lat: ll[0], lon: ll[1] });
      toast('Congestionamento marcado por 1 hora. Recalculando…');
      if (state.trips.length) calculate({ keepView: true });
      return;
    }
    if (state.mapMode === 'report') {
      setMapMode(null);
      openReportDialog(ll);
      return;
    }
    // Toque normal: menu rápido
    const box = document.createElement('div');
    box.className = 'popup-actions';
    box.innerHTML = `
      <button class="btn btn-primary" data-a="stop">➕ Adicionar entrega aqui</button>
      <button class="btn btn-ghost" data-a="origin">Definir como partida</button>
      <button class="btn btn-warn" data-a="report">⚠️ Reportar problema aqui</button>`;
    const popup = L.popup({ closeButton: true }).setLatLng(e.latlng).setContent(box).openOn(map);
    box.addEventListener('click', async (ev) => {
      const a = ev.target.closest('button') && ev.target.closest('button').dataset.a;
      if (!a) return;
      map.closePopup(popup);
      if (a === 'report') { openReportDialog(ll); return; }
      const place = { label: `${ll[0].toFixed(5)}, ${ll[1].toFixed(5)}`, lat: ll[0], lon: ll[1] };
      if (a === 'stop') {
        const s = addStop(place);
        s.label = await svc.reverse(ll[0], ll[1]);
      } else {
        setOrigin(place);
        state.origin.label = await svc.reverse(ll[0], ll[1]);
      }
      save(); renderStops();
    });
  }

  /* ================================= Alertas ================================= */

  function addReport(r) {
    const report = { id: uid(), value: '', note: '', createdAt: Date.now(), ...r };
    state.reports.push(report);
    save(); renderReports();
    return report;
  }

  function reportDetails(r) {
    const t = cfg.reportTypes[r.type];
    const bits = [];
    if (r.value !== '' && r.value != null) {
      if (r.type === 'ponte_baixa') bits.push(`altura livre ${fmtNum(r.value)} m`);
      if (r.type === 'peso') bits.push(`máx. ${fmtNum(r.value)} t`);
      if (r.type === 'rua_estreita') bits.push(`até ${fmtNum(r.value)} m de comprimento`);
    }
    if (r.note) bits.push(r.note);
    const left = rep.minutesLeft(r, cfg.reportTypes);
    if (left != null) bits.push(left > 0 ? `expira em ${left >= 60 ? geo.formatDuration(left * 60) : `${left} min`}` : 'expirado');
    else bits.push(`desde ${new Date(r.createdAt).toLocaleDateString('pt-BR')}`);
    if (!rep.affectsTruck(r, truck())) bits.push('não afeta o seu caminhão');
    return { t, text: bits.join(' · ') };
  }

  function renderReports() {
    // Remove automaticamente alertas temporários expirados há mais de 1 dia.
    const now = Date.now();
    const kept = state.reports.filter((r) => {
      const t = cfg.reportTypes[r.type];
      return t && (!t.ttlMinutes || now - r.createdAt < (t.ttlMinutes + 24 * 60) * 60000);
    });
    if (kept.length !== state.reports.length) { state.reports = kept; save(); }

    const list = $('#reports-list');
    $('#reports-empty').hidden = state.reports.length > 0;
    const active = state.reports.filter((r) => rep.isActive(r, cfg.reportTypes));
    const badge = $('#alert-count');
    badge.hidden = !active.length;
    badge.textContent = active.length;

    list.innerHTML = state.reports.slice().reverse().map((r) => {
      const { t, text } = reportDetails(r);
      const on = rep.isActive(r, cfg.reportTypes) && rep.affectsTruck(r, truck());
      return `
      <li class="report ${on ? '' : 'inactive'}" data-id="${r.id}">
        <span class="report-icon">${t.icon}</span>
        <div class="report-text"><strong>${esc(t.label)}</strong><small>${esc(text)}</small></div>
        <button class="icon-btn" data-act="show" aria-label="Ver no mapa">◎</button>
        <button class="icon-btn" data-act="del" aria-label="Apagar alerta">✕</button>
      </li>`;
    }).join('');

    layers.reports.clearLayers();
    for (const r of state.reports) {
      const { t, text } = reportDetails(r);
      const on = rep.isActive(r, cfg.reportTypes) && rep.affectsTruck(r, truck());
      // Alerta ligado a um trecho de rua: desenha o trecho tracejado.
      if (on && Array.isArray(r.geometry) && r.geometry.length > 1) {
        const popup = `<div class="restr-popup"><strong>${esc(r.street || 'Trecho reportado')}</strong><ul><li>${esc(t.label)}</li><li>${esc(text)}</li></ul><small>Reportado por motorista</small></div>`;
        L.polyline(r.geometry, { renderer: restrRenderer, color: '#ffffff', weight: 9, opacity: 0.6, interactive: false }).addTo(layers.reports);
        L.polyline(r.geometry, { renderer: restrRenderer, color: '#7f1d1d', weight: 6, dashArray: '8 7', lineCap: 'butt', bubblingMouseEvents: false })
          .on('click', onRestrictedTap(popup)).addTo(layers.reports);
      }
      L.marker([r.lat, r.lon], {
        icon: L.divIcon({ className: '', html: `<div class="report-pin ${on ? '' : 'off'}">${t.icon}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
        title: t.label,
      }).bindPopup(`<strong>${esc(t.label)}</strong><br><small>${esc(text)}</small>`).addTo(layers.reports);
    }
  }

  $('#reports-list').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const id = btn.closest('.report').dataset.id;
    const r = state.reports.find((x) => x.id === id);
    if (!r) return;
    if (btn.dataset.act === 'show') {
      if (!isDesktop()) setSheet('collapsed');
      map.setView([r.lat, r.lon], 17);
    } else {
      state.reports = state.reports.filter((x) => x.id !== id);
      save(); renderReports();
      toast('Alerta apagado.');
      if (state.trips.length) routeInvalidated();
    }
  });

  // Tipos de alerta que valem para um trecho de rua (desenhado tracejado).
  const STREET_REPORTS = ['rua_estreita', 'proibido', 'peso', 'obra'];

  /** Liga o alerta à rua mais próxima para desenhar o trecho no mapa. */
  async function attachStreet(report) {
    try {
      const street = await svc.nearestStreet(report.lat, report.lon);
      if (!street) return;
      const seg = RC.restrictions.nearestWaySegment([street], [report.lat, report.lon], 120, 40);
      if (!seg) return;
      const r = state.reports.find((x) => x.id === report.id);
      if (!r) return;
      r.geometry = seg.shape;
      r.street = seg.street;
      save(); renderReports();
    } catch (_) { /* sem conexão: o alerta fica só como ponto */ }
  }

  const dialog = $('#report-dialog');
  let dialogLatLng = null;

  function openReportDialog(ll, presetType) {
    dialogLatLng = ll;
    const types = Object.entries(cfg.reportTypes);
    const first = presetType || 'ponte_baixa';
    $('#report-types').innerHTML = types.map(([k, t]) => `
      <label class="report-type"><input type="radio" name="rtype" value="${k}" ${k === first ? 'checked' : ''}>
        <span class="ico">${t.icon}</span><span>${esc(t.label)}</span></label>`).join('');
    $('#report-where').textContent = `Local: ${ll[0].toFixed(5)}, ${ll[1].toFixed(5)}`;
    $('#report-value').value = '';
    $('#report-note').value = '';
    updateReportField();
    dialog.returnValue = '';
    dialog.showModal();
  }

  function updateReportField() {
    const k = (dialog.querySelector('input[name="rtype"]:checked') || {}).value;
    const t = cfg.reportTypes[k];
    const wrap = $('#report-value-wrap');
    wrap.hidden = !(t && t.field);
    if (t && t.field) {
      $('#report-value-label').textContent = t.fieldLabel;
      $('#report-value-hint').textContent = t.hint || '';
    }
  }
  $('#report-types').addEventListener('change', updateReportField);

  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'ok' || !dialogLatLng) return;
    const type = dialog.querySelector('input[name="rtype"]:checked').value;
    const raw = String($('#report-value').value).replace(',', '.');
    const value = raw && Number(raw) > 0 ? Number(raw) : '';
    const report = addReport({ type, lat: dialogLatLng[0], lon: dialogLatLng[1], value, note: $('#report-note').value.trim() });
    toast('Alerta salvo. As próximas rotas vão desviar deste ponto.');
    if (STREET_REPORTS.includes(type)) attachStreet(report);
    if (state.trips.length) calculate({ keepView: true });
  });

  /* ================================ Navegação ================================ */

  const ARROWS = {
    1: '↑', 2: '↗', 3: '↖', 4: '🏁', 5: '🏁', 6: '🏁', 7: '↑', 8: '↑', 9: '↗', 10: '→', 11: '↘', 12: '↷', 13: '↶',
    14: '↙', 15: '←', 16: '↖', 17: '↑', 18: '↗', 19: '↖', 20: '↗', 21: '↖', 22: '↑', 23: '↗', 24: '↖', 25: '↑',
    26: '⟳', 27: '↗', 37: '↗', 38: '↖',
  };

  function speak(text) {
    if (!state.options.voice || !('speechSynthesis' in window) || !text) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) { /* sem voz */ }
  }

  function currentTarget() {
    const p = state.routePoints[1];
    return p || null;
  }

  async function navRecalc(pos, why) {
    const nav = state.nav;
    if (nav.recalculating) return;
    nav.recalculating = true;
    nav.lastRecalc = Date.now();
    if (why) toast(why);
    const ok = await calculate({ from: pos, noAlternates: true, keepView: true, silent: true });
    nav.recalculating = false;
    nav.spoken = {};
    nav.offCount = 0;
    nav.arrivedSpoken = false;
    if (ok) onNavPosition(pos);
  }

  async function startNav() {
    if (!navigator.geolocation) { toast('Este navegador não informa a localização.', { error: true }); return; }
    if (!pendingStops().length && !state.options.returnToOrigin) { toast('Não há entregas pendentes.'); return; }
    const nav = state.nav;
    Object.assign(nav, { active: true, userPanned: false, spoken: {}, offCount: 0, lastRecalc: 0, needsRoute: true, recalculating: false });
    document.body.classList.add('navigating');
    sheet.hidden = true;
    $('#nav-banner').hidden = false;
    $('#nav-bar').hidden = false;
    $('#nav-instr').textContent = 'Aguardando GPS…';
    $('#nav-dist').textContent = '—';
    try { nav.wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { /* opcional */ }
    speak('Iniciando a rota.');
    nav.watchId = navigator.geolocation.watchPosition(
      (p) => {
        const pos = [p.coords.latitude, p.coords.longitude];
        nav.accuracy = p.coords.accuracy;
        showMe(pos);
        if (nav.needsRoute) { nav.needsRoute = false; navRecalc(pos); return; }
        onNavPosition(pos);
      },
      (err) => toast(err.code === 1 ? 'Permita o acesso à localização para navegar.' : 'Sinal de GPS fraco…', { error: err.code === 1 }),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
  }

  function stopNav(message) {
    const nav = state.nav;
    if (nav.watchId != null) navigator.geolocation.clearWatch(nav.watchId);
    if (nav.wakeLock) { nav.wakeLock.release().catch(() => {}); nav.wakeLock = null; }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.nav = { active: false };
    document.body.classList.remove('navigating');
    sheet.hidden = false;
    $('#nav-banner').hidden = true;
    $('#nav-bar').hidden = true;
    if (message) { toast(message, { ms: 5000 }); speak(message); }
    renderStops();
  }

  function onNavPosition(pos) {
    const nav = state.nav;
    const trip = state.trips[state.selected];
    if (!nav.active || !trip || nav.recalculating) return;
    const leg = trip.legs[0];
    const prog = RC.guidance.progress(leg, pos);
    nav.progress = prog;

    if (!nav.userPanned) map.setView(pos, Math.max(map.getZoom(), 16), { animate: true });

    // Fora da rota? (ignora GPS impreciso)
    if (prog.offRoute && (nav.accuracy || 0) < 60) {
      nav.offCount = (nav.offCount || 0) + 1;
      if (nav.offCount >= 3 && Date.now() - nav.lastRecalc > 15000) {
        navRecalc(pos, 'Fora da rota. Recalculando…');
        speak('Recalculando a rota.');
        return;
      }
    } else nav.offCount = 0;

    const target = currentTarget();
    const targetLabel = target ? target.label : 'destino';
    const arrived = prog.distToEnd < 60;

    if (arrived) {
      $('#nav-arrow').textContent = '🏁';
      $('#nav-dist').textContent = 'Você chegou';
      $('#nav-instr').textContent = targetLabel;
      if (!nav.arrivedSpoken) { nav.arrivedSpoken = true; speak(`Você chegou. ${target && target.kind === 'stop' ? 'Toque em entregue ao concluir.' : ''}`); }
    } else {
      const m = prog.nextManeuver;
      $('#nav-arrow').textContent = m ? (ARROWS[m.type] || '↑') : '🏁';
      $('#nav-dist').textContent = geo.formatDistance(prog.distToNext);
      $('#nav-instr').textContent = m ? m.instruction : `Chegada: ${targetLabel}`;
      if (m) {
        const key = `${prog.maneuverIndex + 1}`;
        nav.spoken = nav.spoken || {};
        if (prog.distToNext < 1200 && prog.distToNext > 700 && !nav.spoken[key + 'far']) {
          nav.spoken[key + 'far'] = true;
          speak(`Em 1 quilômetro, ${m.verbal_transition_alert_instruction || m.instruction}`);
        } else if (prog.distToNext < 250 && !nav.spoken[key + 'near']) {
          nav.spoken[key + 'near'] = true;
          speak(m.verbal_pre_transition_instruction || m.instruction);
        }
      }
    }

    const remainingSec = leg.meters ? leg.seconds * (prog.distToEnd / leg.meters) : 0;
    const eta = new Date(Date.now() + remainingSec * 1000);
    const isReturn = target && target.kind === 'return';
    $('#nav-next-label').textContent = isReturn ? 'Volta à partida' : `Entrega ${state.stops.filter((s) => s.done).length + 1} de ${state.stops.length}`;
    $('#nav-next-info').textContent = `${targetLabel} · ${geo.formatDistance(prog.distToEnd)} · ${geo.formatClock(eta)}`;
    $('#nav-delivered').textContent = isReturn ? '✓ Finalizar' : '✓ Entregue';
  }

  $('#btn-start-nav').addEventListener('click', startNav);
  $('#nav-stop').addEventListener('click', () => stopNav());
  $('#nav-recalc').addEventListener('click', () => {
    if (state.lastPos) navRecalc(state.lastPos, 'Recalculando…');
  });

  $('#nav-delivered').addEventListener('click', () => {
    const target = currentTarget();
    if (target && target.kind === 'stop') {
      const s = state.stops.find((x) => x.id === target.stopId);
      if (s) s.done = true;
      save();
    }
    if (!target || target.kind === 'return' || (!pendingStops().length && !state.options.returnToOrigin)) {
      stopNav('Todas as entregas concluídas. Bom trabalho!');
      routeInvalidated();
      return;
    }
    renderStops();
    if (state.lastPos) navRecalc(state.lastPos, 'Entrega concluída. Indo para a próxima…');
  });

  $('#nav-jam').addEventListener('click', () => {
    const nav = state.nav;
    const trip = state.trips[state.selected];
    if (!nav.progress || !trip) { toast('Aguardando GPS…'); return; }
    if (nav.progress.distToEnd < 900) { toast('Você já está perto da entrega; não há como desviar.'); return; }
    const p = geo.pointAhead(trip.legs[0].shape, nav.progress.index, nav.progress.t, 700);
    addReport({ type: 'congestionamento', lat: p[0], lon: p[1], note: 'marcado durante a viagem' });
    navRecalc(state.lastPos, 'Procurando um desvio do trânsito à frente…');
  });

  map.on('dragstart', () => { if (state.nav.active) state.nav.userPanned = true; });

  /* ========================= Ruas proibidas no mapa ========================= */

  const RESTR_STYLES = {
    blocked: { color: '#dc2626', dashArray: '8 7' },
    destination: { color: '#ea580c', dashArray: '2 7' },
    conditional: { color: '#9333ea', dashArray: '12 6' },
  };
  // As ruas vêm de um arquivo que acompanha o app (gerado do OpenStreetMap
  // por ferramentas/extrair_ruas.py): não depende de servidor externo.
  const restr = { ways: new Map(), loaded: false, inFlight: false, error: null, date: '', count: 0, timer: null };

  function scheduleRestrictions() {
    clearTimeout(restr.timer);
    restr.timer = setTimeout(renderRestrictions, 150);
  }

  async function loadRestrictions() {
    if (restr.loaded || restr.inFlight) { renderRestrictions(); return; }
    restr.inFlight = true;
    restr.error = null;
    updateRestrPill();
    try {
      const res = await fetch(cfg.restrictionsFile);
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      for (const [id, tags, flat] of data.ways) {
        const shape = [];
        for (let i = 0; i < flat.length; i += 2) shape.push([flat[i], flat[i + 1]]);
        restr.ways.set(id, { id, tags, shape });
      }
      restr.date = data.gerado || '';
      restr.loaded = true;
    } catch (_) {
      restr.error = 'Não foi possível carregar as ruas proibidas.';
    }
    restr.inFlight = false;
    renderRestrictions();
  }

  /**
   * Redesenha as ruas proibidas para o caminhão atual, só as que estão na tela.
   * Trechos curtos (viadutos, pontes, túneis) ganham uma "placa" para não sumirem.
   */
  function renderRestrictions() {
    layers.restrictions.clearLayers();
    restr.count = 0;
    if (state.options.showRestrictions && map.getZoom() >= cfg.restrictionsMinZoom) {
      const t = truck();
      const view = map.getBounds();
      const area = view.pad(0.3);
      const showSigns = map.getZoom() >= 14;
      for (const w of restr.ways.values()) {
        if (!w.bounds) {
          w.bounds = L.latLngBounds(w.shape);
          w.length = geo.distanceAlong(w.shape, 0, w.shape.length - 1);
        }
        if (!area.intersects(w.bounds)) continue;
        const ev = RC.restrictions.evaluate(w.tags, t);
        if (!ev) continue;
        const st = RESTR_STYLES[ev.status];
        const name = w.tags.name || w.tags.ref || 'Rua sem nome';
        const label = { blocked: `Proibida para ${t.nome}`, destination: 'Só carga e descarga', conditional: 'Restrita' }[ev.status];
        const popup = `<div class="restr-popup"><strong>${esc(name)}</strong><span style="color:${st.color};font-weight:700">${esc(label)}</span><ul>${ev.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
        L.polyline(w.shape, { renderer: restrRenderer, color: '#ffffff', weight: 8, opacity: 0.55, interactive: false }).addTo(layers.restrictions);
        L.polyline(w.shape, {
          renderer: restrRenderer, color: st.color, weight: 5, dashArray: st.dashArray, lineCap: 'butt', opacity: 0.95, bubblingMouseEvents: false,
        }).on('click', onRestrictedTap(popup)).addTo(layers.restrictions);
        if (showSigns && ev.status === 'blocked' && w.length < 250) {
          const mid = geo.pointAhead(w.shape, 0, 0, w.length / 2);
          L.marker(mid, {
            icon: L.divIcon({ className: '', html: `<div class="restr-sign">${esc(ev.sign)}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }),
            keyboard: false, title: `${name}: ${ev.reasons[0]}`, bubblingMouseEvents: false,
          }).on('click', onRestrictedTap(popup)).addTo(layers.restrictions);
        }
        if (view.intersects(w.bounds)) restr.count++;
      }
    }
    updateRestrPill();
  }

  function updateRestrPill() {
    const pill = $('#restr-pill');
    if (!state.options.showRestrictions) { pill.hidden = true; $('#restr-legend').hidden = true; return; }
    pill.hidden = false;
    const name = truck().nome;
    const zoomedOut = map.getZoom() < cfg.restrictionsMinZoom;
    let text;
    let info = true;
    if (restr.inFlight) text = 'Carregando ruas proibidas…';
    else if (restr.count) { text = `${restr.count} rua${restr.count > 1 ? 's' : ''} com restrição p/ ${name}`; info = false; }
    else if (zoomedOut) text = 'Aproxime o mapa para ver as ruas proibidas';
    else if (restr.error) text = `${restr.error} Toque para tentar de novo.`;
    else if (!restr.loaded) text = 'Carregando ruas proibidas…';
    else text = `Nenhuma rua proibida p/ ${name} nesta área`;
    $('#restr-text').textContent = text;
    pill.classList.toggle('info', info);
  }

  $('#restr-pill').addEventListener('click', () => {
    if (restr.error && !restr.inFlight) { loadRestrictions(); return; }
    const lg = $('#restr-legend');
    if (restr.date) $('#restr-date').textContent = `Dados do mapa de ${restr.date.split('-').reverse().join('/')}.`;
    lg.hidden = !lg.hidden;
    $('#restr-pill').setAttribute('aria-expanded', String(!lg.hidden));
  });

  map.on('moveend', scheduleRestrictions);

  /* ================================= Ajustes ================================= */

  function renderSettings() {
    $('#opt-return').checked = state.options.returnToOrigin;
    $('#opt-tolls').checked = state.options.avoidTolls;
    $('#opt-voice').checked = state.options.voice;
    $('#opt-zmrc').checked = state.options.showZmrc;
    $('#opt-restr').checked = state.options.showRestrictions;
    $('#tomtom-key').value = state.options.tomtomKey || '';
    if (state.options.showZmrc) layers.zmrc.addTo(map); else layers.zmrc.remove();
  }

  $('#opt-restr').addEventListener('change', (e) => {
    state.options.showRestrictions = e.target.checked;
    save();
    loadRestrictions();
  });
  $('#opt-voice').addEventListener('change', (e) => { state.options.voice = e.target.checked; save(); });
  $('#opt-zmrc').addEventListener('change', (e) => { state.options.showZmrc = e.target.checked; save(); renderSettings(); });
  $('#tomtom-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.options.tomtomKey = $('#tomtom-key').value.trim();
    save();
    if (layers.traffic) toggleTrafficLayer();
    toast(state.options.tomtomKey ? 'Chave salva. Toque em 🚦 para ver o trânsito no mapa.' : 'Chave removida.');
  });
  $('#btn-clear').addEventListener('click', () => {
    if (!window.confirm('Apagar caminhão, entregas e alertas salvos neste celular?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (_) { /* ignora */ }
    window.location.reload();
  });

  /* ================================== Início ================================== */

  load();
  renderTruck();
  renderStops();
  renderReports();
  renderSettings();
  setInterval(renderReports, 60000); // atualiza os alertas que expiram

  const pts = [state.origin, ...state.stops].filter(Boolean).map((p) => [p.lat, p.lon]);
  if (pts.length > 1) fitTo(pts);
  else if (pts.length === 1) map.setView(pts[0], 14);
  updateRestrPill();
  loadRestrictions();

  // Expõe para depuração/testes.
  window.RC.app = { state, map, calculate, startNav, stopNav, addStop, setOrigin, addReport };
})();
