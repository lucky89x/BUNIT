/* ENGLISH QUEST – 🌱 NÔNG TRẠI CHỮ (bản 1.8, quầy ở Làng Khởi Đầu, gần vườn táo)
 * 6 luống đất, mỗi luống mang 1 từ tiếng Anh. Bấm luống có từ đúng → tưới nước, cây lớn thêm 1 bậc:
 *   hạt giống → mầm → nụ → RAU CỦ CHÍN (tự thu hoạch vào thùng gỗ). Bấm nhầm → quạ tới mổ (mất 1 ❤️).
 * Trang bị: ⚔️ Sức mạnh ≥ 6 = phân bón (lớn 2 bậc/lần) • 🛡️ Phòng thủ = bù nhìn đuổi quạ • 🍀 May mắn = được mùa x2
 * Ảnh: EQ.MG_IMG farm_* (assets/minigame/CREDITS.md).
 */
window.EQ = window.EQ || {};
(function () {
  const A = EQ.arcade, U = EQ.U, SP = EQ.sprites;
  const { rr, txt, fitText, promptBar } = A.util;
  const { fx, pts, hearts, hurt, gearHud } = A.act;
  const CW = 880, CH = 500;
  const img = A.mgImg, ready = i => i.complete && i.naturalWidth > 0;
  function draw(c, k, x, y, h, opt) {
    const i = img(k); if (!ready(i)) return false;
    const w = h * i.naturalWidth / i.naturalHeight; opt = opt || {};
    c.save(); c.translate(x, y); if (opt.rot) c.rotate(opt.rot); if (opt.alpha != null) c.globalAlpha = opt.alpha;
    c.drawImage(i, -w / 2, -h / 2, w, h); c.restore(); return true;
  }

  A.GAMES.farm = { name: 'Nông trại chữ', icon: '🌱', where: 'Làng Khởi Đầu', desc: 'Bấm luống đất có từ đúng để tưới cây. Cây lớn dần từ hạt → mầm → nụ → rau củ chín. Thu hoạch thật nhiều nhé!', keys: 'Bấm chuột vào luống đất (hoặc phím 1–6)' };
  const CROPS = [['carrot', 'Cà rốt'], ['tomato', 'Cà chua'], ['eggplant', 'Cà tím'], ['pepper', 'Ớt chuông'], ['radish', 'Củ cải'], ['onion', 'Hành lá'], ['wheat', 'Lúa mì'], ['beans', 'Đậu'], ['pomegranate', 'Lựu'], ['sunflower', 'Hoa hướng dương']];
  const STAGE = ['farm_seedbag', 'farm_sprout', 'farm_bud'];

  A.impl.farm = function (api) {
    const { S, p } = api, E = fx(p);
    const COLS = 3, ROWS = 2, PW = 230, PH = 150, X0 = (CW - COLS * PW) / 2 - 40, Y0 = 108;
    const pool = api.pool.slice(), poolIds = new Set(pool.map(w => w.id));
    const bank = pool.slice();
    pool.slice(0, 3).forEach(w => api.distractors(w, 6).forEach(d => { if (!bank.some(b => b.en === d.en)) bank.push(d); }));
    const grow = E.atk >= 6 ? 2 : 1;
    const st = { lives: E.hp, max: E.hp, inv: 0, plots: [], w: null, mode: 'vi', tried: false, asked: 0, goal: 14, done: false, crate: [], flies: [], drops: [], crow: null, harvest: 0, wait: 0 };
    const onBoard = () => new Set(st.plots.map(k => k.w && k.w.en));
    const freshWord = () => { const on = onBoard(); return U.shuffle(bank.filter(w => !on.has(w.en)))[0] || U.pick(bank); };
    for (let i = 0; i < COLS * ROWS; i++) st.plots.push({ i, x: i % COLS, y: Math.floor(i / COLS), w: null, stage: 0, crop: U.pick(CROPS), water: 0, ripe: 0 });
    st.plots.forEach(k => { k.w = freshWord(); });
    const center = k => ({ x: X0 + k.x * PW + PW / 2, y: Y0 + k.y * PH + PH / 2 + 10 });
    function next() {
      if (st.asked >= st.goal || st.lives <= 0) { st.done = true; setTimeout(api.finish, 1000); return; }
      const cand = st.plots.filter(k => !k.ripe && poolIds.has(k.w.id));
      const k = cand.length ? U.pick(cand) : U.pick(st.plots.filter(q => !q.ripe));
      if (!poolIds.has(k.w.id)) k.w = U.pick(pool);
      st.w = k.w; st.mode = api.promptFor(st.w); st.tried = false; st.asked++;
      if (st.mode === 'listen') api.say(st.w.en);
    }
    next();
    function click(mx, my) {
      if (st.done || !st.w || st.wait > 0) return;
      const k = st.plots.find(q => { const c0 = center(q); return Math.abs(mx - c0.x) < PW / 2 - 8 && Math.abs(my - c0.y) < PH / 2 - 6; });
      if (k) pick(k);
    }
    function pick(k) {
      if (!k || k.ripe || st.done || !st.w || st.wait > 0) return;
      const c0 = center(k);
      if (k.w.id !== st.w.id) {
        EQ.audio.sfx('wrong'); api.float(c0.x, c0.y - 50, '✗ ' + k.w.en + ' = ' + k.w.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        // quạ bay tới mổ – 🛡️ bù nhìn có thể đuổi đi
        st.crow = { x: -40, y: 80, tx: c0.x, ty: c0.y - 20, t: 0 };
        st.inv = 0; hurt(api, st, c0.x, c0.y);
        if (st.lives <= 0) { st.done = true; setTimeout(api.finish, 1000); }
        return;
      }
      api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
      S.score += pts(p, st.tried ? 30 : 80);
      k.water = 1.0; EQ.audio.sfx('heal');
      for (let i = 0; i < 14; i++) st.drops.push({ x: c0.x - 30 + Math.random() * 60, y: c0.y - 70 - Math.random() * 20, vy: 120 + Math.random() * 80, life: 0.7 });
      k.stage = Math.min(3, k.stage + grow);
      api.float(c0.x, c0.y - 60, grow > 1 ? '💧 Phân bón! +2 bậc' : '💧 Lớn lên!', '#b3e5fc');
      st.w = null; st.wait = 0.9;
      if (k.stage >= 3) k.ripe = 1.3;
      else k.w = freshWord();
    }
    return {
      onClick: click,
      onKey(k) {
        if (k === 'KeyL' && st.w) api.say(st.w.en);
        const n = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4, Digit6: 5 }[k];
        if (n != null) pick(st.plots[n]);
      },
      update(dt) {
        st.inv = Math.max(0, st.inv - dt);
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0 && !st.done) next(); }
        st.plots.forEach(k => {
          k.water = Math.max(0, k.water - dt);
          if (k.ripe > 0) {
            k.ripe -= dt;
            if (k.ripe <= 0) { // thu hoạch → bay vào thùng
              const c0 = center(k), lucky = Math.random() * 100 < E.luck / 2;
              const n = lucky ? 2 : 1;
              for (let j = 0; j < n; j++) st.flies.push({ k: 'farm_' + k.crop[0], x: c0.x + j * 18, y: c0.y - 10, t: 0 });
              st.harvest += n; S.coins += n; S.score += pts(p, 60 * n);
              api.float(c0.x, c0.y - 70, (lucky ? '🍀 Được mùa x2! ' : '🧺 Thu hoạch ') + k.crop[1], '#fff59d');
              api.burst(c0.x, c0.y, 24, ['#ffd54f', '#aed581', '#ffffff']); EQ.audio.sfx('coin');
              k.ripe = 0; k.stage = 0; k.crop = U.pick(CROPS); k.w = freshWord();
            }
          }
        });
        st.flies.forEach(f => { f.t += dt * 1.4; });
        st.flies.filter(f => f.t >= 1).forEach(f => st.crate.push(f.k));
        st.flies = st.flies.filter(f => f.t < 1);
        st.drops.forEach(d => { d.y += d.vy * dt; d.life -= dt; });
        st.drops = st.drops.filter(d => d.life > 0);
        if (st.crow) { st.crow.t += dt; if (st.crow.t > 1.6) st.crow = null; }
        api.hud('<b>🌱 Nông trại chữ</b><span>Lượt ' + st.asked + '/' + st.goal + '</span><span>🧺 ' + st.harvest + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        // trời & đồi cỏ
        const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#b3e5fc'); g.addColorStop(0.22, '#e1f5fe'); g.addColorStop(0.23, '#9ccc65'); g.addColorStop(1, '#689f38'); c.fillStyle = g; c.fillRect(0, 0, CW, CH);
        c.fillStyle = '#fff59d'; c.beginPath(); c.arc(820, 40, 26, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 60; i++) c.fillRect((i * 137) % CW, 120 + (i * 71) % 380, 3, 8);
        // hàng rào gỗ
        c.fillStyle = '#a1887f';
        for (let x = 10; x < CW; x += 34) { c.fillRect(x, 92, 10, 26); }
        c.fillRect(0, 98, CW, 6); c.fillRect(0, 110, CW, 5);
        // luống đất
        st.plots.forEach((k, n) => {
          const q = center(k), want = st.w && k.w.id === st.w.id;
          c.fillStyle = '#5d4037'; rr(c, q.x - PW / 2 + 10, q.y - PH / 2 + 12, PW - 20, PH - 24, 18); c.fill();
          c.fillStyle = k.water > 0 ? '#4e342e' : '#795548'; rr(c, q.x - PW / 2 + 14, q.y - PH / 2 + 14, PW - 28, PH - 32, 16); c.fill();
          c.strokeStyle = 'rgba(62,39,35,.6)'; c.lineWidth = 3;
          for (let r = 0; r < 3; r++) { c.beginPath(); c.moveTo(q.x - PW / 2 + 28, q.y - 30 + r * 24); c.lineTo(q.x + PW / 2 - 28, q.y - 30 + r * 24); c.stroke(); }
          // cây theo bậc lớn
          const bob = Math.sin(t * 3 + n) * 2;
          if (k.stage >= 3) {
            c.save(); c.shadowColor = '#fff59d'; c.shadowBlur = 16;
            if (!draw(c, 'farm_' + k.crop[0], q.x, q.y - 12 + bob, 74)) txt(c, '🥕', q.x, q.y - 12, 40);
            c.restore();
          } else {
            const hs = [40, 56, 64][k.stage];
            if (!draw(c, STAGE[k.stage], q.x, q.y - 14 + bob * 0.5, hs)) txt(c, ['🌰', '🌱', '🌿'][k.stage], q.x, q.y - 14, 30);
            for (let s = 0; s < 3; s++) { c.fillStyle = s < k.stage ? '#aed581' : 'rgba(255,255,255,.3)'; c.beginPath(); c.arc(q.x + PW / 2 - 34 + s * 0 - (2 - s) * 12, q.y - PH / 2 + 26, 5, 0, 7); c.fill(); }
          }
          if (k.water > 0) draw(c, 'farm_can', q.x + 46, q.y - 56, 52, { rot: -0.6 + Math.sin(t * 10) * 0.05 });
          if (!k.ripe) {
            const s = fitText(c, k.w.en, PW - 40, 19);
            c.font = 'bold ' + s + 'px "Segoe UI", system-ui, sans-serif';
            const w = Math.min(PW - 24, c.measureText(k.w.en).width + 40);
            c.fillStyle = '#fff8e1'; rr(c, q.x - w / 2, q.y + 32, w, 28, 10); c.fill();
            c.strokeStyle = '#8d6e63'; c.lineWidth = 2; c.stroke();
            txt(c, (n + 1) + '  ' + k.w.en, q.x, q.y + 47, s, '#3e2723', 'center', 'rgba(255,255,255,.7)');
          }
          void want;
        });
        st.drops.forEach(d => { c.fillStyle = 'rgba(129,212,250,' + Math.min(1, d.life * 2) + ')'; c.fillRect(d.x, d.y, 3, 8); });
        // thùng thu hoạch
        const bx = CW - 80, by = CH - 120;
        if (!draw(c, 'farm_crate', bx, by + 10, 96)) { c.fillStyle = '#8d6e63'; c.fillRect(bx - 45, by - 30, 90, 70); }
        st.crate.slice(-6).forEach((k, i) => draw(c, k, bx - 30 + (i % 3) * 30, by - 24 - Math.floor(i / 3) * 16, 34));
        txt(c, '🧺 ' + st.harvest, bx, by + 66, 20, '#fff59d');
        st.flies.forEach(f => {
          const e = f.t * f.t * (3 - 2 * f.t), x = f.x + (bx - f.x) * e, y = f.y + (by - 20 - f.y) * e - Math.sin(f.t * Math.PI) * 120;
          draw(c, f.k, x, y, 50 - f.t * 14);
        });
        draw(c, 'farm_barrow', 70, CH - 40, 60);
        draw(c, 'farm_sunflower', 30, 140 + Math.sin(t * 2) * 2, 54);
        // bù nhìn (🛡️ phòng thủ)
        if (E.def > 0) { c.font = '38px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🧑‍🌾', CW - 80, 160); txt(c, '🛡️ ' + E.def + '%', CW - 80, 196, 13, '#fff'); }
        if (st.crow) {
          const k2 = Math.min(1, st.crow.t / 0.6), x = st.crow.x + (st.crow.tx - st.crow.x) * k2, y = st.crow.y + (st.crow.ty - st.crow.y) * k2 + Math.sin(t * 20) * 4;
          c.font = '40px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🐦‍⬛', st.crow.t > 1 ? x + (st.crow.t - 1) * 600 : x, st.crow.t > 1 ? y - (st.crow.t - 1) * 300 : y);
        }
        hearts(c, st.lives, st.max, 14, CH - 18);
        txt(c, grow > 1 ? '⚔️ Phân bón: cây lớn 2 bậc/lần' : '⚔️ Sức mạnh ≥ 6 → có phân bón', 180 + 120, CH - 18, 13, '#f1f8e9', 'left');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Tưới luống có từ đúng');
        if (st.lives <= 0) txt(c, 'Quạ phá hết vườn rồi! 🛡️ Phòng thủ giúp đuổi quạ', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st, _pick: pick, _center: center
    };
  };
})();
