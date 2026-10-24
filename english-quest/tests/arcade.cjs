/* Kiểm thử Khu vui chơi: node tests/arcade.cjs – bot tự chơi 4 trò, kiểm tra ghi điểm & ôn tập */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.join(ROOT, 'index.html')); await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Mai', grade: 6 }); p.placement.done = true; p.book = 'gs6'; p.schoolUnit = { gs6: 8 };
    document.getElementById('screen').className = 'screen hidden'; EQ.game.startProfile(p);
    EQ.learn.learnWords(p, EQ.U.uniq(EQ.CURRICULUM.gs6[7].sgk.concat(EQ.CURRICULUM.gs6[7].words)));
    EQ.learn.learnWords(p, EQ.VOCAB.filter(w => w.r === 'village').map(w => w.id));
  });
  await pg.waitForTimeout(2600);
  await pg.keyboard.press('KeyG'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(OUT, 'a-menu.png') });
  const results = {};
  for (const id of ['race', 'catch', 'obby', 'balloon']) {
    await pg.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(x => x.remove()); EQ.ui.stack = []; });
    await pg.evaluate(id => { const p = EQ.game.profile; const src = EQ.arcade.sources(p).find(s => s.id === 'unit'); EQ.arcade.play(id, EQ.U.shuffle(src.ids.map(i => EQ.V[i]))); }, id);
    let shot = false;
    for (let k = 0; k < 2500; k++) {
      const st = await pg.evaluate(id => {
        const cur = EQ.arcade._cur, g = cur.game, s = g._st, S = cur.api.S;
        if (S.over) return { over: true, S: { score: S.score, correct: S.correct, total: S.total } };
        if (!s) return {};
        if (id === 'race') { const gt = s.gates.find(x => !x.done); if (gt) s.lane = gt.opts.findIndex(o => o.id === gt.w.id); }
        if (id === 'catch' && s.w) { const need = s.w.en.toLowerCase().charAt(s.got); const l = s.letters.filter(x => x.ch === need).sort((a, b) => b.y - a.y)[0]; if (l) s.x = l.x; }
        if (id === 'balloon' && s.w && s.wait <= 0) { const bb = s.balloons.find(x => x.w.id === s.w.id && !x.pop); if (bb) g._hit(bb); }
        if (id === 'obby') {
          const pl = s.pl; const z = s.qzones.find(q => !q.answered);
          if (z && pl.x > z.cp.x && pl.x < z.cp.x + z.cp.w) { const bk = z.blocks.find(q => q.answer.id === z.w.id); pl.x = bk.x + bk.w / 2; pl.y = bk.y + bk.h + 2; pl.vy = -300; }
          else { const tgt = s.plats.find(q => !q.hidden && q.x > pl.x + 10); if (tgt) { pl.x = tgt.x + Math.min(40, tgt.w / 2); pl.y = tgt.y - pl.h - 1; pl.vy = 0; } }
        }
        return {};
      }, id);
      if (!shot && k === 40) { await pg.screenshot({ path: path.join(OUT, 'a-' + id + '.png') }); shot = true; }
      if (st.over) { results[id] = st.S; break; }
      await pg.waitForTimeout(id === 'obby' ? 120 : 60);
    }
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(OUT, 'a-' + id + '-end.png') });
    await pg.evaluate(() => { const btn = Array.from(document.querySelectorAll('.ar-res-card .btn')).find(x => x.textContent === 'Thoát'); if (btn) btn.click(); });
  }
  const rec = await pg.evaluate(() => ({ answers: EQ.game.profile.stats.answers, arcade: EQ.game.profile.arcade, gold: EQ.game.profile.gold }));
  console.log(JSON.stringify(results), JSON.stringify(rec));
  await b.close();
  const bad = ['race', 'catch', 'obby', 'balloon'].filter(i => !results[i] || results[i].total === 0);
  if (errs.length || bad.length) { console.log('❌', errs, 'chưa xong:', bad); process.exit(1); }
  console.log('✅ 4 trò chơi chạy tốt');
})().catch(e => { console.error(e); process.exit(1); });
