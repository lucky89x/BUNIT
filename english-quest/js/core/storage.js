/* Lưu tiến độ trên máy (localStorage). Không gửi dữ liệu đi đâu cả.
 * - Lưu chính: englishQuest.v1
 * - Bản dự phòng: englishQuest.v1.backup (bản lưu tốt gần nhất trước đó)
 * - Phụ huynh có thể xuất / nhập file JSON trong Bảng phụ huynh.
 */
window.EQ = window.EQ || {};
(function () {
  const KEY = 'englishQuest.v1';
  const BKEY = KEY + '.backup';
  const U = EQ.U;

  const DEFAULT_SETTINGS = {
    music: true, sfx: true, musicVol: 0.5, sfxVol: 0.7,
    accent: 'auto', voiceName: '', rate: 0.85,
    breakMin: 20, alwaysVi: false, speakPractice: false, ninjaArt: true, gfx3d: true
  };

  const S = {
    ok: true, // localStorage có hoạt động không
    warn: '',
    data: null,
    _timer: null
  };

  function fresh() {
    return { app: 'english-quest', version: 1, settings: Object.assign({}, DEFAULT_SETTINGS), profiles: [], lastProfile: null, savedAt: 0 };
  }

  function testStorage() {
    try {
      const k = KEY + '.test';
      localStorage.setItem(k, '1');
      const v = localStorage.getItem(k);
      localStorage.removeItem(k);
      return v === '1';
    } catch (e) { return false; }
  }

  function valid(d) {
    return d && typeof d === 'object' && d.app === 'english-quest' && Array.isArray(d.profiles);
  }

  S.load = function () {
    S.ok = testStorage();
    if (!S.ok) {
      S.warn = 'Trình duyệt đang chặn lưu dữ liệu. Tiến độ sẽ mất khi đóng trang. Hãy chạy game bằng file "Chay-game.bat" (xem hướng dẫn).';
      S.data = fresh();
      return S.data;
    }
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!valid(d)) {
      let b = null;
      try { b = JSON.parse(localStorage.getItem(BKEY) || 'null'); } catch (e) { b = null; }
      if (valid(b)) { d = b; S.warn = 'Dữ liệu lưu bị lỗi, game đã khôi phục từ bản dự phòng gần nhất.'; }
      else if (localStorage.getItem(KEY)) { S.warn = 'Dữ liệu lưu bị lỗi và không có bản dự phòng. Game bắt đầu mới.'; }
    }
    S.data = valid(d) ? d : fresh();
    S.data.settings = Object.assign({}, DEFAULT_SETTINGS, S.data.settings || {});
    S.data.profiles.forEach(migrateProfile);
    return S.data;
  };

  S.save = function () {
    if (!S.data) return false;
    S.data.savedAt = Date.now();
    if (!S.ok) return false;
    try {
      const prev = localStorage.getItem(KEY);
      const json = JSON.stringify(S.data);
      localStorage.setItem(KEY, json);
      // giữ bản tốt trước đó làm dự phòng (chỉ cập nhật mỗi 2 phút để luôn có bản "cũ hơn")
      if (prev && (!S._lastBackup || Date.now() - S._lastBackup > 120000)) {
        try { if (valid(JSON.parse(prev))) { localStorage.setItem(BKEY, prev); S._lastBackup = Date.now(); } } catch (e) { /* bỏ qua */ }
      }
      return true;
    } catch (e) {
      console.warn('Lỗi lưu', e);
      S.warn = 'Không lưu được (bộ nhớ đầy hoặc bị chặn). Hãy sao lưu file JSON trong Bảng phụ huynh.';
      return false;
    }
  };

  S.saveSoon = function () {
    clearTimeout(S._timer);
    S._timer = setTimeout(S.save, 400);
  };

  S.settings = () => S.data.settings;

  S.newProfile = function (o) {
    const p = {
      id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1000),
      name: o.name || 'Anna', grade: o.grade || 6, age: o.age || (o.grade === 8 ? 13 : 11),
      avatar: Object.assign({ hair: 'long', hairC: '#3e2723', skin: '#ffe0bd', outfit: 'basic' }, o.avatar || {}),
      created: Date.now()
    };
    migrateProfile(p);
    S.data.profiles.push(p);
    S.data.lastProfile = p.id;
    S.save();
    return p;
  };

  function migrateProfile(p) {
    const def = {
      level: 1, xp: 0, gold: 0, region: 'village', pos: null,
      quests: {}, flags: {}, items: {}, outfits: ['basic'], badges: {},
      vocab: {}, lessons: {}, topics: {}, mistakes: {},
      hist: [], diff: 1, streak: 0, bestStreak: 0,
      explored: {}, time: { total: 0, days: {} }, daily: {}, reviews: 0,
      placement: { done: false, score: 0 }, stats: { answers: 0, correct: 0, hints: 0 },
      tracked: null, lastPlayed: 0, dailyDone: {}, dailyCount: 0, book: null, schoolUnit: {}, customWords: []
    };
    for (const k in def) if (p[k] === undefined) p[k] = def[k];
    if (!p.avatar) p.avatar = { hair: 'long', hairC: '#3e2723', skin: '#ffe0bd', outfit: 'basic' };
    return p;
  }

  S.getProfile = id => S.data.profiles.find(p => p.id === id) || null;

  S.deleteProfile = function (id) {
    S.data.profiles = S.data.profiles.filter(p => p.id !== id);
    if (S.data.lastProfile === id) S.data.lastProfile = null;
    S.save();
  };

  S.resetProfile = function (id) {
    const p = S.getProfile(id);
    if (!p) return;
    const keep = { id: p.id, name: p.name, grade: p.grade, age: p.age, avatar: Object.assign({}, p.avatar, { outfit: 'basic' }), created: p.created };
    const idx = S.data.profiles.indexOf(p);
    S.data.profiles[idx] = migrateProfile(keep);
    S.save();
  };

  S.exportJSON = function () {
    return JSON.stringify(Object.assign({}, S.data, { exportedAt: new Date().toISOString() }), null, 1);
  };

  S.importJSON = function (text) {
    const d = JSON.parse(text);
    if (!valid(d)) throw new Error('File không đúng định dạng English Quest.');
    // lưu bản hiện tại làm dự phòng trước khi ghi đè
    try { if (S.ok) localStorage.setItem(BKEY, JSON.stringify(S.data)); } catch (e) { /* bỏ qua */ }
    d.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings || {});
    d.profiles.forEach(migrateProfile);
    S.data = d;
    S.save();
    return d;
  };

  S.restoreBackup = function () {
    try {
      const b = JSON.parse(localStorage.getItem(BKEY) || 'null');
      if (!valid(b)) return false;
      b.profiles.forEach(migrateProfile);
      S.data = b;
      localStorage.setItem(KEY, JSON.stringify(b));
      return true;
    } catch (e) { return false; }
  };

  S.hasBackup = function () {
    try { return valid(JSON.parse(localStorage.getItem(BKEY) || 'null')); } catch (e) { return false; }
  };

  S.download = function (filename, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };

  S.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  S.migrateProfile = migrateProfile;
  EQ.store = S;
  void U;
})();
