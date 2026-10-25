/* Kiểm tra bản 1.8: rắn săn chữ mới, nông trại, pháo tháp ảnh thật, bấm chuột để đi, giáp/găng/giày, thanh máu, vùng hoang dã + boss thế giới.
 * Chạy: node tests/v18.cjs (cần Playwright) */
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
  const shot = n => page.screenshot({ path: path.join(OUT, 'v18-' + n + '.png') });
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

  const play = async id => {
    await page.evaluate(id => { const pool = EQ.learn.learnedIds(EQ.game.profile).map(i => EQ.V[i]); EQ.arcade.play(id, pool); }, id);
    await page.waitForTimeout(1300);
  };
  const S = () => page.evaluate(() => EQ.arcade._cur.api.S.correct);

  // 1. Rắn săn chữ: đủ chữ cái của từ trên bàn, ăn đúng thứ tự
  await play('snake');
  await shot('snake');
  const sn = await page.evaluate(() => {
    const s = EQ.arcade._cur.game._st, w = s.need.toLowerCase().replace(/[^a-z]/g, '');
    const have = s.letters.map(l => l.ch).sort().join('');
    return { all: w.split('').every(ch => s.letters.filter(l => l.ch === ch).length >= w.split('').filter(c => c === ch).length), n: s.letters.length, w };
  });
  ok(sn.all && sn.n > sn.w.length, 'Rắn: bàn có ĐỦ mọi chữ cái của "' + sn.w + '" + chữ nhiễu (' + sn.n + ' ô)');
  // bot: dẫn rắn tới từng chữ cần ăn
  const sn2 = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let k = 0; k < 900 && (s.words || 0) < 2; k++) {
      s.inv = 2;
      const w = s.need.toLowerCase().replace(/[^a-z]/g, ''), ch = w[s.got.length];
      const L = s.letters.find(l => l.ch === ch);
      if (L && !s.wait) { const h = s.body[0]; s.q = []; if (L.x !== h[0]) s.dir = [L.x > h[0] ? 1 : -1, 0]; else s.dir = [0, L.y > h[1] ? 1 : -1]; }
      await new Promise(r => setTimeout(r, 60));
    }
    return { correct: s.words || 0, len: s.body.length };
  });
  ok(sn2.correct >= 2, 'Rắn: ăn đúng thứ tự → ghép xong từ (' + sn2.correct + ' từ), rắn dài ra');
  const wrap = await page.evaluate(async () => {
    const s = EQ.arcade._cur.game._st; s.wait = 0; s.done = false; s.letters = []; s.body = [[23, 2], [22, 2], [21, 2]]; s.dir = [1, 0]; s.q = []; s.inv = 0; const lives = s.lives;
    await new Promise(r => setTimeout(r, 450));
    return { x: s.body[0][0], lives, now: s.lives };
  });
  ok(wrap.x < 5 && wrap.now === wrap.lives, 'Rắn: đi xuyên tường sang mép bên kia, không mất máu');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();


  // 2. Trang bị mới: bao tay, áo giáp, giày
  const gear = await page.evaluate(() => {
    const R = EQ.rpg, p = EQ.game.profile;
    const slots = Object.keys(R.SLOTS);
    const before = { atk: R.stats(p).atk, life: R.maxLife(p), sp: R.speedBonus(p) };
    ['g3', 'a4', 'b4'].forEach(id => { R.give(p, id); R.equip(p, id); });
    const after = { atk: R.stats(p).atk, life: R.maxLife(p), sp: R.speedBonus(p) };
    return { slots, before, after, look: Object.keys(p.avatar._gear || {}), n: R.GEAR.length };
  });
  ok(['glove', 'armor', 'boots'].every(s => gear.slots.includes(s)) && gear.n === 35, 'Có thêm ô 🧤 Bao tay, 🦺 Áo giáp, 👢 Giày (' + gear.n + ' món)');
  ok(gear.after.atk === gear.before.atk + 2 && gear.after.life === gear.before.life + 50 && gear.after.sp > 0.2, 'Bao tay +⚔️, áo giáp & giày +❤️ máu tối đa (' + gear.before.life + '→' + gear.after.life + '), giày đi nhanh hơn ' + Math.round(gear.after.sp * 100) + '%');
  ok(['glove', 'armor', 'boots'].every(k => gear.look.includes(k)), 'Trang bị mới hiện trên nhân vật');
  await page.evaluate(() => EQ.rpg_ui ? 0 : 0);
  await page.evaluate(() => EQ.rpgui.gearScreen('mine'));
  await page.waitForTimeout(300); await shot('gear'); await clean();

  // 3. Thanh máu: sai bị cắn mất máu, hết máu → gục ngã, rơi 1 món đồ, hồi sinh ở Làng
  ok(await page.evaluate(() => /❤️ \d+ \/ \d+/.test(document.querySelector('.hud .life-text, .life-bar.hud .life-text').textContent)), 'HUD có thanh máu ❤️');
  await page.evaluate(() => { const p = EQ.game.profile; EQ.world.load('wild', 37, 14, p); p.region = 'wild'; });
  await page.waitForTimeout(300);
  const bt = await page.evaluate(async () => {
    const p = EQ.game.profile; p.life = 30;
    const worn = Object.values(p.gear.eq).filter(Boolean).length;
    const prom = EQ.battle.start({ def: EQ.MONSTERS.rock, hp: 99, name: 'Người Đá Con', bite: 40, matk: 3, spec: {} });
    const B = EQ.battle._st;
    const lifeStart = B.life;
    // trả lời sai cho tới khi gục
    const lives = [];
    for (let k = 0; k < 30 && !document.querySelector('.bt-result.dead'); k++) {
      await new Promise(r => setTimeout(r, 250));
      if (EQ.challenge._testAnswer) EQ.challenge._testAnswer(false);
      await new Promise(r => setTimeout(r, 1300));
      const b = document.querySelector('.q-feedback .btn'); if (b) b.click();
      lives.push(B.life);
    }
    const dead = !!document.querySelector('.bt-result.dead');
    const msg = dead ? document.querySelector('.bt-result.dead').textContent : '';
    return { lifeStart, dead, msg, worn, lives };
  });
  await shot('dead');
  ok(bt.lifeStart >= 30 && bt.dead, 'Trả lời sai → quái cắn mất máu (' + bt.lives.join('→') + '), hết máu → 💀 gục ngã');
  ok(/đánh rơi/.test(bt.msg), 'Gục ngã → rơi 1 món đồ: ' + bt.msg.replace(/\s+/g, ' ').slice(0, 90));
  await page.evaluate(() => [...document.querySelectorAll('.bt-result.dead button')].find(b => /Hồi sinh/.test(b.textContent)).click());
  await page.waitForTimeout(700);
  const after = await page.evaluate(() => { const p = EQ.game.profile; return { region: EQ.world.id, life: EQ.rpg.lifeOf(p), max: EQ.rpg.maxLife(p), worn: Object.values(p.gear.eq).filter(Boolean).length }; });
  ok(after.region === 'village' && after.life === after.max && after.worn === bt.worn - 1, 'Hồi sinh ở Làng, đầy máu, còn ' + after.worn + '/' + bt.worn + ' món đang mặc');
  await clean();

  // 4. Vùng Hoang Dã: cổng từ Làng, quái mạnh, suối hồi máu, Boss thế giới
  const wild = await page.evaluate(() => {
    const p = EQ.game.profile; const portal = EQ.REGIONS.village.entities.find(e => e.id === 'toWild');
    EQ.world.load('wild', 37, 14, p); p.region = 'wild';
    return { portal: !!portal && portal.to === 'wild', mons: EQ.world.monsters.length, kinds: [...new Set(EQ.world.monsters.map(m => m.def.name))], boss: !!EQ.world.ents.find(e => e.worldBoss) };
  });
  ok(wild.portal && wild.mons >= 5 && wild.boss, 'Vùng Hoang Dã: cổng ở mép tây Làng, ' + wild.mons + ' quái (' + wild.kinds.join(', ') + '), có 👹 Boss');
  await page.evaluate(() => { const e = EQ.REGIONS.wild.entities.find(x => x.worldBoss); EQ.world.load('wild', e.x, e.y + 2, EQ.game.profile); EQ.world.monsters = []; EQ.world.updateCam(true); });
  await page.waitForTimeout(400); await shot('wild');
  const wb = await page.evaluate(async () => {
    const p = EQ.game.profile; p.life = 1; const pw = EQ.rpg.power(p);
    await EQ.wild.heal(); const healed = EQ.rpg.lifeOf(p) === EQ.rpg.maxLife(p);
    const s = EQ.wild.stats(p);
    const owned = Object.keys(p.gear.owned).length, gold = p.gold;
    // thắng Boss (giả lập kết quả trận)
    const orig = EQ.battle.start; EQ.battle.start = async () => 'win';
    const pr = EQ.wild.boss(EQ.REGIONS.wild.entities.find(x => x.worldBoss));
    await new Promise(r => setTimeout(r, 300));
    const card = !!document.querySelector('.wb-card');
    [...document.querySelectorAll('.wb-card button')].find(b => /Thách đấu/.test(b.textContent)).click();
    for (let k = 0; k < 20; k++) { await new Promise(r => setTimeout(r, 200)); document.querySelectorAll('.modal-back .btn').forEach(b => { if (/OK|Tuyệt|Đóng|Nhận/.test(b.textContent)) b.click(); }); }
    await pr; EQ.battle.start = orig;
    return { healed, s, card, gotGear: Object.keys(p.gear.owned).length >= owned, goldUp: p.gold - gold, rest: EQ.wild.resting(p) > 0, pw };
  });
  ok(wb.healed, '⛲ Suối hồi đầy máu');
  ok(wb.card && wb.goldUp >= wb.s.gold && wb.rest, '👹 Boss: Máu ' + wb.s.hp + ', cắn ' + wb.s.bite + ', đề xuất 💪' + wb.s.rec + ' (bạn ' + wb.pw + ') → thắng +' + wb.goldUp + ' 🪙 + trang bị ngẫu nhiên, Boss nghỉ 5 phút');
  await clean();

  // 5. Bấm chuột để đi
  const mv = await page.evaluate(async () => {
    const p = EQ.game.profile; EQ.world.load('village', 20, 16, p); p.region = 'village'; EQ.world.monsters = []; EQ.world.updateCam(true);
    const W = EQ.world, cv = document.getElementById('game'), r = cv.getBoundingClientRect();
    const tx = 25, ty = 16;
    const sx = (tx + 0.5) * 32 - W.cam.x, sy = (ty + 0.5) * 32 - W.cam.y;
    cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + sx * r.width / cv.width, clientY: r.top + sy * r.height / cv.height }));
    const hasPath = !!(W.path && W.path.length);
    await new Promise(r => setTimeout(r, 1800));
    return { hasPath, x: Math.floor(W.player.x / 32), y: Math.floor((W.player.y - 4) / 32) };
  });
  ok(mv.hasPath && mv.x === 25 && mv.y === 16, '🖱️ Bấm chuột vào bản đồ → nhân vật tự tìm đường tới ô (' + mv.x + ',' + mv.y + ')');
  const talk = await page.evaluate(async () => {
    const W = EQ.world, e = EQ.REGIONS.village.entities.find(x => x.id === 'mg_candy');
    const cv = document.getElementById('game'), r = cv.getBoundingClientRect();
    W.updateCam(true);
    const sx = (e.x + 0.5) * 32 - W.cam.x, sy = (e.y + 0.5) * 32 - W.cam.y;
    cv.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + sx * r.width / cv.width, clientY: r.top + sy * r.height / cv.height }));
    for (let k = 0; k < 60 && !document.querySelector('.booth-card'); k++) await new Promise(r => setTimeout(r, 200));
    return !!document.querySelector('.booth-card');
  });
  await shot('click-npc');
  ok(talk, '🖱️ Bấm vào quầy/NPC ở xa → tự đi tới và mở hội thoại');
  await clean();


  // 6. Pháo đài côn trùng dùng ảnh pháo tháp thật theo bậc vũ khí
  const tur = await page.evaluate(async () => { const ks = ['tur_t1', 'tur_t5', 'tur_t10', 'tur_t15', 'tur_t20', 'tur_shot']; ks.forEach(k => EQ.arcade.mgImg(k)); await new Promise(r => setTimeout(r, 300)); return ks.filter(k => EQ.arcade.mgImg(k).naturalWidth > 0).length; });
  ok(tur === 6, 'Ảnh pháo tháp (5 bậc + đạn) đã nhúng');
  await play('td'); await page.waitForTimeout(1500); await shot('td');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 7. Nông trại chữ
  ok(await page.evaluate(() => { const e = EQ.REGIONS.village.entities.find(x => x.game === 'farm'); return !!e && !EQ.SOLID.has(EQ.REGIONS.village._rows[e.y + 1][e.x]); }), 'Quầy 🌱 Nông trại chữ ở Làng');
  await play('farm');
  const farm = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st;
    for (let k = 0; k < 80 && s.harvest < 2; k++) {
      const pl = s.w && s.plots.find(q => !q.ripe && q.w.id === s.w.id);
      if (pl) { const c = g._center(pl); g.onClick(c.x, c.y); }
      await new Promise(r => setTimeout(r, 250));
    }
    return { harvest: s.harvest, correct: EQ.arcade._cur.api.S.correct, stages: s.plots.map(q => q.stage) };
  });
  await shot('farm');
  ok(farm.harvest >= 2 && farm.correct >= 4, 'Nông trại: tưới đúng luống → cây lớn → thu hoạch ' + farm.harvest + ' rau củ (' + farm.correct + ' câu đúng)');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

//NEXT
  ok(errors.length === 0, 'Không có lỗi JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fail ? '\n❌ Có ' + fail + ' lỗi' : '\n🎉 Bản 1.8: tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
