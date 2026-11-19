// ===================== cenários =====================
const THEMES = {
  rafa:  { wall: '#F6D7A7', wall2: '#EFC48D', floor: '#B97A4E', floorL: '#A66A40', sofa: '#2A9D8F', sofaL: '#3DB5A6', rug: '#C8553D', curtain: '#D9534F' },
  ze:    { wall: '#E9DCC0', wall2: '#DCCBA6', floor: '#8C6A4F', floorL: '#7A5B42', sofa: '#8D6E63', sofaL: '#A1887F', rug: '#5B8C5A', curtain: '#6B8E4E' },
  neide: { wall: '#E8D5F2', wall2: '#D9C1E8', floor: '#9C7A5B', floorL: '#8A6B4E', sofa: '#F4A261', sofaL: '#F6B57F', rug: '#2A9D8F', curtain: '#8E4FC9' },
};

function sky(c, x, y, w, h, t, kind = 'day') {
  const g = c.createLinearGradient(0, y, 0, y + h);
  if (kind === 'day') { g.addColorStop(0, '#7CC6F2'); g.addColorStop(1, '#D8F0FF'); }
  else { g.addColorStop(0, '#F9A86A'); g.addColorStop(1, '#FDE3B0'); }
  c.fillStyle = g; c.fillRect(x, y, w, h);
  circ(c, x + w * 0.75, y + h * 0.3, 16, kind === 'day' ? '#FFF3B0' : '#FFE08A');
  for (let i = 0; i < 2; i++) {
    const cx = x + ((t * 6 + i * 90) % (w + 80)) - 40, cy = y + 30 + i * 40;
    ell(c, cx, cy, 24, 9, 'rgba(255,255,255,.9)'); ell(c, cx + 14, cy - 6, 14, 9, 'rgba(255,255,255,.9)');
  }
  // prédios
  c.fillStyle = 'rgba(70,90,130,.45)';
  const bs = [[0, 60, 30], [28, 90, 26], [52, 50, 34], [84, 110, 22], [104, 70, 30], [132, 95, 28]];
  for (const [bx, bh, bw] of bs) if (bx < w) c.fillRect(x + bx, y + h - bh * h / 190, Math.min(bw, w - bx), bh * h / 190);
}

function windowFrame(c, x, y, w, h, t, theme, kind) {
  c.save(); rr(c, x, y, w, h, 6); c.clip(); sky(c, x, y, w, h, t, kind); c.restore();
  c.strokeStyle = '#fff'; c.lineWidth = 10; rr(c, x, y, w, h, 6); c.stroke();
  c.lineWidth = 6; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.stroke();
  fillRR(c, x - 12, y + h + 2, w + 24, 10, 4, '#fff');
  // cortinas
  const sw = Math.sin(t * 1.3) * 3;
  for (const sd of [0, 1]) {
    const cx = sd ? x + w + 4 : x - 4;
    c.beginPath(); c.moveTo(cx - 22, y - 16); c.lineTo(cx + 22, y - 16);
    c.quadraticCurveTo(cx + 10 + sw, y + h * 0.5, cx + 18 + sw, y + h + 30); c.lineTo(cx - 18 + sw, y + h + 30);
    c.quadraticCurveTo(cx - 10 + sw, y + h * 0.5, cx - 22, y - 16); c.fillStyle = theme.curtain; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, y - 10); c.lineTo(cx + sw, y + h + 26); c.stroke();
  }
  fillRR(c, x - 34, y - 22, w + 68, 8, 4, '#6D4C41');
}

function frame(c, x, y, w, h, fn) {
  fillRR(c, x - 6, y - 6, w + 12, h + 12, 4, '#8B5A3C'); c.fillStyle = '#FFF8EC'; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); fn(); c.restore();
}

