// ===================== celular, ícones e sobreposições =====================
function phoneFrame(c, cx, cy, w, h, fn) {
  const x = cx - w / 2, y = cy - h / 2;
  shadowed(c, 40, 'rgba(0,0,0,.45)', 16, () => fillRR(c, x, y, w, h, 40, '#1d1f2b'));
  c.strokeStyle = '#3a3d52'; c.lineWidth = 3; rr(c, x + 2, y + 2, w - 4, h - 4, 38); c.stroke();
  const sx = x + 12, sy = y + 12, sw = w - 24, sh = h - 24;
  c.save(); rr(c, sx, sy, sw, sh, 30); c.clip(); fn(sx, sy, sw, sh); c.restore();
  fillRR(c, cx - 40, y + 18, 80, 20, 10, '#1d1f2b');
}

const NAMECOL = { veri: '#178A80', rafa: '#D9601A', lucia: '#C2334B', ze: '#52733A', neide: '#7A3DB8', carlos: '#1F6A9C' };
const URG = 'URGENTE! APAGÃO NACIONAL! Estão dizendo que o Brasil inteiro ficará sem energia por vários dias! Comprem velas, água e alimentos antes que acabem! COMPARTILHEM!';
const CARLOS_MSG = 'Pessoal, fui pesquisar e não encontrei nenhuma fonte confiável confirmando esse apagão nacional. Não vamos espalhar essa informação sem confirmação!';

function chatHeader(c, x, y, w, t, title = 'Família Unida', sub = 'Mãe, Vovô Zé, Tia Neide, Seu Carlos, você') {
  c.fillStyle = '#1F7A6D'; c.fillRect(x, y, w, 92);
  line(c, [[x + 24, y + 58], [x + 16, y + 66], [x + 24, y + 74]], '#fff', 3);
  avatar(c, 'ze', x + 50, y + 66, 13, { t, ring: '#1F7A6D' }); avatar(c, 'neide', x + 64, y + 60, 13, { t, ring: '#1F7A6D' }); avatar(c, 'lucia', x + 64, y + 74, 13, { t, ring: '#1F7A6D' });
  txt(c, title, x + 88, y + 58, 19, '#fff', { a: 'left', w: 800 });
  heart(c, x + 88 + 128, y + 58, 7, '#FF8FA3');
  txt(c, sub, x + 88, y + 78, 11.5, 'rgba(255,255,255,.8)', { a: 'left', w: 600 });
}
function chatBG(c, x, y, w, h) {
  c.fillStyle = '#ECE5DD'; c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(0,0,0,.035)';
  for (let yy = y; yy < y + h; yy += 40) for (let xx = x + ((yy / 40) % 2) * 20; xx < x + w; xx += 40) { c.beginPath(); c.arc(xx, yy, 5, 0, TAU); c.fill(); }
}
function fwdArrow(c, x, y, col) { line(c, [[x, y + 4], [x + 4, y - 1], [x + 10, y - 1]], col, 1.8); line(c, [[x + 7, y - 4], [x + 10, y - 1], [x + 7, y + 2]], col, 1.8); }

