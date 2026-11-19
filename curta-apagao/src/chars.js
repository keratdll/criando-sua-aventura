// ===================== personagens =====================
const CH = {
  rafa:   { skin: '#C68642', skinD: '#A86E35', hair: '#2A1A10', shirt: '#FF7A2F', shirtD: '#D9601A', pants: '#3A5BA0', shoe: '#F4F4F4', shoe2: '#D64545', hs: 'curly', h: 0.93, seed: 0.3 },
  lucia:  { skin: '#9C5F3A', skinD: '#7F4A2B', hair: '#3A2214', shirt: '#E2445C', shirtD: '#B92F45', pants: '#2F3B59', shoe: '#3A2A2A', hs: 'long', skirt: true, ear: '#F2C14E', lips: '#9E2A3E', h: 0.99, seed: 1.7 },
  ze:     { skin: '#F0C6A0', skinD: '#D9A57C', hair: '#F2F2F2', shirt: '#6B8E4E', shirtD: '#52733A', pants: '#B59B7A', shoe: '#5A3B24', hs: 'bald', glasses: 'round', stache: true, inner: '#F5F0E1', h: 0.95, seed: 2.4 },
  neide:  { skin: '#6B3E26', skinD: '#55301C', hair: '#1A1110', shirt: '#8E4FC9', shirtD: '#6E35A6', pants: '#2E2E48', shoe: '#C0392B', hs: 'afro', band: '#F7C948', ear: '#F2C14E', lips: '#B5332A', h: 1, seed: 3.1 },
  carlos: { skin: '#E2AE84', skinD: '#C79268', hair: '#8C8C8C', shirt: '#2E86C1', shirtD: '#1F6A9C', pants: '#6B5B3E', shoe: '#4A3020', hs: 'short', beard: '#9A9A9A', glasses: 'rect', h: 1.02, seed: 0.9 },
};
// figurantes do mercado
const NPC_PAL = [
  { skin: '#D7A27A', hair: '#4A2E1C', shirt: '#F4A261', pants: '#264653', hs: 'short' },
  { skin: '#8D5524', hair: '#111', shirt: '#43AA8B', pants: '#3D405B', hs: 'afro', band: '#E76F51' },
  { skin: '#F1C27D', hair: '#B5651D', shirt: '#577590', pants: '#6D597A', hs: 'long', skirt: true },
  { skin: '#C68642', hair: '#2B2B2B', shirt: '#E9C46A', pants: '#2A2A2A', hs: 'curly' },
  { skin: '#E0AC69', hair: '#5A3825', shirt: '#9B5DE5', pants: '#3A3A55', hs: 'long' },
  { skin: '#A0522D', hair: '#1D1D1D', shirt: '#EF476F', pants: '#073B4C', hs: 'short' },
];
NPC_PAL.forEach((p, i) => { CH['npc' + i] = Object.assign({ skinD: p.skin, shirtD: p.shirt, shoe: '#333', h: 1, seed: i * 0.77 }, p); });

const MOODS = {
  neutral:   { bi: 0, bo: 0, by: -19, mouth: 'smile0' },
  happy:     { bi: -1, bo: 1, by: -20, mouth: 'smile', arch: true, cheek: true },
  worried:   { bi: -6, bo: 2, by: -19, mouth: 'frown', sweat: true },
  scared:    { bi: -8, bo: 0, by: -24, mouth: 'o', wide: true, small: true, sweat: true },
  surprised: { bi: -3, bo: -3, by: -25, mouth: 'o', wide: true, arch: true },
  thinking:  { bi: -4, bo: -7, by: -21, bi2: 3, bo2: 0, mouth: 'side', lookUp: true },
  suspicious:{ bi: 4, bo: -3, by: -17, mouth: 'flat', lids: true },
  sheepish:  { bi: -5, bo: 2, by: -19, mouth: 'grimace', sweat: true, cheek: true },
  relieved:  { bi: -4, bo: 1, by: -19, mouth: 'smile', closed: true, cheek: true },
  determined:{ bi: 3, bo: -2, by: -18, mouth: 'smile0' },
};

function eyesBlink(t, seed) { return ((t + seed * 3.3) % 4.2) < 0.13; }

