/* Kiểm tra bản 2.0: ngân hàng câu hỏi dùng chung (từ vựng + ngữ pháp + mẫu câu + gói giáo trình) và Candy Crush chữ.
 * Chạy: node tests/v20.cjs (cần Playwright). */
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
  page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(400);
  const clean = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; });
  const shot = n => page.screenshot({ path: path.join(OUT, 'v20-' + n + '.png') });
  await page.evaluate(() => {
    // gói giáo trình mẫu (kiểm tra cơ chế thêm giáo trình)
    EQ.QPACKS.push({ id: 'test-u1', name: 'Gói thử Unit 1', book: 'gs6', unit: 1, items: [
      { type: 'fill', q: 'She ___ a teacher.', a: 'is', wrong: ['am', 'are'], ex: 'She đi với "is".', vi: 'Cô ấy là giáo viên.' },
      { type: 'fill', q: 'They ___ my friends.', a: 'are', wrong: ['is', 'am'], ex: 'They đi với "are".', vi: 'Họ là bạn mình.' },
      { type: 'fill', q: 'I ___ eleven years old.', a: 'am', wrong: ['is', 'are'], ex: 'I đi với "am".', vi: 'Mình 11 tuổi.' },
      { type: 'sent', s: 'What is your name?', vi: 'Bạn tên là gì?' },
      { type: 'sent', s: 'How old are you?', vi: 'Bạn bao nhiêu tuổi?' },
      { type: 'qa', q: 'How old are you?', a: 'I am eleven.', wrong: ['I have eleven.', 'I is eleven.'], ex: 'Hỏi tuổi trả lời "I am + số".' },
      { type: 'qa', q: 'Where do you live?', a: 'I live in Ha Noi.', wrong: ['I am live Ha Noi.', 'I lives in Ha Noi.'], ex: 'I live in + nơi ở.' }
    ] });
    const p = EQ.store.newProfile({ name: 'Bin', grade: 6, age: 11, avatar: { hair: 'pony', hairC: '#6d4c41', skin: '#f5d0a9', outfit: 'hero' } });
    p.placement.done = true; p.items.wand = 1;
    EQ.learn.learnWords(p, ['apple', 'red', 'green', 'yellow', 'cat', 'dog', 'black', 'white', 'one', 'two', 'three', 'egg']);
    ['greet', 'this', 'tobe', 'plural', 'hesh', 'have'].forEach(l => { p.lessons[l] = 1; });
    p.book = 'gs6';
    document.getElementById('screen').className = 'screen hidden';
    EQ.game.startProfile(p);
  });
  await page.waitForTimeout(1500); await clean();

  // 1. ngân hàng câu hỏi
  const qb = await page.evaluate(() => {
    const p = EQ.game.profile, S = EQ.arcade.sources(p);
    const g = S.find(s => s.id === 'qb_grammar'), sn = S.find(s => s.id === 'qb_sent'), pk = S.find(s => s.id === 'pack:test-u1'), mix = S.find(s => s.id === 'mix');
    const w = g.pool[0], q = w.qq;
    const d = EQ.arcade.poolOf(p, g);
    const sent = sn.pool[0].qq;
    return { ids: S.map(s => s.id), g: g.pool.length, sn: sn.pool.length, pk: pk && pk.pool.length, mixN: EQ.arcade.poolOf(p, mix).length,
      okFill: q.options.indexOf(q.answer) >= 0 && q.options.length >= 2 && /___/.test(q.prompt), okSent: sent.options.length === 3 && sent.options.indexOf(sent.answer) >= 0 && new Set(sent.options).size === 3, long: sn.pool[0].long, wrapped: w.en === q.answer && w.vi === q.prompt, sample: sent.options.join(' | ') };
  });
  ok(qb.g >= 30 && qb.sn >= 10 && qb.pk === 7 && qb.mixN >= 20, 'Ngân hàng câu hỏi: ' + qb.g + ' câu ngữ pháp, ' + qb.sn + ' mẫu câu, gói giáo trình ' + qb.pk + ' câu, tổng hợp ' + qb.mixN);
  ok(qb.okFill && qb.okSent && qb.long && qb.wrapped, 'Câu điền chỗ trống và câu chọn mẫu đúng có đáp án nhiễu hợp lý: ' + qb.sample);

  // 2. Candy Crush với 4 nguồn câu hỏi khác nhau
  const bot = async (src, n) => page.evaluate(async ([src, n]) => {
    const p = EQ.game.profile, s0 = EQ.arcade.sources(p).find(x => x.id === src);
    EQ.arcade.play('candy', EQ.arcade.poolOf(p, s0));
    await new Promise(r => setTimeout(r, 800));
    const g = EQ.arcade._cur.game, s = g._st, kinds = new Set();
    for (let k = 0; k < 200 && s.correct < n && !s.done; k++) {
      if (s.phase === 'idle' && !s.nextAt) { kinds.add(s.q.kind); const ms = g._moves().filter(m => m.ev.colors.has(s.ansCol)); if (ms.length) g._swap(ms[0].a, ms[0].b); }
      await new Promise(r => setTimeout(r, 100));
    }
    return { correct: s.correct, kinds: Array.from(kinds), total: EQ.arcade._cur.api.S.total };
  }, [src, n]);
  await page.evaluate(() => 0);
  for (const [src, label] of [['learned', 'từ vựng'], ['qb_grammar', 'ngữ pháp'], ['qb_sent', 'mẫu câu'], ['pack:test-u1', 'gói giáo trình'], ['mix', 'tổng hợp']]) {
    const r = await bot(src, 3);
    if (src === 'qb_sent') await shot('candy-sent');
    ok(r.correct >= 3, 'Candy Crush với nguồn "' + label + '": ghép đúng màu → đúng ' + r.correct + ' câu (' + r.kinds.join(',') + ')');
    await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(150); await clean();
  }

  // 3. Luật chơi: ghép sai màu mất tim, nước đi không hợp lệ bị trả về, kẹo sọc, kẹo cầu vồng
  await page.evaluate(() => { const p = EQ.game.profile; EQ.arcade.play('candy', EQ.arcade.poolOf(p, EQ.arcade.sources(p).find(x => x.id === 'learned'))); });
  await page.waitForTimeout(800);
  const rules = await page.evaluate(async () => {
    const g = EQ.arcade._cur.game, s = g._st, sleep = ms => new Promise(r => setTimeout(r, ms));
    const waitIdle = async () => { for (let k = 0; k < 80 && (s.phase !== 'idle' || s.nextAt); k++) await sleep(100); };
    const out = {};
    // a) nước đi không tạo hàng → trả về, không tốn lượt
    const moves = g._moves(); let bad = null;
    for (let x = 0; x < 7 && !bad; x++) for (let y = 0; y < 6 && !bad; y++) if (!moves.some(m => m.a[0] === x && m.a[1] === y && m.b[0] === x + 1 && m.b[1] === y)) bad = [[x, y], [x + 1, y]];
    const m0 = s.moves, c00 = s.grid[bad[0][0]][bad[0][1]].c;
    g._swap(bad[0], bad[1]); await sleep(900);
    out.invalidKept = s.moves === m0 && s.grid[bad[0][0]][bad[0][1]].c === c00 && s.phase === 'idle';
    // b) ghép đúng màu 1 đối thủ SAI → mất tim, hiện đáp án
    await waitIdle();
    const wrongCol = s.optCol.find(c => c !== s.ansCol);
    let mv = g._moves().find(m => m.ev.colors.has(wrongCol) && !m.ev.colors.has(s.ansCol));
    if (!mv) { // gieo mẫu cho màu sai
      for (let x = 0; x < 8; x++) for (let y = 0; y < 7; y++) s.grid[x][y].c = (x + 2 * y) % 6;
      const cs = [[0, 5], [1, 5], [3, 5], [2, 6]]; cs.forEach(q => { s.grid[q[0]][q[1]].c = wrongCol; }); s.grid[2][5].c = (wrongCol + 1) % 6;
      mv = g._moves().find(m => m.ev.colors.has(wrongCol) && !m.ev.colors.has(s.ansCol));
    }
    const lives0 = s.lives; s.inv = 0;
    if (mv) g._swap(mv.a, mv.b);
    await sleep(500);
    out.wrongHandled = s.ok === false && (s.lives < lives0 || EQ.arcade._cur.api.S.total >= 1);
    await waitIdle(); await sleep(3000); await waitIdle();
    // c) 4 kẹo thẳng hàng → kẹo sọc; 5 → kẹo cầu vồng
    const build = (n, special) => {
      for (let x = 0; x < 8; x++) for (let y = 0; y < 7; y++) { const k = s.grid[x][y]; k.c = (x + 2 * y) % 6; k.sp = null; }
      const C = 0; // màu 0
      for (let i = 0; i < n + 1; i++) s.grid[i][3].c = i === 2 ? 5 : C;
      s.grid[2][3].c = 5; s.grid[2][4].c = C; s.grid[2][2].c = 3;
      if (n === 5) { s.grid[3][3].c = C; s.grid[4][3].c = C; }
      return C;
    };
    s.nextAt = 0; await waitIdle();
    build(3);
    // hàng 3: (0,3)=0,(1,3)=0,(2,3)=5,(3,3)=0 và (2,4)=0 → đổi (2,3)↔(2,4) cho 4 kẹo
    s.grid[3][3].c = 0; s.grid[4][3].c = 4; s.grid[5][3].c = 2;
    const mv4 = g._moves().find(m => (m.a[0] === 2 && m.a[1] === 3 && m.b[0] === 2 && m.b[1] === 4));
    s.nextAt = 0;
    if (mv4) { g._swap(mv4.a, mv4.b); await sleep(300); }
    let sp4 = null; for (let k = 0; k < 40 && !sp4; k++) { await sleep(100); s.grid.forEach(col => col.forEach(c => { if (c.sp === 'v' || c.sp === 'h') sp4 = c.sp; })); }
    out.striped = !!mv4 && sp4;
    await waitIdle(); await sleep(2500); await waitIdle();
    // d) kẹo cầu vồng: đổi chỗ → nổ hết 1 màu
    s.nextAt = 0; build(3);
    s.grid[3][3].sp = 'b'; s.grid[3][3].c = -1;
    s.grid[2][3].c = 5; s.grid[4][3].c = 5;
    let cnt = 0; s.grid.forEach(col => col.forEach(c => { if (c.c === 5) cnt++; }));
    const m5 = s.moves; g._swap([3, 3], [4, 3]);
    let popped = 0;
    for (let k = 0; k < 30; k++) { await sleep(30); let n = 0; s.grid.forEach(col => col.forEach(c => { if (c.dying > 0) n++; })); popped = Math.max(popped, n); }
    out.bomb = popped >= cnt && cnt >= 3; out.bombInfo = popped + '/' + cnt;
    return out;
  });
  await shot('candy-rules');
  ok(rules.invalidKept, 'Nước đi không tạo hàng 3 → kẹo trượt về chỗ cũ, không tốn lượt');
  ok(rules.wrongHandled, 'Ghép kẹo màu của đáp án SAI → tính sai (trừ tim / hiện giải thích)');
  ok(rules.striped === 'v', 'Ghép 4 kẹo thẳng hàng → sinh kẹo sọc (' + rules.striped + ')');
  ok(rules.bomb, 'Kẹo cầu vồng đổi chỗ với một màu → nổ cả màu đó (' + rules.bombInfo + ')');
  await page.evaluate(() => EQ.arcade._cur.end(true)); await page.waitForTimeout(200); await clean();

  // 4. Các trò khác dùng được câu hỏi ngữ pháp
  const others = await page.evaluate(async () => {
    const p = EQ.game.profile, res = {};
    const s = EQ.arcade.sources(p).find(x => x.id === 'qb_grammar');
    for (const id of ['balloon', 'race', 'obby', 'whack', 'slayer', 'runner', 'td', 'plane', 'hill', 'pirate', 'robot', 'farm']) {
      try {
        EQ.arcade.play(id, EQ.arcade.poolOf(p, s));
        await new Promise(r => setTimeout(r, 900));
        const cur = EQ.arcade._cur; const w = cur.game._st && cur.game._st.w;
        res[id] = cur.game ? (w ? (w.qq ? 'qq' : 'word') : 'ok') : 'none';
        cur.end(true); await new Promise(r => setTimeout(r, 120));
        document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = [];
      } catch (e) { res[id] = 'LỖI ' + e.message; }
    }
    return res;
  });
  const badG = Object.keys(others).filter(k => /LỖI|none/.test(others[k]));
  ok(badG.length === 0, 'Các trò khác chạy được với câu hỏi ngữ pháp: ' + JSON.stringify(others));

  // 5. Menu: trò đánh vần bị khóa khi chọn nguồn ngữ pháp, Candy Crush dùng được mẫu câu
  const menu = await page.evaluate(async () => {
    EQ.arcade.open(); await new Promise(r => setTimeout(r, 300));
    const sel = document.querySelector('.arcade-menu select'); sel.value = 'qb_sent'; sel.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 300));
    const cards = [...document.querySelectorAll('.am-card')];
    return { total: cards.length, enabled: cards.filter(c => !c.disabled).map(c => c.querySelector('.am-name').textContent) };
  });
  await shot('menu-sent');
  ok(menu.enabled.length === 1 && /Candy/.test(menu.enabled[0]), 'Nguồn "Mẫu câu": chỉ Candy Crush chữ chơi được (' + menu.enabled.join(', ') + ')');
  await clean();

  ok(errors.length === 0, 'Không có lỗi JS' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await browser.close();
  console.log(fail ? '\n❌ Có ' + fail + ' lỗi' : '\n🎉 Bản 2.0: tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
