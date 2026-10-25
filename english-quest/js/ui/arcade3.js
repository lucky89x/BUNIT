/* ENGLISH QUEST – TRÒ CHƠI TRÊN BẢN ĐỒ (bản 1.7)
 * Mỗi trò có một quầy riêng đặt trên bản đồ (đi tới và bấm E / Space để chơi), cũng có trong 🎮 Khu vui chơi (phím G).
 *  🐞 Pháo đài côn trùng (Rừng)      – bấm vào con bọ mang từ đúng để pháo bắn hạ trước khi nó vào thành
 *  🍬 Tiệm kẹo chữ (Làng)            – bấm viên kẹo có từ đúng; kẹo cùng màu dính nhau nổ theo chùm
 *  ✈️ Phi công chữ (Rừng)            – lái máy bay bắn đám mây mang từ đúng, né bọ bay
 *  🚙 Xe leo đồi (Làng)              – lái xe qua đồi, tới trạm xăng chọn cây xăng có từ đúng để đổ xăng
 *  🏴‍☠️ Kho báu cướp biển (Làng)      – đào ô cát có từ đúng để tìm kho báu (coi chừng bom!)
 *  🤖 Đấu trường robot (Lâu đài)     – chạy, nhảy, bắn laser vào robot mang từ đúng
 * Trang bị có tác dụng thật (EQ.rpg.effects): ❤️ mạng/bình xăng, ⚔️ sát thương/động cơ, 🛡️ chặn đòn/tiết kiệm xăng, 🍀 điểm & kho báu.
 * Ảnh: EQ.MG_IMG (js/data/minigame-assets.js, nguồn ở assets/minigame/CREDITS.md).
 */
