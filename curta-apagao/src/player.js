// ===================== player =====================
(function () {
  const $ = id => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d'), aud = $('aud'), stage = $('stage');
  const DUR = TLD.dur;
  let mode = 'audio';           // 'audio' | 'clock' (sem áudio) | 'tts' (voz do navegador)
  let playing = false, started = false, clockBase = 0, clockStart = 0, lastT = 0, scale = 1;
  const fmt = s => { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ---- tamanho do canvas
  function resize() {
    const r = cv.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); scale = cv.width / W;
    draw(curT());
  }
  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    try { render(ctx, t); } catch (e) { console.error(e); }
  }
  // ---- relógio
  function curT() {
    if (mode === 'audio') return aud.currentTime || 0;
    return playing ? clockBase + (performance.now() - clockStart) / 1000 : clockBase;
  }
  function setT(t) {
    t = clamp(t, 0, DUR);
    if (mode === 'audio') { try { aud.currentTime = t; } catch (e) {} }
    else { clockBase = t; clockStart = performance.now(); ttsReset(t); }
    draw(t); ui(t);
  }

  // ---- capítulos e marcas
  const CHAPS = [['open', 'Início', 'Abertura'], ...SCENES.map(([m, n, title]) => [m, 'Cena ' + n, title]), ['final', 'Fim', 'Pare. Pense. Verifique.']];
  const chapEls = CHAPS.map(([m, n, title]) => {
    const b = document.createElement('button'); b.className = 'chap'; b.type = 'button'; b.innerHTML = `<b>${n.toUpperCase()}</b>${title}`;
    b.onclick = () => { const tt = M[m] + (m === 'open' ? 0 : 0.01); if (!started) begin(tt); else setT(tt); };
    $('chapters').appendChild(b); return b;
  });
  SCENES.forEach(([m]) => { const i = document.createElement('i'); i.style.left = (M[m] / DUR * 100) + '%'; $('ticks').appendChild(i); });
  $('seek').max = DUR; $('tDur').textContent = fmt(Math.round(DUR));
  $('durFact').textContent = Math.floor(DUR / 60) + ' min ' + Math.round(DUR % 60) + ' s';
  function chapIdx(t) { let k = 0; CHAPS.forEach(([m], i) => { if (t >= M[m] - 0.001) k = i; }); return k; }
  let lastChap = -1;
  function ui(t) {
    $('tCur').textContent = fmt(t);
    const s = $('seek'); if (!seeking) s.value = t; s.style.setProperty('--p', (t / DUR * 100) + '%');
    const k = chapIdx(t);
    if (k !== lastChap) { lastChap = k; chapEls.forEach((e, i) => e.classList.toggle('cur', i === k)); $('sceneName').textContent = CHAPS[k][1] + ' · ' + CHAPS[k][2]; }
  }
  function setPP(p) {
    $('ppIcon').innerHTML = p ? '<rect x="6" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor"/><rect x="13.8" y="4.5" width="4.2" height="15" rx="1.2" fill="currentColor"/>' : '<path d="M7 4.5v15l13-7.5z" fill="currentColor"/>';
    $('pp').setAttribute('aria-label', p ? 'Pausar' : 'Reproduzir');
  }

  // ---- laço
  function loop() {
    if (window.__export) return;
    const t = curT();
    if (mode !== 'audio' && playing && t >= DUR) { pause(); clockBase = DUR; finish(); }
    if (mode === 'tts' && playing) ttsTick(t);
    draw(Math.min(t, DUR)); ui(Math.min(t, DUR)); lastT = t;
    requestAnimationFrame(loop);
  }

  // ---- áudio
  let audioReady = false;
  const st = $('aStatus');
  function audStatus(msg, cls) { st.textContent = msg; st.className = 'status ' + (cls || ''); }
  aud.addEventListener('loadedmetadata', () => { audioReady = true; audStatus('Áudio pronto: vozes, música e efeitos (' + fmt(aud.duration) + ').', 'ok'); });
  aud.addEventListener('canplaythrough', () => { if (!audioReady) { audioReady = true; audStatus('Áudio pronto: vozes, música e efeitos.', 'ok'); } });
  if (aud.readyState >= 1) { audioReady = true; audStatus('Áudio pronto: vozes, música e efeitos (' + fmt(aud.duration) + ').', 'ok'); }
  aud.addEventListener('error', () => { if (mode === 'audio') { audStatus('Não foi possível carregar o áudio.', 'err'); if (started) showErr('O arquivo de áudio não carregou. Verifique a conexão e tente de novo.'); } });
  aud.addEventListener('waiting', () => { if (playing && mode === 'audio') $('spin').hidden = false; });
  aud.addEventListener('playing', () => { $('spin').hidden = true; });
  aud.addEventListener('canplay', () => { $('spin').hidden = true; });
  aud.addEventListener('ended', () => { if (mode === 'audio') { playing = false; setPP(false); finish(); } });
  aud.addEventListener('pause', () => { if (mode === 'audio' && playing && !aud.ended) { playing = false; setPP(false); } });

  function showErr(msg) { $('errMsg').textContent = msg; $('errOv').hidden = false; $('start').hidden = true; $('spin').hidden = true; playing = false; setPP(false); }
  function finish() { $('endOv').hidden = false; }

  async function play() {
    $('endOv').hidden = true; $('errOv').hidden = true;
    if (curT() >= DUR - 0.05) setT(0);
    if (mode === 'audio') {
      $('spin').hidden = audioReady;
      try { await aud.play(); playing = true; setPP(true); $('spin').hidden = true; }
      catch (e) {
        $('spin').hidden = true;
        if (e && e.name === 'NotAllowedError') showErr('O navegador bloqueou o som. Toque em "Tentar de novo".');
        else showErr('O áudio não pôde ser reproduzido (' + (e && e.name || 'erro') + ').');
      }
    } else { clockStart = performance.now(); playing = true; setPP(true); if (mode === 'tts') ttsReset(clockBase); }
  }
  function pause() {
    if (mode === 'audio') aud.pause(); else { clockBase = curT(); }
    playing = false; setPP(false);
    if (mode === 'tts') try { speechSynthesis.cancel(); } catch (e) {}
  }
  function begin(t) {
    started = true; $('start').hidden = true;
    if (typeof t === 'number') setT(t);
    play();
  }
  $('playBig').onclick = () => begin(0);
  $('again').onclick = () => { setT(0); play(); };
  $('retry').onclick = () => { mode = 'audio'; $('errOv').hidden = true; aud.load(); play(); };
  $('silent').onclick = () => { const t = curT(); mode = 'clock'; clockBase = t; $('errOv').hidden = true; play(); };
  $('useTTS').onclick = async () => {
    const v = await pickVoice();
    if (!v) { $('errMsg').textContent = 'Este navegador não tem nenhuma voz em português instalada. Dá para assistir com legendas ou tentar o áudio de novo.'; $('useTTS').hidden = true; return; }
    const t = curT(); mode = 'tts'; clockBase = t; $('errOv').hidden = true; play();
  };
  $('pp').onclick = () => { if (!started) return begin(0); playing ? pause() : play(); };

  // ---- voz do navegador (alternativa se o arquivo de áudio falhar)
  let ttsVoice = null, spoken = new Set();
  function pickVoice() {
    return new Promise(res => {
      if (!('speechSynthesis' in window)) return res(null);
      const choose = () => { const vs = speechSynthesis.getVoices(); return vs.find(v => /pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; };
      let v = choose(); if (v) { ttsVoice = v; return res(v); }
      speechSynthesis.onvoiceschanged = () => { v = choose(); ttsVoice = v; res(v); };
      setTimeout(() => { ttsVoice = choose(); res(ttsVoice); }, 2500);
    });
  }
  const PITCH = { veri: 1.15, rafa: 1.2, lucia: 1.0, ze: 0.7, neide: 1.3, carlos: 0.85 };
  function ttsReset(t) { spoken = new Set(LINES.filter(l => l.s < t - 0.2).map(l => l.id)); try { speechSynthesis.cancel(); } catch (e) {} }
  function ttsTick(t) {
    for (const l of LINES) if (!spoken.has(l.id) && t >= l.s && t < l.e) {
      spoken.add(l.id);
      const u = new SpeechSynthesisUtterance(l.text); u.voice = ttsVoice; u.lang = ttsVoice ? ttsVoice.lang : 'pt-BR';
      u.pitch = PITCH[l.who] || 1; u.rate = 1.08; speechSynthesis.speak(u);
    }
  }

  // ---- barra de progresso
  let seeking = false;
  const seek = $('seek');
  seek.addEventListener('input', () => { seeking = true; const t = +seek.value; setT(t); });
  seek.addEventListener('change', () => { seeking = false; if (!started) { started = true; $('start').hidden = true; play(); } });

  // ---- legendas
  window.SUBS = true;
  function toggleCC() { window.SUBS = !window.SUBS; $('cc').classList.toggle('on', window.SUBS); $('cc').setAttribute('aria-pressed', window.SUBS); draw(curT()); }
  $('cc').onclick = toggleCC;

  // ---- volume
  const vol = $('vol');
  function volIcon() { const m = aud.muted || aud.volume === 0; $('volIcon').innerHTML = m ? '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' : '<path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'; $('mute').classList.toggle('on', m); }
  vol.addEventListener('input', () => { aud.volume = +vol.value; aud.muted = +vol.value === 0; vol.style.setProperty('--p', (vol.value * 100) + '%'); volIcon(); });
  vol.style.setProperty('--p', '100%');
  $('mute').onclick = () => { aud.muted = !aud.muted; volIcon(); };
  // iOS ignora volume por código: esconde o controle deslizante e deixa só o botão de silenciar
  try { aud.volume = 0.5; if (aud.volume !== 0.5) vol.hidden = true; aud.volume = 1; } catch (e) { vol.hidden = true; }

  // ---- tela cheia
  $('fs').onclick = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await (stage.requestFullscreen ? stage.requestFullscreen() : stage.webkitRequestFullscreen()); } catch (e) {}
  };
  document.addEventListener('fullscreenchange', () => setTimeout(resize, 50));

  // ---- teclado
  document.addEventListener('keydown', e => {
    if (e.target && e.target.tagName === 'INPUT' && e.key !== ' ') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); $('pp').click(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setT(curT() + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setT(curT() - 5); }
    else if (e.key === 'c' || e.key === 'C') toggleCC();
    else if (e.key === 'm' || e.key === 'M') $('mute').click();
    else if (e.key === 'f' || e.key === 'F') $('fs').click();
  });
  cv.addEventListener('click', () => { if (started) $('pp').click(); });

  // ---- início: espera as fontes para o primeiro quadro
  window.addEventListener('resize', resize);
  const fontsReady = Promise.race([
    Promise.all(['800 20px "Baloo 2"', '700 20px "Baloo 2"', '600 20px "Baloo 2"'].map(f => document.fonts.load(f))).catch(() => {}),
    new Promise(r => setTimeout(r, 3000)),
  ]);
  fontsReady.then(() => { wrapCache.clear(); resize(); draw(3.0); });
  resize(); draw(3.0);
  // quadro de capa (título) até começar
  const origCurT = curT;
  requestAnimationFrame(function first() { if (window.__export) return; if (!started) { draw(3.0); ui(0); requestAnimationFrame(first); } else loop(); });

  // gancho para exportar vídeo quadro a quadro
  window.__renderAt = t => { draw(t); };
  window.__fontsReady = fontsReady;
})();