function drawHead(c, P, o) {
  const t = o.t || 0, talk = o.talk || 0, md = MOODS[o.mood || 'neutral'];
  const look = o.look || 0, lookY = (o.lookY || 0) + (md.lookUp ? -0.8 : 0);
  // cabelo de trás
  c.fillStyle = P.hair;
  if (P.hs === 'long') { rr(c, -47, -28, 94, 92, 38); c.fill(); }
  if (P.hs === 'afro') { circ(c, 0, -30, 56, P.hair); circ(c, -40, -8, 30, P.hair); circ(c, 40, -8, 30, P.hair); }
  if (P.hs === 'bald') { ell(c, 0, 6, 40, 34, P.hair); }
  // orelhas
  circ(c, -39, 4, 8, P.skin); circ(c, 39, 4, 8, P.skin);
  // rosto
  ell(c, 0, 0, 40, 43, P.skin);
  // barba
  if (P.beard) {
    c.beginPath(); c.moveTo(-39, 2); c.quadraticCurveTo(-36, 46, 0, 50); c.quadraticCurveTo(36, 46, 39, 2);
    c.quadraticCurveTo(26, 22, 0, 22); c.quadraticCurveTo(-26, 22, -39, 2); c.fillStyle = P.beard; c.fill();
  }
  // cabelo da frente
  c.fillStyle = P.hair;
  if (P.hs === 'curly') {
    for (let i = 0; i < 11; i++) { const a = Math.PI * (1.08 + i * 0.084); circ(c, Math.cos(a) * 36, -8 + Math.sin(a) * 36, 12.5, P.hair); }
    ell(c, 0, -30, 34, 16, P.hair);
  } else if (P.hs === 'long') {
    c.beginPath(); c.moveTo(-43, 6); c.arc(0, 0, 44, Math.PI * 1.0, Math.PI * 2.0);
    c.quadraticCurveTo(30, -26, 4, -24); c.quadraticCurveTo(-24, -20, -38, 2); c.closePath(); c.fill();
  } else if (P.hs === 'short') {
    c.beginPath(); c.arc(0, -2, 42, Math.PI * 1.04, Math.PI * 1.96); c.quadraticCurveTo(20, -30, 0, -28); c.quadraticCurveTo(-24, -30, -41, -10); c.closePath(); c.fill();
  } else if (P.hs === 'bald') {
    ell(c, -37, -10, 9, 15, P.hair); ell(c, 37, -10, 9, 15, P.hair);
    ell(c, -12, -30, 10, 5, 'rgba(255,255,255,.35)');
  } else if (P.hs === 'afro') {
    c.beginPath(); c.arc(0, -2, 43, Math.PI * 1.06, Math.PI * 1.94); c.quadraticCurveTo(0, -30, -41, -14); c.fill();
    c.beginPath(); c.arc(0, -6, 45, Math.PI * 1.12, Math.PI * 1.88); c.strokeStyle = P.band; c.lineWidth = 8; c.lineCap = 'round'; c.stroke();
  }
  // olhos
  const blink = o.closed || md.closed || eyesBlink(t, P.seed);
  const ery = md.wide ? 12.5 : 10.5;
  for (const s of [-1, 1]) {
    const ex = s * 15, ey = -2;
    if (blink) {
      c.beginPath(); md.closed ? c.arc(ex, ey + 2, 7, Math.PI * 1.1, Math.PI * 1.9) : (c.moveTo(ex - 8, ey + 1), c.quadraticCurveTo(ex, ey + 5, ex + 8, ey + 1));
      c.strokeStyle = '#2b1a14'; c.lineWidth = 3; c.lineCap = 'round'; c.stroke();
    } else {
      ell(c, ex, ey, 8.5, ery, '#fff');
      const pr_ = md.small ? 3.6 : 5;
      circ(c, ex + look * 3.5, ey + lookY * 3 + 1, pr_, '#2a1d17');
      circ(c, ex + look * 3.5 + 1.6, ey + lookY * 3 - 1.2, 1.5, '#fff');
      if (md.lids) { c.fillStyle = P.skin; c.fillRect(ex - 10, ey - 14, 20, 11); }
    }
  }
  // sobrancelhas
  const bc = P.hs === 'bald' ? '#e8e8e8' : (P.beard ? '#6d6d6d' : P.hair);
  for (const s of [-1, 1]) {
    const bi = (s === 1 && md.bi2 !== undefined) ? md.bi2 : md.bi, bo = (s === 1 && md.bo2 !== undefined) ? md.bo2 : md.bo;
    c.beginPath(); c.moveTo(s * 7, md.by + bi);
    if (md.arch) c.quadraticCurveTo(s * 15, md.by - 5, s * 23, md.by + bo); else c.lineTo(s * 23, md.by + bo);
    c.strokeStyle = bc; c.lineWidth = P.hs === 'bald' ? 5.5 : 4.5; c.lineCap = 'round'; c.stroke();
  }
  // nariz
  c.beginPath(); c.arc(0, 7, 4.5, Math.PI * 0.15, Math.PI * 0.85); c.strokeStyle = P.skinD; c.lineWidth = 2.5; c.stroke();
  // bochechas
  if (md.cheek) { circ(c, -25, 12, 6.5, 'rgba(255,90,110,.28)'); circ(c, 25, 12, 6.5, 'rgba(255,90,110,.28)'); }
  // boca
  const my = 21;
  if (talk > 0.04) {
    const op = 2 + talk * 10.5;
    ell(c, 0, my + op * 0.25, 9.5 - talk * 1.5, op, '#5B1F1F');
    if (op > 5) ell(c, 0, my + op * 0.8, 5, op * 0.35, '#E46A7A');
    if (op > 6) { c.fillStyle = '#fff'; c.fillRect(-6, my + op * 0.25 - op + 1, 12, 3); }
  } else {
    c.strokeStyle = P.lips || '#6b2a22'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
    switch (md.mouth) {
      case 'smile': c.moveTo(-11, my - 2); c.quadraticCurveTo(0, my + 11, 11, my - 2); c.fillStyle = '#5B1F1F'; c.fill(); c.stroke(); break;
      case 'frown': c.moveTo(-8, my + 4); c.quadraticCurveTo(0, my - 4, 8, my + 4); c.stroke(); break;
      case 'o': ell(c, 0, my + 2, 5, 7, '#5B1F1F'); break;
      case 'side': c.moveTo(-4, my + 2); c.quadraticCurveTo(5, my + 4, 10, my - 2); c.stroke(); break;
      case 'flat': c.moveTo(-8, my + 1); c.lineTo(8, my + 1); c.stroke(); break;
      case 'grimace': rr(c, -10, my - 3, 20, 9, 3); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-10, my + 1.5); c.lineTo(10, my + 1.5); c.lineWidth = 1.5; c.stroke(); break;
      default: c.moveTo(-7, my); c.quadraticCurveTo(0, my + 5, 7, my); c.stroke();
    }
  }
  if (P.stache) { ell(c, -8, 15, 10, 5, P.hair, 0.2); ell(c, 8, 15, 10, 5, P.hair, -0.2); }
  // óculos
  if (P.glasses) {
    c.strokeStyle = '#2d2d2d'; c.lineWidth = 2.6;
    if (P.glasses === 'round') { c.beginPath(); c.arc(-15, -2, 12, 0, TAU); c.moveTo(27, -2); c.arc(15, -2, 12, 0, TAU); c.stroke(); }
    else { rr(c, -28, -11, 26, 18, 5); c.stroke(); rr(c, 2, -11, 26, 18, 5); c.stroke(); }
    c.beginPath(); c.moveTo(-3, -3); c.lineTo(3, -3); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(-24, -9, 6, 6); c.fillRect(6, -9, 6, 6);
  }
  if (P.ear) { c.strokeStyle = P.ear; c.lineWidth = 3; c.beginPath(); P.hs === 'afro' ? c.arc(-40, 18, 7, 0, TAU) : c.arc(-40, 14, 3, 0, TAU); c.stroke(); c.beginPath(); P.hs === 'afro' ? c.arc(40, 18, 7, 0, TAU) : c.arc(40, 14, 3, 0, TAU); c.stroke(); }
  if (md.sweat && !o.noSweat) {
    const k = (t * 0.8 + P.seed) % 1.4; if (k < 1) { const yy = -26 + k * 22; c.globalAlpha = 1 - k; c.beginPath(); c.moveTo(36, yy - 9); c.quadraticCurveTo(43, yy + 2, 36, yy + 4); c.quadraticCurveTo(29, yy + 2, 36, yy - 9); c.fillStyle = '#7FD3F7'; c.fill(); c.globalAlpha = 1; }
  }
}

