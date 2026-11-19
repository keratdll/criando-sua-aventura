// ===================== cenas =====================
const L_ = id => LBY[id];

// ---------- ABERTURA ----------
function opening(c, t) {
  gradBG(c, '#0B1430', '#1E3163');
  // estrelas
  for (let i = 0; i < 40; i++) { c.globalAlpha = 0.3 + 0.5 * Math.abs(Math.sin(t * 1.3 + i)); circ(c, hash(i) * W, hash(i + 50) * 420, 1.4, '#fff'); }
  c.globalAlpha = 1;
  // cidade apagando
  for (let i = 0; i < 12; i++) {
    const bw = 40 + hash(i + 3) * 30, bh = 160 + hash(i + 9) * 260, bx = i * 46 - 10, by = 960 - bh;
    c.fillStyle = i % 2 ? '#16224A' : '#1B2A57'; c.fillRect(bx, by, bw, bh);
    for (let wy = by + 14; wy < 940; wy += 22) for (let wx = bx + 8; wx < bx + bw - 10; wx += 14) {
      const off = 0.5 + hash(wx * 0.13 + wy * 0.7) * 1.6;
      const lit = t < off || (t > off && Math.sin(t * 40 + wx) > 0.92 && t < off + 0.3);
      c.fillStyle = lit ? '#FFE08A' : 'rgba(255,255,255,.06)'; c.fillRect(wx, wy, 7, 10);
    }
  }
  // lâmpada balançando
  const sw = Math.sin(t * 1.6) * 0.25;
  c.save(); c.translate(270, 0); c.rotate(sw); line(c, [[0, 0], [0, 150]], '#555', 3);
  fillRR(c, -14, 150, 28, 24, 4, '#9aa');
  const on = t < 0.7 || (t > 1.0 && t < 1.15);
  if (on) { const g = c.createRadialGradient(0, 200, 5, 0, 200, 120); g.addColorStop(0, 'rgba(255,224,138,.6)'); g.addColorStop(1, 'rgba(255,224,138,0)'); c.fillStyle = g; c.fillRect(-120, 80, 240, 240); }
  circ(c, 0, 200, 32, on ? '#FFE08A' : 'rgba(220,230,255,.25)');
  c.restore();
  // título
  const k1 = pop(t, 0.9, 0.5), k2 = pop(t, 1.15, 0.5), k3 = pop(t, 1.4, 0.5);
  c.save(); c.translate(270, 330); c.scale(k1, k1); txt(c, 'O APAGÃO', 0, 0, 72, '#fff', { stroke: '#0B1430', sw: 10 }); c.restore();
  c.save(); c.translate(270, 405); c.scale(k2, k2); txt(c, 'QUE PAROU', 0, 0, 62, COL.yellow, { stroke: '#0B1430', sw: 10 }); c.restore();
  c.save(); c.translate(270, 476); c.scale(k3, k3); txt(c, 'O BRASIL', 0, 0, 72, '#fff', { stroke: '#0B1430', sw: 10 }); c.restore();
  c.globalAlpha = pr(t, 1.8, 2.4); txt(c, 'Um curta sobre fake news na família', 270, 534, 20, '#BFD7FF', { w: 700 }); c.globalAlpha = 1;
  // Veri
  if (t > 2.1) {
    const k = eob(pr(t, 2.1, 2.6));
    veri(c, { x: 270, y: 800 + (1 - k) * 300, s: 0.9, t, talk: talkOf('veri', t), arms: t < L_('v0').s + 2.5 ? 'wave' : 'present', gest: speaking('veri', t) });
  }
}

