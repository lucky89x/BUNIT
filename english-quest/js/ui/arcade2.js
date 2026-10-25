/* ENGLISH QUEST – KHU VUI CHƠI: 4 trò HÀNH ĐỘNG (bản 1.6)
 *  🥷 Ninja vượt ải   – chạy, nhảy, phi tiêu; chạm cuộn giấy có từ đúng
 *  🗡️ Ninja diệt quái – đi khắp đấu trường, phi tiêu trúng con quái mang từ đúng
 *  🔨 Đập chuột chữ   – đập con chuột cầm từ đúng
 *  🐍 Rắn săn chữ     – điều khiển rắn ăn chữ cái theo đúng thứ tự để ghép từ
 * TRANG BỊ CÓ TÁC DỤNG THẬT trong các trò này (xem EQ.rpg.effects):
 *  ❤️ Máu = số mạng • ⚔️ Sức mạnh = sát thương phi tiêu/búa • 🛡️ Phòng thủ = % chặn đòn
 *  🍀 May mắn = % điểm thưởng + cơ hội chí mạng
 */
window.EQ = window.EQ || {};
(function () {
  const A = EQ.arcade, U = EQ.U, SP = EQ.sprites;
  const { rr, txt, fitText, sky, cloud, promptBar } = A.util;
  const CW = 880, CH = 500;

  Object.assign(A.GAMES, {
    runner: { name: 'Ninja vượt ải', icon: '🥷', action: true, desc: 'Chạy, nhảy qua chông và quái, phi tiêu diệt quái. Chạm cuộn giấy có từ đúng!', keys: 'Space/↑ nhảy (2 lần = nhảy đôi) • F phi tiêu' },
    slayer: { name: 'Ninja diệt quái', icon: '🗡️', action: true, desc: 'Quái vây quanh, mỗi con mang 1 từ. Phi tiêu trúng con mang từ đúng! Sức mạnh càng cao, quái càng nhanh gục.', keys: 'W A S D di chuyển • bấm chuột hoặc Space phi tiêu' },
    whack: { name: 'Đập chuột chữ', icon: '🔨', action: true, desc: 'Chuột thò lên cầm từ tiếng Anh. Đập trúng con cầm từ đúng trước khi nó trốn!', keys: 'Bấm chuột, hoặc phím 1–8' },
    snake: { name: 'Rắn săn chữ', icon: '🐍', action: true, desc: 'Đủ mọi chữ cái của từ nằm trên bàn – ăn lần lượt theo đúng thứ tự để ghép từ. Rắn đi xuyên tường, ăn nhầm bị trừ máu.', keys: '← ↑ → ↓ / W A S D hoặc bấm chuột để rẽ • H gợi ý' }
  });

  // hiệu quả trang bị trong trò hành động
  function fx(p) { return EQ.rpg.effects(p); }
  // điểm có cộng May mắn
  const pts = (p, n) => Math.round(n * (1 + fx(p).luck / 100));
  function hearts(c, n, max, x, y) {
    c.font = '20px ' + SP.EMOJI_FONT; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (let i = 0; i < max; i++) c.fillText(i < n ? '❤️' : '🤍', x + i * 24, y);
  }
  // trúng đòn: Phòng thủ có thể chặn
  function hurt(api, st, x, y) {
    if (st.inv > 0) return false;
    st.inv = 1.2;
    if (Math.random() * 100 < fx(api.p).def) { api.float(x, y - 40, '🛡️ Chặn!', '#80d8ff'); EQ.audio.sfx('heal'); return false; }
    st.lives--; api.S.shake = 0.3; EQ.audio.sfx('bump'); api.float(x, y - 40, '-1 ❤️', '#ff8a80');
    return true;
  }
  function gearHud(p) {
    const e = fx(p);
    return '<span title="Trang bị càng mạnh càng dễ chơi">⚔️' + e.atk + ' 🛡️' + e.def + '% 🍀+' + e.luck + '%</span>';
  }
  function shuriken(c, x, y, r, t) {
    c.save(); c.translate(x, y); c.rotate(t * 18);
    c.fillStyle = '#cfd8dc'; c.strokeStyle = '#37474f'; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * 0.35 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#37474f'; c.beginPath(); c.arc(0, 0, r * 0.18, 0, 7); c.fill();
    c.restore();
  }
  // dùng chung cho các trò ở arcade3.js
  A.act = { fx, pts, hearts, hurt, gearHud, shuriken };
  const MONS = ['slime', 'fluff', 'mush', 'star', 'golem'];
  const MCOL = ['#66bb6a', '#ce93d8', '#e53935', '#ffd54f', '#78909c', '#42a5f5', '#ff8a65'];

  // =================== 5. NINJA VƯỢT ẢI ===================
  A.impl.runner = function (api) {
    const { S, p } = api, E = fx(p);
    const GROUND = 430, NX = 170;
    const words = api.pool.slice(0, 12);
    let wi = 0;
    const st = { y: GROUND, vy: 0, jumps: 0, lives: E.hp, max: E.hp, inv: 0, speed: 260, dist: 0, obs: [], stars: [], scrolls: [], cd: 0, next: 1.5, nextObs: 2.2, w: null, mode: 'vi', tried: false, done: false, run: 0 };
    function jump() { if (st.jumps < 2) { st.vy = st.jumps ? -560 : -640; st.jumps++; EQ.audio.sfx('step'); } }
    function throwStar() { if (st.cd > 0) return; st.cd = 0.45; st.stars.push({ x: NX + 20, y: st.y - 30 }); EQ.audio.sfx('spell'); }
    function nextWord() {
      if (wi >= words.length) { st.done = true; setTimeout(api.finish, 900); return; }
      const w = words[wi++];
      st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const opts = U.shuffle([w].concat(api.distractors(w, 2)));
      const hs = U.shuffle([GROUND - 40, GROUND - 150, GROUND - 250]);
      st.scrolls = opts.map((o, i) => ({ w: o, x: CW + 140 + i * 170, y: hs[i], hit: false }));
      if (st.mode === 'listen') api.say(w.en);
    }
    function spawnObs() {
      const r = Math.random();
      if (r < 0.45) st.obs.push({ k: 'spike', x: CW + 40, y: GROUND, w: 34, h: 30 });
      else st.obs.push({ k: 'mon', x: CW + 40, y: GROUND, w: 40, h: 40, hp: 1 + Math.floor(st.dist / 4000), draw: U.pick(MONS), col: U.pick(MCOL), t: Math.random() * 5 });
    }
    nextWord();
    return {
      onKey(k) { if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') jump(); if (k === 'KeyF' || k === 'KeyJ') throwStar(); if (k === 'KeyL' && st.w) api.say(st.w.en); },
      onClick(x, y) { if (y > 300) jump(); else throwStar(); },
      update(dt) {
        if (st.done || st.lives <= 0) return;
        st.inv = Math.max(0, st.inv - dt); st.cd = Math.max(0, st.cd - dt);
        st.speed = Math.min(420, st.speed + dt * 4);
        const mv = st.speed * dt; st.dist += mv; st.run += dt;
        st.vy += 1600 * dt; st.y += st.vy * dt;
        if (st.y >= GROUND) { st.y = GROUND; st.vy = 0; st.jumps = 0; }
        st.nextObs -= dt; if (st.nextObs <= 0) { spawnObs(); st.nextObs = 1.3 + Math.random() * 1.4; }
        st.obs.forEach(o => { o.x -= mv * (o.k === 'mon' ? 1.15 : 1); });
        st.stars.forEach(s => { s.x += 700 * dt; });
        // phi tiêu trúng quái
        st.stars.forEach(s => st.obs.forEach(o => {
          if (o.k !== 'mon' || o.dead || s.gone) return;
          if (Math.abs(s.x - o.x) < 30 && Math.abs(s.y - (o.y - 22)) < 34) {
            s.gone = true;
            let d = E.atk; const crit = Math.random() * 100 < E.crit; if (crit) d *= 2;
            o.hp -= d; api.float(o.x, o.y - 60, (crit ? '💥 ' : '-') + d, crit ? '#ff8a65' : '#fff59d'); EQ.audio.sfx('hit');
            if (o.hp <= 0) { o.dead = true; api.burst(o.x, o.y - 20, 22); S.score += pts(p, 30); EQ.audio.sfx('coin'); S.coins++; }
          }
        }));
        st.stars = st.stars.filter(s => !s.gone && s.x < CW + 40);
        // va chạm
        st.obs.forEach(o => {
          if (o.dead || o.passed) return;
          if (Math.abs(o.x - NX) < (o.w / 2 + 12) && st.y > o.y - o.h + 6) { o.passed = true; if (hurt(api, st, NX, st.y)) { /* mất mạng */ } }
          if (o.x < NX - 40) o.passed = true;
        });
        st.obs = st.obs.filter(o => o.x > -60 && !(o.dead && o.x < -20));
        // cuộn giấy câu hỏi
        st.scrolls.forEach(sc => { sc.x -= mv; });
        st.scrolls.forEach(sc => {
          if (sc.hit || !st.w) return;
          if (Math.abs(sc.x - NX) < 40 && Math.abs(sc.y - (st.y - 30)) < 46) {
            sc.hit = true;
            const ok = sc.w.id === st.w.id;
            if (ok) {
              api.answer(st.w, !st.tried, 'pic'); S.score += pts(p, st.tried ? 40 : 120); api.burst(sc.x, sc.y, 30); api.float(sc.x, sc.y - 40, '✓ ' + st.w.en, '#b9f6ca'); api.say(st.w.en);
              st.w = null; st.next = 0.8;
            } else {
              if (!st.tried) api.answer(st.w, false, 'pic');
              st.tried = true; api.float(sc.x, sc.y - 40, '✗ ' + sc.w.en + ' = ' + sc.w.vi, '#ff8a80'); EQ.audio.sfx('wrong');
            }
          }
        });
        if (st.w && st.scrolls.length && st.scrolls.every(sc => sc.x < -60)) {
          // chạy qua mà không chạm từ đúng → hiện lại câu đó
          if (!st.tried) api.answer(st.w, false, 'pic');
          api.float(CW / 2, 200, '↺ ' + st.w.en + ' = ' + st.w.vi, '#ffe082');
          words.push(st.w); st.w = null; st.next = 0.6;
        }
        if (!st.w) { st.next -= dt; if (st.next <= 0) nextWord(); }
        if (st.lives <= 0) setTimeout(api.finish, 700);
        api.hud('<b>🥷 Ninja vượt ải</b><span>Từ ' + Math.min(wi, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t, off = st.dist;
        sky(c, '#8fd3ff', '#e0f7ff');
        cloud(c, 900 - (off * 0.1) % 1100, 110, 1.1); cloud(c, 1300 - (off * 0.08 + 400) % 1300, 170, 0.8);
        c.fillStyle = '#9ccc8b';
        for (let i = 0; i < 6; i++) { const x = i * 220 - (off * 0.3) % 220; c.beginPath(); c.moveTo(x - 140, GROUND); c.lineTo(x, GROUND - 160); c.lineTo(x + 140, GROUND); c.fill(); }
        c.fillStyle = '#6d4c41'; c.fillRect(0, GROUND, CW, CH - GROUND);
        c.fillStyle = '#7cc35a'; c.fillRect(0, GROUND, CW, 14);
        c.fillStyle = '#5a9b3e'; for (let x = -((off) % 40); x < CW; x += 40) c.fillRect(x, GROUND + 14, 20, 4);
        st.scrolls.forEach(sc => {
          if (sc.hit && sc.w.id !== (st.w || {}).id) c.globalAlpha = 0.35;
          c.fillStyle = '#fff3c4'; c.strokeStyle = '#8d6e63'; c.lineWidth = 3; rr(c, sc.x - 62, sc.y - 22, 124, 44, 10); c.fill(); c.stroke();
          c.fillStyle = '#a1887f'; c.fillRect(sc.x - 68, sc.y - 24, 8, 48); c.fillRect(sc.x + 60, sc.y - 24, 8, 48);
          const s = fitText(c, sc.w.en, 110, 22); txt(c, sc.w.en, sc.x, sc.y + 1, s, '#4e342e', 'center', 'rgba(255,255,255,.6)');
          c.globalAlpha = 1;
        });
        st.obs.forEach(o => {
          if (o.dead) return;
          if (o.k === 'spike') {
            c.fillStyle = '#78909c'; c.strokeStyle = '#37474f'; c.lineWidth = 2;
            for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(o.x - 17 + i * 11, o.y); c.lineTo(o.x - 11 + i * 11, o.y - 30); c.lineTo(o.x - 5 + i * 11, o.y); c.fill(); c.stroke(); }
          } else {
            SP.monster(c, { draw: o.draw, color: o.col }, o.x, o.y, 17, o.col, t + o.t);
            if (o.hp > 1) txt(c, '❤' + o.hp, o.x, o.y - 50, 13, '#ffcdd2');
          }
        });
        st.stars.forEach(s => shuriken(c, s.x, s.y, 10, t));
        if (!(st.inv > 0 && Math.floor(t * 12) % 2)) SP.human(c, NX, st.y + 2, SP.playerLook(p.avatar), 'right', Math.floor(st.run * 10), { scale: 3, moving: st.y >= GROUND });
        hearts(c, st.lives, st.max, 14, CH - 22);
        txt(c, 'F: phi tiêu (⚔️' + E.atk + ')', CW - 12, CH - 22, 14, '#fff', 'right');
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Chạm cuộn giấy có từ đúng');
        if (st.lives <= 0) txt(c, 'Hết mạng rồi! 💪 Trang bị thêm ❤️ để có nhiều mạng hơn', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st
    };
  };

  // =================== 6. NINJA DIỆT QUÁI ===================
  A.impl.slayer = function (api) {
    const { S, p, keys, mouse } = api, E = fx(p);
    const words = api.pool.slice(0, 10);
    let wi = -1;
    const st = { x: CW / 2, y: CH / 2 + 40, dir: 'down', moving: false, anim: 0, lives: E.hp, max: E.hp, inv: 0, cd: 0, stars: [], mons: [], w: null, mode: 'vi', tried: false, wait: 0, done: false, wave: 0 };
    function nextWave() {
      wi++;
      if (wi >= words.length) { st.done = true; setTimeout(api.finish, 900); return; }
      st.wave = wi + 1;
      const w = words[wi];
      st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const opts = U.shuffle([w].concat(api.distractors(w, 3)));
      const hp = 2 + Math.floor(wi / 3); // quái mạnh dần → cần Sức mạnh cao để hạ nhanh
      const spots = U.shuffle([[60, 120], [CW - 60, 120], [60, CH - 40], [CW - 60, CH - 40], [CW / 2, 110], [CW / 2, CH - 30]]);
      st.mons = opts.map((o, i) => ({ w: o, x: spots[i][0], y: spots[i][1], hp, max: hp, draw: MONS[(i + wi) % MONS.length], col: MCOL[(i * 2 + wi) % MCOL.length], spd: 34 + wi * 3, t: Math.random() * 5, kb: 0, kx: 0, ky: 0, hurtT: 0 }));
      if (st.mode === 'listen') api.say(w.en);
    }
    function throwAt(tx, ty) {
      if (st.cd > 0 || st.done) return;
      st.cd = 0.35;
      const a = Math.atan2(ty - (st.y - 24), tx - st.x);
      st.stars.push({ x: st.x, y: st.y - 24, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, life: 1.2 });
      EQ.audio.sfx('spell');
    }
    const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    nextWave();
    return {
      onKey(k) {
        if (k === 'Space') { const d = DV[st.dir]; throwAt(st.x + d[0] * 200, st.y - 24 + d[1] * 200); }
        if (k === 'KeyL' && st.w) api.say(st.w.en);
      },
      onClick(x, y) { throwAt(x, y); },
      update(dt) {
        if (st.done || st.lives <= 0) return;
        st.inv = Math.max(0, st.inv - dt); st.cd = Math.max(0, st.cd - dt);
        let dx = 0, dy = 0;
        if (keys.ArrowLeft || keys.KeyA) dx--; if (keys.ArrowRight || keys.KeyD) dx++;
        if (keys.ArrowUp || keys.KeyW) dy--; if (keys.ArrowDown || keys.KeyS) dy++;
        st.moving = !!(dx || dy);
        if (st.moving) {
          const l = Math.hypot(dx, dy); st.x += dx / l * 210 * dt; st.y += dy / l * 210 * dt; st.anim += dt * 10;
          st.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        } else if (mouse.moved) {
          const ax = mouse.x - st.x, ay = mouse.y - st.y; st.dir = Math.abs(ax) > Math.abs(ay) ? (ax < 0 ? 'left' : 'right') : (ay < 0 ? 'up' : 'down');
        }
        st.x = Math.max(24, Math.min(CW - 24, st.x)); st.y = Math.max(110, Math.min(CH - 10, st.y));
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) nextWave(); }
        st.mons.forEach(m => {
          m.t += dt; m.hurtT = Math.max(0, m.hurtT - dt);
          if (m.dead) return;
          if (m.kb > 0) { m.kb -= dt; m.x += m.kx * dt; m.y += m.ky * dt; return; }
          const ax = st.x - m.x, ay = st.y - m.y, l = Math.hypot(ax, ay) || 1;
          if (st.wait <= 0) { m.x += ax / l * m.spd * dt; m.y += ay / l * m.spd * dt; }
          if (l < 34 && hurt(api, st, st.x, st.y)) { m.kb = 0.3; m.kx = -ax / l * 300; m.ky = -ay / l * 300; }
          else if (l < 34) { m.kb = 0.3; m.kx = -ax / l * 300; m.ky = -ay / l * 300; }
        });
        st.stars.forEach(s => {
          s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
          st.mons.forEach(m => {
            if (m.dead || s.life <= 0) return;
            if (Math.hypot(s.x - m.x, s.y - (m.y - 20)) < 30) {
              s.life = 0;
              const ok = st.w && m.w.id === st.w.id;
              if (!ok) {
                m.hurtT = 0.4; EQ.audio.sfx('wrong');
                api.float(m.x, m.y - 70, '✗ ' + m.w.en + ' = ' + m.w.vi, '#ff8a80');
                if (st.w && !st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
                return;
              }
              let d = E.atk; const crit = Math.random() * 100 < E.crit; if (crit) d *= 2;
              m.hp -= d; m.hurtT = 0.3; m.kb = 0.15; m.kx = s.vx * 0.3; m.ky = s.vy * 0.3;
              EQ.audio.sfx('hit'); api.float(m.x, m.y - 70, (crit ? '💥 CHÍ MẠNG -' : '-') + d, crit ? '#ff8a65' : '#fff59d');
              if (m.hp <= 0) {
                m.dead = true; api.burst(m.x, m.y - 20, 40);
                api.answer(st.w, !st.tried, 'pic'); api.say(st.w.en);
                S.score += pts(p, st.tried ? 50 : 150); S.coins += 2;
                api.float(CW / 2, 170, '✓ ' + st.w.en + ' = ' + st.w.vi, '#b9f6ca');
                st.mons.forEach(o => { if (!o.dead) { o.dead = true; o.poof = true; api.burst(o.x, o.y - 20, 8, ['#cfd8dc']); } });
                st.w = null; st.wait = 1.1;
              }
            }
          });
        });
        st.stars = st.stars.filter(s => s.life > 0 && s.x > -20 && s.x < CW + 20 && s.y > 60 && s.y < CH + 20);
        if (st.lives <= 0) setTimeout(api.finish, 700);
        api.hud('<b>🗡️ Ninja diệt quái</b><span>Đợt ' + st.wave + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        c.fillStyle = '#86b95a'; c.fillRect(0, 0, CW, CH);
        for (let y = 80; y < CH; y += 40) for (let x = 0; x < CW; x += 40) { if ((x / 40 + y / 40) % 2) { c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(x, y, 40, 40); } }
        c.strokeStyle = 'rgba(80,50,20,.35)'; c.lineWidth = 6; c.strokeRect(10, 90, CW - 20, CH - 100);
        const ents = st.mons.filter(m => !m.dead).map(m => ({ y: m.y, f: () => {
          if (m.hurtT > 0 && Math.floor(t * 20) % 2) c.globalAlpha = 0.5;
          SP.monster(c, { draw: m.draw, color: m.col }, m.x, m.y, 19, m.col, m.t);
          c.globalAlpha = 1;
          c.fillStyle = 'rgba(30,20,60,.85)'; rr(c, m.x - 52, m.y - 78, 104, 26, 9); c.fill();
          const s = fitText(c, m.w.en, 96, 17); txt(c, m.w.en, m.x, m.y - 65, s, '#fff');
          c.fillStyle = '#4e342e'; c.fillRect(m.x - 22, m.y - 50, 44, 5); c.fillStyle = '#ef5350'; c.fillRect(m.x - 22, m.y - 50, 44 * Math.max(0, m.hp) / m.max, 5);
        } }));
        ents.push({ y: st.y, f: () => { if (!(st.inv > 0 && Math.floor(t * 12) % 2)) SP.human(c, st.x, st.y, SP.playerLook(p.avatar), st.dir, Math.floor(st.anim), { scale: 2.6, moving: st.moving }); } });
        ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
        st.stars.forEach(s => shuriken(c, s.x, s.y, 9, t));
        hearts(c, st.lives, st.max, 14, CH - 22);
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Phi tiêu vào quái mang từ đúng (⚔️ ' + E.atk + '/phát)');
        if (st.lives <= 0) txt(c, 'Hết mạng rồi! 💪 Mua trang bị ❤️🛡️ để trụ lâu hơn', CW / 2, CH / 2, 24, '#ffe082');
      },
      _st: st
    };
  };

  // =================== 7. ĐẬP CHUỘT CHỮ ===================
  A.impl.whack = function (api) {
    const { S, p } = api, E = fx(p);
    const words = api.pool.slice(0, 12);
    let wi = -1;
    const HOLES = []; for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) HOLES.push({ x: 125 + k * 210, y: 270 + r * 170, key: r * 4 + k + 1 });
    // ❤️ = số lần được sai; 🍀 = thêm thời gian chuột thò lên
    const st = { lives: E.hp, max: E.hp, inv: 0, moles: [], w: null, mode: 'vi', tried: false, wait: 0, done: false, hammer: { x: 0, y: 0, t: 0 }, up: 4 + E.luck / 50 };
    function next() {
      wi++;
      if (wi >= words.length || st.lives <= 0) { st.done = true; setTimeout(api.finish, 800); return; }
      const w = words[wi];
      st.w = w; st.mode = api.promptFor(w); st.tried = false;
      const opts = U.shuffle([w].concat(api.distractors(w, 3)));
      const holes = U.shuffle(HOLES.slice()).slice(0, 4);
      st.moles = opts.map((o, i) => ({ w: o, h: holes[i], up: 0, t: -i * 0.25, life: st.up, hit: false }));
      if (st.mode === 'listen') api.say(w.en);
    }
    function whack(m) {
      if (!m || m.hit || st.wait > 0 || !st.w) return;
      st.hammer = { x: m.h.x, y: m.h.y - 40, t: 0.25 };
      const ok = m.w.id === st.w.id;
      m.hit = true;
      if (ok) {
        api.answer(st.w, !st.tried, 'pic'); S.score += pts(p, st.tried ? 40 : 100 + E.atk * 10); EQ.audio.sfx('hit'); api.burst(m.h.x, m.h.y - 30, 30);
        api.float(m.h.x, m.h.y - 90, '✓ ' + st.w.en + (E.atk > 1 ? '  ⚔️+' + E.atk * 10 : ''), '#b9f6ca'); api.say(st.w.en);
        st.w = null; st.wait = 0.9;
      } else {
        EQ.audio.sfx('wrong'); api.float(m.h.x, m.h.y - 90, '✗ ' + m.w.en + ' = ' + m.w.vi, '#ff8a80');
        if (!st.tried) { st.tried = true; api.answer(st.w, false, 'pic'); }
        hurt(api, st, m.h.x, m.h.y - 40);
      }
    }
    next();
    return {
      onKey(k) { if (/^Digit[1-8]$/.test(k)) { const n = +k.slice(5); whack(st.moles.find(m => m.h.key === n && m.up > 0.5)); } if (k === 'KeyL' && st.w) api.say(st.w.en); },
      onClick(x, y) { whack(st.moles.find(m => m.up > 0.5 && Math.abs(m.h.x - x) < 70 && y > m.h.y - 110 && y < m.h.y + 20)); },
      update(dt) {
        if (st.done) return;
        st.inv = Math.max(0, st.inv - dt); st.hammer.t = Math.max(0, st.hammer.t - dt);
        if (st.wait > 0) { st.wait -= dt; st.moles.forEach(m => { m.up = Math.max(0, m.up - dt * 4); }); if (st.wait <= 0) next(); return; }
        let allDown = true;
        st.moles.forEach(m => {
          m.t += dt;
          if (m.hit && m.w.id !== (st.w || {}).id) { m.up = Math.max(0, m.up - dt * 4); return; }
          if (m.t < 0) return;
          if (m.t < m.life) { m.up = Math.min(1, m.up + dt * 5); allDown = false; } else m.up = Math.max(0, m.up - dt * 4);
          if (m.up > 0) allDown = false;
        });
        if (allDown && st.w) {
          // chuột trốn hết → đúng từ chưa đập: tính sai, cho xuất hiện lại
          if (!st.tried) api.answer(st.w, false, 'pic');
          st.tried = true; api.float(CW / 2, 160, '⏰ ' + st.w.en + ' = ' + st.w.vi, '#ffe082');
          if (hurt(api, st, CW / 2, 200) && st.lives <= 0) { st.done = true; setTimeout(api.finish, 800); return; }
          st.moles.forEach((m, i) => { m.t = -i * 0.2; m.hit = false; });
        }
        api.hud('<b>🔨 Đập chuột chữ</b><span>Câu ' + Math.min(wi + 1, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
      },
      draw(c) {
        const t = S.t;
        sky(c, '#b3e5fc', '#dcedc8');
        c.fillStyle = '#8bc34a'; c.fillRect(0, 140, CW, CH - 140);
        HOLES.forEach(h => { c.fillStyle = '#5d4037'; c.beginPath(); c.ellipse(h.x, h.y, 70, 22, 0, 0, 7); c.fill(); });
        st.moles.forEach(m => {
          if (m.up <= 0) return;
          const h = m.h, top = h.y - 70 * m.up;
          c.save(); c.beginPath(); c.rect(h.x - 80, h.y - 150, 160, 150); c.clip();
          c.fillStyle = m.hit && m.w.id === (st.w || {}).id ? '#bcaaa4' : '#8d6e63';
          c.beginPath(); c.ellipse(h.x, top + 30, 38, 46, 0, 0, 7); c.fill();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(h.x - 12, top + 16, 6, 0, 7); c.arc(h.x + 12, top + 16, 6, 0, 7); c.fill();
          c.fillStyle = '#212121'; c.beginPath(); c.arc(h.x - 12, top + 17, 3, 0, 7); c.arc(h.x + 12, top + 17, 3, 0, 7); c.fill();
          c.fillStyle = '#f48fb1'; c.beginPath(); c.arc(h.x, top + 28, 5, 0, 7); c.fill();
          c.restore();
          c.fillStyle = '#fffde7'; c.strokeStyle = '#6d4c41'; c.lineWidth = 2; rr(c, h.x - 66, top - 40, 132, 32, 8); c.fill(); c.stroke();
          const s = fitText(c, m.w.en, 120, 19); txt(c, m.w.en, h.x, top - 24, s, '#3e2723', 'center', 'rgba(255,255,255,.5)');
        });
        HOLES.forEach(h => { c.fillStyle = '#6d4c41'; c.beginPath(); c.ellipse(h.x, h.y + 4, 72, 12, 0, 0, Math.PI); c.fill(); txt(c, String(h.key), h.x, h.y + 30, 14, '#fff'); });
        if (st.hammer.t > 0) { c.save(); c.translate(st.hammer.x + 40, st.hammer.y); c.rotate(-0.8 + st.hammer.t * 4); c.font = '56px ' + SP.EMOJI_FONT; c.textAlign = 'center'; c.fillText('🔨', 0, 0); c.restore(); }
        hearts(c, st.lives, st.max, 14, CH - 22);
        if (st.w && !st.done) promptBar(c, st.w, st.mode, t, 'Đập con chuột cầm từ đúng');
      },
      _st: st
    };
  };

  // =================== 8. RẮN SĂN CHỮ ===================
  A.impl.snake = function (api) {
    const { S, p } = api, E = fx(p);
    // bàn chơi: 24 x 9 ô, phía trên là bảng đề, phía dưới là dãy ô chữ của từ đang ghép
    const CELL = 36, COLS = 24, ROWS = 9, OX = 8, OY = 82, BOT = OY + ROWS * CELL;
    const clean = s => s.toLowerCase().replace(/[^a-z]/g, '');
    const words = api.pool.filter(w => /^[a-z]+$/i.test(w.en) && w.en.length >= 2 && w.en.length <= 8).slice(0, 8);
    if (words.length < 3) words.push.apply(words, api.pool.filter(w => clean(w.en).length >= 2).slice(0, 6));
    let wi = -1;
    const st = { body: [], dir: [1, 0], q: [], step: 0, lives: E.hp, max: E.hp, inv: 0, letters: [], w: null, need: '', got: '', mode: 'vi', tried: false, done: false, wait: 0, hint: 0, idle: 0, pops: [] };
    const occ = (x, y) => st.body.some(b => b[0] === x && b[1] === y) || st.letters.some(l => l.x === x && l.y === y);
    function free() {
      const h = st.body[0] || [5, 4];
      for (let k = 0; k < 400; k++) {
        const x = U.randi(1, COLS - 2), y = U.randi(0, ROWS - 1);
        if (occ(x, y)) continue;
        if (Math.abs(x - h[0]) + Math.abs(y - h[1]) < 4) continue;
        if (y === h[1] && (x - h[0]) * st.dir[0] > 0 && Math.abs(x - h[0]) < 7) continue; // không đặt ngay trước đầu rắn
        return [x, y];
      }
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!occ(x, y)) return [x, y];
      return [0, 0];
    }
    function reset() { st.body = [[4, 4], [3, 4], [2, 4]]; st.dir = [1, 0]; st.q = []; }
    // đặt TẤT CẢ chữ cái của từ (đủ cả chữ lặp) + 2–3 chữ nhiễu → luôn ghép được
    function place() {
      st.letters = [];
      const word = clean(st.need);
      const decoys = U.shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(ch => word.indexOf(ch) < 0)).slice(0, word.length > 5 ? 2 : 3);
      U.shuffle(word.split('').concat(decoys)).forEach(ch => { const f = free(); st.letters.push({ ch, x: f[0], y: f[1], born: S.t }); });
    }
    const needCh = () => clean(st.need)[st.got.length];
    function next() {
      wi++;
      if (wi >= words.length || st.lives <= 0) { st.done = true; setTimeout(api.finish, 800); return; }
      st.w = words[wi]; st.need = st.w.en; st.got = ''; st.mode = api.promptFor(st.w); st.tried = false; st.hint = 0; st.idle = 0;
      reset(); place();
      if (st.mode === 'listen') api.say(st.w.en);
    }
    function miss(x, y, why) {
      if (!st.tried) { st.tried = true; api.answer(st.w, false, 'spell'); }
      st.hint = 4; // sau khi sai: chữ đúng sẽ phát sáng 4 giây
      api.float(x, y, why, '#ff8a80');
      if (hurt(api, st, x, y + 30) && st.lives <= 0) { st.done = true; setTimeout(api.finish, 900); return true; }
      return false;
    }
    function steer(m) {
      const last = st.q.length ? st.q[st.q.length - 1] : st.dir;
      if ((m[0] === -last[0] && m[1] === -last[1]) || (m[0] === last[0] && m[1] === last[1])) return;
      if (st.q.length < 3) st.q.push(m);
    }
    reset(); next();
    function hudNow() {
      api.hud('<b>🐍 Rắn săn chữ</b><span>Từ ' + Math.min(wi + 1, words.length) + '/' + words.length + '</span><span>✅ ' + S.correct + '</span><span>⭐ ' + S.score + '</span>' + gearHud(p));
    }
    hudNow();
    return {
      onKey(k) {
        const m = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[k];
        if (m) steer(m);
        if (k === 'KeyL' && st.w) api.say(st.w.en);
        if (k === 'KeyH' && !st.done) { st.hint = 3; st.tried || (st.tried = true, api.answer(st.w, false, 'spell')); }
      },
      // bấm chuột: rắn rẽ về phía điểm bấm
      onClick(x, y) {
        const h = st.body[0]; if (!h) return;
        const dx = x - (OX + h[0] * CELL + CELL / 2), dy = y - (OY + h[1] * CELL + CELL / 2);
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (st.dir[0] !== 0) steer([0, dy < 0 ? -1 : 1]);
        else steer([dx < 0 ? -1 : 1, 0]);
      },
      update(dt) {
        st.pops = st.pops.filter(o => (o.t -= dt) > 0);
        if (st.done) return;
        st.inv = Math.max(0, st.inv - dt); st.hint = Math.max(0, st.hint - dt); st.idle += dt;
        if (st.idle > 12 && st.hint <= 0) { st.hint = 2.5; st.idle = 4; } // lâu quá chưa ăn được → gợi ý nhẹ
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) { st.wait = 0; next(); } return; }
        st.step += dt;
        const spd = Math.max(0.13, 0.2 - wi * 0.008);
        if (st.step < spd) return;
        st.step = 0;
        if (st.q.length) st.dir = st.q.shift();
        const h = st.body[0];
        // đi xuyên tường: ra mép này sẽ vào lại mép bên kia
        const nh = [(h[0] + st.dir[0] + COLS) % COLS, (h[1] + st.dir[1] + ROWS) % ROWS];
        if (st.inv <= 0 && st.body.slice(0, -1).some(b => b[0] === nh[0] && b[1] === nh[1])) {
          if (miss(OX + nh[0] * CELL, OY + nh[1] * CELL, '💥 Cắn đuôi!')) return;
          st.body = st.body.slice(0, 3);
        }
        st.body.unshift(nh);
        const L = st.letters.find(l => l.x === nh[0] && l.y === nh[1]);
        let grow = false;
        if (L) {
          const cx = OX + L.x * CELL + CELL / 2, cy = OY + L.y * CELL + CELL / 2;
          st.letters = st.letters.filter(x => x !== L);
          if (L.ch === needCh()) {
            st.got += L.ch; st.idle = 0; st.hint = 0; grow = true;
            EQ.audio.sfx('coin'); S.score += pts(p, 15);
            api.burst(cx, cy, 12); st.pops.push({ ch: L.ch, x: cx, y: cy, t: 0.6 });
            if (st.got.length >= clean(st.need).length) {
              api.answer(st.w, !st.tried, 'spell'); S.score += pts(p, st.tried ? 30 : 100); api.say(st.w.en); st.words = (st.words || 0) + 1;
              api.float(CW / 2, 200, '✓ ' + st.w.en + ' = ' + st.w.vi, '#b9f6ca'); st.letters = []; st.wait = 1.4;
            }
          } else {
            EQ.audio.sfx('wrong');
            const want = needCh();
            if (miss(cx, cy - 10, '✗ ' + L.ch.toUpperCase() + ' — cần chữ ' + (want ? want.toUpperCase() : '?'))) return;
            const f = free(); st.letters.push({ ch: L.ch, x: f[0], y: f[1], born: S.t }); // chữ ăn nhầm mọc lại chỗ khác
          }
        }
        if (!grow) st.body.pop();
        hudNow();
      },
      draw(c) {
        const t = S.t;
        // nền
        const g = c.createLinearGradient(0, 0, 0, CH); g.addColorStop(0, '#1b3a2a'); g.addColorStop(1, '#0f2419'); c.fillStyle = g; c.fillRect(0, 0, CW, CH);
        // bàn cỏ
        c.save(); rr(c, OX - 4, OY - 4, COLS * CELL + 8, ROWS * CELL + 8, 14); c.fillStyle = '#5d4037'; c.fill(); c.clip();
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { c.fillStyle = (x + y) % 2 ? '#7cb342' : '#8bc34a'; c.fillRect(OX + x * CELL, OY + y * CELL, CELL, CELL); }
        c.fillStyle = 'rgba(255,255,255,.06)';
        for (let i = 0; i < 40; i++) { const gx = OX + (i * 97) % (COLS * CELL), gy = OY + (i * 53) % (ROWS * CELL); c.fillRect(gx, gy, 2, 6); c.fillRect(gx + 4, gy + 2, 2, 5); }
        c.restore();
        // chữ cái: ô gỗ to, chữ đậm màu tối để dễ đọc
        const want = needCh();
        st.letters.forEach(l => {
          const x = OX + l.x * CELL, y = OY + l.y * CELL, pop = Math.min(1, (t - l.born) * 4);
          const glow = st.hint > 0 && l.ch === want;
          c.save(); c.translate(x + CELL / 2, y + CELL / 2); c.scale(pop, pop);
          if (glow) { c.shadowColor = '#ffeb3b'; c.shadowBlur = 18 + 8 * Math.sin(t * 10); }
          c.fillStyle = 'rgba(0,0,0,.25)'; rr(c, -15, -13, 32, 32, 8); c.fill();
          c.fillStyle = glow ? '#fff176' : '#fffde7'; rr(c, -16, -16, 32, 32, 8); c.fill();
          c.shadowBlur = 0;
          c.lineWidth = 3; c.strokeStyle = glow ? '#f57f17' : '#8d6e63'; c.stroke();
          c.font = 'bold 24px Nunito, Segoe UI, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillStyle = '#3e2723'; c.fillText(l.ch.toUpperCase(), 0, 2);
          c.restore();
        });
        // rắn
        const blink = st.inv > 0 && Math.floor(t * 12) % 2;
        if (!blink) {
          for (let i = st.body.length - 1; i >= 0; i--) {
            const b = st.body[i], cx = OX + b[0] * CELL + CELL / 2, cy = OY + b[1] * CELL + CELL / 2;
            const r = i ? Math.max(11, 16 - i * 0.4) : 17;
            const gg = c.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, r);
            gg.addColorStop(0, i ? '#9ccc65' : '#aed581'); gg.addColorStop(1, i ? (i % 2 ? '#2e7d32' : '#388e3c') : '#1b5e20');
            c.fillStyle = gg; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
            if (i && i % 2 === 0) { c.fillStyle = 'rgba(255,235,59,.55)'; c.beginPath(); c.arc(cx, cy, 4, 0, 7); c.fill(); }
            if (!i) {
              const dx = st.dir[0], dy = st.dir[1], px = -dy, py = dx;
              // lưỡi
              if (Math.floor(t * 4) % 2) { c.strokeStyle = '#e53935'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + dx * 15, cy + dy * 15); c.lineTo(cx + dx * 25, cy + dy * 25); c.stroke(); }
              [1, -1].forEach(s => {
                const ex = cx + dx * 5 + px * 7 * s, ey = cy + dy * 5 + py * 7 * s;
                c.fillStyle = '#fff'; c.beginPath(); c.arc(ex, ey, 5, 0, 7); c.fill();
                c.fillStyle = '#111'; c.beginPath(); c.arc(ex + dx * 2, ey + dy * 2, 2.5, 0, 7); c.fill();
              });
            }
          }
        }
        st.pops.forEach(o => txt(c, o.ch.toUpperCase(), o.x, o.y - (0.6 - o.t) * 60, 26 + (0.6 - o.t) * 20, '#ffeb3b'));
        // dãy ô chữ của từ đang ghép
        const word = clean(st.need), n = word.length, TW = 46, gap = 8, tw = n * TW + (n - 1) * gap, x0 = Math.max(250, CW / 2 - tw / 2 + 50), ty = BOT + 14;
        c.fillStyle = 'rgba(0,0,0,.35)'; rr(c, 8, BOT + 8, CW - 16, CH - BOT - 12, 12); c.fill();
        txt(c, 'Ghép từ:', x0 - 70, ty + 26, 18, '#c5e1a5');
        for (let i = 0; i < n; i++) {
          const x = x0 + i * (TW + gap), got = i < st.got.length, cur = i === st.got.length && !st.wait;
          c.fillStyle = got ? '#66bb6a' : cur ? '#fff59d' : 'rgba(255,255,255,.18)';
          rr(c, x, ty, TW, 52, 10); c.fill();
          c.lineWidth = cur ? 4 : 2; c.strokeStyle = cur ? '#ff9800' : 'rgba(255,255,255,.4)'; c.stroke();
          if (got) txt(c, word[i].toUpperCase(), x + TW / 2, ty + 28, 30, '#fff', 'center', '#1b5e20');
          else if (cur) txt(c, st.hint > 0 ? word[i].toUpperCase() : '?', x + TW / 2, ty + 28, 28, '#e65100', 'center', 'rgba(255,255,255,.6)');
        }
        hearts(c, st.lives, st.max, 18, BOT + 30);
        c.font = '12px Nunito, Arial'; c.textAlign = 'left'; c.fillStyle = '#a5d6a7';
        c.fillText('H gợi ý • L nghe lại • chuột: rẽ', 18, BOT + 58);
        if (st.w && !st.done) promptBar(c, st.w, st.mode === 'pic' && !st.w.pic ? 'vi' : st.mode, t);
      },
      _st: st
    };
  };
})();
