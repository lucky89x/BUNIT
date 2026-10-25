/* ENGLISH QUEST – NGÂN HÀNG CÂU HỎI DÙNG CHUNG (bản 2.0)
 * Mọi trò chơi (Khu vui chơi, quầy trên bản đồ) lấy câu hỏi từ đây, nên dạy được không chỉ TỪ VỰNG mà cả
 * NGỮ PHÁP (điền chỗ trống), MẪU CÂU (chọn câu đúng), HỎI – ĐÁP... Thêm giáo trình mới = thêm DỮ LIỆU, không sửa trò chơi.
 *
 * Một câu hỏi (Q):
 *   { id, kind: 'word'|'fill'|'sent'|'qa', prompt, sub, options[], answer, explain, say, review, topic, key, wordId?, long? }
 *     prompt  – đề hiển thị (nghĩa tiếng Việt / câu có chỗ trống ___ / câu hỏi)
 *     sub     – dòng phụ (nghĩa tiếng Việt của cả câu)
 *     options – các lựa chọn (đã xáo); answer – đáp án đúng (một phần tử của options)
 *     say     – câu đọc to khi đúng;  review – dòng ôn lại khi sai;  long – lựa chọn là cả câu dài
 *
 * "Từ giả" (wrap): để 14 trò cũ dùng được không cần sửa, mỗi Q được bọc thành đối tượng giống từ vựng:
 *   { id:'q:..', en: đáp án, vi: đề, t: chủ đề, qq: Q, long }  → trò vẫn hiện w.vi làm đề, w.en làm đáp án.
 *
 * THÊM GIÁO TRÌNH (ví dụ Global Success): tạo file js/data/packs/xxx.js với
 *   EQ.QPACKS.push({ id:'gs6-u1', name:'Global Success 6 – Unit 1', book:'gs6', unit:1, items:[
 *     { type:'fill', q:'She ___ a teacher.', a:'is', wrong:['am','are'], ex:'She đi với "is".', vi:'Cô ấy là giáo viên.' },
 *     { type:'sent', s:'What is your name?', vi:'Bạn tên là gì?' },
 *     { type:'qa',   q:'How old are you?', a:'I am eleven.', wrong:['I have eleven.','I is eleven.'], ex:'Hỏi tuổi trả lời "I am + số".' }
 *   ]});
 * rồi thêm <script> vào index.html (xem HUONG-DAN.md mục "Thêm giáo trình").
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U;
  const Qb = {};
  EQ.QPACKS = EQ.QPACKS || [];

  // ---------- lựa chọn nhiễu cho câu (bắt lỗi sai ngữ pháp thường gặp) ----------
  const SETS = [['am', 'is', 'are'], ['have', 'has'], ['a', 'an'], ['do', 'does'], ['don\'t', 'doesn\'t'], ['this', 'that'], ['these', 'those'], ['he', 'she'], ['his', 'her'], ['can', 'can\'t']];
  function mutate(sentence) {
    const toks = sentence.split(' ');
    const outs = [];
    toks.forEach((tk, i) => {
      const bare = tk.replace(/[.,!?]/g, ''), tail = tk.slice(bare.length), low = bare.toLowerCase();
      SETS.forEach(set => {
        const k = set.indexOf(low);
        if (k < 0) return;
        set.forEach(alt => { if (alt === low) return; const w = bare[0] !== bare[0].toLowerCase() ? alt[0].toUpperCase() + alt.slice(1) : alt; const t2 = toks.slice(); t2[i] = w + tail; outs.push(t2.join(' ')); });
      });
    });
    // đảo hai từ liền kề
    if (toks.length >= 3) { for (let i = 0; i < toks.length - 1; i++) { const t2 = toks.slice(); const a = t2[i], b = t2[i + 1]; if (/[.!?]$/.test(a) || /[.!?]$/.test(b)) continue; t2[i] = b.toLowerCase() === b ? b : b; t2[i + 1] = a; outs.push(t2.join(' ')); } }
    return outs.filter(s => s !== sentence);
  }

  // ---------- tạo câu hỏi ----------
  function mk(o) { return Object.assign({ sub: '', explain: '', say: '', review: '', long: false }, o); }
  Qb.fill = function (g, idx) {
    const full = g.q.replace('___', g.a);
    return mk({ id: 'g' + idx, kind: 'fill', prompt: g.q, sub: g.vi, options: U.shuffle(g.opts.slice()), answer: g.a, explain: g.ex, say: full, review: full + '  —  ' + g.ex, topic: 'g_' + g.l, key: 'g:' + idx, lesson: g.l });
  };
  Qb.sent = function (s, idx, pool) {
    let wrong = U.shuffle(mutate(s.s));
    const uniq = []; wrong.forEach(w => { if (uniq.indexOf(w) < 0) uniq.push(w); });
    wrong = uniq.slice(0, 2);
    if (wrong.length < 2 && pool) U.shuffle(pool.filter(x => x.s !== s.s && x.l === s.l)).slice(0, 2 - wrong.length).forEach(x => wrong.push(x.s));
    return mk({ id: 's' + idx, kind: 'sent', prompt: s.vi, sub: '', options: U.shuffle([s.s].concat(wrong)), answer: s.s, explain: 'Câu đúng: ' + s.s, say: s.s, review: s.s + '  =  ' + s.vi, topic: 's_' + s.l, key: 's:' + idx, long: true, lesson: s.l });
  };
  Qb.word = function (w, pool, n) {
    const same = U.shuffle(pool.filter(x => x.id !== w.id && x.en !== w.en && !x.qq && x.t === w.t));
    const other = U.shuffle(pool.filter(x => x.id !== w.id && x.en !== w.en && !x.qq && x.t !== w.t));
    const extra = U.shuffle(EQ.VOCAB.filter(x => x.id !== w.id && x.en !== w.en && x.t === w.t));
    const wrong = [];
    same.concat(other, extra).forEach(x => { if (wrong.length < (n || 3) && !wrong.some(o => o.en === x.en)) wrong.push(x); });
    return mk({ id: 'w' + w.id, kind: 'word', prompt: w.vi, sub: '', options: U.shuffle([w.en].concat(wrong.map(x => x.en))), answer: w.en, explain: w.en + ' = ' + w.vi, say: w.en, review: w.en + '  =  ' + w.vi, topic: w.t, key: 'w:' + w.id, wordId: w.id, pic: w.e });
  };
  // từ gói giáo trình
  Qb.fromPack = function (pack, it, i) {
    const id = pack.id + ':' + i, topic = 'p_' + pack.id;
    if (it.type === 'fill' || it.type === 'qa') {
      const opts = [it.a].concat(it.wrong || []);
      const full = it.type === 'fill' ? it.q.replace('___', it.a) : it.q + ' – ' + it.a;
      return mk({ id, kind: it.type, prompt: it.q, sub: it.vi || '', options: U.shuffle(opts), answer: it.a, explain: it.ex || '', say: it.type === 'fill' ? full : it.a, review: full + (it.ex ? '  —  ' + it.ex : ''), topic, key: 'p:' + id, long: it.type === 'qa' && it.a.length > 12 });
    }
    // sent
    let wrong = U.shuffle(mutate(it.s)); const u = []; wrong.forEach(w => { if (u.indexOf(w) < 0) u.push(w); });
    return mk({ id, kind: 'sent', prompt: it.vi, options: U.shuffle([it.s].concat(u.slice(0, 2))), answer: it.s, explain: 'Câu đúng: ' + it.s, say: it.s, review: it.s + '  =  ' + it.vi, topic, key: 'p:' + id, long: true });
  };

  // bọc câu hỏi thành "từ giả" cho các trò cũ
  Qb.wrap = function (q) { return { id: 'q:' + q.id, en: q.answer, vi: q.prompt + (q.sub ? '' : ''), sub: q.sub, t: q.topic, qq: q, long: q.long }; };
  Qb.toQ = function (w, pool, n) { return w.qq ? w.qq : Qb.word(w, pool || [w], n); };

  // ghi nhận kết quả vào hệ thống ôn tập
  Qb.record = function (p, q, ok, mode) {
    if (q.kind === 'word') return EQ.learn.record(p, { correct: ok, wordId: q.wordId, topic: q.topic, key: q.key, text: q.review, mode: mode || 'en' });
    return EQ.learn.record(p, { correct: ok, topic: q.topic, key: q.key, text: q.review, mode: 'en' });
  };

  // ---------- nguồn câu hỏi cho Khu vui chơi ----------
  function learnedLessons(p) { return Object.keys(p.lessons || {}).filter(l => p.lessons[l]); }
  Qb.grammarQs = function (p) {
    const ls = learnedLessons(p);
    const out = [];
    EQ.GRAMMAR.forEach((g, i) => { if (ls.indexOf(g.l) >= 0) out.push(Qb.fill(g, i)); });
    return out;
  };
  Qb.sentenceQs = function (p) {
    const ls = learnedLessons(p);
    const out = [];
    EQ.SENTENCES.forEach((s, i) => { if (ls.indexOf(s.l) >= 0) out.push(Qb.sent(s, i, EQ.SENTENCES)); });
    return out;
  };
  Qb.packQs = function (pack) { return pack.items.map((it, i) => Qb.fromPack(pack, it, i)); };
  Qb.packsFor = function (p) {
    return EQ.QPACKS.filter(pk => !pk.book || pk.book === p.book || !p.book);
  };

  // trả về danh sách nguồn: [{id, name, pool: [từ giả], long: có câu dài không}]
  Qb.sources = function (p) {
    const out = [];
    const g = Qb.grammarQs(p), s = Qb.sentenceQs(p);
    out.push({ id: 'qb_grammar', name: '📘 Ngữ pháp đã học (' + g.length + ' câu)', pool: U.shuffle(g.map(Qb.wrap)), grammar: true });
    out.push({ id: 'qb_sent', name: '💬 Mẫu câu đã học (' + s.length + ' câu – chỉ trò Candy Crush)', pool: U.shuffle(s.map(Qb.wrap)), grammar: true, longOnly: true });
    Qb.packsFor(p).forEach(pk => {
      const qs = Qb.packQs(pk);
      out.push({ id: 'pack:' + pk.id, name: '📕 ' + pk.name + ' (' + qs.length + ' câu)', pool: U.shuffle(qs.map(Qb.wrap)), grammar: true });
    });
    return out;
  };
  // gộp từ + ngữ pháp: dùng khi chọn "Tổng hợp"
  Qb.mix = function (p, words) {
    const g = Qb.grammarQs(p).filter(q => !q.long).map(Qb.wrap);
    return U.shuffle(words.slice(0, 14).concat(U.shuffle(g).slice(0, 14)));
  };

  EQ.qbank = Qb;
})();