// ---------- CENA 1 ----------
function rafaOnSofa(c, t, o = {}) {
  person(c, 'rafa', Object.assign({ x: 270, y: 690, sit: true, t, pose: 'phone', glow: true, talk: talkOf('rafa', t) }, o));
}
function scene1(c, t) {
  const notify = M.s1_notify, zoom = M.s1_zoom, react = M.s1_react;
  if (t < zoom + 0.55) {
    // sala + Rafa
    const cam = camKF(t, [[M.s1, 270, 480, 1.0], [notify, 270, 520, 1.25], [zoom, 280, 520, 1.6], [zoom + 0.55, 285, 480, 4.2]]);
    c.save(); applyCam(c, cam, t > notify && t < notify + 0.6 ? 2 : 0, t);
    livingRoom(c, t);
    const surprised = t > notify;
    rafaOnSofa(c, t, { mood: surprised ? 'surprised' : 'happy', lookY: 1, look: 0, tilt: surprised ? 0 : 0.05 });
    if (surprised) {
      // vibração do celular
      const k = pr(t, notify, notify + 0.15) * (1 - pr(t, notify + 1.4, notify + 1.6));
      c.globalAlpha = k; for (let i = 0; i < 3; i++) { const r = 18 + ((t * 40 + i * 8) % 24); c.beginPath(); c.arc(270, 540, r, -0.6, 0.6); c.strokeStyle = COL.red; c.lineWidth = 3; c.stroke(); c.beginPath(); c.arc(270, 540, r, Math.PI - 0.6, Math.PI + 0.6); c.stroke(); }
      const bk = pop(t, notify + 0.1); c.save(); c.translate(318, 360); c.scale(bk, bk); circ(c, 0, 0, 20, COL.red); txt(c, '!', 0, 2, 28, '#fff'); c.restore();
      c.globalAlpha = 1;
    }
    c.restore();
    locChip(c, t, M.s1 + 3.6, notify, 'Sábado, 16h · Casa da família');
    if (t > zoom + 0.25) { c.globalAlpha = pr(t, zoom + 0.25, zoom + 0.55); c.fillStyle = '#0B1430'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    if (t < zoom + 0.25) return;
  }
  if (t < react) {
    // tela do celular com a mensagem
    gradBG(c, '#0B1430', '#14213D'); dots(c, t);
    const k = eo(pr(t, zoom + 0.3, zoom + 0.8));
    c.save(); c.translate(270, 470); c.scale(lerp(0.7, 1, k), lerp(0.7, 1, k)); c.translate(-270, -470); c.globalAlpha = k;
    phoneFrame(c, 270, 470, 360, 720, (x, y, w, h) => chatScreen(c, x, y, w, h, [
      { from: 'lucia', text: 'Alguém vem almoçar amanhã?', at: 0, time: '15:10' },
      { from: 'ze', text: 'Eu vou! Levo a sobremesa.', at: 0, time: '15:12' },
      { from: 'neide', text: URG, fwd: true, at: M.s1_msg, time: '16:02' },
    ], t));
    c.restore();
    // brilho de alerta
    if (t > M.s1_msg) { const a = 0.25 + 0.2 * Math.sin(t * 8); c.globalAlpha = a * pr(t, M.s1_msg, M.s1_msg + 0.5); c.strokeStyle = COL.red; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); c.globalAlpha = 1; }
    return;
  }
  if (t < M.s1_fwd) {
    // close no Rafa assustado
    const l = L_('rafa1');
    const cam = camKF(t, [[react, 270, 440, 1.7], [wt('rafa1', 'inteiro'), 272, 400, 2.15], [wt('rafa1', 'Preciso'), 272, 400, 2.15], [l.e, 270, 430, 1.8]]);
    c.save(); applyCam(c, cam, 0, t); livingRoom(c, t);
    rafaOnSofa(c, t, { mood: t > wt('rafa1', 'Preciso') ? 'worried' : 'scared', look: t > wt('rafa1', 'Preciso') ? 0 : 0, lookY: t < wt('rafa1', 'Brasil') ? 1 : 0 });
    c.restore();
    const ik = 1 - pr(t, react, react + 0.4); if (ik > 0) { c.globalAlpha = ik; c.fillStyle = '#0B1430'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    return;
  }
  if (t < M.s1_mom) {
    gradBG(c, '#0B1430', '#14213D'); dots(c, t);
    const k = eo(pr(t, M.s1_fwd, M.s1_fwd + 0.35));
    c.save(); c.globalAlpha = k; phoneFrame(c, 270, 470, 360, 720, (x, y, w, h) => forwardScreen(c, x, y, w, h, t, M.s1_fwd)); c.restore();
    return;
  }
  if (t < M.s1_spread) {
    // cozinha: Mãe Lúcia
    const l = L_('lucia1'); const meu = wt('lucia1', 'Vou');
    const cam = camKF(t, [[M.s1_mom, 260, 470, 1.25], [l.s, 250, 430, 1.55], [l.e, 255, 440, 1.6]]);
    c.save(); applyCam(c, cam, 0, t); kitchen(c, t);
    const before = t < l.s - 0.3;
    person(c, 'lucia', { x: 245, y: 720, t, talk: talkOf('lucia', t), mood: before ? (t < M.s1_mom + 0.5 ? 'happy' : 'surprised') : (t < meu ? 'scared' : 'worried'), pose: before ? (t < M.s1_mom + 0.6 ? 'down' : 'phone') : (t < meu ? 'cheeks' : 'phone'), lookY: before ? 1 : 0, gest: false });
    kitchenCounter(c, t);
    if (t < M.s1_mom + 0.9) { const k = Math.sin(t * 60) * 2; phoneProp(c, 330 + k, 545, Math.PI / 2, true, 1); }
    c.restore();
    locChip(c, t, M.s1_mom + 0.3, l.e, 'Cozinha da Mãe Lúcia');
    return;
  }
  // montagem: a mensagem se espalha
  spreadMontage(c, t, M.s1_spread, M.s2);
}

function spreadMontage(c, t, t0, t1) {
  gradBG(c, '#0B1430', '#1E3163'); dots(c, t);
  const cx = 270, cy = 470;
  const fam = [['lucia', -150, -170], ['ze', 150, -170], ['neide', -170, 130], ['carlos', 170, 130]];
  // nós genéricos
  for (let i = 0; i < 46; i++) {
    const at = t0 + 1.0 + i * 0.09; if (t < at) continue;
    const parent = fam[i % 4]; const a = hash(i) * TAU, r = 70 + hash(i + 7) * 80;
    const px = cx + parent[1], py = cy + parent[2], nx = px + Math.cos(a) * r, ny = py + Math.sin(a) * r;
    const k = pr(t, at, at + 0.3);
    line(c, [[px, py], [lerp(px, nx, k), lerp(py, ny, k)]], 'rgba(255,201,60,.35)', 2);
    if (k > 0.9) { circ(c, nx, ny, 9, '#5C6B99'); circ(c, nx, ny - 3, 3.5, '#C5CEE8'); ell(c, nx, ny + 5, 5, 3, '#C5CEE8'); }
  }
  fam.forEach(([who, dx, dy], i) => {
    const at = t0 + 0.2 + i * 0.25; if (t < at) return;
    const k = pr(t, at, at + 0.35);
    line(c, [[cx, cy], [lerp(cx, cx + dx, k), lerp(cy, cy + dy, k)]], COL.yellow, 4);
    // envelope viajando
    const m = ((t - at) * 0.9) % 1; c.save(); c.translate(lerp(cx, cx + dx, m), lerp(cy, cy + dy, m)); fillRR(c, -10, -7, 20, 14, 2, '#fff'); line(c, [[-10, -7], [0, 1], [10, -7]], '#E63946', 2); c.restore();
    const kk = pop(t, at + 0.2);
    c.save(); c.translate(cx + dx, cy + dy); c.scale(kk, kk); avatar(c, who, 0, 0, 40, { t, mood: who === 'carlos' ? 'neutral' : 'worried', ring: COL.yellow });
    pill(c, 0, 58, CH_NAMES[who], 'rgba(255,255,255,.95)', COL.navy, 13); c.restore();
  });
  // celular central (Rafa)
  const pk = 1 + Math.sin(t * 6) * 0.04;
  c.save(); c.translate(cx, cy); c.scale(pk, pk); circ(c, 0, 0, 52, COL.red); avatar(c, 'rafa', 0, 0, 44, { t, mood: 'worried', ring: '#fff' }); c.restore();
  // contador
  const n = Math.floor(Math.pow(clamp((t - t0 - 0.4) / (t1 - t0 - 1.2)), 2.2) * 1283) + 1;
  fillRR(c, 120, 128, 300, 92, 20, 'rgba(255,255,255,.1)');
  txt(c, 'MENSAGEM ENCAMINHADA', 270, 152, 16, '#BFD7FF', { w: 800 });
  txt(c, n.toLocaleString('pt-BR') + (n > 1 ? ' vezes' : ' vez'), 270, 192, 38, COL.yellow);
}

// ---------- CENA 2 + 3 (mercado, congelamento) ----------
const NPCS = [
  { p: 'npc0', y: 712, sp: 95, x0: 0, cart: true }, { p: 'npc1', y: 726, sp: -80, x0: 500 }, { p: 'npc2', y: 742, sp: 120, x0: 300, cart: true },
  { p: 'npc3', y: 700, sp: -110, x0: 200 }, { p: 'npc4', y: 756, sp: 70, x0: 750, cart: true }, { p: 'npc5', y: 706, sp: 130, x0: 900 },
];
function marketTime(t) { return t < M.freeze1 ? t : t < M.unfreeze1 ? M.freeze1 : M.freeze1 + (t - M.unfreeze1); }
function scene2(c, t) {
  const te = marketTime(t);
  const z1 = L_('ze1'), n1 = L_('neide1');
  const chaos = te > M.s2_chaos ? 1.8 : 0;
  const after = M.freeze1 + 0.01;
  const cam = camKF(te, [[M.s2, 110, 560, 1.08], [M.s2 + 4, 200, 560, 1.0], [z1.s, 160, 610, 1.4], [z1.e, 160, 610, 1.4], [n1.s, 410, 610, 1.4], [n1.e + 0.2, 330, 560, 1.06], [M.freeze1, 300, 540, 1.12], [after + 4, 400, 560, 1.0]]);
  c.save(); applyCam(c, cam, t < M.freeze1 ? chaos : 0, te);
  market(c, te);
  // figurantes (atrás)
  const speedUp = te > M.s2_chaos ? 1.6 : 1;
  const drawNPC = (n, i) => {
    const span = 1300; let x = ((n.x0 + n.sp * speedUp * (te - M.s2)) % span + span) % span - 380;
    const flip = n.sp < 0;
    person(c, n.p, { x, y: n.y, s: 0.72, t: te + i, walk: 1, mood: i % 2 ? 'worried' : 'scared', pose: n.cart ? 'cart' : (i % 2 ? 'phone' : 'down'), flip, gest: false, noSweat: false });
    if (n.cart) cart(c, x + (flip ? -92 : 92), n.y + 4, 0.75, 0.6 + 0.4 * hash(i), te, flip);
  };
  NPCS.forEach(drawNPC);
  // Mãe Lúcia ao fundo pegando água
  const lucReach = te < M.s2_empty + 1;
  person(c, 'lucia', { x: 205, y: 690, s: 0.8, t: te, pose: lucReach ? 'reach' : 'box', mood: 'worried', gest: false });
  if (!lucReach) waterPack(c, 205, 560, 0.75);
  // Vovô Zé com carrinho
  const zx = te < M.s2 + 3.6 ? lerp(-60, 120, eo(pr(te, M.s2, M.s2 + 3.6))) : te > after ? 120 + (te - after) * 110 : 120;
  const zwalk = (te < M.s2 + 3.6 || te > after) ? 1 : 0;
  const fill = 0.15 + 0.85 * pr(te, M.s2, M.freeze1);
  person(c, 'ze', { x: zx, y: 850, s: 1.05, t: te, walk: zwalk, pose: 'cart', mood: te > M.s2_chaos ? 'worried' : 'determined', talk: talkOf('ze', te), look: 1, gest: false });
  cart(c, zx + 142, 856, 1.2, fill, te * (zwalk ? 1 : 0), false);
  // Tia Neide digitando
  const nx = te > after + 1 ? 440 + (te - after - 1) * 120 : 440;
  person(c, 'neide', { x: nx, y: 845, s: 1.05, t: te, pose: te > n1.e || te < n1.s - 0.3 ? 'type' : 'phone', mood: te < n1.s ? 'surprised' : 'neutral', talk: talkOf('neide', te), walk: te > after + 1 ? 1 : 0, look: -1, gest: false });
  if (te > M.s2 + 2) {
    // notificações saindo do celular da Neide
    for (let i = 0; i < 5; i++) {
      const ph = ((te - M.s2) * (te > M.s2_chaos ? 1.2 : 0.7) + i / 5) % 1;
      c.globalAlpha = Math.sin(ph * Math.PI); fillRR(c, nx + 10 + i * 6, 640 - ph * 120, 34, 20, 8, '#25A244'); txt(c, '+1', nx + 27 + i * 6, 651 - ph * 120, 12, '#fff'); c.globalAlpha = 1;
    }
  }
  c.restore();
  if (te < M.s2 + 4.5) locChip(c, te, M.s2 + 3.4, M.s2 + 7.5, 'Supermercado do bairro');
  // ---- congelamento (cena 3)
  freezeFX(c, t, M.freeze1, M.unfreeze1);
  if (t >= M.freeze1 && t < M.unfreeze1) scene3Overlay(c, t);
}

function veriEnter(t, tin, tout) {
  const k = eob(pr(t, tin, tin + 0.55)); const ko = eio(pr(t, tout, tout + 0.4));
  return { dy: (1 - k) * 420, dx: ko * 620, rot: ko * 0.5, vis: t >= tin && t < tout + 0.45 };
}
function speedLines(c, x, y, k) {
  if (k <= 0 || k >= 1) return;
  c.save(); c.globalAlpha = 1 - k; c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) { const yy = y - 260 + i * 50; c.beginPath(); c.moveTo(x - 160 - i * 10, yy); c.lineTo(x - 40, yy); c.stroke(); }
  c.restore();
}

