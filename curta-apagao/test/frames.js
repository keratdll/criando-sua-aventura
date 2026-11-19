// Renderiza quadros em tempos dados e monta folhas de contato
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2]; const times = process.argv.slice(3).map(Number);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 540, height: 1100 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../dist/index.html'));
  await p.evaluate(() => window.__fontsReady);
  await p.evaluate(() => { window.__export = true; document.getElementById('start').hidden = true; });
  for (const t of times) {
    await p.evaluate(t => window.__renderAt(t), t);
    await p.locator('#cv').screenshot({ path: `${out}/f_${String(t).padStart(6, '0')}.png` });
  }
  console.log('errors:', JSON.stringify(errs));
  await b.close();
})();
