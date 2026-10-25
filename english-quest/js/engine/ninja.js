/* ENGLISH QUEST – Đồ họa Ninja Adventure (bản 1.5)
 * Dùng ảnh pixel art từ bộ "Ninja Adventure" (Pixel-boy & AAA, giấy phép CC0) cho:
 *  - người chơi (mỗi trang phục là một ninja), NPC, chân dung trong hộp thoại
 *  - quái vật, trùm (tô lại màu theo màu gốc của từng quái)
 *  - nền cỏ / đường đất / cát, cây, bụi, đá, hoa, cỏ cao
 * Ảnh nằm sẵn trong js/data/ninja-assets.js nên chạy được khi mở trực tiếp index.html.
 * Tắt trong ⚙️ Cài đặt → "Đồ họa Ninja Adventure" để quay về hình vẽ bằng code.
 */
window.EQ = window.EQ || {};
(function () {
  const SP = EQ.sprites;
  const SRC = EQ.NINJA_IMG || {};
  const N = EQ.ninja = { img: {}, loaded: 0, total: 0 };
  const DIRS = { down: 0, up: 1, left: 2, right: 3 };

  // ---------- Nạp ảnh ----------
  Object.keys(SRC).forEach(k => {
    const im = new Image();
    N.total++;
    im.onload = () => { N.loaded++; im._ok = true; };
    im.src = SRC[k];
    N.img[k] = im;
  });
  const ok = k => N.img[k] && N.img[k]._ok;
  N.on = function () {
    const s = EQ.store && EQ.store.data ? EQ.store.settings() : null;
    return !s || s.ninjaArt !== false;
  };
  const use = k => N.on() && ok(k);
  // khóa đệm thay đổi khi bật/tắt hoặc khi ảnh vừa nạp xong → hình tự cập nhật
  SP.ninjaKey = () => (N.on() ? 'nj' + N.loaded : '');

  // ---------- Nhân vật ----------
  // Trang phục của người chơi → ninja
  N.OUTFIT = { basic: 'NinjaBlue', pink: 'NinjaRed2', sailor: 'NinjaBlue2', hero: 'NinjaRed', ranger: 'NinjaGreen', doctor: 'NinjaGray', royal: 'NinjaMageOrange', star: 'NinjaMageBlack' };
  // NPC theo tên trong EQ.LOOK và theo id nhân vật
  const BY_LOOK = { chief: 'OldMan', rose: 'OldWoman', lily: 'Villager4', minh: 'Boy', ben: 'Villager', sam: 'Villager2', anna: 'Villager3', guard: 'SamuraiRed', page: 'Noble', mia: 'Princess', sage: 'OldMan3' };
  const BY_ID = { gs_teacher: 'Woman' };
  const SPARE = ['EggGirl', 'Villager', 'Villager2', 'Villager3', 'Villager4', 'Woman', 'Boy', 'Noble'];
  function tagLooks() {
    if (EQ.LOOK) Object.keys(BY_LOOK).forEach(k => { if (EQ.LOOK[k]) EQ.LOOK[k].nj = BY_LOOK[k]; });
    if (EQ.REGIONS) Object.keys(EQ.REGIONS).forEach(r => (EQ.REGIONS[r].entities || []).forEach(e => {
      if (e.look && !e.look.nj) e.look.nj = BY_ID[e.id] || SPARE[SP.hash(e.id.length, e.id.charCodeAt(0), 7) % SPARE.length];
    }));
  }
  tagLooks();
  function sheetOf(look) {
    if (!look) return null;
    if (look.nj) return look.nj;
    const s = JSON.stringify(look); let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return SPARE[h % SPARE.length];
  }
  N.sheetOf = sheetOf;

  const basePlayerLook = SP.playerLook;
  SP.playerLook = function (av) { const l = basePlayerLook(av); l.nj = N.OUTFIT[av.outfit] || N.OUTFIT.basic; return l; };

  const baseHuman = SP.human;
  SP.human = function (ctx, cx, by, look, dir, frame, opt) {
    opt = opt || {};
    const name = sheetOf(look);
    const im = name && N.img['char:' + name];
    if (!name || !use('char:' + name)) return baseHuman(ctx, cx, by, look, dir, frame, opt);
    // ở khung lớn (trận đấu, tủ đồ) phóng to thêm để ninja 16px không bị nhỏ hơn hình cũ
    const u = (opt.scale || 2) * ((opt.scale || 2) >= 3 ? 1.25 : 1);
    const rows = Math.floor(im.height / 16);
    const row = opt.moving ? (frame % 4) % Math.min(4, rows) : 0;
    const col = DIRS[dir] != null ? DIRS[dir] : 0;
    if (!opt.noShadow) SP.shadow(ctx, cx, by, 6 * u, 2 * u);
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    const ox = Math.round(cx - 8 * u), oy = Math.round(by - 16 * u);
    ctx.drawImage(im, col * 16, row * 16, 16, 16, ox, oy, 16 * u, 16 * u);
    ctx.imageSmoothingEnabled = sm;
    if (look.g) gear(ctx, ox, oy, u, look.g, dir, opt.moving ? frame % 2 : 0);
  };
  // Trang bị đang mặc vẽ chồng lên ninja (đơn vị: 1 điểm ảnh của khung 16x16)
  function gear(ctx, ox, oy, u, g, dir, bob) {
    const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x * u, oy + (y - bob * 0.5) * u, w * u, h * u); };
    if (g.neck && dir !== 'up') { R(5, 10, 6, 1, g.neck); R(7, 11, 2, 1, g.neck); R(7.5, 11, 1, 1, '#ffffff'); }
    if (g.wand) {
      const x = dir === 'left' ? 1 : dir === 'up' ? 2 : 13;
      R(x, 7, 1, 7, '#5d3a1e'); R(x - 0.5, 5.5, 2, 2, g.wand); R(x, 5.5, 1, 1, '#ffffff');
    }
    if (g.ring && dir !== 'up') R(dir === 'left' ? 4 : 11, 12, 1, 1, g.ring);
    // bản 1.8: áo giáp, bao tay, giày
    if (g.armor) { ctx.globalAlpha = 0.85; R(5, 10, 6, 3, g.armor); ctx.globalAlpha = 1; R(5, 10, 6, 1, 'rgba(255,255,255,.35)'); }
    if (g.glove) { R(3, 11, 2, 2, g.glove); R(11, 11, 2, 2, g.glove); }
    if (g.boots) { R(5, 14, 2, 2, g.boots); R(9, 14, 2, 2, g.boots); }
    const hy = -1;
    if (g.hat === 'h1') { R(10, hy + 1, 2, 2, '#ff80ab'); R(13, hy + 1, 2, 2, '#ff80ab'); R(12, hy + 2, 1, 1, '#c2185b'); }
    else if (g.hat === 'h2') { R(3, hy + 2, 10, 1, '#4527a0'); R(5, hy, 6, 2, '#5e35b1'); R(6, hy - 2, 4, 2, '#5e35b1'); R(7, hy - 4, 2, 2, '#5e35b1'); R(7, hy + 1, 1, 1, '#ffd54f'); }
    else if (g.hat === 'h3' || g.hat === 'h4') { const c = g.hatC || '#ffd54f'; R(4, hy, 8, 2, c); R(4, hy - 1, 1, 1, c); R(7, hy - 2, 2, 2, c); R(11, hy - 1, 1, 1, c); R(7, hy, 2, 1, g.hat === 'h4' ? '#e53935' : '#42a5f5'); }
    else if (g.hat === 'h5') { R(4, hy, 8, 2, '#ffca28'); R(6, hy - 3, 4, 3, '#fff176'); R(7, hy - 4, 2, 1, '#fff176'); R(5, hy - 2, 1, 1, '#fff176'); R(10, hy - 2, 1, 1, '#fff176'); R(7, hy - 2, 1, 1, '#ffffff'); }
  }

  // Chân dung trong hộp thoại / HUD
  N.face = function (look, size) {
    const name = sheetOf(look);
    if (!name || !use('face:' + name)) return null;
    const c = document.createElement('canvas'); c.width = size; c.height = size; c.className = 'portrait-cv';
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const im = N.img['face:' + name];
    g.drawImage(im, 0, 0, im.width, im.height, 0, 0, size, size);
    return c;
  };

  // ---------- Quái vật & trùm ----------
  // sheet: tên ảnh; h,s: sắc độ & độ bão hòa trung bình của ảnh gốc (để tô lại màu)
  const MON = {
    slime: { sheet: 'mon:Slime3', h: 196, s: 0.46 },
    fluff: { sheet: 'mon:Spirit', h: 205, s: 0.45 },
    mush: { sheet: 'mon:Mushroom', h: 351, s: 0.64 },
    star: { sheet: 'mon:Flam', h: 9, s: 0.77 },
    golem: { sheet: 'mon:Cyclope', h: 0, s: 0.64 }
  };
  // trùm: ảnh đứng yên nhiều khung nằm ngang
  const BOSS = {
    slime: { sheet: 'boss:GiantSlime', n: 5, h: 197, s: 0.46 },
    fluff: { sheet: 'boss:GiantFrog', n: 5, h: 68, s: 0.52 },
    mush: { sheet: 'boss:GiantBamboo', n: 6, h: 76, s: 0.48 },
    star: { sheet: 'boss:GiantSpirit', n: 5, h: 196, s: 0.46 },
    golem: { sheet: 'boss:DemonCyclop', n: 5, h: 359, s: 0.64 }
  };
  function hsl(hex) {
    hex = (hex || '#888888').replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255, g = parseInt(hex.slice(2, 4), 16) / 255, b = parseInt(hex.slice(4, 6), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
    return { h, s, l };
  }
  // ảnh đã tô màu được lưu đệm theo (ảnh, màu)
  const tinted = {};
  function tint(key, info, color) {
    const k = key + color;
    if (tinted[k]) return tinted[k];
    const im = N.img[key];
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
    const g = c.getContext('2d');
    const t = hsl(color);
    if ('filter' in g && color) {
      const sat = Math.max(0.15, Math.min(1.6, t.s / info.s));
      g.filter = 'hue-rotate(' + Math.round(t.h - info.h) + 'deg) saturate(' + sat.toFixed(2) + ')';
    }
    g.drawImage(im, 0, 0);
    tinted[k] = c;
    return c;
  }

  const baseMonster = SP.monster;
  SP.monster = function (ctx, def, cx, by, r, color, t) {
    const big = def.crown || def.hard;
    const info = big ? BOSS[def.draw] : MON[def.draw];
    if (!info || !use(info.sheet)) return baseMonster(ctx, def, cx, by, r, color, t);
    const img = tint(info.sheet, info, color || def.color);
    let sx, sy, fw, fh;
    if (big) {
      fw = img.width / info.n; fh = img.height;
      sx = (Math.floor(t * 7) % info.n) * fw; sy = 0;
    } else {
      fw = fh = 16; sx = 0; sy = (Math.floor(t * 6) % 4) * 16;
    }
    const hgt = r * (big ? 2.3 : 2.4);
    const sc = hgt / fh;
    const w = fw * sc, h = fh * sc;
    SP.shadow(ctx, cx, by, w * 0.36, Math.max(3, w * 0.1));
    const sm = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, sx, sy, fw, fh, Math.round(cx - w / 2), Math.round(by - h + 2), Math.round(w), Math.round(h));
    ctx.imageSmoothingEnabled = sm;
    if (def.crown && !BOSS[def.draw]) SP.crown(ctx, cx, by - h, r * 0.5);
  };

  // ---------- Nền & trang trí ----------
  // [cột, hàng] trong lưới 16px của ảnh
  const FLOOR = {
    '.': [[0, 12], [1, 12], [2, 12], [3, 12], [4, 12], [3, 11], [2, 12], [4, 12]],
    'g': [[11, 12], [12, 12], [13, 12], [14, 12], [15, 12], [12, 12]],
    '=': [[4, 11], [5, 11], [6, 11], [5, 9], [6, 11], [4, 11]],
    's': [[4, 4], [5, 4], [6, 4], [0, 5], [1, 5], [5, 4]]
  };
  N.ground = function (c, g, v) {
    const set = FLOOR[g];
    if (!set || !use('tile:Floor')) return false;
    const p = set[v % set.length];
    c.imageSmoothingEnabled = false;
    c.drawImage(N.img['tile:Floor'], p[0] * 16, p[1] * 16, 16, 16, 0, 0, 32, 32);
    return true;
  };
  const DECO = {
    ',': { list: [[0, 11], [1, 11], [3, 11], [6, 11]], s: 1.5 },
    '"': { list: [[3, 10], [4, 10], [8, 10], [9, 10], [5, 10]], s: 2 },
    'B': { list: [[1, 10], [6, 10], [0, 10]], s: 2, shadow: true },
    'R': { list: [[18, 9], [15, 9]], s: 2, shadow: true }
  };
  N.deco = function (c, ch, v) {
    const d = DECO[ch];
    if (!d || !use('tile:Nature')) return false;
    const p = d.list[v % d.list.length], sz = 16 * d.s;
    if (d.shadow) SP.shadow(c, 16, 28, 12, 4);
    c.imageSmoothingEnabled = false;
    c.drawImage(N.img['tile:Nature'], p[0] * 16, p[1] * 16, 16, 16, Math.round(16 - sz / 2), 32 - sz, sz, sz);
    return true;
  };
  // Cây cao: ô 32x32 trong ảnh, phóng to 2 lần, gốc cây ở đáy khung 64x84
  const TREE = { 'T': [[0, 0], [16, 0], [0, 0]], 'A': [[16, 0]], 't': [[2, 0]] };
  N.tree = function (c, ch, v) {
    const set = TREE[ch];
    if (!set || !use('tile:Nature')) return false;
    const p = set[v % set.length];
    c.imageSmoothingEnabled = false;
    c.drawImage(N.img['tile:Nature'], p[0] * 16, p[1] * 16, 32, 32, 0, 20, 64, 64);
    if (ch === 'A') [[18, 36], [40, 30], [30, 46], [46, 44], [22, 50]].forEach(q => {
      c.fillStyle = '#7a1f1f'; c.fillRect(q[0] - 1, q[1] - 1, 6, 6);
      c.fillStyle = '#e04040'; c.fillRect(q[0], q[1], 4, 4);
      c.fillStyle = '#ff9a9a'; c.fillRect(q[0], q[1], 2, 1);
    });
    return true;
  };

  // ---------- Chân dung ----------
  const basePortrait = EQ.ui.portrait;
  EQ.ui.portrait = function (sp) {
    if (sp && sp.look) { const f = N.face(sp.look, 64); if (f) return f; }
    return basePortrait(sp);
  };
})();