function scene3Overlay(c, t) {
  const v1 = L_('v1'), v2 = L_('v2'), v3 = L_('v3'), v4 = L_('v4'), v5 = L_('v5');
  const e = veriEnter(t, M.s3_in, M.s3_out);
  // ---- painel
  const panelOn = t > v1.s + 0.2 && t < v5.s + 0.2;
  if (panelOn) {
    const k = pr(t, v1.s + 0.2, v1.s + 0.6) * (1 - pr(t, v5.s - 0.2, v5.s + 0.2));
    card(c, 30, 160, 480, 330, k, -0.015);
    if (t < v2.s) {
      // "vamos voltar" + 1 mensagem -> várias pessoas
      const rw = wt('v1', 'voltar');
      if (t > rw - 0.2 && t < rw + 1.8) { const kk = pop(t, rw - 0.2); c.save(); c.translate(240, 70); c.scale(kk, kk); fillRR(c, -70, -26, 140, 52, 26, COL.navy); c.translate(-14, 0); drawIcon(c, 'rewind', 0, 0, 0.6); c.restore(); txt(c, 'VOLTANDO...', 240, 112, 16, COL.navy); }
      const a = wt('v1', 'simples');
      if (t > a - 0.3) {
        const k1 = pop(t, a - 0.3); c.save(); c.translate(90, 210); c.scale(k1, k1); drawIcon(c, 'phone', 0, 0, 0.9); circ(c, 18, -34, 13, COL.red); txt(c, '1', 18, -33, 16, '#fff'); c.restore();
        txt(c, '1 mensagem', 90, 290, 18, COL.navy);
        const k2 = pr(t, a + 0.4, a + 1.0);
        line(c, [[140, 210], [lerp(140, 240, k2), 210]], COL.red, 6); if (k2 >= 1) { c.beginPath(); c.moveTo(252, 210); c.lineTo(236, 200); c.lineTo(236, 220); c.fillStyle = COL.red; c.fill(); }
        const ppl = [['rafa', 300, 170], ['lucia', 370, 170], ['ze', 300, 245], ['neide', 370, 245], ['npc1', 440, 170], ['npc3', 440, 245]];
        ppl.forEach(([w, x, y], i) => { const kk = pop(t, a + 1.0 + i * 0.12); if (kk <= 0) return; c.save(); c.translate(x, y); c.scale(kk, kk); if (CH[w] && w.startsWith('npc')) { circ(c, 0, 0, 30, '#9AA5C4'); c.save(); c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.clip(); c.scale(0.6, 0.6); c.translate(0, 8); drawHead(c, CH[w], { t: 0, mood: 'scared' }); c.restore(); } else avatar(c, w, 0, 0, 30, { t: 0, mood: 'scared', ring: COL.red }); c.restore(); });
        if (t > wt('v1', 'desespero') - 0.2) pill(c, 370, 300, 'DESESPERO!', COL.red, '#fff', 17);
      }
      txt(c, 'Uma simples mensagem...', 240, 40, 22, COL.navy);
    } else if (t < v3.s) {
      txt(c, 'Por que isso acontece?', 240, 42, 26, COL.navy);
      const items = [['fear', 'MEDO', 'medo'], ['worry', 'PREOCUPAÇÃO', 'preocupa'], ['curious', 'CURIOSIDADE', 'curiosidade']];
      items.forEach(([ic, lb, w], i) => { const at = wt('v2', w) - 0.15; const kk = pop(t, at); if (kk <= 0) return; c.save(); c.translate(90 + i * 150, 130); c.scale(kk, kk); drawIcon(c, ic, 0, 0, 1); txt(c, lb, 0, 56, 15, COL.navy); c.restore(); });
      const u = wt('v2', 'urgente') - 0.15;
      if (t > u) { const kk = pop(t, u); c.save(); c.translate(150, 262); c.rotate(-0.08); c.scale(kk, kk); fillRR(c, -90, -28, 180, 56, 10, COL.red); txt(c, 'URGENTE!!!', 0, 2, 28, '#fff'); c.restore(); }
      const sp = wt('v2', 'compartilhando') - 0.15;
      if (t > sp) { const kk = pop(t, sp); c.save(); c.translate(360, 262); c.scale(kk, kk); drawIcon(c, 'share', -60, 0, 0.8); txt(c, 'sem pensar', 20, 2, 22, COL.navy, { a: 'left' }); c.restore(); }
    } else if (t < v4.s) {
      txt(c, 'Veio de alguém conhecido...', 240, 42, 24, COL.navy);
      const kk = pop(t, v3.s + 0.3); c.save(); c.translate(240, 175); c.scale(kk, kk);
      heart(c, 0, 0, 62 + Math.sin(t * 5) * 3, '#FF8FA3');
      [['lucia', -150, -30], ['ze', -110, 70], ['neide', 110, 70], ['carlos', 150, -30], ['rafa', 0, -90]].forEach(([w, x, y], i) => { const k2 = pop(t, v3.s + 0.5 + i * 0.2); if (k2 > 0) { c.save(); c.translate(x, y); c.scale(k2, k2); avatar(c, w, 0, 0, 30, { t: 0, mood: 'happy' }); c.restore(); } });
      c.restore();
      if (t > wt('v3', 'facilidade') - 0.2) pill(c, 240, 292, 'a gente confia mais rápido', COL.teal, '#fff', 18);
    } else {
      const kk = pop(t, v4.s + 0.1);
      txt(c, 'Atenção!', 240, 50, 26, COL.red);
      c.save(); c.translate(240, 170); c.scale(kk, kk);
      pill(c, 0, -50, 'CONHECIDO', COL.teal, '#fff', 30);
      const k2 = pop(t, wt('v4', 'não') - 0.1); c.save(); c.scale(k2, k2); txt(c, '≠', 0, 14, 70, COL.red); c.restore();
      const k3 = pop(t, wt('v4', 'verdadeira') - 0.2); if (k3 > 0) { c.save(); c.translate(0, 82); c.scale(k3, k3); pill(c, 0, 0, 'VERDADEIRO', COL.navy, '#fff', 30); c.restore(); }
      c.restore();
    }
    c.restore();
  }
  // ---- Veri
  if (e.vis) {
    const arms = t < v1.s + 1.2 ? 'stop' : t >= v5.s ? (t > wt('v5', 'soltar') - 0.3 ? 'point' : 'wave') : t >= v4.s ? 'pointUp' : 'present';
    veri(c, { x: 150 + e.dx, y: 792 + e.dy, s: 0.86, t, talk: talkOf('veri', t), arms, mood: t >= v4.s && t < v5.s ? 'serious' : 'happy', gest: speaking('veri', t), rot: e.rot });
    speedLines(c, 150 + e.dx, 792, pr(t, M.s3_out, M.s3_out + 0.45));
  }
}

