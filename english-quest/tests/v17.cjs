/* Kiểm tra bản 1.7: 6 trò chơi mới đặt trên bản đồ (quầy trò chơi) dùng ảnh mới từ Drive.
 * Chạy: node tests/v17.cjs (cần Playwright) */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fail++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(400);
  const clean = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; EQ.challenge.current = null; });
  const shot = n => page.screenshot({ path: path.join(OUT, 'v17-' + n + '.png') });
  await page.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Bin', grade: 6, age: 11, avatar: { hair: 'pony', hairC: '#6d4c41', skin: '#f5d0a9', outfit: 'hero' } });
    p.placement.done = true; p.items.wand = 1;
    EQ.learn.learnWords(p, ['apple', 'red', 'green', 'yellow', 'cat', 'dog', 'black', 'white', 'one', 'two', 'three', 'egg', 'key', 'box', 'book', 'pen', 'bag', 'ball']);
    EQ.rpg.ensure(p); ['w4', 'h4', 'n4', 'r4'].forEach(id => { EQ.rpg.give(p, id); EQ.rpg.equip(p, id); });
    document.getElementById('screen').className = 'screen hidden';
    EQ.game.startProfile(p);
  });
  await page.waitForTimeout(1500);
  await clean();

  // 1. ảnh mới đã nhúng
  const nimg = await page.evaluate(() => Object.keys(EQ.MG_IMG || {}).length);
  ok(nimg >= 60, 'Đã nhúng ' + nimg + ' ảnh mới (kẹo, cướp biển, máy bay, xe, robot, côn trùng)');
  const loaded = await page.evaluate(async () => { const ks = Object.keys(EQ.MG_IMG); ks.forEach(k => EQ.arcade.mgImg(k)); await new Promise(r => setTimeout(r, 500)); return ks.filter(k => { const i = EQ.arcade.mgImg(k); return i.complete && i.naturalWidth > 0; }).length; });
  ok(loaded === nimg, 'Tất cả ảnh mở được (' + loaded + '/' + nimg + ')');

  // 2. quầy trò chơi trên từng bản đồ
  const booths = { village: ['candy', 'pirate', 'hill'], forest: ['td', 'plane'], castle: ['robot'] };
  for (const reg of Object.keys(booths)) {
    const r = await page.evaluate(reg => {
      const def = EQ.REGIONS[reg];
      const bs = def.entities.filter(e => e.game);
      EQ.world.load(reg, bs[0].x, bs[0].y + 1, EQ.game.profile);
      EQ.world.updateCam(true);
      const free = bs.every(e => !EQ.SOLID.has(EQ.world.rows[e.y][e.x]) && !EQ.SOLID.has(EQ.world.rows[e.y + 1][e.x]));
      return { games: bs.map(e => e.game), labels: bs.map(e => EQ.world.label(e)), free };
    }, reg);
    ok(JSON.stringify(r.games) === JSON.stringify(booths[reg]) && r.labels.every(l => l.startsWith('🎮')), reg + ': có quầy ' + r.labels.join(', '));
    ok(r.free, reg + ': quầy đặt ở ô đi được, có chỗ đứng phía dưới');
    await page.waitForTimeout(500); await shot('map-' + reg);
  }
  // bấm vào quầy → bảng giới thiệu → chơi
  await page.evaluate(() => { const e = EQ.REGIONS.village.entities.find(x => x.id === 'mg_candy'); EQ.world.load('village', e.x, e.y + 1, EQ.game.profile); });
  await page.waitForTimeout(300);
  await page.evaluate(() => EQ.game.talkTo(EQ.REGIONS.village.entities.find(x => x.id === 'mg_candy')));
  await page.waitForTimeout(300); await shot('booth');
  ok(await page.evaluate(() => !!document.querySelector('.booth-card img.booth-img') && /Tiệm kẹo chữ/.test(document.querySelector('.booth-card').textContent)), 'Nói chuyện với quầy mở bảng giới thiệu trò chơi');
  await page.evaluate(() => [...document.querySelectorAll('.booth-card .btn')].find(b => /Chơi/.test(b.textContent)).click());
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => EQ.arcade._cur && !!EQ.arcade._cur.game._st), 'Bấm ▶ Chơi vào được trò');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  const E = await page.evaluate(() => EQ.rpg.effects(EQ.game.profile));
  const play = async id => {
    await page.evaluate(id => { const pool = EQ.learn.learnedIds(EQ.game.profile).map(i => EQ.V[i]); EQ.arcade.play(id, pool); }, id);
    await page.waitForTimeout(1300);
  };
  const S = () => page.evaluate(() => EQ.arcade._cur.api.S.correct);

  // 3. Pháo đài côn trùng
  await play('td');
  await shot('td');
  let st = await page.evaluate(() => { const s = EQ.arcade._cur.game._st; return { max: s.max, n: s.bugs.length, w: !!s.w }; });
  ok(st.max === E.hp && st.n === 4 && st.w, 'Pháo đài: 4 con bọ mang từ, thành có ❤️ ' + st.max + ' = Máu trang bị');
  await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let k = 0; k < 150 && EQ.arcade._cur.api.S.correct < 2; k++) {
      const b = s.bugs.find(x => !x.dead && s.w && x.w.id === s.w.id && x.s > 0);
      if (b) { const q = g._at(b.s); g.onClick(q.x, q.y); }
      await new Promise(r => setTimeout(r, 120));
    }
  });
  ok(await S() >= 2, 'Pháo đài: bấm bọ đúng → pháo bắn hạ (' + await S() + ' câu)');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 4. Tiệm kẹo chữ
  await play('candy');
  await shot('candy-start');
  await page.evaluate(() => EQ.arcade._cur.game.onClick(440, 330));
  await page.waitForTimeout(900);
  await shot('candy');
  const candy = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    const before = s.T;
    // bấm sai 1 lần
    let wrong = null;
    s.grid.forEach((col, x) => col.forEach((k, y) => { if (!wrong && k && s.w && k.w.id !== s.w.id) wrong = [x, y]; }));
    if (wrong) g.onClick(100 + wrong[0] * 112 + 56, 120 + wrong[1] * 92 + 46);
    for (let n = 0; n < 4; n++) {
      await new Promise(r => setTimeout(r, 700));
      let hit = null;
      s.grid.forEach((col, x) => col.forEach((k, y) => { if (!hit && k && s.w && k.w.id === s.w.id) hit = [x, y]; }));
      if (hit) g.onClick(100 + hit[0] * 112 + 56, 120 + hit[1] * 92 + 46);
    }
    return { started: s.started, correct: EQ.arcade._cur.api.S.correct, full: s.grid.every(c => c.every(Boolean)), before };
  });
  ok(candy.started && candy.correct >= 3 && candy.full, 'Kẹo chữ: bấm kẹo đúng nổ, kẹo mới rơi xuống đầy bàn (' + candy.correct + ' câu)');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 5. Phi công chữ
  await play('plane');
  await page.waitForTimeout(1500);
  await shot('plane');
  const plane = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let k = 0; k < 120 && EQ.arcade._cur.api.S.correct < 2; k++) {
      s.inv = 5;
      const cl = s.clouds.find(c => s.w && c.w.id === s.w.id && c.x < 860);
      if (cl) { s.y = cl.y - 14; s.cd = 0; g.onClick(); }
      await new Promise(r => setTimeout(r, 80));
    }
    return { correct: EQ.arcade._cur.api.S.correct, max: s.max };
  });
  ok(plane.correct >= 2 && plane.max === E.hp, 'Phi công: bắn trúng mây đúng (' + plane.correct + ' câu), ❤️ ' + plane.max);
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 6. Xe leo đồi
  await play('hill');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(2500);
  await shot('hill-drive');
  const hill1 = await page.evaluate(() => { const s = EQ.arcade._cur.game._st; return { x: s.x, fuel: s.fuel, max: s.maxF }; });
  ok(hill1.x > 300 && hill1.fuel < hill1.max, 'Xe leo đồi: giữ → xe chạy (' + Math.round(hill1.x) + 'px), tốn xăng');
  await page.evaluate(() => { const s = EQ.arcade._cur.game._st; s.x = s.stations[0].x - 30; s.v = 200; });
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');
  await shot('hill-station');
  const hill2 = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    const stop = !!s.stop; s.fuel = 20;
    const i = s.stop ? s.stop.pumps.findIndex(o => o.id === s.w.id) : -1;
    if (i >= 0) g._choose(i);
    return { stop, fuel: s.fuel, correct: EQ.arcade._cur.api.S.correct };
  });
  ok(hill2.stop && hill2.correct === 1 && hill2.fuel > 60, 'Xe leo đồi: dừng ở trạm xăng, chọn đúng → đổ xăng (' + Math.round(hill2.fuel) + ')');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 7. Kho báu cướp biển
  await play('pirate');
  const pir = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let n = 0; n < 3; n++) {
      const k = s.tiles.find(q => !q.dug && s.w && q.w.id === s.w.id);
      if (k) g.onClick(440 - 330 + k.x * 132 + 66, 150 + k.y * 100 + 50);
      await new Promise(r => setTimeout(r, n < 2 ? 1500 : 200));
    }
    return { correct: EQ.arcade._cur.api.S.correct, dug: s.tiles.filter(q => q.dug).length, max: s.max };
  });
  await shot('pirate');
  ok(pir.correct >= 3 && pir.dug >= 1, 'Kho báu: đào đúng ô ' + pir.correct + ' lần, hiện vật phẩm cướp biển');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 8. Đấu trường robot
  await play('robot');
  await page.waitForTimeout(800);
  await shot('robot');
  const rob = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let k = 0; k < 150 && EQ.arcade._cur.api.S.correct < 2; k++) {
      s.inv = 5;
      const b = s.bots.find(x => !x.dead && s.w && x.w.id === s.w.id);
      if (b && b.x < 860) { s.cd = 0; g.onClick(b.x, 370); }
      await new Promise(r => setTimeout(r, 80));
    }
    return { correct: EQ.arcade._cur.api.S.correct, max: s.max };
  });
  ok(rob.correct >= 2 && rob.max === E.hp, 'Robot: tên lửa hạ robot mang từ đúng (' + rob.correct + ' câu)');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 9. Khu vui chơi có đủ 14 trò, ghi vị trí quầy
  await page.evaluate(() => EQ.arcade.open()); await page.waitForTimeout(300);
  await shot('menu');
  const menu = await page.evaluate(() => ({ cards: document.querySelectorAll('.am-card').length, where: document.querySelectorAll('.am-where').length }));
  ok(menu.cards === 14 && menu.where === 6, 'Khu vui chơi: ' + menu.cards + ' trò, ' + menu.where + ' trò có quầy trên bản đồ');
  await clean();

  ok(errors.length === 0, 'Không có lỗi JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fail ? '\n❌ Có ' + fail + ' lỗi' : '\n🎉 Bản 1.7: tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