// msgs: {from, text, fwd, at, mine, img, dim}
function chatScreen(c, x, y, w, h, msgs, t, o = {}) {
  chatBG(c, x, y, w, h);
  const top = y + 100, bottom = y + h - 66, maxW = w * 0.8;
  const items = [];
  let total = 0;
  for (const m of msgs) {
    if (t < m.at) continue;
    const fs = o.fs || 15.5;
    const lines = m.text ? wrap(c, m.text, maxW - 24, fs, 600) : [];
    let bh = 14 + (m.mine ? 0 : 18) + (m.fwd ? 18 : 0) + lines.length * (fs * 1.3) + (m.img ? 110 : 0) + 16;
    items.push({ m, lines, bh, fs }); total += bh + 10;
  }
  const avail = bottom - top;
  let yy = top + Math.min(0, avail - total);
  // rolagem suave
  for (const it of items) {
    const { m, lines, bh, fs } = it;
    const k = eob(pr(t, m.at, m.at + 0.35));
    const bw = Math.min(maxW, Math.max(m.img ? 190 : 0, ...lines.map(l => { c.font = `600 ${fs}px ${FD}`; return c.measureText(l).width + 26; }), m.fwd ? 210 : 120));
    const bx = m.mine ? x + w - bw - 12 : x + 12;
    c.save(); c.translate(bx + (m.mine ? bw : 0), yy); c.scale(k, k); c.translate(-(bx + (m.mine ? bw : 0)), -yy);
    c.globalAlpha = m.dim && t > m.dim ? 0.45 : 1;
    shadowed(c, 4, 'rgba(0,0,0,.15)', 1, () => fillRR(c, bx, yy, bw, bh, 12, m.mine ? '#DCF8C6' : '#fff'));
    let cy = yy + 10;
    if (!m.mine) { txt(c, CH_NAMES[m.from], bx + 12, cy + 7, 13.5, NAMECOL[m.from], { a: 'left', w: 800 }); cy += 18; }
    if (m.fwd) { fwdArrow(c, bx + 12, cy + 7, '#8a8a8a'); txt(c, 'Encaminhada com frequência', bx + 28, cy + 7, 12, '#8a8a8a', { a: 'left', w: 600 }); cy += 18; }
    if (m.img) { c.save(); rr(c, bx + 10, cy + 2, bw - 20, 102, 8); c.clip(); c.fillStyle = '#DCE3E8'; c.fillRect(bx + 10, cy + 2, bw - 20, 102); c.fillStyle = '#F8F3E6'; c.fillRect(bx + 10, cy + 2, bw - 20, 50); cart(c, bx + bw / 2, cy + 98, 0.85, 1, 0); c.restore(); cy += 110; }
    for (const l of lines) { txt(c, l, bx + 12, cy + fs * 0.65, fs, '#1b1b1b', { a: 'left', w: 600 }); cy += fs * 1.3; }
    txt(c, m.time || '16:42', bx + bw - 10, yy + bh - 9, 10.5, '#8a8a8a', { a: 'right', w: 600 });
    if (m.mine) { line(c, [[bx + bw - 52, yy + bh - 9], [bx + bw - 48, yy + bh - 5], [bx + bw - 42, yy + bh - 13]], '#34B7F1', 1.8); line(c, [[bx + bw - 46, yy + bh - 7], [bx + bw - 44, yy + bh - 5], [bx + bw - 37, yy + bh - 13]], '#34B7F1', 1.8); }
    // reações
    if (m.react && t > m.react.at) {
      const kk = eob(pr(t, m.react.at, m.react.at + 0.4));
      c.save(); c.translate(bx + 30, yy + bh + 2); c.scale(kk, kk);
      fillRR(c, -14, -12, 28 + (m.react.n - 1) * 22, 24, 12, '#fff');
      for (let i = 0; i < m.react.n; i++) { const ix = i * 22; if (i % 2 === 0) heart(c, ix, 0, 6.5, '#E63946'); else thumbIcon(c, ix, 0, 0.55); }
      c.restore();
    }
    c.restore();
    yy += bh + 10 + (m.react ? 14 : 0);
  }
  chatHeader(c, x, y, w, t);
  // caixa de texto
  c.fillStyle = '#F0F0F0'; c.fillRect(x, y + h - 62, w, 62);
  fillRR(c, x + 10, y + h - 52, w - 70, 40, 20, '#fff');
  const typed = o.typing || '';
  if (typed) {
    const ls = wrap(c, typed, w - 100, 13, 600); const last = ls.slice(-1)[0] || '';
    txt(c, (ls.length > 1 ? '…' : '') + last + ((t * 2) % 1 < 0.5 ? '|' : ''), x + 24, y + h - 32, 13, '#222', { a: 'left', w: 600 });
  } else txt(c, 'Mensagem', x + 24, y + h - 32, 14, '#9a9a9a', { a: 'left', w: 600 });
  circ(c, x + w - 32, y + h - 32, 21, '#1F7A6D');
  c.beginPath(); c.moveTo(x + w - 41, y + h - 40); c.lineTo(x + w - 22, y + h - 32); c.lineTo(x + w - 41, y + h - 24); c.lineTo(x + w - 37, y + h - 32); c.closePath(); c.fillStyle = '#fff'; c.fill();
}
const CH_NAMES = { veri: 'Veri', rafa: 'Rafa', lucia: 'Mãe Lúcia', ze: 'Vovô Zé', neide: 'Tia Neide', carlos: 'Seu Carlos' };

