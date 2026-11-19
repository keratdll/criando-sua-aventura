# Monta a linha do tempo e mixa a trilha final (vozes + música + efeitos) em um único arquivo.
import json, subprocess, re, unicodedata
import numpy as np
from roteiro import EVENTS, NAMES

SR = 24000
rng = np.random.default_rng(7)

def load_mp3(path):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32).copy()

def T(d): return np.arange(int(d * SR)) / SR

def box(x, n):
    n = max(1, int(n))
    c = np.cumsum(np.concatenate([[0.0], x]))
    y = (c[n:] - c[:-n]) / n
    return np.concatenate([y, np.zeros(len(x) - len(y))])

def lp(x, hz): return box(x, SR / hz / 2)
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def noise(d): return rng.uniform(-1, 1, int(d * SR))
def env_ad(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def sweep(f0, f1, d, kind=np.sin):
    t = T(d); f = f0 * (f1 / f0) ** (t / d)
    return kind(2 * np.pi * np.cumsum(f) / SR)

# ------------------------------------------------------------------ efeitos
def sfx_notify():
    out = []
    for f in (988, 1319):
        t = T(0.12); out.append((np.sin(2*np.pi*f*t) + 0.3*np.sin(4*np.pi*f*t)) * env_ad(len(t), 0.004, 0.05))
    return np.concatenate(out) * 0.5
def sfx_buzz():
    t = T(0.75); s = np.sign(np.sin(2*np.pi*160*t)) * 0.5 + np.sin(2*np.pi*80*t)
    gate = (np.sin(2*np.pi*4*t) > -0.2).astype(float)
    return lp(s * gate, 900) * 0.35 * np.exp(-t*1.2)
def sfx_whoosh(d=0.55):
    t = T(d); n = noise(d); a = lp(n, 1800) - lp(n, 300) * 0.5
    return a * np.sin(np.pi * t / d) ** 2 * 0.9
def sfx_pop():
    s = sweep(380, 950, 0.09); return s * env_ad(len(s), 0.002, 0.03) * 0.45
def sfx_send():
    s = sweep(300, 1400, 0.3) * 0.25 + sfx_whoosh(0.3) * 0.6
    return s * np.linspace(1, 0.2, len(s))
def sfx_freeze():
    d = 1.0; t = T(d)
    crash = bp(noise(d), 1500, 7000) * np.exp(-t * 5) * 1.2
    down = sweep(900, 60, 0.7); down = np.concatenate([down, np.zeros(len(t) - len(down))]) * np.exp(-t * 2.5) * 0.35
    shutter = np.zeros(len(t)); k = bp(noise(0.03), 800, 5000); shutter[:len(k)] = k * 1.5
    return crash + down + shutter
def sfx_unfreeze():
    d = 0.6; t = T(d)
    up = sweep(160, 1000, d) * 0.3 * np.sin(np.pi * t / d)
    return up + bp(noise(d), 1000, 5000) * (t / d) ** 2 * 0.4
def sfx_boing():
    d = 0.5; t = T(d); f = 260 + 140 * np.sin(2*np.pi*14*t) * np.exp(-t*6) + 200 * t
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t*5) * 0.45
def sfx_zip():
    s = sweep(500, 2600, 0.22); return s * np.linspace(0.4, 0, len(s)) * 0.5 + sfx_whoosh(0.22) * 0.5
def bell(f, d=1.3, a=0.4):
    t = T(d); return (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2.01*f*t) + 0.15*np.sin(2*np.pi*3.02*f*t)) * env_ad(len(t), 0.003, 0.35) * a
def sfx_ding(): return bell(1319)
def sfx_sparkle():
    out = np.zeros(int(1.2*SR))
    for i, f in enumerate([1568, 2093, 1760, 2637, 2349, 3136]):
        b = bell(f, 0.6, 0.12); s = int(i * 0.09 * SR); out[s:s+len(b)] += b[:len(out)-s]
    return out
def click():
    k = bp(noise(0.02), 1500, 6000); return k * env_ad(len(k), 0.0005, 0.004)
def sfx_click(): return click() * 1.2
def sfx_typing():
    out = np.zeros(int(2.4*SR)); t = 0.0
    while t < 2.2:
        c = click() * rng.uniform(0.5, 0.9); s = int(t*SR); out[s:s+len(c)] += c; t += rng.uniform(0.07, 0.17)
    return out
def sfx_cart():
    d = 1.6; t = T(d); n = bp(noise(d), 300, 2500)
    rattle = (np.sin(2*np.pi*11*t) > 0.3).astype(float) * 0.6 + 0.4
    return n * rattle * np.sin(np.pi*t/d) * 0.35
