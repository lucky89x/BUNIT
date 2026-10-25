/* ENGLISH QUEST – 🍬 CANDY CRUSH CHỮ (bản 2.0, thay trò "Tiệm kẹo chữ" cũ)
 * Trò xếp kẹo ghép 3 THẬT: hoán đổi hai ô cạnh nhau để tạo hàng 3+ cùng màu, kẹo nổ, kẹo mới rơi xuống, nổ chuỗi (combo).
 *   • 4 kẹo thẳng hàng → kẹo SỌC (nổ cả hàng/cột)   • 5 kẹo thẳng hàng → kẹo CẦU VỒNG (hoán đổi với một màu: nổ hết màu đó)
 * ĐÁP ÁN = MÀU KẸO: mỗi lựa chọn của câu hỏi được gắn với một màu kẹo (hiện ở bảng bên trái).
 *   Ghép kẹo cùng màu với đáp án ĐÚNG → trả lời đúng.  Ghép màu của đáp án SAI → sai (mất ❤️, hiện giải thích).
 *   Ghép màu không gắn đáp án nào ("kẹo trung lập") → không tính, chỉ để sắp xếp lại bàn (tốn 1 lượt).
 * Câu hỏi lấy từ EQ.qbank: từ vựng, điền ngữ pháp, chọn câu đúng (mẫu câu), hỏi–đáp… tùy nguồn bé chọn.
 * Trang bị: 🍀 May mắn = thêm lượt & điểm • 🛡️ Phòng thủ = chặn mất tim khi ghép nhầm • ❤️ = số tim • Phím H gợi ý nước đi.
 */