// IK de dois ossos
function arm(c, S, Ht, side, col, skin, l1 = 46, l2 = 44, w = 17) {
  let dx = Ht[0] - S[0], dy = Ht[1] - S[1], d = Math.hypot(dx, dy);
  const mx = l1 + l2 - 0.5; if (d > mx) { dx *= mx / d; dy *= mx / d; d = mx; }
  d = Math.max(d, 8);
  const base = Math.atan2(dy, dx), A = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const e1 = [S[0] + l1 * Math.cos(base + A), S[1] + l1 * Math.sin(base + A)];
  const e2 = [S[0] + l1 * Math.cos(base - A), S[1] + l1 * Math.sin(base - A)];
  const sc = e => side * e[0] + 0.7 * e[1];
  const E = sc(e1) > sc(e2) ? e1 : e2;
  const Hh = [S[0] + dx, S[1] + dy];
  line(c, [S, E, Hh], col, w); circ(c, Hh[0], Hh[1], 9.5, skin);
  return Hh;
}

function phoneProp(c, x, y, rot = 0, lit = true, sc = 1) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
  fillRR(c, -14, -24, 28, 48, 6, '#1d1f2b');
  fillRR(c, -11, -20, 22, 40, 3, lit ? '#9EE7FF' : '#33415c');
  if (lit) { c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-8, -14, 16, 3); c.fillRect(-8, -8, 12, 3); c.fillRect(-8, -2, 14, 3); }
  c.restore();
}

