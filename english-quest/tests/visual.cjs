/* Chụp ảnh các giao diện chính để soát bố cục: node tests/visual.cjs */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Ngọc Anh', grade: 6, age: 11, avatar: { hair: 'pony', hairC: '#6d4c41', skin: '#f5d0a9', outfit: 'pink' } });
    p.placement.done = true; p.outfits.push('pink');
    EQ.screens.title(); document.getElementById('screen').className = 'screen hidden';
    EQ.game.startProfile(p);
  });
  await page.waitForTimeout(3000);
  const shot = async (n) => { await page.waitForTimeout(450); await page.screenshot({ path: path.join(OUT, 'v-' + n + '.png') }); };
  const closeAll = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; EQ.challenge.current = null; });

  // bài học ngữ pháp
  page.evaluate(() => { EQ.challenge.teach(EQ.game.profile, { lesson: 'tobe' }); });
  await shot('lesson');
  await closeAll();
  // thẻ từ mới
  page.evaluate(() => { EQ.challenge.teach(EQ.game.profile, { words: ['apple', 'red', 'three', 'cat'] }); });
  await shot('words');
  await closeAll();
  await page.evaluate(() => EQ.learn.learnWords(EQ.game.profile, ['apple', 'red', 'green', 'yellow', 'cat', 'dog', 'black', 'white', 'one', 'two', 'three', 'egg', 'key', 'box']));
  // các dạng câu hỏi
  const kinds = [
    ['pic', "EQ.learn.wordQ(p, EQ.V.apple, 'pic')"],
    ['meaning', "EQ.learn.wordQ(p, EQ.V.cat, 'meaning')"],
    ['color', "EQ.learn.wordQ(p, EQ.V.red, 'pic')"],
    ['grammar', "EQ.learn.gateQuestions(p, ['tobe'], 1)[0]"],
    ['order', "EQ.learn.orderFrom('She is my teacher.', 'Cô ấy là cô giáo của mình.', 'order', 'x')"],
    ['spell', "EQ.learn.wordQ(p, EQ.V.apple, 'spell')"],
    ['prep-in', "Object.assign(EQ.learn.prepQ(p), {})"],
    ['number', "EQ.learn.wordQ(p, EQ.V.three, 'pic')"]
  ];
  for (const [n, expr] of kinds) {
    await page.evaluate(e => { const p = EQ.game.profile; const q = eval(e); EQ.challenge.run([q], { title: 'Thử thách mẫu', icon: '✨' }); }, expr);
    await shot('q-' + n);
    if (n === 'grammar') { await page.evaluate(() => EQ.challenge._testAnswer(false)); await shot('q-grammar-wrong'); }
    await closeAll();
  }
  // giới từ: đủ 6 cảnh
  for (const sc of ['on', 'under', 'next_to', 'in', 'behind', 'in_front_of']) {
    await page.evaluate(id => { const p = EQ.game.profile; let q; do { q = EQ.learn.prepQ(p); } while (q.scene.id !== id || q.scene.obj !== 'cat'); EQ.challenge.run([q], { title: 'Đồ ở đâu?' }); }, sc);
    await shot('prep-' + sc);
    await closeAll();
  }
  // hội thoại có lựa chọn
  page.evaluate(() => { EQ.ui.dialog(EQ.QI.v_hello.stages[0].script.slice(1, 2), { name: 'Trưởng làng Tom', look: EQ.LOOK.chief }); });
  await shot('dialog-ask');
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('.dlg-choices .choice')); const i = EQ.ui._dlgChoices.findIndex(o => !o.ok); b[i].click(); });
  await shot('dialog-wrong');
  await page.evaluate(() => { EQ.ui.dlgOpen = false; document.getElementById('dialog').classList.add('hidden'); });
  // đi chợ
  page.evaluate(() => { EQ.screens.marketQuest(EQ.QI.v_market, EQ.QI.v_market.stages[0], {}); });
  await shot('market');
  await page.evaluate(() => { const m = EQ.screens._market; m.basket.egg = 2; m.basket.apple = 2; m.basket.water = 1; m.draw(); m.pay(); });
  await shot('market-wrong');
  await closeAll();
  // trận trùm
  page.evaluate(() => { const d = EQ.BOSSES.slimeKing; EQ.game.profile.lessons.tobe = 1; EQ.battle.start({ def: d, hp: d.hp, name: d.name, boss: true, spec: { regions: d.regions, lessons: d.lessons, types: d.types } }); });
  await page.waitForTimeout(600);
  await shot('boss');
  await page.evaluate(() => EQ.challenge._testAnswer(true));
  await page.waitForTimeout(900);
  await shot('boss-hit');
  await closeAll();
  // trùm khác
  for (const b of ['mushKing', 'golem']) {
    page.evaluate(k => { const d = EQ.BOSSES[k]; EQ.battle.start({ def: d, hp: d.hp, name: d.name, boss: true, spec: {} }); }, b);
    await shot('boss-' + b);
    await closeAll();
  }
  // tủ đồ, cài đặt
  page.evaluate(() => EQ.screens.inventory('wardrobe'));
  await shot('wardrobe');
  await closeAll();
  page.evaluate(() => EQ.screens.settings());
  await shot('settings');
  await closeAll();
  // vùng rừng và lâu đài
  for (const r of ['forest', 'castle']) {
    await page.evaluate(id => { const p = EQ.game.profile; p.region = id; EQ.world.load(id, null, null, p); }, r);
    await page.waitForTimeout(400);
    await page.evaluate(() => { EQ.world.player.x += 32 * 6; });
    await shot('region-' + r);
  }
  await browser.close();
  if (errors.length) { console.log('Lỗi:', errors); process.exit(1); }
  console.log('OK');
})();