function clock(c, x, y, r, t) {
  circ(c, x, y, r + 4, '#6D4C41'); circ(c, x, y, r, '#fff');
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; circ(c, x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, 1.6, '#333'); }
  const ha = -Math.PI / 2 + TAU * (4 / 12) + t * 0.002, ma = -Math.PI / 2 + t * 0.105;
  line(c, [[x, y], [x + Math.cos(ha) * r * 0.5, y + Math.sin(ha) * r * 0.5]], '#333', 3);
  line(c, [[x, y], [x + Math.cos(ma) * r * 0.75, y + Math.sin(ma) * r * 0.75]], '#333', 2);
  line(c, [[x, y], [x + Math.cos(t * 6.28 / 60 * 6) * r * 0.8, y + Math.sin(t * 6.28 / 60 * 6) * r * 0.8]], '#E63946', 1);
  circ(c, x, y, 2.5, '#333');
}

function lamp(c, x, y, on = true) {
  if (on) { const g = c.createRadialGradient(x, y + 10, 5, x, y + 10, 140); g.addColorStop(0, 'rgba(255,230,150,.55)'); g.addColorStop(1, 'rgba(255,230,150,0)'); c.fillStyle = g; c.fillRect(x - 140, y - 130, 280, 280); }
  line(c, [[x, y + 20], [x, y + 220]], '#5D4037', 5); ell(c, x, y + 222, 26, 6, '#5D4037');
  c.beginPath(); c.moveTo(x - 20, y - 20); c.lineTo(x + 20, y - 20); c.lineTo(x + 32, y + 22); c.lineTo(x - 32, y + 22); c.closePath(); c.fillStyle = on ? '#FFE08A' : '#E0C98A'; c.fill();
}

function plant(c, x, y, t, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(t * 1.5 + i) * 0.04;
    c.save(); c.rotate(a + Math.PI / 2); ell(c, 0, -48, 12, 40, i % 2 ? '#3E8E41' : '#4CAF50'); c.restore();
  }
  c.beginPath(); c.moveTo(-28, -10); c.lineTo(28, -10); c.lineTo(20, 40); c.lineTo(-20, 40); c.closePath(); c.fillStyle = '#C66B3D'; c.fill();
  c.fillStyle = '#A85A30'; c.fillRect(-30, -14, 60, 10);
  c.restore();
}

function mug(c, x, y, t, col = '#fff') {
  fillRR(c, x - 10, y - 18, 20, 20, 4, col);
  c.beginPath(); c.arc(x + 11, y - 9, 6, -Math.PI / 2, Math.PI / 2); c.strokeStyle = col; c.lineWidth = 3; c.stroke();
  for (let i = 0; i < 2; i++) {
    const k = (t * 0.6 + i * 0.5) % 1; c.globalAlpha = (1 - k) * 0.6;
    c.beginPath(); c.moveTo(x - 3 + i * 6, y - 22 - k * 30); c.quadraticCurveTo(x + 4 + i * 6, y - 30 - k * 30, x - 3 + i * 6, y - 40 - k * 30);
    c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.stroke(); c.globalAlpha = 1;
  }
}

function sofa(c, x, y, w, th) {
  // x,y = canto superior esquerdo do encosto; assento em y+105
  shadowed(c, 20, 'rgba(0,0,0,.18)', 10, () => fillRR(c, x, y, w, 150, 30, th.sofa));
  fillRR(c, x + 20, y + 12, w - 40, 80, 22, th.sofaL);
  fillRR(c, x + 40, y + 98, (w - 80) / 2 - 3, 50, 14, th.sofaL); fillRR(c, x + w / 2 + 3, y + 98, (w - 80) / 2 - 3, 50, 14, th.sofaL);
  fillRR(c, x - 20, y + 50, 62, 120, 24, th.sofa); fillRR(c, x + w - 42, y + 50, 62, 120, 24, th.sofa);
  fillRR(c, x + 10, y + 165, 14, 18, 3, '#4E342E'); fillRR(c, x + w - 24, y + 165, 14, 18, 3, '#4E342E');
}

