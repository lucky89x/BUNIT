/* ENGLISH QUEST - Bản đồ các vùng đất
 * Bản đồ được dựng bằng các lệnh vẽ (rect, hline, house...) để dễ sửa, dễ thêm vùng mới.
 * Ký hiệu ô:
 *  . cỏ   , hoa   " cỏ cao   g cỏ rừng   = đường đất   s cát   b cầu gỗ   S sàn đá   c thảm đỏ   M nấm
 *  T cây  t cây thông  A cây táo  B bụi cây  ~ nước  R đá  F hàng rào  r mái nhà  h tường nhà  d cửa
 *  W tường lâu đài  w cửa sổ lâu đài  P cột đá  K giá sách  f bồn hoa
 * Thêm vùng mới: tạo EQ.REGIONS.<id> = { name, w, h, build(), entities: [...] } và cổng dịch chuyển tới nó.
 */
window.EQ = window.EQ || {};
(function () {
  EQ.TILE = 32;
  EQ.SOLID = new Set(['T', 't', 'A', 'B', '~', 'R', 'F', 'r', 'h', 'd', 'W', 'w', 'P', 'K', 'f']);

  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function Grid(w, h, ch) {
    this.w = w; this.h = h;
    this.t = [];
    for (let y = 0; y < h; y++) { this.t.push(new Array(w).fill(ch)); }
  }
  Grid.prototype.in = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };
  Grid.prototype.set = function (x, y, c) { if (this.in(x, y)) this.t[y][x] = c; return this; };
  Grid.prototype.get = function (x, y) { return this.in(x, y) ? this.t[y][x] : 'T'; };
  Grid.prototype.rect = function (x, y, w, h, c) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c);
    return this;
  };
  Grid.prototype.frame = function (x, y, w, h, c) {
    for (let i = x; i < x + w; i++) { this.set(i, y, c); this.set(i, y + h - 1, c); }
    for (let j = y; j < y + h; j++) { this.set(x, j, c); this.set(x + w - 1, j, c); }
    return this;
  };
  Grid.prototype.hline = function (x1, x2, y, c) { for (let i = x1; i <= x2; i++) this.set(i, y, c); return this; };
  Grid.prototype.vline = function (x, y1, y2, c) { for (let j = y1; j <= y2; j++) this.set(x, j, c); return this; };
  Grid.prototype.house = function (x, y, w) {
    this.rect(x, y, w, 2, 'r');
    this.hline(x, x + w - 1, y + 2, 'h');
    this.set(x + Math.floor(w / 2), y + 2, 'd');
    return this;
  };
  // rải ngẫu nhiên (có hạt giống cố định) lên các ô thuộc "on", tránh vùng "avoid"
  Grid.prototype.scatter = function (c, n, seed, on, avoid) {
    const r = rng(seed);
    let placed = 0, tries = 0;
    while (placed < n && tries < n * 40) {
      tries++;
      const x = 1 + Math.floor(r() * (this.w - 2));
      const y = 1 + Math.floor(r() * (this.h - 2));
      if (on.indexOf(this.t[y][x]) < 0) continue;
      if (avoid && avoid(x, y)) continue;
      this.t[y][x] = c; placed++;
    }
    return this;
  };
  Grid.prototype.rows = function () { return this.t.map(r => r.join('')); };

  function nearEntities(entities, d) {
    return function (x, y) {
      for (const e of entities) {
        if (Math.abs(e.x - x) <= d && Math.abs(e.y - y) <= d) return true;
      }
      return false;
    };
  }
  function nearRow(y0, d) { return function (x, y) { return Math.abs(y - y0) <= d; }; }
  function any() { const fs = arguments; return function (x, y) { for (const f of fs) if (f(x, y)) return true; return false; }; }

  // ---------- Ngoại hình NPC (người) ----------
  const LOOK = {
    chief: { hair: 'bald', hairC: '#e0e0e0', skin: '#f1c27d', top: '#6d4c41', bottom: '#3e2723', beard: '#eeeeee' },
    rose: { hair: 'bun', hairC: '#cfd8dc', skin: '#f5d0a9', top: '#ad1457', bottom: '#6a1b9a' },
    lily: { hair: 'pony', hairC: '#ffb300', skin: '#ffe0bd', top: '#ec407a', bottom: '#f8bbd0' },
    minh: { hair: 'short', hairC: '#212121', skin: '#e8b98a', top: '#1e88e5', bottom: '#263238' },
    ben: { hair: 'short', hairC: '#5d4037', skin: '#d7a77a', top: '#fafafa', bottom: '#5d4037', apron: '#ef6c00' },
    sam: { hair: 'short', hairC: '#8d6e63', skin: '#c68642', top: '#00838f', bottom: '#37474f', hat: '#ffca28' },
    anna: { hair: 'long', hairC: '#6d4c41', skin: '#ffe0bd', top: '#43a047', bottom: '#2e7d32' },
    guard: { hair: 'short', hairC: '#3e2723', skin: '#f1c27d', top: '#c62828', bottom: '#212121', helmet: '#90a4ae' },
    page: { hair: 'bun', hairC: '#4e342e', skin: '#ffe0bd', top: '#5e35b1', bottom: '#311b92', glasses: true },
    mia: { hair: 'long', hairC: '#fdd835', skin: '#ffe0bd', top: '#f48fb1', bottom: '#f06292', crown: true },
    sage: { hair: 'long', hairC: '#ffffff', skin: '#f5d0a9', top: '#283593', bottom: '#1a237e', beard: '#ffffff', hat: '#3949ab', wizard: true }
  };
  EQ.LOOK = LOOK;

  EQ.REGIONS = {};

  // =================== VÙNG 1: LÀNG KHỞI ĐẦU ===================
  EQ.REGIONS.village = {
    id: 'village', name: 'Làng Khởi Đầu', en: 'Starter Village', w: 40, h: 28, ground: '.', music: 'village',
    spawn: { x: 20, y: 16 },
    entities: [
      { id: 'chief', kind: 'npc', name: 'Trưởng làng Tom', x: 22, y: 6, look: LOOK.chief,
        idle: [{ en: 'Hello, {name}!', vi: 'Chào cháu, {name}!' }, { en: 'Our village is small but happy.', vi: 'Làng của chúng ta nhỏ nhưng vui vẻ.' }] },
      { id: 'rose', kind: 'npc', name: 'Bà Rose', x: 6, y: 7, look: LOOK.rose,
        idle: [{ en: 'I like red apples.', vi: 'Bà thích táo đỏ.' }, { en: 'Thank you, dear!', vi: 'Cảm ơn cháu yêu!' }] },
      { id: 'lily', kind: 'npc', name: 'Lily', x: 13, y: 7, look: LOOK.lily,
        idle: [{ en: 'Hi! You are my friend!', vi: 'Chào bạn! Bạn là bạn của mình!' }, { en: 'My cat is black.', vi: 'Mèo của mình màu đen.' }] },
      { id: 'minh', kind: 'npc', name: 'Minh', x: 16, y: 13, look: LOOK.minh,
        idle: [{ en: 'Hello! I am Minh.', vi: 'Xin chào! Mình là Minh.' }, { en: 'I like bread and eggs.', vi: 'Mình thích bánh mì và trứng.' }] },
      { id: 'ben', kind: 'npc', name: 'Chú Ben (bán hàng)', x: 8, y: 9, look: LOOK.ben, shop: true,
        idle: [{ en: 'Welcome to my shop!', vi: 'Chào mừng đến cửa hàng của chú!' }] },
      { id: 'sam', kind: 'npc', name: 'Bác Sam (ngư dân)', x: 12, y: 19, look: LOOK.sam,
        idle: [{ en: 'I like fish!', vi: 'Bác thích cá!' }, { en: 'The water is blue.', vi: 'Nước màu xanh dương.' }] },
      { id: 'sage_v', kind: 'npc', name: 'Nhà hiền triết Sao', x: 37, y: 7, look: LOOK.sage, sage: true,
        idle: [{ en: 'Practice makes perfect.', vi: 'Có công mài sắt, có ngày nên kim.' }] },
      { id: 'gs_teacher', kind: 'npc', name: 'Cô giáo Hoa (học theo sách)', x: 24, y: 11, book: true,
        look: { hair: 'long', hairC: '#212121', skin: '#f5d0a9', top: '#00897b', bottom: '#004d40', glasses: true, dress: true },
        idle: [{ en: 'Let\'s learn the words from your school book!', vi: 'Cùng học từ trong sách giáo khoa của em nào!' }] },
      { id: 'book_board', kind: 'deco', draw: 'board', x: 25, y: 10, solid: true },
      { id: 'jeweler', kind: 'npc', name: 'Cô Ngọc (tiệm trang sức)', x: 4, y: 11, jeweler: true,
        look: { hair: 'bun', hairC: '#212121', skin: '#f5d0a9', top: '#8e24aa', bottom: '#4a148c', dress: true, g: { neck: '#ffeb3b', hat: 'h3', hatC: '#e0e0e0' } },
        idle: [{ en: 'Shiny rings, pretty necklaces!', vi: 'Nhẫn lấp lánh, dây chuyền xinh xắn đây!' }] },
      { id: 'jewel_stall', kind: 'deco', draw: 'jewelstall', x: 3, y: 10, solid: true },
      { id: 'board_v', kind: 'npc', name: 'Bảng nhiệm vụ', x: 13, y: 12, draw: 'jobboard', jobs: true, e: '📋' },
      { id: 'tower', kind: 'npc', name: 'Tháp Thử Thách', x: 28, y: 11, draw: 'tower', tower: true, e: '🗼' },
      { id: 'lamp_v1', kind: 'deco', draw: 'lamp', x: 10, y: 13, solid: true },
      { id: 'lamp_v2', kind: 'deco', draw: 'lamp', x: 26, y: 13, solid: true },
      { id: 'barrel_v', kind: 'deco', draw: 'barrel', x: 2, y: 10, solid: true },
      { id: 'crate_v', kind: 'deco', draw: 'crate', x: 2, y: 12, solid: true },
      { id: 'stall1', kind: 'deco', draw: 'stall', x: 6, y: 9, e: '🍎', solid: true },
      { id: 'stall2', kind: 'deco', draw: 'stall', x: 10, y: 9, e: '🥚', solid: true },
      { id: 'well', kind: 'deco', draw: 'well', x: 18, y: 10, solid: true },
      { id: 'sign_v', kind: 'sign', x: 22, y: 15, en: 'Welcome to Starter Village!', vi: 'Chào mừng đến Làng Khởi Đầu!' },
      { id: 'sign_v2', kind: 'sign', x: 31, y: 13, en: 'East gate: Magic Forest', vi: 'Cổng phía đông: Rừng Phép Thuật' },
      // Nhiệm vụ: táo đỏ
      { id: 'apR1', kind: 'pickup', x: 25, y: 19, e: '🍎', quest: 'v_apples', good: true, label: 'red apple' },
      { id: 'apR2', kind: 'pickup', x: 29, y: 22, e: '🍎', quest: 'v_apples', good: true, label: 'red apple' },
      { id: 'apR3', kind: 'pickup', x: 26, y: 25, e: '🍎', quest: 'v_apples', good: true, label: 'red apple' },
      { id: 'apG1', kind: 'pickup', x: 28, y: 19, e: '🍏', quest: 'v_apples', label: 'green apple', wrong: { en: 'This apple is green.', vi: 'Quả táo này màu xanh lá (green). Bà Rose cần táo màu đỏ (red).' } },
      { id: 'apG2', kind: 'pickup', x: 25, y: 22, e: '🍏', quest: 'v_apples', label: 'green apple', wrong: { en: 'This apple is green.', vi: 'Quả táo này màu xanh lá (green). Bà Rose cần táo màu đỏ (red).' } },
      { id: 'apY1', kind: 'pickup', x: 23, y: 23, e: '🍋', quest: 'v_apples', label: 'yellow lemon', wrong: { en: 'This is a lemon. It is yellow.', vi: 'Đây là quả chanh vàng (yellow), không phải táo đỏ.' } },
      // Nhiệm vụ: mèo của Lily
      { id: 'catB', kind: 'pickup', x: 35, y: 22, e: '🐈', tint: 'black', quest: 'v_cat', good: true, label: 'black cat' },
      { id: 'catW', kind: 'pickup', x: 15, y: 9, e: '🐈', tint: 'white', quest: 'v_cat', label: 'white cat', wrong: { en: 'This cat is white. It is not Lily\'s cat.', vi: 'Con mèo này màu trắng (white). Mèo của Lily màu đen (black).' } },
      { id: 'catO', kind: 'pickup', x: 33, y: 9, e: '🐈', tint: 'orange', quest: 'v_cat', label: 'orange cat', wrong: { en: 'This cat is orange. It is not Lily\'s cat.', vi: 'Con mèo này màu cam (orange). Mèo của Lily màu đen (black).' } },
      // Cổng nhà kho & rương đũa phép
      { id: 'storeGate', kind: 'gate', style: 'fence', x: 30, y: 8, quest: 'v_gate', lesson: 'tobe', n: 3,
        title: 'Cánh cổng phép thuật', en: 'Complete the sentences to open the gate.', vi: 'Hoàn thành các câu để mở cổng.' },
      { id: 'wandChest', kind: 'chest', x: 32, y: 7, quest: 'v_gate', reward: { items: { wand: 1 } }, msg: 'Bạn tìm thấy Đũa phép Ngôn ngữ! 🪄' },
      // Rương kho báu bên hồ (nghe và chọn hình)
      { id: 'pondChest', kind: 'chest', x: 12, y: 23, quest: 'v_treasure', puzzle: 'listen', words: ['key', 'box', 'ball', 'book', 'bag', 'hat', 'cup', 'umbrella'],
        reward: { gold: 30, items: { hint: 2 } }, msg: 'Kho báu! +30 vàng và 2 Cuộn gợi ý 📜' },
      // Khu vực bí mật
      { id: 'secretV', kind: 'chest', x: 37, y: 2, secret: true, reward: { gold: 20, items: { pie: 1 } }, msg: 'Bạn tìm ra khu vườn bí mật! +20 vàng, 1 Bánh táo 🥧' },
      // Trùm & cổng sang rừng
      { id: 'slimeKing', kind: 'boss', x: 36, y: 14, name: 'Vua Slime Ục Ịch', boss: 'slimeKing' },
      { id: 'toForest', kind: 'portal', x: 39, y: 14, to: 'forest', tx: 1, ty: 14, need: 'boss:slimeKing',
        lockedVi: 'Vua Slime đang chặn đường sang Rừng Phép Thuật!' }
    ],
    monsters: { kind: 'slime', need: 'item:wand', count: 3, zones: [[13, 16, 6, 9], [32, 19, 6, 6]] },
    build() {
      const g = new Grid(40, 28, '.');
      g.frame(0, 0, 40, 28, 'T');
      g.house(3, 2, 5); g.house(10, 2, 5); g.house(17, 2, 6);
      g.vline(5, 5, 6, '='); g.vline(12, 5, 6, '='); g.hline(5, 20, 6, '=');
      g.vline(20, 5, 25, '=');
      g.hline(2, 39, 14, '=');
      // sân nhà kho có hàng rào
      g.frame(27, 2, 8, 7, 'F');
      g.house(29, 3, 4);
      g.set(30, 8, '=');
      g.vline(30, 9, 13, '=');
      // hành lang phía đông
      g.rect(33, 11, 7, 3, 'T'); g.rect(33, 15, 7, 3, 'T');
      g.set(39, 14, '=');
      // khu chợ
      g.rect(3, 9, 9, 3, '='); g.vline(7, 12, 13, '=');
      // hồ nước
      g.frame(2, 17, 10, 8, 's'); g.rect(3, 18, 8, 6, '~');
      g.rect(5, 20, 2, 1, 'R');
      // vườn táo
      [[24, 18], [27, 18], [30, 18], [24, 21], [27, 21], [30, 21], [24, 24], [27, 24], [30, 24]].forEach(p => g.set(p[0], p[1], 'A'));
      // khu vườn bí mật góc trên bên phải
      g.rect(35, 1, 4, 5, 'T'); g.rect(36, 2, 2, 2, ','); g.set(36, 4, '.'); g.set(36, 5, '.');
      const ents = EQ.REGIONS.village.entities;
      const avoid = any(nearEntities(ents, 1), nearRow(14, 1), (x, y) => x === 20 || (x > 22 && x < 33 && y > 16));
      g.scatter(',', 40, 11, ['.'], avoid);
      g.scatter('"', 25, 12, ['.'], avoid);
      g.scatter('T', 14, 13, ['.'], any(avoid, (x, y) => y < 9 && x > 25));
      g.scatter('B', 8, 14, ['.'], any(avoid, (x, y) => y < 9 && x > 25));
      return g.rows();
    }
  };

  // =================== VÙNG 2: RỪNG PHÉP THUẬT ===================
  EQ.REGIONS.forest = {
    id: 'forest', name: 'Rừng Từ Vựng', en: 'Magic Forest', w: 40, h: 28, ground: 'g', music: 'forest',
    spawn: { x: 1, y: 14 },
    entities: [
      { id: 'anna', kind: 'npc', name: 'Anna', x: 8, y: 6, look: LOOK.anna,
        idle: [{ en: 'I love my family.', vi: 'Mình yêu gia đình của mình.' }] },
      { id: 'owl', kind: 'npc', name: 'Cô giáo Cú', x: 14, y: 8, e: '🦉',
        idle: [{ en: 'Good morning, student!', vi: 'Chào buổi sáng, học trò!' }] },
      { id: 'bear', kind: 'npc', name: 'Bác Gấu đầu bếp', x: 11, y: 20, e: '🐻',
        idle: [{ en: 'I like fish and bananas!', vi: 'Bác thích cá và chuối!' }] },
      { id: 'turtle', kind: 'npc', name: 'Ông Rùa thợ mộc', x: 18, y: 12, e: '🐢',
        idle: [{ en: 'The bridge is strong now.', vi: 'Cây cầu giờ đã chắc chắn rồi.' }] },
      { id: 'giraffe', kind: 'npc', name: 'Bác sĩ Hươu', x: 28, y: 6, e: '🦒',
        idle: [{ en: 'Brush your teeth every day!', vi: 'Hãy đánh răng mỗi ngày nhé!' }] },
      { id: 'momo', kind: 'npc', name: 'Khỉ con Momo', x: 31, y: 21, e: '🐒',
        idle: [{ en: 'I can climb trees!', vi: 'Tớ có thể trèo cây!' }] },
      { id: 'sage_f', kind: 'npc', name: 'Nhà hiền triết Sao', x: 25, y: 23, look: LOOK.sage, sage: true,
        idle: [{ en: 'Little by little, you learn a lot.', vi: 'Kiến tha lâu cũng đầy tổ.' }] },
      { id: 'board', kind: 'deco', draw: 'board', x: 14, y: 4, solid: true },
      { id: 'desk1', kind: 'deco', draw: 'desk', x: 12, y: 6, solid: true },
      { id: 'desk2', kind: 'deco', draw: 'desk', x: 16, y: 6, solid: true },
      { id: 'pot', kind: 'deco', e: '🍲', x: 12, y: 21, solid: true },
      { id: 'board_f', kind: 'npc', name: 'Bảng nhiệm vụ', x: 9, y: 13, draw: 'jobboard', jobs: true, e: '📋' },
      { id: 'log_f', kind: 'deco', draw: 'log', x: 4, y: 16, solid: true },
      { id: 'lantern_f', kind: 'deco', draw: 'lamp', x: 23, y: 13, solid: true },
      { id: 'sign_f', kind: 'sign', x: 3, y: 13, en: 'Magic Forest', vi: 'Rừng Phép Thuật' },
      { id: 'sign_f2', kind: 'sign', x: 17, y: 15, en: 'Bridge', vi: 'Cây cầu' },
      // Nhiệm vụ bữa trưa của Gấu
      { id: 'ban1', kind: 'pickup', x: 4, y: 21, e: '🍌', quest: 'f_lunch', good: true, item: 'banana', label: 'banana' },
      { id: 'ban2', kind: 'pickup', x: 7, y: 25, e: '🍌', quest: 'f_lunch', good: true, item: 'banana', label: 'banana' },
      { id: 'ban3', kind: 'pickup', x: 15, y: 24, e: '🍌', quest: 'f_lunch', good: true, item: 'banana', label: 'banana' },
      { id: 'fish1', kind: 'pickup', x: 18, y: 22, e: '🐟', quest: 'f_lunch', good: true, item: 'fish', label: 'fish' },
      { id: 'car1', kind: 'pickup', x: 5, y: 18, e: '🥕', quest: 'f_lunch', label: 'carrot', wrong: { en: 'This is a carrot.', vi: 'Đây là củ cà rốt (carrot). Bác Gấu cần chuối (banana) và cá (fish).' } },
      { id: 'car2', kind: 'pickup', x: 14, y: 18, e: '🥕', quest: 'f_lunch', label: 'carrot', wrong: { en: 'This is a carrot.', vi: 'Đây là củ cà rốt (carrot). Bác Gấu cần chuối (banana) và cá (fish).' } },
      // Cây cầu
      { id: 'bridgeGate', kind: 'gate', style: 'bridge', x: 20, y: 14, quest: 'f_bridge', lesson: ['have', 'plural'], n: 4,
        title: 'Cây cầu phép thuật', en: 'Fix the bridge with the right words!', vi: 'Sửa cầu bằng những từ đúng!' },
      { id: 'secretF', kind: 'chest', x: 37, y: 3, secret: true, reward: { gold: 25, items: { hint: 1 } }, msg: 'Góc rừng bí mật! +25 vàng, 1 Cuộn gợi ý 📜' },
      { id: 'mushKing', kind: 'boss', x: 36, y: 14, name: 'Vua Nấm Cáu Kỉnh', boss: 'mushKing' },
      { id: 'toVillage', kind: 'portal', x: 0, y: 14, to: 'village', tx: 38, ty: 14 },
      { id: 'toCastle', kind: 'portal', x: 39, y: 14, to: 'castle', tx: 1, ty: 14, need: 'boss:mushKing',
        lockedVi: 'Vua Nấm đang chặn đường tới Lâu Đài Ngữ Pháp!' }
    ],
    monsters: { kind: 'fluff', need: 'item:wand', count: 3, zones: [[2, 16, 7, 8], [23, 17, 8, 8]] },
    build() {
      const g = new Grid(40, 28, 'g');
      g.frame(0, 0, 40, 28, 't');
      g.rect(20, 0, 2, 28, '~');
      g.set(20, 14, 'b'); g.set(21, 14, 'b');
      g.rect(18, 18, 2, 9, 's');
      g.hline(0, 19, 14, '='); g.hline(22, 39, 14, '=');
      g.house(4, 3, 5); g.vline(6, 6, 13, '=');
      g.vline(14, 9, 13, '=');
      g.vline(10, 15, 19, '=');
      g.house(25, 2, 5); g.vline(27, 5, 13, '=');
      g.rect(33, 11, 7, 3, 't'); g.rect(33, 15, 7, 3, 't');
      g.rect(35, 1, 4, 5, 't'); g.rect(36, 2, 2, 2, 'M'); g.set(36, 4, 'g'); g.set(36, 5, 'g');
      const ents = EQ.REGIONS.forest.entities;
      const avoid = any(nearEntities(ents, 1), nearRow(14, 1), (x, y) => x >= 17 && x <= 23,
        (x, y) => x >= 11 && x <= 17 && y >= 3 && y <= 9);
      g.scatter('t', 55, 21, ['g'], avoid);
      g.scatter('M', 18, 22, ['g'], avoid);
      g.scatter(',', 25, 23, ['g'], avoid);
      g.scatter('B', 10, 24, ['g'], avoid);
      return g.rows();
    }
  };

  // =================== VÙNG 3: LÂU ĐÀI NGỮ PHÁP ===================
  EQ.REGIONS.castle = {
    id: 'castle', name: 'Lâu Đài Ngữ Pháp', en: 'Grammar Castle', w: 40, h: 28, ground: 'S', music: 'castle',
    spawn: { x: 1, y: 14 },
    entities: [
      { id: 'guard', kind: 'npc', name: 'Lính gác Max', x: 13, y: 14, look: LOOK.guard, when: p => !EQ.Q.isDone(p, 'c_guard'),
        idle: [{ en: 'Stop! Who are you?', vi: 'Dừng lại! Bạn là ai?' }] },
      { id: 'guard', kind: 'npc', name: 'Lính gác Max', x: 12, y: 12, look: LOOK.guard, when: p => EQ.Q.isDone(p, 'c_guard'),
        idle: [{ en: 'Good luck, {name}!', vi: 'Chúc may mắn, {name}!' }] },
      { id: 'page', kind: 'npc', name: 'Cô thủ thư Page', x: 20, y: 4, look: LOOK.page,
        idle: [{ en: 'I like quiet rooms.', vi: 'Cô thích những căn phòng yên tĩnh.' }] },
      { id: 'mia', kind: 'npc', name: 'Công chúa Mia', x: 20, y: 22, look: LOOK.mia,
        idle: [{ en: 'Where is my cat? Oh, it is under the bed!', vi: 'Mèo của ta đâu rồi? À, nó ở dưới giường!' }] },
      { id: 'knight', kind: 'npc', name: 'Tượng Hiệp sĩ', x: 26, y: 12, e: '🗿', statue: true,
        idle: [{ en: 'Birds can fly. Fish can swim.', vi: 'Chim biết bay. Cá biết bơi.' }] },
      { id: 'sage_c', kind: 'npc', name: 'Nhà hiền triết Sao', x: 5, y: 22, look: LOOK.sage, sage: true,
        idle: [{ en: 'Every day, a little more.', vi: 'Mỗi ngày tiến bộ một chút.' }] },
      { id: 'fountain', kind: 'deco', draw: 'fountain', x: 6, y: 7, solid: true },
      { id: 'board_c', kind: 'npc', name: 'Bảng nhiệm vụ', x: 8, y: 13, draw: 'jobboard', jobs: true, e: '📋' },
      { id: 'banner_c1', kind: 'deco', draw: 'banner', x: 14, y: 13, solid: true },
      { id: 'banner_c2', kind: 'deco', draw: 'banner', x: 26, y: 15, solid: true },
      { id: 'bed', kind: 'deco', e: '🛏️', x: 17, y: 20, solid: true },
      { id: 'mtable', kind: 'deco', draw: 'desk', x: 23, y: 20, solid: true },
      { id: 'throne', kind: 'deco', draw: 'throne', x: 34, y: 2, solid: true },
      { id: 'sign_c', kind: 'sign', x: 3, y: 13, en: 'Grammar Castle', vi: 'Lâu Đài Ngữ Pháp' },
      { id: 'sign_c2', kind: 'sign', x: 20, y: 16, en: 'Library: north. Princess room: south.', vi: 'Thư viện: phía bắc. Phòng công chúa: phía nam.' },
      { id: 'canGate', kind: 'gate', style: 'magic', x: 27, y: 14, quest: 'c_gate', lesson: 'can', n: 4,
        title: 'Cổng CAN', en: 'Who can do what? Answer to open the door.', vi: 'Ai có thể làm gì? Trả lời để mở cửa.' },
      { id: 'secretC', kind: 'chest', x: 38, y: 25, secret: true, reward: { gold: 30, items: { pie: 1, hint: 1 } }, msg: 'Kho báu hoàng gia! +30 vàng 🥧📜' },
      { id: 'golem', kind: 'boss', x: 34, y: 5, name: 'Người Đá Ngữ Pháp', boss: 'golem' },
      { id: 'toForest2', kind: 'portal', x: 0, y: 14, to: 'forest', tx: 38, ty: 14 },
      { id: 'toHarbor', kind: 'portal', x: 39, y: 14, to: 'harbor', need: 'boss:golem',
        lockedVi: 'Cánh cửa phía đông dẫn tới Hải Cảng Nghe Hiểu đang bị phép thuật khóa lại.' }
    ],
    monsters: { kind: 'ink', need: 'item:wand', count: 3, zones: [[15, 7, 11, 6], [29, 16, 8, 8]] },
    build() {
      const g = new Grid(40, 28, 'S');
      g.frame(0, 0, 40, 28, 'W');
      for (let i = 3; i < 40; i += 6) { g.set(i, 0, 'w'); g.set(i, 27, 'w'); }
      g.set(0, 14, 'S'); g.set(39, 14, 'S');
      g.hline(1, 12, 14, '=');
      g.vline(13, 1, 26, 'W'); g.set(13, 14, 'S');
      g.hline(14, 26, 14, 'c');
      g.hline(15, 25, 2, 'K'); g.hline(15, 18, 5, 'K'); g.hline(22, 25, 5, 'K');
      g.frame(15, 18, 11, 9, 'W'); g.set(20, 18, 'S'); g.vline(20, 15, 17, 'c');
      g.rect(16, 19, 9, 7, 'c');
      g.vline(27, 1, 26, 'W'); g.set(27, 14, 'S');
      g.hline(28, 38, 14, 'c'); g.vline(34, 4, 13, 'c');
      [[30, 10], [30, 18], [37, 10], [37, 18], [31, 6], [37, 6]].forEach(p => g.set(p[0], p[1], 'P'));
      const ents = EQ.REGIONS.castle.entities;
      const avoid = any(nearEntities(ents, 1), nearRow(14, 1), (x, y) => x > 12);
      g.scatter('f', 14, 31, ['S'], avoid);
      return g.rows();
    }
  };

  // Vùng 4 & 5: dành cho phiên bản sau (cổng đã có sẵn trong lâu đài)
  EQ.FUTURE_REGIONS = [
    { id: 'harbor', name: 'Hải Cảng Nghe Hiểu', en: 'Listening Harbor', icon: '⚓' },
    { id: 'mountain', name: 'Núi Giao Tiếp', en: 'Conversation Mountain', icon: '⛰️' }
  ];

  EQ.Grid = Grid;
  EQ.rng = rng;
})();
