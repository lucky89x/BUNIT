/* Giao diện câu hỏi: trắc nghiệm, chọn hình, nghe, sắp xếp câu, ghép chữ, giới từ; bài giảng trước khi thực hành */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const C = {};
  C.current = null; // câu hỏi đang hiển thị (dùng cho kiểm thử tự động)

  function speakBtn(text, label, cls) {
    return el('button', { class: 'btn-speak ' + (cls || ''), title: 'Nghe phát âm', onclick: e => { e.stopPropagation(); EQ.speech.speak(text, { user: true }); } }, label || '🔊');
  }
  function slowBtn(text) {
    return el('button', { class: 'btn-speak slow', title: 'Nghe chậm', onclick: e => { e.stopPropagation(); EQ.speech.speak(text, { rate: 0.6, user: true }); } }, '🐢');
  }
  C.speakBtn = speakBtn;

  function optContent(o) {
    if (o.sw) return el('span', { class: 'swatch', style: { background: o.sw } });
    if (o.pic) return el('span', { class: /^\d+$/.test(o.pic) ? 'opt-num' : 'opt-emoji' }, o.pic);
    return el('span', { class: 'opt-text' }, o.t);
  }

  // ---------- Cảnh minh họa giới từ (SVG) ----------
  function sceneSVG(sc) {
    const obj = { cat: '🐱', ball: '⚽', dog: '🐶' }[sc.obj];
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 240 150'); svg.setAttribute('class', 'scene');
    const add = (tag, a, text) => { const n = document.createElementNS(ns, tag); for (const k in a) n.setAttribute(k, a[k]); if (text) n.textContent = text; svg.appendChild(n); return n; };
    const emo = (x, y, s) => add('text', { x, y, 'font-size': s, 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-family': EQ.sprites.EMOJI_FONT }, obj);
    add('rect', { x: 0, y: 128, width: 240, height: 22, fill: '#c9b48f' });
    if (sc.ref === 'table') {
      const table = () => { add('rect', { x: 70, y: 70, width: 100, height: 10, rx: 3, fill: '#8b5a2b' }); add('rect', { x: 78, y: 80, width: 8, height: 50, fill: '#6d4326' }); add('rect', { x: 154, y: 80, width: 8, height: 50, fill: '#6d4326' }); };
      table();
      if (sc.id === 'on') emo(120, 52, 34);
      if (sc.id === 'under') emo(120, 110, 30);
      if (sc.id === 'next_to') emo(200, 110, 32);
    } else {
      const bx = 85, by = 70, bw = 70, bh = 58;
      if (sc.id === 'in') {
        add('polygon', { points: `${bx},${by} ${bx + 12},${by - 12} ${bx + bw + 12},${by - 12} ${bx + bw},${by}`, fill: '#6d4326' });
        emo(124, by - 2, 34);
        add('rect', { x: bx, y: by, width: bw, height: bh, fill: '#d49a5a' });
        add('polygon', { points: `${bx + bw},${by} ${bx + bw + 12},${by - 12} ${bx + bw + 12},${by + bh - 12} ${bx + bw},${by + bh}`, fill: '#b07a43' });
      } else if (sc.id === 'behind') {
        emo(146, by - 18, 34);
        add('rect', { x: bx, y: by, width: bw, height: bh, fill: '#d49a5a' });
        add('polygon', { points: `${bx},${by} ${bx + 12},${by - 12} ${bx + bw + 12},${by - 12} ${bx + bw},${by}`, fill: '#e2b47b' });
        add('polygon', { points: `${bx + bw},${by} ${bx + bw + 12},${by - 12} ${bx + bw + 12},${by + bh - 12} ${bx + bw},${by + bh}`, fill: '#b07a43' });
      } else {
        add('rect', { x: bx + 10, y: by - 20, width: bw, height: bh, fill: '#d49a5a' });
        add('polygon', { points: `${bx + 10},${by - 20} ${bx + 22},${by - 32} ${bx + bw + 22},${by - 32} ${bx + bw + 10},${by - 20}`, fill: '#e2b47b' });
        add('polygon', { points: `${bx + bw + 10},${by - 20} ${bx + bw + 22},${by - 32} ${bx + bw + 22},${by + bh - 32} ${bx + bw + 10},${by + bh - 20}`, fill: '#b07a43' });
        emo(120, 112, 44);
      }
    }
    return svg;
  }

  // ---------- Hiển thị 1 câu hỏi ----------
  // trả về Promise<{correct, hint, tries}>
  C.render = function (box, q, opts) {
    opts = opts || {};
    const p = EQ.game.profile;
    const showVi = opts.showVi != null ? opts.showVi : EQ.learn.showVi(p);
    C.current = q;
    box.innerHTML = '';
    return new Promise(resolve => {
      let tries = 0, hint = false, finished = false, recorded = false;
      const root = el('div', { class: 'q q-' + q.kind });
      box.appendChild(root);
      // hình minh họa
      const vis = el('div', { class: 'q-visual' });
      if (q.scene) vis.appendChild(sceneSVG(q.scene));
      else if (q.listen) vis.appendChild(el('button', { class: 'btn-listen', onclick: () => EQ.speech.speak(q.say, { user: true }) }, ['🔊', el('small', null, 'Nghe lại')]));
      else if (q.sw) vis.appendChild(el('span', { class: 'swatch big', style: { background: q.sw } }));
      else if (q.pic) vis.appendChild(el('span', { class: /^\d+$/.test(q.pic) ? 'q-num' : 'q-emoji' }, q.pic));
      if (q.bigVi) vis.appendChild(el('div', { class: 'q-bigvi' }, q.bigVi));
      if (vis.childNodes.length) root.appendChild(vis);
      // đề bài tiếng Anh
      if (q.prompt) {
        root.appendChild(el('div', { class: 'q-prompt' + (q.big ? ' big' : '') }, [
          el('span', { class: 'en' }, q.prompt),
          q.say ? speakBtn(q.say) : null, q.say ? slowBtn(q.say) : null
        ]));
      } else if (q.listen) {
        root.appendChild(el('div', { class: 'q-prompt' }, [slowBtn(q.say)]));
      }
      // đề bài tiếng Việt
      const viLine = el('div', { class: 'q-vi' });
      const isInstruction = q.kind !== 'mcq' || ['pic', 'listen', 'en', 'meaning', 'riddle'].indexOf(q.mode) >= 0;
      if (showVi || isInstruction) viLine.textContent = q.promptVi;
      else viLine.appendChild(el('button', { class: 'btn-mini', onclick: () => { viLine.textContent = q.promptVi; } }, '🇻🇳 Xem nghĩa'));
      root.appendChild(viLine);

      const fb = el('div', { class: 'q-feedback' });
      const tools = el('div', { class: 'q-tools' });

      function record(correct) {
        if (recorded || opts.noRecord) return;
        recorded = true;
        EQ.learn.record(p, { correct, hint, wordId: q.wordId, topic: q.topic, key: q.key, text: q.text, mode: q.mode });
      }
      function success() {
        finished = true;
        record(true);
        EQ.audio.sfx('correct');
        fb.className = 'q-feedback ok';
        fb.innerHTML = '';
        fb.appendChild(el('div', { class: 'fb-title' }, U.pick(['🎉 Chính xác!', '🌟 Giỏi quá!', '✨ Đúng rồi!', '👏 Tuyệt vời!'])));
        if (q.sayAfter && q.kind !== 'mcq') fb.appendChild(el('div', { class: 'fb-en' }, q.sayAfter));
        if (q.sayAfter) EQ.speech.speak(q.sayAfter);
        root.classList.add('done');
        const go = el('button', { class: 'btn primary', onclick: () => fin() }, 'Tiếp tục ▶');
        fb.appendChild(go);
        let done = false;
        const t = setTimeout(fin, opts.autoNext === false ? 1e9 : 1600);
        function fin() { if (done) return; done = true; clearTimeout(t); if (C.current === q) C.current = null; resolve({ correct: tries === 0, hint, tries }); }
        go.focus();
      }
      function failure(chosenText) {
        tries++;
        record(false);
        EQ.audio.sfx('wrong');
        fb.className = 'q-feedback bad';
        fb.innerHTML = '';
        fb.appendChild(el('div', { class: 'fb-title' }, opts.retry ? '🤔 Chưa đúng, thử lại nhé!' : '💡 Chưa đúng rồi'));
        fb.appendChild(el('div', { class: 'fb-ex' }, '🧚 Pip: ' + (q.explain || '')));
        if (chosenText && q.mode === 'grammar') fb.appendChild(el('div', { class: 'fb-small' }, 'Bạn đã chọn: "' + chosenText + '"'));
        if (!opts.retry) {
          finished = true;
          root.classList.add('done');
          revealAnswer();
          const go = el('button', { class: 'btn primary', onclick: () => { if (C.current === q) C.current = null; resolve({ correct: false, hint, tries }); } }, 'Tiếp tục ▶');
          fb.appendChild(go);
          go.focus();
        }
      }

      let revealAnswer = () => { };
      let removeWrong = () => { };
      let checkNow = null;

      if (q.kind === 'mcq') {
        const grid = el('div', { class: 'q-opts n' + q.opts.length + (q.opts[0].pic || q.opts[0].sw ? ' pics' : '') });
        q.opts.forEach((o, i) => {
          const b = el('button', { class: 'opt', 'data-i': i }, [el('span', { class: 'opt-key' }, String(i + 1)), optContent(o)]);
          b.addEventListener('click', () => {
            if (finished || b.disabled) return;
            if (o.ok) { b.classList.add('right'); success(); }
            else {
              b.classList.add('wrong'); b.disabled = true; failure(o.t);
              // không loại trừ dần: sau khi giải thích, mọi lựa chọn được xáo lại để bé phải chọn bằng hiểu biết
              if (opts.retry) setTimeout(() => {
                if (finished) return;
                q.opts.forEach(x => { if (!x._gone) { x._btn.disabled = false; x._btn.classList.remove('wrong'); } });
                U.shuffle(q.opts).forEach((x, k) => { grid.appendChild(x._btn); x._btn.querySelector('.opt-key').textContent = String(k + 1); });
                q.opts.sort((a2, b2) => Array.prototype.indexOf.call(grid.children, a2._btn) - Array.prototype.indexOf.call(grid.children, b2._btn));
              }, 1300);
            }
            if (o.en && o.t && !o.ok) EQ.speech.speak(o.t);
          });
          o._btn = b;
          grid.appendChild(b);
        });
        root.appendChild(grid);
        revealAnswer = () => q.opts.forEach(o => { if (o.ok) o._btn.classList.add('right'); o._btn.disabled = true; });
        removeWrong = n => {
          const w = U.shuffle(q.opts.filter(o => !o.ok && !o._btn.disabled));
          // luôn chừa lại ít nhất 1 đáp án sai
          w.slice(0, Math.min(n, Math.max(0, w.length - 1))).forEach(o => { o._gone = true; o._btn.disabled = true; o._btn.classList.add('gone'); });
        };
      } else if (q.kind === 'type') {
        // gõ từ
        const pat = el('div', { class: 'q-pattern' }, q.pattern);
        const inp = el('input', { class: 'inp type-inp', autocomplete: 'off', spellcheck: 'false', placeholder: 'Gõ từ tiếng Anh...' });
        const norm = t => String(t || '').toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
        let shown = 1;
        function check() {
          if (finished || !norm(inp.value)) return;
          if (norm(inp.value) === norm(q.word)) { inp.classList.add('right'); inp.disabled = true; success(); }
          else { inp.classList.add('wrong'); setTimeout(() => inp.classList.remove('wrong'), 600); failure(inp.value); if (opts.retry) { inp.select(); } }
        }
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); check(); } });
        checkNow = check;
        root.appendChild(pat);
        root.appendChild(el('div', { class: 'row center' }, [inp, el('button', { class: 'btn primary', onclick: check }, '✔ Kiểm tra')]));
        revealAnswer = () => { inp.value = q.word; inp.disabled = true; };
        removeWrong = () => {
          shown = Math.min(q.word.length, shown + 1);
          pat.textContent = q.word.split('').map((c, i) => (i < shown || c === ' ') ? c : '_').join(' ');
          inp.value = q.word.slice(0, shown); inp.focus();
        };
        setTimeout(() => inp.focus(), 50);
      } else {
        // order (sắp xếp từ) & spell (ghép chữ)
        const sep = q.kind === 'spell' ? '' : ' ';
        const answer = q.kind === 'spell' ? q.word : q.answer;
        const line = el('div', { class: 'q-answer' + (q.kind === 'spell' ? ' spell' : '') });
        const bank = el('div', { class: 'q-tokens' });
        const picked = [];
        const tokens = q.tokens.map((t, i) => ({ t, i, used: false }));
        function draw() {
          line.innerHTML = '';
          if (!picked.length) line.appendChild(el('span', { class: 'placeholder' }, q.kind === 'spell' ? 'Bấm vào chữ cái bên dưới' : 'Bấm vào các từ bên dưới theo đúng thứ tự'));
          picked.forEach((tk, k) => line.appendChild(el('button', { class: 'tok in', onclick: () => { if (finished) return; tk.used = false; picked.splice(k, 1); draw(); } }, tk.t)));
          bank.innerHTML = '';
          tokens.forEach(tk => {
            const b = el('button', { class: 'tok' + (tk.used ? ' used' : ''), disabled: tk.used || finished, onclick: () => { if (finished) return; tk.used = true; picked.push(tk); EQ.audio.sfx('click'); draw(); if (picked.length === tokens.length) check(); } }, tk.t);
            bank.appendChild(b);
          });
        }
        function check() {
          const s = picked.map(x => x.t).join(sep);
          if (s === answer) { line.classList.add('right'); success(); draw(); }
          else { line.classList.add('wrong'); setTimeout(() => line.classList.remove('wrong'), 600); failure(); }
        }
        checkNow = check;
        draw();
        root.appendChild(line);
        root.appendChild(bank);
        root.appendChild(el('div', { class: 'row center' }, [
          el('button', { class: 'btn', onclick: () => { if (finished) return; picked.splice(0).forEach(x => { x.used = false; }); draw(); } }, '↺ Xóa hết'),
          el('button', { class: 'btn primary', onclick: () => { if (!finished && picked.length) check(); } }, '✔ Kiểm tra')
        ]));
        revealAnswer = () => { line.innerHTML = ''; line.appendChild(el('span', { class: 'reveal' }, 'Đáp án: ' + answer)); };
        removeWrong = () => {
          // gợi ý: đặt sẵn từ đầu tiên đúng
          picked.splice(0).forEach(x => { x.used = false; });
          const first = q.kind === 'spell' ? answer.charAt(0) : answer.split(' ')[0];
          const tk = tokens.find(x => x.t === first);
          if (tk) { tk.used = true; picked.push(tk); }
          draw();
        };
      }

      // công cụ gợi ý
      if (opts.allowHint !== false) {
        const hb = el('button', { class: 'btn-mini' }, '💡 Gợi ý');
        hb.onclick = () => {
          if (finished) return;
          hint = true; if (q.kind !== 'type') hb.disabled = true;
          removeWrong(1);
          fb.className = 'q-feedback hint';
          fb.innerHTML = ''; fb.appendChild(el('div', null, '🧚 Pip: ' + (q.hint || 'Hãy đọc kỹ lại câu hỏi nhé!')));
        };
        tools.appendChild(hb);
        const n = p.items.hint || 0;
        if (n > 0 && q.kind === 'mcq' && q.opts.length >= 3) {
          const sb = el('button', { class: 'btn-mini' }, '📜 Cuộn gợi ý (' + n + ')');
          sb.onclick = () => {
            if (finished || !(p.items.hint > 0)) return;
            p.items.hint--; hint = true; sb.disabled = true;
            removeWrong(2); EQ.audio.sfx('heal');
          };
          tools.appendChild(sb);
        }
      }
      root.appendChild(tools);
      root.appendChild(fb);
      if (q.autoSay && q.say) setTimeout(() => { if (!finished) EQ.speech.speak(q.say); }, 350);
      // phím số 1-4 để chọn đáp án
      C._key = e => {
        if (finished) return false;
        if (q.kind === 'mcq' && /^[1-4]$/.test(e.key)) { const o = q.opts[+e.key - 1]; if (o && o._btn && !o._btn.disabled) o._btn.click(); return true; }
        if (e.key === 'Enter' && checkNow) { checkNow(); return true; }
        return false;
      };
      C._testAnswer = (wantCorrect) => {
        if (finished) return;
        if (q.kind === 'mcq') { const o = q.opts.find(x => wantCorrect ? x.ok : (!x.ok && !x._btn.disabled)); if (o) o._btn.click(); }
        else if (q.kind === 'type') { const inp = root.querySelector('.type-inp'); inp.value = wantCorrect ? q.word : 'xyz'; checkNow(); }
        else {
          const ans = (q.kind === 'spell' ? q.word.split('') : q.answer.split(' '));
          const toks = Array.from(root.querySelectorAll('.q-tokens .tok'));
          root.querySelector('.row .btn').click();
          const seq = wantCorrect ? ans : ans.slice().reverse();
          seq.forEach(w => { const b = Array.from(root.querySelectorAll('.q-tokens .tok')).find(x => x.textContent === w && !x.disabled); if (b) b.click(); });
          void toks;
        }
      };
    });
  };

  // ---------- Chuỗi câu hỏi trong hộp thoại ----------
  // trả về Promise<{completed, correct, total}>
  C.run = function (qs, o) {
    o = o || {};
    return new Promise(resolve => {
      let i = 0, correct = 0, closed = false;
      qs = qs.slice();
      const fails = {};
      const body = el('div', { class: 'challenge' });
      const head = el('div', { class: 'ch-head' }, [
        el('div', { class: 'ch-title' }, [el('span', { class: 'ch-icon' }, o.icon || '✨'), o.title || 'Thử thách']),
        o.en ? el('div', { class: 'ch-sub' }, [el('span', null, o.en), speakBtn(o.en)]) : null,
        o.vi ? el('div', { class: 'ch-subvi' }, o.vi) : null,
        o.mastery ? el('div', { class: 'ch-rule' }, '🎯 Phải trả lời đúng ngay lần đầu. Sai thì Pip giải thích và hỏi lại bằng câu khác.') : null
      ]);
      const dots = el('div', { class: 'dots' });
      const qbox = el('div', { class: 'qbox' });
      body.appendChild(head); body.appendChild(dots); body.appendChild(qbox);
      if (o.cancelable !== false) body.appendChild(el('button', { class: 'btn ghost small ch-close', onclick: () => { closed = true; close(); resolve({ completed: false, correct, total: qs.length }); } }, 'Để sau ✕'));
      const close = EQ.ui.modal(body, { cls: 'wide', onEsc: o.cancelable !== false ? () => { closed = true; close(); resolve({ completed: false, correct, total: qs.length }); } : null });
      function drawDots() {
        dots.innerHTML = '';
        qs.forEach((q, k) => dots.appendChild(el('span', { class: 'dot' + (k < i ? ' done' : k === i ? ' cur' : '') })));
      }
      async function next() {
        if (closed) return;
        if (i >= qs.length) { close(); resolve({ completed: true, correct, total: qs.length }); return; }
        drawDots();
        const cur = qs[i];
        const soft = !!cur._soft;
        const r = await C.render(qbox, cur, { retry: o.mastery ? soft : o.retry !== false, noRecord: o.noRecord });
        if (closed) return;
        if (r.correct) correct++;
        else if (o.mastery && !soft) {
          // hỏi lại bằng câu khác cùng kiến thức; sai 2 lần thì cho làm lại có hướng dẫn
          const base = cur.base || cur.key || String(i);
          fails[base] = (fails[base] || 0) + 1;
          const v = EQ.learn.variant(EQ.game.profile, cur);
          if (fails[base] >= 2) v._soft = true;
          qs.push(v);
        }
        if (o.onAnswer) o.onAnswer(r, qs[i]);
        i++;
        next();
      }
      next();
    });
  };

  // ---------- Bài giảng trước khi thực hành ----------
  C.teach = async function (p, teach) {
    if (!teach) return;
    const lessons = teach.lesson ? (Array.isArray(teach.lesson) ? teach.lesson : [teach.lesson]) : [];
    for (const lid of lessons) {
      if (p.lessons[lid]) continue;
      const ok = await lessonCard(lid);
      if (!ok) return false;
      p.lessons[lid] = Date.now();
      // kiểm tra nhanh 2 câu (được thử lại)
      const qs = EQ.learn.gateQuestions(p, [lid], 2).filter(Boolean);
      if (qs.length) await C.run(qs, { title: 'Thực hành: ' + EQ.LESSONS[lid].title, icon: EQ.LESSONS[lid].icon, retry: true, cancelable: false });
    }
    const newWords = (teach.words || []).filter(id => EQ.V[id] && !p.vocab[id]);
    if (newWords.length) {
      const ok = await wordCards(newWords);
      if (!ok) return false;
      EQ.learn.learnWords(p, newWords);
      const checkWords = U.shuffle(newWords.filter(id => EQ.V[id].pic)).slice(0, Math.min(3, newWords.length));
      const qs = checkWords.map(id => EQ.learn.wordQ(p, EQ.V[id], U.pick(['pic', 'meaning']), { nOpts: 3 }));
      if (qs.length) await C.run(qs, { title: 'Thử nhớ lại từ mới', icon: '🧠', retry: true, cancelable: false });
      EQ.game.afterLearn(newWords.length);
    }
    EQ.store.saveSoon();
    return true;
  };

  function lessonCard(lid) {
    const L = EQ.LESSONS[lid];
    return new Promise(resolve => {
      const body = el('div', { class: 'lesson' }, [
        el('div', { class: 'lesson-tag' }, '📖 Bài học mới'),
        el('h2', null, [el('span', { class: 'ch-icon' }, L.icon), L.title]),
        el('div', { class: 'lesson-points' }, L.points.map(pt => el('div', { class: 'lp' }, [
          el('div', { class: 'lp-en' }, [el('b', null, pt[0]), speakBtn(pt[0].replace(/→.*$/, ''))]),
          el('div', { class: 'lp-vi' }, pt[1])
        ]))),
        el('div', { class: 'row center' }, [el('button', { class: 'btn primary big', onclick: () => { close(); resolve(true); } }, 'Mình hiểu rồi ▶')])
      ]);
      const close = EQ.ui.modal(body, { cls: 'wide' });
    });
  }

  function wordCards(ids) {
    return new Promise(resolve => {
      const pages = [];
      for (let i = 0; i < ids.length; i += 4) pages.push(ids.slice(i, i + 4));
      let pg = 0;
      const body = el('div', { class: 'words-teach' });
      const close = EQ.ui.modal(body, { cls: 'wide' });
      function draw() {
        body.innerHTML = '';
        body.appendChild(el('div', { class: 'lesson-tag' }, '✨ Từ mới (' + (pg + 1) + '/' + pages.length + ')'));
        const grid = el('div', { class: 'wcards' });
        pages[pg].forEach(id => {
          const w = EQ.V[id];
          grid.appendChild(el('div', { class: 'wcard' }, [
            w.sw ? el('span', { class: 'swatch big' , style: { background: w.sw } }) : el('div', { class: /^\d+$/.test(w.e) ? 'q-num' : 'wc-emoji' }, w.e),
            el('div', { class: 'wc-en' }, [w.en, speakBtn(w.en)]),
            el('div', { class: 'wc-vi' }, w.vi),
            w.ex ? el('div', { class: 'wc-ex' }, [el('span', null, w.ex), speakBtn(w.ex, '🔊', 'small')]) : null,
            w.ex ? el('div', { class: 'wc-exvi' }, w.exVi) : (w.sgk ? el('div', { class: 'wc-exvi' }, '📘 Từ trong sách') : null),
            EQ.speech.listenEnabled() ? EQ.speech.micButton(w.en) : null
          ]));
        });
        body.appendChild(grid);
        body.appendChild(el('div', { class: 'row center' }, [
          pg > 0 ? el('button', { class: 'btn', onclick: () => { pg--; draw(); } }, '◀ Quay lại') : null,
          el('button', { class: 'btn primary big', onclick: () => { if (pg < pages.length - 1) { pg++; draw(); } else { close(); resolve(true); } } }, pg < pages.length - 1 ? 'Tiếp ▶' : 'Đã nhớ, thử thôi! ▶')
        ]));
        // đọc mẫu từ đầu tiên
        setTimeout(() => EQ.speech.speak(EQ.V[pages[pg][0]].en), 300);
      }
      draw();
    });
  }

  EQ.challenge = C;
})();