window.EQ = window.EQ || {};
(function () {
  const A = EQ.arcade, U = EQ.U, SP = EQ.sprites, el = U.el;
  const { rr, txt, fitText, sky, cloud, promptBar } = A.util;
  const { fx, pts, hearts, hurt, gearHud } = A.act;
  const CW = 880, CH = 500;

  Object.assign(A.GAMES, {
    td: { name: 'Pháo đài côn trùng', icon: '🐞', action: true, where: 'Rừng Từ Vựng', desc: 'Bọ cánh cứng bò vào thành, mỗi con mang 1 từ. Bấm con mang từ đúng để pháo bắn hạ nó!', keys: 'Bấm chuột vào con bọ (hoặc phím 1–4)' },
    candy: { name: 'Tiệm kẹo chữ', icon: '🍬', where: 'Làng Khởi Đầu', desc: 'Bấm viên kẹo có từ đúng. Kẹo cùng màu dính liền sẽ nổ theo chùm, được thêm điểm và thời gian!', keys: 'Bấm chuột vào viên kẹo' },
    plane: { name: 'Phi công chữ', icon: '✈️', action: true, where: 'Rừng Từ Vựng', desc: 'Lái máy bay, bắn đám mây mang từ đúng. Né hoặc bắn hạ bọ bay!', keys: '↑ ↓ hoặc W S (hoặc di chuột) • Space / bấm chuột để bắn' },
    hill: { name: 'Xe leo đồi', icon: '🚙', action: true, where: 'Làng Khởi Đầu', desc: 'Lái xe vượt đồi. Tới trạm xăng, chọn cây xăng có từ đúng để đổ đầy bình. Hết xăng là thua!', keys: '→ / D ga • ← / A phanh (hoặc giữ chuột) • phím 1–3 chọn cây xăng' },
    pirate: { name: 'Kho báu cướp biển', icon: '🏴‍☠️', where: 'Làng Khởi Đầu', desc: 'Đào ô cát có từ đúng để tìm kho báu. Có thể gặp bom hay đầu lâu – Phòng thủ sẽ che chắn cho bạn!', keys: 'Bấm chuột vào ô cát' },
    robot: { name: 'Đấu trường robot', icon: '🤖', action: true, where: 'Lâu Đài Ngữ Pháp', desc: 'Robot địch lao tới, mỗi con mang 1 từ. Bắn tên lửa vào con mang từ đúng, nhảy để né va chạm!', keys: '← → / A D chạy • ↑ / W / Space nhảy • bấm chuột vào robot hoặc phím 1–3 để bắn' }
  });

  // ---------- ảnh ----------
  const cache = {};
  function img(k) {
    let i = cache[k];
    if (!i) { i = cache[k] = new Image(); if (EQ.MG_IMG && EQ.MG_IMG[k]) i.src = EQ.MG_IMG[k]; }
    return i;
  }
  const ready = i => i.complete && i.naturalWidth > 0;
  // vẽ ảnh căn giữa tại (x, y), cao h (giữ tỉ lệ); trả về false nếu ảnh chưa sẵn sàng
  function draw(c, k, x, y, h, opt) {
    const i = img(k); if (!ready(i)) return false;
    const w = h * i.naturalWidth / i.naturalHeight;
    opt = opt || {};
    c.save(); c.translate(x, y);
    if (opt.rot) c.rotate(opt.rot);
    if (opt.flip) c.scale(-1, 1);
    if (opt.alpha != null) c.globalAlpha = opt.alpha;
    c.drawImage(i, -w / 2, -h / 2, w, h);
    c.restore();
    return true;
  }
  A.mgImg = img;
  const opts = (api, w, n) => U.shuffle([w].concat(api.distractors(w, n - 1)));
  function label(c, s, x, y, maxW, bg, col) {
    const size = fitText(c, s, maxW - 12, 17);
    c.font = 'bold ' + size + 'px "Segoe UI", system-ui, sans-serif';
    const w = Math.min(maxW, c.measureText(s).width + 16);
    c.fillStyle = bg || 'rgba(30,20,60,.85)'; rr(c, x - w / 2, y - 12, w, 24, 9); c.fill();
    txt(c, s, x, y + 1, size, col || '#fff');
  }

  // =================== 9. PHÁO ĐÀI CÔN TRÙNG ===================
  A.impl.td = function (api) {
    const { S, p } = api, E = fx(p);
    const PATH = [[-40, 330], [150, 330], [150, 170], [380, 170], [380, 400], [610, 400], [610, 230], [800, 230]];
    const SEG = []; let LEN = 0;
    for (let i = 1; i < PATH.length; i++) { const a = PATH[i - 1], b = PATH[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]); SEG.push({ a, b, l, s: LEN }); LEN += l; }
    function at(s) {
      const g = SEG.find(q => s <= q.s + q.l) || SEG[SEG.length - 1];
      const k = Math.max(0, Math.min(1, (s - g.s) / g.l));
      return { x: g.a[0] + (g.b[0] - g.a[0]) * k, y: g.a[1] + (g.b[1] - g.a[1]) * k, ang: Math.atan2(g.b[1] - g.a[1], g.b[0] - g.a[0]) };
    }
    const TUR = [{ x: 265, y: 265 }, { x: 495, y: 300 }, { x: 720, y: 330 }].map(t => Object.assign(t, { ang: -Math.PI / 2, kick: 0 }));
    const words = api.pool.slice(0, 10);
    let wi = 0;
    const st = { lives: E.hp, max: E.hp, inv: 0, bugs: [], bolts: [], w: null, mode: 'vi', tried: false, wait: 0.6, done: false, wave: 0, spawn: [] };
    function nextWave() {
      if (wi >= words.length || st.lives <= 0) { st.done = true; setTimeout(api.finish, 900); return; }
      const w = words[wi++];
      st.wave++; st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const hp = 2 + Math.floor(st.wave / 3);
      st.bugs = opts(api, w, 4).map((o, i) => {
        const fly = Math.random() < 0.35;
        return { w: o, n: i + 1, s: 30 - i * 125, fly, spd: (fly ? 54 : 40) + st.wave * 2.5, hp, max: hp, t: Math.random() * 3, hurtT: 0 };
      });
      if (st.mode === 'listen') api.say(w.en);
    }
    function fire(b) {
      if (!b || b.dead || b.s < 0) return;
      const pos = at(b.s);
      const tu = TUR.slice().sort((a, c) => Math.hypot(a.x - pos.x, a.y - pos.y) - Math.hypot(c.x - pos.x, c.y - pos.y))[0];
      tu.ang = Math.atan2(pos.y - tu.y, pos.x - tu.x); tu.kick = 0.15;
      st.bolts.push({ x: tu.x + Math.cos(tu.ang) * 26, y: tu.y + Math.sin(tu.ang) * 26, b });
      EQ.audio.sfx('spell');
    }
    function hit(b) {
      if (b.dead || !st.w) return;
      const pos = at(b.s);
      if (b.w.id !== st.w.id) {
        b.hurtT = 0.4; EQ.audio.sfx('wrong'); api.float(pos.x, pos.y - 50, '🛡️ ' + b.w.en + ' = ' + b.w.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        return;
      }
      let d = E.atk; const crit = Math.random() * 100 < E.crit; if (crit) d *= 2;
      b.hp -= d; b.hurtT = 0.3; EQ.audio.sfx('hit');
      api.float(pos.x, pos.y - 50, (crit ? '💥 CHÍ MẠNG -' : '-') + d, crit ? '#ff8a65' : '#fff59d');
      if (b.hp <= 0) {
        b.dead = true; api.burst(pos.x, pos.y, 36, ['#a5d6a7', '#ffd54f', '#fff']);
        api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
        S.score += pts(p, st.tried ? 50 : 150); S.coins += 2;
        api.float(CW / 2, 150, '✓ ' + st.w.en + ' = ' + st.w.vi, '#b9f6ca');
        st.bugs.forEach(o => { if (!o.dead) { o.dead = true; const q = at(Math.max(0, o.s)); api.burst(q.x, q.y, 10, ['#ffd54f']); S.coins++; } });
        st.w = null; st.wait = 1.1;
      }
    }
    function pick(x, y) {
      let best = null, bd = 44;
      st.bugs.forEach(b => { if (b.dead || b.s < 0) return; const q = at(b.s), d = Math.hypot(q.x - x, q.y - y); if (d < bd) { bd = d; best = b; } });
      return best;
    }
    return {
      onClick(x, y) { if (st.done) return; fire(pick(x, y)); },
      onKey(k) {
        const m = /^Digit([1-4])$/.exec(k);
        if (m) fire(st.bugs.find(b => b.n === +m[1]));
        if (k === 'KeyL' && st.w) api.say(st.w.en);
      },
      update(dt) {
        if (st.done) return;
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) nextWave(); return; }
        TUR.forEach(t => { t.kick = Math.max(0, t.kick - dt); });
        st.bugs.forEach(b => {
          b.t += dt; b.hurtT = Math.max(0, b.hurtT - dt);
          if (b.dead) return;
          b.s += b.spd * (b.s < 0 ? 3 : 1) * dt; // ngoài màn hình thì bò nhanh vào
          if (b.s >= LEN) {
            b.dead = true;
            if (st.w && b.w.id === st.w.id) {
              // để lọt con bọ đúng → thành bị đánh, câu này hỏi lại sau
              st.inv = 0; hurt(api, st, 820, 200);
              if (!st.tried) api.answer(st.w, false, 'pic');
              api.float(CW / 2, 150, '↺ ' + st.w.en + ' = ' + st.w.vi, '#ffe082');
              words.push(st.w); st.w = null; st.wait = 1.2;
              st.bugs.forEach(o => { o.dead = true; });
            } else api.float(800, 200, '🍃 bọ hiền đi qua', '#e8f5e9');
          }
        });
        st.bolts.forEach(o => {
          const q = at(o.b.s), a = Math.atan2(q.y - o.y, q.x - o.x), l = Math.hypot(q.x - o.x, q.y - o.y);
          if (l < 14 || o.b.dead) { o.gone = true; if (!o.b.dead) hit(o.b); return; }
          o.x += Math.cos(a) * 760 * dt; o.y += Math.sin(a) * 760 * dt;
        });
        st.bolts = st.bolts.filter(o => !o.gone);
        if (st.lives <= 0) { st.done = true; setTimeout(api.finish, 800); }
        api.hud('<b>🐞 Pháo đài côn trùng</b><span>Đợt ' + st.wave + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        c.fillStyle = '#7fb85a'; c.fillRect(0, 0, CW, CH);
        for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(40,90,30,.18)'; c.beginPath(); c.arc((i * 137) % CW, 90 + (i * 89) % 400, 6 + i % 5, 0, 7); c.fill(); }
        // đường đi
        c.lineJoin = 'round'; c.lineCap = 'round';
        c.strokeStyle = '#8d6e47'; c.lineWidth = 54; c.beginPath(); PATH.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
        c.strokeStyle = '#c8a675'; c.lineWidth = 42; c.stroke();
        c.setLineDash([6, 14]); c.strokeStyle = 'rgba(120,80,40,.4)'; c.lineWidth = 3; c.stroke(); c.setLineDash([]);
        // cây
        [[60, 130], [470, 110], [260, 450], [820, 420], [700, 120], [40, 450]].forEach(q => { c.fillStyle = '#2e7d32'; c.beginPath(); c.arc(q[0], q[1], 26, 0, 7); c.fill(); c.fillStyle = '#43a047'; c.beginPath(); c.arc(q[0] - 6, q[1] - 6, 16, 0, 7); c.fill(); });
        // thành
        const cx = 832, cy = 230;
        c.fillStyle = '#9e9ab5'; c.fillRect(cx - 34, cy - 70, 68, 90);
        for (let i = 0; i < 4; i++) c.fillRect(cx - 34 + i * 20, cy - 82, 12, 14);
        c.fillStyle = '#4a3b6b'; c.beginPath(); c.moveTo(cx - 14, cy + 20); c.lineTo(cx - 14, cy - 8); c.quadraticCurveTo(cx, cy - 22, cx + 14, cy - 8); c.lineTo(cx + 14, cy + 20); c.fill();
        c.fillStyle = '#e53935'; c.fillRect(cx - 2, cy - 112, 3, 30); c.beginPath(); c.moveTo(cx + 1, cy - 112); c.lineTo(cx + 24, cy - 104 + Math.sin(t * 5) * 2); c.lineTo(cx + 1, cy - 96); c.fill();
        // pháo: ảnh pháo tháp thật, đổi kiểu theo bậc vũ khí đang cầm (bản 1.8)
        const tk = 'tur_t' + [1, 1, 5, 10, 15, 20][Math.min(5, E.tier)];
        const tc = ['#78909c', '#8d6e63', '#43a047', '#1e88e5', '#8e24aa', '#ffb300'][Math.min(5, E.tier)];
        TUR.forEach(tu => {
          c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(tu.x, tu.y + 22, 30, 10, 0, 0, 7); c.fill();
          c.fillStyle = '#6d6875'; c.beginPath(); c.ellipse(tu.x, tu.y + 12, 30, 14, 0, 0, 7); c.fill();
          const kx = -Math.cos(tu.ang) * tu.kick * 30, ky = -Math.sin(tu.ang) * tu.kick * 30;
          if (!draw(c, tk, tu.x + kx, tu.y + ky, 72, { rot: tu.ang + Math.PI / 2 })) {
            c.save(); c.translate(tu.x, tu.y - 3); c.rotate(tu.ang);
            c.fillStyle = tc; c.fillRect(-4 - tu.kick * 40, -7, 32, 14); c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
            c.restore();
          }
        });
        // bọ
        st.bugs.forEach(b => {
          if (b.dead || b.s < 0) return;
          const q = at(b.s), f = Math.floor(b.t * 10) % 4;
          if (b.hurtT > 0 && Math.floor(t * 20) % 2) c.globalAlpha = 0.5;
          if (!draw(c, (b.fly ? 'td_fly' : 'td_beetle') + f, q.x, q.y, b.fly ? 52 : 58, { rot: q.ang + Math.PI / 2 })) { c.font = '34px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText(b.fly ? '🪰' : '🪲', q.x, q.y); }
          c.globalAlpha = 1;
          label(c, b.n + '. ' + b.w.en, q.x, q.y - 42, 130);
          c.fillStyle = '#4e342e'; c.fillRect(q.x - 22, q.y - 28, 44, 5); c.fillStyle = '#ef5350'; c.fillRect(q.x - 22, q.y - 28, 44 * Math.max(0, b.hp) / b.max, 5);
        });
        st.bolts.forEach(o => {
          const q = at(o.b.s), ang = Math.atan2(q.y - o.y, q.x - o.x);
          if (!draw(c, 'tur_shot', o.x, o.y, 30, { rot: ang + Math.PI / 2 })) { c.fillStyle = '#ffeb3b'; c.beginPath(); c.arc(o.x, o.y, 6, 0, 7); c.fill(); }
        });
        hearts(c, st.lives, st.max, 14, CH - 22);
        txt(c, 'Pháo ⚔️' + E.atk + '/phát', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Bấm con bọ mang từ đúng!');
        if (st.lives <= 0) txt(c, 'Thành bị phá rồi! ❤️ Trang bị thêm Máu để thành bền hơn', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st, _at: at
    };
  };

  // =================== 10. TIỆM KẸO CHỮ ===================
  A.impl.candy = function (api) {
    const { S, p } = api, E = fx(p);
    const COLS = 6, ROWS = 4, CWD = 112, CHT = 92, X0 = (CW - COLS * CWD) / 2, Y0 = 120;
    const CANDY = ['blue', 'green', 'heart', 'orange', 'purple', 'yellow'];
    const pool = api.pool.slice();
    const poolIds = new Set(pool.map(w => w.id));
    // ngân hàng từ: từ đã học + từ gây nhiễu cùng chủ đề (để bàn kẹo không trùng từ)
    const bank = pool.slice();
    pool.slice(0, 4).forEach(w => api.distractors(w, 8).forEach(d => { if (!bank.some(b => b.en === d.en)) bank.push(d); }));
    const st = { started: false, T: 60 + Math.round(E.luck / 4), maxT: 60 + Math.round(E.luck / 4), grid: [], w: null, mode: 'vi', tried: false, asked: 0, goal: 14, done: false, last: null, shake: {} };
    function onBoard() { const s = new Set(); st.grid.forEach(col => col.forEach(k => k && s.add(k.w.en))); return s; }
    function fresh(row) {
      const on = onBoard();
      const cand = U.shuffle(bank.filter(w => !on.has(w.en)));
      return { w: cand[0] || U.pick(bank), col: Math.floor(Math.random() * CANDY.length), y: Y0 + row * CHT - 260 - Math.random() * 60, pop: 0 };
    }
    for (let x = 0; x < COLS; x++) { st.grid.push([]); for (let y = 0; y < ROWS; y++) st.grid[x].push(null); }
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) st.grid[x][y] = fresh(y);
    function next() {
      if (st.asked >= st.goal || st.T <= 0) { st.done = true; setTimeout(api.finish, 900); return; }
      const cells = [];
      st.grid.forEach(col => col.forEach(k => { if (k && poolIds.has(k.w.id) && (!st.last || k.w.id !== st.last.id)) cells.push(k); }));
      if (!cells.length) { const k = st.grid[Math.floor(Math.random() * COLS)][Math.floor(Math.random() * ROWS)]; k.w = U.pick(pool); cells.push(k); }
      st.w = U.pick(cells).w; st.mode = api.promptFor(st.w); st.tried = false; st.asked++;
      if (st.mode === 'listen') api.say(st.w.en);
    }
    function cellAt(x, y) {
      const cx = Math.floor((x - X0) / CWD), cy = Math.floor((y - Y0) / CHT);
      return cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS ? [cx, cy] : null;
    }
    function cluster(cx, cy) {
      const col = st.grid[cx][cy].col, seen = {}, out = [], q = [[cx, cy]];
      while (q.length) {
        const [x, y] = q.pop(), k = x + ',' + y;
        if (seen[k] || x < 0 || y < 0 || x >= COLS || y >= ROWS || !st.grid[x][y] || st.grid[x][y].col !== col) continue;
        seen[k] = 1; out.push([x, y]); q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      return out;
    }
    function click(x, y) {
      if (!st.started) { st.started = true; EQ.audio.sfx('coin'); next(); return; }
      if (st.done || !st.w) return;
      const g = cellAt(x, y); if (!g) return;
      const k = st.grid[g[0]][g[1]];
      if (!k || k.y < Y0 + g[1] * CHT - 4) return;
      const cx = X0 + g[0] * CWD + CWD / 2, cy = Y0 + g[1] * CHT + CHT / 2;
      if (k.w.id !== st.w.id) {
        st.shake[g[0] + ',' + g[1]] = 0.4;
        api.float(cx, cy - 40, '✗ ' + k.w.en + ' = ' + k.w.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        if (Math.random() * 100 < E.def) api.float(cx, cy - 70, '🛡️ Không mất giờ!', '#80d8ff');
        else { st.T = Math.max(0, st.T - 3); api.float(CW - 120, 60, '-3 giây', '#ff8a80'); }
        EQ.audio.sfx('wrong');
        return;
      }
      const cl = cluster(g[0], g[1]);
      api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
      const n = cl.length;
      S.score += pts(p, (st.tried ? 40 : 100) + 40 * (n - 1)); S.coins += n;
      st.T = Math.min(st.maxT + 20, st.T + 2 + (n - 1));
      api.float(cx, cy - 40, n > 1 ? '🍬 Nổ chùm x' + n + '!' : '✓ ' + st.w.en, '#fff59d');
      cl.forEach(([x, y]) => { api.burst(X0 + x * CWD + CWD / 2, Y0 + y * CHT + CHT / 2, 14, ['#ff80ab', '#ffd54f', '#80d8ff', '#fff']); st.grid[x][y] = null; });
      // kẹo rơi xuống, kẹo mới từ trên
      for (let x = 0; x < COLS; x++) {
        const keep = st.grid[x].filter(Boolean), add = ROWS - keep.length;
        const fill = [];
        for (let i = 0; i < add; i++) { const f = fresh(i); f.y = Y0 - (add - i) * CHT - 20; fill.push(f); }
        st.grid[x] = fill.concat(keep);
      }
      st.last = st.w; st.w = null;
      setTimeout(next, 450);
    }
    return {
      onClick: click,
      onKey(k) { if ((k === 'Space' || k === 'Enter') && !st.started) click(0, 0); if (k === 'KeyL' && st.w) api.say(st.w.en); },
      update(dt) {
        Object.keys(st.shake).forEach(k => { st.shake[k] -= dt; if (st.shake[k] <= 0) delete st.shake[k]; });
        for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) { const k = st.grid[x][y]; if (!k) continue; const ty = Y0 + y * CHT; if (k.y < ty) k.y = Math.min(ty, k.y + 620 * dt); }
        if (!st.started || st.done) return;
        st.T -= dt;
        if (st.T <= 0) { st.T = 0; st.done = true; setTimeout(api.finish, 600); }
        api.hud('<b>🍬 Tiệm kẹo chữ</b><span>Câu ' + st.asked + '/' + st.goal + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span><span>🍀 +' + E.luck + '% điểm, +' + Math.round(E.luck / 4) + 's</span>');
      },
      draw(c) {
        const t = S.t;
        const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#f48fd8'); g.addColorStop(1, '#c04fd8'); c.fillStyle = g; c.fillRect(0, 0, CW, CH);
        for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc((i * 173 + t * 8) % (CW + 120) - 60, 420 + (i % 3) * 30, 70 + (i % 2) * 30, 0, 7); c.fill(); }
        // thanh trên kiểu kẹo
        c.fillStyle = '#5d2a1e'; rr(c, 20, 74, CW - 40, 36, 18); c.fill();
        c.fillStyle = '#ffb300'; c.beginPath(); c.arc(48, 92, 13, 0, 7); c.fill(); c.fillStyle = '#ffe082'; c.beginPath(); c.arc(48, 92, 7, 0, 7); c.fill();
        txt(c, String(S.score), 70, 93, 18, '#fff', 'left');
        const bw = 300, bx = CW / 2 - 40, k = Math.max(0, st.T / st.maxT);
        c.fillStyle = '#3e1a12'; rr(c, bx, 82, bw, 20, 10); c.fill();
        c.save(); rr(c, bx, 82, Math.max(20, bw * Math.min(1, k)), 20, 10); c.clip();
        c.fillStyle = '#ff80ab'; c.fillRect(bx, 82, bw, 20);
        c.fillStyle = '#fce4ec'; for (let x = bx - 20; x < bx + bw; x += 22) { c.beginPath(); c.moveTo(x + (t * 30) % 22, 102); c.lineTo(x + 10 + (t * 30) % 22, 82); c.lineTo(x + 18 + (t * 30) % 22, 82); c.lineTo(x + 8 + (t * 30) % 22, 102); c.fill(); }
        c.restore();
        const sec = Math.ceil(st.T);
        txt(c, Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), bx + bw + 40, 93, 18, st.T < 10 ? '#ff8a80' : '#fff');
        // bàn kẹo
        c.fillStyle = 'rgba(60,10,70,.35)'; rr(c, X0 - 10, Y0 - 8, COLS * CWD + 20, ROWS * CHT + 16, 18); c.fill();
        c.save(); c.beginPath(); c.rect(X0 - 10, Y0 - 8, COLS * CWD + 20, ROWS * CHT + 16); c.clip();
        for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
          const kd = st.grid[x][y]; if (!kd) continue;
          const sh = st.shake[x + ',' + y] ? Math.sin(t * 60) * 5 : 0;
          const cx = X0 + x * CWD + CWD / 2 + sh, cy = kd.y + CHT / 2;
          c.fillStyle = (x + y) % 2 ? 'rgba(90,30,100,.45)' : 'rgba(110,40,120,.45)'; rr(c, cx - CWD / 2 + 4, kd.y + 2, CWD - 8, CHT - 4, 12); c.fill();
          if (!draw(c, 'candy_' + CANDY[kd.col], cx, cy - 12, 52)) { c.font = '40px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText('🍬', cx, cy - 12); }
          label(c, kd.w.en, cx, cy + 27, CWD - 8, 'rgba(255,255,255,.92)', '#6a1b4d');
        }
        c.restore();
        if (!st.started) {
          c.fillStyle = 'rgba(40,0,50,.55)'; c.fillRect(0, 0, CW, CH);
          txt(c, '🍬 Tiệm kẹo chữ', CW / 2, 150, 40, '#fff59d');
          txt(c, 'Bấm viên kẹo có từ đúng. Kẹo cùng màu dính nhau sẽ nổ cả chùm!', CW / 2, 205, 20, '#fff');
          txt(c, '⏱️ ' + st.maxT + ' giây (🍀 May mắn cộng thêm giờ) • 🛡️ Phòng thủ: chống mất giờ khi bấm sai', CW / 2, 240, 16, '#fce4ec');
          const pulse = 1 + Math.sin(t * 4) * 0.04;
          if (!draw(c, 'ui_start', CW / 2, 330, 96 * pulse)) txt(c, '▶ Start', CW / 2, 330, 40, '#fff');
          txt(c, 'Bấm để bắt đầu', CW / 2, 400, 16, '#fff');
        } else if (st.w && !st.done) promptBar(c, st.w, st.mode, t);
        if (st.done && st.T <= 0) txt(c, '⏰ Hết giờ!', CW / 2, CH / 2, 40, '#fff59d');
      },
      _st: st
    };
  };

  // =================== 11. PHI CÔNG CHỮ ===================
  A.impl.plane = function (api) {
    const { S, p, keys, mouse } = api, E = fx(p);
    const PX = 120;
    const words = api.pool.slice(0, 12);
    let wi = 0;
    const st = { y: CH / 2, lives: E.hp, max: E.hp, inv: 0, cd: 0, shootT: 0, off: 0, bullets: [], clouds: [], flies: [], nextFly: 2.5, w: null, mode: 'vi', tried: false, wait: 0.8, done: false, run: 0 };
    function nextWave() {
      if (wi >= words.length || st.lives <= 0) { st.done = true; setTimeout(api.finish, 900); return; }
      const w = words[wi++];
      st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const lanes = U.shuffle([150, 275, 400]);
      st.clouds = opts(api, w, 3).map((o, i) => ({ w: o, x: CW + 90 + i * 70, y: lanes[i], spd: 105 + wi * 4, bad: false }));
      if (st.mode === 'listen') api.say(w.en);
    }
    function shoot() {
      if (st.cd > 0 || st.done || st.lives <= 0) return;
      st.cd = 0.28; st.shootT = 0.25;
      st.bullets.push({ x: PX + 56, y: st.y + 14 });
      EQ.audio.sfx('spell');
    }
    return {
      onKey(k) { if (k === 'Space' || k === 'KeyF' || k === 'KeyJ') shoot(); if (k === 'KeyL' && st.w) api.say(st.w.en); },
      onClick() { shoot(); },
      update(dt) {
        if (st.done) return;
        st.run += dt; st.off += 140 * dt;
        st.inv = Math.max(0, st.inv - dt); st.cd = Math.max(0, st.cd - dt); st.shootT = Math.max(0, st.shootT - dt);
        if (st.lives <= 0) return;
        let dy = 0;
        if (keys.ArrowUp || keys.KeyW) dy--; if (keys.ArrowDown || keys.KeyS) dy++;
        if (dy) st.y += dy * 280 * dt;
        else if (mouse.moved) st.y += (mouse.y - st.y) * Math.min(1, dt * 6);
        st.y = Math.max(110, Math.min(CH - 40, st.y));
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) nextWave(); }
        // mây mang từ
        st.clouds.forEach(cl => { cl.x -= cl.spd * dt; });
        if (st.w && st.clouds.length && st.clouds.every(cl => cl.x < -80)) {
          if (!st.tried) api.answer(st.w, false, 'pic');
          api.float(CW / 2, 160, '↺ ' + st.w.en + ' = ' + st.w.vi, '#ffe082');
          words.push(st.w); st.w = null; st.clouds = []; st.wait = 0.6;
        }
        // bọ bay
        st.nextFly -= dt;
        if (st.nextFly <= 0) { st.nextFly = 2.2 + Math.random() * 2.2; const hp = 1 + Math.floor(wi / 4); st.flies.push({ x: CW + 40, y: 120 + Math.random() * 340, hp, max: hp, t: Math.random() * 3, vy: (Math.random() - 0.5) * 60 }); }
        st.flies.forEach(f => {
          f.t += dt; f.x -= 190 * dt; f.y += f.vy * dt + Math.sin(f.t * 4) * 0.8;
          if (f.y < 110 || f.y > CH - 30) f.vy *= -1;
          if (!f.dead && Math.abs(f.x - PX) < 48 && Math.abs(f.y - st.y) < 32) { f.dead = true; hurt(api, st, PX, st.y); api.burst(f.x, f.y, 12, ['#90a4ae']); }
        });
        st.flies = st.flies.filter(f => !f.dead && f.x > -60);
        // đạn
        st.bullets.forEach(b => {
          b.x += 680 * dt;
          st.flies.forEach(f => {
            if (b.gone || f.dead) return;
            if (Math.abs(b.x - f.x) < 30 && Math.abs(b.y - f.y) < 28) {
              b.gone = true;
              let d = E.atk; const crit = Math.random() * 100 < E.crit; if (crit) d *= 2;
              f.hp -= d; EQ.audio.sfx('hit'); api.float(f.x, f.y - 30, (crit ? '💥 -' : '-') + d, crit ? '#ff8a65' : '#fff59d');
              if (f.hp <= 0) { f.dead = true; api.burst(f.x, f.y, 18); S.score += pts(p, 20); S.coins++; EQ.audio.sfx('coin'); }
            }
          });
          st.clouds.forEach(cl => {
            if (b.gone || cl.bad || !st.w) return;
            if (Math.abs(b.x - cl.x) < 70 && Math.abs(b.y - cl.y) < 34) {
              b.gone = true;
              if (cl.w.id === st.w.id) {
                api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
                S.score += pts(p, st.tried ? 50 : 150); S.coins += 2;
                api.burst(cl.x, cl.y, 36); api.float(cl.x, cl.y - 40, '✓ ' + st.w.en, '#b9f6ca');
                st.clouds.forEach(o => { o.gone = true; });
                st.clouds = []; st.w = null; st.wait = 0.9;
              } else {
                cl.bad = true; EQ.audio.sfx('wrong'); api.float(cl.x, cl.y - 40, '✗ ' + cl.w.en + ' = ' + cl.w.vi, '#ff8a80');
                if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
              }
            }
          });
        });
        st.bullets = st.bullets.filter(b => !b.gone && b.x < CW + 30);
        if (st.lives <= 0) setTimeout(api.finish, 1200);
        api.hud('<b>✈️ Phi công chữ</b><span>Từ ' + Math.min(wi, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t, bg = img('plane_bg');
        if (ready(bg)) {
          const w = CW, h = bg.naturalHeight * CW / bg.naturalWidth, ox = -(st.off % w);
          c.drawImage(bg, ox, CH - h, w, h); c.drawImage(bg, ox + w, CH - h, w, h);
        } else { sky(c, '#4fc3f7', '#e1f5fe'); cloud(c, 700 - st.off % 900, 120, 1); }
        st.clouds.forEach(cl => {
          c.globalAlpha = cl.bad ? 0.45 : 1;
          c.fillStyle = cl.bad ? '#b0bec5' : '#fff';
          c.beginPath(); c.arc(cl.x - 40, cl.y + 6, 26, 0, 7); c.arc(cl.x - 10, cl.y - 14, 32, 0, 7); c.arc(cl.x + 26, cl.y - 4, 28, 0, 7); c.arc(cl.x + 48, cl.y + 10, 20, 0, 7); c.fill();
          c.fillRect(cl.x - 40, cl.y + 6, 88, 24);
          const s = fitText(c, cl.w.en, 120, 22); txt(c, cl.w.en, cl.x + 4, cl.y + 8, s, '#0d47a1', 'center', 'rgba(255,255,255,.9)');
          c.globalAlpha = 1;
        });
        st.flies.forEach(f => {
          if (!draw(c, 'td_fly' + (Math.floor(f.t * 12) % 4), f.x, f.y, 46, { rot: -Math.PI / 2 })) { c.font = '30px ' + SP.EMOJI_FONT; c.fillText('🪰', f.x, f.y); }
          if (f.max > 1) { c.fillStyle = '#4e342e'; c.fillRect(f.x - 18, f.y - 30, 36, 4); c.fillStyle = '#ef5350'; c.fillRect(f.x - 18, f.y - 30, 36 * f.hp / f.max, 4); }
        });
        st.bullets.forEach(b => { if (!draw(c, 'plane_bullet', b.x, b.y, 10)) { c.fillStyle = '#ffeb3b'; c.fillRect(b.x - 8, b.y - 2, 16, 4); } });
        const k = st.lives <= 0 ? 'plane_dead' : st.shootT > 0 ? 'plane_shoot' + [1, 3, 5][Math.floor(st.shootT * 12) % 3] : 'plane_fly' + (1 + Math.floor(st.run * 10) % 2);
        if (!(st.inv > 0 && Math.floor(t * 12) % 2)) { if (!draw(c, k, PX, st.y, 62, { rot: st.lives <= 0 ? 0.4 : Math.sin(t * 3) * 0.04 })) { c.font = '48px ' + SP.EMOJI_FONT; c.fillText('✈️', PX, st.y); } }
        hearts(c, st.lives, st.max, 14, CH - 22);
        txt(c, 'Đạn ⚔️' + E.atk + ' • Space bắn', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Bắn đám mây có từ đúng');
        if (st.lives <= 0) txt(c, 'Máy bay rơi rồi! ❤️ Thêm Máu để bay lâu hơn', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st
    };
  };

  // =================== 12. XE LEO ĐỒI ===================
  A.impl.hill = function (api) {
    const { S, p, keys, mouse } = api, E = fx(p);
    // xe tốt hơn khi vũ khí mạnh hơn (cho thấy giá trị trang bị)
    const CAR = E.tier >= 4 ? 'truck' : E.tier >= 2 ? 'orc' : 'girl';
    const CARNAME = { girl: 'Xe thể thao', orc: 'Xe đua gai', truck: 'Xe tải quái vật' }[CAR];
    const words = api.pool.slice(0, 10);
    let wi = 0;
    const amp = x => Math.min(1, 0.35 + x / 6000);
    const ground = x => 370 - (Math.sin(x / 260) * 46 + Math.sin(x / 97 + 1) * 22 + Math.sin(x / 530 + 2) * 30) * amp(x);
    const slope = x => (ground(x + 6) - ground(x - 6)) / 12;
    const MAXF = 100 + E.hp * 8;
    const st = { x: 60, v: 0, fuel: MAXF, maxF: MAXF, wheel: 0, coins: [], stations: [], stop: null, w: null, mode: 'vi', tried: false, done: false, answered: 0, goal: words.length, out: 0, bad: {} };
    for (let i = 0; i < 60; i++) st.coins.push({ x: 300 + i * 150 + (i % 3) * 30, got: false });
    for (let i = 0; i < 40; i++) st.stations.push({ x: 900 + i * 1350, done: false });
    function arrive(stn) {
      if (wi >= words.length) { st.done = true; setTimeout(api.finish, 600); return; }
      const w = words[wi++];
      st.stop = stn; st.v = 0; st.w = w; st.mode = api.promptFor(w); st.tried = false; st.bad = {};
      stn.pumps = opts(api, w, 3);
      if (st.mode === 'listen') api.say(w.en);
    }
    function choose(i) {
      const stn = st.stop; if (!stn || !st.w || st.bad[i]) return;
      const o = stn.pumps[i]; if (!o) return;
      if (o.id === st.w.id) {
        api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
        const add = Math.round(st.maxF * (0.55 + E.luck / 200));
        st.fuel = Math.min(st.maxF, st.fuel + add);
        S.score += pts(p, st.tried ? 50 : 150); S.coins += 2; st.answered++;
        api.float(stn.x - st.x + 220, 160, '⛽ +' + add + ' xăng • ✓ ' + st.w.en, '#b9f6ca');
        stn.done = true; st.stop = null; st.w = null;
        if (st.answered >= st.goal) { st.done = true; setTimeout(api.finish, 900); }
      } else {
        st.bad[i] = true; EQ.audio.sfx('wrong');
        api.float(220, 160, '✗ ' + o.en + ' = ' + o.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        if (Math.random() * 100 < E.def) api.float(220, 190, '🛡️ Không mất xăng', '#80d8ff');
        else st.fuel = Math.max(1, st.fuel - 8);
      }
    }
    function pumpPos(stn, i) { return { x: stn.x - st.x + 220 + 70 + i * 92, y: ground(stn.x + 70 + i * 92) }; }
    return {
      onKey(k) { const m = /^Digit([1-3])$/.exec(k); if (m) choose(+m[1] - 1); if (k === 'KeyL' && st.w) api.say(st.w.en); },
      onClick(x, y) {
        if (!st.stop) return;
        st.stop.pumps.forEach((o, i) => { const q = pumpPos(st.stop, i); if (Math.abs(x - q.x) < 46 && y > q.y - 120 && y < q.y + 10) choose(i); });
      },
      update(dt) {
        if (st.done) return;
        st.wheel += st.v * dt / 14;
        if (st.stop) { api.hud('<b>🚙 Xe leo đồi</b><span>⛽ ' + Math.round(st.fuel) + '/' + st.maxF + '</span><span>Trạm ' + st.answered + '/' + st.goal + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p)); return; }
        const gas = keys.ArrowRight || keys.KeyD || keys.ArrowUp || keys.KeyW || (mouse.down && mouse.x > CW / 3);
        const brake = keys.ArrowLeft || keys.KeyA || keys.ArrowDown || keys.KeyS || (mouse.down && mouse.x <= CW / 3);
        if (st.fuel > 0 && gas) { st.v += (210 + E.atk * 16) * dt; st.fuel -= Math.max(2.5, 7 - E.def / 15) * dt; }
        if (brake) st.v -= 420 * dt * Math.sign(st.v || 1);
        st.fuel -= 0.8 * dt;
        st.v += 420 * slope(st.x) * dt;
        st.v *= 1 - 0.35 * dt;
        st.v = Math.max(-140, Math.min(360 + E.atk * 10, st.v));
        st.x = Math.max(40, st.x + st.v * dt);
        st.coins.forEach(cn => { if (!cn.got && Math.abs(cn.x - st.x) < 30) { cn.got = true; S.coins++; S.score += pts(p, 10); EQ.audio.sfx('coin'); } });
        const stn = st.stations.find(s => !s.done && st.x >= s.x - 20 && st.x < s.x + 60);
        if (stn) arrive(stn);
        if (st.fuel <= 0) {
          st.fuel = 0;
          if (Math.abs(st.v) < 6) { st.out += dt; if (st.out > 1) { st.done = true; api.float(CW / 2, 200, 'Hết xăng!', '#ffe082'); setTimeout(api.finish, 900); } }
        }
        api.hud('<b>🚙 Xe leo đồi</b><span>⛽ ' + Math.round(st.fuel) + '/' + st.maxF + '</span><span>Trạm ' + st.answered + '/' + st.goal + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t, cam = st.x - 220;
        sky(c, '#81d4fa', '#e1f5fe');
        cloud(c, 820 - (cam * 0.1) % 1000, 90, 1.1); cloud(c, 1200 - (cam * 0.07 + 300) % 1300, 150, 0.8);
        c.fillStyle = '#a5d6a7';
        for (let i = -1; i < 6; i++) { const x = i * 260 - (cam * 0.25) % 260; c.beginPath(); c.moveTo(x - 160, 330); c.quadraticCurveTo(x, 190, x + 160, 330); c.fill(); }
        // mặt đất
        c.beginPath(); c.moveTo(0, CH);
        for (let sx = 0; sx <= CW; sx += 8) c.lineTo(sx, ground(cam + sx));
        c.lineTo(CW, CH); c.closePath();
        c.fillStyle = '#8d6e63'; c.fill();
        c.lineWidth = 12; c.strokeStyle = '#66bb6a'; c.beginPath();
        for (let sx = 0; sx <= CW; sx += 8) { const y = ground(cam + sx); sx ? c.lineTo(sx, y) : c.moveTo(sx, y); }
        c.stroke();
        // xu
        st.coins.forEach(cn => { const sx = cn.x - cam; if (cn.got || sx < -20 || sx > CW + 20) return; const y = ground(cn.x) - 40 + Math.sin(t * 4 + cn.x) * 4; c.fillStyle = '#ffb300'; c.beginPath(); c.arc(sx, y, 10, 0, 7); c.fill(); c.fillStyle = '#ffe082'; c.beginPath(); c.arc(sx, y, 5, 0, 7); c.fill(); });
        // trạm xăng
        st.stations.forEach(stn => {
          const sx = stn.x - cam; if (sx < -340 || sx > CW + 40) return;
          const gy = ground(stn.x);
          c.fillStyle = '#e53935'; c.fillRect(sx - 30, gy - 130, 8, 130); c.fillRect(sx - 40, gy - 140, 330, 16);
          txt(c, '⛽ TRẠM XĂNG', sx + 120, gy - 132, 13, '#fff');
          if (!stn.pumps) return;
          stn.pumps.forEach((o, i) => {
            const q = pumpPos(stn, i);
            c.globalAlpha = st.bad[i] && st.stop === stn ? 0.4 : 1;
            c.fillStyle = ['#43a047', '#1e88e5', '#fb8c00'][i]; rr(c, q.x - 20, q.y - 78, 40, 76, 8); c.fill();
            c.fillStyle = '#e3f2fd'; c.fillRect(q.x - 12, q.y - 68, 24, 18);
            txt(c, String(i + 1), q.x, q.y - 59, 14, '#263238', 'center', 'rgba(255,255,255,.5)');
            label(c, o.en, q.x, q.y - 98, 104);
            c.globalAlpha = 1;
          });
        });
        // xe
        const cy = ground(st.x), ang = Math.atan(slope(st.x));
        c.save(); c.translate(220, cy - 4); c.rotate(ang);
        const bh = CAR === 'truck' ? 50 : 32;
        const wheelOk = ready(img('car_' + CAR + '_wheel'));
        [-40, 40].forEach(wx => {
          if (wheelOk) { c.save(); c.translate(wx, -12); c.rotate(st.wheel); const wi2 = img('car_' + CAR + '_wheel'); c.drawImage(wi2, -14, -14, 28, 28); c.restore(); }
          else { c.fillStyle = '#212121'; c.beginPath(); c.arc(wx, -12, 13, 0, 7); c.fill(); }
        });
        if (!draw(c, 'car_' + CAR + '_head', -6, -22 - bh, 34)) { /* chưa có ảnh */ }
        if (!draw(c, 'car_' + CAR + '_body', 0, -16 - bh / 2, bh)) { c.font = '50px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText('🚙', 0, -30); }
        c.restore();
        // đồng hồ xăng
        c.fillStyle = 'rgba(20,20,40,.7)'; rr(c, 12, CH - 40, 230, 28, 10); c.fill();
        c.fillStyle = '#424242'; rr(c, 50, CH - 32, 180, 12, 6); c.fill();
        const fk = st.fuel / st.maxF; c.fillStyle = fk > 0.4 ? '#66bb6a' : fk > 0.2 ? '#ffb300' : '#e53935'; rr(c, 50, CH - 32, Math.max(6, 180 * fk), 12, 6); c.fill();
        txt(c, '⛽', 30, CH - 26, 16, '#fff');
        txt(c, CARNAME + ' • ⚔️ động cơ ' + E.atk + ' • 🛡️ tiết kiệm xăng', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.stop && st.w) promptBar(c, st.w, st.mode, t, 'Chọn cây xăng có từ đúng (phím 1–3)');
        else if (!st.done && st.x < 260) txt(c, 'Giữ → (hoặc D) để chạy, ← để phanh', CW / 2, 120, 22, '#fff');
        if (st.done && st.fuel <= 0) txt(c, 'Hết xăng! ❤️ Máu càng cao bình xăng càng lớn', CW / 2, CH / 2 - 40, 24, '#ffe082');
      },
      _st: st, _choose: choose
    };
  };

  // =================== 13. KHO BÁU CƯỚP BIỂN ===================
  A.impl.pirate = function (api) {
    const { S, p } = api, E = fx(p);
    const COLS = 5, ROWS = 3, TW = 132, TH = 100, X0 = (CW - COLS * TW) / 2, Y0 = 150;
    const pool = api.pool.slice(), poolIds = new Set(pool.map(w => w.id));
    const bank = pool.slice();
    pool.slice(0, 3).forEach(w => api.distractors(w, 6).forEach(d => { if (!bank.some(b => b.en === d.en)) bank.push(d); }));
    const ITEMS = [
      { k: 'flag', name: 'Rương báu!', w: 10 + E.luck / 4, pts: 300 },
      { k: 'map', name: 'Bản đồ kho báu', w: 12, pts: 150 },
      { k: 'dice', name: 'Xúc xắc may mắn', w: 14 },
      { k: 'sword', name: 'Kiếm hải tặc', w: 12, pts: 120 },
      { k: 'horseshoe', name: 'Móng ngựa: lần sau x2', w: 10 },
      { k: 'book', name: 'Sổ gợi ý: lần sau sáng ô đúng', w: 8 },
      { k: 'magnet', name: 'Nam châm hút xu', w: 8 },
      { k: 'potion', name: 'Bình máu +1 ❤️', w: 8 },
      { k: 'bomb', name: 'BOM!', w: 9, bad: true },
      { k: 'skull', name: 'Đầu lâu ma!', w: 9, bad: true }
    ];
    const st = { lives: E.hp + 1, max: E.hp + 1, inv: 0, tiles: [], w: null, mode: 'vi', tried: false, asked: 0, goal: 12, done: false, x2: false, hint: false, shown: [] };
    function onBoard() { return new Set(st.tiles.map(k => k.w && k.w.en)); }
    function freshWord() { const on = onBoard(); return U.shuffle(bank.filter(w => !on.has(w.en)))[0] || U.pick(bank); }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) st.tiles.push({ x, y, w: null, dug: 0, item: null });
    st.tiles.forEach(k => { k.w = freshWord(); });
    function roll() {
      const tot = ITEMS.reduce((a, b) => a + b.w, 0); let r = Math.random() * tot;
      return ITEMS.find(i => (r -= i.w) < 0) || ITEMS[0];
    }
    function next() {
      if (st.asked >= st.goal || st.lives <= 0) { st.done = true; setTimeout(api.finish, 1000); return; }
      const cand = st.tiles.filter(k => !k.dug && poolIds.has(k.w.id));
      const k = cand.length ? U.pick(cand) : U.pick(st.tiles.filter(q => !q.dug));
      if (!poolIds.has(k.w.id)) k.w = U.pick(pool);
      st.w = k.w; st.mode = api.promptFor(st.w); st.tried = false; st.asked++;
      if (st.mode === 'listen') api.say(st.w.en);
    }
    function center(k) { return { x: X0 + k.x * TW + TW / 2, y: Y0 + k.y * TH + TH / 2 }; }
    next();
    function click(mx, my) {
      if (st.done || !st.w) return;
      const k = st.tiles.find(q => { const c0 = center(q); return Math.abs(mx - c0.x) < TW / 2 - 4 && Math.abs(my - c0.y) < TH / 2 - 4; });
      if (!k || k.dug) return;
      const c0 = center(k);
      if (k.w.id !== st.w.id) {
        EQ.audio.sfx('wrong'); api.float(c0.x, c0.y - 40, '✗ ' + k.w.en + ' = ' + k.w.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        st.inv = 0; hurt(api, st, c0.x, c0.y);
        if (st.lives <= 0) { st.done = true; setTimeout(api.finish, 1000); }
        return;
      }
      api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
      const it = roll(); k.dug = 1.6; k.item = it;
      let gain = pts(p, st.tried ? 40 : 100);
      if (it.k === 'dice') { const d = 1 + Math.floor(Math.random() * 6); gain += d * 30; api.float(c0.x, c0.y - 70, '🎲 ' + d + ' → +' + d * 30, '#fff59d'); }
      if (it.pts) gain += pts(p, it.pts);
      if (st.x2 && !it.bad) { gain *= 2; st.x2 = false; api.float(c0.x, c0.y - 95, '🧲 x2!', '#ffd54f'); }
      if (it.k === 'horseshoe') st.x2 = true;
      if (it.k === 'book') st.hint = true;
      if (it.k === 'magnet') S.coins += 5;
      if (it.k === 'potion') { st.lives = Math.min(st.max + 1, st.lives + 1); st.max = Math.max(st.max, st.lives); EQ.audio.sfx('heal'); }
      if (it.bad) { st.inv = 0; if (hurt(api, st, c0.x, c0.y)) api.burst(c0.x, c0.y, 30, ['#424242', '#ff7043', '#ffd54f']); gain = Math.round(gain / 2); }
      else api.burst(c0.x, c0.y, 26, ['#ffd54f', '#fff59d', '#ffffff']);
      S.score += gain; S.coins += it.k === 'flag' ? 5 : 1;
      api.float(c0.x, c0.y - 45, (it.bad ? '' : '+' + gain + ' ') + it.name, it.bad ? '#ff8a80' : '#b9f6ca');
      st.w = null;
      if (st.lives <= 0) { st.done = true; setTimeout(api.finish, 1000); return; }
      setTimeout(next, 1300);
    }
    return {
      onClick: click,
      onKey(k) { if (k === 'KeyL' && st.w) api.say(st.w.en); },
      update(dt) {
        st.tiles.forEach(k => { if (k.dug > 0) { k.dug -= dt; if (k.dug <= 0) { k.dug = 0; k.item = null; k.w = freshWord(); } } });
        api.hud('<b>🏴‍☠️ Kho báu cướp biển</b><span>Lượt ' + st.asked + '/' + st.goal + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#4fc3f7'); g.addColorStop(1, '#0277bd'); c.fillStyle = g; c.fillRect(0, 0, CW, CH);
        c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
        for (let y = 100; y < CH; y += 34) { c.beginPath(); for (let x = 0; x <= CW; x += 20) c.lineTo(x, y + Math.sin(x / 40 + t * 2 + y) * 4); c.stroke(); }
        c.fillStyle = '#f6d58e'; rr(c, X0 - 34, Y0 - 34, COLS * TW + 68, ROWS * TH + 68, 60); c.fill();
        c.fillStyle = '#e9c46a'; rr(c, X0 - 20, Y0 - 20, COLS * TW + 40, ROWS * TH + 40, 46); c.fill();
        c.font = '44px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('🌴', X0 - 40, Y0 - 20); c.fillText('🌴', X0 + COLS * TW + 40, Y0 + ROWS * TH);
        c.fillText('⛵', 80 + Math.sin(t) * 10, CH - 40); c.fillText('🦀', X0 + COLS * TW + 10, Y0 - 30);
        st.tiles.forEach(k => {
          const q = center(k), hint = st.hint && st.w && k.w.id === st.w.id;
          c.fillStyle = k.dug ? '#8d6e63' : hint ? '#fff59d' : '#f4dca0'; rr(c, q.x - TW / 2 + 6, q.y - TH / 2 + 6, TW - 12, TH - 12, 14); c.fill();
          c.strokeStyle = hint ? '#ff6f00' : '#c9a35b'; c.lineWidth = hint ? 4 : 2; c.stroke();
          if (k.dug && k.item) {
            const s = 1 - Math.max(0, k.dug - 1.2) * 2;
            if (!draw(c, 'pir_' + k.item.k, q.x, q.y - 6 - (1.6 - k.dug) * 6, 62 * Math.max(0.3, s))) txt(c, k.item.bad ? '💣' : '💰', q.x, q.y, 40);
          } else {
            c.strokeStyle = 'rgba(183,28,28,.55)'; c.lineWidth = 5;
            c.beginPath(); c.moveTo(q.x - 14, q.y - 30); c.lineTo(q.x + 14, q.y - 6); c.moveTo(q.x + 14, q.y - 30); c.lineTo(q.x - 14, q.y - 6); c.stroke();
            label(c, k.w.en, q.x, q.y + 20, TW - 16, 'rgba(78,52,46,.88)', '#fff8e1');
          }
        });
        hearts(c, st.lives, st.max, 14, CH - 22);
        if (st.x2) txt(c, '🧲 Lần sau x2 điểm', CW - 12, CH - 50, 15, '#ffd54f', 'right');
        txt(c, '🍀 May mắn càng cao, càng dễ trúng rương báu', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Đào ô có từ đúng');
        if (st.lives <= 0) txt(c, 'Hết máu rồi! 🛡️ Phòng thủ giúp chặn bom', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st
    };
  };

  // =================== 14. ĐẤU TRƯỜNG ROBOT ===================
  A.impl.robot = function (api) {
    const { S, p, keys } = api, E = fx(p);
    const GROUND = 420;
    const ME = { hero: 'red', pink: 'red', ranger: 'green', royal: 'yellow', star: 'yellow' }[(p.avatar || {}).outfit] || 'blue';
    const FOES = ['blue', 'red', 'green', 'yellow'].filter(x => x !== ME);
    const words = api.pool.slice(0, 10);
    let wi = 0;
    const st = { x: 140, y: GROUND, vy: 0, face: 1, lives: E.hp, max: E.hp, inv: 0, cd: 0, run: 0, lasers: [], bots: [], w: null, mode: 'vi', tried: false, wait: 0.6, done: false, wave: 0 };
    function nextWave() {
      if (wi >= words.length || st.lives <= 0) { st.done = true; setTimeout(api.finish, 900); return; }
      const w = words[wi++];
      st.wave++; st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const hp = 2 + Math.floor(st.wave / 3);
      st.bots = opts(api, w, 3).map((o, i) => ({ w: o, n: i + 1, x: CW + 40 + i * 160, col: FOES[i % FOES.length], hp, max: hp, spd: 70 + st.wave * 4, t: Math.random() * 2, hurtT: 0, kb: 0 }));
      if (st.mode === 'listen') api.say(w.en);
    }
    function jump() { if (st.y >= GROUND) { st.vy = -640; EQ.audio.sfx('step'); } }
    // tên lửa tự dẫn bay vòng qua các robot khác, tới đúng con được chọn
    function fire(b) {
      if (!b || b.dead || st.cd > 0 || st.done || st.lives <= 0) return;
      st.cd = 0.3; st.face = b.x < st.x ? -1 : 1;
      const sx = st.x + st.face * 30, sy = st.y - 40;
      st.lasers.push({ sx, sy, x: sx, y: sy, k: 0, px: sx, py: sy, b });
      EQ.audio.sfx('spell');
    }
    function pick(x, y) {
      let best = null, bd = 70;
      st.bots.forEach(b => { if (b.dead || b.x > CW) return; const d = Math.hypot(b.x - x, GROUND - 50 - y); if (d < bd) { bd = d; best = b; } });
      return best;
    }
    return {
      onKey(k) {
        if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') jump();
        const m = /^Digit([1-3])$/.exec(k);
        if (m) fire(st.bots.find(b => b.n === +m[1]));
        if (k === 'KeyL' && st.w) api.say(st.w.en);
      },
      onClick(x, y) { fire(pick(x, y)); },
      update(dt) {
        if (st.done) return;
        st.inv = Math.max(0, st.inv - dt); st.cd = Math.max(0, st.cd - dt);
        if (st.lives <= 0) return;
        let dx = 0;
        if (keys.ArrowLeft || keys.KeyA) dx--; if (keys.ArrowRight || keys.KeyD) dx++;
        if (dx) { st.face = dx; st.x += dx * 230 * dt; st.run += dt; }
        st.x = Math.max(30, Math.min(CW - 30, st.x));
        st.vy += 1600 * dt; st.y += st.vy * dt;
        if (st.y >= GROUND) { st.y = GROUND; st.vy = 0; }
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) nextWave(); }
        st.bots.forEach(b => {
          b.t += dt; b.hurtT = Math.max(0, b.hurtT - dt);
          if (b.dead) { if (b.flee) b.x += 420 * dt; return; }
          if (b.kb > 0) { b.kb -= dt; b.x += 300 * dt; return; }
          b.x -= b.spd * (b.x > CW - 30 ? 3 : 1) * dt;
          if (b.x < -70) b.x = CW + 70;
          if (Math.abs(b.x - st.x) < 46 && st.y > GROUND - 50) { b.kb = 0.4; hurt(api, st, st.x, st.y - 40); }
        });
        st.lasers.forEach(l => {
          const b = l.b;
          if (b.dead) { l.gone = true; return; }
          // bay theo đường cong qua phía trên các robot khác
          l.k = Math.min(1, l.k + dt / 0.5);
          const tx = b.x, ty = GROUND - 34, cx = (l.sx + tx) / 2, cy = Math.min(l.sy, ty) - 170, k = l.k;
          l.px = l.x; l.py = l.y;
          l.x = (1 - k) * (1 - k) * l.sx + 2 * (1 - k) * k * cx + k * k * tx;
          l.y = (1 - k) * (1 - k) * l.sy + 2 * (1 - k) * k * cy + k * k * ty;
          const dist = k >= 1 ? 0 : 99;
          [b].forEach(b => {
            if (l.gone || dist > 30) return;
            l.gone = true;
            if (!st.w || b.w.id !== st.w.id) {
              b.hurtT = 0.4; EQ.audio.sfx('wrong'); api.float(b.x, GROUND - 110, '✗ ' + b.w.en + ' = ' + b.w.vi, '#ff8a80');
              if (st.w && !st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
              return;
            }
            let d = E.atk; const crit = Math.random() * 100 < E.crit; if (crit) d *= 2;
            b.hp -= d; b.hurtT = 0.3; b.kb = 0.12; EQ.audio.sfx('hit');
            api.float(b.x, GROUND - 110, (crit ? '💥 CHÍ MẠNG -' : '-') + d, crit ? '#ff8a65' : '#fff59d');
            if (b.hp <= 0) {
              b.dead = true; api.burst(b.x, GROUND - 30, 40, ['#90a4ae', '#ffd54f', '#ff7043']);
              api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
              S.score += pts(p, st.tried ? 50 : 150); S.coins += 2;
              api.float(CW / 2, 160, '✓ ' + st.w.en + ' = ' + st.w.vi, '#b9f6ca');
              st.bots.forEach(o => { if (!o.dead) { o.dead = true; o.flee = true; } });
              st.w = null; st.wait = 1.2;
            }
          });
        });
        st.lasers = st.lasers.filter(l => !l.gone && l.x > -60 && l.x < CW + 60);
        if (st.lives <= 0) setTimeout(api.finish, 1000);
        api.hud('<b>🤖 Đấu trường robot</b><span>Đợt ' + st.wave + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        sky(c, '#37474f', '#90a4ae');
        c.fillStyle = 'rgba(255,255,255,.06)';
        for (let i = 0; i < 6; i++) { c.save(); c.translate(80 + i * 160, 200 + (i % 2) * 60); c.rotate(t * (i % 2 ? 0.4 : -0.4)); for (let k = 0; k < 8; k++) { c.rotate(Math.PI / 4); c.fillRect(-8, -48, 16, 18); } c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill(); c.restore(); }
        c.fillStyle = '#263238'; c.fillRect(0, GROUND, CW, CH - GROUND);
        c.fillStyle = '#ffca28'; for (let x = -((t * 60) % 40); x < CW; x += 40) { c.beginPath(); c.moveTo(x, GROUND); c.lineTo(x + 20, GROUND); c.lineTo(x + 10, GROUND + 10); c.lineTo(x - 10, GROUND + 10); c.fill(); }
        st.bots.forEach(b => {
          if (b.dead && !b.flee) return;
          if (b.x < -80 || b.x > CW + 80) return;
          if (b.hurtT > 0 && Math.floor(t * 20) % 2) c.globalAlpha = 0.5;
          const k = 'robot_' + b.col + '_' + (b.hurtT > 0 ? 'hurt' : 'drive' + (1 + Math.floor(b.t * 8) % 2));
          if (!draw(c, k, b.x, GROUND - 30, 62, { flip: true })) { c.font = '48px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText('🤖', b.x, GROUND - 30); }
          c.globalAlpha = 1;
          if (!b.dead) {
            label(c, b.n + '. ' + b.w.en, b.x, GROUND - 86, 140);
            c.fillStyle = '#4e342e'; c.fillRect(b.x - 24, GROUND - 70, 48, 5); c.fillStyle = '#ef5350'; c.fillRect(b.x - 24, GROUND - 70, 48 * Math.max(0, b.hp) / b.max, 5);
          }
        });
        st.lasers.forEach(l => {
          c.save(); c.translate(l.x, l.y); c.rotate(Math.atan2(l.y - l.py, l.x - l.px));
          c.fillStyle = 'rgba(255,152,0,.6)'; c.beginPath(); c.moveTo(-12, -4); c.lineTo(-26 - Math.random() * 8, 0); c.lineTo(-12, 4); c.fill();
          c.fillStyle = '#eceff1'; c.fillRect(-12, -4, 18, 8); c.fillStyle = '#ff1744'; c.beginPath(); c.moveTo(6, -4); c.lineTo(13, 0); c.lineTo(6, 4); c.fill();
          c.restore();
        });
        if (!(st.inv > 0 && Math.floor(t * 12) % 2)) {
          const k = 'robot_' + ME + '_' + (st.lives <= 0 ? 'damage1' : st.y < GROUND ? 'jump' : 'drive' + (1 + Math.floor(st.run * 8) % 2));
          if (!draw(c, k, st.x, st.y - 30, 62, { flip: st.face < 0 })) { c.font = '48px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText('🤖', st.x, st.y - 30); }
        }
        hearts(c, st.lives, st.max, 14, CH - 22);
        txt(c, 'Tên lửa ⚔️' + E.atk + ' • bấm robot / phím 1–3 • ↑ nhảy', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Bắn robot mang từ đúng');
        if (st.lives <= 0) txt(c, 'Robot hỏng rồi! 🛡️ Phòng thủ giúp chặn va chạm', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st
    };
  };

  // ---------- quầy trò chơi trên bản đồ ----------
  A.booth = function (id) {
    const g = A.GAMES[id]; if (!g) return;
    const p = EQ.game.profile;
    const srcs = A.sources(p);
    const src = srcs.find(s => s.ids.length >= 6) || srcs[srcs.length - 1];
    const enough = src.ids.length >= 6;
    const E = fx(p);
    p.arcade = p.arcade || {};
    let close = () => {};
    const ICON = { td: 'td_beetle0', candy: 'candy_pink', plane: 'plane_fly1', hill: 'car_girl_body', pirate: 'pir_flag', robot: 'robot_blue_drive1', farm: 'farm_carrot' };
    const body = el('div', { class: 'booth-card' }, [
      el('div', { class: 'booth-head' }, [
        EQ.MG_IMG && EQ.MG_IMG[ICON[id]] ? el('img', { class: 'booth-img', src: EQ.MG_IMG[ICON[id]], alt: '' }) : null,
        el('div', null, [el('h2', null, g.icon + ' ' + g.name), el('div', { class: 'muted small' }, '📍 ' + g.where)])
      ]),
      el('p', null, g.desc),
      el('div', { class: 'am-keys' }, '🎮 ' + g.keys),
      el('div', { class: 'am-gear' }, '🎒 Trang bị của bạn: ❤️ ' + E.hp + ' • ⚔️ ' + E.atk + ' • 🛡️ ' + E.def + '% • 🍀 +' + E.luck + '%' + (g.action ? ' (trò hành động: trang bị càng mạnh càng dễ thắng)' : '')),
      el('div', { class: 'am-best' }, '🏆 Kỷ lục: ' + (p.arcade[id] || 0) + '   •   Dùng từ: ' + src.name),
      enough ? null : el('div', { class: 'note' }, 'Cần ít nhất 6 từ đã học. Hãy làm nhiệm vụ hoặc vào 📗 Sách để học từ trước nhé!'),
      el('div', { class: 'row center' }, [
        el('button', { class: 'btn primary big', disabled: !enough, onclick: () => { close(); A.play(id, poolFromIds(p, src.ids)); } }, '▶ Chơi'),
        el('button', { class: 'btn', onclick: () => { close(); A.open(); } }, '🎮 Trò khác'),
        el('button', { class: 'btn', onclick: () => close() }, 'Đóng')
      ])
    ]);
    close = EQ.ui.modal(body, { onEsc: () => close() });
    return close;
  };
  function poolFromIds(p, ids) {
    return U.shuffle(ids.map(i => EQ.V[i]).filter(Boolean)).sort((a, b) => ((p.vocab[a.id] || {}).box || 0) - ((p.vocab[b.id] || {}).box || 0));
  }

  // vẽ quầy trên bản đồ (mái che sọc + hình trò chơi)
  const baseDeco = SP.deco;
  SP.deco = function (ctx, kind, cx, by, t, e) {
    if (kind !== 'booth') return baseDeco(ctx, kind, cx, by, t, e);
    const col = (e && e.col) || '#ec407a';
    SP.shadow(ctx, cx, by, 18, 5);
    ctx.fillStyle = '#6d4c41'; ctx.fillRect(cx - 17, by - 34, 3, 34); ctx.fillRect(cx + 14, by - 34, 3, 34);
    ctx.fillStyle = '#a1887f'; ctx.fillRect(cx - 18, by - 14, 36, 13);
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(cx - 18, by - 14, 36, 3);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : col; ctx.beginPath(); ctx.moveTo(cx - 21 + i * 7, by - 34); ctx.lineTo(cx - 14 + i * 7, by - 34); ctx.lineTo(cx - 14 + i * 7, by - 40); ctx.lineTo(cx - 21 + i * 7, by - 40); ctx.fill(); }
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : col; ctx.beginPath(); ctx.arc(cx - 17.5 + i * 7, by - 34, 3.5, 0, Math.PI); ctx.fill(); }
    const k = e && e.icon, bob = Math.sin(t * 3 + cx) * 1.5;
    if (!(k && draw(ctx, k, cx, by - 22 + bob, k.indexOf('car_') === 0 || k.indexOf('plane_') === 0 ? 11 : 15))) SP.emoji(ctx, (A.GAMES[e && e.game] || {}).icon || '🎮', cx, by - 22 + bob, 13);
  };
})();