// pose -> alvos das mãos
function handTargets(pose, shY, headY, t, g) {
  const sw = Math.sin(t * 1.7) * 2;
  let L = [-44, shY + 92 + sw], R = [44, shY + 92 - sw], prop = null;
  switch (pose) {
    case 'phone': L = [-13, shY + 60]; R = [13, shY + 56 + Math.sin(t * 3) * 1.5]; prop = 'phone'; break;
    case 'phoneUp': L = [-12, shY + 34]; R = [12, shY + 32]; prop = 'phoneUp'; break;
    case 'type': L = [-13, shY + 60]; R = [10 + Math.sin(t * 22) * 3, shY + 54 + Math.abs(Math.sin(t * 17)) * 3]; prop = 'phone'; break;
    case 'up': L = [-58, shY - 55 + Math.sin(t * 12) * 3]; R = [58, shY - 55 + Math.cos(t * 12) * 3]; break;
    case 'cheeks': L = [-30, headY + 16]; R = [30, headY + 16]; break;
    case 'cart': L = [26, shY + 92]; R = [48, shY + 88]; break;
    case 'reach': L = [-30, shY - 50]; R = [22, shY - 62 + Math.sin(t * 6) * 6]; break;
    case 'wave': R = [66, shY - 62 + Math.sin(t * 9) * 8]; break;
    case 'chin': R = [10, headY + 40]; L = [-4, shY + 52]; break;
    case 'hips': L = [-52, shY + 82]; R = [52, shY + 82]; break;
    case 'shrug': L = [-62, shY + 30]; R = [62, shY + 30]; break;
    case 'scratch': R = [30, headY - 30 + Math.sin(t * 14) * 4]; break;
    case 'chest': R = [-8, shY + 30]; break;
    case 'pray': L = [-6, shY + 34]; R = [6, shY + 34]; break;
    case 'thumb': R = [56, shY + 10]; break;
    case 'box': L = [-30, shY + 50]; R = [30, shY + 50]; break;
  }
  if (g > 0 && (pose === 'down' || pose === 'phone' && false)) {
    R = [lerp(R[0], 40 + Math.sin(t * 3.3) * 8, g), lerp(R[1], shY + 42 + Math.sin(t * 4.1) * 10, g)];
  }
  return { L, R, prop };
}