function livingRoom(c, t, th = THEMES.rafa, o = {}) {
  const g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, th.wall); g.addColorStop(1, th.wall2);
  c.fillStyle = g; c.fillRect(-300, 0, 1140, 650);
  c.fillStyle = 'rgba(255,255,255,.08)'; for (let x = -300; x < 840; x += 36) c.fillRect(x, 0, 14, 640);
  // piso
  c.fillStyle = th.floor; c.fillRect(-300, 640, 1140, 340);
  c.fillStyle = th.floorL; for (let yy = 660; yy < 980; yy += 34) c.fillRect(-300, yy, 1140, 3);
  for (let yy = 660, r = 0; yy < 980; yy += 34, r++) for (let xx = -300 + (r % 2) * 60; xx < 840; xx += 120) c.fillRect(xx, yy, 3, 34);
  c.fillStyle = '#7B4A2E'; c.fillRect(-300, 632, 1140, 14);
  windowFrame(c, 50, 170, 150, 190, t, th, o.sky || 'warm');
  frame(c, 300, 200, 100, 74, () => {
    c.fillStyle = '#BDE0FE'; c.fillRect(300, 200, 100, 74); c.fillStyle = '#90BE6D'; c.fillRect(300, 250, 100, 24);
    [['ze', 318], ['lucia', 340], ['rafa', 362], ['neide', 384]].forEach(([w, xx], i) => { circ(c, xx, 238 - (i === 2 ? 4 : 0), 9, CH[w].skin); c.fillStyle = CH[w].shirt; c.fillRect(xx - 8, 247, 16, 20); });
  });
  frame(c, 425, 230, 52, 64, () => { c.fillStyle = '#FFD6A5'; c.fillRect(425, 230, 52, 64); c.beginPath(); c.moveTo(425, 294); c.lineTo(450, 255); c.lineTo(477, 294); c.fillStyle = '#6A994E'; c.fill(); circ(c, 465, 245, 7, '#F77F00'); });
  clock(c, 245, 110, 26, t);
  lamp(c, 482, 400, o.lampOn !== false);
  plant(c, 30, 600, t, 0.95);
  ell(c, 270, 770, 240, 52, th.rug); ell(c, 270, 770, 200, 40, 'rgba(255,255,255,.15)'); ell(c, 270, 770, 160, 30, th.rug);
  sofa(c, 95, 470, 350, th);
  // mesinha lateral
  fillRR(c, 455, 600, 60, 10, 3, '#6D4C41'); c.fillStyle = '#6D4C41'; c.fillRect(462, 610, 6, 60); c.fillRect(502, 610, 6, 60);
  mug(c, 480, 600, t);
}