// ---------- CENA 4 + 5 (Seu Carlos, congelamento com lupa) ----------
function carlosTime(t) { return t < M.freeze2 ? t : t < M.unfreeze2 ? M.freeze2 : M.freeze2 + (t - M.unfreeze2); }
function scene4(c, t) {
  const te = carlosTime(t);
  const c1 = L_('carlos1'), c2 = L_('carlos2');
  const notify = M.s4 + 4.4;
  if (te < M.s4_search || te >= M.s4_think) {
    const think = te >= M.s4_think, after = te > M.freeze2 + 0.01;
    const cam = think ? camKF(te, [[M.s4_think, 270, 450, 1.7], [M.freeze2, 270, 430, 1.95], [M.freeze2 + 0.01, 270, 430, 1.95], [M.freeze2 + 3, 270, 450, 1.7]])
      : camKF(te, [[M.s4, 270, 500, 1.0], [notify, 270, 490, 1.15], [c1.s, 270, 430, 1.8], [c1.e, 270, 420, 1.95]]);
    c.save(); applyCam(c, cam, 0, te);
    carlosRoom(c, te);
    let mood = 'neutral', pose = 'phone', look = 0, lookY = 1;
    if (!think) {
      if (te > notify) { mood = 'surprised'; }
      if (te > c1.s - 0.2) { mood = 'suspicious'; lookY = 0; look = 0.4; }
      if (te > wt('carlos1', 'Será') - 0.2) { mood = 'thinking'; pose = 'chin'; }
    } else {
      mood = 'thinking'; pose = 'chin'; lookY = -0.6; look = 0.7;
      if (after) { mood = 'determined'; pose = 'type'; lookY = 1; look = 0; }
    }
    person(c, 'carlos', { x: 270, y: 700, sit: true, t: te, talk: talkOf('carlos', te), mood, pose, look, lookY, glow: pose !== 'chin', nod: after ? Math.sin(te * 6) * 3 * (1 - pr(te, M.freeze2 + 1.2, M.freeze2 + 1.6)) : 0 });
    if (think) {
      for (let i = 0; i < 3; i++) { const k = pop(te, M.s4_think + 0.2 + i * 0.35); if (k <= 0 || after) continue; c.save(); c.translate(320 + i * 32, 290 - i * 34 + Math.sin(te * 3 + i) * 4); c.scale(k, k); txt(c, '?', 0, 0, 30 + i * 6, COL.navy, { stroke: '#fff', sw: 5 }); c.restore(); }
    }
    if (!think && te > notify && te < c1.s + 0.5) {
      // balão com prévia do grupo
      const k = pop(te, notify + 0.15) * (1 - pr(te, c1.s, c1.s + 0.5));
      c.save(); c.translate(400, 330); c.scale(k * 0.8, k * 0.8);
      phoneFrame(c, 0, 0, 200, 300, (x, y, w, h) => { c.save(); c.translate(x, y); c.scale(0.55, 0.55); chatScreen(c, 0, 0, w / 0.55, h / 0.55, [{ from: 'neide', text: URG, fwd: true, at: 0, time: '16:02' }, { from: 'ze', img: true, text: '', at: 0, time: '16:31' }], 99, { fs: 15 }); c.restore(); });
      c.restore();
    }
    c.restore();
    locChip(c, te, M.s4 + 0.4, notify, 'Casa do Seu Carlos');
  } else {
    // pesquisa no celular
    gradBG(c, '#0B1430', '#14213D'); dots(c, te);
    const k = eo(pr(te, M.s4_search, M.s4_search + 0.4));
    c.save(); c.translate(270, 470); c.scale(lerp(0.75, 1, k), lerp(0.75, 1, k)); c.translate(-270, -470); c.globalAlpha = k;
    phoneFrame(c, 270, 470, 380, 740, (x, y, w, h) => searchScreen(c, x, y, w, h, te, { t0: M.s4_search + 0.2, r: [M.s4_r1, M.s4_r2, M.s4_r3, M.s4_r4] }));
    c.restore();
    // "nada" carimbos sincronizados com a fala
    if (te > c2.s) {
      const stamp = te > wt('carlos2', 'Nenhuma') - 0.2;
      if (stamp) { const kk = pop(te, wt('carlos2', 'Nenhuma') - 0.2); c.save(); c.translate(270, 560); c.rotate(-0.14); c.scale(kk, kk); fillRR(c, -190, -40, 380, 80, 14, 'rgba(230,57,70,.95)'); txt(c, 'NENHUMA CONFIRMAÇÃO', 0, -6, 26, '#fff'); txt(c, 'em fonte confiável', 0, 22, 17, '#fff', { w: 700 }); c.restore(); }
    }
  }
  freezeFX(c, t, M.freeze2, M.unfreeze2);
  if (t >= M.freeze2 && t < M.unfreeze2) scene5Overlay(c, t);
}

