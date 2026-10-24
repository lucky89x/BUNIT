/* ENGLISH QUEST – KHU VUI CHƠI (mini-game kết hợp từ vựng)
 *  🏎️ Đua xe từ vựng   – lái xe qua cổng có từ đúng
 *  🧺 Hứng chữ          – hứng chữ cái theo đúng thứ tự để ghép từ (luyện chính tả)
 *  🧗 Vượt chướng ngại  – nhảy qua các bục kiểu Roblox, chọn bục có từ đúng
 *  🎈 Bắn bóng bay      – bắn quả bóng mang từ đúng
 * Mỗi câu trả lời được ghi vào hệ thống ôn tập (từ sai sẽ được hỏi lại sớm).
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const A = {};
  const CW = 880, CH = 500;
  const FONT = '"Segoe UI", "Nunito", system-ui, sans-serif';
  const EMO = () => EQ.sprites.EMOJI_FONT;

  A.GAMES = {
    race: { name: 'Đua xe từ vựng', icon: '🏎️', desc: 'Lái xe đi qua cổng có từ tiếng Anh đúng. Đúng thì tăng tốc!', keys: '← → hoặc A D (hoặc bấm chuột bên trái/phải)' },
    catch: { name: 'Hứng chữ', icon: '🧺', desc: 'Di chuyển giỏ hứng đúng chữ cái để ghép thành từ. Luyện chính tả!', keys: '← → hoặc A D, hoặc di chuột' },
    obby: { name: 'Vượt chướng ngại', icon: '🧗', desc: 'Chạy, nhảy qua các bục như Roblox. Húc vào khối có từ đúng để cầu hiện ra!', keys: '← → để chạy, Space / ↑ / W để nhảy' },
    balloon: { name: 'Bắn bóng bay', icon: '🎈', desc: 'Bấm vào quả bóng bay có từ đúng. Bình tĩnh, không bị tính giờ!', keys: 'Bấm chuột vào bóng (hoặc phím 1–4)' }
  };

  // ---------- nguồn từ ----------
  A.sources = function (p) {
    const out = [];
    const L = EQ.learn;
    const learned = L.learnedIds(p);
    const cur = p.book && (p.schoolUnit || {})[p.book];
    if (cur) {
      const u = EQ.CURRICULUM[p.book].find(x => x.n === cur);
      if (u) {
        const ids = U.uniq((u.sgk || []).concat(u.words));
        out.push({ id: 'unit', name: '📗 Unit ' + u.n + ': ' + u.en + ' (' + ids.filter(i => p.vocab[i]).length + ' từ đã học)', ids: ids.filter(i => p.vocab[i]), all: ids });
      }
    }
    out.push({ id: 'due', name: '⏰ Từ cần ôn (' + L.dueIds(p).length + ')', ids: L.dueIds(p) });
    out.push({ id: 'learned', name: '📖 Tất cả từ đã học (' + learned.length + ')', ids: learned });
    return out;
  };
  function poolFrom(p, ids) {
    const L = EQ.learn;
    let ws = ids.map(id => EQ.V[id]).filter(Boolean);
    // ưu tiên từ yếu / đến hạn
    ws.sort((a, b) => ((p.vocab[a.id] || {}).box || 0) - ((p.vocab[b.id] || {}).box || 0) + (Math.random() - 0.5));
    void L;
    return ws;
  }
  function distractors(w, pool, n) {
    const same = U.shuffle(pool.filter(x => x.id !== w.id && x.en !== w.en && x.t === w.t));
    const other = U.shuffle(pool.filter(x => x.id !== w.id && x.en !== w.en && x.t !== w.t));
    const extra = U.shuffle(EQ.VOCAB.filter(x => x.id !== w.id && x.en !== w.en && x.t === w.t));
    const out = [];
    same.concat(other, extra).forEach(x => { if (out.length < n && !out.some(o => o.en === x.en)) out.push(x); });
    return out;
  }
  // kiểu câu hỏi theo trình độ: nghĩa tiếng Việt, hình, hoặc nghe
  function promptFor(p, w) {
    const modes = ['vi'];
    if (w.pic) modes.push('pic', 'vi');
    if (EQ.speech.available() && p.diff >= 1.6) modes.push('listen');
    return U.pick(modes);
  }
  function record(p, w, ok, mode) {
    EQ.learn.record(p, { correct: ok, wordId: w.id, topic: w.t, key: 'w:' + w.id, text: w.en + ' = ' + w.vi, mode: mode || 'pic' });
  }

  // ---------- menu ----------
  A.open = function () {
    const p = EQ.game.profile;
    const srcs = A.sources(p);
    let src = srcs.find(s => s.ids.length >= 6) || srcs[srcs.length - 1];
    const body = el('div', { class: 'arcade-menu' });
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'am-head' }, [el('h2', null, '🎮 Khu vui chơi'), el('div', { class: 'muted small' }, 'Chơi vui mà vẫn ôn từ! Từ trả lời sai sẽ được nhắc lại sau.')]));
      const sel = el('select', { class: 'inp small', onchange: e => { src = srcs.find(s => s.id === e.target.value); draw(); } }, srcs.map(s => el('option', { value: s.id }, s.name)));
      sel.value = src.id;
      body.appendChild(el('div', { class: 'row' }, [el('b', null, 'Dùng từ:'), sel]));
      const enough = src.ids.length >= 6;
      if (!enough) body.appendChild(el('div', { class: 'note' }, src.id === 'unit' && src.all
        ? ['Unit này mới học ' + src.ids.length + ' từ. Cần ít nhất 6 từ đã học. ', el('button', { class: 'btn small primary', onclick: async () => { close(); await EQ.screens.learnWords(src.all.filter(i => !p.vocab[i]).slice(0, 8), 'Unit ' + p.schoolUnit[p.book]); A.open(); } }, '✨ Học 8 từ mới của Unit')]
        : 'Cần ít nhất 6 từ đã học. Hãy làm nhiệm vụ hoặc vào mục 📗 Sách để học từ trước nhé!'));
      p.arcade = p.arcade || {};
      body.appendChild(el('div', { class: 'am-grid' }, Object.keys(A.GAMES).map(id => {
        const g = A.GAMES[id];
        return el('button', { class: 'am-card ' + id, disabled: !enough, onclick: () => { close(); A.play(id, poolFrom(p, src.ids)); } }, [
          el('div', { class: 'am-icon' }, g.icon), el('div', { class: 'am-name' }, g.name), el('div', { class: 'am-desc' }, g.desc),
          el('div', { class: 'am-keys' }, '🎮 ' + g.keys), el('div', { class: 'am-best' }, '🏆 Kỷ lục: ' + (p.arcade[id] || 0))
        ]);
      })));
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };

  // ---------- khung chung cho mọi trò ----------
  A.play = function (id, pool) {
    const p = EQ.game.profile;
    const cv = el('canvas', { width: CW, height: CH, class: 'arcade-cv' });
    const ctx = cv.getContext('2d');
    const hud = el('div', { class: 'ar-hud' });
    const res = el('div', { class: 'ar-result hidden' });
    const body = el('div', { class: 'arcade' }, [hud, el('div', { class: 'ar-stage' }, [cv, res])]);
    let quit = false;
    const close = EQ.ui.modal(body, { cls: 'arcade-card', onEsc: () => end(true) });
    EQ.audio.music('battle');
    const keys = {};
    const kd = e => {
      const k = e.code;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].indexOf(k) >= 0) { e.preventDefault(); e.stopPropagation(); }
      if (!keys[k] && game.onKey) game.onKey(k, e);
      keys[k] = true;
    };
    const ku = e => { keys[e.code] = false; };
    window.addEventListener('keydown', kd, true);
    window.addEventListener('keyup', ku, true);
    const mouse = { x: 0, y: 0 };
    const toCanvas = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * CW, y: (e.clientY - r.top) / r.height * CH }; };
    cv.addEventListener('mousemove', e => { const m = toCanvas(e); mouse.x = m.x; mouse.y = m.y; mouse.moved = true; });
    cv.addEventListener('mousedown', e => { const m = toCanvas(e); mouse.x = m.x; mouse.y = m.y; if (game.onClick) game.onClick(m.x, m.y); });

    const S = { score: 0, coins: 0, correct: 0, total: 0, missed: [], t: 0, fx: [], shake: 0 };
    const api = {
      p, pool, ctx, keys, mouse, S,
      distractors: (w, n) => distractors(w, pool, n),
      promptFor: w => promptFor(p, w),
      answer: (w, ok, mode) => {
        S.total++;
        if (ok) { S.correct++; EQ.audio.sfx('correct'); } else { EQ.audio.sfx('wrong'); if (!S.missed.some(m => m.id === w.id)) S.missed.push(w); }
        record(p, w, ok, mode);
      },
      say: t => EQ.speech.speak(t),
      burst: (x, y, n, cols) => { for (let i = 0; i < (n || 20); i++) { const a = Math.random() * 7, s = 80 + Math.random() * 200; S.fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 100, life: 0.8 + Math.random() * 0.5, c: U.pick(cols || ['#ffd54f', '#ff80ab', '#80d8ff', '#b9f6ca', '#fff']), s: 3 + Math.random() * 4 }); } },
      float: (x, y, text, c) => S.fx.push({ x, y, text, c: c || '#fff59d', life: 1.2, vy: -40 }),
      finish: () => end(false),
      hud: html => { hud.innerHTML = html; }
    };
    const game = A.impl[id](api);
    let last = performance.now();
    function loop(now) {
      if (quit) return;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      S.t += dt;
      if (!S.paused) game.update(dt);
      ctx.save();
      if (S.shake > 0) { S.shake -= dt; ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8); }
      game.draw(ctx);
      // hiệu ứng
      S.fx.forEach(f => {
        f.life -= dt;
        if (f.text) { f.y += f.vy * dt; ctx.globalAlpha = Math.max(0, Math.min(1, f.life)); txt(ctx, f.text, f.x, f.y, 26, f.c, 'center'); }
        else { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 420 * dt; ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.c; ctx.fillRect(f.x, f.y, f.s, f.s); }
      });
      ctx.globalAlpha = 1;
      S.fx = S.fx.filter(f => f.life > 0);
      ctx.restore();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    async function end(aborted) {
      if (S.over) { if (aborted) cleanup(); return; }
      S.over = true;
      if (aborted && S.total === 0) return cleanup();
      const coins = S.correct * 2 + Math.floor(S.coins / 3);
      const xp = S.correct * 3;
      p.arcade = p.arcade || {};
      const best = p.arcade[id] || 0;
      const isBest = S.score > best;
      if (isBest) p.arcade[id] = S.score;
      await EQ.game.reward(p, { xp, gold: coins }, true);
      EQ.game.saveNow();
      res.classList.remove('hidden');
      res.innerHTML = '';
      res.appendChild(el('div', { class: 'ar-res-card' }, [
        el('div', { class: 'ar-big' }, aborted ? '⏸️ Dừng chơi' : (S.correct >= S.total * 0.8 ? '🏆 Tuyệt vời!' : '🎉 Hoàn thành!')),
        el('div', { class: 'ar-score' }, 'Điểm: ' + S.score + (isBest ? '  🆕 Kỷ lục mới!' : '')),
        el('div', null, '✅ Đúng ' + S.correct + '/' + S.total + '   •   +' + xp + ' XP   •   +' + coins + ' 🪙'),
        S.missed.length ? el('div', { class: 'ar-missed' }, [el('b', null, '📒 Ôn lại các từ này:'), el('div', null, S.missed.slice(0, 8).map(w => el('span', { class: 'ar-chip' }, [w.en + ' = ' + w.vi, EQ.challenge.speakBtn(w.en, '🔊', 'small')])))]) : el('div', { class: 'muted' }, 'Không sai từ nào. Giỏi quá!'),
        el('div', { class: 'row center' }, [
          el('button', { class: 'btn primary big', onclick: () => { cleanup(); A.play(id, U.shuffle(pool)); } }, '🔁 Chơi lại'),
          el('button', { class: 'btn', onclick: () => { cleanup(); A.open(); } }, '🎮 Trò khác'),
          el('button', { class: 'btn', onclick: () => cleanup() }, 'Thoát')
        ])
      ]));
    }
    function cleanup() {
      quit = true;
      window.removeEventListener('keydown', kd, true);
      window.removeEventListener('keyup', ku, true);
      close();
      EQ.audio.music(EQ.REGIONS[p.region].music);
    }
    A._cur = { api, game, end };
    return A._cur;
  };

  // ---------- tiện ích vẽ ----------
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function txt(c, s, x, y, size, col, align, stroke) {
    c.font = 'bold ' + size + 'px ' + FONT; c.textAlign = align || 'center'; c.textBaseline = 'middle';
    c.lineWidth = Math.max(3, size / 6); c.strokeStyle = stroke || 'rgba(20,10,40,.75)'; c.strokeText(s, x, y);
    c.fillStyle = col || '#fff'; c.fillText(s, x, y);
  }
  function fitText(c, s, maxW, size) { c.font = 'bold ' + size + 'px ' + FONT; while (size > 11 && c.measureText(s).width > maxW) { size--; c.font = 'bold ' + size + 'px ' + FONT; } return size; }
  function sky(c, top, bottom) { const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, top); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, CW, CH); }
  function cloud(c, x, y, s) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x, y, 18 * s, 0, 7); c.arc(x + 20 * s, y - 10 * s, 22 * s, 0, 7); c.arc(x + 44 * s, y, 18 * s, 0, 7); c.fillRect(x, y, 44 * s, 18 * s); c.fill(); }
  // bảng câu hỏi phía trên
  function promptBar(c, w, mode, t, extra) {
    c.save();
    c.fillStyle = 'rgba(25,15,60,.82)'; rr(c, 150, 8, CW - 300, 62, 16); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; c.stroke();
    if (mode === 'pic') {
      c.font = '42px ' + EMO(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(w.e, CW / 2 - 120, 40);
      txt(c, 'Tìm từ tiếng Anh của hình này', CW / 2 + 40, 40, 20, '#fff59d');
    } else if (mode === 'listen') {
      txt(c, '🔊 Nghe và chọn từ đúng (bấm phím L để nghe lại)', CW / 2, 40, 19, '#80d8ff');
    } else {
      const s = fitText(c, w.vi, CW - 360, 30);
      txt(c, w.vi, CW / 2, 40, s, '#fff59d');
    }
    if (extra) txt(c, extra, CW - 160, 88, 15, '#fff', 'right');
    c.restore();
  }
  A.util = { rr, txt, fitText, sky, cloud, promptBar };

  A.impl = {};

  // =================== 1. ĐUA XE TỪ VỰNG ===================
  A.impl.race = function (api) {
    const { S, keys, p } = api;
    const ROAD_X = 250, LANE_W = 128, LANES = 3, CAR_Y = 400;
    const words = api.pool.slice(0, 12);
    let gi = 0;
    const st = { lane: 1, x: ROAD_X + LANE_W * 1.5, speed: 240, boost: 0, slow: 0, dist: 0, gates: [], obst: [], coins: [], nextGate: 1.2, scroll: 0, prompt: null, msg: null, msgT: 0, done: false, tilt: 0 };
    function newGate() {
      if (gi >= words.length) return;
      const w = words[gi++];
      const ds = api.distractors(w, 2);
      const opts = U.shuffle([w].concat(ds));
      const mode = api.promptFor(w);
      st.gates.push({ y: -120, w, opts, mode, done: false });
      st.prompt = { w, mode };
      if (mode === 'listen') api.say(w.en);
    }
    function laneX(l) { return ROAD_X + LANE_W * (l + 0.5); }
    api.game_onKey = null;
    const g = {
      onKey(k) {
        if (k === 'ArrowLeft' || k === 'KeyA') st.lane = Math.max(0, st.lane - 1);
        if (k === 'ArrowRight' || k === 'KeyD') st.lane = Math.min(LANES - 1, st.lane + 1);
        if (k === 'KeyL' && st.prompt) api.say(st.prompt.w.en);
      },
      onClick(x) { if (x < st.x - 20) st.lane = Math.max(0, st.lane - 1); else if (x > st.x + 20) st.lane = Math.min(LANES - 1, st.lane + 1); },
      update(dt) {
        const target = laneX(st.lane);
        st.tilt = (target - st.x) * 0.01;
        st.x += (target - st.x) * Math.min(1, dt * 10);
        let sp = st.speed * (st.boost > 0 ? 1.6 : 1) * (st.slow > 0 ? 0.55 : 1);
        st.boost -= dt; st.slow -= dt; st.msgT -= dt;
        st.scroll += sp * dt; st.dist += sp * dt;
        // cổng câu hỏi: chỉ có 1 cổng trên đường mỗi lúc → bé tập trung
        if (!st.gates.some(x => !x.done)) { st.nextGate -= dt; if (st.nextGate <= 0) { newGate(); st.nextGate = 1.4; } }
        st.gates.forEach(gt => {
          gt.y += sp * dt * 0.75; // cổng tiến chậm hơn để kịp đọc
          if (!gt.done && gt.y >= CAR_Y - 40) {
            gt.done = true;
            const chosen = gt.opts[st.lane];
            const ok = chosen.id === gt.w.id;
            api.answer(gt.w, ok, 'pic');
            if (ok) { S.score += 100 + (st.boost > 0 ? 30 : 0); st.boost = 1.4; st.speed = Math.min(380, st.speed + 8); api.burst(st.x, CAR_Y, 26); api.float(st.x, CAR_Y - 60, '+100 ✓ ' + gt.w.en, '#b9f6ca'); api.say(gt.w.en); }
            else { st.slow = 1.2; S.shake = 0.35; st.msg = '✗ Đúng là: ' + gt.w.en + ' = ' + gt.w.vi; st.msgT = 2.4; api.float(st.x, CAR_Y - 60, '✗', '#ff8a80'); api.say(gt.w.en); }
            st.prompt = null;
          }
        });
        st.gates = st.gates.filter(gt => gt.y < CH + 80);
        // chướng ngại & xu giữa các cổng
        if (Math.random() < dt * 0.8 && !st.gates.some(x => !x.done && x.y < 160)) st.obst.push({ lane: U.randi(0, 2), y: -40, kind: U.pick(['cone', 'oil', 'cone']) });
        if (Math.random() < dt * 1.6) st.coins.push({ lane: U.randi(0, 2), y: -30 });
        st.obst.forEach(o => { o.y += sp * dt; if (!o.hit && Math.abs(o.y - CAR_Y) < 30 && o.lane === st.lane) { o.hit = true; st.slow = 0.8; S.shake = 0.2; EQ.audio.sfx('bump'); } });
        st.coins.forEach(o => { o.y += sp * dt; if (!o.got && Math.abs(o.y - CAR_Y) < 30 && o.lane === st.lane) { o.got = true; S.coins++; S.score += 10; EQ.audio.sfx('coin'); } });
        st.obst = st.obst.filter(o => o.y < CH + 40); st.coins = st.coins.filter(o => o.y < CH + 40 && !o.got);
        if (gi >= words.length && !st.gates.length && !st.done) { st.done = true; setTimeout(api.finish, 600); }
        api.hud('<b>🏎️ Đua xe từ vựng</b><span>Cổng ' + Math.min(gi, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>🪙 ' + S.coins + '</span><span>⭐ ' + S.score + '</span>');
      },
      draw(c) {
        // cỏ & cảnh hai bên đường
        c.fillStyle = '#5cb85c'; c.fillRect(0, 0, CW, CH);
        const off = st.scroll % 80;
        for (let y = -80; y < CH + 80; y += 80) {
          c.fillStyle = '#4ea84e'; c.fillRect(0, y + off, ROAD_X - 20, 40); c.fillRect(ROAD_X + LANE_W * 3 + 20, y + off + 40, CW, 40);
        }
        for (let i = 0; i < 8; i++) {
          const y = ((i * 140 + st.scroll * 1.0) % (CH + 140)) - 70;
          const side = i % 2 ? 60 : CW - 90;
          c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(side + 10, y + 34, 26, 8, 0, 0, 7); c.fill();
          c.fillStyle = '#2f7d32'; c.beginPath(); c.arc(side, y, 30, 0, 7); c.fill();
          c.fillStyle = '#43a047'; c.beginPath(); c.arc(side - 8, y - 8, 18, 0, 7); c.fill();
          if (i % 3 === 0) { c.font = '28px ' + EMO(); c.textAlign = 'center'; c.fillText(U.pick ? ['🏠', '🏫', '🏪'][i % 3] : '🏠', i % 2 ? 160 : CW - 170, y + 40); }
        }
        // đường
        c.fillStyle = '#3d3f4d'; c.fillRect(ROAD_X - 14, 0, LANE_W * 3 + 28, CH);
        c.fillStyle = '#e8e8e8'; for (let y = -40 + (st.scroll % 40); y < CH; y += 40) { c.fillRect(ROAD_X - 14, y, 8, 20); c.fillRect(ROAD_X + LANE_W * 3 + 6, y, 8, 20); }
        c.fillStyle = '#f2c94c'; for (let l = 1; l < 3; l++) for (let y = -60 + (st.scroll % 60); y < CH; y += 60) c.fillRect(ROAD_X + LANE_W * l - 3, y, 6, 30);
        // xu & chướng ngại
        st.coins.forEach(o => { const x = laneX(o.lane); c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(x, o.y, 11, 0, 7); c.fill(); c.fillStyle = '#ffb300'; c.beginPath(); c.arc(x, o.y, 7, 0, 7); c.fill(); });
        st.obst.forEach(o => {
          const x = laneX(o.lane);
          if (o.kind === 'cone') { c.fillStyle = '#ff7043'; c.beginPath(); c.moveTo(x, o.y - 20); c.lineTo(x + 14, o.y + 12); c.lineTo(x - 14, o.y + 12); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 8, o.y - 2, 16, 4); }
          else { c.fillStyle = 'rgba(20,10,40,.7)'; c.beginPath(); c.ellipse(x, o.y, 30, 12, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(160,120,255,.4)'; c.beginPath(); c.ellipse(x - 6, o.y - 3, 10, 3, 0, 0, 7); c.fill(); }
        });
        // cổng
        st.gates.forEach(gt => {
          for (let l = 0; l < 3; l++) {
            const x = ROAD_X + LANE_W * l + 6, w = LANE_W - 12;
            const cols = ['#7c4dff', '#00acc1', '#ff7043'];
            c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, x + 4, gt.y + 6, w, 46, 12); c.fill();
            c.fillStyle = gt.done ? (gt.opts[l].id === gt.w.id ? '#2eb872' : 'rgba(120,120,140,.8)') : cols[l]; rr(c, x, gt.y, w, 46, 12); c.fill();
            c.fillStyle = 'rgba(255,255,255,.25)'; rr(c, x + 4, gt.y + 4, w - 8, 12, 6); c.fill();
            const s = fitText(c, gt.opts[l].en, w - 12, 22);
            txt(c, gt.opts[l].en, x + w / 2, gt.y + 26, s, '#fff');
            c.fillStyle = '#555'; c.fillRect(x + 2, gt.y + 44, 5, 22); c.fillRect(x + w - 7, gt.y + 44, 5, 22);
          }
        });
        // xe
        c.save(); c.translate(st.x, CAR_Y); c.rotate(st.tilt);
        if (st.boost > 0) { for (let i = 0; i < 4; i++) { c.fillStyle = ['#fff59d', '#ffb74d', '#ff7043', '#ffd54f'][i]; c.beginPath(); c.ellipse(U.rand(-10, 10), 46 + i * 9, 8 - i, 12 - i * 2, 0, 0, 7); c.fill(); } }
        c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, -28, -40, 60, 86, 16); c.fill();
        c.fillStyle = '#222'; [[-30, -26], [22, -26], [-30, 18], [22, 18]].forEach(q => rr(c, q[0], q[1], 10, 20, 3)); c.fill();
        const body = c.createLinearGradient(-26, 0, 26, 0); body.addColorStop(0, '#d81b60'); body.addColorStop(0.5, '#ff4081'); body.addColorStop(1, '#c2185b');
        c.fillStyle = body; rr(c, -26, -44, 52, 88, 18); c.fill();
        c.fillStyle = '#4fc3f7'; rr(c, -18, -26, 36, 20, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(-14, -24, 10, 4);
        c.fillStyle = '#ad1457'; rr(c, -18, 6, 36, 22, 6); c.fill();
        c.fillStyle = '#fff59d'; c.fillRect(-20, -44, 10, 5); c.fillRect(10, -44, 10, 5);
        c.fillStyle = '#fff'; c.font = 'bold 14px ' + FONT; c.textAlign = 'center'; c.fillText('★', 0, 22);
        c.restore();
        if (st.prompt) promptBar(c, st.prompt.w, st.prompt.mode, S.t);
        g._st = st;
        if (st.msg && st.msgT > 0) { c.fillStyle = 'rgba(183,28,28,.85)'; rr(c, 180, CH - 60, CW - 360, 44, 12); c.fill(); txt(c, st.msg, CW / 2, CH - 38, fitText(c, st.msg, CW - 380, 20), '#fff'); }
      }
    };
    return g;
  };

  // =================== 2. HỨNG CHỮ ===================
  A.impl.catch = function (api) {
    const { S, keys, mouse } = api;
    const words = api.pool.filter(w => /^[a-z]{3,9}$/i.test(w.en)).slice(0, 6);
    if (words.length < 3) words.push.apply(words, api.pool.filter(w => /^[a-z ]{3,12}$/i.test(w.en)).slice(0, 6));
    let wi = -1;
    const st = { x: CW / 2, w: null, got: 0, letters: [], spawn: 0, hearts: 5, errs: 0, speed: 135, done: false, mode: 'vi', flash: 0 };
    function next() {
      wi++;
      if (wi >= words.length) { st.done = true; setTimeout(api.finish, 500); return; }
      st.w = words[wi]; st.got = 0; st.errs = 0; st.hearts = 3; st.letters = []; st.mode = st.w.pic ? U.pick(['vi', 'pic']) : 'vi';
      skipSpaces();
    }
    function need() { return st.w.en.toLowerCase().charAt(st.got); }
    function skipSpaces() { while (st.w && need() === ' ') st.got++; }
    next();
    const g = {
      onKey(k) { if (k === 'KeyL' && st.w) api.say(st.w.en); },
      update(dt) {
        if (st.done) return;
        if (keys.ArrowLeft || keys.KeyA) st.x -= 420 * dt;
        if (keys.ArrowRight || keys.KeyD) st.x += 420 * dt;
        if (mouse.moved) { st.x += (mouse.x - st.x) * Math.min(1, dt * 12); }
        st.x = U.clamp(st.x, 50, CW - 50);
        st.flash -= dt;
        st.spawn -= dt;
        if (st.spawn <= 0) {
          st.spawn = 0.75;
          const correctOnScreen = st.letters.some(l => l.ch === need() && l.y < CH - 120);
          const ch = (!correctOnScreen || Math.random() < 0.45) ? need() : String.fromCharCode(97 + U.randi(0, 25));
          st.letters.push({ ch, x: U.rand(60, CW - 60), y: 70, vy: st.speed + U.rand(0, 30), rot: U.rand(-0.3, 0.3), col: U.pick(['#7c4dff', '#00acc1', '#ff7043', '#43a047', '#ec407a', '#fbc02d']) });
        }
        st.letters.forEach(l => {
          l.y += l.vy * dt;
          if (!l.gone && l.y > CH - 70 && l.y < CH - 30 && Math.abs(l.x - st.x) < 52) {
            l.gone = true;
            if (l.ch === need()) {
              st.got++; S.score += 20; EQ.audio.sfx('pick'); api.burst(l.x, l.y, 10);
              skipSpaces();
              if (st.got >= st.w.en.length) {
                const ok = st.errs === 0;
                api.answer(st.w, ok, 'type');
                S.score += 100 + (ok ? 50 : 0); api.float(CW / 2, CH / 2, '✓ ' + st.w.en, '#b9f6ca'); api.say(st.w.en); api.burst(CW / 2, CH / 2, 40);
                st.speed = Math.min(200, st.speed + 8);
                next();
              }
            } else { st.errs++; st.hearts--; st.flash = 0.4; S.shake = 0.2; EQ.audio.sfx('wrong'); api.float(l.x, l.y - 30, '✗ ' + l.ch, '#ff8a80'); if (st.hearts <= 0) { api.answer(st.w, false, 'type'); api.float(CW / 2, CH / 2, 'Từ đúng: ' + st.w.en + ' = ' + st.w.vi, '#fff59d'); api.say(st.w.en); next(); } }
          }
        });
        st.letters = st.letters.filter(l => !l.gone && l.y < CH + 40);
        api.hud('<b>🧺 Hứng chữ</b><span>Từ ' + Math.min(wi + 1, words.length) + '/' + words.length + '</span><span>' + '❤️'.repeat(Math.max(0, st.hearts)) + '</span><span>⭐ ' + S.score + '</span>');
      },
      draw(c) {
        sky(c, '#8fd3ff', '#e3f6ff');
        const t = S.t;
        cloud(c, (t * 20) % (CW + 200) - 100, 120, 1.2); cloud(c, (t * 12 + 400) % (CW + 200) - 100, 200, 0.9);
        c.fillStyle = '#7cc35a'; c.fillRect(0, CH - 40, CW, 40); c.fillStyle = '#5fae3e'; c.fillRect(0, CH - 40, CW, 6);
        if (st.w) {
          promptBar(c, st.w, st.mode, t);
          // ô chữ
          const L = st.w.en.length, bw = Math.min(46, (CW - 200) / L);
          const sx = CW / 2 - L * bw / 2;
          for (let i = 0; i < L; i++) {
            const ch = st.w.en.charAt(i);
            if (ch === ' ') continue;
            c.fillStyle = i < st.got ? '#2eb872' : 'rgba(255,255,255,.9)'; rr(c, sx + i * bw + 3, 80, bw - 6, 44, 8); c.fill();
            c.strokeStyle = '#3b2d6b'; c.lineWidth = 2; c.stroke();
            if (i < st.got) txt(c, ch, sx + i * bw + bw / 2, 103, 26, '#fff');
            else if (i === st.got) { c.fillStyle = 'rgba(124,77,255,' + (0.4 + 0.3 * Math.sin(t * 6)) + ')'; c.fillRect(sx + i * bw + 8, 116, bw - 16, 4); }
          }
        }
        st.letters.forEach(l => {
          c.save(); c.translate(l.x, l.y); c.rotate(l.rot);
          c.fillStyle = 'rgba(0,0,0,.2)'; rr(c, -22, -18, 46, 46, 10); c.fill();
          c.fillStyle = l.col; rr(c, -24, -24, 48, 48, 10); c.fill();
          c.fillStyle = 'rgba(255,255,255,.3)'; rr(c, -20, -20, 40, 12, 6); c.fill();
          txt(c, l.ch, 0, 2, 30, '#fff');
          c.restore();
        });
        // giỏ
        const bx = st.x, by = CH - 56;
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(bx, CH - 28, 56, 10, 0, 0, 7); c.fill();
        c.fillStyle = '#a0632f'; c.beginPath(); c.moveTo(bx - 56, by - 14); c.lineTo(bx + 56, by - 14); c.lineTo(bx + 42, by + 26); c.lineTo(bx - 42, by + 26); c.closePath(); c.fill();
        c.strokeStyle = '#7a4520'; c.lineWidth = 3; for (let i = -40; i <= 40; i += 16) { c.beginPath(); c.moveTo(bx + i, by - 12); c.lineTo(bx + i * 0.78, by + 24); c.stroke(); }
        c.fillStyle = '#c98a4f'; c.fillRect(bx - 58, by - 18, 116, 8);
        if (st.flash > 0) { c.fillStyle = 'rgba(255,60,60,' + st.flash + ')'; c.fillRect(0, 0, CW, CH); }
        g._st = st;
      }
    };
    return g;
  };

  // =================== 3. VƯỢT CHƯỚNG NGẠI (kiểu Roblox obby) ===================
  A.impl.obby = function (api) {
    const { S, keys, p } = api;
    const GRAV = 1900, JUMP = 720, RUN = 250;
    const words = api.pool.slice(0, 6);
    const plats = [], coins = [], qzones = [], blocks = [];
    let x = 0;
    const COLS = ['#ff5252', '#ffab40', '#ffd740', '#69f0ae', '#40c4ff', '#b388ff', '#ff80ab'];
    function plat(px, py, w, opt) { const o = Object.assign({ x: px, y: py, w, h: 24, col: U.pick(COLS) }, opt || {}); plats.push(o); return o; }
    // đường đi: đoạn nhảy + vùng câu hỏi
    plat(0, 400, 360, { col: '#8bc34a', start: true });
    x = 360;
    words.forEach((w, i) => {
      for (let k = 0; k < 3; k++) {
        const gap = 70 + Math.random() * 60 + i * 6, y = 300 + Math.random() * 120;
        x += gap;
        const moving = k === 1 && i >= 2;
        const pl = plat(x, y, 110 + Math.random() * 40, moving ? { mv: { ax: 0, ay: 60, sp: 1.6 + Math.random(), y0: y } } : null);
        coins.push({ x: pl.x + pl.w / 2, y: pl.y - 40 });
        x += pl.w;
      }
      // cột mốc trước câu hỏi
      x += 80;
      const cp = plat(x, 380, 170, { col: '#8bc34a', checkpoint: i });
      const ds = api.distractors(w, 2);
      const opts = U.shuffle([w].concat(ds));
      // khối hỏi chấm phía trên cột mốc: nhảy lên húc vào khối có từ đúng → cầu hiện ra
      cp.w = 460;
      const zone = { w, opts, cp, mode: api.promptFor(w), blocks: [], answered: false, i };
      opts.forEach((o, j) => zone.blocks.push({ x: cp.x + 50 + j * 140, y: cp.y - 140, w: 116, h: 40, answer: o, zone, bump: 0 }));
      blocks.push.apply(blocks, zone.blocks);
      qzones.push(zone);
      x = cp.x + cp.w;
      zone.bridge = plat(x, 380, 270, { col: '#ffd740', hidden: true });
      x += 270;
      plat(x, 360, 160, { col: '#8bc34a', after: i });
      x += 160;
    });
    plat(x + 80, 380, 260, { col: '#ffd740', finish: true });
    const endX = x + 80 + 130;

    const pl = { x: 80, y: 300, vx: 0, vy: 0, w: 26, h: 44, on: null, coyote: 0, jbuf: 0, face: 1, anim: 0 };
    let cpx = 80, cpy = 300, camX = 0, zoneNow = null, falls = 0, finished = false;
    function respawn() { pl.x = cpx; pl.y = cpy; pl.vx = 0; pl.vy = 0; falls++; EQ.audio.sfx('bump'); api.float(pl.x - camX, 200, 'Oops! Thử lại nhé', '#fff'); }
    const g = {
      onKey(k) { if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') pl.jbuf = 0.15; if (k === 'KeyL' && zoneNow) api.say(zoneNow.w.en); },
      update(dt) {
        if (finished) return;
        const left = keys.ArrowLeft || keys.KeyA, right = keys.ArrowRight || keys.KeyD;
        pl.vx = (right ? RUN : 0) - (left ? RUN : 0);
        if (pl.vx) pl.face = Math.sign(pl.vx);
        pl.anim += Math.abs(pl.vx) * dt * 0.04;
        pl.jbuf -= dt; pl.coyote -= dt;
        if (pl.jbuf > 0 && pl.coyote > 0) { pl.vy = -JUMP; pl.jbuf = 0; pl.coyote = 0; EQ.audio.sfx('click'); }
        pl.vy += GRAV * dt; pl.vy = Math.min(pl.vy, 1100);
        // bục di chuyển
        plats.forEach(q => { if (q.mv) { const ny = q.mv.y0 + Math.sin(S.t * q.mv.sp) * q.mv.ay; q.dy = ny - q.y; q.y = ny; } if (q.falling) { q.vy = (q.vy || 0) + GRAV * dt; q.y += q.vy * dt; } });
        pl.x += pl.vx * dt;
        const prevBottom = pl.y + pl.h;
        pl.y += pl.vy * dt;
        pl.on = null;
        plats.forEach(q => {
          if (q.hidden) return;
          if (pl.x + pl.w / 2 > q.x && pl.x - pl.w / 2 < q.x + q.w && pl.vy >= 0 && prevBottom <= q.y + 8 + Math.abs(q.dy || 0) && pl.y + pl.h >= q.y) {
            pl.y = q.y - pl.h; pl.vy = 0; pl.on = q; pl.coyote = 0.1;
          }
        });
        // húc đầu vào khối đáp án
        blocks.forEach(bk => {
          bk.bump = Math.max(0, bk.bump - dt * 4);
          if (pl.vy < 0 && pl.x + pl.w / 2 > bk.x && pl.x - pl.w / 2 < bk.x + bk.w && pl.y <= bk.y + bk.h && pl.y >= bk.y + bk.h - 26) {
            pl.y = bk.y + bk.h; pl.vy = 160; bk.bump = 1;
            const z = bk.zone;
            if (z.answered || bk.used) return;
            const ok = bk.answer.id === z.w.id;
            if (ok) {
              z.answered = true; bk.ok = true; z.bridge.hidden = false; api.answer(z.w, !z.wrongOnce, 'pic');
              S.score += z.wrongOnce ? 60 : 150; api.burst(bk.x + bk.w / 2 - camX, bk.y, 30); api.float(bk.x + bk.w / 2 - camX, bk.y - 30, '✓ ' + z.w.en, '#b9f6ca'); api.say(z.w.en); EQ.audio.sfx('chest');
            } else {
              bk.used = true; S.shake = 0.2; EQ.audio.sfx('wrong');
              if (!z.wrongOnce) { z.wrongOnce = true; api.answer(z.w, false, 'pic'); }
              api.float(bk.x + bk.w / 2 - camX, bk.y - 30, '✗ ' + bk.answer.en + ' = ' + bk.answer.vi, '#ff8a80');
            }
          }
        });
        // điểm hồi sinh
        if (pl.on && (pl.on.checkpoint != null)) { cpx = pl.on.x + 40; cpy = pl.on.y - 60; zoneNow = qzones[pl.on.checkpoint]; if (!zoneNow.shown) { zoneNow.shown = true; if (zoneNow.mode === 'listen') api.say(zoneNow.w.en); } }
        if (pl.on && pl.on.after != null) { cpx = pl.on.x + 40; cpy = pl.on.y - 60; zoneNow = null; }
        if (pl.on && pl.on.finish && !finished) { finished = true; S.score += Math.max(0, 300 - falls * 20); api.burst(CW / 2, CH / 2, 60); EQ.audio.sfx('victory'); setTimeout(api.finish, 900); }
        coins.forEach(cn => { if (!cn.got && Math.abs(cn.x - pl.x) < 24 && Math.abs(cn.y - (pl.y + 20)) < 34) { cn.got = true; S.coins++; S.score += 10; EQ.audio.sfx('coin'); } });
        if (pl.y > CH + 120) respawn();
        if (pl.x < 20) pl.x = 20;
        camX += (pl.x - 300 - camX) * Math.min(1, dt * 6);
        camX = Math.max(0, camX);
        const done = qzones.filter(z => z.answered).length;
        api.hud('<b>🧗 Vượt chướng ngại</b><span>Câu ' + done + '/' + qzones.length + '</span><span>🪙 ' + S.coins + '</span><span>⭐ ' + S.score + '</span><span class="muted">Rơi: ' + falls + '</span>');
      },
      draw(c) {
        sky(c, '#5ec8ff', '#d8f3ff');
        // núi xa (thị sai)
        c.fillStyle = '#9ad3a5'; for (let i = -1; i < 6; i++) { const bx = i * 260 - (camX * 0.2) % 260; c.beginPath(); c.moveTo(bx, CH); c.lineTo(bx + 130, 230); c.lineTo(bx + 260, CH); c.fill(); }
        c.fillStyle = '#6cc07d'; for (let i = -1; i < 8; i++) { const bx = i * 180 - (camX * 0.45) % 180; c.beginPath(); c.arc(bx + 90, CH + 40, 120, Math.PI, 0); c.fill(); }
        cloud(c, 120 - (camX * 0.1) % 1000, 90, 1); cloud(c, 620 - (camX * 0.1) % 1000, 60, 1.3);
        c.save(); c.translate(-Math.round(camX), 0);
        plats.forEach(q => {
          if (q.hidden || q.x - camX > CW + 50 || q.x + q.w - camX < -50) return;
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(q.x + 6, q.y + 8, q.w, q.h);
          c.fillStyle = q.col; c.fillRect(q.x, q.y, q.w, q.h);
          c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(q.x, q.y, q.w, 5);
          c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(q.x, q.y + q.h - 5, q.w, 5);
          // núm kiểu khối xếp hình
          for (let sx = q.x + 10; sx < q.x + q.w - 8; sx += 22) { c.fillStyle = 'rgba(255,255,255,.28)'; c.beginPath(); c.arc(sx, q.y + 12, 5, 0, 7); c.fill(); }
          if (q.checkpoint != null) { c.fillStyle = '#795548'; c.fillRect(q.x + 20, q.y - 60, 4, 60); c.fillStyle = '#e53935'; c.beginPath(); c.moveTo(q.x + 24, q.y - 60); c.lineTo(q.x + 54, q.y - 50); c.lineTo(q.x + 24, q.y - 40); c.fill(); }
          if (q.finish) { c.font = '46px ' + EMO(); c.textAlign = 'center'; c.fillText('🏁', q.x + q.w / 2, q.y - 30); }
        });
        blocks.forEach(bk => {
          if (bk.x - camX > CW + 50 || bk.x + bk.w - camX < -50) return;
          const by = bk.y - Math.sin(bk.bump * Math.PI) * 10;
          c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(bk.x + 5, by + 6, bk.w, bk.h);
          c.fillStyle = bk.ok ? '#2eb872' : bk.used ? '#e57373' : '#ffb300'; c.fillRect(bk.x, by, bk.w, bk.h);
          c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bk.x, by, bk.w, 5); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(bk.x, by + bk.h - 5, bk.w, 5);
          const s2 = fitText(c, bk.answer.en, bk.w - 10, 20);
          txt(c, bk.answer.en, bk.x + bk.w / 2, by + bk.h / 2 + 1, s2, '#fff');
          if (!bk.ok && !bk.used && !bk.zone.answered) txt(c, '?', bk.x + bk.w / 2, by - 12, 16, '#fff59d');
        });
        qzones.forEach(z => { if (!z.answered) { const bx = z.bridge.x; c.fillStyle = 'rgba(255,215,64,.25)'; for (let k = 0; k < z.bridge.w; k += 30) c.fillRect(bx + k, z.bridge.y, 18, 6); } });
        coins.forEach(cn => { if (cn.got) return; const sc = Math.abs(Math.cos(S.t * 4 + cn.x)); c.fillStyle = '#ffd54f'; c.beginPath(); c.ellipse(cn.x, cn.y, 10 * sc + 2, 11, 0, 0, 7); c.fill(); c.fillStyle = '#ffb300'; c.beginPath(); c.ellipse(cn.x, cn.y, 6 * sc + 1, 7, 0, 0, 7); c.fill(); });
        // nhân vật (dùng ngoại hình của bé)
        EQ.sprites.human(c, pl.x, pl.y + pl.h + 2, EQ.sprites.playerLook(p.avatar), pl.face > 0 ? 'right' : 'left', Math.floor(pl.anim), { scale: 2.4, moving: !!pl.vx && !!pl.on });
        c.restore();
        if (zoneNow && !zoneNow.answered) promptBar(c, zoneNow.w, zoneNow.mode, S.t, 'Nhảy lên húc vào khối có từ đúng để mở cầu!');
        g._st = { pl, qzones, blocks, plats };
        const pr = Math.min(1, pl.x / endX);
        c.fillStyle = 'rgba(0,0,0,.3)'; rr(c, 20, CH - 22, CW - 40, 10, 5); c.fill(); c.fillStyle = '#ffd740'; rr(c, 20, CH - 22, (CW - 40) * pr, 10, 5); c.fill();
      }
    };
    return g;
  };

  // =================== 4. BẮN BÓNG BAY ===================
  A.impl.balloon = function (api) {
    const { S, p } = api;
    const words = api.pool.slice(0, 10);
    let wi = -1;
    const st = { w: null, mode: 'vi', balloons: [], tries: 0, done: false, wait: 0 };
    const COLS = [['#ff5252', '#c62828'], ['#448aff', '#1565c0'], ['#ffd740', '#f9a825'], ['#69f0ae', '#2e7d32'], ['#e040fb', '#8e24aa'], ['#ff6e40', '#d84315']];
    function next() {
      wi++;
      if (wi >= words.length) { st.done = true; setTimeout(api.finish, 600); return; }
      st.w = words[wi]; st.mode = api.promptFor(st.w); st.tries = 0;
      const opts = U.shuffle([st.w].concat(api.distractors(st.w, 3)));
      st.balloons = opts.map((o, i) => ({ w: o, x: 130 + i * ((CW - 260) / 3), y: CH - 90 + (i % 2) * 40, vy: -(30 + Math.random() * 14), sway: Math.random() * 6, col: COLS[(i + wi) % COLS.length], pop: 0, key: i + 1 }));
      if (st.mode === 'listen') api.say(st.w.en);
    }
    next();
    function hit(b) {
      if (b.pop || st.wait > 0) return;
      const ok = b.w.id === st.w.id;
      if (ok) {
        b.pop = 1; EQ.audio.sfx('spell'); api.burst(b.x, b.y, 40);
        api.answer(st.w, st.tries === 0, 'pic');
        S.score += st.tries === 0 ? 100 : 40; api.float(b.x, b.y - 40, '✓ ' + st.w.en, '#b9f6ca'); api.say(st.w.en);
        st.wait = 1.0;
      } else {
        st.tries++; b.pop = 1; b.wrong = true; S.shake = 0.15; EQ.audio.sfx('wrong');
        api.float(b.x, b.y - 40, '✗ ' + b.w.en + ' = ' + b.w.vi, '#ff8a80');
        if (st.tries === 1) api.answer(st.w, false, 'pic');
      }
    }
    const g = {
      onKey(k) { if (/^Digit[1-4]$/.test(k)) { const b = st.balloons.find(x => x.key === +k.slice(5)); if (b) hit(b); } if (k === 'KeyL' && st.w) api.say(st.w.en); },
      onClick(x, y) { const b = st.balloons.find(q => !q.pop && Math.hypot(q.x - x, q.y - y) < 58); if (b) hit(b); },
      update(dt) {
        if (st.done) return;
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) next(); }
        st.balloons.forEach(b => {
          if (b.pop) { b.pop += dt * 3; return; }
          b.y += b.vy * dt; b.x += Math.sin(S.t * 1.3 + b.sway) * 18 * dt;
          if (b.y < 150) { b.vy = Math.abs(b.vy) * 0.3; } // lơ lửng ở trên, không bay mất
          if (b.y > CH - 40 && b.vy > 0) b.vy = -Math.abs(b.vy);
        });
        api.hud('<b>🎈 Bắn bóng bay</b><span>Câu ' + Math.min(wi + 1, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>');
      },
      draw(c) {
        sky(c, '#ffd3e8', '#c7ecff');
        const t = S.t;
        c.fillStyle = 'rgba(255,240,150,.9)'; c.beginPath(); c.arc(760, 110, 46, 0, 7); c.fill();
        cloud(c, (t * 15) % (CW + 200) - 120, 150, 1.1); cloud(c, (t * 9 + 500) % (CW + 200) - 120, 230, 0.8);
        c.fillStyle = '#7cc35a'; c.fillRect(0, CH - 30, CW, 30);
        st.balloons.forEach(b => {
          if (b.pop >= 1.6) return;
          c.save();
          if (b.pop) { c.globalAlpha = Math.max(0, 1.6 - b.pop); c.translate(b.x, b.y); c.scale(1 + b.pop * 0.6, 1 + b.pop * 0.6); c.translate(-b.x, -b.y); }
          c.strokeStyle = 'rgba(60,60,80,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(b.x, b.y + 58); c.quadraticCurveTo(b.x + 10, b.y + 90, b.x - 4, b.y + 120); c.stroke();
          const gr = c.createRadialGradient(b.x - 18, b.y - 22, 6, b.x, b.y, 64);
          gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.18, b.col[0]); gr.addColorStop(1, b.col[1]);
          c.fillStyle = gr; c.beginPath(); c.ellipse(b.x, b.y, 54, 60, 0, 0, 7); c.fill();
          c.fillStyle = b.col[1]; c.beginPath(); c.moveTo(b.x - 7, b.y + 64); c.lineTo(b.x + 7, b.y + 64); c.lineTo(b.x, b.y + 56); c.fill();
          const s = fitText(c, b.w.en, 96, 22);
          txt(c, b.w.en, b.x, b.y, s, '#fff');
          txt(c, String(b.key), b.x, b.y + 32, 13, 'rgba(255,255,255,.85)');
          c.restore();
        });
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Bấm vào quả bóng có từ đúng');
        g._st = st; g._hit = hit;
      }
    };
    return g;
  };

  EQ.arcade = A;
})();
