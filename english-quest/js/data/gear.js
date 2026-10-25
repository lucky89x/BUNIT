/* ENGLISH QUEST – Trang bị, chỉ số, Bảng nhiệm vụ hằng ngày, Tháp Thử Thách (bản 1.4; 1.6: hiệu quả trang bị toàn game – R.effects)
 *
 * Chỉ số nhân vật:
 *   ⚔️ Sức mạnh (atk)  – sát thương mỗi câu trả lời đúng
 *   ❤️ Máu (hp)        – mỗi điểm = +10 máu tối đa (thanh máu) và +1 mạng trong trò hành động
 *   🛡️ Phòng thủ (def) – % cơ hội chặn đòn khi trả lời sai (tối đa 60%)
 *   🍀 May mắn (luck)  – % vàng nhận thêm (tối đa 150%)
 * Trang bị KHÔNG thay thế việc học: vẫn phải trả lời đúng tiếng Anh mới gây sát thương.
 * Trang bị chỉ giúp cần ít câu đúng hơn và chịu được nhiều câu sai hơn.
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U;
  const R = {};

  R.SLOTS = {
    weapon: { name: 'Vũ khí', icon: '🪄' },
    hat: { name: 'Mũ / vương miện', icon: '👑' },
    neck: { name: 'Dây chuyền', icon: '📿' },
    ring: { name: 'Nhẫn', icon: '💍' },
    glove: { name: 'Bao tay', icon: '🧤' },
    armor: { name: 'Áo giáp', icon: '🦺' },
    boots: { name: 'Giày', icon: '👢' }
  };
  R.TIERS = ['', 'Thường', 'Hiếm', 'Quý', 'Sử thi', 'Huyền thoại'];
  R.TIER_COL = ['', '#9e9e9e', '#42a5f5', '#ab47bc', '#ffa000', '#ff4081'];

  // id, ô, tên, biểu tượng, cấp độ hiếm, giá, chỉ số, màu (dùng khi vẽ lên nhân vật)
  const G = [];
  function g(id, slot, name, e, tier, price, stats, col, desc) { G.push({ id, slot, name, e, tier, price, stats, col, desc }); }
  g('w1', 'weapon', 'Đũa gỗ sồi', '🪄', 1, 30, { atk: 1 }, '#a1683a', 'Cây đũa đầu tiên của mọi pháp sư nhỏ.');
  g('w2', 'weapon', 'Đũa bạc ánh trăng', '🪄', 2, 90, { atk: 2 }, '#cfd8dc', 'Sáng lấp lánh như trăng rằm.');
  g('w3', 'weapon', 'Trượng pha lê', '🔮', 3, 220, { atk: 3, luck: 5 }, '#80deea', 'Đỉnh trượng là viên pha lê biết hát.');
  g('w4', 'weapon', 'Trượng rồng vàng', '🐉', 4, 480, { atk: 5 }, '#ffca28', 'Rồng vàng cuộn quanh thân trượng.');
  g('w5', 'weapon', 'Gậy sao băng', '🌠', 5, 900, { atk: 7, def: 5 }, '#ff80ab', 'Mỗi phép thuật để lại một vệt sao.');
  g('h1', 'hat', 'Băng đô hoa', '🎀', 1, 25, { luck: 10 }, '#ff80ab', 'Kết từ hoa đồng nội của Làng.');
  g('h2', 'hat', 'Mũ phù thủy nhỏ', '🎩', 2, 80, { hp: 1 }, '#5e35b1', 'Đội vào thấy mình thông minh hơn hẳn.');
  g('h3', 'hat', 'Vương miện bạc', '👑', 3, 200, { hp: 1, def: 5 }, '#e0e0e0', 'Vương miện của các hiệp sĩ trẻ.');
  g('h4', 'hat', 'Vương miện vàng', '👑', 4, 450, { hp: 2, def: 8 }, '#ffd54f', 'Chỉ người dũng cảm mới đội được.');
  g('h5', 'hat', 'Mũ ngôi sao', '⭐', 5, 850, { hp: 3, def: 10 }, '#fff176', 'Phát sáng cả trong đêm tối.');
  g('n1', 'neck', 'Dây chuyền vỏ sò', '🐚', 1, 30, { def: 5 }, '#ffccbc', 'Nhặt từ bãi biển của bác Sam.');
  g('n2', 'neck', 'Dây chuyền ngọc trai', '⚪', 2, 100, { def: 10 }, '#ffffff', 'Những viên ngọc trai tròn trịa.');
  g('n3', 'neck', 'Mặt dây ruby', '❤️', 3, 240, { hp: 1, def: 10 }, '#e53935', 'Viên ruby đỏ ấm áp.');
  g('n4', 'neck', 'Bùa hộ mệnh lục bảo', '💚', 4, 500, { hp: 1, def: 18 }, '#43a047', 'Che chở người đeo khỏi phép xấu.');
  g('n5', 'neck', 'Ngôi sao hộ mệnh', '🌟', 5, 950, { hp: 2, def: 25 }, '#ffeb3b', 'Món quà của các vì sao.');
  g('r1', 'ring', 'Nhẫn cỏ bốn lá', '🍀', 1, 35, { luck: 15 }, '#66bb6a', 'Mang lại may mắn bất ngờ.');
  g('r2', 'ring', 'Nhẫn bạc', '💍', 2, 110, { atk: 1, luck: 10 }, '#cfd8dc', 'Đơn giản mà mạnh mẽ.');
  g('r3', 'ring', 'Nhẫn sapphire', '💎', 3, 260, { atk: 1, luck: 25 }, '#1e88e5', 'Xanh như biển sâu.');
  g('r4', 'ring', 'Nhẫn kim cương', '💎', 4, 520, { atk: 2, luck: 30 }, '#e1f5fe', 'Cứng nhất, sáng nhất.');
  g('r5', 'ring', 'Nhẫn cầu vồng', '🌈', 5, 1000, { atk: 3, luck: 40, def: 5 }, '#ce93d8', 'Bảy màu bảy phép thuật.');
  // bản 1.8: bao tay (sức mạnh + chí mạng), áo giáp (máu + phòng thủ), giày (phòng thủ + chạy nhanh hơn trên bản đồ)
  g('g1', 'glove', 'Bao tay vải', '🧤', 1, 40, { atk: 1 }, '#bcaaa4', 'Giữ đũa phép chắc tay hơn.');
  g('g2', 'glove', 'Bao tay da hươu', '🧤', 2, 120, { atk: 1, luck: 8 }, '#8d6e63', 'Mềm mà bền, quà của bác thợ da.');
  g('g3', 'glove', 'Bao tay thép', '🥊', 3, 270, { atk: 2, luck: 10 }, '#90a4ae', 'Đấm đâu chắc đó.');
  g('g4', 'glove', 'Bao tay lửa', '🔥', 4, 540, { atk: 3, luck: 15 }, '#ff7043', 'Mỗi phép thuật nóng rực như lửa.');
  g('g5', 'glove', 'Bao tay rồng', '🐲', 5, 1000, { atk: 4, luck: 20, def: 5 }, '#7cb342', 'Làm từ vảy rồng xanh.');
  g('a1', 'armor', 'Áo vải dày', '👕', 1, 40, { hp: 1 }, '#a1887f', 'Áo khoác dày cho chuyến đi xa.');
  g('a2', 'armor', 'Áo giáp da', '🦺', 2, 120, { hp: 1, def: 4 }, '#795548', 'Đỡ được những cú cắn nhẹ.');
  g('a3', 'armor', 'Giáp lưới thép', '🛡️', 3, 280, { hp: 2, def: 6 }, '#b0bec5', 'Kêu leng keng khi bước đi.');
  g('a4', 'armor', 'Giáp hiệp sĩ', '🛡️', 4, 560, { hp: 3, def: 8 }, '#cfd8dc', 'Giáp của đội cận vệ Lâu đài.');
  g('a5', 'armor', 'Giáp vảy rồng', '🐉', 5, 1050, { hp: 4, def: 12 }, '#26a69a', 'Không quái nào cắn thủng nổi.');
  g('b1', 'boots', 'Dép cỏ', '🩴', 1, 30, { def: 3 }, '#9ccc65', 'Nhẹ tênh, đi nhanh hơn một chút.');
  g('b2', 'boots', 'Giày da', '👞', 2, 100, { def: 5, hp: 1 }, '#6d4c41', 'Đi đường xa không mỏi chân.');
  g('b3', 'boots', 'Ủng thám hiểm', '👢', 3, 230, { def: 8, hp: 1 }, '#8d6e63', 'Lội rừng, lội suối đều được.');
  g('b4', 'boots', 'Giày gió', '👟', 4, 500, { def: 10, hp: 2 }, '#4fc3f7', 'Chạy nhanh như gió thổi.');
  g('b5', 'boots', 'Giày sao băng', '🌠', 5, 950, { def: 14, hp: 2, luck: 10 }, '#ffd54f', 'Mỗi bước để lại một vệt sáng.');
  R.GEAR = G;
  R.GI = {}; G.forEach(x => { R.GI[x.id] = x; });

  // ---------- chỉ số ----------
  R.upCost = (it, lv) => Math.round(it.price * 0.5 * (lv + 1));
  R.itemStats = function (it, lv) {
    const s = Object.assign({ atk: 0, hp: 0, def: 0, luck: 0 }, it.stats);
    lv = lv || 0;
    if (it.slot === 'weapon') s.atk += Math.floor((lv + 1) / 2);
    if (it.slot === 'hat') { s.def += lv * 2; if (lv >= 5) s.hp += 1; }
    if (it.slot === 'neck') s.def += lv * 2;
    if (it.slot === 'ring') s.luck += lv * 5;
    if (it.slot === 'glove') { s.atk += Math.floor(lv / 2); s.luck += lv * 2; }
    if (it.slot === 'armor') { s.def += lv * 2; if (lv >= 5) s.hp += 1; }
    if (it.slot === 'boots') s.def += lv * 2;
    return s;
  };
  R.ensure = function (p) {
    p.gear = p.gear || { owned: {}, eq: {} };
    p.counters = p.counters || {};
    p.jobs = p.jobs || null;
    p.tower = p.tower || { best: 0 };
    if (typeof p.life !== 'number' || isNaN(p.life)) { p.life = 0; p.life = R.maxLife(p); }
    return p;
  };
  R.stats = function (p) {
    R.ensure(p);
    const base = { atk: 1 + (p.items.spellbook ? 1 : 0) + Math.floor((p.level - 1) / 4), hp: Math.min(6, 3 + Math.floor((p.level - 1) / 3)), def: 0, luck: 0 };
    Object.keys(R.SLOTS).forEach(sl => {
      const id = p.gear.eq[sl];
      if (!id || !R.GI[id]) return;
      const s = R.itemStats(R.GI[id], p.gear.owned[id] || 0);
      base.atk += s.atk; base.hp += s.hp; base.def += s.def; base.luck += s.luck;
    });
    base.hp = Math.min(16, base.hp);
    base.def = Math.min(60, base.def);
    base.luck = Math.min(150, base.luck);
    return base;
  };
  R.power = function (p) {
    const s = R.stats(p);
    return Math.round(s.atk * 12 + s.hp * 6 + s.def * 1.2 + s.luck * 0.3 + p.level * 2);
  };
  // Hiệu quả trang bị dùng chung cho toàn game (đánh quái, Tháp, trò hành động, đấu 2 bé)
  R.effects = function (p) {
    const s = R.stats(p);
    const w = p.gear && p.gear.eq.weapon && R.GI[p.gear.eq.weapon];
    return {
      atk: s.atk, hp: Math.min(10, s.hp), def: s.def, luck: s.luck,   // hp = số mạng trong trò hành động (tối đa 10)
      crit: Math.min(40, Math.round(s.luck / 4)),   // % đánh chí mạng (x2 sát thương)
      weapon: w || null,                             // vũ khí đang cầm → hình phép thuật khi tấn công
      neckCol: p.gear && p.gear.eq.neck && R.GI[p.gear.eq.neck] ? R.GI[p.gear.eq.neck].col : null,
      tier: w ? w.tier : 0,
      speed: R.speedBonus(p)
    };
  };
  // ---------- ❤️ THANH MÁU (bản 1.8) ----------
  // Máu tối đa = 50 + 5/cấp + 10 cho mỗi điểm ❤️ (mũ, dây chuyền, áo giáp, giày...)
  // Trả lời sai trong trận → quái cắn mất máu (🛡️ Phòng thủ có thể chặn). Hết máu → gục ngã, rơi 1 món đồ đang mặc.
  R.maxLife = p => 50 + (p.level || 1) * 5 + R.stats(p).hp * 10;
  R.lifeOf = p => { R.ensure(p); return Math.max(0, Math.min(R.maxLife(p), Math.round(p.life))); };
  R.heal = (p, n) => { R.ensure(p); p.life = Math.min(R.maxLife(p), p.life + n); };
  // giày: đi nhanh hơn trên bản đồ (6% mỗi bậc hiếm)
  R.speedBonus = p => { const id = p.gear && p.gear.eq.boots; return id && R.GI[id] ? R.GI[id].tier * 0.06 : 0; };
  // gục ngã: mất ngẫu nhiên 1 món đang mặc (nếu không mặc gì: mất 20% vàng)
  R.die = function (p) {
    R.ensure(p);
    const worn = Object.keys(R.SLOTS).map(s => p.gear.eq[s]).filter(id => id && R.GI[id]);
    let lost = null, gold = 0;
    if (worn.length) {
      const id = U.pick(worn); lost = R.GI[id];
      p.gear.eq[lost.slot] = null; delete p.gear.owned[id];
    } else { gold = Math.floor(p.gold * 0.2); p.gold -= gold; }
    p.counters = p.counters || {}; p.counters.deaths = (p.counters.deaths || 0) + 1;
    R.syncLook(p);
    p.life = R.maxLife(p);
    return { lost, gold };
  };
  // món đồ ngẫu nhiên (boss thưởng): ưu tiên món chưa có, bậc tối đa maxTier
  R.randomDrop = function (p, minTier, maxTier) {
    R.ensure(p);
    let cand = G.filter(it => it.tier >= minTier && it.tier <= maxTier && p.gear.owned[it.id] == null);
    if (!cand.length) cand = G.filter(it => it.tier >= minTier && it.tier <= maxTier);
    // May mắn tăng cơ hội ra đồ bậc cao
    const luck = R.stats(p).luck;
    const w = cand.map(it => Math.pow(it.tier, 1 + luck / 150));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < cand.length; i++) { r -= w[i]; if (r <= 0) return cand[i]; }
    return cand[cand.length - 1];
  };
  // số câu đúng cần để hạ quái có hp máu
  R.hitsToKill = (p, hp) => Math.max(1, Math.ceil(hp / R.stats(p).atk));

  // màu trang bị để vẽ lên nhân vật
  R.syncLook = function (p) {
    R.ensure(p);
    const e = p.gear.eq, gi = id => id && R.GI[id];
    const g = {};
    if (gi(e.weapon)) g.wand = gi(e.weapon).col;
    if (gi(e.hat)) { g.hat = e.hat; g.hatC = gi(e.hat).col; }
    if (gi(e.neck)) g.neck = gi(e.neck).col;
    if (gi(e.ring)) g.ring = gi(e.ring).col;
    if (gi(e.glove)) g.glove = gi(e.glove).col;
    if (gi(e.armor)) g.armor = gi(e.armor).col;
    if (gi(e.boots)) g.boots = gi(e.boots).col;
    p.avatar._gear = Object.keys(g).length ? g : null;
  };
  R.buy = function (p, id) {
    R.ensure(p);
    const it = R.GI[id];
    if (!it || p.gear.owned[id] != null) return { ok: false, msg: 'Đã có món này rồi.' };
    if (p.gold < it.price) return { ok: false, msg: 'Chưa đủ vàng. Hãy làm nhiệm vụ để kiếm thêm nhé!' };
    p.gold -= it.price; p.gear.owned[id] = 0;
    if (!p.gear.eq[it.slot]) p.gear.eq[it.slot] = id;
    R.syncLook(p);
    return { ok: true };
  };
  R.give = function (p, id) { R.ensure(p); if (p.gear.owned[id] == null) { p.gear.owned[id] = 0; return true; } return false; };
  R.equip = function (p, id) {
    R.ensure(p);
    const it = R.GI[id];
    if (!it || p.gear.owned[id] == null) return false;
    p.gear.eq[it.slot] = p.gear.eq[it.slot] === id ? null : id;
    R.syncLook(p);
    return true;
  };
  R.upgrade = function (p, id) {
    R.ensure(p);
    const it = R.GI[id], lv = p.gear.owned[id];
    if (!it || lv == null) return { ok: false, msg: 'Bạn chưa có món này.' };
    if (lv >= 5) return { ok: false, msg: 'Đã nâng cấp tối đa (+5).' };
    const cost = R.upCost(it, lv);
    if (p.gold < cost) return { ok: false, msg: 'Cần ' + cost + ' vàng để nâng cấp.' };
    p.gold -= cost; p.gear.owned[id] = lv + 1;
    return { ok: true, lv: lv + 1 };
  };

  // ---------- Bảng nhiệm vụ hằng ngày (kiếm vàng) ----------
  // counter: tên bộ đếm; n: số lượng; gold: phần thưởng
  R.JOB_TYPES = [
    { id: 'kill', counter: 'kill', name: n => 'Hóa giải ' + n + ' quái vật lang thang', ns: [3, 5], gold: [35, 55], icon: '⚔️' },
    { id: 'correct', counter: 'correct', name: n => 'Trả lời đúng ' + n + ' câu tiếng Anh', ns: [15, 30], gold: [30, 55], icon: '✅' },
    { id: 'learn', counter: 'learn', name: n => 'Học ' + n + ' từ mới (mục 📗 Sách)', ns: [5, 8], gold: [35, 50], icon: '✨' },
    { id: 'arcade', counter: 'arcade', name: n => 'Chơi ' + n + ' ván ở Khu vui chơi', ns: [1, 2], gold: [25, 45], icon: '🎮' },
    { id: 'review', counter: 'review', name: n => 'Hoàn thành ' + n + ' lượt ôn tập / luyện từ', ns: [1, 2], gold: [30, 50], icon: '🔁' },
    { id: 'tower', counter: 'tower', name: n => 'Vượt ' + n + ' tầng Tháp Thử Thách', ns: [1, 2], gold: [45, 80], icon: '🗼' }
  ];
  R.count = function (p, key, n) { R.ensure(p); p.counters[key] = (p.counters[key] || 0) + (n || 1); R.checkJobs(p); };
  R.dailyJobs = function (p) {
    R.ensure(p);
    const day = U.today();
    if (p.jobs && p.jobs.day === day) return p.jobs;
    const pick = U.shuffle(R.JOB_TYPES).slice(0, 3);
    p.jobs = { day, list: pick.map(t => { const k = Math.random() < 0.5 ? 0 : 1; return { type: t.id, n: t.ns[k], gold: t.gold[k], base: p.counters[t.counter] || 0, claimed: false, notified: false }; }) };
    return p.jobs;
  };
  R.jobInfo = function (p, j) {
    const t = R.JOB_TYPES.find(x => x.id === j.type);
    const prog = Math.min(j.n, (p.counters[t.counter] || 0) - j.base);
    return { t, name: t.name(j.n), prog, done: prog >= j.n };
  };
  R.checkJobs = function (p) {
    if (!p.jobs || p.jobs.day !== U.today()) return;
    p.jobs.list.forEach(j => {
      const info = R.jobInfo(p, j);
      if (info.done && !j.notified) { j.notified = true; if (EQ.ui && EQ.ui.toast) EQ.ui.toast('📋 Xong việc: ' + info.name + ' → mở Bảng nhiệm vụ để nhận ' + j.gold + ' 🪙', 'gold', 4500); }
    });
  };

  // ---------- Tháp Thử Thách: 30 tầng ----------
  const MONS = [
    { draw: 'slime', name: 'Slime', colors: ['#66bb6a', '#42a5f5', '#ffca28', '#ef5350'] },
    { draw: 'fluff', name: 'Bông xù', colors: ['#f48fb1', '#ce93d8', '#80deea', '#ffab91'] },
    { draw: 'slime', name: 'Giọt mực', colors: ['#5c6bc0', '#26a69a', '#7e57c2', '#37474f'] },
    { draw: 'mush', name: 'Nấm', colors: ['#e53935', '#8e24aa', '#fb8c00', '#00897b'] },
    { draw: 'star', name: 'Tinh tú', colors: ['#ffd54f', '#81d4fa', '#aed581', '#f48fb1'] },
    { draw: 'golem', name: 'Người đá', colors: ['#78909c', '#8d6e63', '#607d8b', '#5d4037'] }
  ];
  const ADJ = ['Tí hon', 'Nghịch ngợm', 'Cáu kỉnh', 'Ngái ngủ', 'Lém lỉnh', 'Hung hăng', 'Khổng lồ', 'Bóng tối', 'Pha lê', 'Lửa'];
  R.floor = function (f) {
    const boss = f % 5 === 0;
    const m = MONS[Math.floor((f - 1) / 5) % MONS.length];
    const hp = Math.round((4 + f * 1.25) * (boss ? 1.5 : 1));
    return {
      f, boss, hp,
      matk: Math.min(3, 1 + Math.floor(f / 10) + (boss && f >= 15 ? 1 : 0)),
      rec: 20 + f * 7 + (boss ? 10 : 0),
      gold: Math.round((10 + f * 4) * (boss ? 2 : 1)),
      def: { name: (boss ? 'Trùm ' : '') + m.name + ' ' + ADJ[(f - 1) % ADJ.length], draw: m.draw, color: m.colors[f % m.colors.length], crown: boss, size: boss ? 2 : 1.5,
        win: { en: 'You are strong! Go up!', vi: 'Bạn mạnh thật! Lên tầng tiếp đi!' } },
      dropTier: boss ? Math.min(5, Math.ceil(f / 6)) : 0
    };
  };
  R.TOWER_FLOORS = 30;

  EQ.rpg = R;
})();
