/* Kiểm tra cơ chế chống đoán mò (bản 1.1): node tests/anti-guess.cjs */
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  const fail = m => errors.push(m);
  page.on('pageerror', e => fail('pageerror: ' + e.message));
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const p = EQ.store.newProfile({ name: 'Test', grade: 6 });
    p.placement.done = true; p.diff = 2.3;
    document.getElementById('screen').className = 'screen hidden';
    EQ.game.startProfile(p);
  });
  await page.waitForTimeout(500);
  const clean = () => page.evaluate(() => { document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = []; EQ.challenge.current = null; });

  console.log("bước 1"); // 1. Cổng chế độ mastery: trả lời sai → không qua, câu mới được thêm vào
  const r1 = await page.evaluate(async () => {
    const p = EQ.game.profile; p.lessons.tobe = 1;
    const qs = EQ.learn.gateQuestions(p, ['tobe'], 3);
    const run = EQ.challenge.run(qs, { title: 'test', mastery: true });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let answered = 0, wrongDone = false;
    while (EQ.challenge.current && answered < 20) {
      const q = EQ.challenge.current;
      if (!wrongDone) { EQ.challenge._testAnswer(false); wrongDone = true; } else EQ.challenge._testAnswer(true);
      await wait(30);
      // lựa chọn sai không được để lại chỉ còn 1 đáp án (không loại trừ dần ở chế độ mastery)
      const b = document.querySelector('.q-feedback .btn'); if (b) b.click();
      await wait(30); answered++; void q;
    }
    const res = await run;
    return { res, answered };
  });
  if (!(r1.res.completed && r1.res.total === 4 && r1.res.correct === 3)) fail('Mastery: sai 1 câu phải có thêm câu hỏi (tổng 4, đúng 3): ' + JSON.stringify(r1));
  await clean();

  console.log("bước 2"); // 2. Trắc nghiệm ở chế độ thử lại: chọn sai → đáp án sai KHÔNG bị loại vĩnh viễn, các lựa chọn được xáo lại
  const r2 = await page.evaluate(async () => {
    const p = EQ.game.profile; EQ.learn.learnWords(p, ['cat', 'dog', 'apple', 'egg', 'red', 'blue', 'key', 'box']);
    const q = EQ.learn.wordQ(p, EQ.V.cat, 'pic');
    EQ.challenge.run([q], { retry: true });
    await new Promise(r => setTimeout(r, 50));
    EQ.challenge._testAnswer(false);
    await new Promise(r => setTimeout(r, 1500));
    const enabled = Array.from(document.querySelectorAll('.q-opts .opt')).filter(b => !b.disabled).length;
    return { enabled, total: q.opts.length };
  });
  if (r2.enabled !== r2.total) fail('Sau khi chọn sai, mọi lựa chọn phải được bật lại và xáo: ' + JSON.stringify(r2));
  await clean();

  console.log("bước 3"); // 3. Gõ từ: sai thì không qua, đúng (không phân biệt hoa thường) thì qua
  const r3 = await page.evaluate(async () => {
    const p = EQ.game.profile;
    const q = EQ.learn.wordQ(p, EQ.V.apple, 'type');
    const box = document.createElement('div'); document.body.appendChild(box);
    const pr = EQ.challenge.render(box, q, { retry: true, noRecord: true });
    const inp = box.querySelector('.type-inp');
    inp.value = 'aple'; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const wrongShown = box.querySelector('.q-feedback.bad') != null;
    inp.value = '  APPLE '; inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    const r = await pr; box.remove();
    return { kind: q.kind, pattern: q.pattern, wrongShown, r };
  });
  if (!(r3.kind === 'type' && r3.wrongShown && r3.r.tries === 1 && r3.pattern === 'a _ _ _ _')) fail('Gõ từ: ' + JSON.stringify(r3));

  console.log("bước 4"); // 4. Câu đố: chỉ tiếng Anh, có đủ lựa chọn hình
  const r4 = await page.evaluate(() => {
    const p = EQ.game.profile; const q = EQ.learn.wordQ(p, EQ.V.dog, 'riddle');
    return { mode: q.mode, prompt: q.prompt, n: q.opts.length, ok: q.opts.filter(o => o.ok).length };
  });
  if (!(r4.mode === 'riddle' && r4.n >= 3 && r4.ok === 1)) fail('Câu đố: ' + JSON.stringify(r4));

  console.log("bước 5"); // 5. Trùm bị khóa khi chưa thuộc đủ từ, mở khi đã thuộc
  const r5 = await page.evaluate(async () => {
    const p = EQ.game.profile;
    ['v_hello', 'v_apples', 'v_cat', 'v_gate', 'v_market'].forEach(id => { p.quests[id] = { stage: 9, done: true, got: {} }; });
    EQ.learn.learnWords(p, EQ.VOCAB.filter(w => w.r === 'village').map(w => w.id));
    const m0 = EQ.learn.regionMastery(p, 'village');
    p.quests.v_boss = { stage: 0, got: {} };
    const boss = EQ.world.def.entities.find(e => e.id === 'slimeKing');
    const pr = EQ.game.runStage(EQ.QI.v_boss, EQ.QI.v_boss.stages[0], boss, { name: 'x', e: '🟢' });
    const wait = ms => new Promise(r => setTimeout(r, ms));
    let sawBattle = false;
    for (let k = 0; k < 40; k++) {
      await wait(40);
      if (document.querySelector('.battle')) { sawBattle = true; break; }
      const nx = document.querySelector('#dialog .dlg-next'); if (nx) nx.click();
      const no = Array.from(document.querySelectorAll('#modals .btn')).find(b => b.textContent === 'Để sau'); if (no) no.click();
    }
    await pr;
    const blocked = !sawBattle && !p.flags['boss:slimeKing'];
    // thuộc đủ từ → được vào trận
    EQ.learn.learnedIds(p).filter(id => EQ.V[id].r === 'village').forEach(id => { p.vocab[id].box = 2; });
    const pr2 = EQ.game.runStage(EQ.QI.v_boss, EQ.QI.v_boss.stages[0], boss, { name: 'x', e: '🟢' });
    let battle2 = false;
    for (let k = 0; k < 40; k++) { await wait(40); const nx = document.querySelector('#dialog .dlg-next'); if (nx) nx.click(); if (document.querySelector('.battle')) { battle2 = true; break; } }
    if (battle2) Array.from(document.querySelectorAll('.battle .btn')).find(b => b.textContent.includes('Rời trận')).click();
    let done2 = false; pr2.then(() => { done2 = true; });
    for (let k = 0; k < 50 && !done2; k++) { await wait(40); const nx = document.querySelector('#dialog .dlg-next'); if (nx) nx.click(); }
    return { m0, blocked, battle2 };
  });
  if (!(r5.blocked && r5.battle2)) fail('Khóa trùm theo độ thuộc từ: ' + JSON.stringify(r5));
  await clean();

  console.log("bước 6"); // 6. Trận đấu (trùm cốt truyện = safe): hết máu, đấu lại thì trùm hồi đầy máu (không thắng được bằng cách đoán mãi)
  const r6 = await page.evaluate(async () => {
    const d = EQ.BOSSES.slimeKing; const wait = ms => new Promise(r => setTimeout(r, ms));
    const pr = EQ.battle.start({ def: d, hp: d.hp, name: d.name, boss: true, safe: true, bite: 30, spec: { regions: d.regions, lessons: d.lessons, types: ['meaning'] } });
    await wait(100);
    // đúng 1 câu rồi sai đến hết tim
    EQ.challenge._testAnswer(true); await wait(1900);
    for (let k = 0; k < 10 && !document.querySelector('.bt-result'); k++) {
      EQ.challenge._testAnswer(false); await wait(30);
      const b = document.querySelector('.battle .q-feedback .btn'); if (b) b.click();
      await wait(1100);
    }
    const hpBefore = EQ.battle._st.hp;
    Array.from(document.querySelectorAll('.bt-result .btn')).find(b => b.textContent.includes('Đấu lại')).click();
    await wait(50);
    const hpAfter = EQ.battle._st.hp;
    Array.from(document.querySelectorAll('.battle .btn')).find(b => b.textContent.includes('Rời trận')).click();
    await pr;
    return { hpBefore, hpAfter, max: d.hp };
  });
  if (!(r6.hpBefore < r6.max && r6.hpAfter === r6.max)) fail('Đấu lại phải hồi đầy máu trùm: ' + JSON.stringify(r6));

  console.log("bước 7"); // 7. Thử thách hôm nay: làm được 1 lần mỗi ngày
  const r7 = await page.evaluate(async () => {
    const p = EQ.game.profile; const wait = ms => new Promise(r => setTimeout(r, ms));
    const before = EQ.game.dailyAvailable(p);
    const pr = EQ.game.dailyChallenge();
    for (let k = 0; k < 40 && EQ.ui.stack.length; k++) {
      await wait(40);
      if (EQ.challenge.current) { EQ.challenge._testAnswer(true); await wait(30); const b = document.querySelector('.q-feedback .btn'); if (b) b.click(); }
    }
    await pr;
    return { before, after: EQ.game.dailyAvailable(p), count: p.dailyCount };
  });
  if (!(r7.before && !r7.after && r7.count === 1)) fail('Thử thách hôm nay: ' + JSON.stringify(r7));

  console.log("bước 8"); // 8. Nhớ lâu: đúng liên tục trong 1 buổi không lên mức; nhận biết không vượt hộp 3
  const r8 = await page.evaluate(() => {
    const L = EQ.learn, p = EQ.game.profile;
    L.learnWords(p, ['bird']);
    const rec = (mode) => L.record(p, { correct: true, wordId: 'bird', topic: 'animal', mode });
    rec('pic'); const a = p.vocab.bird.box;          // 0 → 1
    rec('pic'); rec('pic'); const b = p.vocab.bird.box; // vẫn 1 (chưa đến hạn)
    L.timeOffset += 11 * 60000; rec('pic'); const c = p.vocab.bird.box; // → 2
    L.timeOffset += 25 * 3600000; rec('pic'); const d = p.vocab.bird.box; // → 3
    L.timeOffset += 4 * 86400000; rec('pic'); const e = p.vocab.bird.box; // nhận biết: vẫn 3
    rec('type'); const f = p.vocab.bird.box; // tự nhớ ra từ (đã đến hạn) → 4
    L.record(p, { correct: false, wordId: 'bird', topic: 'animal', mode: 'pic' }); const g = p.vocab.bird.box; // sai → về 1
    L.timeOffset = 0;
    return [a, b, c, d, e, f, g];
  });
  if (r8.join() !== '1,1,2,3,3,4,1') fail('Thuật toán nhớ lâu: ' + r8.join());

  console.log("bước 9"); // 9. Học theo sách + từ phụ huynh nhập
  const r9 = await page.evaluate(async () => {
    const p = EQ.game.profile; const wait = ms => new Promise(r => setTimeout(r, ms));
    const add = EQ.learn.addCustomWords(p, 'compass = com-pa\npencil case = hộp bút | I have a pencil case. | Mình có hộp bút.\nhard-working = chăm chỉ\nsai dinh dang');
    const u = EQ.CURRICULUM.gs6[0];
    EQ.screens.book();
    await wait(100);
    const cards = document.querySelectorAll('.ucard').length;
    document.querySelectorAll('#modals .modal-back').forEach(b => b.remove()); EQ.ui.stack = [];
    const pr = EQ.screens.learnWords(u.words.slice(0, 4), 'Unit 1');
    for (let k = 0; k < 80; k++) {
      await wait(40);
      const top = document.querySelector('#modals .modal-back:last-child');
      if (!top) { if (k > 5) break; continue; }
      if (EQ.challenge.current) { EQ.challenge._testAnswer(true); await wait(30); const b = top.querySelector('.q-feedback .btn'); if (b) b.click(); continue; }
      const b = top.querySelector('.btn.primary.big') || top.querySelector('.btn.primary'); if (b) b.click();
    }
    await pr;
    return { add, cards, learned: u.words.slice(0, 4).filter(id => p.vocab[id]).length, custom: p.customWords.map(w => w.id), hw: (p.customWords.find(w => w.en === 'hard-working') || {}).id };
  });
  if (!(r9.add.added === 3 && r9.add.bad === 1 && r9.cards === 13 && r9.learned === 4 && r9.hw === 'hard_working')) fail('Học theo sách: ' + JSON.stringify(r9));
  await clean();

  console.log("bước 10"); // 10. So khớp câu nói (luyện nói)
  const r10 = await page.evaluate(() => [
    EQ.speech.match('My name is Lily.', ['my name is lily']).score,
    EQ.speech.match('I am twelve.', ['i am 12', "i'm twelve"]).score,
    EQ.speech.match('She is a student.', ['he is a doctor']).score,
    EQ.speech.match("I don't like fish.", ['I do not like fish']).score
  ]);
  if (!(r10[0] === 1 && r10[1] === 1 && r10[2] < 0.7 && r10[3] === 1)) fail('So khớp câu nói: ' + r10.join());

  await browser.close();
  console.log(JSON.stringify({ r1, r2, r3, r4, r5, r6, r7, r8, r9, r10 }));
  if (errors.length) { console.log('❌\n' + errors.join('\n')); process.exit(1); }
  console.log('✅ Cơ chế chống đoán mò hoạt động đúng');
})().catch(e => { console.error(e); process.exit(1); });