const TIPS = [
  ['tip1', 'v8', 'building', 'Confira a fonte', 'Quem publicou? É um órgão oficial ou um site confiável?'],
  ['tip2', 'v9', 'news', 'Procure em outros veículos', 'Se for verdade, outras fontes confiáveis vão falar disso.'],
  ['tip3', 'v10', 'calendar', 'Confira a data', 'Notícia antiga pode voltar como se fosse nova.'],
  ['tip4', 'v11', 'alert', 'Desconfie do alarme', '"URGENTE", "COMPARTILHE AGORA" e medo sem provas.'],
  ['tip5', 'v12', 'people', 'Conhecido não é prova', 'Não compartilhe só porque veio de alguém conhecido.'],
];
function scene5Overlay(c, t) {
  const v6 = L_('v6'), v7 = L_('v7'), v13 = L_('v13');
  const e = veriEnter(t, M.s5_in, M.s5_out);
  // estrelas no "Muito bem"
  if (t > v6.s && t < v7.s) {
    for (let i = 0; i < 6; i++) { const k = pop(t, v6.s + i * 0.12); const a = i / 6 * TAU + t; c.save(); c.translate(270 + Math.cos(a) * 170, 360 + Math.sin(a) * 120); c.scale(k, k); star(c, 0, 0, 16, COL.yellow); c.restore(); }
    const k = pop(t, v6.s + 0.1); c.save(); c.translate(270, 200); c.rotate(-0.06); c.scale(k, k); pill(c, 0, 0, 'MUITO BEM!', COL.teal, '#fff', 34); c.restore();
  }
  if (t > v7.s && t < v13.s + 0.2) {
    const k = pr(t, v7.s, v7.s + 0.4) * (1 - pr(t, v13.s - 0.2, v13.s + 0.2));
    card(c, 26, 120, 488, 400, k, 0.012);
    txt(c, 'Como identificar uma', 244, 40, 22, COL.navy);
    txt(c, 'NOTÍCIA FALSA?', 244, 72, 30, COL.red);
    // progresso
    TIPS.forEach((tp, i) => { const on = t > M[tp[0]]; circ(c, 164 + i * 40, 112, 14, on ? COL.teal : '#E3E8EF'); if (i < 4) txt(c, String(i + 1), 164 + i * 40, 113, 15, on ? '#fff' : '#9AA5B8'); else heart(c, 164 + i * 40, 112, 6, on ? '#fff' : '#9AA5B8'); });
    let cur = -1; TIPS.forEach((tp, i) => { if (t > M[tp[0]]) cur = i; });
    if (cur < 0) { magnifier(c, 244, 250, 2.2, COL.teal); }
    else {
      const tp = TIPS[cur]; const kk = pop(t, M[tp[0]], 0.45);
      c.save(); c.translate(244, 260); c.scale(kk, kk);
      circ(c, 0, -40, 62, '#EAF6F5'); drawIcon(c, tp[2], 0, -40, 1.05);
      if (tp[0] === 'tip3') { c.beginPath(); c.ellipse(0, -28, 40, 22, 0, 0, TAU); c.strokeStyle = COL.red; c.lineWidth = 4; c.stroke(); }
      if (tp[0] === 'tip4') { line(c, [[-46, -86], [46, 6]], COL.red, 9); }
      if (tp[0] === 'tip2') { drawIcon(c, 'news2', 40, -18, 0.6); drawIcon(c, 'check', -44, -78, 0.4); }
      if (tp[0] === 'tip1') { drawIcon(c, 'check', 46, -80, 0.4); }
      txt(c, (cur < 4 ? (cur + 1) + '. ' : '') + tp[3], 0, 48, 27, COL.navy);
      wrap(c, tp[4], 420, 18, 700).forEach((l, j) => txt(c, l, 0, 84 + j * 24, 18, '#3D4A66', { w: 700 }));
      c.restore();
    }
    c.restore();
  }
  if (e.vis) {
    let arms = 'thumb';
    if (t > v6.e) arms = 'lupa';
    if (t > M.tip1 && t < L_('v8').e) arms = 'lupaEye';
    if (t > M.tip3 && t < L_('v10').e - 1.5) arms = 'lupaEye';
    if (t > v13.s) arms = 'point';
    veri(c, { x: 135 + e.dx, y: 792 + e.dy, s: 0.86, t, talk: talkOf('veri', t), arms, mood: t > M.tip4 && t < L_('v11').e ? 'serious' : 'happy', gest: speaking('veri', t), rot: e.rot });
    speedLines(c, 135 + e.dx, 792, pr(t, M.s5_out, M.s5_out + 0.45));
  }
}
function star(c, x, y, r, col) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr_, y + Math.sin(a) * rr_); } c.closePath(); c.fillStyle = col; c.fill();
}