// personagem completo; o = {x,y,s,t,talk,mood,look,pose,sit,walk,flip,tilt}
function person(c, who, o) {
  const P = CH[who], t = o.t || 0, talk = o.talk || 0, walk = o.walk || 0;
  c.save(); c.translate(o.x, o.y); const s = (o.s || 1) * P.h; c.scale(o.flip ? -s : s, s);
  const ph = t * 7.5 + P.seed;
  const bob = walk ? -Math.abs(Math.sin(ph)) * 5 : 0;
  const br = Math.sin(t * 2.3 + P.seed * 5) * 1.3;
  const hipY = (o.sit ? -96 : -130) + bob;
  const shY = hipY - 100 - br * 0.5;
  const nod = talk * Math.sin(t * 8.5) * 2 + (o.nod || 0);
  const headY = shY - 49 + nod * 0.6;
  // sombra
  if (!o.noShadow) ell(c, 0, 1, 50, 9, 'rgba(0,0,0,.16)');
  // pernas
  const legCol = P.skirt ? P.skin : P.pants;
  if (o.sit) {
    for (const sd of [-1, 1]) { line(c, [[sd * 17, hipY + 8], [sd * 21, hipY + 30], [sd * 22, -10]], legCol, 23); ell(c, sd * 25, -7, 17, 9, P.shoe); }
    fillRR(c, -38, hipY - 8, 76, 36, 15, P.skirt ? P.pants : P.pants);
  } else {
    for (const sd of [-1, 1]) {
      const sw = walk ? Math.sin(ph + (sd > 0 ? Math.PI : 0)) : 0;
      const fx = sd * 17 + sw * 15, lift = walk ? Math.max(0, -Math.cos(ph + (sd > 0 ? Math.PI : 0))) * 8 : 0;
      line(c, [[sd * 16, hipY + 6], [sd * 17 + sw * 7, (hipY - lift) / 2], [fx, -8 - lift]], legCol, 23);
      ell(c, fx + sd * 4, -7 - lift, 17, 9, P.shoe);
      if (P.shoe2) { c.fillStyle = P.shoe2; c.fillRect(fx + sd * 4 - 12, -6 - lift, 24, 3); }
    }
    if (P.skirt) { c.beginPath(); c.moveTo(-34, hipY - 6); c.lineTo(34, hipY - 6); c.lineTo(44, hipY + 56); c.quadraticCurveTo(0, hipY + 64, -44, hipY + 56); c.closePath(); c.fillStyle = P.pants; c.fill(); }
  }
  // pescoço
  c.fillStyle = P.skinD; c.fillRect(-9, headY + 30, 18, shY - headY - 26);
  // tronco
  c.beginPath(); c.moveTo(-30, shY - 4); c.quadraticCurveTo(0, shY - 10, 30, shY - 4); c.quadraticCurveTo(43, shY, 41, shY + 20);
  c.lineTo(35, hipY + 4); c.quadraticCurveTo(0, hipY + 12, -35, hipY + 4); c.lineTo(-41, shY + 20); c.quadraticCurveTo(-43, shY, -30, shY - 4);
  c.fillStyle = P.shirt; c.fill();
  // detalhes da roupa
  if (who === 'rafa') {
    fillRR(c, -24, hipY - 38, 48, 22, 8, P.shirtD);
    c.beginPath(); c.arc(0, shY - 2, 20, 0.15, Math.PI - 0.15); c.strokeStyle = P.shirtD; c.lineWidth = 6; c.stroke();
    line(c, [[-6, shY + 10], [-7, shY + 34]], '#fff', 2.5); line(c, [[6, shY + 10], [7, shY + 34]], '#fff', 2.5);
  } else if (who === 'lucia') {
    c.beginPath(); c.moveTo(-12, shY - 6); c.lineTo(0, shY + 16); c.lineTo(12, shY - 6); c.fillStyle = P.skinD; c.fill();
    for (let i = -2; i <= 2; i++) circ(c, i * 5, shY + 3 + Math.abs(i) * -2.5 + 6, 2.2, '#F2C14E');
    c.fillStyle = P.shirtD; c.fillRect(-36, hipY - 12, 72, 7);
  } else if (who === 'ze') {
    c.beginPath(); c.moveTo(-12, shY - 6); c.lineTo(0, shY + 40); c.lineTo(12, shY - 6); c.fillStyle = P.inner; c.fill();
    line(c, [[-12, shY - 6], [-2, shY + 60], [-4, hipY + 6]], P.shirtD, 3); line(c, [[12, shY - 6], [2, shY + 60], [4, hipY + 6]], P.shirtD, 3);
    for (let i = 0; i < 3; i++) circ(c, -6, shY + 56 + i * 14, 2.8, '#E9D8A6');
    fillRR(c, 16, hipY - 34, 18, 16, 3, P.shirtD);
  } else if (who === 'neide') {
    for (let i = 0; i < 9; i++) circ(c, -28 + (i % 3) * 26 + (Math.floor(i / 3) % 2) * 10, shY + 22 + Math.floor(i / 3) * 24, 3, 'rgba(255,255,255,.35)');
    c.beginPath(); c.arc(0, shY - 4, 16, 0.1, Math.PI - 0.1); c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
  } else if (who === 'carlos') {
    c.save(); c.clip(); c.globalAlpha = 0.18; c.fillStyle = '#0b3a5c';
    for (let x = -40; x < 40; x += 13) c.fillRect(x, shY - 10, 4, 120);
    for (let y = shY; y < hipY + 10; y += 13) c.fillRect(-45, y, 90, 4);
    c.restore();
    c.beginPath(); c.moveTo(-14, shY - 6); c.lineTo(-2, shY + 10); c.lineTo(-4, shY - 6); c.moveTo(14, shY - 6); c.lineTo(2, shY + 10); c.lineTo(4, shY - 6); c.fillStyle = '#E8F1F8'; c.fill();
    for (let i = 0; i < 4; i++) circ(c, 0, shY + 18 + i * 20, 2.4, '#E8F1F8');
  } else if (P.shirtD) {
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(-35, hipY - 14, 70, 8);
  }
  // braços
  const g = speaking(who, t) * (o.gest === false ? 0 : 1);
  const ht = handTargets(o.pose || 'down', shY, headY, t, g);
  const SL = [-34, shY + 10], SR = [34, shY + 10];
  if (ht.prop === 'phone') phoneProp(c, 0, shY + 50, -0.05, o.lit !== false);
  if (ht.prop === 'phoneUp') phoneProp(c, 0, shY + 24, 0, o.lit !== false);
  arm(c, SL, ht.L, -1, P.shirt, P.skin);
  arm(c, SR, ht.R, 1, P.shirt, P.skin);
  if (o.pose === 'thumb') { c.fillStyle = P.skin; rr(c, ht.R[0] - 3, ht.R[1] - 20, 7, 16, 3); c.fill(); }
  // cabeça
  c.save(); c.translate(0, headY); c.rotate((o.tilt || 0) + talk * Math.sin(t * 3.1) * 0.04);
  if (o.glow) { const gr = c.createRadialGradient(0, 30, 5, 0, 30, 70); gr.addColorStop(0, 'rgba(158,231,255,.35)'); gr.addColorStop(1, 'rgba(158,231,255,0)'); c.fillStyle = gr; c.fillRect(-70, -40, 140, 140); }
  drawHead(c, P, o);
  c.restore();
  c.restore();
}

