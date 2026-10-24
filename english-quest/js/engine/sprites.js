/* Đồ họa pixel art tự vẽ bằng code (không dùng ảnh bên ngoài → không lo bản quyền). */
window.EQ = window.EQ || {};
(function () {
  const TS = 32;
  const SP = {};
  const cache = {};

  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) >>> 0;
    h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
    return (h ^ (h >>> 16)) >>> 0;
  }
  SP.hash = hash;

  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  function speckle(c, base, dark, light, seed, n) {
    px(c, 0, 0, TS, TS, base);
    for (let i = 0; i < n; i++) {
      const h = hash(i, seed, 7);
      const x = h % 30, y = (h >>> 8) % 30;
      px(c, x, y, 2, 2, (h >>> 4) & 1 ? dark : light);
    }
  }

  const GROUND = {
    '.': c => speckle(c, '#7cc35a', '#69ad4b', '#90d46d', c._v, 10),
    'g': c => speckle(c, '#55a04c', '#478a40', '#66b35b', c._v, 10),
    '=': c => { speckle(c, '#dcbc85', '#c9a56c', '#e8cd9c', c._v, 8); },
    's': c => { speckle(c, '#f0dc9a', '#e2c97f', '#f8e8b8', c._v, 8); },
    'S': c => {
      px(c, 0, 0, TS, TS, '#b9b3c4');
      px(c, 0, 15, TS, 2, '#9f98ad'); px(c, 15, 0, 2, 15, '#9f98ad'); px(c, (c._v % 2) ? 7 : 23, 17, 2, 15, '#9f98ad');
      px(c, 2, 2, 4, 2, '#cdc8d6');
    },
    'c': c => {
      px(c, 0, 0, TS, TS, '#b71c1c');
      px(c, 0, 0, TS, 2, '#e5a823'); px(c, 0, 30, TS, 2, '#e5a823');
      for (let i = 4; i < 32; i += 8) px(c, i, 14, 4, 4, '#d84343');
    }
  };
  // ô nền hiển thị dưới các ô vật cản
  const UNDER = { 'T': '.', 'A': '.', 'B': '.', ',': '.', '"': '.', 'R': '.', 'F': '.', 'r': '.', 'h': '.', 'd': '.', 't': 'g', 'M': 'g', 'P': 'S', 'K': 'S', 'f': 'S', 'b': '~' };

  function tree(c, canopy, light, trunk) {
    px(c, 13, 20, 6, 10, trunk);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(16, 29, 12, 3, 0, 0, 7); c.fill();
    c.fillStyle = canopy; c.beginPath(); c.arc(16, 13, 13, 0, 7); c.fill();
    c.fillStyle = light; c.beginPath(); c.arc(12, 9, 6, 0, 7); c.fill();
    px(c, 18, 15, 3, 3, light);
  }

  const DECO = {
    ',': c => {
      const cols = ['#ff5c8a', '#ffd23f', '#ffffff', '#b388ff'];
      for (let i = 0; i < 3; i++) {
        const h = hash(c._v, i, 3); const x = 4 + h % 22, y = 4 + (h >>> 7) % 22; const col = cols[(h >>> 3) % 4];
        px(c, x, y - 2, 2, 2, col); px(c, x - 2, y, 2, 2, col); px(c, x + 2, y, 2, 2, col); px(c, x, y + 2, 2, 2, col); px(c, x, y, 2, 2, '#ffeb3b');
      }
    },
    '"': c => { for (let i = 0; i < 4; i++) { const h = hash(c._v, i, 5); const x = 4 + h % 24, y = 10 + (h >>> 6) % 16; px(c, x, y, 2, 6, '#4e9a3a'); px(c, x + 3, y + 2, 2, 4, '#5fb046'); } },
    'T': c => tree(c, '#2f8a3a', '#47a94f', '#7a4b2a'),
    'A': c => { tree(c, '#2f8a3a', '#47a94f', '#7a4b2a'); [[9, 10], [20, 8], [15, 17], [22, 16]].forEach(p => { px(c, p[0], p[1], 4, 4, '#e53935'); px(c, p[0], p[1], 2, 2, '#ff8a80'); }); },
    't': c => {
      px(c, 14, 24, 4, 7, '#6d4326');
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(16, 30, 11, 3, 0, 0, 7); c.fill();
      [[4, 26, 28, 14], [7, 18, 25, 8], [10, 11, 22, 2]].forEach(r => {
        c.fillStyle = '#1f6b3a'; c.beginPath(); c.moveTo(r[0], r[1]); c.lineTo(r[2], r[1]); c.lineTo(16, r[3]); c.closePath(); c.fill();
      });
      px(c, 12, 14, 3, 3, '#2e8b4e');
    },
    'B': c => { c.fillStyle = '#3d8f3f'; c.beginPath(); c.arc(11, 19, 9, 0, 7); c.arc(21, 19, 9, 0, 7); c.arc(16, 13, 9, 0, 7); c.fill(); px(c, 11, 11, 4, 3, '#5cb85c'); },
    'R': c => { c.fillStyle = '#8d8d99'; c.beginPath(); c.ellipse(16, 19, 13, 10, 0, 0, 7); c.fill(); c.fillStyle = '#a9a9b5'; c.beginPath(); c.ellipse(12, 15, 6, 4, 0, 0, 7); c.fill(); },
    'F': c => { px(c, 0, 10, TS, 4, '#a1683a'); px(c, 0, 20, TS, 4, '#a1683a'); px(c, 4, 4, 5, 26, '#8b5a2b'); px(c, 22, 4, 5, 26, '#8b5a2b'); px(c, 4, 4, 5, 2, '#c08552'); px(c, 22, 4, 5, 2, '#c08552'); },
    'r': c => { px(c, 0, 0, TS, TS, '#c0473b'); for (let y = 0; y < 32; y += 8) { px(c, 0, y + 6, TS, 2, '#8e2f27'); for (let x = (y / 8) % 2 ? 0 : 8; x < 32; x += 16) px(c, x, y, 2, 6, '#a63a30'); } },
    'h': c => { px(c, 0, 0, TS, TS, '#f3dfb5'); px(c, 0, 0, TS, 3, '#8b5a2b'); px(c, 0, 29, TS, 3, '#8b5a2b'); px(c, 9, 8, 14, 12, '#6fb7e8'); px(c, 15, 8, 2, 12, '#8b5a2b'); px(c, 9, 13, 14, 2, '#8b5a2b'); px(c, 10, 9, 4, 3, '#c9ecff'); },
    'd': c => { px(c, 0, 0, TS, TS, '#f3dfb5'); px(c, 0, 0, TS, 3, '#8b5a2b'); px(c, 7, 6, 18, 26, '#7a4b2a'); px(c, 9, 8, 14, 24, '#9a6436'); px(c, 19, 19, 3, 3, '#ffd54f'); },
    'W': c => { px(c, 0, 0, TS, TS, '#7d7f91'); for (let y = 0; y < 32; y += 8) { px(c, 0, y, TS, 1, '#5d5f70'); for (let x = (y / 8) % 2 ? 0 : 8; x < 32; x += 16) px(c, x, y, 1, 8, '#5d5f70'); } px(c, 2, 2, 5, 2, '#9799aa'); },
    'w': c => { DECO.W(c); px(c, 10, 6, 12, 18, '#2c3e66'); px(c, 12, 8, 8, 14, '#6fa8dc'); px(c, 15, 8, 2, 14, '#2c3e66'); px(c, 12, 14, 8, 2, '#2c3e66'); },
    'P': c => { c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(16, 28, 12, 4, 0, 0, 7); c.fill(); px(c, 8, 2, 16, 26, '#d7d2e0'); px(c, 6, 0, 20, 4, '#eeeaf5'); px(c, 6, 26, 20, 4, '#a9a3b7'); px(c, 11, 4, 3, 22, '#f5f2fa'); },
    'K': c => {
      px(c, 0, 0, TS, TS, '#6d4326'); px(c, 0, 15, TS, 2, '#4e2f19');
      const cols = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
      for (let s = 0; s < 2; s++) for (let i = 0; i < 6; i++) { const h = hash(c._v, i + s * 7, 9); px(c, 2 + i * 5, 3 + s * 16 + (h % 3), 4, 12 - (h % 3), cols[h % 6]); }
    },
    'f': c => { px(c, 3, 12, 26, 18, '#9e9aa8'); px(c, 3, 12, 26, 3, '#c4c0cc'); [[8, 9, '#ff5c8a'], [16, 7, '#ffd23f'], [23, 9, '#b388ff']].forEach(f => { px(c, f[0] - 3, f[1] + 3, 7, 4, '#43a047'); px(c, f[0] - 2, f[1] - 2, 5, 5, f[2]); }); },
    'M': c => { const h = hash(c._v, 1, 2); const x = 8 + h % 14, y = 12 + (h >>> 5) % 10; px(c, x + 2, y + 4, 3, 5, '#f5f5f5'); c.fillStyle = '#e53935'; c.beginPath(); c.arc(x + 3.5, y + 4, 5, Math.PI, 0); c.fill(); px(c, x + 1, y + 1, 2, 2, '#fff'); }
  };

  function getTileCanvas(ch, v) {
    const k = ch + v;
    if (cache[k]) return cache[k];
    const cv = document.createElement('canvas'); cv.width = TS; cv.height = TS;
    const c = cv.getContext('2d'); c._v = v;
    const g = GROUND[ch] ? ch : UNDER[ch];
    if (g && GROUND[g]) GROUND[g](c);
    if (DECO[ch]) DECO[ch](c);
    cache[k] = cv;
    return cv;
  }

  SP.drawTile = function (ctx, ch, tx, ty, sx, sy, t) {
    if (ch === '~' || ch === 'b') {
      ctx.fillStyle = '#4a9fe0'; ctx.fillRect(sx, sy, TS, TS);
      const o = Math.floor((t * 8 + tx * 5 + ty * 3) % 32);
      ctx.fillStyle = '#7cc0f2';
      ctx.fillRect(sx + ((o + 4) % 28), sy + 8, 6, 2);
      ctx.fillRect(sx + ((o + 18) % 28), sy + 22, 6, 2);
      if (ch === 'b') {
        ctx.fillStyle = '#9a6436'; ctx.fillRect(sx, sy + 3, TS, 26);
        ctx.fillStyle = '#7a4b2a'; for (let i = 0; i < 32; i += 8) ctx.fillRect(sx + i, sy + 3, 1, 26);
        ctx.fillStyle = '#5d3a1e'; ctx.fillRect(sx, sy + 3, TS, 2); ctx.fillRect(sx, sy + 27, TS, 2);
      }
      return;
    }
    ctx.drawImage(getTileCanvas(ch, hash(tx, ty) % 4), sx, sy);
  };

  // ---------- Biểu tượng emoji (được lưu đệm) ----------
  const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';
  SP.EMOJI_FONT = EMOJI_FONT;
  const FILTERS = { black: 'brightness(0.28) contrast(1.2)', white: 'grayscale(1) brightness(1.7)', orange: 'saturate(1.6) hue-rotate(-8deg)', gray: 'grayscale(1)' };
  SP.emoji = function (ctx, e, cx, cy, size, tint) {
    const k = 'e' + e + size + (tint || '');
    let cv = cache[k];
    if (!cv) {
      cv = document.createElement('canvas');
      const s = Math.ceil(size * 1.5);
      cv.width = s; cv.height = s;
      const c = cv.getContext('2d');
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = size + 'px ' + EMOJI_FONT;
      if (tint && FILTERS[tint] && 'filter' in c) c.filter = FILTERS[tint];
      c.fillText(e, s / 2, s / 2 + size * 0.06);
      cache[k] = cv;
    }
    ctx.drawImage(cv, Math.round(cx - cv.width / 2), Math.round(cy - cv.height / 2));
  };

  SP.shadow = function (ctx, cx, cy, rx, ry) {
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry || rx * 0.35, 0, 0, 7); ctx.fill();
  };

  // ---------- Nhân vật người (pixel 2x) ----------
  // cx: tâm ngang, by: chân. dir: 'down','up','left','right'. frame: 0..3
  SP.human = function (ctx, cx, by, look, dir, frame, opt) {
    opt = opt || {};
    const u = opt.scale || 2;
    const ox = Math.round(cx - 8 * u), oy = Math.round(by - 20 * u);
    const R = (x, y, w, h, col) => { if (col) { ctx.fillStyle = col; ctx.fillRect(ox + x * u, oy + y * u, w * u, h * u); } };
    const bob = (frame % 2) && opt.moving ? -1 : 0;
    const skin = look.skin || '#ffe0bd';
    const hairC = look.hairC || '#3e2723';
    const top = look.top || '#4fc3f7', bottom = look.bottom || '#1565c0';
    const dark = '#3b2a2a';
    if (!opt.noShadow) SP.shadow(ctx, cx, by, 7 * u, 2 * u);
    // áo choàng phía sau
    if (look.cape && dir !== 'up') R(3, 9 + bob, 10, 8, look.cape);
    // chân
    const step = opt.moving ? [0, 1, 0, -1][frame % 4] : 0;
    R(5, 15, 2, 4 - Math.max(0, step), bottom); R(9, 15, 2, 4 - Math.max(0, -step), bottom);
    R(5, 19 - Math.max(0, step), 2, 1, dark); R(9, 19 - Math.max(0, -step), 2, 1, dark);
    // váy/quần
    if (look.dress) R(4, 13 + bob, 8, 4, bottom);
    // thân
    R(4, 9 + bob, 8, 6, top);
    if (look.apron) R(5, 11 + bob, 6, 5, look.apron);
    if (look.collar) { R(4, 9 + bob, 8, 2, look.collar); R(7, 11 + bob, 2, 1, '#e53935'); }
    if (look.stars) { R(5, 11 + bob, 1, 1, '#ffd54f'); R(9, 13 + bob, 1, 1, '#ffd54f'); }
    // tay
    const sw = opt.moving ? [0, 1, 0, -1][frame % 4] : 0;
    if (dir === 'left' || dir === 'right') { R(7, 10 + bob + sw, 2, 4, top); R(7, 14 + bob + sw, 2, 1, skin); }
    else { R(2, 9 + bob + sw, 2, 4, top); R(12, 9 + bob - sw, 2, 4, top); R(2, 13 + bob + sw, 2, 1, skin); R(12, 13 + bob - sw, 2, 1, skin); }
    if (look.cape && dir === 'up') R(3, 9 + bob, 10, 8, look.cape);
    // tóc phía sau
    const hy = bob;
    const st = look.hair || 'short';
    if (dir !== 'up') {
      if (st === 'long') R(3, 3 + hy, 10, 9, hairC);
      if (st === 'twin') { R(1, 5 + hy, 2, 6, hairC); R(13, 5 + hy, 2, 6, hairC); }
      if (st === 'pony' && dir === 'down') R(12, 3 + hy, 2, 6, hairC);
    }
    // đầu
    R(4, 2 + hy, 8, 7, skin);
    if (dir === 'up') {
      R(3, 1 + hy, 10, 8, st === 'bald' ? skin : hairC);
      if (st === 'long') R(3, 1 + hy, 10, 11, hairC);
      if (st === 'pony') R(7, 8 + hy, 2, 5, hairC);
      if (st === 'twin') { R(1, 5 + hy, 2, 6, hairC); R(13, 5 + hy, 2, 6, hairC); }
      if (st === 'bun') R(6, -1 + hy, 4, 3, hairC);
      if (st === 'bald') { R(3, 4 + hy, 1, 3, hairC); R(12, 4 + hy, 1, 3, hairC); }
    } else {
      // mặt
      if (dir === 'down') {
        R(6, 5 + hy, 1, 2, '#2b1d1d'); R(9, 5 + hy, 1, 2, '#2b1d1d');
        R(5, 7 + hy, 1, 1, '#f8a5a5'); R(10, 7 + hy, 1, 1, '#f8a5a5');
        R(7, 7 + hy, 2, 1, '#c0605a');
        if (look.glasses) { R(5, 5 + hy, 2, 1, '#37474f'); R(9, 5 + hy, 2, 1, '#37474f'); R(7, 5 + hy, 2, 1, '#37474f'); }
      } else {
        const ex = dir === 'left' ? 5 : 10;
        R(ex, 5 + hy, 1, 2, '#2b1d1d');
        R(dir === 'left' ? 4 : 11, 7 + hy, 1, 1, '#c0605a');
        if (look.glasses) R(dir === 'left' ? 4 : 9, 5 + hy, 3, 1, '#37474f');
      }
      if (look.beard) R(5, 7 + hy, 6, 3, look.beard);
      // tóc phía trước
      if (st === 'bald') { R(3, 4 + hy, 1, 3, hairC); R(12, 4 + hy, 1, 3, hairC); }
      else {
        R(3, 1 + hy, 10, 3, hairC);
        if (dir === 'down') { R(3, 4 + hy, 1, 3, hairC); R(12, 4 + hy, 1, 3, hairC); R(4, 4 + hy, 3, 1, hairC); }
        else if (dir === 'left') R(8, 3 + hy, 5, 4, hairC);
        else R(3, 3 + hy, 5, 4, hairC);
        if (st === 'long' && dir !== 'down') { if (dir === 'left') R(9, 3 + hy, 4, 9, hairC); else R(3, 3 + hy, 4, 9, hairC); }
        if (st === 'pony' && dir !== 'down') { if (dir === 'left') R(12, 3 + hy, 3, 6, hairC); else R(1, 3 + hy, 3, 6, hairC); }
        if (st === 'bun') R(6, -1 + hy, 4, 3, hairC);
      }
    }
    // phụ kiện trên đầu
    if (look.bow) { R(10, 0 + hy, 2, 2, look.bow); R(13, 0 + hy, 2, 2, look.bow); R(12, 1 + hy, 1, 1, '#ad1457'); }
    if (look.hat && !look.wizard) { R(2, 1 + hy, 12, 1, look.hat); R(4, -1 + hy, 8, 2, look.hat); }
    if (look.wizard) { R(3, 1 + hy, 10, 1, look.hat); R(5, -1 + hy, 6, 2, look.hat); R(6, -3 + hy, 4, 2, look.hat); R(7, -5 + hy, 2, 2, look.hat); R(7, -1 + hy, 1, 1, '#ffd54f'); }
    if (look.helmet) { R(3, 0 + hy, 10, 3, look.helmet); R(7, -2 + hy, 2, 2, '#e53935'); }
    if (look.crown) { R(5, -1 + hy, 6, 2, '#ffd54f'); R(5, -2 + hy, 1, 1, '#ffd54f'); R(7, -2 + hy, 2, 1, '#ffd54f'); R(10, -2 + hy, 1, 1, '#ffd54f'); R(7, -1 + hy, 2, 1, '#e53935'); }
  };

  // ngoại hình của người chơi từ hồ sơ
  SP.playerLook = function (av) {
    const o = EQ.OUTFITS[av.outfit] || EQ.OUTFITS.basic;
    return { hair: av.hair, hairC: av.hairC, skin: av.skin, top: o.top, bottom: o.bottom, cape: o.cape, bow: o.bow, collar: o.collar, stars: o.stars, dress: true };
  };

  // ---------- Quái vật dễ thương ----------
  SP.slime = function (ctx, cx, by, r, color, t, opt) {
    opt = opt || {};
    const sq = 1 + Math.sin(t * 6) * 0.08;
    const w = r * sq, h = r / sq * 0.85;
    SP.shadow(ctx, cx, by, r * 0.9, r * 0.25);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(cx, by - h, w, h, 0, Math.PI, 0); ctx.lineTo(cx + w, by - 2); ctx.quadraticCurveTo(cx, by + 3, cx - w, by - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(cx - w * 0.4, by - h * 1.4, w * 0.22, h * 0.16, -0.5, 0, 7); ctx.fill();
    const ey = by - h * 0.9;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - w * 0.33, ey, r * 0.2, 0, 7); ctx.arc(cx + w * 0.33, ey, r * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - w * 0.3, ey + 1, r * 0.1, 0, 7); ctx.arc(cx + w * 0.36, ey + 1, r * 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,120,150,.6)'; ctx.beginPath(); ctx.arc(cx - w * 0.6, ey + r * 0.2, r * 0.1, 0, 7); ctx.arc(cx + w * 0.6, ey + r * 0.2, r * 0.1, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1, r * 0.06); ctx.beginPath(); ctx.arc(cx, ey + r * 0.22, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke();
    if (opt.crown) SP.crown(ctx, cx, by - h * 2 - r * 0.05, r * 0.5);
  };
  SP.crown = function (ctx, cx, y, s) {
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.moveTo(cx - s, y); ctx.lineTo(cx - s, y - s * 0.8); ctx.lineTo(cx - s * 0.5, y - s * 0.35); ctx.lineTo(cx, y - s); ctx.lineTo(cx + s * 0.5, y - s * 0.35); ctx.lineTo(cx + s, y - s * 0.8); ctx.lineTo(cx + s, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(cx, y - s * 0.3, s * 0.15, 0, 7); ctx.fill();
  };
  SP.fluff = function (ctx, cx, by, r, color, t) {
    const bob = Math.sin(t * 5) * r * 0.12;
    SP.shadow(ctx, cx, by, r * 0.8, r * 0.22);
    const cy = by - r - 4 + bob;
    ctx.fillStyle = color;
    for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + t; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8, r * 0.35, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.22, 0, 7); ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.22, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - r * 0.27, cy - r * 0.05, r * 0.11, 0, 7); ctx.arc(cx + r * 0.33, cy - r * 0.05, r * 0.11, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx, cy + r * 0.25, r * 0.08, 0, 7); ctx.fill();
  };
  SP.mush = function (ctx, cx, by, r, color, t, opt) {
    const sway = Math.sin(t * 3) * r * 0.05;
    SP.shadow(ctx, cx, by, r * 0.9, r * 0.25);
    ctx.fillStyle = '#f5ecd7'; ctx.fillRect(cx - r * 0.45, by - r * 1.2, r * 0.9, r * 1.2);
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - r * 0.18, by - r * 0.7, r * 0.08, 0, 7); ctx.arc(cx + r * 0.18, by - r * 0.7, r * 0.08, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.3, by - r * 0.88); ctx.lineTo(cx - r * 0.08, by - r * 0.8); ctx.moveTo(cx + r * 0.3, by - r * 0.88); ctx.lineTo(cx + r * 0.08, by - r * 0.8); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, by - r * 0.35, r * 0.12, Math.PI + 0.3, -0.3); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(cx + sway, by - r * 1.2, r * 1.15, r * 0.75, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; [[-0.6, -1.5, 0.18], [0.1, -1.75, 0.2], [0.6, -1.45, 0.15]].forEach(d => { ctx.beginPath(); ctx.arc(cx + sway + r * d[0], by + r * d[1], r * d[2], 0, 7); ctx.fill(); });
    if (opt && opt.crown) SP.crown(ctx, cx + sway, by - r * 1.9, r * 0.4);
  };
  SP.golem = function (ctx, cx, by, r, color, t) {
    const bob = Math.sin(t * 2) * 2;
    SP.shadow(ctx, cx, by, r, r * 0.25);
    const B = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(cx + x * r, by + y * r + bob, w * r, h * r); };
    B(-0.7, -0.5, 0.45, 0.5, '#607d8b'); B(0.25, -0.5, 0.45, 0.5, '#607d8b');
    B(-0.85, -1.45, 1.7, 1.0, color); B(-1.25, -1.35, 0.4, 0.85, '#90a4ae'); B(0.85, -1.35, 0.4, 0.85, '#90a4ae');
    B(-0.55, -2.15, 1.1, 0.75, '#90a4ae');
    B(-0.38, -1.9, 0.22, 0.16, '#4dd0e1'); B(0.16, -1.9, 0.22, 0.16, '#4dd0e1');
    B(-0.2, -1.62, 0.4, 0.06, '#37474f');
    B(-0.6, -1.2, 0.3, 0.2, '#b0bec5'); B(0.2, -0.95, 0.4, 0.15, '#546e7a');
  };
  SP.star = function (ctx, cx, by, r, color, t) {
    const cy = by - r - 6 + Math.sin(t * 4) * 3;
    SP.shadow(ctx, cx, by, r * 0.7, r * 0.2);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * 2) * 0.15);
    ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.05, r * 0.08, 0, 7); ctx.arc(r * 0.18, -r * 0.05, r * 0.08, 0, 7); ctx.fill();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke();
    ctx.restore();
  };
  SP.monster = function (ctx, def, cx, by, r, color, t) {
    const f = SP[def.draw] || SP.slime;
    f(ctx, cx, by, r, color, t, { crown: def.crown });
  };

  // ---------- Đồ vật trang trí ----------
  SP.chest = function (ctx, cx, by, open, t, glow) {
    if (glow && !open) { ctx.fillStyle = 'rgba(255,230,120,' + (0.25 + Math.sin(t * 4) * 0.15) + ')'; ctx.beginPath(); ctx.arc(cx, by - 10, 18, 0, 7); ctx.fill(); }
    SP.shadow(ctx, cx, by, 13, 4);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - 12, by - 16, 24, 15);
    ctx.fillStyle = '#ffca28'; ctx.fillRect(cx - 12, by - 16, 24, 2); ctx.fillRect(cx - 2, by - 12, 4, 5);
    if (open) { ctx.fillStyle = '#5d3a1e'; ctx.fillRect(cx - 12, by - 26, 24, 9); ctx.fillStyle = '#ffe082'; ctx.fillRect(cx - 9, by - 18, 18, 3); }
    else { ctx.fillStyle = '#a0522d'; ctx.fillRect(cx - 13, by - 22, 26, 7); ctx.fillStyle = '#ffca28'; ctx.fillRect(cx - 13, by - 17, 26, 2); }
  };
  SP.gate = function (ctx, style, cx, by, t) {
    if (style === 'fence') {
      ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 15, by - 28, 30, 26);
      ctx.fillStyle = '#9a6436'; for (let i = -13; i < 14; i += 7) ctx.fillRect(cx + i, by - 27, 5, 24);
    } else if (style === 'bridge') {
      ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 14, by - 26, 5, 22); ctx.fillRect(cx + 9, by - 26, 5, 22);
      ctx.fillStyle = '#9a6436'; ctx.fillRect(cx - 14, by - 18, 9, 4); ctx.fillRect(cx + 6, by - 12, 8, 4);
    } else {
      ctx.fillStyle = '#4a3b6b'; ctx.fillRect(cx - 15, by - 30, 30, 29);
      ctx.fillStyle = '#6a5a9b'; ctx.fillRect(cx - 12, by - 27, 11, 25); ctx.fillRect(cx + 1, by - 27, 11, 25);
    }
    // ổ khóa phép thuật
    const a = 0.6 + Math.sin(t * 4) * 0.3;
    ctx.fillStyle = 'rgba(180,140,255,' + a + ')';
    ctx.beginPath(); ctx.arc(cx, by - 16, 7, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', cx, by - 15);
  };
  SP.deco = function (ctx, kind, cx, by, t) {
    if (kind === 'stall') {
      SP.shadow(ctx, cx, by, 15, 4);
      ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - 15, by - 14, 30, 12);
      ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 14, by - 34, 3, 22); ctx.fillRect(cx + 11, by - 34, 3, 22);
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#e53935'; ctx.fillRect(cx - 17 + i * 7, by - 38, 7, 8); }
    } else if (kind === 'well') {
      SP.shadow(ctx, cx, by, 14, 4);
      ctx.fillStyle = '#9e9aa8'; ctx.fillRect(cx - 13, by - 16, 26, 14); ctx.fillStyle = '#2c6fb0'; ctx.fillRect(cx - 9, by - 16, 18, 4);
      ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 13, by - 34, 3, 18); ctx.fillRect(cx + 10, by - 34, 3, 18);
      ctx.fillStyle = '#c0473b'; ctx.beginPath(); ctx.moveTo(cx - 17, by - 32); ctx.lineTo(cx, by - 42); ctx.lineTo(cx + 17, by - 32); ctx.fill();
    } else if (kind === 'board') {
      ctx.fillStyle = '#6d4326'; ctx.fillRect(cx - 16, by - 30, 32, 24);
      ctx.fillStyle = '#2e5d3a'; ctx.fillRect(cx - 14, by - 28, 28, 18);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ABC', cx, by - 17);
      ctx.fillStyle = '#6d4326'; ctx.fillRect(cx - 12, by - 6, 3, 6); ctx.fillRect(cx + 9, by - 6, 3, 6);
    } else if (kind === 'desk') {
      SP.shadow(ctx, cx, by, 13, 4);
      ctx.fillStyle = '#a1683a'; ctx.fillRect(cx - 13, by - 18, 26, 6); ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 11, by - 12, 3, 11); ctx.fillRect(cx + 8, by - 12, 3, 11);
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - 6, by - 21, 10, 3);
    } else if (kind === 'fountain') {
      SP.shadow(ctx, cx, by, 16, 5);
      ctx.fillStyle = '#b0aab8'; ctx.beginPath(); ctx.ellipse(cx, by - 8, 16, 8, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#4a9fe0'; ctx.beginPath(); ctx.ellipse(cx, by - 9, 12, 5, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#d7d2e0'; ctx.fillRect(cx - 3, by - 26, 6, 18);
      const h = 4 + Math.sin(t * 6) * 2;
      ctx.fillStyle = '#9fd3ff'; ctx.fillRect(cx - 1, by - 30 - h, 2, h + 4);
    } else if (kind === 'throne') {
      ctx.fillStyle = '#b71c1c'; ctx.fillRect(cx - 12, by - 40, 24, 36);
      ctx.fillStyle = '#ffd54f'; ctx.fillRect(cx - 14, by - 42, 28, 4); ctx.fillRect(cx - 14, by - 8, 28, 6);
      ctx.fillStyle = '#e53935'; ctx.fillRect(cx - 8, by - 34, 16, 20);
    }
  };
  SP.sign = function (ctx, cx, by) {
    SP.shadow(ctx, cx, by, 9, 3);
    ctx.fillStyle = '#7a4b2a'; ctx.fillRect(cx - 2, by - 16, 4, 16);
    ctx.fillStyle = '#c08552'; ctx.fillRect(cx - 12, by - 28, 24, 14);
    ctx.fillStyle = '#8b5a2b'; ctx.fillRect(cx - 9, by - 24, 18, 2); ctx.fillRect(cx - 9, by - 19, 12, 2);
  };
  SP.portal = function (ctx, cx, cy, t, open) {
    for (let i = 0; i < 3; i++) {
      const a = t * 2 + i * 2.1;
      ctx.fillStyle = open ? 'rgba(120,220,255,.5)' : 'rgba(160,160,170,.35)';
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8, 4, 0, 7); ctx.fill();
    }
  };

  EQ.sprites = SP;
})();