function forwardScreen(c, x, y, w, h, t, t0) {
  c.fillStyle = '#fff'; c.fillRect(x, y, w, h);
  c.fillStyle = '#1F7A6D'; c.fillRect(x, y, w, 92);
  txt(c, 'Encaminhar para...', x + 24, y + 64, 19, '#fff', { a: 'left' });
  const list = [['lucia', 'Mãe'], ['ze', 'Vovô Zé'], ['carlos', 'Seu Carlos'], ['neide', 'Tia Neide']];
  list.forEach(([who, nm], i) => {
    const yy = y + 130 + i * 70;
    avatar(c, who, x + 44, yy, 24, { t });
    txt(c, nm, x + 82, yy, 17, '#1b1b1b', { a: 'left', w: 700 });
    const on = t > t0 + 0.2 + i * 0.25 && who !== 'neide';
    c.beginPath(); c.arc(x + w - 40, yy, 13, 0, TAU); c.fillStyle = on ? '#1F7A6D' : '#fff'; c.fill(); c.strokeStyle = '#1F7A6D'; c.lineWidth = 2; c.stroke();
    if (on) line(c, [[x + w - 46, yy], [x + w - 41, yy + 5], [x + w - 33, yy - 5]], '#fff', 2.6);
  });
  const k = pr(t, t0 + 1.2, t0 + 1.25);
  const bx = x + w - 50, by = y + h - 60;
  circ(c, bx, by, 28 * (1 - k * 0.1), '#1F7A6D');
  // avião de papel voando
  const fk = pr(t, t0 + 1.25, t0 + 1.9);
  const px = bx + fk * 200, py = by - fk * 420;
  c.save(); c.translate(px, py); c.rotate(-0.6 * fk);
  c.beginPath(); c.moveTo(-12, -9); c.lineTo(14, 0); c.lineTo(-12, 9); c.lineTo(-7, 0); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.restore();
}

function searchScreen(c, x, y, w, h, t, o) {
  c.fillStyle = '#F7F9FC'; c.fillRect(x, y, w, h);
  c.fillStyle = '#fff'; c.fillRect(x, y, w, 150);
  magnifier(c, x + 40, y + 70, 0.5, '#1F6A9C');
  txt(c, 'Pesquisa', x + 62, y + 70, 22, '#1F6A9C', { a: 'left' });
  fillRR(c, x + 16, y + 98, w - 32, 40, 20, '#EEF2F7');
  const q = 'apagão nacional Brasil';
  const n = Math.floor(clamp((t - o.t0) / 2.4) * q.length);
  txt(c, q.slice(0, n) + (t < o.t0 + 2.8 && (t * 2) % 1 < 0.5 ? '|' : ''), x + 32, y + 118, 15, '#222', { a: 'left', w: 600 });
  magnifier(c, x + w - 38, y + 118, 0.28, '#888');
  const res = [
    ['building', 'Site oficial do setor de energia', 'Nenhum aviso sobre apagão nacional.'],
    ['news', 'Portal de notícias', 'Nenhuma reportagem sobre apagão nacional.'],
    ['news2', 'Outro portal de notícias', 'Nada encontrado sobre o assunto.'],
    ['check', 'Agência de checagem', 'A mensagem circula sem nenhuma fonte.'],
  ];
  if (t > o.t0 + 2.9) txt(c, 'Resultados para "apagão nacional"', x + 20, y + 172, 13, '#666', { a: 'left', w: 700 });
  res.forEach((r, i) => {
    const at = o.r[i]; if (t < at) return;
    const k = eo(pr(t, at, at + 0.35)); const yy = y + 192 + i * 98 + (1 - k) * 20;
    c.globalAlpha = k;
    shadowed(c, 8, 'rgba(0,0,0,.1)', 2, () => fillRR(c, x + 14, yy, w - 28, 86, 12, '#fff'));
    circ(c, x + 46, yy + 43, 22, '#EAF2FA'); drawIcon(c, r[0], x + 46, yy + 43, 0.42);
    txt(c, r[1], x + 78, yy + 26, 14, '#1F6A9C', { a: 'left', w: 800 });
    const ls = wrap(c, r[2], w - 120, 13, 600); ls.forEach((l, j) => txt(c, l, x + 78, yy + 48 + j * 16, 13, '#333', { a: 'left', w: 600 }));
    c.globalAlpha = 1;
  });
}

