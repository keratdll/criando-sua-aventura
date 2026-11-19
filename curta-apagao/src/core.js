// ===================== núcleo =====================
const W = 540, H = 960;
const TLD = window.TL, M = TLD.marks, LINES = TLD.lines;
const LBY = {}; LINES.forEach(l => (LBY[l.id] = l));
const FD = '"Baloo 2", "Nunito", system-ui, sans-serif';
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const eio = k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const eo = k => 1 - Math.pow(1 - k, 3);
const eob = k => { const c1 = 2.0, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const TAU = Math.PI * 2;
// janela "entra e sai": 0 antes de a, sobe até 1, desce depois de b
const win = (t, a, b, fi = 0.3, fo = 0.3) => pr(t, a, a + fi) * (1 - pr(t, b - fo, b));

const COL = {
  navy: '#14213D', navy2: '#1E3163', yellow: '#FFC93C', red: '#E63946', teal: '#22B5A8',
  white: '#FFFFFF', ink: '#1B1B2F', cream: '#FFF6E5',
  veri: '#22B5A8', rafa: '#FF7A2F', lucia: '#E2445C', ze: '#6B8E4E', neide: '#8E4FC9', carlos: '#2E86C1',
};

function lineAt(who, t) {
  for (const l of LINES) if (l.who === who && t >= l.s && t < l.e) return l;
  return null;
}
function talkOf(who, t) {
  const l = lineAt(who, t); if (!l) return 0;
  const c = l.env.charCodeAt(Math.floor((t - l.s) * 30));
  return c ? (c - 48) / 9 : 0;
}
// 0..1 suave enquanto o personagem está com a palavra (para gestos)
function speaking(who, t) {
  for (const l of LINES) if (l.who === who && t >= l.s - 0.3 && t < l.e + 0.4) return pr(t, l.s - 0.3, l.s + 0.2) * (1 - pr(t, l.e, l.e + 0.4));
  return 0;
}
// instante em que uma palavra (fragmento) é dita numa fala
function wt(id, frag, nth = 0) {
  const l = LBY[id]; const f = frag.toLowerCase(); let n = 0;
  for (const w of l.words) if (w[0].toLowerCase().includes(f)) { if (n++ === nth) return w[1]; }
  return l.s;
}

// ---------- primitivas ----------
function rr(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function fillRR(c, x, y, w, h, r, col) { rr(c, x, y, w, h, r); c.fillStyle = col; c.fill(); }
function ell(c, x, y, rx, ry, col, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); if (col) { c.fillStyle = col; c.fill(); } }
function circ(c, x, y, r, col) { c.beginPath(); c.arc(x, y, Math.abs(r), 0, TAU); c.fillStyle = col; c.fill(); }
function line(c, pts, col, w, cap = 'round') {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.strokeStyle = col; c.lineWidth = w; c.lineCap = cap; c.lineJoin = 'round'; c.stroke();
}
function txt(c, s, x, y, size, col, o = {}) {
  c.font = `${o.w || 800} ${size}px ${o.f || FD}`; c.textAlign = o.a || 'center'; c.textBaseline = o.b || 'middle';
  if (o.stroke) { c.lineWidth = o.sw || 6; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y);
}
const wrapCache = new Map();
function wrap(c, s, maxW, size, weight = 700) {
  const key = s + '|' + maxW + '|' + size + '|' + weight;
  if (wrapCache.has(key)) return wrapCache.get(key);
  c.font = `${weight} ${size}px ${FD}`;
  const out = []; let cur = '';
  for (const w of s.split(' ')) {
    const tryS = cur ? cur + ' ' + w : w;
    if (c.measureText(tryS).width > maxW && cur) { out.push(cur); cur = w; } else cur = tryS;
  }
  if (cur) out.push(cur);
  wrapCache.set(key, out); return out;
}
function shadowed(c, blur, col, oy, fn) { c.save(); c.shadowBlur = blur; c.shadowColor = col; c.shadowOffsetY = oy; fn(); c.restore(); }
// câmera: interpola keyframes [tempo, x, y, zoom]
function camKF(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b[0]) { const k = eio(pr(t, a[0], b[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), lerp(a[3], b[3], k)]; }
  }
  return keys[keys.length - 1].slice(1);
}
function applyCam(c, cam, shake = 0, t = 0) {
  const [x, y, z] = cam;
  const sx = shake ? Math.sin(t * 53) * shake : 0, sy = shake ? Math.cos(t * 47) * shake : 0;
  c.translate(W / 2 + sx, H / 2 + sy); c.scale(z, z); c.translate(-x, -y);
}