function kitchen(c, t, o = {}) {
  c.fillStyle = '#CFE8E0'; c.fillRect(-300, 0, 1140, 700);
  // azulejos
  c.fillStyle = '#E8F5F1'; c.fillRect(-300, 380, 1140, 190);
  c.strokeStyle = 'rgba(80,140,120,.25)'; c.lineWidth = 2;
  for (let x = -300; x < 840; x += 30) { c.beginPath(); c.moveTo(x, 380); c.lineTo(x, 570); c.stroke(); }
  for (let y = 380; y < 570; y += 30) { c.beginPath(); c.moveTo(-300, y); c.lineTo(840, y); c.stroke(); }
  // armários altos
  for (let i = 0; i < 4; i++) { fillRR(c, 150 + i * 98, 90, 92, 200, 6, '#F1FAEE'); fillRR(c, 150 + i * 98 + (i % 2 ? 10 : 70), 180, 8, 30, 4, '#A8DADC'); }
  windowFrame(c, -10, 130, 130, 160, t, THEMES.rafa, 'day');
  // geladeira
  fillRR(c, 455, 150, 120, 560, 14, '#DDE6ED'); c.fillStyle = '#B8C4CF'; c.fillRect(455, 360, 120, 5); fillRR(c, 470, 250, 8, 70, 4, '#9AA8B6'); fillRR(c, 470, 400, 8, 70, 4, '#9AA8B6');
  fillRR(c, 490, 190, 40, 30, 4, '#FFC93C'); fillRR(c, 500, 230, 30, 22, 4, '#E63946');
  // panelas
  for (let i = 0; i < 3; i++) { const sw = Math.sin(t * 1.2 + i) * 0.04; c.save(); c.translate(170 + i * 50, 320); c.rotate(sw); line(c, [[0, 0], [0, 20]], '#555', 3); circ(c, 0, 38, 18 - i * 2, ['#E76F51', '#2A9D8F', '#E9C46A'][i]); c.restore(); }
  // piso
  for (let y = 700; y < 980; y += 50) for (let x = -300; x < 840; x += 50) { c.fillStyle = ((x + y) / 50) % 2 ? '#F4EBD9' : '#D9C9A8'; c.fillRect(x, y, 50, 50); }
}
function kitchenCounter(c, t, o = {}) {
  fillRR(c, -40, 560, 500, 26, 6, '#6D4C41');
  c.fillStyle = '#E9C46A'; c.fillRect(-30, 586, 480, 130);
  for (let i = 0; i < 4; i++) { c.strokeStyle = 'rgba(0,0,0,.12)'; c.lineWidth = 3; rr(c, -20 + i * 118, 600, 108, 104, 6); c.stroke(); fillRR(c, 25 + i * 118, 615, 20, 6, 3, '#8D6E63'); }
  // tábua e legumes
  if (!o.bags) {
    fillRR(c, 40, 545, 110, 18, 5, '#D4A373'); circ(c, 70, 540, 12, '#E63946'); circ(c, 100, 542, 10, '#F4A261'); ell(c, 128, 545, 14, 7, '#6A994E');
  } else {
    groceries(c, 300, 560, t, 78);
    return;
  }
  circ(c, 380, 540, 26, '#E9C46A'); circ(c, 368, 530, 10, '#F4A261'); circ(c, 390, 528, 10, '#E63946');
}

function waterPack(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  for (let i = 0; i < 3; i++) { fillRR(c, -27 + i * 18, -44, 16, 44, 5, '#7FC8F8'); fillRR(c, -23 + i * 18, -52, 8, 9, 2, '#1E6091'); c.fillStyle = '#fff'; c.fillRect(-27 + i * 18, -30, 16, 10); }
  c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-29, -40, 54, 4);
  c.restore();
}
function candleBox(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  fillRR(c, -26, -30, 52, 30, 3, '#F4E1C1'); c.fillStyle = '#E63946'; c.fillRect(-26, -22, 52, 9);
  txt(c, 'VELAS', 0, -17, 9, '#fff', { w: 800 });
  c.restore();
}
function candle(c, x, y, lit, t, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  fillRR(c, -5, -30, 10, 30, 2, '#FFF8E1'); line(c, [[0, -30], [0, -35]], '#333', 1.5);
  if (lit) { const f = 1 + Math.sin(t * 20) * 0.1; ell(c, 0, -42, 4 * f, 8 * f, '#FFB703'); ell(c, 0, -40, 2, 4, '#FFF3B0'); }
  c.restore();
}
function groceries(c, x, y, t, gap = 95) {
  // sacolas
  for (let i = 0; i < 3; i++) {
    const bx = x + i * gap;
    c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + 70, y); c.lineTo(bx + 64, y - 70); c.lineTo(bx + 6, y - 70); c.closePath(); c.fillStyle = '#F1FAEE'; c.fill();
    c.beginPath(); c.arc(bx + 35, y - 70, 18, Math.PI, 0); c.strokeStyle = '#ccc'; c.lineWidth = 3; c.stroke();
    if (i === 0) { candle(c, bx + 20, y - 62, false, t); candle(c, bx + 34, y - 66, false, t); candle(c, bx + 48, y - 60, false, t); }
    if (i === 1) { waterPack(c, bx + 35, y - 58, 0.8); }
    if (i === 2) { fillRR(c, bx + 14, y - 92, 24, 30, 3, '#FFD166'); fillRR(c, bx + 36, y - 88, 22, 26, 3, '#E63946'); }
  }
}