window.EQ = window.EQ || {};
(function () {
  const A = EQ.arcade, U = EQ.U, SP = EQ.sprites;
  const { rr, txt, fitText } = A.util;
  const { fx, pts, hearts, hurt, gearHud } = A.act;
  const CW = 880, CH = 500;
  const COLS = 8, ROWS = 7, CELL = 58, BX = CW - COLS * CELL - 22, BY = Math.round((CH - ROWS * CELL) / 2) + 2;
  const KIND = ['blue', 'green', 'heart', 'orange', 'purple', 'yellow'];
  const HEX = ['#42a5f5', '#66bb6a', '#ec407a', '#fb8c00', '#ab47bc', '#fdd835'];

  Object.assign(A.GAMES.candy, {
    name: 'Candy Crush chữ', icon: '🍬', long: true,
    desc: 'Xếp kẹo ghép 3 như Candy Crush! Mỗi đáp án là một MÀU kẹo – hãy ghép kẹo đúng màu của đáp án đúng. Có kẹo sọc, kẹo cầu vồng và nổ chuỗi.',
    keys: 'Bấm 2 kẹo cạnh nhau (hoặc kéo) để hoán đổi • H gợi ý • L nghe lại'
  });

  const img = A.mgImg, ready = i => i.complete && i.naturalWidth > 0;
  function drawImg(c, k, x, y, h) {
    const i = img(k); if (!ready(i)) return false;
    const w = h * i.naturalWidth / i.naturalHeight;
    c.drawImage(i, x - w / 2, y - h / 2, w, h); return true;
  }
  // chia chữ thành các dòng vừa chiều rộng
  function wrap(c, text, maxW) {
    const words = String(text).split(' '), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; });
    if (cur) lines.push(cur); return lines;
  }
  const FONT = '"Segoe UI", "Nunito", system-ui, sans-serif';

  A.impl.candy = function (api) {
    const { S, p } = api, E = fx(p), Qb = EQ.qbank;
    const items = U.shuffle(api.pool.slice());
    let qi = 0;
    const st = {
      grid: [], phase: 'idle', moves: 24 + Math.floor(E.luck / 20), lives: E.hp, max: E.hp, inv: 0,
      asked: 0, goal: 10, correct: 0, done: false, sel: null, drag: null, combo: 0,
      q: null, w: null, mode: 'vi', optCol: [], ansCol: 0, tried: false, qDone: false, nextAt: 0,
      reveal: 0, revealIdx: -1, chosenIdx: -1, ok: null, idle: 0, hint: null, popT: 0, clear: null, pendingInvalid: null, ev: null, lastSwap: null, flash: 0
    };
    st.maxMoves = st.moves;

    // ---------- bàn kẹo ----------
    const newCell = c => ({ c: c == null ? Math.floor(Math.random() * KIND.length) : c, sp: null, ox: 0, oy: 0, vy: 0, fall: false, dying: 0 });
    const colAt = (x, y) => { const k = st.grid[x] && st.grid[x][y]; return !k || k.sp === 'b' ? -1 : k.c; };
    function fillBoard() {
      for (let x = 0; x < COLS; x++) { st.grid[x] = []; for (let y = 0; y < ROWS; y++) st.grid[x][y] = null; }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        let c, k = 0;
        do {
          c = Math.floor(Math.random() * KIND.length); k++;
        } while (k < 30 && ((x >= 2 && colAt(x - 1, y) === c && colAt(x - 2, y) === c) || (y >= 2 && colAt(x, y - 1) === c && colAt(x, y - 2) === c)));
        st.grid[x][y] = newCell(c);
      }
    }
    function runs() {
      const out = [];
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS;) {
        const c = colAt(x, y); if (c < 0) { x++; continue; }
        let n = 1; while (x + n < COLS && colAt(x + n, y) === c) n++;
        if (n >= 3) { const cells = []; for (let i = 0; i < n; i++) cells.push([x + i, y]); out.push({ dir: 'h', c, cells }); }
        x += n;
      }
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS;) {
        const c = colAt(x, y); if (c < 0) { y++; continue; }
        let n = 1; while (y + n < ROWS && colAt(x, y + n) === c) n++;
        if (n >= 3) { const cells = []; for (let i = 0; i < n; i++) cells.push([x, y + i]); out.push({ dir: 'v', c, cells }); }
        y += n;
      }
      return out;
    }
    const swapCells = (a, b) => { const t = st.grid[a[0]][a[1]]; st.grid[a[0]][a[1]] = st.grid[b[0]][b[1]]; st.grid[b[0]][b[1]] = t; };
    // đánh giá một nước đi: trả về null nếu không hợp lệ, hoặc {colors: các màu ghép trực tiếp}
    function evalMove(a, b) {
      const A1 = st.grid[a[0]][a[1]], B1 = st.grid[b[0]][b[1]];
      if (!A1 || !B1) return null;
      const colors = new Set();
      if (A1.sp === 'b' || B1.sp === 'b') {
        const o = A1.sp === 'b' ? B1 : A1;
        if (o.sp === 'b') KIND.forEach((_, i) => colors.add(i)); else colors.add(o.c);
        return { colors, special: true };
      }
      if (A1.sp && B1.sp) { colors.add(A1.c); colors.add(B1.c); return { colors, special: true }; }
      swapCells(a, b); const rs = runs(); swapCells(a, b);
      if (!rs.length) return null;
      rs.forEach(r => colors.add(r.c));
      return { colors };
    }
    function findMoves() {
      const out = [];
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
        [[x + 1, y], [x, y + 1]].forEach(b => { if (b[0] < COLS && b[1] < ROWS) { const ev = evalMove([x, y], b); if (ev) out.push({ a: [x, y], b, ev }); } });
      }
      return out;
    }
    const hasTarget = () => findMoves().some(m => m.ev.colors.has(st.ansCol));
    // đảm bảo luôn có nước đi ra màu đáp án đúng: nếu chưa có thì "gieo" một mẫu C C _ / _ _ C
    function plantTarget() {
      const c = st.ansCol;
      for (let t = 0; t < 80; t++) {
        const x = Math.floor(Math.random() * (COLS - 2)), y = Math.floor(Math.random() * (ROWS - 1));
        const cells = [[x, y], [x + 1, y], [x + 2, y], [x + 2, y + 1]].map(q => st.grid[q[0]][q[1]]);
        if (cells.some(k => !k || k.sp)) continue;
        const old = cells.map(k => k.c);
        cells[0].c = c; cells[1].c = c; cells[3].c = c; cells[2].c = (c + 1 + Math.floor(Math.random() * (KIND.length - 1))) % KIND.length;
        if (!runs().length && hasTarget()) return true;
        cells.forEach((k, i) => { k.c = old[i]; });
      }
      return false;
    }
    function ensureBoard() {
      let guard = 0;
      while (!findMoves().length && guard++ < 50) { fillBoard(); if (runs().length) continue; }
      if (st.q && !st.qDone && !hasTarget()) plantTarget();
      if (st.q && !st.qDone && !hasTarget()) { fillBoard(); plantTarget(); }
    }

    // ---------- câu hỏi ----------
    function nextQuestion() {
      if (st.correct >= st.goal || st.moves <= 0 || st.lives <= 0) return finish();
      const w = items[qi++ % items.length];
      const q = Qb.toQ(w, items, 3);
      let opts = q.options.slice();
      if (opts.length > 4) { opts = opts.filter(o => o !== q.answer); opts = U.shuffle(opts).slice(0, 3).concat(q.answer); opts = U.shuffle(opts); }
      st.w = w; st.q = Object.assign({}, q, { options: opts }); st.mode = w.qq ? 'vi' : api.promptFor(w);
      if (st.mode === 'pic' && !q.pic) st.mode = 'vi';
      const perm = U.shuffle(KIND.map((_, i) => i)).slice(0, opts.length);
      st.optCol = perm; st.ansCol = perm[opts.indexOf(q.answer)];
      st.tried = false; st.qDone = false; st.nextAt = 0; st.reveal = 0; st.ok = null; st.chosenIdx = -1; st.asked++; st.idle = 0; st.hint = null;
      if (st.mode === 'listen') api.say(q.say || w.en);
      ensureBoard();
    }
    function finish() { if (st.done) return; st.done = true; setTimeout(api.finish, 900); }
    function cellCenter(x, y) { return { x: BX + x * CELL + CELL / 2, y: BY + y * CELL + CELL / 2 }; }

    function judge(colors) {
      const chosen = st.optCol.findIndex(c => colors.has(c) && c !== st.ansCol);
      const right = colors.has(st.ansCol);
      const pos = st.lastSwap ? cellCenter(st.lastSwap[0][0], st.lastSwap[0][1]) : { x: CW / 2, y: CH / 2 };
      if (right) {
        st.ok = true; st.correct++; st.moves += 1; S.coins++;
        api.answer(st.w, true, 'en'); api.say(st.q.say || st.w.en);
        S.score += pts(p, 120); api.float(pos.x, pos.y - 30, '✓ Đúng rồi!', '#b9f6ca'); api.burst(pos.x, pos.y, 18);
        st.reveal = 2.0; st.qDone = true; st.nextAt = S.t + 1.5;
      } else if (chosen >= 0) {
        st.ok = false; st.chosenIdx = chosen;
        api.answer(st.w, false, 'en'); EQ.audio.sfx('wrong');
        api.float(pos.x, pos.y - 30, '✗ Chưa đúng', '#ff8a80');
        st.inv = 0; hurt(api, st, pos.x, pos.y);
        st.reveal = 3.0; st.qDone = true; st.nextAt = S.t + 2.4;
      }
      // màu trung lập: không tính gì
      st.revealIdx = st.q.options.indexOf(st.q.answer);
    }

    // ---------- đổi chỗ, nổ, rơi ----------
    function setOffsets(a, b) {
      const ka = st.grid[a[0]][a[1]], kb = st.grid[b[0]][b[1]];
      ka.ox = (b[0] - a[0]) * CELL; ka.oy = (b[1] - a[1]) * CELL; kb.ox = (a[0] - b[0]) * CELL; kb.oy = (a[1] - b[1]) * CELL;
    }
    function trySwap(a, b) {
      if (st.phase !== 'idle' || st.done || st.nextAt || st.lives <= 0) return false;
      if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) !== 1) return false;
      if (!st.grid[a[0]][a[1]] || !st.grid[b[0]][b[1]]) return false;
      const ev = evalMove(a, b);
      swapCells(a, b); setOffsets(a, b);
      st.sel = null; st.idle = 0; st.hint = null; st.phase = 'swapping';
      if (!ev) { st.pendingInvalid = [a, b]; EQ.audio.sfx('bump'); return true; }
      st.pendingInvalid = null; st.lastSwap = [a, b]; st.ev = ev; st.moves--; st.combo = 0;
      return true;
    }
    function lineCells(k, x, y, set) {
      if (k.sp === 'h') for (let i = 0; i < COLS; i++) set.add(i + ',' + y);
      if (k.sp === 'v') for (let j = 0; j < ROWS; j++) set.add(x + ',' + j);
    }
    function expand(set) {
      let changed = true;
      while (changed) {
        changed = false;
        Array.from(set).forEach(key => {
          const [x, y] = key.split(',').map(Number), k = st.grid[x][y];
          if (!k || !k.sp || k.sp === 'b') return;
          const before = set.size; lineCells(k, x, y, set); if (set.size > before) changed = true;
        });
      }
    }
    function resolveSwap() {
      const ev = st.ev, [a, b] = st.lastSwap, set = new Set();
      judge(ev.colors);
      const made = [];
      if (ev.special) {
        const ka = st.grid[a[0]][a[1]], kb = st.grid[b[0]][b[1]];
        if (ka.sp === 'b' || kb.sp === 'b') {
          const bombAt = ka.sp === 'b' ? a : b, other = ka.sp === 'b' ? kb : ka;
          set.add(bombAt[0] + ',' + bombAt[1]);
          for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) { const k = st.grid[x][y]; if (k && (other.sp === 'b' || k.c === other.c)) set.add(x + ',' + y); }
        } else { set.add(a[0] + ',' + a[1]); set.add(b[0] + ',' + b[1]); }
      } else {
        runs().forEach(r => {
          r.cells.forEach(c => set.add(c[0] + ',' + c[1]));
          if (r.cells.length >= 4) {
            const own = r.cells.find(c => (c[0] === a[0] && c[1] === a[1]) || (c[0] === b[0] && c[1] === b[1])) || r.cells[Math.floor(r.cells.length / 2)];
            made.push({ at: own, sp: r.cells.length >= 5 ? 'b' : (r.dir === 'h' ? 'v' : 'h'), c: r.c });
          }
        });
      }
      startClear(set, made);
    }
    function startClear(set, made) {
      made.forEach(m => { set.delete(m.at[0] + ',' + m.at[1]); });
      expand(set);
      made.forEach(m => { const k = st.grid[m.at[0]][m.at[1]]; k.sp = m.sp; if (m.sp === 'b') k.c = -1; else k.c = m.c; set.delete(m.at[0] + ',' + m.at[1]); });
      st.combo++;
      const list = Array.from(set).map(s => s.split(',').map(Number)).filter(q => st.grid[q[0]][q[1]]);
      const mult = 1 + 0.5 * (st.combo - 1);
      list.forEach(q => {
        const k = st.grid[q[0]][q[1]]; k.dying = 0.28;
        const c = cellCenter(q[0], q[1]); api.burst(c.x, c.y, 4, [HEX[Math.max(0, k.c)], '#ffffff']);
      });
      S.score += pts(p, Math.round(list.length * 14 * mult));
      if (st.combo >= 2) { api.float(BX + COLS * CELL / 2, BY + 20, '🔥 Combo x' + st.combo + '!', '#ffe082'); EQ.audio.sfx('level'); } else EQ.audio.sfx('coin');
      st.clear = list; st.popT = 0.28; st.phase = 'clearing';
    }
    function gravity() {
      for (let x = 0; x < COLS; x++) {
        const col = [];
        for (let y = ROWS - 1; y >= 0; y--) { const k = st.grid[x][y]; if (k && !k.dying) col.push({ k, y }); }
        let miss = ROWS - col.length;
        for (let i = 0; i < ROWS; i++) {
          const y = ROWS - 1 - i;
          if (i < col.length) { const k = col[i].k; const d = y - col[i].y; st.grid[x][y] = k; if (d > 0) { k.oy = -d * CELL; k.vy = 0; k.fall = true; } }
          else { const k = newCell(); k.oy = -miss * CELL; k.vy = 0; k.fall = true; st.grid[x][y] = k; }
        }
      }
      st.clear = null; st.phase = 'falling';
    }
    const settled = () => { for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) { const k = st.grid[x][y]; if (k && (k.ox || k.oy)) return false; } return true; };
    function turnEnd() {
      st.phase = 'idle'; st.combo = 0; st.idle = 0;
      if (st.moves <= 0 && !st.qDone) { st.nextAt = S.t + 0.6; st.qDone = true; }
      ensureBoard();
    }

    // ---------- nhập liệu ----------
    function cellAt(x, y) { const cx = Math.floor((x - BX) / CELL), cy = Math.floor((y - BY) / CELL); return cx >= 0 && cx < COLS && cy >= 0 && cy < ROWS ? [cx, cy] : null; }
    const near = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
    function onClick(x, y) {
      if (st.done) return;
      const c = cellAt(x, y); if (!c) return;
      if (st.sel && near(st.sel, c)) { const s = st.sel; st.drag = null; trySwap(s, c); return; }
      st.sel = c; st.drag = c; EQ.audio.sfx('open');
    }
    function showHint() {
      const ms = findMoves().filter(m => m.ev.colors.has(st.ansCol));
      if (ms.length) st.hint = U.pick(ms);
    }

    fillBoard();
    nextQuestion();

    return {
      onClick,
      onKey(k) { if (k === 'KeyH') showHint(); if (k === 'KeyL' && st.q) api.say(st.q.say || st.w.en); },
      update(dt) {
        st.inv = Math.max(0, st.inv - dt); st.reveal = Math.max(0, st.reveal - dt); st.flash = Math.max(0, st.flash - dt);
        // di chuyển các ô (rơi / trượt)
        for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
          const k = st.grid[x][y]; if (!k) continue;
          if (k.dying > 0) { k.dying -= dt; continue; }
          if (k.fall) { k.vy += 2600 * dt; k.oy += k.vy * dt; if (k.oy >= 0) { k.oy = 0; k.vy = 0; k.fall = false; } }
          else {
            const sp = CELL / 0.16 * dt;
            if (k.ox) k.ox = Math.abs(k.ox) <= sp ? 0 : k.ox - Math.sign(k.ox) * sp;
            if (k.oy) k.oy = Math.abs(k.oy) <= sp ? 0 : k.oy - Math.sign(k.oy) * sp;
          }
        }
        // kéo chuột
        if (st.drag && api.mouse.down && st.phase === 'idle') {
          const c = cellAt(api.mouse.x, api.mouse.y);
          if (c && near(st.drag, c)) { const s = st.drag; st.drag = null; trySwap(s, c); }
        }
        if (!api.mouse.down) st.drag = null;
        if (st.phase === 'swapping' && settled()) {
          if (st.pendingInvalid) { const [a, b] = st.pendingInvalid; swapCells(a, b); setOffsets(a, b); st.pendingInvalid = null; st.phase = 'swapback'; }
          else resolveSwap();
        } else if (st.phase === 'swapback' && settled()) st.phase = 'idle';
        else if (st.phase === 'clearing') { st.popT -= dt; if (st.popT <= 0) gravity(); }
        else if (st.phase === 'falling' && settled()) {
          const rs = runs();
          if (rs.length) { const set = new Set(), made = []; rs.forEach(r => { r.cells.forEach(c => set.add(c[0] + ',' + c[1])); if (r.cells.length >= 4) made.push({ at: r.cells[Math.floor(r.cells.length / 2)], sp: r.cells.length >= 5 ? 'b' : (r.dir === 'h' ? 'v' : 'h'), c: r.c }); }); startClear(set, made); }
          else turnEnd();
        }
        if (st.phase === 'idle') {
          if (st.nextAt && S.t >= st.nextAt) { st.nextAt = 0; nextQuestion(); }
          else if (!st.nextAt && !st.done) { st.idle += dt; if (st.idle > 8 && !st.hint) showHint(); }
        }
        api.hud('<b>🍬 Candy Crush chữ</b><span>Câu ' + Math.min(st.asked, st.goal) + '/' + st.goal + '</span><span>🎯 Lượt ' + st.moves + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        // nền trời kẹo ngọt
        const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#bfe6ff'); g.addColorStop(0.6, '#ffe3f1'); g.addColorStop(1, '#fff2c9'); c.fillStyle = g; c.fillRect(0, 0, CW, CH);
        c.fillStyle = 'rgba(255,255,255,.7)'; [[120, 60, 1], [520, 36, 0.8], [760, 70, 1.1]].forEach(q => { const x = (q[0] + t * 6) % (CW + 160) - 80; c.beginPath(); c.arc(x, q[1], 18 * q[2], 0, 7); c.arc(x + 20 * q[2], q[1] - 8 * q[2], 22 * q[2], 0, 7); c.arc(x + 44 * q[2], q[1], 18 * q[2], 0, 7); c.fill(); });
        drawPanel(c, t);
        drawBoard(c, t);
        if (st.lives <= 0) txt(c, 'Hết tim rồi! 🛡️ Phòng thủ giúp chặn ghép nhầm', BX + COLS * CELL / 2, CH / 2, 24, '#ffe082');
        else if (st.moves <= 0 && st.phase === 'idle') txt(c, 'Hết lượt!', BX + COLS * CELL / 2, CH / 2, 30, '#ffe082');
      },
      _st: st, _swap: (a, b) => trySwap(a, b), _moves: findMoves, _hint: showHint, _settled: settled
    };

    // ---------- vẽ ----------
    function drawPanel(c, t) {
      const q = st.q; if (!q) return;
      c.save();
      c.fillStyle = 'rgba(255,255,255,.88)'; rr(c, 12, 12, 360, 476, 22); c.fill();
      c.strokeStyle = '#f48fb1'; c.lineWidth = 4; c.stroke();
      c.textBaseline = 'middle';
      txt(c, 'Câu ' + Math.min(st.asked, st.goal) + ' / ' + st.goal, 36, 34, 15, '#ad1457', 'left', 'rgba(255,255,255,.9)');
      // thanh tiến độ
      c.fillStyle = '#f8bbd0'; rr(c, 120, 26, 232, 16, 8); c.fill();
      c.fillStyle = '#ec407a'; rr(c, 120, 26, Math.max(10, 232 * st.correct / st.goal), 16, 8); c.fill();
      // đề
      const cx = 192;
      if (st.mode === 'listen') {
        txt(c, '🔊', cx, 78, 40); txt(c, 'Nghe và chọn đáp án đúng', cx, 112, 17, '#6a1b9a', 'center', 'rgba(255,255,255,.9)'); txt(c, '(bấm L để nghe lại)', cx, 134, 13, '#8e6aa8', 'center', 'rgba(255,255,255,.9)');
      } else if (st.mode === 'pic') {
        c.font = '62px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillStyle = '#000'; c.fillText(q.pic, cx, 92); txt(c, 'Từ tiếng Anh của hình này là gì?', cx, 136, 15, '#6a1b9a', 'center', 'rgba(255,255,255,.9)');
      } else {
        const sz = q.prompt.length > 34 ? 20 : q.prompt.length > 20 ? 24 : 30;
        c.font = 'bold ' + sz + 'px ' + FONT;
        const lines = wrap(c, q.prompt.replace('___', '_____'), 330).slice(0, 3);
        const y0 = 86 - (lines.length - 1) * (sz * 0.6);
        lines.forEach((ln, i) => txt(c, ln, cx, y0 + i * sz * 1.2, sz, '#4a148c', 'center', 'rgba(255,255,255,.95)'));
        if (q.sub) { c.font = '14px ' + FONT; wrap(c, '(' + q.sub + ')', 330).slice(0, 2).forEach((ln, i) => txt(c, ln, cx, 130 + i * 17, 14, '#7b5a99', 'center', 'rgba(255,255,255,.9)')); }
      }
      // các đáp án = màu kẹo
      const n = q.options.length, rowH = n <= 3 ? 70 : 58, y0 = 156;
      q.options.forEach((o, i) => {
        const y = y0 + i * (rowH + 4), col = st.optCol[i];
        const isAns = o === q.answer, showRight = st.reveal > 0 && isAns, showWrong = st.reveal > 0 && st.ok === false && col === st.optCol[st.chosenIdx];
        c.fillStyle = showRight ? '#c8e6c9' : showWrong ? '#ffcdd2' : '#fff3fa';
        rr(c, 24, y, 336, rowH, 16); c.fill();
        c.strokeStyle = showRight ? '#2e7d32' : showWrong ? '#c62828' : HEX[col]; c.lineWidth = showRight || showWrong ? 4 : 2.5; c.stroke();
        // viên kẹo màu của đáp án
        const bob = st.reveal > 0 ? 0 : Math.sin(t * 3 + i) * 1.5;
        c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(56, y + rowH / 2, 25, 0, 7); c.fill(); c.strokeStyle = HEX[col]; c.lineWidth = 3; c.stroke();
        if (!drawImg(c, 'candy_' + KIND[col], 56, y + rowH / 2 + bob, 40)) { c.fillStyle = HEX[col]; c.beginPath(); c.arc(56, y + rowH / 2, 15, 0, 7); c.fill(); }
        // chữ đáp án (tự thu nhỏ để vừa)
        let sz = 22; c.font = 'bold ' + sz + 'px ' + FONT;
        let lines = wrap(c, o, 262);
        while ((lines.length > 2 || lines.some(l => c.measureText(l).width > 262)) && sz > 12) { sz--; c.font = 'bold ' + sz + 'px ' + FONT; lines = wrap(c, o, 262); }
        lines.slice(0, 2).forEach((ln, k) => txt(c, ln, 92, y + rowH / 2 + (k - (Math.min(2, lines.length) - 1) / 2) * (sz + 3), sz, '#33174d', 'left', 'rgba(255,255,255,.9)'));
        if (showRight) txt(c, '✓', 344, y + rowH / 2, 26, '#2e7d32', 'right', 'rgba(255,255,255,.9)');
      });
      // lời giải thích sau khi trả lời
      if (st.reveal > 0 && q.review) {
        c.globalAlpha = Math.min(1, st.reveal * 2);
        c.fillStyle = st.ok ? '#e8f5e9' : '#fff8e1'; rr(c, 24, 398, 336, 50, 12); c.fill(); c.strokeStyle = st.ok ? '#66bb6a' : '#ffb300'; c.lineWidth = 2; c.stroke();
        c.font = '14px ' + FONT; wrap(c, q.review, 316).slice(0, 2).forEach((ln, i) => txt(c, ln, 192, 414 + i * 19, 14, '#3e2723', 'center', 'rgba(255,255,255,.8)'));
        c.globalAlpha = 1;
      }
      hearts(c, st.lives, st.max, 26, 468);
      txt(c, '🎯 ' + st.moves, 352, 468, 20, '#ad1457', 'right', 'rgba(255,255,255,.9)');
      c.restore();
    }
    function drawBoard(c, t) {
      c.save();
      c.fillStyle = 'rgba(255,255,255,.55)'; rr(c, BX - 10, BY - 10, COLS * CELL + 20, ROWS * CELL + 20, 22); c.fill();
      c.strokeStyle = '#f48fb1'; c.lineWidth = 4; c.stroke();
      rr(c, BX - 4, BY - 4, COLS * CELL + 8, ROWS * CELL + 8, 16); c.clip();
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) { c.fillStyle = (x + y) % 2 ? 'rgba(255,255,255,.55)' : 'rgba(255,224,240,.55)'; c.fillRect(BX + x * CELL, BY + y * CELL, CELL, CELL); }
      // gợi ý nước đi
      if (st.hint && st.phase === 'idle') {
        const k = 0.5 + 0.5 * Math.sin(t * 8);
        [st.hint.a, st.hint.b].forEach(q => { c.strokeStyle = 'rgba(255,214,0,' + (0.5 + 0.5 * k) + ')'; c.lineWidth = 4; rr(c, BX + q[0] * CELL + 2, BY + q[1] * CELL + 2, CELL - 4, CELL - 4, 12); c.stroke(); });
      }
      for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) {
        const k = st.grid[x][y]; if (!k) continue;
        const px = BX + x * CELL + CELL / 2 + k.ox, py = BY + y * CELL + CELL / 2 + k.oy;
        let sc = 1, al = 1;
        if (k.dying > 0) { const f = k.dying / 0.28; sc = 1 + (1 - f) * 0.35; al = f; }
        const sel = st.sel && st.sel[0] === x && st.sel[1] === y;
        if (sel) { c.fillStyle = 'rgba(255,255,255,.8)'; rr(c, BX + x * CELL + 3, BY + y * CELL + 3, CELL - 6, CELL - 6, 14); c.fill(); sc = 1.08 + Math.sin(t * 10) * 0.04; }
        c.save(); c.globalAlpha = al; c.translate(px, py); c.scale(sc, sc);
        drawCandy(c, k, t);
        c.restore();
      }
      c.restore();
    }
    function drawCandy(c, k, t) {
      if (k.sp === 'b') { // kẹo cầu vồng
        for (let i = 0; i < 6; i++) { c.fillStyle = HEX[i]; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 25, i * Math.PI / 3 + t, (i + 1) * Math.PI / 3 + t); c.fill(); }
        c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill();
        c.font = '17px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('⭐', 0, 1);
        c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 25, 0, 7); c.stroke();
        return;
      }
      if (!drawImg(c, 'candy_' + KIND[k.c], 0, -2, 50)) { c.fillStyle = HEX[k.c]; c.beginPath(); c.arc(0, 0, 21, 0, 7); c.fill(); }
      if (k.sp) { // kẹo sọc: vạch trắng theo hướng nổ
        c.save(); c.beginPath(); c.arc(0, -1, 23, 0, 7); c.clip();
        c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4;
        for (let i = -3; i <= 3; i++) { c.beginPath(); if (k.sp === 'h') { c.moveTo(-26, i * 7); c.lineTo(26, i * 7); } else { c.moveTo(i * 7, -26); c.lineTo(i * 7, 26); } c.stroke(); }
        c.restore();
        c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -1, 23, 0, 7); c.stroke();
      }
    }
  };
})();
