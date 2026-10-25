/* ENGLISH QUEST – NHÂN VẬT & QUÁI VẼ TAY KIỂU GHIBLI (bản 1.9, phương án 2.5D)
 * Vẽ bằng mã lên canvas theo lối tranh màu nước: nét viền mảnh màu nâu, mảng màu mềm có sáng tối,
 * má hồng, mắt to long lanh, vân giấy nhẹ. Mỗi nhân vật có 3 hướng (trước / sau / nghiêng) × 4 khung bước đi.
 * Kết quả là canvas để world3d.js dựng đứng trong cảnh 3D (billboard), cũng dùng được cho màn 2D sau này.
 *   EQ.paint.human(look, dir, frame)  → canvas 160x240 (chân chạm đáy)
 *   EQ.paint.monster(def, color, frame) → canvas 200x200 (chân chạm đáy)
 */
window.EQ = window.EQ || {};
(function () {
  const P = {};
  const HW = 160, HH = 240;
  const cache = {};

  // ---------- màu ----------
  function hex2rgb(h) { if (/^rgb/.test(h)) return h.match(/[\d.]+/g).slice(0, 3).map(Number); h = (h || '#888888').replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function shade(h, k) { // k > 0 sáng hơn, k < 0 tối hơn
    const c = hex2rgb(h).map(v => k >= 0 ? v + (255 - v) * k : v * (1 + k));
    return 'rgb(' + c.map(v => Math.round(Math.max(0, Math.min(255, v)))).join(',') + ')';
  }
  function warm(h, k) { const c = hex2rgb(h); return 'rgb(' + Math.round(c[0] * (1 - k) + 74 * k) + ',' + Math.round(c[1] * (1 - k) + 46 * k) + ',' + Math.round(c[2] * (1 - k) + 36 * k) + ')'; }
  P.shade = shade;

  // tô một hình theo kiểu màu nước: nền + vùng sáng góc trên trái + viền tối mềm + nét viền nâu
  function wash(g, path, col, o) {
    o = o || {};
    const b = o.box || [0, 0, HW, HH];
    g.save();
    path(); g.fillStyle = col; g.fill();
    g.clip();
    const gr = g.createRadialGradient(b[0] + b[2] * 0.3, b[1] + b[3] * 0.25, 2, b[0] + b[2] * 0.5, b[1] + b[3] * 0.55, Math.max(b[2], b[3]) * 0.75);
    gr.addColorStop(0, shade(col, 0.32)); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, warm(col, 0.45));
    g.globalAlpha = 0.75; g.fillStyle = gr; g.fillRect(b[0] - 4, b[1] - 4, b[2] + 8, b[3] + 8);
    // vệt cọ
    g.globalAlpha = 0.12;
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? shade(col, 0.4) : shade(col, -0.25); g.beginPath(); g.ellipse(b[0] + Math.random() * b[2], b[1] + Math.random() * b[3], 4 + Math.random() * 10, 2 + Math.random() * 5, Math.random() * 3, 0, 7); g.fill(); }
    g.restore();
    if (o.line !== false) { path(); g.lineWidth = o.lw || 2.4; g.strokeStyle = o.lc || 'rgba(70,45,32,.85)'; g.lineJoin = 'round'; g.stroke(); }
  }
  const E = (g, x, y, rx, ry, rot) => () => { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); };
  function RR(g, x, y, w, h, r) { return () => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }; }

  // ---------- NGƯỜI ----------
  // dir: 'down' (mặt trước) | 'up' (lưng) | 'side' (nghiêng sang phải; bên trái thì lật ảnh)
  P.human = function (look, dir, frame) {
    const L = look || {};
    const d = dir === 'left' || dir === 'right' ? 'side' : dir === 'up' ? 'up' : 'down';
    const key = JSON.stringify(L) + d + frame + (dir === 'left' ? 'L' : '');
    if (cache[key]) return cache[key];
    const c = document.createElement('canvas'); c.width = HW; c.height = HH;
    const g = c.getContext('2d');
    const gear = L.g || {};
    const skin = L.skin || '#ffe0bd', top = L.top || '#4fc3f7', bot = L.bottom || '#1565c0', hair = L.hairC || '#3e2723';
    const step = [0, 1, 0, -1][frame % 4], bob = [0, -3, 0, -3][frame % 4];
    const cx = 80, headY = 74 + bob, bodyTop = 112 + bob;
    const side = d === 'side', back = d === 'up';
    // --- áo choàng phía sau ---
    if (L.cape && !side) wash(g, () => { g.beginPath(); g.moveTo(cx - 30, bodyTop + 2); g.quadraticCurveTo(cx, bodyTop - 6, cx + 30, bodyTop + 2); g.lineTo(cx + 40, 206 + bob); g.quadraticCurveTo(cx, 214 + bob, cx - 40, 206 + bob); g.closePath(); }, L.cape, { box: [cx - 40, bodyTop, 80, 100] });
    if (L.cape && side) wash(g, () => { g.beginPath(); g.moveTo(cx - 8, bodyTop); g.quadraticCurveTo(cx - 40, 160 + bob, cx - 34 - step * 3, 204 + bob); g.lineTo(cx - 4, 200 + bob); g.closePath(); }, L.cape, { box: [cx - 40, bodyTop, 40, 100] });
    // --- tóc dài phía sau ---
    if ((L.hair === 'long' || L.hair === 'twin') && !back) wash(g, () => { g.beginPath(); g.moveTo(cx - 42, headY); g.quadraticCurveTo(cx - 48, headY + 70, cx - 30, headY + 82); g.lineTo(cx + 30, headY + 82); g.quadraticCurveTo(cx + 48, headY + 70, cx + 42, headY); g.closePath(); }, hair, { box: [cx - 48, headY, 96, 82] });
    // --- chân & giày ---
    const shoe = gear.boots || '#6d4c41';
    const legs = side ? [[cx - 6 + step * 9, 0], [cx + 6 - step * 9, 1]] : [[cx - 13, step * 4], [cx + 13, -step * 4]];
    legs.forEach((l, i) => {
      const lx = l[0], lift = side ? 0 : Math.max(0, l[1]);
      wash(g, RR(g, lx - 8, 186 + bob - lift, 16, 34, 7), side && i === 0 ? shade(bot, -0.12) : bot, { box: [lx - 8, 186, 16, 34] });
      wash(g, E(g, lx + (side ? 5 : 0), 222 - lift + (bob ? 0 : 0), side ? 15 : 12, 8), shoe, { box: [lx - 15, 214, 30, 16] });
    });
    // --- tay sau (khi nghiêng) ---
    const armSwing = step * 10;
    if (side) wash(g, RR(g, cx - 8 - armSwing * 0.6, bodyTop + 10, 14, 44, 7), shade(top, -0.15), { box: [cx - 8, bodyTop, 14, 44] });
    // --- thân áo ---
    const tw = side ? 46 : 62;
    wash(g, () => { g.beginPath(); g.moveTo(cx - tw / 2 + 4, bodyTop); g.quadraticCurveTo(cx, bodyTop - 8, cx + tw / 2 - 4, bodyTop); g.quadraticCurveTo(cx + tw / 2 + 8, bodyTop + 50, cx + tw / 2 + 10, 192 + bob); g.quadraticCurveTo(cx, 198 + bob, cx - tw / 2 - 10, 192 + bob); g.quadraticCurveTo(cx - tw / 2 - 8, bodyTop + 50, cx - tw / 2 + 4, bodyTop); g.closePath(); }, top, { box: [cx - tw / 2 - 10, bodyTop, tw + 20, 86] });
    // váy/quần phần dưới (màu bottom) dạng viền gấu
    wash(g, () => { g.beginPath(); g.moveTo(cx - tw / 2 - 9, 182 + bob); g.quadraticCurveTo(cx, 188 + bob, cx + tw / 2 + 9, 182 + bob); g.lineTo(cx + tw / 2 + 10, 194 + bob); g.quadraticCurveTo(cx, 201 + bob, cx - tw / 2 - 10, 194 + bob); g.closePath(); }, bot, { box: [cx - 40, 182, 80, 20] });
    if (L.apron && !back) wash(g, RR(g, cx - 20, bodyTop + 18, 40, 58, 10), L.apron, { box: [cx - 20, bodyTop + 18, 40, 58] });
    if (gear.armor) wash(g, () => { g.beginPath(); g.moveTo(cx - tw / 2 + 2, bodyTop + 4); g.quadraticCurveTo(cx, bodyTop - 4, cx + tw / 2 - 2, bodyTop + 4); g.lineTo(cx + tw / 2, bodyTop + 44); g.quadraticCurveTo(cx, bodyTop + 54, cx - tw / 2, bodyTop + 44); g.closePath(); }, gear.armor, { box: [cx - 32, bodyTop, 64, 54] });
    if (L.collar && !back) wash(g, () => { g.beginPath(); g.moveTo(cx - 24, bodyTop + 2); g.lineTo(cx, bodyTop + 22); g.lineTo(cx + 24, bodyTop + 2); g.quadraticCurveTo(cx, bodyTop + 8, cx - 24, bodyTop + 2); }, L.collar, { box: [cx - 24, bodyTop, 48, 22] });
    // khuy áo / đường viền
    if (!back && !side) { g.strokeStyle = 'rgba(70,45,32,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx, bodyTop + 12); g.lineTo(cx, 180 + bob); g.stroke(); }
    if (gear.neck && !back) { g.strokeStyle = gear.neck; g.lineWidth = 3; g.beginPath(); g.arc(cx, bodyTop + 2, 16, 0.3, Math.PI - 0.3); g.stroke(); wash(g, E(g, cx, bodyTop + 18, 5, 6), gear.neck, { box: [cx - 5, bodyTop + 12, 10, 12], lw: 1.5 }); }
    // --- tay trước ---
    const hand = gear.glove || skin;
    if (side) {
      wash(g, RR(g, cx - 6 + armSwing * 0.6, bodyTop + 10, 14, 44, 7), top, { box: [cx - 6, bodyTop, 14, 44] });
      wash(g, E(g, cx + 1 + armSwing * 0.6, bodyTop + 56, 8, 8), hand, { box: [cx - 8, bodyTop + 48, 18, 18], lw: 2 });
    } else {
      [[-1, armSwing], [1, -armSwing]].forEach(a => {
        const ax = cx + a[0] * (tw / 2 + 3);
        g.save(); g.translate(ax, bodyTop + 8); g.rotate(a[0] * 0.12 + (back ? -1 : 1) * a[1] * 0.012);
        wash(g, RR(g, -7, 0, 14, 44, 7), shade(top, -0.05), { box: [-7, 0, 14, 44] });
        wash(g, E(g, 0, 48, 8, 8), hand, { box: [-8, 40, 16, 16], lw: 2 });
        if (gear.wand && a[0] === 1 && !back) { g.strokeStyle = '#6d4c41'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 50); g.lineTo(14, 14); g.stroke(); g.fillStyle = gear.wand; g.shadowColor = gear.wand; g.shadowBlur = 10; g.beginPath(); g.arc(15, 11, 5, 0, 7); g.fill(); g.shadowBlur = 0; }
        g.restore();
      });
    }
    // --- đầu ---
    const hx = side ? cx + 4 : cx;
    wash(g, E(g, hx, headY, 41, 39), skin, { box: [hx - 41, headY - 39, 82, 78] });
    // tai
    if (!back && !side) [-1, 1].forEach(s => wash(g, E(g, hx + s * 40, headY + 6, 7, 10), skin, { box: [hx + s * 40 - 7, headY - 4, 14, 20], lw: 2 }));
    if (side) wash(g, E(g, hx - 10, headY + 6, 7, 10), skin, { box: [hx - 17, headY - 4, 14, 20], lw: 2 });
    // mặt
    if (!back) {
      const eyes = side ? [hx + 22] : [hx - 15, hx + 15];
      eyes.forEach(ex => {
        g.fillStyle = '#2b1c14'; g.beginPath(); g.ellipse(ex, headY + 6, 5.5, 8, 0, 0, 7); g.fill();
        g.fillStyle = '#5b3a29'; g.beginPath(); g.ellipse(ex, headY + 9, 4, 4.5, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + 1.8, headY + 2.5, 2.2, 0, 7); g.fill();
        g.strokeStyle = 'rgba(60,35,25,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(ex, headY + 2, 8, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); // mi mắt
      });
      g.fillStyle = 'rgba(255,120,120,.38)';
      (side ? [hx + 18] : [hx - 24, hx + 24]).forEach(bx => { g.beginPath(); g.ellipse(bx, headY + 19, 8, 4.5, 0, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(110,55,40,.85)'; g.lineWidth = 2;
      g.beginPath(); if (side) g.arc(hx + 30, headY + 22, 4, 0.2, 1.4); else g.arc(hx, headY + 21, 5, 0.25, Math.PI - 0.25); g.stroke();
      if (side) { g.strokeStyle = 'rgba(70,45,32,.6)'; g.beginPath(); g.moveTo(hx + 38, headY + 8); g.quadraticCurveTo(hx + 44, headY + 13, hx + 38, headY + 15); g.stroke(); }
      if (L.glasses) { g.strokeStyle = '#37474f'; g.lineWidth = 2.5; eyes.forEach(ex => { g.beginPath(); g.arc(ex, headY + 6, 10, 0, 7); g.stroke(); }); if (!side) { g.beginPath(); g.moveTo(hx - 5, headY + 6); g.lineTo(hx + 5, headY + 6); g.stroke(); } }
    }
    if (L.beard) wash(g, () => { g.beginPath(); g.moveTo(hx - 30, headY + 14); g.quadraticCurveTo(hx, headY + 70, hx + 30, headY + 14); g.quadraticCurveTo(hx, headY + 30, hx - 30, headY + 14); }, L.beard, { box: [hx - 30, headY + 14, 60, 44] });
    // --- tóc ---
    if (L.hair !== 'bald') {
      if (back) wash(g, E(g, hx, headY - 2, 43, 41), hair, { box: [hx - 43, headY - 43, 86, 84] });
      else wash(g, () => {
        g.beginPath();
        g.moveTo(hx - 44, headY + 6);
        g.quadraticCurveTo(hx - 50, headY - 46, hx, headY - 46);
        g.quadraticCurveTo(hx + 50, headY - 46, hx + 44, headY + 6);
        // mái tóc lởm chởm kiểu Ghibli
        const n = 5;
        for (let i = n; i >= 0; i--) { const x = hx - 38 + i * 76 / n; g.lineTo(x + 7, headY - 14 + (i % 2) * 6); g.lineTo(x, headY - 6 - (i % 2) * 4); }
        g.closePath();
      }, hair, { box: [hx - 50, headY - 46, 100, 56] });
      // ánh sáng trên tóc
      g.strokeStyle = shade(hair, 0.45); g.globalAlpha = 0.6; g.lineWidth = 3; g.beginPath(); g.arc(hx - 6, headY - 14, 26, Math.PI * 1.2, Math.PI * 1.5); g.stroke(); g.globalAlpha = 1;
      if (L.hair === 'pony') wash(g, () => { g.beginPath(); g.ellipse(side ? hx - 40 : hx + 38, headY + 10 + (back ? 6 : 0), 12, 26, side ? 0.5 : -0.3, 0, 7); }, hair, { box: [hx + 20, headY - 16, 36, 54] });
      if (L.hair === 'bun') wash(g, E(g, hx, headY - 46, 16, 14), hair, { box: [hx - 16, headY - 60, 32, 28] });
      if (L.hair === 'twin') [-1, 1].forEach(s => wash(g, E(g, hx + s * 46, headY + 22, 11, 22, s * 0.2), hair, { box: [hx + s * 46 - 11, headY, 22, 44] }));
      if (L.hair === 'long' && back) wash(g, RR(g, hx - 40, headY, 80, 70, 24), hair, { box: [hx - 40, headY, 80, 70] });
    } else {
      wash(g, () => { g.beginPath(); g.ellipse(hx, headY + 4, 44, 26, 0, 0.1, Math.PI - 0.1, true); }, L.hairC || '#e0e0e0', { box: [hx - 44, headY - 22, 88, 30], line: false });
    }
    // --- mũ, vương miện ---
    const hat = L.wizard ? 'wiz' : gear.hat === 'h2' ? 'wiz2' : null;
    if (hat) {
      const hc = hat === 'wiz' ? (L.hat || '#3949ab') : '#5e35b1';
      wash(g, E(g, hx, headY - 34, 54, 11), shade(hc, -0.1), { box: [hx - 54, headY - 45, 108, 22] });
      wash(g, () => { g.beginPath(); g.moveTo(hx - 30, headY - 36); g.quadraticCurveTo(hx - 6, headY - 70, hx + 18, headY - 110); g.quadraticCurveTo(hx + 10, headY - 64, hx + 30, headY - 36); g.closePath(); }, hc, { box: [hx - 30, headY - 110, 60, 76] });
      g.fillStyle = '#ffd54f'; g.beginPath(); g.arc(hx + 2, headY - 58, 4, 0, 7); g.fill();
    } else if (L.hat) {
      wash(g, E(g, hx, headY - 34, 52, 11), L.hat, { box: [hx - 52, headY - 45, 104, 22] });
      wash(g, RR(g, hx - 28, headY - 66, 56, 34, 14), L.hat, { box: [hx - 28, headY - 66, 56, 34] });
    }
    if (L.helmet) wash(g, () => { g.beginPath(); g.ellipse(hx, headY - 14, 46, 36, 0, Math.PI, 0); g.closePath(); }, L.helmet, { box: [hx - 46, headY - 50, 92, 40] });
    const crownCol = L.crown ? '#ffd54f' : (gear.hat && gear.hat !== 'h1' && gear.hat !== 'h2' ? (gear.hatC || '#ffd54f') : null);
    if (crownCol) {
      wash(g, () => { g.beginPath(); g.moveTo(hx - 24, headY - 36); g.lineTo(hx - 26, headY - 58); g.lineTo(hx - 13, headY - 46); g.lineTo(hx, headY - 64); g.lineTo(hx + 13, headY - 46); g.lineTo(hx + 26, headY - 58); g.lineTo(hx + 24, headY - 36); g.closePath(); }, crownCol, { box: [hx - 26, headY - 64, 52, 28] });
      g.fillStyle = '#e53935'; g.beginPath(); g.arc(hx, headY - 44, 3.5, 0, 7); g.fill();
    }
    if (L.bow || gear.hat === 'h1') { const bc = L.bow || '#ff80ab'; [-1, 1].forEach(s => wash(g, E(g, hx + 26 + s * 10, headY - 36, 10, 7, s * 0.4), bc, { box: [hx + 10, headY - 44, 34, 16], lw: 1.8 })); }
    paper(g);
    if (d === 'side' && dir === 'left') { const f = document.createElement('canvas'); f.width = HW; f.height = HH; const q = f.getContext('2d'); q.translate(HW, 0); q.scale(-1, 1); q.drawImage(c, 0, 0); return (cache[key] = f); }
    return (cache[key] = c);
  };
  // vân giấy nhẹ cho cảm giác tranh vẽ tay
  function paper(g) {
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.07;
    for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#5d4037'; g.fillRect(Math.random() * g.canvas.width, Math.random() * g.canvas.height, 1.5, 1.5); }
    g.restore();
  }

  // ---------- QUÁI VẬT ----------
  P.monster = function (def, color, frame) {
    const col = color || def.color || '#66bb6a', kind = def.draw || 'slime';
    const key = 'm' + kind + col + (def.crown ? 'c' : '') + frame;
    if (cache[key]) return cache[key];
    const S = 200, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const f = frame % 4, sq = [0, 0.08, 0.14, 0.08][f], up = [0, 6, 2, 6][f];
    const eyes = (x, y, s, gap) => [-1, 1].forEach(k => {
      wash(g, E(g, x + k * gap, y, 11 * s, 13 * s), '#ffffff', { box: [x + k * gap - 11, y - 13, 22, 26], lw: 2 });
      g.fillStyle = '#2b1c14'; g.beginPath(); g.ellipse(x + k * gap + 2, y + 2, 6 * s, 8 * s, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x + k * gap + 4, y - 2, 2.4 * s, 0, 7); g.fill();
    });
    if (kind === 'fluff') {
      const cy = 112 - up;
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; wash(g, E(g, 100 + Math.cos(a) * 52, cy + Math.sin(a) * 46, 22, 22), shade(col, -0.05 + (i % 3) * 0.07), { box: [60, cy - 70, 80, 120], lw: 2 }); }
      wash(g, E(g, 100, cy, 56, 50), col, { box: [44, cy - 50, 112, 100] });
      eyes(100, cy - 4, 1, 20);
      g.fillStyle = 'rgba(255,120,140,.4)'; [-1, 1].forEach(k => { g.beginPath(); g.ellipse(100 + k * 36, cy + 16, 9, 5, 0, 0, 7); g.fill(); });
    } else if (kind === 'mush') {
      wash(g, RR(g, 74, 112 - up, 52, 80 + up, 22), '#f6ead2', { box: [74, 112, 52, 80] });
      eyes(100, 146 - up, 0.85, 14);
      wash(g, () => { g.beginPath(); g.moveTo(26, 124 - up); g.quadraticCurveTo(30, 40 - up, 100, 38 - up); g.quadraticCurveTo(170, 40 - up, 174, 124 - up); g.quadraticCurveTo(100, 138 - up, 26, 124 - up); g.closePath(); }, col, { box: [26, 38, 148, 100] });
      [[66, 76], [104, 60], [138, 86], [92, 102]].forEach(p => wash(g, E(g, p[0], p[1] - up, 11, 8), '#fffaf0', { box: [p[0] - 11, p[1] - 8, 22, 16], lw: 1.5 }));
    } else if (kind === 'star') {
      const cy = 104 - up;
      wash(g, () => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 34 : 78; g.lineTo(100 + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); }, col, { box: [22, cy - 78, 156, 150] });
      g.save(); g.globalAlpha = 0.35; g.fillStyle = '#fffde7'; g.beginPath(); g.arc(88, cy - 14, 16, 0, 7); g.fill(); g.restore();
      eyes(100, cy + 4, 0.8, 15);
    } else if (kind === 'golem') {
      const cy = 118 - up * 0.5;
      [[-58, 18], [58, 18]].forEach(a => wash(g, RR(g, 100 + a[0] - 20, cy - 10, 40, 64, 16), shade(col, -0.12), { box: [100 + a[0] - 20, cy - 10, 40, 64] }));
      wash(g, () => { g.beginPath(); g.moveTo(52, 186); g.lineTo(40, cy - 20); g.lineTo(70, cy - 70); g.lineTo(130, cy - 76); g.lineTo(162, cy - 22); g.lineTo(150, 186); g.closePath(); }, col, { box: [40, cy - 76, 122, 140] });
      g.strokeStyle = 'rgba(60,45,40,.35)'; g.lineWidth = 2; [[70, cy - 30, 90, cy - 10], [120, cy + 20, 140, cy + 40], [80, cy + 40, 96, cy + 30]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
      wash(g, E(g, 100, cy - 26, 22, 22), '#ffffff', { box: [78, cy - 48, 44, 44] });
      g.fillStyle = '#c62828'; g.beginPath(); g.arc(102, cy - 24, 10, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(106, cy - 29, 3, 0, 7); g.fill();
    } else { // slime
      const w = 72 * (1 + sq), h = 60 * (1 - sq), cy = 190 - h - up;
      g.save(); g.globalAlpha = 0.95;
      wash(g, () => { g.beginPath(); g.moveTo(100 - w, 190 - up); g.quadraticCurveTo(100 - w, cy - 20, 100, cy - 26); g.quadraticCurveTo(100 + w, cy - 20, 100 + w, 190 - up); g.quadraticCurveTo(100, 196 - up, 100 - w, 190 - up); g.closePath(); }, col, { box: [100 - w, cy - 26, w * 2, h + 30] });
      g.restore();
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(100 - w * 0.45, cy + 4, 10, 16, 0.5, 0, 7); g.fill();
      eyes(100, cy + h * 0.45, 1, 20);
      g.strokeStyle = 'rgba(70,45,32,.8)'; g.lineWidth = 2.4; g.beginPath(); g.arc(100, cy + h * 0.45 + 16, 7, 0.3, Math.PI - 0.3); g.stroke();
    }
    if (def.crown) {
      const top = kind === 'mush' ? 30 : kind === 'golem' ? 26 : kind === 'star' ? 14 : 190 - 60 - 40 - up;
      wash(g, () => { g.beginPath(); g.moveTo(74, top + 22); g.lineTo(70, top - 4); g.lineTo(86, top + 8); g.lineTo(100, top - 12); g.lineTo(114, top + 8); g.lineTo(130, top - 4); g.lineTo(126, top + 22); g.closePath(); }, '#ffd54f', { box: [70, top - 12, 60, 34] });
      g.fillStyle = '#e53935'; g.beginPath(); g.arc(100, top + 10, 4, 0, 7); g.fill();
    }
    paper(g);
    return (cache[key] = c);
  };

  // ---------- ĐỘNG VẬT (NPC) ----------
  // owl 🦉 cú • bear 🐻 gấu đầu bếp • turtle 🐢 rùa thợ mộc • giraffe 🦒 bác sĩ • monkey 🐒 khỉ
  P.animalOf = { '🦉': 'owl', '🐻': 'bear', '🐢': 'turtle', '🦒': 'giraffe', '🐒': 'monkey' };
  P.animal = function (kind, frame) {
    const key = 'a' + kind + (frame || 0);
    if (cache[key]) return cache[key];
    const S = 200, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    const eye = (x, y, r) => { g.fillStyle = '#2b1c14'; g.beginPath(); g.ellipse(x, y, r, r * 1.25, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + r * 0.35, y - r * 0.4, r * 0.38, 0, 7); g.fill(); };
    const blush = (x, y) => { g.fillStyle = 'rgba(255,120,130,.38)'; g.beginPath(); g.ellipse(x, y, 9, 5, 0, 0, 7); g.fill(); };
    const smile = (x, y, w) => { g.strokeStyle = 'rgba(80,45,30,.85)'; g.lineWidth = 2.2; g.beginPath(); g.arc(x, y, w, 0.25, Math.PI - 0.25); g.stroke(); };
    const sway = Math.sin((frame || 0) * 1.5) * 1.5;
    if (kind === 'owl') {
      wash(g, E(g, 72, 190, 14, 7), '#f9a825', { box: [58, 183, 28, 14], lw: 2 }); wash(g, E(g, 128, 190, 14, 7), '#f9a825', { box: [114, 183, 28, 14], lw: 2 });
      [[-1, 0], [1, 0]].forEach(a => wash(g, () => { g.beginPath(); g.moveTo(100 + a[0] * 44, 96); g.quadraticCurveTo(100 + a[0] * 84, 130, 100 + a[0] * 60, 178); g.quadraticCurveTo(100 + a[0] * 40, 150, 100 + a[0] * 44, 96); }, '#6d4c41', { box: [30, 90, 140, 90] }));
      wash(g, () => { g.beginPath(); g.moveTo(52, 60); g.lineTo(60, 28); g.lineTo(80, 48); g.quadraticCurveTo(100, 40, 120, 48); g.lineTo(140, 28); g.lineTo(148, 60); g.quadraticCurveTo(160, 120, 140, 170); g.quadraticCurveTo(100, 196, 60, 170); g.quadraticCurveTo(40, 120, 52, 60); g.closePath(); }, '#8d6e63', { box: [40, 28, 120, 168] });
      wash(g, E(g, 100, 146, 32, 36), '#f3e2c0', { box: [68, 112, 64, 72], lw: 1.8 });
      for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(140,100,70,.5)'; g.lineWidth = 2; g.beginPath(); g.arc(100, 136 + i * 14, 12, 0.3, Math.PI - 0.3); g.stroke(); }
      [78, 122].forEach(x => { wash(g, E(g, x, 84, 22, 22), '#fff8e1', { box: [x - 22, 62, 44, 44] }); eye(x, 86, 9); });
      g.strokeStyle = '#37474f'; g.lineWidth = 3; [78, 122].forEach(x => { g.beginPath(); g.arc(x, 84, 25, 0, 7); g.stroke(); }); g.beginPath(); g.moveTo(103, 84); g.lineTo(97, 84); g.stroke();
      wash(g, () => { g.beginPath(); g.moveTo(92, 100); g.lineTo(108, 100); g.lineTo(100, 118); g.closePath(); }, '#ffa000', { box: [92, 100, 16, 18], lw: 2 });
      wash(g, E(g, 100, 34, 36, 7), '#212121', { box: [64, 27, 72, 14], lw: 1.5 }); wash(g, RR(g, 82, 14, 36, 20, 4), '#212121', { box: [82, 14, 36, 20], lw: 1.5 });
    } else if (kind === 'bear') {
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 24, 188, 17, 9), '#6d4c41', { box: [100 + s * 24 - 17, 180, 34, 18] }));
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 54, 134 + sway * s, 16, 30, s * 0.25), '#8d6e63', { box: [100 + s * 54 - 16, 106, 32, 60] }));
      wash(g, E(g, 100, 142, 50, 52), '#8d6e63', { box: [50, 90, 100, 104] });
      wash(g, E(g, 100, 150, 30, 34), '#d7b894', { box: [70, 116, 60, 68], lw: 1.6 });
      wash(g, RR(g, 70, 132, 60, 56, 14), '#fafafa', { box: [70, 132, 60, 56] }); g.strokeStyle = '#ef6c00'; g.lineWidth = 3; g.beginPath(); g.moveTo(80, 132); g.lineTo(80, 118); g.moveTo(120, 132); g.lineTo(120, 118); g.stroke();
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 36, 58, 15, 15), '#8d6e63', { box: [100 + s * 36 - 15, 43, 30, 30] }));
      wash(g, E(g, 100, 80, 42, 38), '#8d6e63', { box: [58, 42, 84, 76] });
      wash(g, E(g, 100, 94, 22, 17), '#d7b894', { box: [78, 77, 44, 34], lw: 1.6 });
      eye(84, 76, 4.5); eye(116, 76, 4.5); blush(70, 92); blush(130, 92);
      g.fillStyle = '#3e2723'; g.beginPath(); g.ellipse(100, 88, 7, 5, 0, 0, 7); g.fill(); smile(100, 92, 7);
      wash(g, E(g, 100, 44, 40, 11), '#ffffff', { box: [60, 33, 80, 22] }); wash(g, RR(g, 70, 4, 60, 40, 18), '#ffffff', { box: [70, 4, 60, 40] });
      [78, 100, 122].forEach(x => { g.strokeStyle = 'rgba(180,180,190,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, 14); g.lineTo(x, 36); g.stroke(); });
    } else if (kind === 'turtle') {
      [[-1, 0], [1, 0]].forEach(a => { wash(g, E(g, 100 + a[0] * 44, 184, 16, 10), '#8bc34a', { box: [100 + a[0] * 44 - 16, 174, 32, 20] }); });
      wash(g, E(g, 150, 118, 22, 20), '#8bc34a', { box: [128, 98, 44, 40] }); eye(156, 112, 3.6); smile(158, 124, 5);
      wash(g, () => { g.beginPath(); g.ellipse(94, 130, 66, 56, 0, Math.PI, 0); g.lineTo(160, 160); g.quadraticCurveTo(94, 176, 28, 160); g.closePath(); }, '#558b2f', { box: [28, 74, 132, 100] });
      g.strokeStyle = 'rgba(40,70,20,.55)'; g.lineWidth = 2.4;
      [[94, 78, 94, 150], [60, 92, 76, 150], [128, 92, 112, 150], [38, 126, 150, 126]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
      wash(g, E(g, 100, 78, 38, 9), '#fdd835', { box: [62, 70, 76, 18] }); wash(g, () => { g.beginPath(); g.ellipse(100, 76, 26, 24, 0, Math.PI, 0); g.closePath(); }, '#fdd835', { box: [74, 50, 52, 26] });
      wash(g, RR(g, 12, 100, 26, 6, 3), '#a1887f', { box: [12, 100, 26, 6], lw: 1.4 }); wash(g, RR(g, 30, 88, 8, 30, 2), '#9e9e9e', { box: [30, 88, 8, 30], lw: 1.4 });
    } else if (kind === 'giraffe') {
      [-1, 1].forEach(s => wash(g, RR(g, 100 + s * 18 - 10, 150, 20, 44, 8), '#fdd835', { box: [100 + s * 18 - 10, 150, 20, 44] }));
      wash(g, RR(g, 76, 76, 48, 90, 16), '#ffffff', { box: [76, 76, 48, 90] });
      wash(g, RR(g, 86, 30, 28, 70, 12), '#fdd835', { box: [86, 30, 28, 70] });
      [[92, 46], [106, 62], [94, 80]].forEach(p => wash(g, E(g, p[0], p[1], 5, 4), '#a1581f', { box: [p[0] - 5, p[1] - 4, 10, 8], line: false }));
      wash(g, E(g, 100, 22, 30, 22), '#fdd835', { box: [70, 0, 60, 44] });
      wash(g, E(g, 114, 30, 14, 10), '#ffe082', { box: [100, 20, 28, 20], lw: 1.6 });
      [-1, 1].forEach(s => { g.strokeStyle = '#6d4c41'; g.lineWidth = 3; g.beginPath(); g.moveTo(100 + s * 12, 4); g.lineTo(100 + s * 14, -4); g.stroke(); g.fillStyle = '#a1581f'; g.beginPath(); g.arc(100 + s * 14, -3, 4, 0, 7); g.fill(); });
      eye(90, 18, 4); eye(106, 18, 4); blush(84, 30); smile(114, 32, 4);
      g.strokeStyle = '#e53935'; g.lineWidth = 5; g.beginPath(); g.moveTo(100, 100); g.lineTo(100, 124); g.moveTo(88, 112); g.lineTo(112, 112); g.stroke();
      g.strokeStyle = '#37474f'; g.lineWidth = 3; g.beginPath(); g.arc(100, 90, 16, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = '#90a4ae'; g.beginPath(); g.arc(100, 106, 4, 0, 7); g.fill();
      wash(g, RR(g, 82, 2, 36, 12, 4), '#ffffff', { box: [82, 2, 36, 12] });
    } else { // monkey
      const tl = Math.sin((frame || 0) * 1.2) * 6;
      g.strokeStyle = 'rgba(70,45,32,.85)'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(140, 160); g.quadraticCurveTo(190 + tl, 150, 170 + tl, 100); g.quadraticCurveTo(160, 80, 176, 70); g.stroke();
      g.strokeStyle = '#8d6e63'; g.lineWidth = 8; g.beginPath(); g.moveTo(140, 160); g.quadraticCurveTo(190 + tl, 150, 170 + tl, 100); g.quadraticCurveTo(160, 80, 176, 70); g.stroke(); g.lineCap = 'butt';
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 24, 190, 17, 9), '#6d4c41', { box: [100 + s * 24 - 17, 182, 34, 18] }));
      wash(g, E(g, 100, 144, 40, 46), '#8d6e63', { box: [60, 98, 80, 92] }); wash(g, E(g, 100, 152, 24, 30), '#e8c9a0', { box: [76, 124, 48, 60], lw: 1.6 });
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 48, 140 + sway * s, 12, 34, s * 0.18), '#8d6e63', { box: [100 + s * 48 - 12, 106, 24, 68] }));
      [-1, 1].forEach(s => wash(g, E(g, 100 + s * 44, 66, 18, 18), '#e8c9a0', { box: [100 + s * 44 - 18, 48, 36, 36], lw: 2 }));
      wash(g, E(g, 100, 72, 42, 40), '#8d6e63', { box: [58, 32, 84, 80] });
      wash(g, () => { g.beginPath(); g.moveTo(100, 54); g.bezierCurveTo(60, 42, 54, 92, 76, 100); g.bezierCurveTo(88, 112, 112, 112, 124, 100); g.bezierCurveTo(146, 92, 140, 42, 100, 54); }, '#e8c9a0', { box: [60, 44, 80, 70], lw: 1.8 });
      eye(86, 76, 4.5); eye(114, 76, 4.5); blush(76, 92); blush(124, 92);
      g.fillStyle = '#6d4c41'; g.beginPath(); g.ellipse(100, 88, 4, 3, 0, 0, 7); g.fill(); smile(100, 94, 8);
      wash(g, E(g, 142, 120, 16, 7, -0.6), '#fdd835', { box: [126, 112, 32, 16], lw: 1.8 });
    }
    paper(g);
    return (cache[key] = c);
  };

  // ---------- PHÔNG NỀN TRẬN ĐẤU KIỂU TRANH VẼ ----------
  const BG = {
    village: ['#8fd0f7', '#d6f0ff', '#9ad16a', '#6fb04f', '#4f8f3a'], forest: ['#9fd8c7', '#d3efe0', '#6bb36f', '#4b9a57', '#2f7a43'],
    castle: ['#c3b1ea', '#efe3fb', '#a9a6d6', '#8f8cc0', '#6e6aa5'], wild: ['#ffd9a0', '#fff1d4', '#d4b46c', '#b8964f', '#8f7238']
  };
  P.battleBG = function (region) {
    const key = 'bg' + region; if (cache[key]) return cache[key];
    const W = 720, H = 210, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    const col = BG[region] || BG.village;
    const sk = g.createLinearGradient(0, 0, 0, H * 0.7); sk.addColorStop(0, col[0]); sk.addColorStop(1, col[1]); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    // tia nắng
    g.save(); g.globalAlpha = 0.12; g.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(120 + i * 150, 0); g.lineTo(170 + i * 150, 0); g.lineTo(60 + i * 150 + 80, H); g.lineTo(20 + i * 150 + 60, H); g.fill(); } g.restore();
    // đồi xa & gần
    const hill = (y, amp, col2, ph) => { g.fillStyle = col2; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 10) g.lineTo(x, y + Math.sin(x / 90 + ph) * amp + Math.sin(x / 33 + ph * 2) * amp * 0.3); g.lineTo(W, H); g.closePath(); g.fill(); };
    hill(118, 14, col[2], 0); hill(140, 12, col[3], 2); hill(166, 9, col[4], 4);
    // cây xa
    for (let i = 0; i < 16; i++) { const x = 20 + i * 46 + (i % 3) * 8, y = 128 + Math.sin(x / 90) * 8; g.fillStyle = col[3]; g.beginPath(); g.arc(x, y, 14 + (i % 4) * 3, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.arc(x - 4, y - 5, 8, 0, 7); g.fill(); }
    // cỏ & hoa phía trước
    for (let i = 0; i < 120; i++) { const x = Math.random() * W, y = 150 + Math.random() * 60; g.strokeStyle = shade(col[4], Math.random() * 0.5 - 0.2); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.random() * 4 - 2, y - 5 - Math.random() * 6); g.stroke(); }
    for (let i = 0; i < 26; i++) { g.fillStyle = ['#ffffff', '#ffe066', '#ff9ec7', '#c9a7ff'][i % 4]; g.beginPath(); g.arc(Math.random() * W, 160 + Math.random() * 45, 2.4, 0, 7); g.fill(); }
    // bóng đứng cho hai bên
    g.fillStyle = 'rgba(30,50,20,.25)'; g.beginPath(); g.ellipse(170, 184, 78, 11, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(540, 184, 100, 14, 0, 0, 7); g.fill();
    paper(g);
    return (cache[key] = c);
  };
  P.drawClouds = function (g, t) {
    g.save(); g.fillStyle = 'rgba(255,255,255,.85)';
    [[0.05, 34, 1], [0.38, 22, 0.8], [0.7, 48, 1.2]].forEach((q, i) => {
      const x = ((q[0] * 720 + t * (6 + i * 3)) % 860) - 70, y = q[1], s = q[2];
      g.beginPath(); g.arc(x, y, 14 * s, 0, 7); g.arc(x + 16 * s, y - 8 * s, 18 * s, 0, 7); g.arc(x + 36 * s, y, 14 * s, 0, 7); g.arc(x + 18 * s, y + 4 * s, 16 * s, 0, 7); g.fill();
    });
    g.restore();
  };
  P.on = () => !!(EQ.store && EQ.store.settings().gfx3d !== false);

  EQ.paint = P;
})();