// ---------- mercado ----------
const SHELF_TYPES = ['candle', 'water', 'food', 'cans'];
const SHELF_LABEL = { candle: 'VELAS', water: 'ÁGUA', food: 'ALIMENTOS', cans: 'ENLATADOS' };
function product(c, type, x, y, i) {
  switch (type) {
    case 'candle': fillRR(c, x - 4, y - 26, 8, 26, 2, i % 3 ? '#FFF8E1' : '#FFE8A3'); line(c, [[x, y - 26], [x, y - 30]], '#333', 1.2); break;
    case 'water': fillRR(c, x - 7, y - 34, 14, 34, 4, '#7FC8F8'); fillRR(c, x - 3, y - 39, 6, 6, 2, '#1E6091'); c.fillStyle = '#fff'; c.fillRect(x - 7, y - 22, 14, 7); break;
    case 'food': fillRR(c, x - 9, y - 28, 18, 28, 3, ['#FFD166', '#F4A261', '#EAE2B7'][i % 3]); c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(x - 9, y - 18, 18, 5); break;
    case 'cans': fillRR(c, x - 7, y - 20, 14, 20, 3, ['#E63946', '#2A9D8F', '#F77F00'][i % 3]); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x - 7, y - 14, 14, 4); break;
  }
}
// tempo de "sumir" do produto
function goneAt(type, idx) {
  const h = hash(idx * 3.7 + type.length);
  const base = M.s2 + 2.5;
  if (type === 'candle') return base + 2 + h * (M.freeze1 - base - 3);
  if (type === 'water') return base + 4 + h * (M.freeze1 - base - 4);
  return h < 0.55 ? base + 6 + h * 18 : 1e9;
}
function market(c, te, o = {}) {
  // teto e parede
  c.fillStyle = '#EEF2F5'; c.fillRect(-400, 0, 1400, 210);
  for (let x = -380; x < 1000; x += 160) { fillRR(c, x, 40, 110, 14, 7, '#fff'); const g = c.createLinearGradient(0, 54, 0, 200); g.addColorStop(0, 'rgba(255,255,230,.6)'); g.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, 54); c.lineTo(x + 110, 54); c.lineTo(x + 150, 200); c.lineTo(x - 40, 200); c.fill(); }
  c.fillStyle = '#F8F3E6'; c.fillRect(-400, 150, 1400, 520);
  fillRR(c, -60, 160, 660, 56, 10, '#E63946');
  txt(c, 'SUPERMERCADO DO BAIRRO', 270, 189, 30, '#fff', { w: 800 });
  // gôndolas
  const units = [[-330, 'cans'], [-120, 'candle'], [90, 'water'], [300, 'food'], [510, 'cans'], [720, 'water']];
  let idx = 0;
  for (const [ux, type] of units) {
    fillRR(c, ux, 250, 200, 420, 6, '#C9D6DF');
    fillRR(c, ux + 6, 256, 188, 408, 4, '#E3EBF0');
    // placa pendurada
    line(c, [[ux + 70, 214], [ux + 70, 232]], '#888', 2); line(c, [[ux + 130, 214], [ux + 130, 232]], '#888', 2);
    fillRR(c, ux + 50, 230, 100, 28, 6, '#FFC93C'); txt(c, SHELF_LABEL[type], ux + 100, 245, 15, '#14213D', { w: 800 });
    for (let r = 0; r < 4; r++) {
      const sy = 340 + r * 92;
      for (let k = 0; k < 9; k++) {
        const id = idx++; const px = ux + 20 + k * 20;
        if (te < goneAt(type, id)) product(c, type, px, sy - 2, id);
      }
      fillRR(c, ux + 4, sy, 192, 10, 3, '#9FB3C2');
      c.fillStyle = '#FFE066'; c.fillRect(ux + 20, sy + 2, 26, 6);
    }
    if (type === 'candle' && te > M.s2_chaos - 1) {
      const k = eob(pr(te, M.s2_chaos - 1, M.s2_chaos - 0.4));
      c.save(); c.translate(ux + 100, 420); c.rotate(-0.12); c.scale(k, k); fillRR(c, -70, -22, 140, 44, 8, '#E63946'); txt(c, 'ESGOTADO', 0, 1, 24, '#fff'); c.restore();
    }
    if (type === 'water' && ux === 90 && te > M.freeze1 - 2.2) {
      const k = eob(pr(te, M.freeze1 - 2.2, M.freeze1 - 1.6));
      c.save(); c.translate(ux + 100, 520); c.rotate(0.1); c.scale(k, k); fillRR(c, -60, -20, 120, 40, 8, '#E63946'); txt(c, 'ACABOU!', 0, 1, 22, '#fff'); c.restore();
    }
  }
  // piso
  c.fillStyle = '#DCE3E8'; c.fillRect(-400, 668, 1400, 320);
  c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 2;
  for (let y = 690; y < 980; y += 40) { c.beginPath(); c.moveTo(-400, y); c.lineTo(1000, y); c.stroke(); }
  for (let x = -600; x < 1200; x += 70) { c.beginPath(); c.moveTo(270 + (x - 270) * 0.6, 668); c.lineTo(x, 980); c.stroke(); }
}

