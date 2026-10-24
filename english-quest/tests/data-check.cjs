/* Kiểm tra dữ liệu game bằng Node.js: node tests/data-check.cjs
 * - Từ vựng: đủ số lượng, không trùng, có nghĩa và ví dụ
 * - Ngữ pháp: đáp án nằm trong lựa chọn, không trùng lựa chọn
 * - Nhiệm vụ: NPC/cổng/rương/trùm/từ được tham chiếu đều tồn tại
 * - Bản đồ: kích thước đúng, thực thể không nằm trên ô vật cản, đi tới được mọi nơi
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
['js/core/util.js', 'js/data/vocab.js', 'js/data/lessons.js', 'js/data/quests.js', 'js/data/maps.js'].forEach(f => {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
});
const EQ = ctx.EQ;
// stub cho điều kiện hiển thị
EQ.Q = { isDone: () => false };

let errors = 0, warns = 0;
const err = m => { errors++; console.log('❌ ' + m); };
const warn = m => { warns++; console.log('⚠️  ' + m); };

// ---- từ vựng
const ids = new Set();
EQ.VOCAB.forEach(w => {
  if (ids.has(w.id)) err('Trùng id từ: ' + w.id);
  ids.add(w.id);
  ['en', 'vi', 'e', 'ex', 'exVi', 't', 'r'].forEach(k => { if (!w[k]) err('Từ ' + w.id + ' thiếu ' + k); });
  if (!EQ.TOPICS[w.t]) err('Chủ đề lạ: ' + w.t);
  if (w.ex && !/[.!?]$/.test(w.ex)) warn('Câu ví dụ thiếu dấu câu: ' + w.ex);
});
const byRegion = {};
EQ.VOCAB.forEach(w => { byRegion[w.r] = (byRegion[w.r] || 0) + 1; });
console.log('Từ vựng:', EQ.VOCAB.length, JSON.stringify(byRegion));
if (EQ.VOCAB.length < 100) err('Cần ít nhất 100 từ');
// biểu tượng của từ dùng cho câu hỏi hình ảnh không được trùng nhau
const picE = {};
EQ.VOCAB.filter(w => w.pic && !w.sw).forEach(w => { if (picE[w.e]) err('Trùng biểu tượng hình: ' + w.e + ' (' + picE[w.e] + ', ' + w.id + ')'); picE[w.e] = w.id; });
const ens = {};
EQ.VOCAB.forEach(w => { if (ens[w.en] && !(w.en === 'orange')) err('Trùng từ tiếng Anh: ' + w.en); ens[w.en] = 1; });

// ---- ngữ pháp
EQ.GRAMMAR.forEach((g, i) => {
  if (!EQ.LESSONS[g.l]) err('Câu ngữ pháp #' + i + ' có bài học lạ ' + g.l);
  if (g.opts.indexOf(g.a) !== 0) err('Đáp án phải đứng đầu: ' + g.q);
  if (new Set(g.opts).size !== g.opts.length) err('Lựa chọn trùng: ' + g.q);
  if ((g.q.match(/___/g) || []).length !== 1) err('Câu cần đúng 1 chỗ trống: ' + g.q);
  if (!g.ex || !g.vi) err('Thiếu giải thích/nghĩa: ' + g.q);
});
const perLesson = {};
EQ.GRAMMAR.forEach(g => { perLesson[g.l] = (perLesson[g.l] || 0) + 1; });
console.log('Câu ngữ pháp:', EQ.GRAMMAR.length, JSON.stringify(perLesson));
Object.keys(EQ.LESSONS).forEach(l => { if (!perLesson[l] && l !== 'order' && l !== 'prep') warn('Bài ' + l + ' chưa có câu điền từ'); });
EQ.SENTENCES.forEach(s => { if (!EQ.LESSONS[s.l]) err('Câu sắp xếp có bài lạ: ' + s.s); if (!/[.!?]$/.test(s.s)) err('Câu sắp xếp thiếu dấu câu: ' + s.s); });
console.log('Câu sắp xếp:', EQ.SENTENCES.length);

// ---- câu đố
(EQ.RIDDLES || []).forEach(r => {
  const w = EQ.V[r.a];
  if (!w) return err('Câu đố có đáp án lạ: ' + r.a);
  if (!w.pic) err('Đáp án câu đố phải có hình: ' + r.a);
  r.d.forEach(id => { const d = EQ.V[id]; if (!d) err('Câu đố ' + r.a + ': lựa chọn lạ ' + id); else if (!d.pic || d.e === w.e) err('Câu đố ' + r.a + ': lựa chọn không dùng được ' + id); });
  if (!/[.!?]$/.test(r.en)) warn('Câu đố thiếu dấu câu: ' + r.en);
});
console.log('Câu đố:', (EQ.RIDDLES || []).length);

// ---- bản đồ
const regionEnts = {};
const allEntIds = new Set();
Object.keys(EQ.REGIONS).forEach(rid => {
  const R = EQ.REGIONS[rid];
  const rows = R.build();
  if (rows.length !== R.h) err(rid + ': số hàng ' + rows.length + ' ≠ ' + R.h);
  rows.forEach((r, y) => { if (r.length !== R.w) err(rid + ': hàng ' + y + ' dài ' + r.length); });
  const solidTile = (x, y) => x < 0 || y < 0 || x >= R.w || y >= R.h || EQ.SOLID.has(rows[y][x]);
  regionEnts[rid] = R.entities;
  R.entities.forEach(e => {
    allEntIds.add(e.id);
    if (e.x < 0 || e.y < 0 || e.x >= R.w || e.y >= R.h) err(rid + ': ' + e.id + ' nằm ngoài bản đồ');
    else if (solidTile(e.x, e.y)) err(rid + ': ' + e.id + ' nằm trên ô vật cản "' + rows[e.y][e.x] + '" tại ' + e.x + ',' + e.y);
  });
  // BFS: coi mọi cổng và trùm đã mở; NPC/rương/biển báo/đồ trang trí là vật cản
  // trạng thái "sau khi làm nhiệm vụ" (ví dụ lính gác đã tránh đường)
  EQ.Q.isDone = () => true;
  const solidEnt = new Set();
  R.entities.forEach(e => { if (e.when && !e.when({})) return; if (['npc', 'chest', 'sign'].includes(e.kind) || (e.kind === 'deco' && e.solid)) solidEnt.add(e.x + ',' + e.y); });
  EQ.Q.isDone = () => false;
  function bfs(blocked) {
    const seen = new Set();
    const sp = R.spawn; const q = [[sp.x, sp.y]]; seen.add(sp.x + ',' + sp.y);
    while (q.length) {
      const [x, y] = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (seen.has(k) || solidTile(nx, ny) || solidEnt.has(k) || blocked.has(k)) return;
        seen.add(k); q.push([nx, ny]);
      });
    }
    return seen;
  }
  const open = bfs(new Set());
  const adj = (e, set) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => set.has((e.x + dx) + ',' + (e.y + dy)));
  R.entities.forEach(e => {
    if (e.kind === 'deco') return;
    if (!adj(e, open)) err(rid + ': không đi tới được ' + e.kind + ' "' + e.id + '" tại ' + e.x + ',' + e.y);
  });
  // khi cổng còn đóng: thứ sau cổng phải không tới được (kiểm tra cổng có tác dụng)
  const gates = R.entities.filter(e => e.kind === 'gate' || e.kind === 'boss');
  const closed = bfs(new Set(gates.map(g => g.x + ',' + g.y)));
  const behind = R.entities.filter(e => e.kind !== 'deco' && !adj(e, closed) && !gates.includes(e)).map(e => e.id);
  console.log('Bản đồ ' + rid + ': ' + R.w + 'x' + R.h + ', ' + R.entities.length + ' thực thể, đi được ' + open.size + ' ô; sau cổng/trùm: ' + behind.join(', '));
});

// ---- nhiệm vụ
const qids = new Set(EQ.QUESTS.map(q => q.id));
let realQuests = 0;
EQ.QUESTS.forEach(q => {
  if (!q.advanced) realQuests++;
  q.requires.forEach(r => { if (!qids.has(r)) err(q.id + ' yêu cầu nhiệm vụ lạ ' + r); });
  if (!allEntIds.has(q.giver)) err(q.id + ': người giao nhiệm vụ lạ ' + q.giver);
  if (q.teach) {
    (q.teach.words || []).forEach(w => { if (!EQ.V[w]) err(q.id + ': dạy từ lạ ' + w); });
    const ls = q.teach.lesson ? [].concat(q.teach.lesson) : [];
    ls.forEach(l => { if (!EQ.LESSONS[l]) err(q.id + ': bài học lạ ' + l); });
  }
  q.stages.forEach((s, i) => {
    if (s.npc && !allEntIds.has(s.npc)) err(q.id + ' bước ' + i + ': NPC lạ ' + s.npc);
    if (s.type === 'gate' && !allEntIds.has(s.gate)) err(q.id + ': cổng lạ ' + s.gate);
    if (s.type === 'chest' && !allEntIds.has(s.chest)) err(q.id + ': rương lạ ' + s.chest);
    if (s.type === 'boss' && !EQ.BOSSES[s.boss]) err(q.id + ': trùm lạ ' + s.boss);
    if (s.type === 'collect') {
      const ents = regionEnts[q.region].filter(e => e.kind === 'pickup' && e.quest === q.id && e.good);
      if (s.count && ents.length < s.count) err(q.id + ': không đủ đồ để nhặt');
      if (s.need) Object.keys(s.need).forEach(k => { if (ents.filter(e => e.item === k).length < s.need[k]) err(q.id + ': không đủ ' + k); });
    }
    if (s.type === 'shop') Object.keys(s.list).forEach(k => { if (!EQ.MARKET.find(m => m.id === k)) err(q.id + ': hàng lạ ' + k); });
    if (s.type === 'quiz' && s.gen.words && s.gen.words.list) s.gen.words.list.forEach(w => { if (!EQ.V[w]) err(q.id + ': từ lạ ' + w); });
    (s.script || []).forEach(n => { if (n.ask && !n.opts.some(o => o.ok)) err(q.id + ': câu hỏi không có đáp án đúng: ' + n.ask); });
  });
  (q.intro || []).forEach(n => { if (n.ask && !n.opts.some(o => o.ok)) err(q.id + ': câu hỏi không có đáp án đúng: ' + n.ask); });
  const r = q.reward || {};
  if (r.outfit && !EQ.OUTFITS[r.outfit]) err(q.id + ': trang phục lạ ' + r.outfit);
  if (r.badge && !EQ.BADGES[r.badge]) err(q.id + ': huy hiệu lạ ' + r.badge);
  Object.keys(r.items || {}).forEach(k => { if (!EQ.ITEMS[k]) err(q.id + ': vật phẩm lạ ' + k); });
});
// gate/chest trong bản đồ phải trỏ tới nhiệm vụ có thật
Object.values(EQ.REGIONS).forEach(R => R.entities.forEach(e => { if (e.quest && !qids.has(e.quest)) err(e.id + ': nhiệm vụ lạ ' + e.quest); if (e.kind === 'boss' && !EQ.BOSSES[e.boss]) err(e.id + ': trùm lạ'); }));
// mọi từ trong rương nghe đã được dạy trước khi tới đó
const taught = new Set();
EQ.QUESTS.forEach(q => ((q.teach || {}).words || []).forEach(w => taught.add(w)));
const untaught = EQ.VOCAB.filter(w => !taught.has(w.id)).map(w => w.id);
if (untaught.length) warn('Từ chưa được dạy trong nhiệm vụ nào: ' + untaught.join(', '));
console.log('Nhiệm vụ chính:', realQuests, '+ nâng cao:', EQ.QUESTS.length - realQuests, '| Trùm:', Object.keys(EQ.BOSSES).length);
if (realQuests < 12) err('Cần ít nhất 12 nhiệm vụ');

console.log(errors ? '\n' + errors + ' lỗi, ' + warns + ' cảnh báo' : '\n✅ Dữ liệu hợp lệ (' + warns + ' cảnh báo)');
process.exit(errors ? 1 : 0);
