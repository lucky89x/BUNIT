/* Hệ thống học: ôn tập ngắt quãng (Leitner), điều chỉnh độ khó, tạo câu hỏi, thống kê.
 *  Hộp 0–1: Cần ôn  |  Hộp 2–3: Đang nhớ  |  Hộp 4–5: Nhớ tốt
 *  Trả lời đúng → lên hộp, lâu hơn mới hỏi lại. Sai → về hộp 0, hỏi lại sớm.
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U;
  const MIN = 60000, DAY = 86400000;
  const INTERVAL = [0, 10 * MIN, DAY, 3 * DAY, 7 * DAY, 16 * DAY];
  const L = {};

  // timeOffset chỉ dùng cho kiểm thử tự động (giả lập thời gian trôi qua)
  L.timeOffset = 0;
  L.now = () => Date.now() + L.timeOffset;

  // ---------- Từ vựng ----------
  L.isLearned = (p, id) => !!p.vocab[id];
  L.learnedIds = p => Object.keys(p.vocab).filter(id => EQ.V[id]);

  L.learnWords = function (p, ids) {
    const added = [];
    const day = U.today();
    (ids || []).forEach(id => {
      if (!EQ.V[id] || p.vocab[id]) return;
      p.vocab[id] = { box: 0, due: L.now(), seen: 0, ok: 0, bad: 0, learnedAt: L.now(), last: 0 };
      added.push(id);
    });
    if (added.length) {
      p.daily[day] = p.daily[day] || { newWords: 0, answers: 0 };
      p.daily[day].newWords += added.length;
    }
    return added;
  };

  L.status = function (e) {
    if (!e) return 'none';
    if (e.box <= 1) return e.bad > 0 ? 'weak' : 'fresh';
    if (e.box <= 3) return 'learning';
    return 'strong';
  };
  L.STATUS_VI = { none: 'Chưa học', fresh: 'Mới học', weak: 'Cần ôn', learning: 'Đang nhớ', strong: 'Nhớ tốt' };

  L.dueIds = function (p) {
    const t = L.now();
    return L.learnedIds(p).filter(id => p.vocab[id].due <= t);
  };

  // chọn từ để ôn: ưu tiên từ đến hạn, từ yếu; có chút ngẫu nhiên
  L.pickWords = function (p, n, filter) {
    const t = L.now();
    let ids = L.learnedIds(p).filter(id => !filter || filter(EQ.V[id]));
    const score = id => {
      const e = p.vocab[id];
      const overdue = (t - e.due) / DAY;
      return (e.due <= t ? 10 : 0) + (5 - e.box) * 2 + Math.min(overdue, 5) + Math.random() * 3;
    };
    ids.sort((a, b) => score(b) - score(a));
    return ids.slice(0, n).map(id => EQ.V[id]);
  };

  // ---------- Độ khó thích ứng ----------
  L.nOpts = p => (p.diff < 1.6 ? 3 : 4);
  L.showVi = p => EQ.store.settings().alwaysVi || p.diff < 2.2;
  L.wordModes = function (p, hard) {
    if (hard) return ['en', 'listen', 'type', 'riddle', 'spell'];
    const m = ['pic', 'meaning'];
    if (p.diff >= 1.4) m.push('listen', 'en');
    if (p.diff >= 1.6) m.push('riddle');
    if (p.diff >= 1.9) m.push('type');
    if (p.diff >= 2.2) m.push('spell', 'type', 'riddle');
    return m;
  };

  L.record = function (p, info) {
    // info: {correct, hint, wordId, topic, key, text}
    const c = !!info.correct, h = !!info.hint;
    p.stats.answers++; if (c) p.stats.correct++; if (h) p.stats.hints++;
    const day = U.today();
    p.daily[day] = p.daily[day] || { newWords: 0, answers: 0 };
    p.daily[day].answers = (p.daily[day].answers || 0) + 1;
    p.daily[day].correct = (p.daily[day].correct || 0) + (c ? 1 : 0);
    const tp = info.topic || 'other';
    p.topics[tp] = p.topics[tp] || { ok: 0, bad: 0 };
    if (c) p.topics[tp].ok++; else p.topics[tp].bad++;
    if (info.wordId && p.vocab[info.wordId]) {
      const e = p.vocab[info.wordId];
      e.seen++; e.last = L.now();
      // NHỚ LÂU, KHÔNG NHỚ TẠM:
      // - chỉ lên hộp khi trả lời đúng lúc từ đã "đến hạn" (đã qua đủ thời gian quên bớt), học dồn trong 1 buổi không được tính
      // - nhận biết (chọn hình, chọn nghĩa) chỉ đưa lên tối đa hộp 3; muốn "Nhớ tốt" (hộp 4–5) phải tự nhớ ra từ (gõ, ghép chữ, chọn từ tiếng Anh)
      const recall = ['type', 'spell', 'en', 'order'].indexOf(info.mode) >= 0;
      const due = e.box === 0 || L.now() >= e.due - INTERVAL[e.box] * 0.2;
      if (c && !h) {
        e.ok++;
        if (due && (recall || e.box < 3)) { e.box = Math.min(5, e.box + 1); e.due = L.now() + INTERVAL[e.box]; e.lastUp = L.now(); }
      } else if (c && h) { e.ok++; }
      else { e.bad++; e.box = e.box >= 3 ? 1 : 0; e.due = L.now() + INTERVAL[e.box]; }
    }
    if (!c && info.key) {
      const m = p.mistakes[info.key] || { text: info.text || info.key, n: 0, topic: tp };
      m.n++; m.last = L.now(); m.text = info.text || m.text;
      p.mistakes[info.key] = m;
    }
    if (c && info.key && p.mistakes[info.key]) p.mistakes[info.key].fixed = (p.mistakes[info.key].fixed || 0) + 1;
    // chuỗi trả lời đúng
    if (c) { p.streak++; p.bestStreak = Math.max(p.bestStreak, p.streak); } else p.streak = 0;
    // độ khó
    p.hist.push({ c: c ? 1 : 0, h: h ? 1 : 0 });
    if (p.hist.length > 20) p.hist.shift();
    if (p.hist.length >= 6) {
      const recent = p.hist.slice(-12);
      const acc = recent.reduce((s, x) => s + (x.c ? (x.h ? 0.6 : 1) : 0), 0) / recent.length;
      if (acc >= 0.85) p.diff += 0.08;
      else if (acc < 0.55) p.diff -= 0.12;
      p.diff = U.clamp(p.diff, 1, 3);
    }
    if (EQ.game && EQ.game.checkBadges) EQ.game.checkBadges(p);
  };

  // ---------- Tạo câu hỏi ----------
  function distractors(p, w, n, field) {
    const ok = x => x.id !== w.id && x.en !== w.en && x.vi !== w.vi &&
      (field !== 'pic' || (x.pic && x.e !== w.e && (!!x.sw === !!w.sw)));
    const sameTopicLearned = EQ.VOCAB.filter(x => ok(x) && x.t === w.t && p.vocab[x.id]);
    const sameTopic = EQ.VOCAB.filter(x => ok(x) && x.t === w.t && !p.vocab[x.id]);
    const others = EQ.VOCAB.filter(x => ok(x) && x.t !== w.t && p.vocab[x.id]);
    const anyW = EQ.VOCAB.filter(x => ok(x) && x.t !== w.t);
    const res = [];
    [U.shuffle(sameTopicLearned), U.shuffle(sameTopic), U.shuffle(others), U.shuffle(anyW)].forEach(pool => {
      pool.forEach(x => { if (res.length < n && !res.some(r => r.e === x.e || r.en === x.en || r.vi === x.vi)) res.push(x); });
    });
    return res;
  }

  function picOf(w) { return w.sw ? { sw: w.sw } : { pic: w.e }; }

  L.wordQ = function (p, w, mode, opt) {
    opt = opt || {};
    const n = (opt.nOpts || L.nOpts(p)) - 1;
    if ((mode === 'pic' || mode === 'listen') && !w.pic) mode = 'meaning';
    if (mode === 'listen' && !EQ.speech.available()) mode = 'pic';
    if (mode === 'spell' && (w.en.length > 8 || /\s/.test(w.en))) mode = 'en';
    if (mode === 'riddle') {
      const rq = L.riddleQ(p, w, opt);
      if (rq) return rq;
      mode = w.pic ? 'pic' : 'en';
    }
    const base = { wordId: w.id, topic: w.t, key: 'w:' + w.id, text: w.en + ' = ' + w.vi };
    const ex = '"' + w.en + '" nghĩa là "' + w.vi + '".' + (w.ex ? ' Ví dụ: ' + w.ex + ' (' + w.exVi + ')' : '');
    if (mode === 'pic') {
      const ds = distractors(p, w, n, 'pic');
      return Object.assign(base, {
        kind: 'mcq', mode, prompt: w.en, promptVi: 'Chọn hình đúng với từ này', say: w.en, big: true,
        opts: U.shuffle([Object.assign({ ok: true }, picOf(w))].concat(ds.map(d => picOf(d)))),
        explain: ex, hint: 'Từ này thuộc chủ đề: ' + (EQ.TOPICS[w.t] || '') + '.', sayAfter: w.en
      });
    }
    if (mode === 'listen') {
      const ds = distractors(p, w, n, 'pic');
      return Object.assign(base, {
        kind: 'mcq', mode, prompt: '', promptVi: 'Nghe và chọn hình đúng', say: w.en, autoSay: true, listen: true,
        opts: U.shuffle([Object.assign({ ok: true }, picOf(w))].concat(ds.map(d => picOf(d)))),
        explain: 'Bạn vừa nghe từ "' + w.en + '" (' + w.vi + ').', hint: 'Từ đó bắt đầu bằng chữ "' + w.en.charAt(0) + '".', sayAfter: w.en
      });
    }
    if (mode === 'en') {
      const ds = distractors(p, w, n, 'en');
      return Object.assign(base, {
        kind: 'mcq', mode, prompt: '', promptVi: 'Chọn từ tiếng Anh có nghĩa: "' + w.vi + '"', bigVi: w.vi,
        pic: p.diff < 2 && w.pic ? w.e : null, sw: p.diff < 2 ? w.sw : null,
        opts: U.shuffle([{ t: w.en, ok: true, en: true }].concat(ds.map(d => ({ t: d.en, en: true })))),
        explain: ex, hint: 'Từ đúng bắt đầu bằng chữ "' + w.en.charAt(0) + '".', sayAfter: w.en
      });
    }
    if (mode === 'spell') {
      const letters = w.en.toLowerCase().split('');
      let sh = U.shuffle(letters);
      for (let i = 0; i < 5 && sh.join('') === letters.join(''); i++) sh = U.shuffle(letters);
      return Object.assign(base, {
        kind: 'spell', mode, word: w.en.toLowerCase(), tokens: sh, promptVi: 'Ghép chữ cái thành từ có nghĩa: "' + w.vi + '"',
        pic: w.pic ? w.e : null, sw: w.sw, say: w.en, explain: 'Từ đúng là "' + w.en + '" (' + w.vi + ').',
        hint: 'Chữ cái đầu tiên là "' + w.en.charAt(0) + '".', sayAfter: w.en
      });
    }
    if (mode === 'type') {
      const word = w.en.toLowerCase();
      return Object.assign(base, {
        kind: 'type', mode, word, pattern: word.split('').map((c, i) => (i === 0 || c === ' ') ? c : '_').join(' '),
        promptVi: 'Gõ từ tiếng Anh có nghĩa: "' + w.vi + '"', pic: w.pic ? w.e : null, sw: w.sw, say: w.en,
        explain: 'Từ đúng là "' + w.en + '" (' + w.vi + ').' + (w.ex ? ' Ví dụ: ' + w.ex : ''), hint: 'Mỗi lần bấm Gợi ý sẽ hiện thêm 1 chữ cái.', sayAfter: w.en
      });
    }
    // meaning
    const ds = distractors(p, w, n, 'vi');
    return Object.assign(base, {
      kind: 'mcq', mode: 'meaning', prompt: w.en, promptVi: 'Từ này nghĩa là gì?', say: w.en, big: true,
      pic: p.diff < 1.5 && w.pic ? w.e : null, sw: p.diff < 1.5 ? w.sw : null,
      opts: U.shuffle([{ t: w.vi, ok: true }].concat(ds.map(d => ({ t: d.vi })))),
      explain: ex, hint: w.ex ? 'Ví dụ: ' + w.ex : 'Từ này thuộc chủ đề: ' + (EQ.TOPICS[w.t] || ''), sayAfter: w.en
    });
  };

  // câu đố đọc hiểu: chỉ có tiếng Anh, phải hiểu mới chọn đúng
  L.riddleQ = function (p, w, opt) {
    opt = opt || {};
    const list = (EQ.RIDDLES || []).filter(r => r.a === w.id);
    if (!list.length || !w.pic) return null;
    const r = U.pick(list);
    const n = (opt.nOpts || L.nOpts(p)) - 1;
    const ds = r.d.map(id => EQ.V[id]).filter(x => x && x.pic && x.e !== w.e).slice(0, n);
    return {
      kind: 'mcq', mode: 'riddle', wordId: w.id, topic: w.t, key: 'r:' + w.id, text: r.en + ' → ' + w.en,
      prompt: r.en, promptVi: 'Đọc câu đố tiếng Anh rồi chọn hình đúng', say: r.en, riddleVi: r.vi,
      opts: U.shuffle([Object.assign({ ok: true }, picOf(w))].concat(ds.map(d => picOf(d)))),
      explain: '"' + r.en + '" nghĩa là: ' + r.vi + ' → Đáp án: ' + w.en + ' (' + w.vi + ').',
      hint: 'Nghĩa câu đố: ' + r.vi, sayAfter: w.en
    };
  };

  // tạo câu hỏi khác nhưng cùng kiến thức (dùng khi bé trả lời sai)
  L.variant = function (p, q) {
    let v = null;
    if (q.wordId && EQ.V[q.wordId]) {
      const alt = { pic: 'meaning', meaning: 'pic', listen: 'pic', en: 'pic', spell: 'en', type: 'en', riddle: 'pic' }[q.mode] || 'pic';
      v = L.wordQ(p, EQ.V[q.wordId], alt);
    } else if (q.mode === 'grammar' && q.lesson) v = L.grammarQ(p, [q.lesson], { avoid: [q.q] });
    else if (q.kind === 'order' && q.lesson) v = L.orderQ(p, [q.lesson], { avoid: [q.answer] });
    else if (q.mode === 'prep') { for (let i = 0; i < 10; i++) { v = L.prepQ(p); if (v.key !== q.key) break; } }
    if (!v) v = Object.assign({}, q, { opts: q.opts ? U.shuffle(q.opts.map(o => Object.assign({}, o))) : undefined, tokens: q.tokens ? U.shuffle(q.tokens) : undefined });
    v.base = q.base || q.key;
    return v;
  };

  // độ thuộc từ của một vùng: số từ đã học ở mức "Đang nhớ" trở lên
  L.regionMastery = function (p, region) {
    const ids = L.learnedIds(p).filter(id => EQ.V[id].r === region);
    const ok = ids.filter(id => p.vocab[id].box >= 2).length;
    return { ok, total: ids.length, ratio: ids.length ? ok / ids.length : 0, weak: ids.filter(id => p.vocab[id].box < 2) };
  };

  L.grammarQ = function (p, lessons, opt) {
    opt = opt || {};
    const maxLv = opt.hard ? 3 : (p.diff < 1.6 ? 1 : p.diff < 2.3 ? 2 : 3);
    let pool = EQ.GRAMMAR.filter(g => lessons.indexOf(g.l) >= 0 && g.lv <= maxLv);
    if (!pool.length) pool = EQ.GRAMMAR.filter(g => lessons.indexOf(g.l) >= 0);
    if (!pool.length) return null;
    if (opt.avoid) { const f = pool.filter(g => opt.avoid.indexOf(g.q) < 0); if (f.length) pool = f; }
    const g = U.pick(pool);
    const idx = EQ.GRAMMAR.indexOf(g);
    const full = g.q.replace('___', g.a);
    const nO = Math.min(g.opts.length, opt.hard ? 4 : L.nOpts(p));
    const opts = [g.a].concat(U.shuffle(g.opts.slice(1)).slice(0, nO - 1));
    return {
      kind: 'mcq', mode: 'grammar', prompt: g.q, promptVi: g.vi, say: full, sayAfter: full, grammarText: g.q,
      opts: U.shuffle(opts.map(o => ({ t: o, ok: o === g.a, en: true }))),
      explain: g.ex + ' → ' + full, hint: (EQ.LESSONS[g.l] || {}).title ? 'Nhớ lại bài: ' + EQ.LESSONS[g.l].title : '',
      topic: 'g_' + g.l, key: 'g:' + idx, text: full, lesson: g.l, q: g.q
    };
  };

  L.orderQ = function (p, lessons, opt) {
    opt = opt || {};
    const maxLv = opt.hard ? 3 : (p.diff < 1.8 ? 1 : 2);
    let pool = EQ.SENTENCES.filter(s => lessons.indexOf(s.l) >= 0 && s.lv <= maxLv);
    if (!pool.length) pool = EQ.SENTENCES.filter(s => lessons.indexOf(s.l) >= 0);
    if (!pool.length) return null;
    if (opt.avoid) { const f = pool.filter(s => opt.avoid.indexOf(s.s) < 0); if (f.length) pool = f; }
    const s = U.pick(pool);
    return L.orderFrom(s.s, s.vi, 'order', 'o:' + s.s, s.l);
  };
  L.orderFrom = function (sentence, vi, topic, key, lesson) {
    const tokens = sentence.split(' ');
    let sh = U.shuffle(tokens);
    for (let i = 0; i < 6 && sh.join(' ') === sentence; i++) sh = U.shuffle(tokens);
    return {
      kind: 'order', mode: 'order', answer: sentence, tokens: sh, promptVi: 'Sắp xếp các từ thành câu: "' + vi + '"',
      say: sentence, sayAfter: sentence, explain: 'Câu đúng là: ' + sentence + ' (' + vi + ')',
      hint: 'Từ đầu tiên là "' + tokens[0] + '".', topic: topic || 'order', key, text: sentence, lesson
    };
  };

  L.prepQ = function (p, opt) {
    const sc = U.pick(EQ.PREP_SCENES);
    const group = U.uniq(EQ.PREP_SCENES.filter(s => s.ref === sc.ref).map(s => s.ans));
    const objEn = { cat: 'cat', ball: 'ball', dog: 'dog' }[sc.obj];
    const objVi = { cat: 'Con mèo', ball: 'Quả bóng', dog: 'Con chó' }[sc.obj];
    const pron = sc.obj === 'ball' ? 'It' : 'It';
    const right = pron + ' is ' + sc.ans + '.';
    const opts = [right].concat(U.shuffle(group.filter(a => a !== sc.ans)).slice(0, 2).map(a => pron + ' is ' + a + '.'));
    return {
      kind: 'mcq', mode: 'prep', prompt: 'Where is the ' + objEn + '?', promptVi: objVi + ' ở đâu?', say: 'Where is the ' + objEn + '?',
      scene: sc, opts: U.shuffle(opts.map(o => ({ t: o, ok: o === right, en: true }))), sayAfter: right,
      explain: objVi + ' ' + sc.vi + ' → "' + right + '"', hint: 'in = trong, on = trên, under = dưới, next to = bên cạnh, behind = sau, in front of = trước',
      topic: 'prep', key: 'p:' + sc.id + sc.obj, text: right
    };
    void opt;
  };

  // câu hỏi cho nhiệm vụ "quiz"
  L.quizFromGen = function (p, gen) {
    const qs = [];
    if (gen.words) {
      let ws;
      if (gen.words.list) ws = gen.words.list.map(id => EQ.V[id]).filter(Boolean);
      else ws = EQ.VOCAB.filter(w => w.t === gen.words.topic && p.vocab[w.id]);
      ws = U.shuffle(ws);
      // ưu tiên từ hình ảnh để dễ
      const modes = L.wordModes(p);
      for (let i = 0; i < gen.words.n && i < ws.length; i++) qs.push(L.wordQ(p, ws[i], U.pick(modes)));
    }
    if (gen.grammar) {
      const used = [];
      for (let i = 0; i < gen.grammar.n; i++) { const q = L.grammarQ(p, gen.grammar.lessons, { avoid: used }); if (q) { qs.push(q); used.push(q.q); } }
    }
    if (gen.order) {
      const used = [];
      for (let i = 0; i < gen.order.n; i++) { const q = L.orderQ(p, gen.order.lessons, { avoid: used }); if (q) { qs.push(q); used.push(q.answer); } }
    }
    if (gen.prep) {
      const used = [];
      for (let i = 0; i < gen.prep; i++) {
        let q, tries = 0;
        do { q = L.prepQ(p); tries++; } while (used.indexOf(q.key) >= 0 && tries < 10);
        used.push(q.key); qs.push(q);
      }
    }
    return qs;
  };

  L.gateQuestions = function (p, lessons, n) {
    lessons = Array.isArray(lessons) ? lessons : [lessons];
    const used = [];
    const qs = [];
    for (let i = 0; i < n; i++) {
      const q = L.grammarQ(p, lessons, { avoid: used });
      if (q) { qs.push(q); used.push(q.q); }
    }
    return qs;
  };

  // nguồn câu hỏi cho trận đấu (trả về hàm next())
  L.battleSource = function (p, spec) {
    const hard = !!spec.hard;
    const learnedLessons = Object.keys(p.lessons);
    const lessons = (spec.lessons || learnedLessons).filter(l => p.lessons[l]);
    const regions = spec.regions;
    const wordFilter = w => !regions || regions.indexOf(w.r) >= 0;
    const usedWords = [], usedG = [], usedO = [];
    const retry = [];
    let types = (spec.types || ['pic', 'meaning', 'listen', 'en', 'grammar', 'order']).slice();
    if (!hard) {
      const modes = L.wordModes(p);
      types = types.filter(t => ['grammar', 'order', 'prep'].indexOf(t) >= 0 || modes.indexOf(t) >= 0);
      if (!types.some(t => ['pic', 'meaning', 'listen', 'en', 'spell', 'type', 'riddle'].indexOf(t) >= 0)) types.push('pic', 'meaning');
    }
    const orderLessons = lessons.filter(l => EQ.SENTENCES.some(s => s.l === l));
    const prepOk = !!p.lessons.prep;
    let turn = 0;
    function next() {
      turn++;
      if (retry.length && turn % 3 === 0) return retry.shift();
      for (let k = 0; k < 6; k++) {
        const t = U.pick(types);
        if (t === 'grammar' && lessons.length) { const q = L.grammarQ(p, lessons, { avoid: usedG, hard }); if (q) { usedG.push(q.q); if (usedG.length > 8) usedG.shift(); return q; } }
        else if (t === 'order' && orderLessons.length) { const q = L.orderQ(p, orderLessons, { avoid: usedO, hard }); if (q) { usedO.push(q.answer); if (usedO.length > 6) usedO.shift(); return q; } }
        else if (t === 'prep' && prepOk) return L.prepQ(p);
        else if (['pic', 'meaning', 'listen', 'en', 'spell', 'type', 'riddle'].indexOf(t) >= 0) {
          let ws = L.pickWords(p, 8, w => wordFilter(w) && usedWords.indexOf(w.id) < 0 && (['pic', 'listen', 'riddle'].indexOf(t) < 0 || w.pic) && (t !== 'riddle' || (EQ.RIDDLES || []).some(r => r.a === w.id)));
          if (!ws.length) ws = L.pickWords(p, 8, w => usedWords.indexOf(w.id) < 0);
          if (!ws.length) ws = L.pickWords(p, 8);
          if (ws.length) {
            const w = ws[Math.floor(Math.random() * Math.min(3, ws.length))];
            usedWords.push(w.id); if (usedWords.length > 10) usedWords.shift();
            return L.wordQ(p, w, t, { nOpts: hard ? 4 : undefined });
          }
        }
      }
      // dự phòng cuối cùng
      const any = L.pickWords(p, 1)[0] || EQ.V.hello;
      return L.wordQ(p, any, 'meaning');
    }
    function missed(q) {
      // hỏi lại câu sai sau vài lượt (tạo câu mới cùng nội dung để xáo đáp án)
      if (q.wordId) retry.push(L.variant(p, q));
      else if (q.kind === 'order') retry.push(L.orderFrom(q.answer, (q.promptVi.match(/"(.*)"/) || [0, ''])[1], q.topic, q.key, q.lesson));
    }
    return { next, missed, hard };
  };

  // ---------- Bài kiểm tra đầu vào ----------
  L.placementQuestions = function (p) {
    const V = EQ.V;
    const qs = [
      L.wordQ(p, V.hello, 'meaning', { nOpts: 3 }),
      L.wordQ(p, V.cat, 'pic', { nOpts: 3 }),
      L.wordQ(p, V.red, 'en', { nOpts: 3 }),
      L.wordQ(p, V.apple, EQ.speech.available() ? 'listen' : 'pic', { nOpts: 4 }),
      fixedG('tobe', 'She ___ a student.'),
      fixedG('plural', 'one cat, two ___'),
      fixedG('have', 'She ___ two brothers.'),
      L.orderFrom('I like bananas.', 'Mình thích chuối.', 'order', 'o:I like bananas.'),
      fixedG('dodoes', '___ she like milk?'),
      fixedG('can', 'Fish ___ walk.')
    ];
    qs.forEach(q => { q.placement = true; q.wordId = null; });
    return qs;
    function fixedG(l, text) {
      const g = EQ.GRAMMAR.find(x => x.l === l && x.q === text);
      const full = g.q.replace('___', g.a);
      return {
        kind: 'mcq', mode: 'grammar', prompt: g.q, promptVi: g.vi, say: full, sayAfter: full,
        opts: U.shuffle(g.opts.map(o => ({ t: o, ok: o === g.a, en: true }))), explain: g.ex, hint: '', topic: 'g_' + l, key: 'g:' + EQ.GRAMMAR.indexOf(g)
      };
    }
  };

  // ---------- Từ do phụ huynh nhập ----------
  EQ.TOPICS.custom = 'Từ phụ huynh thêm (theo sách)';
  L.registerCustom = function (p) {
    (p.customWords || []).forEach(w => {
      if (EQ.V[w.id]) return;
      const o = { id: w.id, en: w.en, vi: w.vi, e: '📝', ex: w.ex || w.en, exVi: w.exVi || w.vi, t: 'custom', r: 'book', pic: false, custom: true };
      EQ.VOCAB.push(o); EQ.V[o.id] = o;
    });
  };
  L.addCustomWords = function (p, text) {
    p.customWords = p.customWords || [];
    let added = 0, bad = 0;
    String(text || '').split(/\r?\n/).forEach(line => {
      line = line.trim();
      if (!line) return;
      const parts = line.split('|').map(x => x.trim());
      const m = parts[0].match(/^(.+?)\s*[=:]\s*(.+)$/);
      if (!m || !/[a-z]/i.test(m[1])) { bad++; return; }
      const en = m[1].trim().replace(/\s+/g, ' '), vi = m[2].trim();
      if (en.length > 40 || vi.length > 80) { bad++; return; }
      const existing = EQ.VOCAB.find(w => w.en.toLowerCase() === en.toLowerCase() && !w.custom);
      const id = existing ? existing.id : 'c_' + en.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (p.customWords.some(w => w.id === id)) return;
      p.customWords.push({ id, en: existing ? existing.en : en, vi: existing ? existing.vi : vi, ex: parts[1] || '', exVi: parts[2] || '' });
      added++;
    });
    L.registerCustom(p);
    return { added, bad };
  };

  // ---------- Thống kê cho phụ huynh ----------
  L.topicName = function (t) {
    if (t && t.indexOf('g_') === 0) { const l = EQ.LESSONS[t.slice(2)]; return 'Ngữ pháp: ' + (l ? l.title : t); }
    return EQ.TOPICS[t] || t;
  };
  L.summary = function (p) {
    const ids = L.learnedIds(p);
    const c = { fresh: 0, weak: 0, learning: 0, strong: 0 };
    ids.forEach(id => { c[L.status(p.vocab[id])]++; });
    return { learned: ids.length, fresh: c.fresh, weak: c.weak, learning: c.learning, strong: c.strong, due: L.dueIds(p).length };
  };
  L.suggestions = function (p) {
    const out = [];
    const tops = Object.keys(p.topics).map(t => ({ t, ok: p.topics[t].ok, bad: p.topics[t].bad, n: p.topics[t].ok + p.topics[t].bad }))
      .filter(x => x.n >= 4).map(x => Object.assign(x, { acc: x.ok / x.n })).sort((a, b) => a.acc - b.acc);
    tops.filter(x => x.acc < 0.7).slice(0, 3).forEach(x => out.push('Ôn lại chủ đề "' + L.topicName(x.t) + '" (đúng ' + Math.round(x.acc * 100) + '%).'));
    const s = L.summary(p);
    if (s.due > 0) out.push('Có ' + s.due + ' từ đến hạn ôn. Vào Sổ từ vựng → "Ôn tập nhanh".');
    if (s.weak > 8) out.push('Có ' + s.weak + ' từ đang ở mức "Cần ôn" – nên ôn 5–10 phút mỗi ngày.');
    const ms = Object.values(p.mistakes).filter(m => m.n >= 2).sort((a, b) => b.n - a.n).slice(0, 2);
    ms.forEach(m => out.push('Lỗi hay gặp: "' + m.text + '" (sai ' + m.n + ' lần).'));
    if (!out.length) out.push('Bé đang học rất tốt! Hãy duy trì 15–20 phút mỗi ngày.');
    return out;
  };

  EQ.learn = L;
})();