function cart(c, x, y, s, fill, t, flip) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s);
  // itens empilhados
  const n = Math.floor(fill * 12);
  for (let i = 0; i < n; i++) {
    const ix = -46 + (i % 4) * 26, iy = -76 - Math.floor(i / 4) * 16;
    if (i % 3 === 0) waterPack(c, ix + 8, iy + 20, 0.45);
    else if (i % 3 === 1) candleBox(c, ix + 8, iy + 14, 0.5);
    else { fillRR(c, ix, iy - 10, 18, 24, 3, ['#FFD166', '#E63946', '#F4A261'][i % 3]); }
  }
  c.strokeStyle = '#7D8B99'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(-60, -80); c.lineTo(60, -80); c.lineTo(50, -30); c.lineTo(-50, -30); c.closePath(); c.fillStyle = 'rgba(160,180,200,.25)'; c.fill(); c.stroke();
  for (let i = -40; i <= 40; i += 16) { c.beginPath(); c.moveTo(i, -80); c.lineTo(i * 0.85, -30); c.stroke(); }
  c.beginPath(); c.moveTo(-60, -80); c.lineTo(-78, -98); c.stroke(); fillRR(c, -90, -104, 22, 9, 4, '#E63946');
  c.beginPath(); c.moveTo(-45, -30); c.lineTo(-40, -10); c.moveTo(45, -30); c.lineTo(40, -10); c.stroke();
  const wr = t * 8;
  for (const wx of [-38, 38]) { circ(c, wx, -6, 7, '#333'); line(c, [[wx, -6], [wx + Math.cos(wr) * 5, -6 + Math.sin(wr) * 5]], '#999', 2); }
  c.restore();
}