// só a cabeça (avatares)
function avatar(c, who, x, y, r, o = {}) {
  c.save(); c.translate(x, y);
  circ(c, 0, 0, r, o.bg || COL[who] || '#888');
  c.save(); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.clip();
  const s = r / 46; c.scale(s, s); c.translate(0, 10);
  if (who === 'veri') { c.translate(0, 40); veriBody(c, { t: o.t || 0, mood: o.mood || 'happy', s: 0.62, noArms: true }); }
  else { const P = CH[who]; c.fillStyle = P.shirt; ell(c, 0, 70, 46, 30, P.shirt); drawHead(c, P, Object.assign({ t: o.t || 0 }, o)); }
  c.restore();
  if (o.ring !== false) { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.strokeStyle = o.ring || '#fff'; c.lineWidth = Math.max(2, r * 0.09); c.stroke(); }
  c.restore();
}

// ===================== VERI (narrador) =====================
function veriBody(c, o) {
  const t = o.t || 0, talk = o.talk || 0, s = o.s || 1;
  const md = o.mood || 'happy';
  c.save(); c.scale(s, s);
  const bounce = o.still ? 0 : Math.sin(t * 3.2) * 4;
  c.translate(0, bounce);
  // pés
  if (!o.noArms) { ell(c, -32, -8 - bounce, 24, 12, '#FFC93C'); ell(c, 32, -8 - bounce, 24, 12, '#FFC93C'); c.fillStyle = '#fff'; c.fillRect(-52, -6 - bounce, 40, 3); c.fillRect(12, -6 - bounce, 40, 3); }
  // antena
  const aw = Math.sin(t * 2.4) * 8;
  c.beginPath(); c.moveTo(0, -182); c.quadraticCurveTo(aw * 0.5, -205, 6 + aw, -222); c.strokeStyle = '#178A80'; c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
  const glow = c.createRadialGradient(6 + aw, -232, 2, 6 + aw, -232, 30); glow.addColorStop(0, 'rgba(255,214,60,.7)'); glow.addColorStop(1, 'rgba(255,214,60,0)');
  c.fillStyle = glow; c.fillRect(aw - 30, -268, 72, 72);
  circ(c, 6 + aw, -232, 14, '#FFD23F');
  line(c, [[aw - 0.5, -232], [aw + 4.5, -226], [aw + 13, -238]], '#178A80', 3.5);
  // corpo
  const gb = c.createLinearGradient(0, -190, 0, -10); gb.addColorStop(0, '#34D1C3'); gb.addColorStop(1, '#1A9C91');
  c.beginPath(); c.ellipse(0, -98, 80, 88, 0, 0, TAU); c.fillStyle = gb; c.fill();
  ell(c, 0, -52, 50, 36, '#BFF3EC');
  // selo ✓ na barriga
  circ(c, 0, -50, 17, '#fff'); line(c, [[-8, -50], [-2, -43], [9, -57]], '#22B5A8', 5);
  // gravata borboleta
  c.fillStyle = '#E63946'; c.beginPath(); c.moveTo(0, -88); c.lineTo(-16, -97); c.lineTo(-16, -79); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(0, -88); c.lineTo(16, -97); c.lineTo(16, -79); c.closePath(); c.fill(); circ(c, 0, -88, 4.5, '#B5232F');
  // olhos
  const blink = eyesBlink(t, 5.2) && !o.noBlink;
  const look = o.look || 0, lookY = o.lookY || 0;
  for (const sd of [-1, 1]) {
    const ex = sd * 27, ey = -128;
    if (o.lupaEye && sd === 1) continue;
    if (blink) { line(c, [[ex - 14, ey + 2], [ex, ey + 7], [ex + 14, ey + 2]], '#0E4F49', 4); continue; }
    ell(c, ex, ey, 18.5, 23, '#fff');
    circ(c, ex + look * 6, ey + 3 + lookY * 5, md === 'surprised' ? 8 : 10.5, '#14213D');
    circ(c, ex + look * 6 + 4, ey - 2 + lookY * 5, 3.5, '#fff');
  }
  // sobrancelhas
  const bm = { happy: [-2, 2], excited: [-6, -4], wink: [-2, 2], serious: [5, -3], surprised: [-9, -6], proud: [-3, 1] }[md] || [0, 0];
  for (const sd of [-1, 1]) line(c, [[sd * 12, -156 + bm[0]], [sd * 40, -158 + bm[1]]], '#0E4F49', 6);
  // bochechas
  circ(c, -52, -98, 9, 'rgba(255,110,140,.35)'); circ(c, 52, -98, 9, 'rgba(255,110,140,.35)');
  // boca
  if (talk > 0.04) {
    const op = 3 + talk * 15;
    c.beginPath(); c.moveTo(-17, -100); c.quadraticCurveTo(0, -100 + op * 2.1, 17, -100); c.quadraticCurveTo(0, -97, -17, -100); c.fillStyle = '#5B1F1F'; c.fill();
    if (op > 8) ell(c, 0, -100 + op * 1.15, 7, op * 0.32, '#F07A8A');
  } else {
    c.beginPath(); c.moveTo(-15, -101); c.quadraticCurveTo(0, md === 'serious' ? -96 : -86, 15, -101);
    if (md === 'serious') { c.strokeStyle = '#5B1F1F'; c.lineWidth = 4; c.stroke(); } else { c.quadraticCurveTo(0, -97, -15, -101); c.fillStyle = '#5B1F1F'; c.fill(); }
  }
  c.restore();
}

