/* Kiểm tra bản 1.6: game hành động, trang bị trong trận, quái tinh anh, đấu 2 bé, admin, tên trên đầu.
 * Chạy: node tests/v16.cjs (cần Playwright) */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fail++; };

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(400);
  const clean = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; EQ.challenge.current = null; });
  const shot = n => page.screenshot({ path: path.join(OUT, 'v16-' + n + '.png') });
  await page.evaluate(() => {
    const mk = (name, outfit, grade) => { const p = EQ.store.newProfile({ name, grade, age: 11, avatar: { hair: 'pony', hairC: '#6d4c41', skin: '#f5d0a9', outfit } }); p.placement.done = true; return p; };
    const a = mk('Ngọc Anh', 'basic', 6), b = mk('Bin', 'hero', 8);
    [a, b].forEach(p => { p.items.wand = 1; EQ.learn.learnWords(p, ['apple', 'red', 'green', 'yellow', 'cat', 'dog', 'black', 'white', 'one', 'two', 'three', 'egg', 'key', 'box', 'book', 'pen', 'bag', 'ball']); p.lessons.tobe = 1; });
    EQ.rpg.ensure(b); ['w4', 'h4', 'n4', 'r4'].forEach(id => { EQ.rpg.give(b, id); EQ.rpg.equip(b, id); });
    window._A = a; window._B = b;
    document.getElementById('screen').className = 'screen hidden';
    EQ.game.startProfile(a);
  });
  await page.waitForTimeout(1500);
  await clean();

  // 1. tên trên đầu NPC
  await page.waitForTimeout(400); await shot('labels');
  ok(await page.evaluate(() => EQ.world.label(EQ.world.def.entities.find(e => e.id === 'jeweler')).startsWith('💎')), 'Nhãn cửa hàng có biểu tượng 💎');

  // 2. hiệu quả trang bị
  const eff = await page.evaluate(() => [EQ.rpg.effects(_A), EQ.rpg.effects(_B)]);
  ok(eff[1].atk > eff[0].atk && eff[1].def > eff[0].def && eff[1].crit > 0, 'Trang bị tăng sức mạnh / phòng thủ / chí mạng (' + eff[0].atk + '→' + eff[1].atk + ')');
  ok(await page.evaluate(() => EQ.rpg.hitsToKill(_B, 10) < EQ.rpg.hitsToKill(_A, 10)), 'Trang bị tốt → cần ít câu đúng hơn để hạ quái');

  // 3. trận đấu với quái tinh anh hiện trang bị
  await page.evaluate(() => { EQ.game.startProfile(_B); });
  await page.waitForTimeout(800); await clean();
  page.evaluate(() => { const d = Object.assign({}, EQ.MONSTERS.slime, { name: '⭐ Slime tinh anh', hp: 10, matk: 2, elite: true, size: 1.8 }); EQ.battle.start({ def: d, color: '#e53935', hp: 10, name: d.name, matk: 2, spec: {} }); });
  await page.waitForTimeout(800);
  const gearLine = await page.evaluate(() => (document.querySelector('.bt-gear') || {}).textContent || '');
  ok(/Trượng rồng vàng/.test(gearLine) && /câu đúng/.test(gearLine), 'Trận đấu hiện vũ khí & số câu cần: ' + gearLine.slice(0, 80));
  for (let i = 0; i < 6; i++) {
    const has = await page.evaluate(() => !!EQ.challenge.current);
    if (has) { await page.evaluate(() => EQ.challenge._testAnswer(true)); await page.waitForTimeout(100); await page.evaluate(() => { const b = document.querySelector('.q-feedback .btn'); if (b) b.click(); }); await page.waitForTimeout(1500); }
    if (i === 0) await shot('battle');
    const won = await page.evaluate(() => !!document.querySelector('.bt-result.win'));
    if (won) break;
  }
  ok(await page.evaluate(() => !!document.querySelector('.bt-result.win')), 'Hạ quái tinh anh 10 máu bằng trang bị mạnh');
  await clean();

  // 4. quái tinh anh trên bản đồ
  const elites = await page.evaluate(() => { EQ.world.monsters = []; for (let i = 0; i < 40; i++) EQ.world.spawnOne(EQ.game.profile); return EQ.world.monsters.filter(m => m.elite).length; });
  ok(elites > 0, 'Bản đồ có quái tinh anh ⭐ (' + elites + '/40)');

  // 5. 4 game hành động
  for (const id of ['runner', 'slayer', 'whack', 'snake']) {
    await page.evaluate(id => { const pool = EQ.learn.learnedIds(EQ.game.profile).map(i => EQ.V[i]); EQ.arcade.play(id, pool); }, id);
    await page.waitForTimeout(1500);
    await shot('arcade-' + id);
    const st = await page.evaluate(() => { const g = EQ.arcade._cur.game; const s = g._st || {}; return { lives: s.lives, max: s.max, w: !!s.w }; });
    ok(st.max === eff[1].hp && st.w, id + ': chạy được, số mạng = ❤️ trang bị (' + st.max + ')');
    // trò diệt quái: phi tiêu trúng quái đúng
    if (id === 'slayer') {
      const r = await page.evaluate(async () => {
        const g = EQ.arcade._cur.game, s = g._st;
        for (let k = 0; k < 30 && s.wave <= 2; k++) {
          const m = s.mons.find(x => !x.dead && s.w && x.w.id === s.w.id);
          if (m) { s.cd = 0; s.inv = 5; g.onClick(m.x, m.y - 20); }
          await new Promise(r => setTimeout(r, 120));
        }
        return { wave: s.wave, correct: EQ.arcade._cur.api.S.correct };
      });
      ok(r.correct >= 1, 'Ninja diệt quái: phi tiêu hạ quái đúng (' + r.correct + ' câu)');
    }
    if (id === 'whack') {
      const r = await page.evaluate(async () => {
        const g = EQ.arcade._cur.game, s = g._st;
        for (let k = 0; k < 40; k++) { const m = s.moles.find(x => s.w && x.w.id === s.w.id && x.up > 0.5); if (m) g.onClick(m.h.x, m.h.y - 30); await new Promise(r => setTimeout(r, 100)); }
        return EQ.arcade._cur.api.S.correct;
      });
      ok(r >= 2, 'Đập chuột: đập đúng ' + r + ' con');
    }
    await page.evaluate(() => EQ.arcade._cur.end(true));
    await page.waitForTimeout(300); await clean();
  }

  // 6. Đấu trường 2 bé
  await page.evaluate(() => EQ.duel.setup()); await page.waitForTimeout(400); await shot('duel-setup'); await clean();
  page.evaluate(() => EQ.duel.play(_A, _B, 'pvp'));
  await page.waitForTimeout(600);
  let turns = 0;
  for (let i = 0; i < 80; i++) {
    const s = await page.evaluate(() => ({ q: !!EQ.challenge.current, end: !!document.querySelector('.duel .bt-result') }));
    if (s.end) break;
    if (s.q) { await page.evaluate(() => EQ.challenge._testAnswer(true)); turns++; if (turns === 2) await shot('duel'); }
    await page.waitForTimeout(400);
  }
  const res = await page.evaluate(() => ({ txt: (document.querySelector('.duel .bt-result') || {}).textContent || '', cur: EQ.game.profile && EQ.game.profile.name, b: _B.duel, a: _A.duel }));
  ok(/Bin thắng/.test(res.txt), 'Đấu trường: bé có trang bị mạnh thắng khi cả hai cùng trả lời đúng (' + turns + ' lượt)');
  ok(res.cur === 'Bin', 'Đấu xong trả lại đúng nhân vật đang chơi');
  await shot('duel-end');
  await clean();
  page.evaluate(() => EQ.duel.play(_A, _B, 'coop'));
  await page.waitForTimeout(600);
  for (let i = 0; i < 80; i++) {
    const s = await page.evaluate(() => ({ q: !!EQ.challenge.current, end: !!document.querySelector('.duel .bt-result') }));
    if (s.end) break;
    if (s.q) await page.evaluate(() => EQ.challenge._testAnswer(true));
    await page.waitForTimeout(400);
  }
  ok(await page.evaluate(() => /Cả đội/.test((document.querySelector('.duel .bt-result') || {}).textContent || '')), 'Cùng đánh trùm: cả đội thắng');
  await clean();
  await page.evaluate(() => EQ.duel.compare()); await page.waitForTimeout(300); await shot('compare');
  ok(await page.evaluate(() => document.querySelectorAll('.cmp-table td.best').length > 3), 'Bảng so sánh tô màu người dẫn đầu');
  await clean();

  // 7. Admin
  await page.evaluate(() => EQ.admin.login()); await page.waitForTimeout(200);
  await page.fill('input[type=password]', 'sai'); await page.keyboard.press('Enter');
  ok(await page.evaluate(() => !EQ.admin.logged), 'Admin: sai mật khẩu bị từ chối');
  await page.fill('input[type=password]', 'admin'); await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => EQ.admin.logged && !!document.querySelector('.admin canvas.adm-map')), 'Admin: đăng nhập, xem bản đồ đầy đủ');
  await shot('admin-map');
  await page.evaluate(() => { [...document.querySelectorAll('.admin .tab')].find(b => /Nhiệm vụ/.test(b.textContent)).click(); });
  await page.waitForTimeout(200); await shot('admin-quests');
  await page.evaluate(() => { document.querySelector('.admin .adm-q .btn').click(); });
  ok(await page.evaluate(() => EQ.Q.doneCount(EQ.game.profile) >= 1), 'Admin: đánh dấu hoàn thành nhiệm vụ');
  await page.evaluate(() => { [...document.querySelectorAll('.admin .tab')].find(b => /Bản đồ/.test(b.textContent)).click(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => { [...document.querySelectorAll('.admin .btn')].find(b => /Rừng|Lâu đài/.test(b.textContent)).click(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => { const c = document.querySelector('.admin canvas.adm-map'); const r = c.getBoundingClientRect(); c.dispatchEvent(new MouseEvent('click', { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true })); });
  await page.waitForTimeout(800);
  const reg = await page.evaluate(() => EQ.world.id);
  ok(reg !== 'village', 'Admin: dịch chuyển sang ' + reg);
  await shot('admin-teleport');

  ok(errors.length === 0, 'Không có lỗi JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fail ? '\n❌ Có ' + fail + ' lỗi' : '\n🎉 Bản 1.6: tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