// ---------- ícones ----------
function heart(c, x, y, r, col) {
  c.beginPath(); c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.8, y - r * 0.2, x - r * 0.9, y - r * 1.6, x, y - r * 0.5);
  c.bezierCurveTo(x + r * 0.9, y - r * 1.6, x + r * 1.8, y - r * 0.2, x, y + r * 0.9); c.fillStyle = col; c.fill();
}
function thumbIcon(c, x, y, s, col = '#F4A261') {
  c.save(); c.translate(x, y); c.scale(s, s);
  fillRR(c, -12, -4, 8, 18, 2, '#457B9D'); fillRR(c, -4, -4, 16, 18, 5, col); fillRR(c, -2, -18, 8, 16, 4, col); c.restore();
}
function magnifier(c, x, y, s, col = '#14213D') {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.arc(-6, -6, 22, 0, TAU); c.strokeStyle = col; c.lineWidth = 8; c.stroke(); line(c, [[10, 10], [28, 28]], col, 10); c.restore();
}
function drawIcon(c, name, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  switch (name) {
    case 'building':
      c.fillStyle = '#1F6A9C'; c.beginPath(); c.moveTo(-40, -18); c.lineTo(0, -42); c.lineTo(40, -18); c.closePath(); c.fill();
      c.fillRect(-36, 28, 72, 10); for (let i = -3; i <= 3; i += 2) c.fillRect(i * 9 - 4, -12, 9, 38); break;
    case 'news': case 'news2':
      fillRR(c, -36, -30, 72, 60, 6, name === 'news' ? '#E63946' : '#F77F00'); c.fillStyle = '#fff'; c.fillRect(-28, -22, 56, 12);
      for (let i = 0; i < 3; i++) c.fillRect(-28, -2 + i * 10, i === 2 ? 30 : 56, 5); break;
    case 'check': circ(c, 0, 0, 36, '#2A9D8F'); line(c, [[-16, 0], [-4, 13], [18, -14]], '#fff', 9); break;
    case 'x': circ(c, 0, 0, 36, '#E63946'); line(c, [[-14, -14], [14, 14]], '#fff', 9); line(c, [[14, -14], [-14, 14]], '#fff', 9); break;
    case 'calendar':
      fillRR(c, -40, -36, 80, 76, 10, '#fff'); c.strokeStyle = '#14213D'; c.lineWidth = 4; rr(c, -40, -36, 80, 76, 10); c.stroke();
      c.fillStyle = '#E63946'; c.fillRect(-38, -34, 76, 20); line(c, [[-20, -44], [-20, -28]], '#14213D', 6); line(c, [[20, -44], [20, -28]], '#14213D', 6);
      txt(c, '2019', 0, 12, 26, '#14213D'); break;
    case 'phone':
      fillRR(c, -24, -40, 48, 80, 10, '#1d1f2b'); fillRR(c, -19, -33, 38, 64, 4, '#9EE7FF'); break;
    case 'alert':
      fillRR(c, -26, -42, 52, 84, 10, '#1d1f2b'); fillRR(c, -21, -35, 42, 68, 4, '#fff');
      fillRR(c, -18, -26, 36, 14, 3, '#E63946'); txt(c, '!!!', 0, -19, 11, '#fff');
      c.fillStyle = '#ccc'; c.fillRect(-16, -6, 32, 5); c.fillRect(-16, 4, 26, 5); c.fillRect(-16, 14, 30, 5); break;
    case 'share':
      circ(c, -20, 0, 9, '#14213D'); circ(c, 20, -20, 9, '#14213D'); circ(c, 20, 20, 9, '#14213D');
      line(c, [[-20, 0], [20, -20]], '#14213D', 5); line(c, [[-20, 0], [20, 20]], '#14213D', 5); break;
    case 'question': circ(c, 0, 0, 36, '#FFC93C'); txt(c, '?', 0, 4, 52, '#14213D'); break;
    case 'fear': circ(c, 0, 0, 36, '#BDE0FE'); ell(c, -12, -6, 6, 9, '#fff'); ell(c, 12, -6, 6, 9, '#fff'); circ(c, -12, -5, 3, '#14213D'); circ(c, 12, -5, 3, '#14213D'); ell(c, 0, 16, 7, 9, '#5B1F1F'); line(c, [[-20, -20], [-6, -16]], '#14213D', 3); line(c, [[20, -20], [6, -16]], '#14213D', 3); break;
    case 'worry': circ(c, 0, 0, 36, '#FFD6A5'); circ(c, -12, -4, 4, '#14213D'); circ(c, 12, -4, 4, '#14213D'); c.beginPath(); c.moveTo(-12, 18); c.quadraticCurveTo(0, 8, 12, 18); c.strokeStyle = '#5B1F1F'; c.lineWidth = 4; c.stroke(); line(c, [[-20, -14], [-6, -20]], '#14213D', 3); line(c, [[20, -14], [6, -20]], '#14213D', 3); break;
    case 'curious': circ(c, 0, 0, 36, '#CDB4DB'); circ(c, -12, -4, 4, '#14213D'); circ(c, 12, -4, 7, '#fff'); circ(c, 12, -4, 4, '#14213D'); line(c, [[-8, 16], [8, 14]], '#5B1F1F', 4); txt(c, '?', 26, -26, 26, '#14213D'); break;
    case 'cart': cart(c, 0, 40, 0.6, 1, 0); break;
    case 'people': [['rafa', -36], ['lucia', -12], ['ze', 12], ['neide', 36]].forEach(([w, xx]) => avatar(c, w, xx, 0, 20, { t: 0 })); break;
    case 'rewind': c.fillStyle = '#fff'; for (const o of [0, 26]) { c.beginPath(); c.moveTo(4 - o, -22); c.lineTo(-22 - o, 0); c.lineTo(4 - o, 22); c.closePath(); c.fill(); } break;
    case 'megaphone': c.fillStyle = '#E63946'; c.beginPath(); c.moveTo(-26, -10); c.lineTo(20, -30); c.lineTo(20, 30); c.lineTo(-26, 10); c.closePath(); c.fill(); fillRR(c, -36, -12, 14, 24, 4, '#14213D'); fillRR(c, -24, 10, 10, 22, 3, '#14213D'); break;
  }
  c.restore();
}