// ---------- CENA 6 ----------
function scene6(c, t) {
  if (t < M.s6_type) {
    const cam = camKF(t, [[M.s6, 270, 470, 1.4], [M.s6_type, 270, 450, 1.7]]);
    c.save(); applyCam(c, cam, 0, t); carlosRoom(c, t);
    person(c, 'carlos', { x: 270, y: 700, sit: true, t, mood: 'determined', pose: 'type', lookY: 1, glow: true });
    c.restore();
    locChip(c, t, M.s6 + 0.4, M.s6_type, 'De volta ao grupo da família');
    return;
  }
  if (t < M.s6_rafa) {
    gradBG(c, '#0B1430', '#14213D'); dots(c, t);
    const typed = t < M.s6_send ? CARLOS_MSG.slice(0, Math.floor(pr(t, M.s6_type, M.s6_send - 0.1) * CARLOS_MSG.length)) : '';
    const k = eo(pr(t, M.s6_type, M.s6_type + 0.35));
    c.save(); c.globalAlpha = k;
    phoneFrame(c, 270, 470, 380, 760, (x, y, w, h) => chatScreen(c, x, y, w, h, [
      { from: 'neide', text: URG, fwd: true, at: 0, dim: M.s6_send + 1, time: '16:02' },
      { from: 'ze', img: true, text: '', at: 0, time: '16:31', dim: M.s6_send + 1 },
      { from: 'carlos', mine: true, text: CARLOS_MSG, at: M.s6_send, time: '17:05', react: { at: L_('carlos3').e - 0.6, n: 3 } },
    ], t, { typing: typed }));
    c.restore();
    return;
  }
  if (t < M.s6_lucia) {
    const l = L_('rafa2');
    const cam = camKF(t, [[M.s6_rafa, 270, 470, 1.6], [l.e, 270, 455, 1.8]]);
    c.save(); applyCam(c, cam, 0, t); livingRoom(c, t);
    rafaOnSofa(c, t, { mood: t < l.s + 1 ? 'surprised' : 'relieved', pose: t < l.s + 1.2 ? 'phone' : 'chest', glow: false, lookY: t < l.s + 1 ? 1 : 0 });
    c.restore(); return;
  }
  if (t < M.s6_ze) {
    const l = L_('lucia2');
    const cam = camKF(t, [[M.s6_lucia, 240, 470, 1.45], [l.e, 230, 440, 1.65]]);
    c.save(); applyCam(c, cam, 0, t); kitchen(c, t);
    person(c, 'lucia', { x: 245, y: 720, t, talk: talkOf('lucia', t), mood: t > wt('lucia2', 'Da') - 0.2 ? 'happy' : 'sheepish', pose: t > wt('lucia2', 'Da') - 0.2 ? 'down' : 'scratch', gest: true });
    kitchenCounter(c, t, { bags: true });
    c.restore(); return;
  }
  if (t < M.s6_neide) {
    const l = L_('ze2');
    const cam = camKF(t, [[M.s6_ze, 260, 500, 1.3], [l.e, 250, 470, 1.5]]);
    c.save(); applyCam(c, cam, 0, t); zeRoom(c, t);
    // pilha de velas e água
    for (let r = 0; r < 7; r++) for (let k = 0; k < 3 - (r > 4 ? 1 : 0); k++) candleBox(c, 90 + k * 54 + (r % 2) * 10, 760 - r * 30, 1);
    for (let k = 0; k < 3; k++) waterPack(c, 420 + k * 40, 770, 0.9);
    person(c, 'ze', { x: 300, y: 790, t, talk: talkOf('ze', t), mood: t > l.e - 0.3 ? 'sheepish' : 'surprised', pose: 'scratch', gest: false });
    c.restore(); return;
  }
  if (t < M.s6_all) {
    const l = L_('neide2');
    const cam = camKF(t, [[M.s6_neide, 270, 470, 1.6], [l.e, 270, 455, 1.8]]);
    c.save(); applyCam(c, cam, 0, t); neideRoom(c, t);
    person(c, 'neide', { x: 270, y: 690, sit: true, t, talk: talkOf('neide', t), mood: 'sheepish', pose: 'pray', gest: false });
    c.restore(); return;
  }
  // todos juntos: mosaico
  gradBG(c, '#0B1430', '#1E3163'); dots(c, t);
  const panels = [['rafa', 20, 150], ['lucia', 280, 150], ['ze', 20, 420], ['neide', 280, 420]];
  panels.forEach(([who, x, y], i) => {
    const k = pop(t, M.s6_all + 0.1 + i * 0.15);
    c.save(); c.translate(x + 120, y + 125); c.scale(k, k); c.translate(-(x + 120), -(y + 125));
    shadowed(c, 16, 'rgba(0,0,0,.4)', 6, () => fillRR(c, x, y, 240, 250, 22, '#fff'));
    c.save(); rr(c, x + 8, y + 8, 224, 234, 16); c.clip();
    c.translate(x + 120, y + 125); c.scale(0.6, 0.6); c.translate(-270, -400);
    if (who === 'rafa') { livingRoom(c, t); rafaOnSofa(c, t, { mood: 'happy', pose: 'thumb', glow: false }); }
    if (who === 'lucia') { kitchen(c, t); person(c, 'lucia', { x: 245, y: 720, t, mood: 'happy', pose: 'wave' }); kitchenCounter(c, t, { bags: true }); }
    if (who === 'ze') { zeRoom(c, t); person(c, 'ze', { x: 270, y: 760, t, mood: 'happy', pose: 'thumb' }); }
    if (who === 'neide') { neideRoom(c, t); person(c, 'neide', { x: 270, y: 690, sit: true, t, mood: 'happy', pose: 'wave' }); }
    c.restore();
    pill(c, x + 120, y + 232, CH_NAMES[who], COL[who], '#fff', 14);
    c.restore();
  });
  const kc = pop(t, M.s6_all + 0.8);
  c.save(); c.translate(270, 418); c.scale(kc, kc); circ(c, 0, 0, 74, COL.yellow); avatar(c, 'carlos', 0, 0, 66, { t, mood: 'happy', ring: '#fff' }); c.restore();
  for (let i = 0; i < 8; i++) { const ph = ((t - M.s6_all) * 0.5 + i / 8) % 1; if (t < M.s6_all + 0.8) break; c.globalAlpha = Math.sin(ph * Math.PI); heart(c, 60 + i * 60, 700 - ph * 560, 10, i % 2 ? '#FF8FA3' : COL.red); c.globalAlpha = 1; }
  txt(c, 'Família avisada. Boato interrompido.', 270, 720, 22, '#fff', { stroke: COL.navy, sw: 6 });
}