// Veri com braços e acessórios. o.arms: 'wave'|'present'|'point'|'lupa'|'down'|'hips'|'up'|'stop'
function veri(c, o) {
  const t = o.t || 0, s = o.s || 1;
  c.save(); c.translate(o.x, o.y);
  if (o.rot) c.rotate(o.rot);
  c.scale(o.flip ? -1 : 1, 1);
  const bounce = Math.sin(t * 3.2) * 4 * s;
  // braços atrás/na frente
  const SL = [-74 * s, -100 * s + bounce], SR = [74 * s, -100 * s + bounce];
  let L = [-100 * s, -40 * s], R = [100 * s, -40 * s];
  const g = o.gest || 0;
  switch (o.arms) {
    case 'wave': R = [125 * s, -190 * s + Math.sin(t * 10) * 14 * s]; break;
    case 'present': L = [-130 * s, -110 * s + Math.sin(t * 2) * 4]; R = [130 * s, -110 * s + Math.cos(t * 2) * 4]; break;
    case 'point': R = [140 * s, -170 * s + Math.sin(t * 3) * 5]; break;
    case 'pointUp': R = [110 * s, -230 * s + Math.sin(t * 3) * 5]; break;
    case 'lupa': R = [120 * s, -120 * s + Math.sin(t * 2.5) * 6 * s]; break;
    case 'lupaEye': R = [38 * s, -110 * s]; break;
    case 'hips': L = [-88 * s, -70 * s]; R = [88 * s, -70 * s]; break;
    case 'up': L = [-120 * s, -210 * s + Math.sin(t * 9) * 8]; R = [120 * s, -210 * s + Math.cos(t * 9) * 8]; break;
    case 'stop': R = [120 * s, -150 * s]; L = [-100 * s, -40 * s]; break;
    case 'thumb': R = [125 * s, -130 * s]; break;
  }
  if (g && o.arms !== 'lupa' && o.arms !== 'lupaEye') { L = [lerp(L[0], -120 * s, g), lerp(L[1], (-120 + Math.sin(t * 3.7) * 22) * s, g)]; }
  const armDraw = (S, Hh) => {
    c.beginPath(); c.moveTo(S[0], S[1]); c.quadraticCurveTo((S[0] + Hh[0]) / 2, (S[1] + Hh[1]) / 2 + 22 * s, Hh[0], Hh[1]);
    c.strokeStyle = '#1A9C91'; c.lineWidth = 15 * s; c.lineCap = 'round'; c.stroke();
    circ(c, Hh[0], Hh[1], 15 * s, '#fff'); c.beginPath(); c.arc(Hh[0], Hh[1], 15 * s, 0, TAU); c.strokeStyle = '#d6dde5'; c.lineWidth = 2; c.stroke();
  };
  armDraw(SL, L);
  veriBody(c, Object.assign({}, o, { s, lupaEye: o.arms === 'lupaEye' }));
  armDraw(SR, R);
  if (o.arms === 'thumb') { fillRR(c, R[0] - 5 * s, R[1] - 30 * s, 10 * s, 22 * s, 5 * s, '#fff'); }
  if (o.arms === 'stop') { fillRR(c, R[0] - 13 * s, R[1] - 34 * s, 26 * s, 30 * s, 9 * s, '#fff'); }
  if (o.arms === 'lupa' || o.arms === 'lupaEye') lupa(c, o.arms === 'lupaEye' ? 27 * s : R[0] + 30 * s, o.arms === 'lupaEye' ? -128 * s + bounce : R[1] - 48 * s, s, t, o.arms === 'lupaEye');
  c.restore();
}

function lupa(c, x, y, s, t, eye) {
  c.save(); c.translate(x, y); c.scale(s, s);
  // cabo
  if (eye) line(c, [[24, 26], [62, 74]], '#8B4513', 14); else line(c, [[-22, 24], [-50, 56]], '#8B4513', 14);
  c.beginPath(); c.arc(0, 0, 36, 0, TAU); c.fillStyle = 'rgba(190,235,255,.55)'; c.fill();
  if (eye) {
    c.save(); c.beginPath(); c.arc(0, 0, 33, 0, TAU); c.clip();
    ell(c, 0, 0, 28, 34, '#fff'); circ(c, Math.sin(t * 2) * 4, 4, 15, '#14213D'); circ(c, 6, -4, 5, '#fff');
    c.restore();
  }
  c.beginPath(); c.arc(0, 0, 36, 0, TAU); c.strokeStyle = '#3D3D3D'; c.lineWidth = 9; c.stroke();
  c.beginPath(); c.arc(0, 0, 26, Math.PI * 1.15, Math.PI * 1.45); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 5; c.stroke();
  c.restore();
}
