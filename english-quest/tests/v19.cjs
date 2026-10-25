/* Kiểm tra bản 1.9: đồ họa 3D kiểu Ghibli (Three.js) – dựng 4 vùng, bấm chuột để đi, bấm NPC để nói chuyện, đổi 2D/3D.
 * Chạy: node tests/v19.cjs (cần Playwright). Ảnh chụp ở tests/out/v19-*.png */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });
let fail = 0;
const ok = (c, m) => { console.log((c ? '✅ ' : '❌ ') + m); if (!c) fail++; };

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(400);
  const clean = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; });
  const shot = n => page.screenshot({ path: path.join(OUT, 'v19-' + n + '.png') });
  await page.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Bin', grade: 6, age: 11, avatar: { hair: 'pony', hairC: '#6d4c41', skin: '#f5d0a9', outfit: 'hero' } });
    p.placement.done = true; p.items.wand = 1;
    EQ.learn.learnWords(p, ['apple', 'red', 'green', 'yellow', 'cat', 'dog', 'black', 'white', 'one', 'two']);
    EQ.rpg.ensure(p); ['w3', 'h3', 'a3'].forEach(id => { EQ.rpg.give(p, id); EQ.rpg.equip(p, id); });
    document.getElementById('screen').className = 'screen hidden';
    EQ.world3d.forceTest = true;
    EQ.game.startProfile(p);
  });
  await page.waitForTimeout(2000);
  await clean();

  ok(await page.evaluate(() => !!window.THREE && EQ.world3d.ok), 'Three.js đã nhúng sẵn, chạy offline');
  const st = await page.evaluate(() => ({ active: EQ.world3d.active, cv: getComputedStyle(document.getElementById('game3d')).display !== 'none', old: getComputedStyle(document.getElementById('game')).visibility }));
  ok(st.active && st.cv && st.old === 'hidden', 'Chế độ 3D bật mặc định, ẩn khung vẽ 2D');
  for (const [reg, x, y] of [['village', 12, 7], ['forest', 20, 14], ['castle', 20, 14], ['wild', 20, 9]]) {
    const r = await page.evaluate(([reg, x, y]) => { const p = EQ.game.profile; p.region = reg; EQ.world.load(reg, x, y, p); return true; }, [reg, x, y]);
    await page.waitForTimeout(1800);
    const info = await page.evaluate(reg => ({ built: !!EQ.world3d.cache[reg], kids: EQ.world3d.cache[reg] ? EQ.world3d.cache[reg].children.length : 0 }), reg);
    await shot(reg);
    ok(r && info.built && info.kids > 8, reg + ': dựng cảnh 3D (' + info.kids + ' nhóm đối tượng)');
  }
  // bấm chuột lên mặt đất trong 3D → nhân vật đi tới
  await page.evaluate(() => { const p = EQ.game.profile; p.region = 'village'; EQ.world.load('village', 20, 16, p); EQ.world.monsters = []; });
  await page.waitForTimeout(1500);
  const box = await page.locator('#game3d').boundingBox();
  await page.mouse.click(box.x + box.width * 0.62, box.y + box.height * 0.62);
  const walk = await page.evaluate(() => ({ path: !!(EQ.world.path && EQ.world.path.length), mark: !!EQ.world.mark }));
  await page.waitForTimeout(2500);
  const moved = await page.evaluate(() => ({ x: Math.floor(EQ.world.player.x / 32), y: Math.floor((EQ.world.player.y - 4) / 32) }));
  ok(walk.path && (moved.x !== 20 || moved.y !== 16), '🖱️ Bấm mặt đất 3D → tự tìm đường đi tới (' + moved.x + ',' + moved.y + ')');
  // bấm vào NPC (Lily) trong 3D → đi tới và nói chuyện
  await page.evaluate(() => { const p = EQ.game.profile; EQ.world.load('village', 14, 9, p); EQ.world.monsters = []; });
  await page.waitForTimeout(1500);
  const lily = await page.evaluate(() => {
    const e = EQ.world.ents.find(x => x.id === 'lily') || EQ.world.ents.find(x => x.kind === 'npc' && x.look);
    return { id: e.id, x: e.x, y: e.y };
  });
  const scr = await page.evaluate(l => { const v = new THREE.Vector3(l.x + 0.5, 0.6, l.y + 0.6); const cam = EQ.world3d._cam(); v.project(cam); return { x: (v.x * 0.5 + 0.5), y: (-v.y * 0.5 + 0.5) }; }, lily);
  await page.mouse.click(box.x + box.width * scr.x, box.y + box.height * scr.y);
  let talked = false;
  for (let k = 0; k < 40 && !talked; k++) { await page.waitForTimeout(200); talked = await page.evaluate(() => !document.getElementById('dialog').classList.contains('hidden') || EQ.ui.stack.length > 0); }
  await shot('talk');
  ok(talked, '🖱️ Bấm vào NPC "' + lily.id + '" trong 3D → tự đi tới và mở hội thoại');
  await page.evaluate(() => { for (let i = 0; i < 20; i++) { const b = document.querySelector('#dialog .dlg-next'); if (b) b.click(); } });
  await page.waitForTimeout(400); await clean();
  await page.evaluate(() => { document.getElementById('dialog').classList.add('hidden'); EQ.game.lock = false; });
  // nút đổi 2D / 3D
  const tg = await page.evaluate(async () => {
    const b = document.querySelector('.hud-gfx'); b.click(); await new Promise(r => setTimeout(r, 700));
    const a = { active: EQ.world3d.active, vis: document.getElementById('game').style.visibility, label: b.textContent };
    b.click(); await new Promise(r => setTimeout(r, 700));
    return { a, back: EQ.world3d.active, label2: b.textContent };
  });
  ok(!tg.a.active && tg.a.vis === '' && /2D/.test(tg.a.label) && tg.back && /3D/.test(tg.label2), 'Nút 🎨 đổi qua lại 2D ↔ 3D ' + JSON.stringify(tg));
  ok(errors.length === 0, 'Không có lỗi JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fail ? '\n❌ Có ' + fail + ' lỗi' : '\n🎉 Bản 1.9 (3D): tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
