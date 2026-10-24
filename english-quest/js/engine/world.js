/* Thế giới game: bản đồ, nhân vật, va chạm, quái vật, camera, vẽ, bản đồ nhỏ */
window.EQ = window.EQ || {};
(function () {
  const TS = EQ.TILE;
  const SP = EQ.sprites;
  const U = EQ.U;
  const VIEW_W = 960, VIEW_H = 640;
  const SPEED = 135;

  const W = {
    id: null, def: null, rows: [], w: 0, h: 0, t: 0,
    player: { x: 0, y: 0, dir: 'down', moving: false, anim: 0 },
    ents: [], monsters: [], particles: [], floaters: [],
    cam: { x: 0, y: 0 }, fade: 0, fadeDir: 0, fadeCb: null,
    explored: null, lastTile: '', target: null, battleCooldown: 0, portalCooldown: 0, respawn: []
  };

  W.load = function (id, tx, ty, p) {
    const def = EQ.REGIONS[id];
    if (!def) throw new Error('Không có vùng ' + id);
    W.id = id; W.def = def;
    W.rows = def._rows || (def._rows = def.build());
    W.h = W.rows.length; W.w = W.rows[0].length;
    const sp = (tx != null) ? { x: tx, y: ty } : def.spawn;
    W.player.x = (sp.x + 0.5) * TS; W.player.y = (sp.y + 0.75) * TS;
    W.player.dir = 'down';
    // dữ liệu khám phá
    const s = p.explored[id];
    W.explored = new Uint8Array(W.w * W.h);
    if (s && s.length === W.w * W.h) for (let i = 0; i < s.length; i++) W.explored[i] = s.charCodeAt(i) === 49 ? 1 : 0;
    W.monsters = []; W.particles = []; W.floaters = []; W.respawn = [];
    W.portalCooldown = 0.6; W.battleCooldown = 2;
    W.refresh(p);
    W.spawnMonsters(p);
    W.markExplored(p, true);
    W.updateCam(true);
  };

  W.syncExplored = function (p) {
    if (!W.explored || !W.id) return;
    let s = '';
    for (let i = 0; i < W.explored.length; i++) s += W.explored[i] ? '1' : '0';
    p.explored[W.id] = s;
  };

  W.tile = (x, y) => (x < 0 || y < 0 || x >= W.w || y >= W.h) ? 'W' : W.rows[y][x];

  // ---------- Thực thể ----------
  W.entVisible = function (e, p) {
    const G = EQ.game;
    if (e.when && !e.when(p)) return false;
    if (e.kind === 'pickup') return !p.flags['pick:' + e.id] && G.stageIs(p, e.quest, 'collect');
    if (e.kind === 'gate') return !p.flags['open:' + e.id];
    if (e.kind === 'boss') return !p.flags['boss:' + e.boss];
    return true;
  };
  W.refresh = function (p) {
    W.ents = W.def.entities.filter(e => W.entVisible(e, p));
    W.occ = new Set();
    W.ents.forEach(e => { if (W.isSolidEnt(e)) W.occ.add(e.x + ',' + e.y); });
  };
  W.isSolidEnt = e => ['npc', 'chest', 'gate', 'boss', 'sign'].indexOf(e.kind) >= 0 || (e.kind === 'deco' && e.solid);
  W.solid = function (tx, ty) {
    if (tx < 0 || ty < 0 || tx >= W.w || ty >= W.h) return true;
    return EQ.SOLID.has(W.rows[ty][tx]) || W.occ.has(tx + ',' + ty);
  };
  function collide(x, y) {
    const x0 = Math.floor((x - 8) / TS), x1 = Math.floor((x + 8) / TS);
    const y0 = Math.floor((y - 7) / TS), y1 = Math.floor((y + 2) / TS);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (W.solid(tx, ty)) return true;
    return false;
  }
  W.collide = collide;

  // ---------- Quái vật ----------
  W.spawnMonsters = function (p) {
    const m = W.def.monsters;
    if (!m) return;
    for (let i = 0; i < m.count; i++) W.spawnOne(p);
  };
  W.monstersAllowed = function (p) {
    const m = W.def.monsters;
    if (!m) return false;
    if (m.need && m.need.indexOf('item:') === 0 && !p.items[m.need.slice(5)]) return false;
    return EQ.learn.learnedIds(p).length >= 4;
  };
  W.spawnOne = function (p) {
    const m = W.def.monsters;
    if (!W.monstersAllowed(p)) return;
    const def = EQ.MONSTERS[m.kind];
    for (let k = 0; k < 30; k++) {
      const z = U.pick(m.zones);
      const tx = z[0] + Math.floor(Math.random() * z[2]), ty = z[1] + Math.floor(Math.random() * z[3]);
      if (W.solid(tx, ty)) continue;
      const x = (tx + 0.5) * TS, y = (ty + 0.75) * TS;
      if (U.dist(x, y, W.player.x, W.player.y) < TS * 4) continue;
      W.monsters.push({ x, y, def, kind: m.kind, color: U.pick(def.colors), vx: 0, vy: 0, timer: 0, zone: z, phase: Math.random() * 6 });
      return;
    }
  };
  W.removeMonster = function (mon) {
    W.monsters = W.monsters.filter(m => m !== mon);
    W.respawn.push(45 + Math.random() * 30);
  };

  // ---------- Cập nhật ----------
  W.update = function (dt, input, p) {
    W.t += dt;
    const pl = W.player;
    let dx = 0, dy = 0;
    if (input) {
      if (input.left) dx -= 1; if (input.right) dx += 1;
      if (input.up) dy -= 1; if (input.down) dy += 1;
    }
    pl.moving = !!(dx || dy);
    if (pl.moving) {
      const len = Math.hypot(dx, dy); dx /= len; dy /= len;
      if (Math.abs(dx) > Math.abs(dy)) pl.dir = dx < 0 ? 'left' : 'right'; else pl.dir = dy < 0 ? 'up' : 'down';
      const nx = pl.x + dx * SPEED * dt, ny = pl.y + dy * SPEED * dt;
      if (!collide(nx, pl.y)) pl.x = nx;
      if (!collide(pl.x, ny)) pl.y = ny;
      pl.anim += dt * 8;
    }
    const ptx = Math.floor(pl.x / TS), pty = Math.floor((pl.y - 4) / TS);
    const tk = ptx + ',' + pty;
    if (tk !== W.lastTile) { W.lastTile = tk; W.markExplored(p); W.onTile(p, ptx, pty); }
    W.portalCooldown = Math.max(0, W.portalCooldown - dt);
    W.battleCooldown = Math.max(0, W.battleCooldown - dt);

    // quái vật đi lang thang
    W.monsters.forEach(m => {
      m.timer -= dt;
      if (m.timer <= 0) {
        m.timer = 1 + Math.random() * 2;
        if (Math.random() < 0.35) { m.vx = 0; m.vy = 0; }
        else { const a = Math.random() * Math.PI * 2; m.vx = Math.cos(a) * 38; m.vy = Math.sin(a) * 38; }
      }
      const nx = m.x + m.vx * dt, ny = m.y + m.vy * dt;
      const z = m.zone;
      const inZone = (x, y) => x > z[0] * TS && x < (z[0] + z[2]) * TS && y > z[1] * TS && y < (z[1] + z[3]) * TS;
      if (!collide(nx, ny) && inZone(nx, ny)) { m.x = nx; m.y = ny; } else { m.vx = -m.vx; m.vy = -m.vy; }
      if (W.battleCooldown <= 0 && U.dist(m.x, m.y, pl.x, pl.y) < 22 && EQ.game.canStartBattle()) {
        W.battleCooldown = 3;
        EQ.game.startMonsterBattle(m);
      }
    });
    for (let i = W.respawn.length - 1; i >= 0; i--) {
      W.respawn[i] -= dt;
      if (W.respawn[i] <= 0) { W.respawn.splice(i, 1); if (W.monsters.length < W.def.monsters.count) W.spawnOne(p); }
    }
    if (W.def.monsters && W.monsters.length + W.respawn.length < W.def.monsters.count && W.monstersAllowed(p)) W.respawn.push(5);

    // hạt hiệu ứng
    W.particles.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += (q.g || 0) * dt; q.life -= dt; });
    W.particles = W.particles.filter(q => q.life > 0);
    W.floaters.forEach(f => { f.y -= 30 * dt; f.life -= dt; });
    W.floaters = W.floaters.filter(f => f.life > 0);

    W.target = W.findTarget();
    W.updateCam(false);
  };

  // chuyển cảnh (chạy cả khi game đang khóa)
  W.tickFade = function (dt) {
    if (W.fadeDir) {
      W.fade += W.fadeDir * dt * 3.5;
      if (W.fade >= 1 && W.fadeDir > 0) { W.fade = 1; W.fadeDir = -1; const cb = W.fadeCb; W.fadeCb = null; if (cb) cb(); }
      if (W.fade <= 0 && W.fadeDir < 0) { W.fade = 0; W.fadeDir = 0; }
    }
  };

  W.transition = function (cb) { W.fadeDir = 1; W.fadeCb = cb; };

  W.onTile = function (p, tx, ty) {
    if (W.portalCooldown > 0) return;
    const portal = W.ents.find(e => e.kind === 'portal' && e.x === tx && e.y === ty);
    if (portal) EQ.game.usePortal(portal);
  };

  W.markExplored = function (p, force) {
    const ptx = Math.floor(W.player.x / TS), pty = Math.floor(W.player.y / TS);
    const R = 6;
    for (let y = pty - R; y <= pty + R; y++) for (let x = ptx - R; x <= ptx + R; x++) {
      if (x < 0 || y < 0 || x >= W.w || y >= W.h) continue;
      if ((x - ptx) * (x - ptx) + (y - pty) * (y - pty) <= R * R) W.explored[y * W.w + x] = 1;
    }
    void force; void p;
  };
  W.exploredPct = function () {
    if (!W.explored) return 0;
    let n = 0; for (let i = 0; i < W.explored.length; i++) n += W.explored[i];
    return n / W.explored.length;
  };

  W.entCenter = e => ({ x: (e.x + 0.5) * TS, y: (e.y + 0.6) * TS });
  W.findTarget = function () {
    const pl = W.player;
    let best = null, bd = 1e9;
    const fx = { left: -1, right: 1, up: 0, down: 0 }[pl.dir], fy = { left: 0, right: 0, up: -1, down: 1 }[pl.dir];
    W.ents.forEach(e => {
      if (['npc', 'chest', 'gate', 'boss', 'sign', 'pickup'].indexOf(e.kind) < 0) return;
      const c = W.entCenter(e);
      const d = U.dist(c.x, c.y, pl.x, pl.y - 6);
      if (d > 46) return;
      const facing = ((c.x - pl.x) * fx + (c.y - pl.y) * fy) > 0 ? -12 : 0;
      if (d + facing < bd) { bd = d + facing; best = e; }
    });
    return best;
  };

  W.updateCam = function (snap) {
    const tx = U.clamp(W.player.x - VIEW_W / 2, 0, W.w * TS - VIEW_W);
    const ty = U.clamp(W.player.y - VIEW_H / 2, 0, W.h * TS - VIEW_H);
    if (snap) { W.cam.x = tx; W.cam.y = ty; }
    else { W.cam.x += (tx - W.cam.x) * 0.2; W.cam.y += (ty - W.cam.y) * 0.2; }
  };

  // ---------- Hiệu ứng ----------
  W.burst = function (x, y, color, n, opt) {
    opt = opt || {};
    for (let i = 0; i < (n || 14); i++) {
      const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * (opt.speed || 90);
      W.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (opt.up || 30), g: opt.g == null ? 120 : opt.g, life: 0.6 + Math.random() * 0.5, color: Array.isArray(color) ? U.pick(color) : color, size: 2 + Math.random() * 3 });
    }
  };
  W.floatText = function (x, y, text, color) { W.floaters.push({ x, y, text, color: color || '#ffeb3b', life: 1.4 }); };
  W.atPlayer = (text, color) => W.floatText(W.player.x, W.player.y - 46, text, color);

  // ---------- Vẽ ----------
  W.render = function (ctx, p) {
    const t = W.t;
    const cx = Math.round(W.cam.x), cy = Math.round(W.cam.y);
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const x0 = Math.floor(cx / TS), y0 = Math.floor(cy / TS);
    for (let y = y0; y <= y0 + VIEW_H / TS + 1 && y < W.h; y++) {
      for (let x = x0; x <= x0 + VIEW_W / TS + 1 && x < W.w; x++) {
        SP.drawTile(ctx, W.rows[y][x], x, y, x * TS - cx, y * TS - cy, t);
      }
    }
    // danh sách cần vẽ, sắp xếp theo chiều sâu (y)
    const list = [];
    W.ents.forEach(e => list.push({ y: (e.y + 0.95) * TS, e }));
    W.monsters.forEach(m => list.push({ y: m.y, m }));
    list.push({ y: W.player.y, pl: true });
    list.sort((a, b) => a.y - b.y);
    ctx.save(); ctx.translate(-cx, -cy);
    list.forEach(it => {
      if (it.pl) drawPlayer(ctx, p);
      else if (it.m) SP.monster(ctx, it.m.def, it.m.x, it.m.y + 2, 11, it.m.color, t + it.m.phase);
      else drawEnt(ctx, it.e, p, t);
    });
    // lớp trên cùng: bong bóng, tên, mũi tên
    W.ents.forEach(e => drawOverlay(ctx, e, p, t));
    drawQuestPointer(ctx, p, t);
    W.particles.forEach(q => { ctx.globalAlpha = Math.min(1, q.life * 2); ctx.fillStyle = q.color; ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size); });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center'; ctx.font = 'bold 18px "Baloo 2", system-ui, sans-serif';
    W.floaters.forEach(f => {
      ctx.globalAlpha = Math.min(1, f.life);
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
    if (W.fade > 0) { ctx.fillStyle = 'rgba(10,8,30,' + W.fade + ')'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  };

  function drawPlayer(ctx, p) {
    const pl = W.player;
    SP.human(ctx, pl.x, pl.y + 2, SP.playerLook(p.avatar), pl.dir, Math.floor(pl.anim), { moving: pl.moving });
  }

  function drawEnt(ctx, e, p, t) {
    const c = W.entCenter(e);
    const by = (e.y + 0.95) * TS;
    if (e.kind === 'npc') {
      if (e.look) {
        let dir = 'down';
        if (W.target === e) {
          const dx = W.player.x - c.x, dy = W.player.y - c.y;
          dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        }
        SP.human(ctx, c.x, by, e.look, dir, 0, {});
      } else {
        SP.shadow(ctx, c.x, by - 1, 11, 4);
        const bob = e.statue ? 0 : Math.sin(t * 3 + e.x) * 1.5;
        SP.emoji(ctx, e.e, c.x, by - 15 + bob, e.statue ? 30 : 26, e.statue ? 'gray' : null);
      }
    } else if (e.kind === 'pickup') {
      const bob = Math.sin(t * 4 + e.x * 2) * 2;
      SP.shadow(ctx, c.x, by - 3, 8, 3);
      SP.emoji(ctx, e.e, c.x, by - 14 + bob, 20, e.tint);
      if (Math.sin(t * 5 + e.y) > 0.92) W.burst(c.x + U.rand(-8, 8), by - 18, '#fff7a8', 1, { speed: 10, up: 10, g: 0 });
    } else if (e.kind === 'chest') {
      const open = !!p.flags['chest:' + e.id];
      const glow = !open && (e.secret || EQ.game.stageIs(p, e.quest, 'chest'));
      SP.chest(ctx, c.x, by, open, t, glow);
    } else if (e.kind === 'gate') {
      SP.gate(ctx, e.style, c.x, by, t);
    } else if (e.kind === 'boss') {
      const def = EQ.BOSSES[e.boss];
      SP.monster(ctx, def, c.x, by, 15, def.color, t);
    } else if (e.kind === 'portal') {
      const open = !e.need || EQ.game.need(p, e.need);
      SP.portal(ctx, c.x, (e.y + 0.5) * TS, t, open);
    } else if (e.kind === 'sign') {
      SP.sign(ctx, c.x, by);
    } else if (e.kind === 'deco') {
      if (e.draw) SP.deco(ctx, e.draw, c.x, by, t);
      if (e.e) SP.emoji(ctx, e.e, c.x, by - (e.draw === 'stall' ? 20 : 14), e.draw ? 14 : 26);
    }
  }

  function bubble(ctx, x, y, text, bg, fg, font) {
    ctx.font = font || 'bold 13px "Baloo 2", system-ui, sans-serif';
    const w = ctx.measureText(text).width + 12;
    ctx.fillStyle = bg; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 2;
    roundRect(ctx, x - w / 2, y - 11, w, 22, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
    ctx.textBaseline = 'alphabetic';
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  W.roundRect = roundRect;

  function drawOverlay(ctx, e, p, t) {
    const c = W.entCenter(e);
    const by = (e.y + 0.95) * TS;
    const near = W.target === e;
    const top = e.kind === 'boss' ? by - 62 : by - 50;
    if (e.kind === 'npc' || e.kind === 'boss') {
      const mk = EQ.game.marker(p, e);
      if (mk) {
        const bob = Math.sin(t * 5) * 3;
        bubble(ctx, c.x, top - 12 + bob, mk === '!' ? '!' : '…', mk === '!' ? '#ffd54f' : '#80d8ff', '#3b2a00', 'bold 16px system-ui');
      }
      if (near || e.kind === 'boss') bubble(ctx, c.x, top + 10, e.name, 'rgba(30,25,60,.85)', '#fff');
    }
    if (e.kind === 'pickup' && near) bubble(ctx, c.x, by - 40, e.label, 'rgba(30,25,60,.85)', '#fff');
    if (near) bubble(ctx, c.x + 24, by - 22, 'E', '#ffffff', '#4527a0', 'bold 14px system-ui');
  }

  function drawQuestPointer(ctx, p, t) {
    const tg = EQ.game.questTarget(p);
    if (!tg) return;
    const tx = (tg.x + 0.5) * TS, ty = (tg.y + 0.5) * TS;
    const pl = W.player;
    const d = U.dist(tx, ty, pl.x, pl.y);
    const onScreen = tx > W.cam.x && tx < W.cam.x + VIEW_W && ty > W.cam.y && ty < W.cam.y + VIEW_H;
    if (onScreen && d < TS * 1.6) return;
    if (onScreen) {
      const bob = Math.sin(t * 6) * 4;
      ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#5d4300'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx - 8, ty - 52 + bob); ctx.lineTo(tx + 8, ty - 52 + bob); ctx.lineTo(tx, ty - 40 + bob); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (d > TS * 3) {
      const a = Math.atan2(ty - pl.y, tx - pl.x);
      const r = 40;
      ctx.save(); ctx.translate(pl.x + Math.cos(a) * r, pl.y - 14 + Math.sin(a) * r); ctx.rotate(a);
      ctx.globalAlpha = 0.75 + Math.sin(t * 6) * 0.25;
      ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#5d4300'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-3, 0); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore(); ctx.globalAlpha = 1;
    }
  }

  // ---------- Bản đồ nhỏ & bản đồ lớn ----------
  const MAPCOL = {
    '.': '#7cc35a', ',': '#8fd16a', '"': '#6ab04c', 'g': '#55a04c', '=': '#dcbc85', 's': '#f0dc9a', 'b': '#9a6436', 'S': '#b9b3c4', 'c': '#c62828',
    'M': '#55a04c', 'T': '#2f7a35', 't': '#1f6b3a', 'A': '#2f7a35', 'B': '#3d8f3f', '~': '#4a9fe0', 'R': '#8d8d99', 'F': '#8b5a2b',
    'r': '#c0473b', 'h': '#f3dfb5', 'd': '#7a4b2a', 'W': '#5d5f70', 'w': '#5d5f70', 'P': '#e0dbe8', 'K': '#6d4326', 'f': '#9e9aa8'
  };
  W.drawMap = function (canvas, p, scale, opts) {
    opts = opts || {};
    const c = canvas.getContext('2d');
    c.fillStyle = '#1b1530'; c.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < W.h; y++) for (let x = 0; x < W.w; x++) {
      if (!W.explored[y * W.w + x]) continue;
      c.fillStyle = MAPCOL[W.rows[y][x]] || '#888';
      c.fillRect(x * scale, y * scale, scale, scale);
    }
    if (opts.detail) {
      W.ents.forEach(e => {
        if (!W.explored[e.y * W.w + e.x]) return;
        let col = null;
        if (e.kind === 'npc') col = EQ.game.marker(p, e) === '!' ? '#ffd54f' : '#ffffff';
        else if (e.kind === 'boss') col = '#ff5252';
        else if (e.kind === 'portal') col = '#80d8ff';
        else if (e.kind === 'chest' && !p.flags['chest:' + e.id]) col = '#ffca28';
        if (col) { c.fillStyle = col; c.beginPath(); c.arc((e.x + 0.5) * scale, (e.y + 0.5) * scale, scale * 0.6, 0, 7); c.fill(); }
      });
    }
    const tg = EQ.game.questTarget(p);
    if (tg) { c.strokeStyle = '#ffd54f'; c.lineWidth = 2; c.beginPath(); c.arc((tg.x + 0.5) * scale, (tg.y + 0.5) * scale, scale * 1.2 + Math.sin(W.t * 6), 0, 7); c.stroke(); }
    c.fillStyle = '#ff4081';
    c.beginPath(); c.arc(W.player.x / TS * scale, W.player.y / TS * scale, Math.max(2.5, scale * 0.7), 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
  };

  W.VIEW_W = VIEW_W; W.VIEW_H = VIEW_H;
  EQ.world = W;
})();