def sfx_womp():
    out = []
    for f, d in [(392, 0.32), (370, 0.32), (349, 0.32), (330, 0.9)]:
        t = T(d); vib = 1 + 0.012*np.sin(2*np.pi*6*t)*(t > 0.3)
        ph = 2*np.pi*np.cumsum(f*vib)/SR
        s = sum(np.sin(k*ph)/k for k in range(1, 7)); out.append(lp(s, 1600) * np.minimum(1, t/0.03) * np.minimum(1, (d-t)/0.06))
    return np.concatenate(out) * 0.28
def sfx_tada():
    out = np.zeros(int(2.4*SR))
    for i, f in enumerate([523, 659, 784, 1047]):
        b = bell(f, 1.8, 0.22); s = int(i*0.07*SR); out[s:s+len(b)] += b[:len(out)-s]
    return out

SFX = {k[4:]: v for k, v in globals().items() if k.startswith("sfx_")}

def crowd_bed(d):
    t = T(d); n = bp(noise(d), 180, 1200)
    am = lp(rng.uniform(0, 1, len(t)), 3) * 4
    return n * (0.5 + am) * 0.25

# ------------------------------------------------------------------ música
NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
def chord(name):
    root = NOTE[name.rstrip("m")]; minor = name.endswith("m")
    return [root, root + (3 if minor else 4), root + 7]
def hz(semi, octv): return 440 * 2 ** ((semi + 12 * (octv - 4) - 9) / 12)

def pluck(f, d, bright=3):
    t = T(d); s = sum(np.sin(2*np.pi*f*k*t) * (0.6 ** (k-1)) for k in range(1, bright+1))
    return s * env_ad(len(t), 0.003, d * 0.35)
def pad(fs, d):
    t = T(d); s = sum(np.sin(2*np.pi*f*t) + 0.4*np.sin(2*np.pi*f*1.003*t) + 0.15*np.sin(4*np.pi*f*t) for f in fs)
    return s * np.minimum(1, t/0.4) * np.minimum(1, (d - t)/0.4) / len(fs)

MOODS = {
    "calm":        dict(ch=["C", "Am", "F", "G"],  bpm=88,  arp=True,  bass="whole", hat=False, padv=0.5),
    "tension":     dict(ch=["Am", "F", "Dm", "E"], bpm=112, arp=False, bass="eighth", hat=True, padv=0.35),
    "veri":        dict(ch=["F", "G", "Em", "Am"], bpm=104, arp="pizz", bass="oompah", hat=False, padv=0.25),
    "investigate": dict(ch=["Dm", "A#", "F", "C"], bpm=84,  arp="sparse", bass="whole", hat="tick", padv=0.45),
    "resolve":     dict(ch=["C", "G", "Am", "F"],  bpm=92,  arp=True,  bass="half", hat=False, padv=0.5),
    "close":       dict(ch=["F", "C", "G", "Am"],  bpm=96,  arp=True,  bass="half", hat="soft", padv=0.45),
}

def make_music(mood, d):
    m = MOODS[mood]; beat = 60 / m["bpm"]; bar = beat * 4
    out = np.zeros(int((d + 3) * SR))
    def add(sig, t):
        s = int(t * SR)
        if s < len(out): out[s:s+len(sig)] += sig[:len(out)-s]
    b = 0
    while b * bar < d:
        c = chord(m["ch"][b % 4]); t0 = b * bar
        add(pad([hz(n, 3) for n in c], bar + 0.3) * m["padv"] * 0.5, t0)
        if m["bass"] == "whole": add(pluck(hz(c[0], 2), bar, 2) * 0.55, t0)
        elif m["bass"] == "half":
            for i in range(2): add(pluck(hz(c[0], 2), beat*2, 2) * 0.5, t0 + i*beat*2)
        elif m["bass"] == "eighth":
            for i in range(8): add(pluck(hz(c[0], 2), beat*0.5, 2) * (0.45 if i % 2 == 0 else 0.3), t0 + i*beat*0.5)
        elif m["bass"] == "oompah":
            for i in range(4): add(pluck(hz(c[0] if i % 2 == 0 else c[2], 2), beat*0.5, 2) * 0.45, t0 + i*beat)
        if m["arp"] is True:
            seq = [c[0], c[1], c[2], c[1] + 12, c[2], c[1], c[0] + 12, c[2]]
            for i, n in enumerate(seq): add(pluck(hz(n, 4), beat*0.9) * 0.22, t0 + i*beat*0.5)
        elif m["arp"] == "pizz":
            for i in range(4): add(pluck(hz(c[(i + 1) % 3] + 12, 4), 0.25, 4) * 0.28, t0 + i*beat + beat*0.5)
        elif m["arp"] == "sparse":
            for i, n in [(0, c[2]), (2, c[1]), (3, c[0] + 12)]: add(pluck(hz(n, 4), beat*1.5) * 0.2, t0 + i*beat)
        if m["hat"]:
            for i in range(8 if m["hat"] is True else 4):
                step = beat * (0.5 if m["hat"] is True else 1)
                h = bp(noise(0.05), 4000, 10000) * env_ad(int(0.05*SR), 0.001, 0.012)
                add(h * (0.25 if m["hat"] != "soft" else 0.12), t0 + i*step + (0 if m["hat"] is True else beat*0.5))
        b += 1
    return out[:int(d * SR)]

