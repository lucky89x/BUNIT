/* Kiểm thử v1.4: node tests/gear.cjs – mua/mặc/nâng cấp trang bị, chỉ số, Bảng nhiệm vụ, Tháp Thử Thách */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out'); fs.mkdirSync(OUT, { recursive: true });
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log((c ? '✅ ' : '❌ ') + m); };
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + path.join(ROOT, 'index.html')); await pg.waitForTimeout(300);
  await pg.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Lan', grade: 8 }); p.placement.done = true;
    document.getElementById('screen').className = 'screen hidden'; EQ.game.startProfile(p);
    EQ.learn.learnWords(p, EQ.VOCAB.filter(w => w.r === 'village').map(w => w.id));
  });
  await pg.waitForTimeout(2600);

  // 1) Mua – mặc – nâng cấp
  const r1 = await pg.evaluate(() => {
    const R = EQ.rpg, p = EQ.game.profile;
    const base = R.stats(p), pw0 = R.power(p);
    p.gold = 5;
    const poor = R.buy(p, 'w1');
    p.gold = 5000;
    const b1 = R.buy(p, 'w1'), b2 = R.buy(p, 'n1'), b3 = R.buy(p, 'h3'), b4 = R.buy(p, 'r1');
    const again = R.buy(p, 'w1');
    const s1 = R.stats(p);
    const g0 = p.gold; const up = R.upgrade(p, 'r1'); const spent = g0 - p.gold;
    const s2 = R.stats(p);
    R.equip(p, 'h3'); const s3 = R.stats(p); const lookOff = !!(p.avatar._gear && p.avatar._gear.hat);
    R.equip(p, 'h3'); const lookOn = p.avatar._gear && p.avatar._gear.hat;
    return { base, pw0, poor: poor.ok, b: [b1.ok, b2.ok, b3.ok, b4.ok], again: again.ok, s1, s2, s3, up: up.ok, spent, pw1: R.power(p), eq: p.gear.eq, lookOff, lookOn, cost: R.upCost(R.GI.r1, 0) };
  });
  ok(!r1.poor, 'Không đủ vàng thì không mua được');
  ok(r1.b.every(x => x), 'Mua được 4 món (vũ khí, dây chuyền, mũ, nhẫn)');
  ok(!r1.again, 'Không mua trùng món đã có');
  ok(r1.eq.weapon === 'w1' && r1.eq.neck === 'n1' && r1.eq.hat === 'h3' && r1.eq.ring === 'r1', 'Mua xong tự mặc vào ô trống');
  ok(r1.s1.atk > r1.base.atk && r1.s1.def > r1.base.def && r1.s1.luck > r1.base.luck, 'Trang bị tăng sức mạnh/phòng thủ/may mắn: ' + JSON.stringify(r1.s1));
  ok(r1.up && r1.spent === r1.cost && r1.s2.luck > r1.s1.luck, 'Nâng cấp nhẫn +1 tốn ' + r1.spent + ' vàng và tăng may mắn');
  ok(r1.s3.def < r1.s2.def && !r1.lookOff && r1.lookOn === 'h3', 'Tháo/mặc mũ đổi chỉ số và hình nhân vật');
  ok(r1.pw1 > r1.pw0, 'Lực chiến tăng ' + r1.pw0 + ' → ' + r1.pw1);
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(OUT, 'g-world-gear.png') });

  // 2) May mắn cộng vàng
  const luck = await pg.evaluate(async () => { const p = EQ.game.profile; const g = p.gold; await EQ.game.reward(p, { gold: 100 }); document.querySelectorAll('#modals .modal-back').forEach(x => x.remove()); EQ.ui.stack = []; return { got: p.gold - g, luck: EQ.rpg.stats(p).luck }; });
  ok(luck.got === Math.round(100 * (1 + luck.luck / 100)), 'May mắn +' + luck.luck + '%: nhận ' + luck.got + ' vàng từ phần thưởng 100');

  // 3) Màn hình trang bị
  await pg.evaluate(() => EQ.rpgui.gearScreen('shop')); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'g-shop.png') });
  await pg.evaluate(() => EQ.rpgui.gearScreen('mine')); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'g-mine.png') });
  await pg.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(x => x.remove()); EQ.ui.stack = []; });

  // 4) Bảng nhiệm vụ
  const jobs = await pg.evaluate(async () => {
    const R = EQ.rpg, p = EQ.game.profile; const d = R.dailyJobs(p); const ji = d.list.findIndex(x => !R.jobInfo(p, x).done); const j = d.list[ji]; window._ji = ji;
    const before = R.jobInfo(p, j).done;
    R.count(p, j.type, j.n + 2);
    const after = R.jobInfo(p, j);
    EQ.rpgui.jobs();
    return { n: d.list.length, before, done: after.done, prog: after.prog, need: j.n, gold: j.gold };
  });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'g-jobs.png') });
  ok(jobs.n === 3, 'Có 3 việc trong ngày');
  ok(!jobs.before && jobs.done && jobs.prog === jobs.need, 'Việc hoàn thành khi đủ tiến độ (' + jobs.prog + '/' + jobs.need + ')');
  const claim = await pg.evaluate(async () => {
    const p = EQ.game.profile, g = p.gold;
    document.querySelectorAll('.jobview .job')[window._ji].querySelector('.btn.primary').click();
    await new Promise(r => setTimeout(r, 1500));
    document.querySelectorAll('#modals .modal-back').forEach(x => { if (!x.querySelector('.jobview')) x.remove(); });
    return { got: p.gold - g, claimed: EQ.rpg.dailyJobs(p).list[window._ji].claimed };
  });
  ok(claim.claimed && claim.got >= jobs.gold, 'Nhận thưởng việc: +' + claim.got + ' vàng');
  await pg.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(x => x.remove()); EQ.ui.stack = []; });

  // 5) Tháp Thử Thách: đánh tầng 1
  const fl = await pg.evaluate(() => { const R = EQ.rpg; return [1, 5, 15, 30].map(f => R.floor(f)).map(x => ({ hp: x.hp, rec: x.rec, boss: !!x.boss, matk: x.matk })); });
  ok(fl[0].hp < fl[2].hp && fl[2].hp < fl[3].hp && fl[1].boss && fl[3].boss, 'Tầng càng cao quái càng mạnh: ' + JSON.stringify(fl));
  await pg.evaluate(() => { EQ.game.profile.tower.visited = true; EQ.rpgui.tower(); }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, 'g-tower.png') });
  const g0 = await pg.evaluate(() => EQ.game.profile.gold);
  const k0 = await pg.evaluate(() => EQ.game.profile.counters.tower || 0);
  await pg.evaluate(() => document.querySelector('.tw-floor.open').click());
  let shot = false;
  for (let s = 0; s < 300; s++) {
    const st = await pg.evaluate(() => ({ q: !!EQ.challenge.current, best: EQ.game.profile.tower.best, tw: !!document.querySelector('.towerview'), dlg: EQ.ui.dlgOpen }));
    if (st.best >= 1 && st.tw) break;
    if (st.q) {
      if (!shot) { await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(OUT, 'g-tower-battle.png') }); shot = true; }
      await pg.evaluate(() => EQ.challenge._testAnswer(true)); await pg.waitForTimeout(60);
      await pg.evaluate(() => { const b = document.querySelector('.q-feedback .btn'); if (b) b.click(); }); await pg.waitForTimeout(60);
      continue;
    }
    if (st.dlg) { await pg.evaluate(() => { const b = document.querySelector('#dialog .dlg-next'); if (b) b.click(); }); await pg.waitForTimeout(60); continue; }
    await pg.evaluate(() => { const top = document.querySelector('#modals .modal-back:last-child'); if (!top || top.querySelector('.towerview')) return; const b = top.querySelector('.bt-result .btn.primary') || top.querySelector('.btn.primary'); if (b && !b.disabled) b.click(); });
    await pg.waitForTimeout(150);
  }
  const tw = await pg.evaluate(() => ({ best: EQ.game.profile.tower.best, gold: EQ.game.profile.gold, kills: EQ.game.profile.counters.tower }));
  ok(tw.best === 1 && tw.gold > g0 && tw.kills === k0 + 1, 'Vượt tầng 1 Tháp: best=' + tw.best + ' kills=' + tw.kills + ', +' + (tw.gold - g0) + ' vàng');

  // 6) Lưu & tải lại giữ trang bị
  const saved = await pg.evaluate(() => { EQ.game.saveNow(); const id = EQ.game.profile.id; const d = JSON.parse(localStorage.getItem('englishQuest.v1')); const p2 = d.profiles.find(x => x.id === id); return p2 && p2.gear && p2.gear.eq; });
  ok(saved && saved.weapon === 'w1', 'Lưu hồ sơ giữ nguyên trang bị');

  ok(!errs.length, 'Không có lỗi JS' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await b.close();
  console.log(fails.length ? '\n❌ ' + fails.length + ' lỗi' : '\n🎉 Trang bị / nhiệm vụ / Tháp: tất cả đạt');
  process.exit(fails.length ? 1 : 0);
})();
