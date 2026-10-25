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

  EQ.paint = P;
})();
