const { chromium } = require('playwright'); const path = require('path'); const { spawn } = require('child_process');
(async () => {
  const FPS = 24, out = process.argv[2];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 540, height: 1100 } });
  await p.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await p.evaluate(() => window.__fontsReady);
  const dur = await p.evaluate(() => { window.__export = true; window.SUBS = true; const cv = document.getElementById('cv'); cv.width = 1080; cv.height = 1920; return TLD.dur; });
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.resolve(__dirname, '../trilha.mp3'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.ceil((dur + 0.9) * FPS);
  for (let i = 0; i < N; i += 24) {
    const frames = await p.evaluate(([i0, n, fps]) => { const cv = document.getElementById('cv'), c = cv.getContext('2d'); const r = [];
      for (let k = i0; k < i0 + n; k++) { c.setTransform(2, 0, 0, 2, 0, 0); render(c, Math.min(k / fps, TLD.dur)); r.push(cv.toDataURL('image/jpeg', 0.9).split(',')[1]); } return r; }, [i, Math.min(24, N - i), FPS]);
    for (const f of frames) if (!ff.stdin.write(Buffer.from(f, 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 1200 === 0) console.log('frame', i, '/', N);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await b.close(); console.log('done');
})();
