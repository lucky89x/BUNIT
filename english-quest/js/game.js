/* Bộ điều khiển chính: vòng lặp game, điều khiển, nhiệm vụ, tương tác, phần thưởng, thời gian */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const G = { profile: null, mode: 'menu', keys: {}, last: 0, session: 0, idle: 0, hudT: 0, saveT: 0, reviewT: 0 };
  const REGION_ORDER = ['village', 'forest', 'castle'];

  // ====================== Trạng thái nhiệm vụ ======================
  const Q = {
    st: (p, id) => p.quests[id] || null,
    isDone: (p, id) => !!(p.quests[id] && p.quests[id].done),
    isActive: (p, id) => !!(p.quests[id] && !p.quests[id].done),
    reqOk: (p, q) => q.requires.every(r => Q.isDone(p, r)),
    advUnlocked: p => p.diff >= 2.3 || p.level >= 7,
    available(p, id) {
      const q = EQ.QI[id];
      if (!q || p.quests[id]) return false;
      if (!Q.reqOk(p, q)) return false;
      if (q.advanced && !Q.advUnlocked(p)) return false;
      return true;
    },
    stage(p, id) { const s = p.quests[id]; if (!s || s.done) return null; return EQ.QI[id].stages[s.stage] || null; },
    active: p => EQ.QUESTS.filter(q => Q.isActive(p, q.id)),
    doneCount: p => EQ.QUESTS.filter(q => Q.isDone(p, q.id)).length
  };
  EQ.Q = Q;
  G.stageIs = (p, qid, type) => { const s = qid && Q.stage(p, qid); return !!(s && s.type === type); };
  G.need = function (p, n) {
    if (!n) return true;
    const [k, v] = n.split(':');
    if (k === 'boss') return !!p.flags['boss:' + v];
    if (k === 'item') return !!p.items[v];
    if (k === 'quest') return Q.isDone(p, v);
    return true;
  };

  // ====================== Khởi động ======================
  G.init = function () {
    EQ.store.load();
    EQ.ui.init();
    EQ.speech.init();
    G.canvas = document.getElementById('game');
    G.ctx = G.canvas.getContext('2d');
    G.ctx.imageSmoothingEnabled = false;
    G.bindInput();
    requestAnimationFrame(G.frame);
    EQ.screens.title();
    if (EQ.store.warn) setTimeout(() => EQ.ui.toast('⚠️ ' + EQ.store.warn, 'warn', 9000), 600);
    window.addEventListener('beforeunload', () => G.saveNow());
    document.addEventListener('visibilitychange', () => { if (document.hidden) G.saveNow(); });
    window.addEventListener('error', e => { console.error(e.error || e.message); G.saveNow(); });
  };

  G.startProfile = function (p) {
    G.profile = p;
    EQ.store.data.lastProfile = p.id;
    p._ageWord = U.numWord(p.age);
    EQ.rpg.ensure(p); EQ.rpg.dailyJobs(p); EQ.rpg.syncLook(p);
    EQ.learn.registerCustom(p);
    p.lastPlayed = Date.now();
    G.session = 0;
    const region = EQ.REGIONS[p.region] ? p.region : 'village';
    const pos = p.pos && p.pos.region === region ? p.pos : null;
    try { EQ.world.load(region, pos ? pos.x : null, pos ? pos.y : null, p); }
    catch (e) { console.error(e); p.region = 'village'; p.pos = null; EQ.world.load('village', null, null, p); }
    if (pos && EQ.world.collide(EQ.world.player.x, EQ.world.player.y)) EQ.world.load(region, null, null, p);
    G.mode = 'play';
    EQ.ui.buildHud();
    EQ.ui.hud.classList.remove('hidden');
    EQ.ui.updateHud();
    EQ.audio.music(EQ.REGIONS[region].music);
    EQ.ui.banner(EQ.REGIONS[region].name, EQ.REGIONS[region].en);
    G.checkBadges(p);
    G.saveNow();
    if (G.dailyAvailable(p)) setTimeout(() => EQ.ui.toast('⭐ Có Thử thách hôm nay! Mở Sổ từ vựng (phím N) để làm.', 'gold', 5000), 2500);
  };

  G.toMenu = function () {
    G.saveNow();
    G.mode = 'menu';
    EQ.ui.hud.classList.add('hidden');
    EQ.screens.title();
  };

  G.saveNow = function () {
    const p = G.profile;
    if (p && G.mode === 'play') {
      EQ.world.syncExplored(p);
      p.pos = { region: EQ.world.id, x: Math.floor(EQ.world.player.x / EQ.TILE), y: Math.floor((EQ.world.player.y - 4) / EQ.TILE) };
    }
    EQ.store.save();
  };

  // ====================== Điều khiển ======================
  const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down' };
  G.bindInput = function () {
    window.addEventListener('keydown', e => {
      EQ.audio.init();
      G.idle = 0;
      const tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { if (e.key === 'Escape') e.target.blur(); return; }
      if (KEYMAP[e.code]) { G.keys[KEYMAP[e.code]] = true; if (G.mode === 'play' && !EQ.ui.busy()) e.preventDefault(); }
      if (e.repeat) return;
      if (e.key === 'Escape') {
        if (EQ.ui.topEsc()) return;
        if (EQ.ui.dlgOpen) return;
        if (!EQ.ui.screen.classList.contains('hidden')) { if (EQ.screens.back) EQ.screens.back(); return; }
        if (G.mode === 'play') EQ.screens.pause();
        return;
      }
      // câu hỏi đang mở: phím số
      if (EQ.challenge._key && EQ.challenge.current && EQ.challenge._key(e)) { e.preventDefault(); return; }
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        if (EQ.ui.dlgOpen && EQ.ui._dlgKey) { if (EQ.ui._dlgKey()) e.preventDefault(); return; }
        if (G.mode === 'play' && !EQ.ui.busy() && (e.code === 'KeyE' || e.code === 'Space')) { e.preventDefault(); G.interact(); }
        return;
      }
      if (G.mode !== 'play' || EQ.ui.busy()) return;
      if (e.code === 'KeyI') EQ.screens.inventory();
      else if (e.code === 'KeyN') EQ.screens.notebook();
      else if (e.code === 'KeyQ') EQ.screens.quests();
      else if (e.code === 'KeyM') EQ.screens.map();
      else if (e.code === 'KeyB') EQ.screens.book();
      else if (e.code === 'KeyG') EQ.arcade.open();
    });
    window.addEventListener('keyup', e => { if (KEYMAP[e.code]) G.keys[KEYMAP[e.code]] = false; });
    window.addEventListener('blur', () => { G.keys = {}; });
    window.addEventListener('mousedown', () => { EQ.audio.init(); G.idle = 0; });
    // chạm vào bản đồ để tương tác (hỗ trợ chuột)
    document.getElementById('game').addEventListener('click', () => { if (G.mode === 'play' && !EQ.ui.busy() && EQ.world.target) G.interact(); });
  };

  // ====================== Vòng lặp ======================
  G.frame = function (ts) {
    const dt = Math.min(0.05, (ts - (G.last || ts)) / 1000);
    G.last = ts;
    if (G.mode === 'play' && G.profile) {
      const p = G.profile;
      const busy = EQ.ui.busy() || G.lock;
      if (!busy) EQ.world.update(dt, G.keys, p);
      else { EQ.world.t += dt; EQ.world.player.moving = false; }
      EQ.world.tickFade(dt);
      EQ.world.render(G.ctx, p);
      G.hudT += dt;
      if (G.hudT > 0.25) {
        G.hudT = 0;
        EQ.ui.updateHud();
        if (EQ.ui.hudEls) EQ.world.drawMap(EQ.ui.hudEls.mini, p, 4, { detail: true });
      }
      // thời gian học (không tính khi bỏ máy quá 2 phút)
      G.idle += dt;
      if (!document.hidden && G.idle < 120) {
        p.time.total += dt;
        const d = U.today();
        p.time.days[d] = (p.time.days[d] || 0) + dt;
        G.session += dt;
      }
      const bm = EQ.store.settings().breakMin;
      if (bm > 0 && G.session >= bm * 60 && !EQ.ui.busy()) { G.session = 0; EQ.screens.breakTime(); }
      G.saveT += dt;
      if (G.saveT > 15) { G.saveT = 0; G.saveNow(); }
    } else if (G.mode === 'menu') {
      EQ.screens.drawTitleBg && EQ.screens.drawTitleBg(G.ctx, ts / 1000);
    }
    requestAnimationFrame(G.frame);
  };

  G.canStartBattle = () => G.mode === 'play' && !EQ.ui.busy() && !G.lock;

  // ====================== Tương tác ======================
  G.interact = async function () {
    const e = EQ.world.target;
    if (!e || G.lock) return;
    G.lock = true;
    try {
      if (e.kind === 'npc' || e.kind === 'boss') await G.talkTo(e);
      else if (e.kind === 'pickup') await G.pickup(e);
      else if (e.kind === 'chest') await G.openChest(e);
      else if (e.kind === 'gate') await G.useGate(e);
      else if (e.kind === 'sign') await EQ.ui.dialog([{ s: 'npc', en: e.en, vi: e.vi }], { name: 'Biển báo', e: '🪧' });
    } catch (err) { console.error(err); EQ.ui.toast('Có lỗi nhỏ xảy ra, game đã tự lưu. Hãy thử lại nhé!', 'warn'); }
    G.lock = false;
    EQ.world.refresh(G.profile);
    G.saveNow();
  };

  function speaker(e) {
    if (e.kind === 'boss') { const d = EQ.BOSSES[e.boss]; return { name: e.name, e: { slime: '🟢', mush: '🍄', golem: '🗿', star: '⭐' }[d.draw] || '👾' }; }
    return { name: e.name, look: e.look, e: e.e };
  }
  const pip = vi => EQ.ui.dialog([{ s: 'pip', vi }], null);
  G.pip = pip;

  G.talkTo = async function (e) {
    const p = G.profile;
    const sp = speaker(e);
    // 1. bước nhiệm vụ đang chờ ở NPC này
    for (const q of Q.active(p)) {
      const s = Q.stage(p, q.id);
      if (!s) continue;
      if (s.npc === e.id && ['talk', 'quiz', 'shop', 'boss'].indexOf(s.type) >= 0) return G.runStage(q, s, e, sp);
      if (s.type === 'boss' && e.kind === 'boss' && s.boss === e.boss) return G.runStage(q, s, e, sp);
    }
    // 2. nhiệm vụ mới
    const offer = EQ.QUESTS.find(q => q.giver === e.id && Q.available(p, q.id));
    if (offer) return G.offerQuest(offer, e, sp);
    // 3. trùm nhưng chưa đủ điều kiện
    if (e.kind === 'boss') {
      const bq = EQ.QUESTS.find(q => q.giver === e.id);
      const miss = bq ? bq.requires.filter(r => !Q.isDone(p, r)).map(r => '• ' + EQ.QI[r].title) : [];
      await EQ.ui.dialog([{ s: 'npc', en: 'Go away! You are not ready.', vi: 'Đi đi! Ngươi chưa sẵn sàng đâu.' }], sp);
      return pip('Mình cần hoàn thành thêm các nhiệm vụ này trước:\n' + miss.join('\n'));
    }
    // 4. nhắc nhiệm vụ đang làm
    const mine = Q.active(p).find(q => q.giver === e.id);
    if (mine) {
      const s = Q.stage(p, mine.id);
      return EQ.ui.dialog([{ s: 'npc', en: s.objEn || 'Good luck!', vi: s.objEn ? s.obj : 'Chúc may mắn!' }, { s: 'pip', vi: 'Nhiệm vụ "' + mine.title + '": ' + s.obj + '.' }], sp);
    }
    // 5a. tiệm trang sức, bảng nhiệm vụ, tháp thử thách
    if (e.jeweler) return EQ.rpgui.jeweler(sp);
    if (e.jobs) return EQ.rpgui.jobs();
    if (e.tower) return EQ.rpgui.tower(sp);
    if (e.game) return EQ.arcade.booth(e.game);
    // 5. cô giáo dạy theo sách
    if (e.book) {
      await EQ.ui.dialog([{ s: 'npc', en: 'Hello! What unit are you studying at school?', vi: 'Chào em! Ở lớp em đang học Unit mấy?' }], sp);
      return EQ.screens.book();
    }
    // 5b. cửa hàng
    if (e.shop) return EQ.screens.shop(e, sp);
    // 6. trò chuyện + ôn tập tự nhiên
    const idle = (e.idle || [{ en: 'Hello!', vi: 'Xin chào!' }]);
    await EQ.ui.dialog([U.pick(idle)], sp);
    if (e.sage && !Q.advUnlocked(p)) await pip('Khi bạn trả lời đúng nhiều hơn, Nhà hiền triết Sao sẽ mở thử thách nâng cao dành riêng cho bạn!');
    const due = EQ.learn.dueIds(p);
    if (due.length && Date.now() - G.reviewT > 45000 && Math.random() < 0.7) {
      G.reviewT = Date.now();
      const w = EQ.learn.pickWords(p, 1, x => due.indexOf(x.id) >= 0)[0];
      if (w) {
        await EQ.ui.dialog([{ s: 'npc', en: 'Do you remember this word?', vi: 'Cháu còn nhớ từ này không?' }], sp);
        const mode = U.pick(EQ.learn.wordModes(p));
        const r = await EQ.challenge.run([EQ.learn.wordQ(p, w, mode)], { title: 'Ôn tập nhanh', icon: '🔁', retry: true });
        if (r.completed) G.reward(p, { xp: 6, gold: 1 });
      }
    }
  };

  G.offerQuest = async function (q, e, sp) {
    const p = G.profile;
    await EQ.ui.dialog(q.intro || [], sp);
    const ok = await EQ.challenge.teach(p, q.teach);
    if (ok === false) return;
    p.quests[q.id] = { stage: 0, got: {}, started: Date.now() };
    p.tracked = q.id;
    EQ.audio.sfx('open');
    EQ.ui.toast('📜 Nhiệm vụ mới: ' + q.title, 'good');
    EQ.world.refresh(p);
    const s = Q.stage(p, q.id);
    if (s && (s.npc === e.id || (s.type === 'boss' && e.kind === 'boss'))) return G.runStage(q, s, e, sp);
  };

  G.runStage = async function (q, s, e, sp) {
    const p = G.profile;
    if (s.type === 'talk') {
      await EQ.ui.dialog(s.script, sp);
      return G.advance(q);
    }
    if (s.type === 'quiz') {
      await EQ.ui.dialog([{ s: 'npc', en: 'Are you ready?', vi: 'Cháu sẵn sàng chưa?' }], sp);
      const qs = EQ.learn.quizFromGen(p, s.gen);
      const r = await EQ.challenge.run(qs, { title: s.title || q.title, icon: '📝', mastery: true });
      if (!r.completed) return pip('Không sao, lúc nào sẵn sàng thì quay lại nhé!');
      await EQ.ui.dialog(s.script || [], sp);
      return G.advance(q);
    }
    if (s.type === 'shop') {
      const done = await EQ.screens.marketQuest(q, s, sp);
      if (done) return G.advance(q);
      return;
    }
    if (s.type === 'boss') {
      const def = EQ.BOSSES[s.boss];
      // phải thật sự thuộc từ của vùng mới được đấu trùm
      if (def.mastery) {
        const m = EQ.learn.regionMastery(p, def.mastery.region);
        const need = Math.ceil(m.total * def.mastery.need);
        if (m.ok < need) {
          await EQ.ui.dialog([{ s: 'npc', en: 'Ha! You do not know my words yet!', vi: 'Ha! Ngươi chưa thuộc các từ của ta đâu!' }], sp);
          await pip('Để đấu với ' + def.name + ', bạn cần thuộc ít nhất ' + need + ' từ của ' + EQ.REGIONS[def.mastery.region].name +
            ' (mức "Đang nhớ" trở lên). Hiện bạn đã thuộc ' + m.ok + '/' + m.total + ' từ.\nMỗi từ cần trả lời đúng ngay lần đầu ít nhất 2 lần.');
          if (await EQ.ui.confirm('Luyện ngay 8 từ bạn chưa thuộc của vùng này?', { yes: '📒 Luyện ngay', no: 'Để sau' })) await G.drill(def.mastery.region);
          return;
        }
        if (def.mastery.region === 'village') G.award(p, 'master_village');
      }
      const res = await EQ.battle.start({ def, hp: def.hp, name: def.name, boss: !def.hard, hard: def.hard, spec: { regions: def.regions, lessons: def.lessons, types: def.types, hard: def.hard } });
      if (res === 'win') {
        p.flags['boss:' + s.boss] = true;
        EQ.world.refresh(p);
        const c = e ? EQ.world.entCenter(e) : { x: EQ.world.player.x, y: EQ.world.player.y };
        EQ.world.burst(c.x, c.y - 20, ['#ffd54f', '#ff80ab', '#80d8ff', '#b9f6ca'], 40);
        return G.advance(q);
      }
      if (res === 'rest') return pip('Hãy mở Sổ từ vựng (phím N) và bấm "Ôn tập nhanh" để luyện thêm, rồi quay lại nhé. Bạn làm được mà!');
      return pip('Bạn có thể quay lại thử thách bất cứ lúc nào.');
    }
  };

  G.advance = async function (q) {
    const p = G.profile;
    const st = p.quests[q.id];
    st.stage++;
    st.got = {};
    if (st.stage >= q.stages.length) return G.complete(q);
    EQ.world.refresh(p);
    const s = Q.stage(p, q.id);
    EQ.ui.toast('✅ Tiếp theo: ' + s.obj, 'good');
  };

  G.complete = async function (q) {
    const p = G.profile;
    const st = p.quests[q.id];
    st.done = true; st.doneAt = Date.now();
    if (p.tracked === q.id) p.tracked = null;
    EQ.audio.sfx('victory');
    EQ.ui.banner('🏆 Hoàn thành nhiệm vụ!', q.title, 'gold');
    EQ.world.burst(EQ.world.player.x, EQ.world.player.y - 30, ['#ffd54f', '#fff59d', '#ff80ab'], 30);
    await U.sleep(400);
    await G.reward(p, q.reward || {});
    G.award(p, 'first_quest');
    EQ.world.refresh(p);
    G.saveNow();
    if (q.id === 'c_boss') { await U.sleep(300); await EQ.screens.chapterEnd(); }
  };

  // ====================== Luyện từ & thử thách hôm nay ======================
  // luyện các từ chưa thuộc (ưu tiên từ yếu nhất), phải đúng ngay lần đầu
  G.drill = async function (region) {
    const p = G.profile;
    let ids = region ? EQ.learn.regionMastery(p, region).weak : EQ.learn.learnedIds(p).filter(id => p.vocab[id].box < 2);
    if (!ids.length) ids = EQ.learn.learnedIds(p).filter(id => !region || EQ.V[id].r === region);
    ids = U.shuffle(ids).sort((a, b) => p.vocab[a].box - p.vocab[b].box).slice(0, 8);
    if (!ids.length) return EQ.ui.toast('Chưa có từ nào để luyện.', 'warn');
    const modes = EQ.learn.wordModes(p);
    const qs = ids.map(id => EQ.learn.wordQ(p, EQ.V[id], U.pick(modes)));
    const r = await EQ.challenge.run(qs, { title: 'Luyện từ' + (region ? ': ' + EQ.REGIONS[region].name : ''), icon: '📒', mastery: true });
    if (r.completed) {
      p.reviews++; EQ.rpg.count(p, 'review');
      await G.reward(p, { xp: 8 + r.correct * 2, gold: 2 });
      if (region) { const m = EQ.learn.regionMastery(p, region); EQ.ui.toast('📒 ' + EQ.REGIONS[region].name + ': đã thuộc ' + m.ok + '/' + m.total + ' từ', 'good', 4000); }
      G.checkBadges(p);
    }
    G.saveNow();
    return r;
  };
  G.drillIds = async function (ids, title) {
    const p = G.profile;
    ids = U.shuffle(ids.filter(id => p.vocab[id])).sort((a, b) => p.vocab[a].box - p.vocab[b].box || p.vocab[a].due - p.vocab[b].due).slice(0, 8);
    if (!ids.length) return;
    const modes = EQ.learn.wordModes(p);
    const qs = ids.map(id => EQ.learn.wordQ(p, EQ.V[id], U.pick(modes)));
    const r = await EQ.challenge.run(qs, { title: 'Ôn: ' + title, icon: '🔁', mastery: true });
    if (r.completed) { p.reviews++; EQ.rpg.count(p, 'review'); await G.reward(p, { xp: 8 + r.correct * 2, gold: 2 }); G.checkBadges(p); }
    G.saveNow();
  };
  G.dailyAvailable = p => !(p.dailyDone || {})[U.today()] && EQ.learn.learnedIds(p).length >= 8;
  G.dailyChallenge = async function () {
    const p = G.profile;
    if (!G.dailyAvailable(p)) return EQ.ui.toast('Hôm nay bạn đã hoàn thành thử thách rồi. Hẹn gặp lại ngày mai!', 'good');
    const ws = EQ.learn.pickWords(p, 6);
    const modes = EQ.learn.wordModes(p);
    const qs = ws.map(w => EQ.learn.wordQ(p, w, U.pick(modes)));
    const lessons = Object.keys(p.lessons);
    if (lessons.length) { const g = EQ.learn.grammarQ(p, lessons); if (g) qs.push(g); const o = EQ.learn.orderQ(p, lessons); if (o) qs.push(o); }
    const r = await EQ.challenge.run(U.shuffle(qs), { title: 'Thử thách hôm nay', icon: '⭐', mastery: true });
    if (r.completed) {
      p.dailyDone = p.dailyDone || {};
      p.dailyDone[U.today()] = true;
      p.dailyCount = (p.dailyCount || 0) + 1; EQ.rpg.count(p, 'review');
      await G.reward(p, { xp: 30, gold: 10 });
      EQ.ui.banner('⭐ Xong thử thách hôm nay!', 'Hẹn gặp lại ngày mai nhé', 'gold');
      if (p.dailyCount >= 5) G.award(p, 'daily5');
    }
    G.saveNow();
  };

  // ====================== Nhặt đồ ======================
  G.pickup = async function (e) {
    const p = G.profile;
    const s = Q.stage(p, e.quest);
    if (!s || s.type !== 'collect') return;
    const st = p.quests[e.quest];
    if (!e.good) {
      EQ.audio.sfx('wrong');
      const ent = { name: 'Pip (tinh linh)', e: '🧚' };
      return EQ.ui.dialog([{ s: 'npc', en: e.wrong.en, vi: e.wrong.vi }], ent);
    }
    const item = e.item || 'x';
    if (s.need && (st.got[item] || 0) >= s.need[item]) return pip('Bạn đã có đủ ' + e.label + ' rồi. Hãy tìm thứ còn thiếu nhé!');
    p.flags['pick:' + e.id] = true;
    st.got[item] = (st.got[item] || 0) + 1;
    EQ.audio.sfx('pick');
    const c = EQ.world.entCenter(e);
    EQ.world.burst(c.x, c.y - 10, ['#fff59d', '#ffffff', '#ffd54f'], 14);
    EQ.world.atPlayer('+1 ' + e.label, '#fff59d');
    EQ.speech.speak(e.label);
    EQ.world.refresh(p);
    const done = s.need ? Object.keys(s.need).every(k => (st.got[k] || 0) >= s.need[k]) : (st.got[item] >= s.count);
    if (done) {
      await U.sleep(500);
      const giver = EQ.QI[e.quest].giver;
      const gname = (EQ.world.def.entities.find(x => x.id === giver) || {}).name || '';
      await pip('Đủ rồi! Mang về cho ' + gname + ' nhé. Mũi tên vàng sẽ chỉ đường cho bạn.');
      G.advance(EQ.QI[e.quest]);
    }
  };

  // ====================== Rương ======================
  G.openChest = async function (e) {
    const p = G.profile;
    if (p.flags['chest:' + e.id]) return pip('Rương này đã được mở rồi.');
    const activeStage = e.quest && G.stageIs(p, e.quest, 'chest') && Q.stage(p, e.quest).chest === e.id;
    if (e.quest && !activeStage) {
      const q = EQ.QI[e.quest];
      const giver = EQ.world.def.entities.find(x => x.id === q.giver);
      return pip('Rương bị khóa bằng phép thuật.' + (giver ? ' Có lẽ ' + giver.name + ' biết cách mở.' : ''));
    }
    if (e.puzzle === 'listen') {
      const words = U.shuffle(e.words.filter(id => p.vocab[id] && EQ.V[id].pic)).slice(0, 3);
      const qs = words.map(id => EQ.learn.wordQ(p, EQ.V[id], 'listen'));
      const r = await EQ.challenge.run(qs, {
        title: 'Khóa âm thanh', icon: '🔐', mastery: true,
        en: 'Listen and choose the right picture.', vi: EQ.speech.available() ? 'Nghe từ tiếng Anh và chọn hình đúng.' : 'Máy chưa có giọng đọc, nên bạn hãy đọc từ và chọn hình đúng.'
      });
      if (!r.completed) return;
    }
    p.flags['chest:' + e.id] = true;
    EQ.audio.sfx('chest');
    const c = EQ.world.entCenter(e);
    EQ.world.burst(c.x, c.y - 14, ['#ffd54f', '#fff59d', '#ffca28', '#ffffff'], 30, { up: 80 });
    await U.sleep(300);
    await EQ.ui.alert(U.esc(e.msg || 'Bạn đã mở rương!'), { icon: '🎁', title: 'Mở rương!' });
    await G.reward(p, e.reward || {});
    if (e.secret) G.award(p, 'explorer');
    if (activeStage) await G.advance(EQ.QI[e.quest]);
  };

  // ====================== Cổng phép thuật ======================
  G.useGate = async function (e) {
    const p = G.profile;
    const q = EQ.QI[e.quest];
    if (!G.stageIs(p, e.quest, 'gate')) {
      const giver = EQ.world.def.entities.find(x => x.id === q.giver);
      return pip('Cánh cổng bị khóa bằng phép thuật ngôn ngữ.' + (giver ? ' Hãy nói chuyện với ' + giver.name + ' trước nhé.' : ''));
    }
    const lessons = Array.isArray(e.lesson) ? e.lesson : [e.lesson];
    await EQ.challenge.teach(p, { lesson: lessons });
    const n = e.n + (p.diff >= 2.2 ? 1 : 0);
    const qs = EQ.learn.gateQuestions(p, lessons, n);
    const r = await EQ.challenge.run(qs, { title: e.title, icon: '🚪', en: e.en, vi: e.vi, mastery: true });
    if (!r.completed) return pip('Cánh cổng vẫn đang chờ bạn. Quay lại bất cứ lúc nào!');
    p.flags['open:' + e.id] = true;
    EQ.audio.sfx('open');
    const c = EQ.world.entCenter(e);
    EQ.world.burst(c.x, c.y - 14, ['#b388ff', '#80d8ff', '#ffffff'], 36, { up: 60 });
    EQ.ui.banner('🔓 Cánh cổng đã mở!', e.title);
    EQ.world.refresh(p);
    await G.advance(q);
  };

  // ====================== Quái vật ======================
  G.startMonsterBattle = async function (m) {
    const p = G.profile;
    G.lock = true;
    EQ.audio.sfx('bump');
    const res = await EQ.battle.start({ def: m.def, color: m.color, hp: m.def.hp, name: m.def.name, matk: m.def.matk, boss: false, spec: {} });
    if (res === 'win') {
      EQ.world.removeMonster(m);
      EQ.world.burst(m.x, m.y - 10, [m.color, '#ffffff', '#fff59d'], 24);
      await G.reward(p, { xp: m.def.xp, gold: m.def.gold });
      EQ.rpg.count(p, 'kill');
      // quái tinh anh có thể rơi trang bị (tỉ lệ tăng theo May mắn)
      if (m.def.elite && Math.random() * 100 < 20 + EQ.rpg.stats(p).luck / 3) {
        const cand = EQ.rpg.GEAR.filter(it => it.tier <= 2 && p.gear.owned[it.id] == null);
        if (cand.length) { const it = U.pick(cand); EQ.rpg.give(p, it.id); await EQ.ui.alert('Quái tinh anh để lại: <b>' + it.e + ' ' + U.esc(it.name) + '</b>!<br>Vào 🎒 Trang bị để mặc vào nhé.', { icon: '🎁', title: 'Rơi đồ!' }); }
      }
    } else {
      // đẩy quái vật ra xa một chút
      const a = Math.atan2(m.y - EQ.world.player.y, m.x - EQ.world.player.x);
      for (let k = 0; k < 10; k++) { const nx = m.x + Math.cos(a) * 6, ny = m.y + Math.sin(a) * 6; if (!EQ.world.collide(nx, ny)) { m.x = nx; m.y = ny; } }
      EQ.world.battleCooldown = 4;
      if (res === 'rest') EQ.ui.toast('📒 Mẹo: mở Sổ từ vựng (N) → "Ôn tập nhanh".', 'good', 4000);
    }
    G.lock = false;
    G.saveNow();
  };

  // ====================== Cổng dịch chuyển ======================
  G.usePortal = function (e) {
    const p = G.profile;
    const W = EQ.world;
    if (e.to === 'harbor') {
      pushBack(e);
      if (!G.need(p, e.need)) return EQ.ui.toast('🔒 ' + e.lockedVi, 'warn', 3500);
      return EQ.screens.comingSoon();
    }
    if (!G.need(p, e.need)) { pushBack(e); return EQ.ui.toast('🔒 ' + (e.lockedVi || 'Chưa đi qua được.'), 'warn', 3500); }
    G.lock = true;
    EQ.audio.sfx('portal');
    W.transition(() => {
      G.saveNow();
      p.region = e.to;
      W.load(e.to, e.tx, e.ty, p);
      EQ.audio.music(EQ.REGIONS[e.to].music);
      EQ.ui.banner(EQ.REGIONS[e.to].name, EQ.REGIONS[e.to].en);
      G.lock = false;
      G.saveNow();
    });
  };
  function pushBack(e) {
    const W = EQ.world;
    W.player.x = (e.x + (e.x === 0 ? 1.5 : -0.5)) * EQ.TILE;
    W.player.y = (e.y + 0.75) * EQ.TILE;
    W.portalCooldown = 0.5;
  }

  // ====================== Phần thưởng ======================
  G.xpNeed = lv => 50 + lv * 40;
  G.reward = async function (p, r, quiet) {
    r = r || {};
    const lines = [];
    if (r.xp) {
      p.xp += r.xp; lines.push('+' + r.xp + ' XP');
      if (G.mode === 'play' && !quiet) EQ.world.atPlayer('+' + r.xp + ' XP', '#b9f6ca');
      while (p.xp >= G.xpNeed(p.level)) {
        p.xp -= G.xpNeed(p.level); p.level++;
        EQ.audio.sfx('level');
        EQ.ui.banner('⭐ Lên cấp ' + p.level + '!', 'Phép thuật của bạn mạnh hơn rồi!', 'gold');
        if (G.mode === 'play') EQ.world.burst(EQ.world.player.x, EQ.world.player.y - 30, ['#ffd54f', '#fff59d', '#ffffff'], 40);
      }
    }
    if (r.gold && EQ.rpg) r = Object.assign({}, r, { gold: Math.round(r.gold * (1 + EQ.rpg.stats(p).luck / 100)) });
    if (r.gold) { p.gold += r.gold; lines.push('+' + r.gold + ' 🪙'); EQ.audio.sfx('coin'); if (G.mode === 'play' && !quiet) setTimeout(() => EQ.world.atPlayer('+' + r.gold + ' 🪙', '#ffd54f'), 250); }
    if (r.items) for (const k in r.items) {
      p.items[k] = (p.items[k] || 0) + r.items[k];
      const it = EQ.ITEMS[k];
      if (it) { lines.push(it.e + ' ' + it.name + (r.items[k] > 1 ? ' x' + r.items[k] : '')); EQ.ui.toast('🎁 Nhận được: ' + it.e + ' ' + it.name, 'good', 3500); }
    }
    if (r.outfit && p.outfits.indexOf(r.outfit) < 0) {
      p.outfits.push(r.outfit);
      EQ.ui.toast('👗 Mở khóa trang phục: ' + EQ.OUTFITS[r.outfit].name + ' (Túi đồ → Tủ đồ)', 'good', 4500);
    }
    if (r.badge) G.award(p, r.badge);
    if (EQ.ui.hudEls) EQ.ui.updateHud();
    EQ.store.saveSoon();
    return lines;
  };

  G.award = function (p, id) {
    if (!EQ.BADGES[id] || p.badges[id]) return;
    p.badges[id] = Date.now();
    const b = EQ.BADGES[id];
    setTimeout(() => { EQ.audio.sfx('chest'); EQ.ui.toast('🏅 Huy hiệu mới: ' + b.e + ' ' + b.name, 'gold', 4500); }, 600);
  };
  G.checkBadges = function (p) {
    const n = EQ.learn.learnedIds(p).length;
    if (n >= 10) G.award(p, 'words10');
    if (n >= 50) G.award(p, 'words50');
    if (n >= 100) G.award(p, 'words100');
    if (EQ.learn.summary(p).strong >= 20) G.award(p, 'master20');
    if (p.bestStreak >= 10) G.award(p, 'streak10');
    if (Object.keys(p.time.days).filter(d => p.time.days[d] > 60).length >= 3) G.award(p, 'days3');
    if (p.reviews >= 5) G.award(p, 'review');
  };
  G.afterLearn = function () {
    const p = G.profile;
    const d = p.daily[U.today()];
    if (d && d.newWords > 30 && !d.warned) {
      d.warned = true;
      setTimeout(() => EQ.ui.toast('🧠 Hôm nay bạn đã học hơn 30 từ mới. Giỏi quá! Hãy ôn lại trong Sổ từ vựng trước khi học thêm nhé.', 'good', 6000), 800);
    }
    G.checkBadges(p);
  };

  // ====================== Chỉ đường nhiệm vụ ======================
  G.marker = function (p, e) {
    for (const q of Q.active(p)) {
      const s = Q.stage(p, q.id);
      if (!s) continue;
      if (s.npc === e.id && ['talk', 'quiz', 'shop', 'boss'].indexOf(s.type) >= 0) return '?';
      if (e.kind === 'boss' && s.type === 'boss' && s.boss === e.boss) return '?';
    }
    if (EQ.QUESTS.some(q => q.giver === e.id && Q.available(p, q.id))) return '!';
    return null;
  };

  function currentQuest(p) {
    if (p.tracked && Q.isActive(p, p.tracked)) return EQ.QI[p.tracked];
    const act = Q.active(p);
    return act.find(q => q.region === p.region) || act[0] || null;
  }

  function stageTargetInRegion(p, q, s) {
    const W = EQ.world;
    const ents = W.def.entities;
    if (s.npc) return ents.find(e => e.id === s.npc && W.entVisible(e, p)) || null;
    if (s.type === 'collect') {
      const st = p.quests[q.id];
      const goods = W.ents.filter(e => e.kind === 'pickup' && e.quest === q.id && e.good && (!s.need || (st.got[e.item] || 0) < s.need[e.item]));
      let best = null, bd = 1e9;
      goods.forEach(e => { const d = U.dist(e.x, e.y, W.player.x / EQ.TILE, W.player.y / EQ.TILE); if (d < bd) { bd = d; best = e; } });
      return best;
    }
    if (s.type === 'gate') return ents.find(e => e.id === s.gate) || null;
    if (s.type === 'chest') return ents.find(e => e.id === s.chest) || null;
    if (s.type === 'boss') return ents.find(e => e.kind === 'boss' && e.boss === s.boss) || null;
    return null;
  }
  function portalToward(p, region) {
    const cur = REGION_ORDER.indexOf(p.region), dst = REGION_ORDER.indexOf(region);
    if (cur < 0 || dst < 0 || cur === dst) return null;
    const next = REGION_ORDER[cur + (dst > cur ? 1 : -1)];
    return EQ.world.def.entities.find(e => e.kind === 'portal' && e.to === next) || null;
  }

  G.questTarget = function (p) {
    if (!p || !EQ.world.def) return null;
    const q = currentQuest(p);
    if (q) {
      const s = Q.stage(p, q.id);
      if (!s) return null;
      // NPC của bước có thể ở vùng khác
      let region = q.region;
      if (s.npc) { for (const r of REGION_ORDER) if (EQ.REGIONS[r].entities.some(e => e.id === s.npc)) { region = r; break; } }
      if (region !== p.region) return portalToward(p, region);
      return stageTargetInRegion(p, q, s);
    }
    // gợi ý người đang có nhiệm vụ mới gần nhất trong vùng
    const W = EQ.world;
    const givers = W.ents.filter(e => (e.kind === 'npc' || e.kind === 'boss') && EQ.QUESTS.some(x => x.giver === e.id && Q.available(p, x.id) && !x.advanced));
    if (givers.length) return givers[0];
    // tất cả đã xong trong vùng → chỉ tới vùng tiếp theo nếu có nhiệm vụ ở đó
    const nextQ = EQ.QUESTS.find(x => Q.available(p, x.id) && !x.advanced);
    if (nextQ && nextQ.region !== p.region) return portalToward(p, nextQ.region);
    return null;
  };

  G.trackedInfo = function (p) {
    const q = currentQuest(p);
    if (!q) {
      const t = G.questTarget(p);
      if (t && t.kind !== 'portal') return { title: 'Gợi ý', obj: 'Nói chuyện với ' + t.name + ' (có dấu ❗)', progress: '' };
      if (t && t.kind === 'portal') return { title: 'Gợi ý', obj: 'Đi tới ' + EQ.REGIONS[t.to].name, progress: '' };
      return null;
    }
    const s = Q.stage(p, q.id);
    if (!s) return null;
    let progress = '';
    if (s.type === 'collect') {
      const st = p.quests[q.id];
      if (s.need) progress = '(' + Object.keys(s.need).map(k => (st.got[k] || 0) + '/' + s.need[k]).join(', ') + ')';
      else progress = '(' + (st.got.x || 0) + '/' + s.count + ')';
    }
    return { title: q.title, obj: s.obj, en: s.objEn, progress };
  };

  EQ.game = G;
  window.addEventListener('DOMContentLoaded', () => G.init());
})();
