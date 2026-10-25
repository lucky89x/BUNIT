/* ENGLISH QUEST – Đồ họa nâng cấp (bản 1.3)
 * - Nền có vân, đổ bóng, chuyển tiếp mềm giữa các loại đất
 * - Cây cao nhiều tầng tán (vẽ theo chiều sâu, có thể che nhân vật)
 * - Nhân vật có viền tối giúp nổi bật trên nền
 * - Bầu không khí riêng cho từng vùng: ánh sáng, mây trôi, lá rơi, đom đóm
 * Tất cả vẽ bằng code, không dùng ảnh ngoài.
 */
window.EQ = window.EQ || {};
(function () {
  const SP = EQ.sprites;
  const TS = 32;
  const hash = SP.hash;
  const cache = {};

  function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function mix(a, b, t) { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; }
  function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

  // vân đất: các khối 4x4 pixel lệch màu nhẹ
  function texture(c, base, dark, light, seed, amount) {
    px(c, 0, 0, TS, TS, base);
    for (let by = 0; by < 8; by++) for (let bx = 0; bx < 8; bx++) {
      const h = hash(bx + seed * 7, by + seed * 13, 3) % 100;
      if (h < amount) px(c, bx * 4, by * 4, 4, 4, h % 2 ? dark : light);
    }
  }
  function blades(c, col, seed, n) {
    for (let i = 0; i < n; i++) {
      const h = hash(seed, i, 11); const x = 3 + h % 26, y = 6 + (h >>> 6) % 22;
      px(c, x, y, 1, 3, col); px(c, x + 2, y + 1, 1, 2, col); px(c, x + 1, y - 1, 1, 3, col);
    }
  }

  const P = {
    grass: ['#6fbf4a', '#5fae3e', '#82cf5c', '#4a9433'],
    forest: ['#4c9446', '#418640', '#5aa553', '#336f34'],
    path: ['#d9b47c', '#c89f66', '#e7c896', '#b0885a'],
    sand: ['#efd89c', '#e3c787', '#f8e8bd'],
    stone: ['#c3bccf', '#8e87a0', '#ddd8e6', '#a9a2b9']
  };

  const G = {
    '.': (c, v) => { texture(c, P.grass[0], P.grass[1], P.grass[2], v, 26); blades(c, P.grass[3], v, 3); },
    'g': (c, v) => { texture(c, P.forest[0], P.forest[1], P.forest[2], v, 30); blades(c, P.forest[3], v, 4); },
    '=': (c, v) => {
      texture(c, P.path[0], P.path[1], P.path[2], v, 30);
      for (let i = 0; i < 3; i++) { const h = hash(v, i, 5); px(c, 4 + h % 24, 4 + (h >>> 5) % 24, 3, 2, P.path[3]); }
    },
    's': (c, v) => { texture(c, P.sand[0], P.sand[1], P.sand[2], v, 22); },
    'S': (c, v) => {
      px(c, 0, 0, TS, TS, P.stone[1]);
      const off = v % 2 ? 8 : 0;
      for (let r = 0; r < 2; r++) for (let k = -1; k < 2; k++) {
        const x = k * 16 + (r ? off : (off + 8) % 16), y = r * 16;
        px(c, x + 1, y + 1, 14, 14, P.stone[0]);
        px(c, x + 1, y + 1, 14, 2, P.stone[2]); px(c, x + 1, y + 1, 2, 14, P.stone[2]);
        px(c, x + 1, y + 13, 14, 2, P.stone[3]); px(c, x + 13, y + 1, 2, 14, P.stone[3]);
      }
    },
    'c': (c) => {
      px(c, 0, 0, TS, TS, '#9e1a2b');
      for (let y = 0; y < 32; y += 8) for (let x = (y / 8) % 2 ? 4 : 0; x < 32; x += 8) { px(c, x + 3, y + 1, 2, 6, '#c22f40'); px(c, x + 1, y + 3, 6, 2, '#c22f40'); }
      px(c, 0, 0, TS, 2, '#e8b030'); px(c, 0, 30, TS, 2, '#e8b030');
    }
  };
  const UNDER = { 'T': '.', 'A': '.', 'B': '.', ',': '.', '"': '.', 'R': '.', 'F': '.', 'r': '.', 'h': '.', 'd': '.', 't': 'g', 'M': 'g', 'P': 'S', 'K': 'S', 'f': 'S', 'W': 'S', 'w': 'S' };

  const D = {
    ',': (c, v) => {
      const cols = ['#ff6b9a', '#ffd84d', '#ffffff', '#b98cff', '#ff9a4d'];
      for (let i = 0; i < 3; i++) {
        const h = hash(v, i, 3); const x = 5 + h % 22, y = 6 + (h >>> 7) % 20; const col = cols[(h >>> 3) % 5];
        px(c, x, y + 3, 1, 3, '#3f8a2e');
        px(c, x - 1, y, 3, 3, col); px(c, x, y - 1, 1, 5, col); px(c, x - 2, y + 1, 5, 1, col); px(c, x, y + 1, 1, 1, '#ffe14d');
      }
    },
    '"': (c, v) => { for (let i = 0; i < 6; i++) { const h = hash(v, i, 5); const x = 3 + h % 26, y = 14 + (h >>> 6) % 12; px(c, x, y, 1, 7, '#3f8a2e'); px(c, x + 1, y + 2, 1, 5, '#5fb046'); px(c, x - 1, y + 3, 1, 4, '#4c9a35'); } },
    'B': (c) => {
      SP.shadow(c, 16, 27, 13, 4);
      const blob = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
      blob(10, 20, 9, '#2d6f2e'); blob(22, 20, 9, '#2d6f2e'); blob(16, 13, 9, '#2d6f2e');
      blob(10, 19, 8, '#3f9140'); blob(22, 19, 8, '#3f9140'); blob(16, 12, 8, '#4aa34a');
      blob(13, 10, 3, '#6cc76a'); blob(20, 15, 2, '#6cc76a');
      [[8, 18], [22, 22], [16, 9]].forEach(p => { px(c, p[0], p[1], 2, 2, '#ff5c7a'); });
    },
    'R': (c) => {
      SP.shadow(c, 16, 27, 13, 4);
      c.fillStyle = '#5b5866'; c.beginPath(); c.ellipse(16, 19, 14, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#8c8a98'; c.beginPath(); c.ellipse(16, 18, 13, 10, 0, 0, 7); c.fill();
      c.fillStyle = '#a9a7b6'; c.beginPath(); c.ellipse(13, 14, 7, 5, -0.3, 0, 7); c.fill();
      c.fillStyle = '#727080'; c.beginPath(); c.ellipse(21, 22, 5, 3, 0, 0, 7); c.fill();
    },
    'F': (c) => {
      px(c, 0, 11, TS, 4, '#7a4b2a'); px(c, 0, 10, TS, 2, '#b07a48'); px(c, 0, 21, TS, 4, '#7a4b2a'); px(c, 0, 20, TS, 2, '#b07a48');
      [4, 22].forEach(x => { px(c, x, 4, 6, 25, '#6b3f22'); px(c, x, 4, 4, 25, '#9c6638'); px(c, x, 3, 6, 2, '#c58d58'); });
      SP.shadow(c, 16, 29, 14, 2);
    },
    'r': (c, v) => {
      const g = c.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, '#d35a46'); g.addColorStop(1, '#a23b2e');
      c.fillStyle = g; c.fillRect(0, 0, TS, TS);
      for (let y = 0; y < 32; y += 6) { px(c, 0, y + 5, TS, 1, '#7d2a22'); for (let x = (y / 6) % 2 ? 0 : 6; x < 32; x += 12) px(c, x, y, 1, 5, '#8f3328'); }
      if (v === 0) { px(c, 20, 0, 6, 9, '#7d6a62'); px(c, 19, 0, 8, 2, '#9b8a82'); }
    },
    'h': (c) => {
      px(c, 0, 0, TS, TS, '#f2e2bd'); px(c, 0, 0, TS, 4, '#6b3f22'); px(c, 0, 28, TS, 4, '#6b3f22'); px(c, 0, 26, TS, 2, '#d9c69e');
      px(c, 8, 8, 16, 14, '#5b3a22'); px(c, 9, 9, 14, 12, '#8fd0f5'); px(c, 15, 9, 2, 12, '#5b3a22'); px(c, 9, 14, 14, 2, '#5b3a22');
      px(c, 10, 10, 4, 3, '#d9f2ff'); px(c, 7, 21, 18, 2, '#9c6638');
      px(c, 9, 22, 14, 3, '#3f8a2e'); px(c, 10, 21, 2, 2, '#ff6b9a'); px(c, 15, 21, 2, 2, '#ffd84d'); px(c, 20, 21, 2, 2, '#ff6b9a');
    },
    'd': (c) => {
      px(c, 0, 0, TS, TS, '#f2e2bd'); px(c, 0, 0, TS, 4, '#6b3f22');
      c.fillStyle = '#5b3a22'; c.beginPath(); c.moveTo(7, 32); c.lineTo(7, 12); c.quadraticCurveTo(16, 2, 25, 12); c.lineTo(25, 32); c.fill();
      c.fillStyle = '#8f5a32'; c.beginPath(); c.moveTo(9, 32); c.lineTo(9, 13); c.quadraticCurveTo(16, 5, 23, 13); c.lineTo(23, 32); c.fill();
      px(c, 15, 10, 2, 22, '#6b3f22'); px(c, 19, 20, 2, 2, '#ffd54f');
    },
    'W': (c, v) => {
      px(c, 0, 0, TS, TS, '#3c3a52');
      for (let y = 0; y < 32; y += 8) for (let x = (y / 8) % 2 ? -8 : 0; x < 32; x += 16) {
        px(c, x + 1, y + 1, 14, 6, '#5d5a78'); px(c, x + 1, y + 1, 14, 1, '#7d7a99'); px(c, x + 1, y + 6, 14, 1, '#2e2c40');
      }
      if (hash(v, 2, 9) % 5 === 0) { px(c, 6, 10, 3, 6, '#5f8a4a'); px(c, 7, 8, 2, 2, '#76a85a'); }
    },
    'w': (c, v) => {
      D.W(c, v);
      c.fillStyle = '#2b2f4a'; c.beginPath(); c.moveTo(9, 26); c.lineTo(9, 12); c.quadraticCurveTo(16, 3, 23, 12); c.lineTo(23, 26); c.fill();
      const g = c.createLinearGradient(0, 8, 0, 26); g.addColorStop(0, '#ffe9a8'); g.addColorStop(1, '#ffb74d');
      c.fillStyle = g; c.beginPath(); c.moveTo(11, 25); c.lineTo(11, 13); c.quadraticCurveTo(16, 6, 21, 13); c.lineTo(21, 25); c.fill();
      px(c, 15, 7, 2, 18, '#2b2f4a'); px(c, 11, 16, 10, 2, '#2b2f4a');
    },
    'P': (c) => {
      SP.shadow(c, 16, 29, 12, 4);
      const g = c.createLinearGradient(7, 0, 25, 0); g.addColorStop(0, '#f6f3fb'); g.addColorStop(0.5, '#d9d3e6'); g.addColorStop(1, '#a8a0bb');
      c.fillStyle = g; c.fillRect(8, 3, 16, 25);
      px(c, 6, 0, 20, 4, '#ece8f4'); px(c, 6, 3, 20, 1, '#b5aec6'); px(c, 6, 26, 20, 4, '#b5aec6');
      px(c, 12, 4, 1, 22, 'rgba(255,255,255,.6)'); px(c, 19, 4, 1, 22, 'rgba(0,0,0,.12)');
    },
    'K': (c, v) => {
      px(c, 0, 0, TS, TS, '#5b3820'); px(c, 1, 1, 30, 30, '#4a2c17'); px(c, 0, 15, TS, 2, '#7a4b2a'); px(c, 0, 30, TS, 2, '#7a4b2a');
      const cols = ['#e04848', '#3d8fe0', '#43a047', '#f2c230', '#8e44c9', '#f07f2e', '#2bb5a8'];
      for (let s = 0; s < 2; s++) for (let i = 0; i < 7; i++) {
        const h = hash(v, i + s * 9, 9); const hh = 9 + h % 4; const col = cols[h % 7];
        px(c, 2 + i * 4, 15 * s + 15 - hh, 3, hh, col); px(c, 2 + i * 4, 15 * s + 15 - hh, 3, 1, 'rgba(255,255,255,.4)');
      }
    },
    'f': (c, v) => {
      SP.shadow(c, 16, 29, 14, 3);
      px(c, 3, 13, 26, 16, '#8b8599'); px(c, 3, 13, 26, 3, '#c9c3d6'); px(c, 3, 26, 26, 3, '#6e687c');
      c.fillStyle = '#3f8a2e'; c.beginPath(); c.ellipse(16, 12, 12, 6, 0, 0, 7); c.fill();
      const cols = ['#ff6b9a', '#ffd84d', '#b98cff', '#ffffff'];
      for (let i = 0; i < 5; i++) { const h = hash(v, i, 4); const x = 7 + h % 18, y = 7 + (h >>> 4) % 6; c.fillStyle = cols[h % 4]; c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }
    },
    'M': (c, v) => {
      for (let i = 0; i < 2; i++) {
        const h = hash(v, i, 2); const x = 7 + h % 18, y = 12 + (h >>> 5) % 12;
        px(c, x + 2, y + 4, 3, 6, '#f5ecd7'); c.fillStyle = i ? '#e05252' : '#f08a3a'; c.beginPath(); c.arc(x + 3.5, y + 4, 5, Math.PI, 0); c.fill();
        px(c, x + 1, y + 1, 2, 2, '#fff'); px(c, x + 5, y + 2, 1, 1, '#fff');
      }
    }
  };

  function tileCanvas(ch, v) {
    const k = 't2' + ch + v + (SP.region === 'forest' ? 'f' : '');
    if (cache[k]) return cache[k];
    const cv = document.createElement('canvas'); cv.width = TS; cv.height = TS;
    const c = cv.getContext('2d');
    let g = G[ch] ? ch : (UNDER[ch] || null);
    if (g === '.' && SP.region === 'forest') g = 'g';
    if (g && G[g]) G[g](c, v);
    if (D[ch]) D[ch](c, v);
    if (ch === 'T' || ch === 'A' || ch === 't') SP.shadow(c, 16, 28, 14, 5);
    cache[k] = cv;
    return cv;
  }

  SP.drawTile = function (ctx, ch, tx, ty, sx, sy, t) {
    if (ch === '~' || ch === 'b') {
      const g = ctx.createLinearGradient(0, sy, 0, sy + TS);
      g.addColorStop(0, '#3d93dc'); g.addColorStop(1, '#3584cc');
      ctx.fillStyle = g; ctx.fillRect(sx, sy, TS, TS);
      const ph = t * 1.6 + tx * 0.9 + ty * 1.3;
      ctx.fillStyle = 'rgba(160,215,255,.55)';
      ctx.fillRect(sx + 4 + Math.round(Math.sin(ph) * 3), sy + 8, 8, 2);
      ctx.fillRect(sx + 18 + Math.round(Math.cos(ph * 0.8) * 3), sy + 20, 9, 2);
      if (hash(tx, ty, 1) % 7 === 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + 0.3 * Math.sin(t * 3 + tx)) + ')'; ctx.fillRect(sx + 14, sy + 13, 2, 2); }
      if (ch === 'b') {
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sx, sy + 28, TS, 4);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#a26a3a' : '#b47a45'; ctx.fillRect(sx + i * 8, sy + 3, 8, 25); ctx.fillStyle = '#7a4b2a'; ctx.fillRect(sx + i * 8, sy + 3, 1, 25); }
        ctx.fillStyle = '#5d3a1e'; ctx.fillRect(sx, sy + 2, TS, 3); ctx.fillRect(sx, sy + 26, TS, 3);
        ctx.fillStyle = '#c99059'; ctx.fillRect(sx, sy + 2, TS, 1);
      }
      return;
    }
    ctx.drawImage(tileCanvas(ch, hash(tx, ty) % 6), sx, sy);
  };

  // ---------- Cây cao (vẽ theo chiều sâu) ----------
  SP.isTree = ch => ch === 'T' || ch === 'A' || ch === 't';
  SP.tallTree = function (ch, v) {
    const k = 'tree' + ch + v;
    if (cache[k]) return cache[k];
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 84;
    const c = cv.getContext('2d');
    const bx = 32, by = 82; // gốc cây
    if (ch === 't') {
      px(c, bx - 3, by - 16, 6, 14, '#5b3a22'); px(c, bx - 3, by - 16, 2, 14, '#7a4b2a');
      const layers = [[26, 40, 0], [21, 30, 18], [16, 22, 33], [10, 16, 46]];
      layers.forEach((L, i) => {
        const w = L[0], hgt = L[1], y = by - 10 - L[2];
        c.fillStyle = '#163f24'; c.beginPath(); c.moveTo(bx - w - 2, y + 1); c.lineTo(bx + w + 2, y + 1); c.lineTo(bx, y - hgt - 2); c.closePath(); c.fill();
        c.fillStyle = i % 2 ? '#2a7040' : '#246637'; c.beginPath(); c.moveTo(bx - w, y); c.lineTo(bx + w, y); c.lineTo(bx, y - hgt); c.closePath(); c.fill();
        c.fillStyle = '#3b8b52'; c.beginPath(); c.moveTo(bx - w + 4, y - 2); c.lineTo(bx - 2, y - 2); c.lineTo(bx - 2, y - hgt + 6); c.closePath(); c.fill();
      });
    } else {
      px(c, bx - 5, by - 26, 10, 24, '#5b3a22'); px(c, bx - 5, by - 26, 4, 24, '#7d5131');
      px(c, bx - 9, by - 4, 18, 3, '#5b3a22');
      const blob = (x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); };
      const pts = [[bx - 14, by - 36, 15], [bx + 14, by - 36, 15], [bx, by - 48, 18], [bx - 8, by - 58, 13], [bx + 10, by - 56, 12], [bx, by - 32, 14]];
      pts.forEach(p => blob(p[0], p[1], p[2] + 2, '#1f5a26'));
      pts.forEach(p => blob(p[0], p[1], p[2], '#2f8a37'));
      pts.forEach(p => blob(p[0] - 3, p[1] - 4, p[2] * 0.6, '#45a84a'));
      [[bx - 10, by - 60, 4], [bx - 16, by - 42, 4], [bx + 4, by - 54, 3]].forEach(p => blob(p[0], p[1], p[2], '#7fd26e'));
      if (ch === 'A') [[bx - 14, by - 36], [bx + 12, by - 42], [bx - 2, by - 52], [bx + 16, by - 30], [bx - 6, by - 30]].forEach(p => { blob(p[0], p[1], 3.5, '#d62f2f'); px(c, p[0] - 1, p[1] - 2, 2, 1, '#ff9a9a'); });
      if (v % 3 === 0 && ch === 'T') [[bx + 8, by - 40], [bx - 12, by - 52]].forEach(p => { blob(p[0], p[1], 2.5, '#ffffff'); blob(p[0], p[1], 1, '#ffd84d'); });
    }
    cache[k] = cv;
    return cv;
  };
  SP.drawTallTree = function (ctx, ch, tx, ty, t) {
    const v = hash(tx, ty) % 6;
    const cv = SP.tallTree(ch, v);
    const sway = Math.sin(t * 1.2 + tx * 0.7 + ty) * 0.6;
    ctx.drawImage(cv, Math.round((tx + 0.5) * TS - 32 + sway), (ty + 1) * TS - 84 + 2);
  };

  // ---------- Chi tiết thêm cho nhân vật + trang bị hiện trên người ----------
  const rawHuman = SP.human;
  function detail(ctx, cx, by, look, dir, frame, opt) {
    const u = opt.scale || 2;
    const ox = Math.round(cx - 8 * u), oy = Math.round(by - 20 * u);
    const R = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x * u, oy + y * u, w * u, h * u); };
    const Rp = (x, y, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x * u, oy + y * u, Math.max(1, u / 2), Math.max(1, u / 2)); };
    const bob = (frame % 2) && opt.moving ? -1 : 0;
    // đổ bóng & ánh sáng trên quần áo
    R(11, 9 + bob, 1, 6, 'rgba(0,0,0,.18)'); R(4, 9 + bob, 1, 5, 'rgba(255,255,255,.16)');
    R(4, 13 + bob, 8, 1, 'rgba(0,0,0,.16)');
    if (dir !== 'up') {
      R(5, 1 + bob, 3, 1, 'rgba(255,255,255,.28)');
      if (dir === 'down') { Rp(6, 5 + bob, '#ffffff'); Rp(9, 5 + bob, '#ffffff'); }
      else Rp(dir === 'left' ? 5 : 10, 5 + bob, '#ffffff');
    }
    const g = look.g;
    if (!g) return;
    if (g.neck && dir !== 'up') { R(5, 9 + bob, 6, 1, g.neck); R(7, 10 + bob, 2, 1, g.neck); Rp(7, 10 + bob, '#ffffff'); }
    if (g.wand) {
      const hx = dir === 'down' ? 13 : dir === 'right' ? 9 : dir === 'left' ? 6 : 2;
      R(hx, 8 + bob, 1, 6, '#6d4c41'); R(hx, 7 + bob, 1, 1, g.wand); Rp(hx, 6 + bob, '#ffffff');
    }
    if (g.ring && dir !== 'up') Rp(dir === 'left' ? 7 : 2, 13 + bob, g.ring);
    const hy = bob;
    if (g.hat === 'h1') { R(9, 0 + hy, 2, 2, '#ff80ab'); R(12, 0 + hy, 2, 2, '#ff80ab'); R(11, 1 + hy, 1, 1, '#c2185b'); R(3, 2 + hy, 10, 1, '#ff80ab'); }
    else if (g.hat === 'h2') { R(2, 1 + hy, 12, 1, '#4527a0'); R(4, -1 + hy, 8, 2, '#5e35b1'); R(5, -3 + hy, 6, 2, '#5e35b1'); R(7, -5 + hy, 3, 2, '#5e35b1'); R(6, -1 + hy, 1, 1, '#ffd54f'); }
    else if (g.hat === 'h3' || g.hat === 'h4') { const c = g.hatC || '#ffd54f'; R(4, -1 + hy, 8, 2, c); R(4, -2 + hy, 1, 1, c); R(7, -3 + hy, 2, 2, c); R(11, -2 + hy, 1, 1, c); R(7, -1 + hy, 2, 1, g.hat === 'h4' ? '#e53935' : '#42a5f5'); }
    else if (g.hat === 'h5') { R(4, -1 + hy, 8, 2, '#ffca28'); R(6, -4 + hy, 4, 3, '#fff176'); R(7, -5 + hy, 2, 1, '#fff176'); R(5, -3 + hy, 1, 1, '#fff176'); R(10, -3 + hy, 1, 1, '#fff176'); Rp(7, -3 + hy, '#ffffff'); }
  }
  SP.humanDetail = detail;
  SP.human = function (ctx, cx, by, look, dir, frame, opt) { opt = opt || {}; rawHuman(ctx, cx, by, look, dir, frame, opt); detail(ctx, cx, by, look, dir, frame, opt); };
  const basePlayerLook = SP.playerLook;
  SP.playerLook = function (av) { const l = basePlayerLook(av); if (av._gear) l.g = av._gear; return l; };

  // ---------- Viền cho nhân vật (được lưu đệm) ----------
  const baseHuman = SP.human;
  SP.humanRaw = baseHuman;
  SP.human = function (ctx, cx, by, look, dir, frame, opt) {
    opt = opt || {};
    if (opt.noOutline) return baseHuman(ctx, cx, by, look, dir, frame, opt);
    const scale = opt.scale || 2;
    const key = 'h' + JSON.stringify(look) + dir + (frame % 4) + (opt.moving ? 1 : 0) + scale;
    let cv = cache[key];
    if (!cv) {
      const W = Math.ceil(24 * scale), H = Math.ceil(30 * scale);
      const raw = document.createElement('canvas'); raw.width = W; raw.height = H;
      baseHuman(raw.getContext('2d'), W / 2, H - 4 * scale, look, dir, frame, Object.assign({}, opt, { noShadow: true }));
      const sil = document.createElement('canvas'); sil.width = W; sil.height = H;
      const s = sil.getContext('2d'); s.drawImage(raw, 0, 0); s.globalCompositeOperation = 'source-in'; s.fillStyle = 'rgba(30,20,45,.9)'; s.fillRect(0, 0, W, H);
      cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const o = cv.getContext('2d');
      const d = Math.max(1, Math.round(scale / 2));
      [[-d, 0], [d, 0], [0, -d], [0, d]].forEach(p => o.drawImage(sil, p[0], p[1]));
      o.drawImage(raw, 0, 0);
      cv._ox = W / 2; cv._oy = H - 4 * scale;
      cache[key] = cv;
    }
    if (!opt.noShadow) SP.shadow(ctx, cx, by, 7 * scale, 2 * scale);
    ctx.drawImage(cv, Math.round(cx - cv._ox), Math.round(by - cv._oy));
  };

  // ---------- Bầu không khí từng vùng ----------
  const MOOD = {
    village: { tint: null, vignette: 0.28, ambient: 'petal' },
    forest: { tint: 'rgba(20,70,40,.14)', vignette: 0.38, ambient: 'firefly' },
    castle: { tint: 'rgba(60,40,110,.12)', vignette: 0.42, ambient: 'dust' }
  };
  SP.atmosphere = function (ctx, region, t, amb, W, H) {
    const m = MOOD[region] || MOOD.village;
    // bóng mây trôi
    if (region !== 'castle') {
      ctx.fillStyle = 'rgba(20,30,60,.07)';
      for (let i = 0; i < 3; i++) {
        const x = ((t * 12 + i * 420) % (W + 400)) - 200, y = 120 + i * 190 + Math.sin(t * 0.2 + i) * 30;
        ctx.beginPath(); ctx.ellipse(x, y, 150, 55, 0, 0, 7); ctx.ellipse(x + 90, y + 20, 110, 45, 0, 0, 7); ctx.fill();
      }
    }
    if (m.tint) { ctx.fillStyle = m.tint; ctx.fillRect(0, 0, W, H); }
    // tia nắng xiên xuyên qua tán lá
    if (region !== 'castle') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const x0 = 120 + i * 230 + Math.sin(t * 0.25 + i) * 30;
        const a = (region === 'forest' ? 0.075 : 0.045) * (0.7 + 0.3 * Math.sin(t * 0.6 + i * 2));
        const g = ctx.createLinearGradient(x0, 0, x0 - 260, H);
        g.addColorStop(0, 'rgba(255,240,180,' + a + ')'); g.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, -10); ctx.lineTo(x0 + 70, -10); ctx.lineTo(x0 - 180, H); ctx.lineTo(x0 - 300, H); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // hạt bay lơ lửng
    amb.forEach(a => {
      if (m.ambient === 'firefly') {
        const al = 0.5 + 0.5 * Math.sin(t * 3 + a.p);
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, 7);
        g.addColorStop(0, 'rgba(255,250,170,' + al + ')'); g.addColorStop(1, 'rgba(255,250,170,0)');
        ctx.fillStyle = g; ctx.fillRect(a.x - 7, a.y - 7, 14, 14);
      } else if (m.ambient === 'petal') {
        ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(t * 2 + a.p);
        ctx.fillStyle = a.p % 2 > 1 ? 'rgba(255,190,210,.85)' : 'rgba(255,255,255,.8)'; ctx.fillRect(-2, -1, 4, 2); ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(255,240,210,' + (0.25 + 0.2 * Math.sin(t + a.p)) + ')'; ctx.fillRect(a.x, a.y, 2, 2);
      }
    });
    // viền tối quanh màn hình
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,5,30,' + m.vignette + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  };
  SP.updateAmbient = function (region, amb, dt, t, W, H) {
    const m = MOOD[region] || MOOD.village;
    const want = m.ambient === 'firefly' ? 22 : m.ambient === 'petal' ? 14 : 30;
    while (amb.length < want) amb.push({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * 6, vx: 0, vy: 0 });
    amb.forEach(a => {
      if (m.ambient === 'firefly') { a.x += Math.sin(t * 0.7 + a.p) * 12 * dt; a.y += Math.cos(t * 0.9 + a.p * 2) * 10 * dt; }
      else if (m.ambient === 'petal') { a.x += (18 + Math.sin(t + a.p) * 10) * dt; a.y += 22 * dt; }
      else { a.x += Math.sin(t * 0.3 + a.p) * 4 * dt; a.y -= 3 * dt; }
      if (a.x > W + 10) a.x = -10; if (a.x < -10) a.x = W + 10;
      if (a.y > H + 10) a.y = -10; if (a.y < -10) a.y = H + 10;
    });
  };
  SP.mix = mix;

  // ---------- Đồ trang trí mới ----------
  const baseDeco = SP.deco;
  const EX = {
    lamp: (c, cx, by, t) => {
      SP.shadow(c, cx, by, 8, 3);
      c.fillStyle = '#37474f'; c.fillRect(cx - 2, by - 40, 4, 40); c.fillRect(cx - 6, by - 3, 12, 3);
      c.fillStyle = '#263238'; c.fillRect(cx - 7, by - 50, 14, 4); c.fillRect(cx - 5, by - 46, 10, 2);
      const a = 0.75 + 0.25 * Math.sin(t * 3);
      c.fillStyle = 'rgba(255,224,130,' + a + ')'; c.fillRect(cx - 5, by - 44, 10, 8);
      const g = c.createRadialGradient(cx, by - 40, 2, cx, by - 40, 26); g.addColorStop(0, 'rgba(255,230,140,.35)'); g.addColorStop(1, 'rgba(255,230,140,0)');
      c.fillStyle = g; c.fillRect(cx - 26, by - 66, 52, 52);
    },
    barrel: (c, cx, by) => {
      SP.shadow(c, cx, by, 11, 4);
      c.fillStyle = '#8d5a2b'; c.beginPath(); c.ellipse(cx, by - 12, 11, 13, 0, 0, 7); c.fill();
      c.fillStyle = '#a86f3a'; c.fillRect(cx - 9, by - 22, 6, 20);
      c.fillStyle = '#546e7a'; c.fillRect(cx - 11, by - 18, 22, 2); c.fillRect(cx - 11, by - 8, 22, 2);
      c.fillStyle = '#6d4326'; c.beginPath(); c.ellipse(cx, by - 24, 9, 3, 0, 0, 7); c.fill();
    },
    crate: (c, cx, by) => {
      SP.shadow(c, cx, by, 12, 4);
      c.fillStyle = '#b07a43'; c.fillRect(cx - 12, by - 22, 24, 20);
      c.fillStyle = '#8d5a2b'; c.fillRect(cx - 12, by - 22, 24, 3); c.fillRect(cx - 12, by - 5, 24, 3); c.fillRect(cx - 12, by - 22, 3, 20); c.fillRect(cx + 9, by - 22, 3, 20);
      c.strokeStyle = '#8d5a2b'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 10, by - 20); c.lineTo(cx + 10, by - 4); c.stroke();
    },
    log: (c, cx, by) => {
      SP.shadow(c, cx, by, 15, 4);
      c.fillStyle = '#6d4326'; c.fillRect(cx - 14, by - 13, 28, 11);
      c.fillStyle = '#8d5a2b'; c.fillRect(cx - 14, by - 13, 28, 3);
      c.fillStyle = '#d7a86e'; c.beginPath(); c.ellipse(cx + 14, by - 7, 4, 6, 0, 0, 7); c.fill();
      c.fillStyle = '#4caf50'; c.fillRect(cx - 8, by - 15, 5, 3); c.fillStyle = '#e53935'; c.fillRect(cx + 2, by - 17, 4, 3);
    },
    banner: (c, cx, by, t) => {
      c.fillStyle = '#5d4037'; c.fillRect(cx - 1, by - 46, 3, 46);
      const w = Math.sin(t * 2) * 2;
      c.fillStyle = '#7c4dff'; c.beginPath(); c.moveTo(cx + 2, by - 44); c.lineTo(cx + 22 + w, by - 40); c.lineTo(cx + 2, by - 28); c.fill();
      c.fillStyle = '#ffd54f'; c.fillRect(cx + 6, by - 39, 4, 4);
    },
    jewelstall: (c, cx, by, t) => {
      SP.shadow(c, cx, by, 15, 4);
      c.fillStyle = '#6a1b9a'; c.fillRect(cx - 15, by - 14, 30, 12);
      c.fillStyle = '#4a148c'; c.fillRect(cx - 14, by - 34, 3, 22); c.fillRect(cx + 11, by - 34, 3, 22);
      for (let i = 0; i < 5; i++) { c.fillStyle = i % 2 ? '#fff' : '#ab47bc'; c.fillRect(cx - 17 + i * 7, by - 38, 7, 8); }
      const gems = ['#e53935', '#1e88e5', '#43a047', '#ffd54f'];
      gems.forEach((g, i) => { c.fillStyle = g; c.beginPath(); c.arc(cx - 10 + i * 7, by - 17, 2.5, 0, 7); c.fill(); });
      if (Math.sin(t * 4) > 0.6) { c.fillStyle = '#fff'; c.fillRect(cx - 4, by - 20, 2, 2); }
    },
    jobboard: (c, cx, by) => {
      SP.shadow(c, cx, by, 14, 4);
      c.fillStyle = '#5d4037'; c.fillRect(cx - 13, by - 10, 3, 10); c.fillRect(cx + 10, by - 10, 3, 10);
      c.fillStyle = '#8d5a2b'; c.fillRect(cx - 16, by - 36, 32, 28);
      c.fillStyle = '#a1683a'; c.fillRect(cx - 14, by - 34, 28, 24);
      [['#fff9c4', -11, -32], ['#ffffff', 1, -31], ['#e1f5fe', -8, -21], ['#ffe0b2', 3, -20]].forEach(n => { c.fillStyle = n[0]; c.fillRect(cx + n[1], by + n[2], 9, 9); c.fillStyle = '#e53935'; c.fillRect(cx + n[1] + 4, by + n[2], 2, 2); });
      c.fillStyle = '#ffd54f'; c.fillRect(cx - 16, by - 40, 32, 5);
    },
    tower: (c, cx, by, t) => {
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(cx, by - 2, 26, 7, 0, 0, 7); c.fill();
      const g = c.createLinearGradient(cx - 20, 0, cx + 20, 0); g.addColorStop(0, '#9e9ab5'); g.addColorStop(0.5, '#c9c4dc'); g.addColorStop(1, '#7b7794');
      c.fillStyle = g; c.fillRect(cx - 18, by - 96, 36, 94);
      c.fillStyle = 'rgba(0,0,0,.12)'; for (let y = by - 92; y < by; y += 10) c.fillRect(cx - 18, y, 36, 1);
      c.fillStyle = '#5e35b1'; c.beginPath(); c.moveTo(cx - 24, by - 96); c.lineTo(cx, by - 128); c.lineTo(cx + 24, by - 96); c.fill();
      c.fillStyle = '#7e57c2'; c.beginPath(); c.moveTo(cx - 24, by - 96); c.lineTo(cx, by - 128); c.lineTo(cx - 2, by - 96); c.fill();
      c.fillStyle = '#ffd54f'; c.beginPath(); c.arc(cx, by - 130, 3 + Math.sin(t * 4), 0, 7); c.fill();
      c.fillStyle = '#4a3b6b'; c.beginPath(); c.moveTo(cx - 8, by - 2); c.lineTo(cx - 8, by - 20); c.quadraticCurveTo(cx, by - 30, cx + 8, by - 20); c.lineTo(cx + 8, by - 2); c.fill();
      [[-8, -60], [6, -78], [-6, -40]].forEach(w => { c.fillStyle = '#2b2f4a'; c.fillRect(cx + w[0], by + w[1], 6, 9); c.fillStyle = 'rgba(255,214,120,' + (0.6 + 0.4 * Math.sin(t * 2 + w[0])) + ')'; c.fillRect(cx + w[0] + 1, by + w[1] + 1, 4, 7); });
    }
  };
  SP.deco = function (ctx, kind, cx, by, t) { if (EX[kind]) return EX[kind](ctx, cx, by, t); return baseDeco(ctx, kind, cx, by, t); };
})();