// ---------- legendas ----------
const chunkCache = {};
function chunks(l) {
  if (chunkCache[l.id]) return chunkCache[l.id];
  const out = []; let cur = [];
  l.words.forEach((w, i) => {
    cur.push(w);
    const end = /[.!?…:]$/.test(w[0]), comma = /,$/.test(w[0]);
    if (cur.length >= 8 || (end && cur.length >= 3) || (comma && cur.length >= 5) || i === l.words.length - 1) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return (chunkCache[l.id] = out);
}
const SUBNAME = { msg: 'Mensagem de Tia Neide' };
function subtitles(c, t) {
  let l = null; for (const x of LINES) if (t >= x.s - 0.05 && t < x.e + 0.35) { l = x; break; }
  if (!l) return;
  const ch = chunks(l); let k = 0;
  for (let i = 0; i < ch.length; i++) if (t >= ch[i][0][1] - 0.05) k = i;
  const words = ch[k];
  const size = 25; c.font = `800 ${size}px ${FD}`;
  // quebra em linhas
  const rows = []; let row = [], rw = 0; const sp = c.measureText(' ').width;
  for (const w of words) { const ww = c.measureText(w[0]).width; if (rw + ww > 470 && row.length) { rows.push([row, rw - sp]); row = []; rw = 0; } row.push([w, ww]); rw += ww + sp; }
  if (row.length) rows.push([row, rw - sp]);
  const lh = 31, baseY = 872 - (rows.length - 1) * lh;
  const a = pr(t, l.s - 0.05, l.s + 0.1) * (1 - pr(t, l.e + 0.15, l.e + 0.35));
  c.save(); c.globalAlpha = a;
  const g = c.createLinearGradient(0, 760, 0, 960); g.addColorStop(0, 'rgba(10,14,30,0)'); g.addColorStop(1, 'rgba(10,14,30,.7)'); c.fillStyle = g; c.fillRect(0, 760, W, 200);
  // nome
  const nm = SUBNAME[l.id] || l.name; c.font = `800 15px ${FD}`; const nw = c.measureText(nm).width + 26;
  fillRR(c, W / 2 - nw / 2, baseY - 46, nw, 26, 13, COL[l.who]);
  txt(c, nm, W / 2, baseY - 32, 15, '#fff');
  rows.forEach(([r, w], ri) => {
    let xx = W / 2 - w / 2; const yy = baseY + ri * lh;
    for (const [wd, ww] of r) {
      const said = t >= wd[1] - 0.02;
      c.font = `800 ${size}px ${FD}`; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.lineWidth = 6; c.strokeStyle = 'rgba(10,14,30,.9)'; c.lineJoin = 'round'; c.strokeText(wd[0], xx, yy);
      c.fillStyle = said ? (l.who === 'veri' ? '#FFE08A' : '#fff') : 'rgba(255,255,255,.5)'; c.fillText(wd[0], xx, yy);
      xx += ww + sp;
    }
  });
  c.restore();
}

// ---------- cartões de cena, transições, congelamento ----------
const SCENES = [['s1', 1, 'Uma mensagem inesperada'], ['s2', 2, 'O desespero se espalha'], ['s3', 3, 'Primeira interrupção do narrador'], ['s4', 4, 'A notícia começa a ser questionada'], ['s5', 5, 'Segunda interrupção do narrador'], ['s6', 6, 'A verdade chega ao grupo'], ['s7', 7, 'Encerramento']];
function sceneCard(c, t) {
  for (const [m, n, title] of SCENES) {
    const t0 = M[m] + (m === 's3' || m === 's5' ? 0.5 : 0.25), t1 = t0 + 3.2;
    if (t < t0 || t > t1) continue;
    const k = eo(pr(t, t0, t0 + 0.45)), ko = eio(pr(t, t1 - 0.4, t1));
    const y = 40 + (1 - k) * -90 + ko * -90;
    c.save(); c.font = `800 20px ${FD}`; const tw = Math.max(c.measureText(title).width, 80) + 40;
    shadowed(c, 12, 'rgba(0,0,0,.3)', 4, () => fillRR(c, W / 2 - tw / 2, y, tw, 64, 16, COL.navy));
    fillRR(c, W / 2 - 40, y - 12, 80, 24, 12, COL.yellow);
    txt(c, 'CENA ' + n, W / 2, y, 14, COL.navy);
    txt(c, title, W / 2, y + 36, 20, '#fff');
    c.restore();
  }
}
function locChip(c, t, t0, t1, label) {
  if (t < t0 || t > t1) return;
  const a = pr(t, t0, t0 + 0.4) * (1 - pr(t, t1 - 0.4, t1));
  c.save(); c.globalAlpha = a; c.font = `700 14px ${FD}`; const w = c.measureText(label).width + 34;
  fillRR(c, 16, 120, w, 30, 15, 'rgba(255,255,255,.92)'); circ(c, 32, 135, 5, COL.red); txt(c, label, 44, 136, 14, COL.navy, { a: 'left', w: 700 });
  c.restore();
}
const WIPES = ['s1', 's1_mom', 's1_spread', 's2', 's4', 's6', 's6_rafa', 's6_lucia', 's6_ze', 's6_neide', 's6_all', 's7', 'final', 'credits'];
function wipes(c, t) {
  for (const m of WIPES) {
    const tm = M[m]; if (t < tm - 0.32 || t > tm + 0.32) continue;
    const k = pr(t, tm - 0.32, tm + 0.32); const x = lerp(-W * 1.4, W * 1.4, eio(k));
    c.save(); c.translate(x, 0);
    c.fillStyle = COL.yellow; c.beginPath(); c.moveTo(-W * 0.5 - 60, 0); c.lineTo(W * 1.2 - 60, 0); c.lineTo(W * 0.9 - 60, H); c.lineTo(-W * 0.8 - 60, H); c.closePath(); c.fill();
    c.fillStyle = COL.navy; c.beginPath(); c.moveTo(-W * 0.5, 0); c.lineTo(W * 1.2, 0); c.lineTo(W * 0.9, H); c.lineTo(-W * 0.8, H); c.closePath(); c.fill();
    c.restore();
  }
}
function freezeFX(c, t, f0, f1) {
  if (t < f0 || t >= f1) return;
  const k = pr(t, f0, f0 + 0.25) * (1 - pr(t, f1 - 0.25, f1));
  c.save();
  c.globalAlpha = 0.85 * k; c.globalCompositeOperation = 'saturation'; c.fillStyle = 'hsl(0,0%,50%)'; c.fillRect(0, 0, W, H);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.32 * k; c.fillStyle = '#1E3163'; c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.08 * k; c.fillStyle = '#fff'; for (let y = (t * 40) % 6; y < H; y += 6) c.fillRect(0, y, W, 2);
  c.globalAlpha = k;
  // cantos de visor
  const m = 22, L = 46; c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) { c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke(); }
  // selo PAUSADO
  const blink = (t * 1.2) % 1 < 0.7;
  fillRR(c, W - 170, 112, 134, 38, 19, 'rgba(230,57,70,.95)');
  if (blink) { c.fillStyle = '#fff'; c.fillRect(W - 152, 123, 6, 16); c.fillRect(W - 141, 123, 6, 16); }
  txt(c, 'PAUSADO', W - 88, 132, 16, '#fff');
  c.restore();
  // flash
  const fl = 1 - pr(t, f0, f0 + 0.35); if (fl > 0) { c.save(); c.globalAlpha = fl * 0.85; c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.restore(); }
}
// cartão branco para explicações do Veri
function card(c, x, y, w, h, k, rot = 0, col = '#fff') {
  c.save(); c.translate(x + w / 2, y + h / 2); c.rotate(rot); const s = lerp(0.6, 1, eob(k)); c.scale(s, s); c.globalAlpha = clamp(k * 1.5);
  shadowed(c, 24, 'rgba(0,0,0,.35)', 10, () => fillRR(c, -w / 2, -h / 2, w, h, 22, col));
  c.translate(-w / 2, -h / 2);
}
function pop(t, at, d = 0.4) { return eob(pr(t, at, at + d)); }
function pill(c, x, y, label, bg, fg = '#fff', size = 18) {
  c.font = `800 ${size}px ${FD}`; const w = c.measureText(label).width + size * 1.4;
  fillRR(c, x - w / 2, y - size * 0.95, w, size * 1.9, size * 0.95, bg); txt(c, label, x, y + 1, size, fg);
}