# ------------------------------------------------------------------ linha do tempo
def norm(w): return re.sub(r"[^\w]", "", unicodedata.normalize("NFC", w).lower())

t = 0.0; lines = []; marks = {}; sfx = []; music = []; crowd = []
for e in EVENTS:
    k = e[0]
    if k == "wait": t += e[1]
    elif k == "mark": marks[e[1]] = round(t, 3)
    elif k == "sfx": sfx.append((t + (e[2] if len(e) > 2 else 0), e[1]))
    elif k == "music": music.append((t, e[1]))
    elif k == "say":
        lid, who, text = e[1], e[2], e[3]
        meta = json.load(open(f"voz/{lid}.json"))
        toks = text.split(); bw = meta["words"]
        words = []
        if len(bw) == len(toks):
            words = [[tok, round(t + w[1], 3), round(t + w[2], 3)] for tok, w in zip(toks, bw)]
        else:  # alinhamento guloso por texto normalizado
            j = 0
            for tok in toks:
                while j < len(bw) and norm(bw[j][0]) not in norm(tok) and norm(tok) not in norm(bw[j][0]): j += 1
                if j < len(bw): words.append([tok, round(t + bw[j][1], 3), round(t + bw[j][2], 3)]); j += 1
                else: words.append([tok, words[-1][2] if words else t, words[-1][2] if words else t])
            print("aviso alinhamento", lid, len(toks), len(bw))
        end = t + bw[-1][2] + 0.15
        lines.append(dict(id=lid, who=who, name=NAMES[who], text=text, s=round(t, 3), e=round(end, 3), words=words))
        t += meta["dur"]
DUR = t
N = int((DUR + 1) * SR)

voice = np.zeros(N); talk = np.zeros(N)
for L in lines:
    a = load_mp3(f"voz/{L['id']}.mp3"); a = a / (np.abs(a).max() + 1e-9) * 0.88
    s = int(L["s"] * SR); voice[s:s+len(a)] += a[:N-s]
    talk[s:int(L["e"]*SR)] = 1
    # envelope para sincronia labial (30 por segundo)
    fr = SR // 30; n = len(a) // fr
    rms = np.sqrt((a[:n*fr].reshape(n, fr) ** 2).mean(1)); rms = rms / (rms.max() + 1e-9)
    L["env"] = "".join(str(min(9, int(v ** 0.6 * 10))) for v in rms)

# música com crossfade
mus = np.zeros(N)
for i, (tm, mood) in enumerate(music):
    t_end = music[i+1][0] if i + 1 < len(music) else DUR + 1
    if mood == "stop": continue
    d = t_end - tm + 1.0
    m = make_music(mood, d); m = m / (np.sqrt((m**2).mean()) + 1e-9) * 0.05
    t_ = np.arange(len(m)) / SR
    nxt_stop = i + 1 < len(music) and music[i+1][1] == "stop"
    seg = t_end - tm
    g = np.minimum(1, t_ / 0.8) * (np.clip((seg - t_) / 0.25, 0, 1) if nxt_stop else np.clip((seg + 1.0 - t_) / 1.0, 0, 1))
    s = int(tm * SR); mus[s:s+len(m)] += (m * g)[:N-s]
duck = lp(talk, 2) * 0.45; mus *= (1 - duck)

fx = np.zeros(N)
crowd_on = None
for tm, name in sfx:
    if name == "crowd_on": crowd_on = tm; continue
    if name == "crowd_off":
        d = tm - crowd_on; c = crowd_bed(d); tt = np.arange(len(c))/SR
        c *= np.minimum(1, tt/0.6) * np.clip((d - tt)/0.6, 0, 1)
        s = int(crowd_on*SR); fx[s:s+len(c)] += c[:N-s]; continue
    sig = SFX[name](); s = int(tm * SR); fx[s:s+len(sig)] += sig[:N-s] * 0.55

mix = voice + mus + fx
mix = mix / max(1.0, np.abs(mix).max() / 0.97)
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
pcm = (mix * 32767).astype(np.int16).tobytes()
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                "-c:a", "libmp3lame", "-b:a", "80k", "../trilha.mp3"], input=pcm, check=True)

tl = dict(dur=round(DUR, 3), lines=lines, marks=marks)
open("../timeline.js", "w").write("window.TL=" + json.dumps(tl, ensure_ascii=False, separators=(",", ":")) + ";\n")
print("duração", round(DUR, 2), "s =", int(DUR // 60), "min", round(DUR % 60, 1), "s;", len(lines), "falas")
