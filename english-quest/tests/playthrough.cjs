/* Kiểm thử tự động trên trình duyệt thật (Chromium + Playwright):
 *   node tests/playthrough.cjs
 * Bot sẽ: tạo nhân vật → bỏ qua/kiểm tra đầu vào → đi theo mũi tên nhiệm vụ → nói chuyện, nhặt đồ,
 * mở cổng, mở rương, đi chợ, đánh trùm… cho tới khi hoàn thành chương 1. Có cố tình trả lời sai vài lần
 * để kiểm tra cơ chế giải thích & thử lại. Kiểm tra lưu/tải lại tiến độ và lỗi JavaScript.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const OUT = process.env.OUT || path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const url = 'file://' + path.join(ROOT, 'index.html');
  await page.goto(url);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '01-title.png') });

  // tạo nhân vật
  await page.click('text=Bắt đầu / Chọn nhân vật');
  await page.click('.pcard.new');
  await page.fill('.create-form input', 'Mai');
  await page.click('text=Lớp 8');
  await page.click('text=Tóc hai bím');
  await page.screenshot({ path: path.join(OUT, '02-create.png') });
  await page.click('text=Bắt đầu phiêu lưu');
  await page.screenshot({ path: path.join(OUT, '03-story.png') });
  await page.click('text=Bỏ qua');
  // làm bài khởi động (trả lời đúng hết)
  await page.click('text=Làm thử');
  for (let i = 0; i < 12; i++) {
    const has = await page.evaluate(() => !!EQ.challenge.current);
    if (!has) break;
    if (i === 1) await page.screenshot({ path: path.join(OUT, '04-placement.png') });
    await page.evaluate(() => EQ.challenge._testAnswer(true));
    await page.waitForTimeout(150);
    await page.evaluate(() => { const b = document.querySelector('.q-feedback .btn'); if (b) b.click(); });
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(300);
  await page.click('text=Vào game');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '05-village.png') });

  // thử di chuyển bằng bàn phím
  const before = await page.evaluate(() => ({ x: EQ.world.player.x, y: EQ.world.player.y }));
  await page.keyboard.down('KeyD'); await page.waitForTimeout(500); await page.keyboard.up('KeyD');
  await page.keyboard.down('ArrowDown'); await page.waitForTimeout(300); await page.keyboard.up('ArrowDown');
  const after = await page.evaluate(() => ({ x: EQ.world.player.x, y: EQ.world.player.y }));
  if (!(after.x > before.x + 20)) errors.push('Di chuyển bằng phím D không hoạt động: ' + JSON.stringify([before, after]));

  // ===== bot tự chơi =====
  let wrongBudget = 6; // cố tình trả lời sai vài lần
  let shots = 0;
  async function driveUI(maxSteps) {
    for (let s = 0; s < (maxSteps || 400); s++) {
      const state = await page.evaluate(() => {
        const ui = EQ.ui;
        return {
          dlg: ui.dlgOpen, q: !!EQ.challenge.current, modals: ui.stack.length,
          choices: !!document.querySelector('.dlg-choices .choice:not(:disabled)'),
          build: !!document.querySelector('.dlg-build .q'),
          market: !!EQ.screens._market, lock: !!EQ.game.lock, fade: EQ.world.fadeDir
        };
      });
      if (state.market) {
        await page.evaluate(() => { const m = EQ.screens._market; Object.keys(m.list).forEach(k => { m.basket[k] = m.list[k]; }); m.draw(); m.pay(); });
        await page.waitForTimeout(2900);
        continue;
      }
      if (state.q) {
        const wrong = wrongBudget > 0 && Math.random() < 0.15;
        if (wrong) wrongBudget--;
        await page.evaluate(w => EQ.challenge._testAnswer(!w), wrong);
        await page.waitForTimeout(60);
        if (wrong) { await page.evaluate(() => EQ.challenge._testAnswer(true)); await page.waitForTimeout(60); }
        await page.evaluate(() => { const b = document.querySelector('.q-feedback .btn'); if (b) b.click(); });
        await page.waitForTimeout(60);
        continue;
      }
      if (state.dlg) {
        if (state.choices) {
          await page.evaluate(() => {
            const opts = EQ.ui._dlgChoices; const btns = Array.from(document.querySelectorAll('.dlg-choices .choice'));
            const i = opts.findIndex(o => o.ok); btns[i].click();
          });
        } else {
          await page.evaluate(() => { const b = document.querySelector('#dialog .dlg-next'); if (b) b.click(); });
        }
        await page.waitForTimeout(40);
        continue;
      }
      if (state.modals) {
        const clicked = await page.evaluate(() => {
          const top = document.querySelector('#modals .modal-back:last-child');
          if (!top) return false;
          const b = top.querySelector('.bt-result .btn.primary') || top.querySelector('.btn.primary.big') || top.querySelector('.btn.primary');
          if (b && !b.disabled) { b.click(); return true; }
          return false;
        });
        await page.waitForTimeout(clicked ? 120 : 200);
        continue;
      }
      if (state.lock || state.fade) { await page.waitForTimeout(120); continue; }
      return true;
    }
    return false;
  }

  async function step() {
    // tìm mục tiêu và dịch chuyển tới cạnh nó
    const info = await page.evaluate(() => {
      const p = EQ.game.profile, W = EQ.world;
      const t = EQ.game.questTarget(p);
      if (!t) return null;
      const res = { id: t.id, kind: t.kind, x: t.x, y: t.y, region: p.region };
      if (t.kind === 'portal') {
        W.player.x = (t.x + 0.5) * 32; W.player.y = (t.y + 0.75) * 32; W.portalCooldown = 0; W.lastTile = '';
        return res;
      }
      // ô trống kề bên
      const cand = [[0, 1], [-1, 0], [1, 0], [0, -1], [0, 0]];
      for (const [dx, dy] of cand) {
        const x = t.x + dx, y = t.y + dy;
        if (t.kind === 'pickup' ? (dx === 0 && dy === 0) : !W.solid(x, y)) {
          W.player.x = (x + 0.5) * 32; W.player.y = (y + 0.75) * 32;
          W.player.dir = dy > 0 ? 'up' : dy < 0 ? 'down' : dx > 0 ? 'left' : 'right';
          W.lastTile = x + ',' + y; W.battleCooldown = 3;
          break;
        }
      }
      W.target = W.findTarget();
      res.target = W.target && W.target.id;
      return res;
    });
    if (!info) return false;
    await page.waitForTimeout(80);
    if (info.kind !== 'portal') {
      const ok = await page.evaluate(() => { EQ.world.target = EQ.world.findTarget(); return !!EQ.world.target; });
      if (!ok) { errors.push('Không tương tác được với ' + info.id); return false; }
      await page.evaluate(() => { EQ.game.interact(); });
    } else {
      await page.waitForTimeout(700);
    }
    await page.waitForTimeout(80);
    if (shots < 14) { shots++; await page.screenshot({ path: path.join(OUT, 'q' + String(shots).padStart(2, '0') + '-' + info.id + '.png') }); }
    await driveUI();
    return info;
  }

  let guard = 0, last = '';
  const visited = [];
  while (guard++ < 260) {
    const done = await page.evaluate(() => EQ.Q.isDone(EQ.game.profile, 'c_boss'));
    if (done) break;
    const info = await step();
    if (!info) { errors.push('Bot bị kẹt: không có mục tiêu nhiệm vụ'); break; }
    const key = info.id + '@' + info.region;
    visited.push(key);
    if (key === last && visited.filter(v => v === key).length > 40) { errors.push('Bot lặp lại mãi ở ' + key); break; }
    last = key;
  }
  await driveUI();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '90-end.png') });

  const summary = await page.evaluate(() => {
    const p = EQ.game.profile;
    return {
      region: p.region, level: p.level, xp: p.xp, gold: p.gold, words: EQ.learn.learnedIds(p).length,
      done: EQ.QUESTS.filter(q => EQ.Q.isDone(p, q.id)).map(q => q.id), items: p.items, outfits: p.outfits,
      badges: Object.keys(p.badges), diff: p.diff, answers: p.stats.answers, correct: p.stats.correct, lessons: Object.keys(p.lessons)
    };
  });
  console.log('Kết quả:', JSON.stringify(summary, null, 1));

  // thử thách nâng cao của Nhà hiền triết (đã mở vì bé trả lời tốt) – dùng phím E thật
  await page.evaluate(() => {
    const W = EQ.world, e = W.def.entities.find(x => x.id === 'sage_c');
    W.player.x = (e.x + 0.5) * 32; W.player.y = (e.y + 1 + 0.75) * 32; W.player.dir = 'up'; W.battleCooldown = 5;
  });
  await page.waitForTimeout(200);
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(300);
  await driveUI();
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(300);
  await driveUI();
  const adv = await page.evaluate(() => EQ.Q.isDone(EQ.game.profile, 'adv_castle'));
  console.log('Thử thách nâng cao Lâu đài:', adv ? 'hoàn thành' : 'CHƯA');
  if (!adv) errors.push('Thử thách nâng cao không hoàn thành được bằng phím E');

  // mở các màn hình phụ
  for (const [key, name] of [['KeyN', 'notebook'], ['KeyI', 'inventory'], ['KeyQ', 'quests'], ['KeyM', 'map']]) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, '91-' + name + '.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }
  // ôn tập nhanh trong sổ từ
  await page.keyboard.press('KeyN'); await page.waitForTimeout(200);
  await page.click('text=Ôn tập nhanh');
  await driveUI();
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);

  // một trận đấu với quái vật (nếu có)
  const hasMon = await page.evaluate(() => {
    const W = EQ.world; if (!W.monsters.length) return false;
    const m = W.monsters[0]; setTimeout(() => EQ.game.startMonsterBattle(m), 0); return true;
  });
  if (hasMon) { await page.waitForTimeout(300); await page.screenshot({ path: path.join(OUT, '92-battle.png') }); await driveUI(); }

  // lưu, tải lại trang và kiểm tra tiến độ còn nguyên
  await page.evaluate(() => EQ.game.saveNow());
  await page.reload();
  await page.waitForTimeout(500);
  const reloaded = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('englishQuest.v1'));
    const p = d.profiles[0];
    return { name: p.name, level: p.level, done: Object.keys(p.quests).filter(k => p.quests[k].done).length, words: Object.keys(p.vocab).length };
  });
  console.log('Sau khi tải lại:', JSON.stringify(reloaded));
  if (reloaded.done < summary.done.length + 1) errors.push('Tiến độ không được lưu đúng');
  await page.click('text=Tiếp tục');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '93-continue.png') });

  // bảng phụ huynh
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('text=Lưu & về màn hình chính'); await page.waitForTimeout(300);
  await page.click('text=Phụ huynh');
  const ans = await page.evaluate(() => { const t = document.querySelector('.alert-body').textContent.match(/(\d+) × (\d+)/); return +t[1] * +t[2]; });
  await page.fill('.alert input', String(ans));
  await page.click('.alert .btn.primary');
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '94-parent.png') });

  // tạo hồ sơ thứ hai, bỏ qua kiểm tra đầu vào → hồ sơ độc lập
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('text=Bắt đầu / Chọn nhân vật');
  await page.click('.pcard.new');
  await page.fill('.create-form input', 'Linh');
  await page.click('text=Bắt đầu phiêu lưu');
  await page.click('text=Bỏ qua');
  await page.click('text=Bỏ qua – bắt đầu từ cơ bản');
  await page.waitForTimeout(400);
  const two = await page.evaluate(() => EQ.store.data.profiles.map(p => ({ name: p.name, done: Object.keys(p.quests).length, diff: p.diff })));
  console.log('Hai hồ sơ:', JSON.stringify(two));
  if (two.length !== 2 || two[1].done !== 0) errors.push('Hồ sơ thứ hai không độc lập');

  await browser.close();
  if (summary.done.indexOf('c_boss') < 0) errors.push('Chưa hoàn thành chương 1');
  if (errors.length) { console.log('\n❌ LỖI:\n' + errors.join('\n')); process.exit(1); }
  console.log('\n✅ Chơi thử tự động thành công. Ảnh chụp: ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