function carlosRoom(c, t, o = {}) {
  c.fillStyle = '#C9D8B6'; c.fillRect(-300, 0, 1140, 650);
  c.fillStyle = '#B3C69C'; c.fillRect(-300, 430, 1140, 220);
  c.fillStyle = '#8A9F73'; c.fillRect(-300, 425, 1140, 8);
  // estante
  fillRR(c, 10, 180, 170, 440, 6, '#6D4C41');
  for (let r = 0; r < 4; r++) {
    c.fillStyle = '#5D4037'; c.fillRect(18, 280 + r * 100, 154, 8);
    for (let b = 0; b < 8; b++) { const bh = 60 + hash(r * 9 + b) * 28; c.fillStyle = ['#E63946', '#457B9D', '#F4A261', '#2A9D8F', '#E9C46A', '#8E4FC9'][(r + b) % 6]; c.fillRect(22 + b * 18, 280 + r * 100 - bh, 15, bh); }
  }
  windowFrame(c, 340, 160, 150, 180, t, { curtain: '#457B9D' }, 'day');
  // quadro
  frame(c, 230, 190, 70, 90, () => { c.fillStyle = '#A8DADC'; c.fillRect(230, 190, 70, 90); circ(c, 265, 225, 16, CH.carlos.skin); c.fillStyle = CH.carlos.shirt; c.fillRect(250, 245, 30, 35); });
  // piso
  c.fillStyle = '#A1887F'; c.fillRect(-300, 640, 1140, 340); c.fillStyle = '#8D6E63'; for (let y = 660; y < 980; y += 30) c.fillRect(-300, y, 1140, 3);
  ell(c, 270, 780, 230, 55, '#457B9D'); ell(c, 270, 780, 190, 42, '#A8DADC'); ell(c, 270, 780, 150, 30, '#457B9D');
  // poltrona
  shadowed(c, 18, 'rgba(0,0,0,.2)', 8, () => fillRR(c, 170, 430, 200, 210, 40, '#9C4A2E'));
  fillRR(c, 190, 450, 160, 120, 30, '#B85C38');
  fillRR(c, 145, 540, 60, 130, 24, '#9C4A2E'); fillRR(c, 335, 540, 60, 130, 24, '#9C4A2E');
  fillRR(c, 200, 575, 140, 55, 16, '#B85C38');
  // mesinha + rádio + café
  fillRR(c, 405, 590, 90, 12, 4, '#5D4037'); c.fillStyle = '#5D4037'; c.fillRect(415, 602, 7, 70); c.fillRect(478, 602, 7, 70);
  fillRR(c, 415, 552, 50, 38, 6, '#E76F51'); circ(c, 430, 571, 9, '#333'); c.fillStyle = '#fff'; c.fillRect(444, 562, 14, 4); c.fillRect(444, 570, 14, 4);
  mug(c, 478, 590, t, '#F1FAEE');
  // gato dormindo
  catSleep(c, 110, 790, t);
}
function catSleep(c, x, y, t) {
  ell(c, x, y, 42, 20, '#F4A261'); circ(c, x + 34, y - 6, 15, '#F4A261');
  c.beginPath(); c.moveTo(x + 26, y - 16); c.lineTo(x + 28, y - 30); c.lineTo(x + 36, y - 19); c.moveTo(x + 38, y - 18); c.lineTo(x + 46, y - 28); c.lineTo(x + 47, y - 13); c.fillStyle = '#F4A261'; c.fill();
  line(c, [[x + 29, y - 5], [x + 34, y - 3]], '#6b3b1a', 2); line(c, [[x + 38, y - 4], [x + 43, y - 5]], '#6b3b1a', 2);
  const tw = Math.sin(t * 2) * 10;
  c.beginPath(); c.moveTo(x - 40, y + 2); c.quadraticCurveTo(x - 66, y - 4 + tw, x - 60, y - 24 + tw); c.strokeStyle = '#F4A261'; c.lineWidth = 9; c.lineCap = 'round'; c.stroke();
  for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i / 3) % 1; c.globalAlpha = Math.sin(k * Math.PI); txt(c, 'z', x + 50 + k * 26, y - 30 - k * 50, 14 + k * 10, '#14213D'); c.globalAlpha = 1; }
}

function zeRoom(c, t) {
  livingRoom(c, t, THEMES.ze, { sky: 'day' });
}
function neideRoom(c, t) {
  livingRoom(c, t, THEMES.neide, { sky: 'day' });
  plant(c, 510, 610, t, 0.8);
}

// ---------- fundos gráficos ----------
function gradBG(c, a, b) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600); }
function dots(c, t, col = 'rgba(255,255,255,.06)') { c.fillStyle = col; for (let y = 0; y < H; y += 32) for (let x = (y / 32 % 2) * 16; x < W; x += 32) { c.beginPath(); c.arc(x, y + (t * 10) % 32, 2, 0, TAU); c.fill(); } }