// ---------- CENA 7 ----------
function familyTogether(c, t) {
  livingRoom(c, t);
  person(c, 'carlos', { x: 270, y: 585, s: 0.9, t, mood: 'happy', pose: 'down', gest: false, look: -0.5 });
  sofa(c, 95, 470, 350, THEMES.rafa);
  person(c, 'rafa', { x: 205, y: 690, sit: true, t, mood: 'happy', pose: 'down', look: 1, gest: false });
  person(c, 'lucia', { x: 335, y: 690, sit: true, t, mood: 'happy', pose: 'down', look: -1, gest: false });
  person(c, 'ze', { x: 70, y: 760, t, mood: 'happy', pose: 'box', gest: false, look: 1 });
  candleBox(c, 70, 640, 1.1);
  person(c, 'neide', { x: 470, y: 760, t, mood: 'happy', pose: 'wave', gest: false, look: -1 });
}
function scene7(c, t) {
  if (t < M.final) {
    const cam = camKF(t, [[M.s7, 270, 520, 1.12], [M.s7_in, 270, 500, 1.0]]);
    c.save(); applyCam(c, cam, 0, t); familyTogether(c, t); c.restore();
    locChip(c, t, M.s7 + 0.4, M.s7_in + 1, 'Domingo · A família reunida');
    if (t > M.s7_in) { c.globalAlpha = 0.5 * pr(t, M.s7_in, M.s7_in + 0.5); c.fillStyle = '#0B1430'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    const v14 = L_('v14'), v15 = L_('v15'), v16 = L_('v16'), v21 = L_('v21');
    const panelOn = t > v14.s && t < v21.s + 0.3;
    if (panelOn) {
      const k = pr(t, v14.s, v14.s + 0.4) * (1 - pr(t, v21.s - 0.1, v21.s + 0.3));
      card(c, 26, 120, 488, 420, k, -0.01);
      if (t < v15.s) {
        txt(c, 'Como o boato correu', 244, 40, 24, COL.navy);
        const chain = [['neide', 'Tia Neide'], ['rafa', 'Rafa'], ['lucia', 'Mãe'], ['ze', 'Vovô Zé'], ['carlos', 'Seu Carlos']];
        const pts = [[70, 170], [175, 110], [290, 170], [390, 110], [420, 270]];
        const k0 = pop(t, v14.s + 0.2); c.save(); c.translate(80, 300); c.scale(k0, k0); drawIcon(c, 'alert', 0, 0, 0.8); c.restore();
        chain.forEach(([w, nm], i) => {
          const at = wt('v14', 'passou') - 0.5 + i * 0.45, kk = pop(t, at);
          if (i > 0 && kk > 0) line(c, [pts[i - 1], [lerp(pts[i - 1][0], pts[i][0], clamp(kk)), lerp(pts[i - 1][1], pts[i][1], clamp(kk))]], COL.red, 4);
          if (kk <= 0) return;
          c.save(); c.translate(pts[i][0], pts[i][1]); c.scale(kk, kk); avatar(c, w, 0, 0, 34, { t, mood: w === 'carlos' ? 'thinking' : 'worried', ring: w === 'carlos' ? COL.teal : COL.red }); pill(c, 0, 50, nm, '#fff', COL.navy, 12); c.restore();
        });
        const v = wt('v14', 'verificar') - 0.3;
        if (t > v) { const kk = pop(t, v); c.save(); c.translate(270, 360); c.scale(kk, kk); pill(c, 0, 0, 'Quase ninguém verificou!', COL.red, '#fff', 20); c.restore(); }
      } else if (t < v16.s) {
        txt(c, 'Fake news prejudicam todo mundo', 244, 40, 22, COL.navy);
        const its = [['fear', 'Medo', 'medo'], ['cart', 'Correria e prejuízo', 'prejudicar'], ['megaphone', 'Desinformação', 'desinformação']];
        its.forEach(([ic, lb, w], i) => { const kk = pop(t, wt('v15', w) - 0.25); if (kk <= 0) return; c.save(); c.translate(90 + i * 150, 180); c.scale(kk, kk); circ(c, 0, 0, 52, '#F1F4FA'); drawIcon(c, ic, 0, ic === 'cart' ? -4 : 0, ic === 'cart' ? 0.9 : 0.95); txt(c, lb, 0, 82, 16, COL.navy); c.restore(); });
        if (t > wt('v15', 'afetam')) { const kk = pop(t, wt('v15', 'afetam')); c.save(); c.translate(244, 330); c.scale(kk, kk); pill(c, 0, 0, 'não só quem acredita', COL.navy, '#fff', 18); c.restore(); }
      } else {
        const words = [['PARE', 'pare', COL.red], ['PENSE', 'pense', COL.yellow], ['PESQUISE', 'pesquise', COL.teal]];
        if (t < M.list) {
          txt(c, 'Antes de compartilhar...', 244, 40, 24, COL.navy);
          words.forEach(([w, f, col], i) => { const kk = pop(t, wt('v16', f) - 0.15); if (kk <= 0) return; c.save(); c.translate(244, 130 + i * 92); c.rotate((i - 1) * 0.04); c.scale(kk, kk); pill(c, 0, 0, w, col, i === 1 ? COL.navy : '#fff', 40); c.restore(); });
        } else {
          txt(c, 'Lembre-se', 244, 40, 26, COL.navy);
          const items = [['li1', 'Verifique a fonte.'], ['li2', 'Confira a data.'], ['li3', 'Pesquise antes de compartilhar.'], ['li4', 'Não espalhe informações sem confirmação.']];
          items.forEach(([m, label], i) => {
            const kk = pop(t, M[m]); if (kk <= 0) return;
            const y = 100 + i * 74;
            c.save(); c.translate(40, y); c.globalAlpha = clamp(kk);
            fillRR(c, 0, 0, 408, 60, 14, '#F1F4FA');
            circ(c, 32, 30, 20, COL.teal); line(c, [[22, 30], [29, 37], [42, 22]], '#fff', 5);
            txt(c, (i + 1) + '.', 64, 31, 20, COL.navy, { a: 'left' });
            wrap(c, label, 300, 18, 800).forEach((l, j, arr) => txt(c, l, 88, 31 + (j - (arr.length - 1) / 2) * 21, 18, COL.navy, { a: 'left', w: 800 }));
            c.restore();
          });
        }
      }
      c.restore();
    }
    if (t > M.s7_in) {
      const k = eob(pr(t, M.s7_in, M.s7_in + 0.55));
      const big = t > v21.s - 0.2; const bk = eio(pr(t, v21.s - 0.2, v21.s + 0.5));
      const x = lerp(140, 270, bk), y = lerp(792, 800, bk), s = lerp(0.86, 1.25, bk);
      let arms = 'present';
      if (t < v14.s + 1) arms = 'wave';
      else if (t > M.list && t < v21.s) arms = 'pointUp';
      else if (big) arms = t > wt('v21', 'Não') - 0.2 ? 'stop' : 'present';
      veri(c, { x, y: y + (1 - k) * 420, s, t, talk: talkOf('veri', t), arms, gest: speaking('veri', t), mood: big && t > wt('v21', 'mentira') - 0.3 ? 'serious' : 'happy' });
    }
    return;
  }
  if (t < M.credits) {
    // tela final
    gradBG(c, '#0B1430', '#1E3163'); dots(c, t);
    const v22 = L_('v22');
    const ws = [['PARE.', M.final + 0.1, '#fff'], ['PENSE.', M.final + 0.45, COL.yellow], ['VERIFIQUE.', M.final + 0.8, COL.teal]];
    // sincroniza com a voz, se já estiver falando
    ws[0][1] = Math.min(ws[0][1], wt('v22', 'Pare') - 0.1); ws[1][1] = Math.min(ws[1][1], wt('v22', 'Pense') - 0.1); ws[2][1] = Math.min(ws[2][1], wt('v22', 'Verifique') - 0.1);
    ws.forEach(([w, at, col], i) => { const k = pop(t, at, 0.5); if (k <= 0) return; c.save(); c.translate(270, 210 + i * 92); c.scale(k, k); c.rotate((i - 1) * -0.03); txt(c, w, 0, 0, i === 2 ? 70 : 76, col, { stroke: '#0B1430', sw: 10 }); c.restore(); });
    const k4 = pr(t, wt('v22', 'informação') - 0.3, wt('v22', 'informação') + 0.3);
    c.globalAlpha = k4; fillRR(c, 40, 470, 460, 96, 22, 'rgba(255,255,255,.1)');
    txt(c, 'A informação também é', 270, 502, 26, '#fff'); txt(c, 'responsabilidade sua!', 270, 536, 30, COL.yellow); c.globalAlpha = 1;
    for (let i = 0; i < 14; i++) { const ph = ((t - M.final) * 0.35 + hash(i)) % 1; c.globalAlpha = Math.sin(ph * Math.PI) * 0.8; star(c, hash(i + 4) * W, 640 - ph * 600, 6 + hash(i) * 6, i % 2 ? COL.yellow : '#fff'); c.globalAlpha = 1; }
    veri(c, { x: 270, y: 800 + (1 - eob(pr(t, M.final, M.final + 0.6))) * 300, s: 0.8, t, talk: talkOf('veri', t), arms: t > v22.e ? 'wave' : 'thumb', gest: speaking('veri', t) });
    return;
  }
  // créditos
  gradBG(c, '#0B1430', '#14213D');
  const a = pr(t, M.credits, M.credits + 0.6) * (1 - pr(t, M.end - 1.2, M.end));
  c.globalAlpha = a;
  txt(c, 'O APAGÃO', 270, 150, 48, '#fff'); txt(c, 'QUE PAROU O BRASIL', 270, 198, 32, COL.yellow);
  txt(c, 'Um curta educativo sobre fake news na família', 270, 245, 17, '#BFD7FF', { w: 700 });
  const cast = ['rafa', 'lucia', 'ze', 'neide', 'carlos'];
  cast.forEach((w, i) => { const x = 70 + i * 100; avatar(c, w, x, 340, 36, { t, mood: 'happy' }); txt(c, CH_NAMES[w], x, 396, 14, '#fff', { w: 800 }); });
  avatar(c, 'veri', 270, 470, 40, { t, ring: COL.yellow }); txt(c, 'Veri, o narrador', 270, 528, 16, COL.yellow);
  txt(c, 'Trabalho escolar · Senac', 270, 610, 22, '#fff');
  txt(c, 'Tema: Fake news na família', 270, 642, 16, '#BFD7FF', { w: 700 });
  txt(c, 'História e personagens fictícios.', 270, 700, 14, 'rgba(255,255,255,.65)', { w: 600 });
  txt(c, 'Vozes geradas por síntese de voz neural (pt-BR).', 270, 722, 14, 'rgba(255,255,255,.65)', { w: 600 });
  txt(c, 'Pare. Pense. Verifique.', 270, 800, 24, COL.teal);
  c.globalAlpha = 1;
}

// ===================== render principal =====================
function render(c, t) {
  c.save();
  c.fillStyle = '#0B1430'; c.fillRect(0, 0, W, H);
  if (t < M.s1) opening(c, t);
  else if (t < M.s2) scene1(c, t);
  else if (t < M.s4) scene2(c, t);
  else if (t < M.s6) scene4(c, t);
  else if (t < M.s7) scene6(c, t);
  else scene7(c, t);
  c.restore();
  wipes(c, t);
  sceneCard(c, t);
  if (window.SUBS !== false) subtitles(c, t);
}
