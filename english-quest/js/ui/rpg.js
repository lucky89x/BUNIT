/* ENGLISH QUEST – Giao diện tiệm trang sức, trang bị, Bảng nhiệm vụ, Tháp Thử Thách (bản 1.4) */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const R = EQ.rpg;
  const UI = {};

  function statLine(s, cls) {
    const parts = [];
    if (s.atk) parts.push('⚔️ +' + s.atk);
    if (s.hp) parts.push('❤️ +' + s.hp);
    if (s.def) parts.push('🛡️ +' + s.def + '%');
    if (s.luck) parts.push('🍀 +' + s.luck + '%');
    return el('div', { class: 'g-stats ' + (cls || '') }, parts.join('   '));
  }
  function statPanel(p) {
    const s = R.stats(p);
    return el('div', { class: 'g-panel' }, [
      el('div', { class: 'g-prev' }, EQ.screens.avatarCanvas(p.avatar, 150)),
      el('div', { class: 'g-power' }, ['💪 Lực chiến ', el('b', null, String(R.power(p)))]),
      el('div', { class: 'g-statgrid' }, [
        el('div', null, ['⚔️ Sức mạnh', el('b', null, String(s.atk))]),
        el('div', null, ['❤️ Máu', el('b', null, String(s.hp))]),
        el('div', null, ['🛡️ Phòng thủ', el('b', null, s.def + '%')]),
        el('div', null, ['🍀 May mắn', el('b', null, '+' + s.luck + '%')])
      ]),
      el('div', { class: 'muted small' }, '⚔️ = sát thương mỗi câu đúng • 🛡️ = cơ hội chặn đòn khi trả lời sai • 🍀 = vàng nhận thêm'),
      el('div', { class: 'g-gold' }, '🪙 ' + p.gold + ' vàng')
    ]);
  }
  function itemCard(p, it, mode, redraw) {
    const lv = p.gear.owned[it.id];
    const owned = lv != null;
    const equipped = p.gear.eq[it.slot] === it.id;
    const btns = [];
    if (!owned) btns.push(el('button', { class: 'btn primary small', disabled: p.gold < it.price, onclick: () => { const r = R.buy(p, it.id); if (r.ok) { EQ.audio.sfx('coin'); EQ.ui.toast('🛍️ Đã mua ' + it.name + (p.gear.eq[it.slot] === it.id ? ' và mặc vào' : ''), 'good'); EQ.game.saveNow(); } else EQ.ui.toast(r.msg, 'warn'); redraw(); } }, 'Mua ' + it.price + ' 🪙'));
    else {
      btns.push(el('button', { class: 'btn small ' + (equipped ? '' : 'primary'), onclick: () => { R.equip(p, it.id); EQ.audio.sfx('open'); EQ.game.saveNow(); redraw(); } }, equipped ? 'Tháo ra' : 'Mặc vào'));
      if (lv < 5) btns.push(el('button', { class: 'btn small', disabled: p.gold < R.upCost(it, lv), onclick: () => { const r = R.upgrade(p, it.id); if (r.ok) { EQ.audio.sfx('level'); EQ.ui.toast('✨ ' + it.name + ' +' + r.lv + '!', 'gold'); EQ.game.saveNow(); } else EQ.ui.toast(r.msg, 'warn'); redraw(); } }, '⬆️ +' + (lv + 1) + ' (' + R.upCost(it, lv) + ' 🪙)'));
      else btns.push(el('span', { class: 'g-max' }, 'TỐI ĐA'));
    }
    void mode;
    return el('div', { class: 'g-item' + (equipped ? ' eq' : '') + (owned ? ' owned' : ''), style: { borderColor: R.TIER_COL[it.tier] } }, [
      el('div', { class: 'g-top' }, [el('span', { class: 'g-e' }, it.e), el('div', null, [el('div', { class: 'g-name' }, it.name + (owned && lv ? ' +' + lv : '')), el('div', { class: 'g-tier', style: { color: R.TIER_COL[it.tier] } }, R.TIERS[it.tier] + ' • ' + R.SLOTS[it.slot].name)])]),
      statLine(R.itemStats(it, lv || 0)),
      el('div', { class: 'g-desc' }, it.desc),
      el('div', { class: 'row tight' }, btns)
    ]);
  }

  // ---------- Tiệm trang sức ----------
  UI.jeweler = async function (sp) {
    const p = EQ.game.profile; R.ensure(p);
    if (sp) await EQ.ui.dialog([{ s: 'npc', en: 'Welcome to my jewellery shop! What do you like?', vi: 'Chào mừng đến tiệm trang sức! Cháu thích món nào?' }], sp);
    return UI.gearScreen('shop');
  };
  UI.gearScreen = function (tab) {
    const p = EQ.game.profile; R.ensure(p);
    tab = tab || 'mine';
    let slot = 'weapon';
    const body = el('div', { class: 'gearview' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'tabs' }, [['shop', '💎 Tiệm trang sức'], ['mine', '🎒 Trang bị của tôi']].map(t => el('button', { class: 'tab' + (tab === t[0] ? ' on' : ''), onclick: () => { tab = t[0]; draw(); } }, t[1]))));
      const right = el('div', { class: 'g-right' });
      if (tab === 'shop') {
        right.appendChild(el('div', { class: 'tabs small' }, Object.keys(R.SLOTS).map(s => el('button', { class: 'tab' + (slot === s ? ' on' : ''), onclick: () => { slot = s; draw(); } }, R.SLOTS[s].icon + ' ' + R.SLOTS[s].name))));
        right.appendChild(el('div', { class: 'g-list' }, R.GEAR.filter(it => it.slot === slot).map(it => itemCard(p, it, 'shop', draw))));
      } else {
        right.appendChild(el('div', { class: 'g-slots' }, Object.keys(R.SLOTS).map(s => {
          const id = p.gear.eq[s], it = id && R.GI[id];
          return el('div', { class: 'g-slot' + (it ? ' on' : '') }, [el('div', { class: 'g-slot-i' }, it ? it.e : R.SLOTS[s].icon), el('div', null, [el('div', { class: 'small muted' }, R.SLOTS[s].name), el('b', null, it ? it.name + (p.gear.owned[id] ? ' +' + p.gear.owned[id] : '') : '— trống —')])]);
        })));
        const mine = R.GEAR.filter(it => p.gear.owned[it.id] != null);
        right.appendChild(mine.length ? el('div', { class: 'g-list' }, mine.map(it => itemCard(p, it, 'mine', draw)))
          : el('p', { class: 'muted' }, 'Chưa có trang bị nào. Hãy làm nhiệm vụ kiếm vàng rồi ghé Tiệm trang sức (gần chợ trong Làng)!'));
      }
      body.appendChild(el('div', { class: 'g-wrap' }, [statPanel(p), right]));
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]));
      EQ.ui.updateHud();
    }
    draw();
  };

  // ---------- Bảng nhiệm vụ hằng ngày ----------
  UI.jobs = function () {
    const p = EQ.game.profile; R.ensure(p);
    const body = el('div', { class: 'jobview' });
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    function draw() {
      const jobs = R.dailyJobs(p);
      body.innerHTML = '';
      body.appendChild(el('h2', null, '📋 Bảng nhiệm vụ hôm nay'));
      body.appendChild(el('p', { class: 'muted small' }, 'Làm xong việc nào thì bấm "Nhận thưởng". Ngày mai sẽ có 3 việc mới. Vàng dùng để mua trang bị ở Tiệm trang sức.'));
      jobs.list.forEach(j => {
        const info = R.jobInfo(p, j);
        body.appendChild(el('div', { class: 'job' + (j.claimed ? ' claimed' : info.done ? ' done' : '') }, [
          el('div', { class: 'job-i' }, info.t.icon),
          el('div', { class: 'job-m' }, [el('b', null, info.name), el('div', { class: 'job-bar' }, el('div', { class: 'job-fill', style: { width: (info.prog / j.n * 100) + '%' } })), el('div', { class: 'small muted' }, info.prog + ' / ' + j.n)]),
          j.claimed ? el('span', { class: 'job-ok' }, '✓ Đã nhận') :
            el('button', { class: 'btn ' + (info.done ? 'primary' : ''), disabled: !info.done, onclick: async () => { j.claimed = true; await EQ.game.reward(p, { gold: j.gold, xp: 15 }); EQ.audio.sfx('chest'); EQ.game.saveNow(); draw(); } }, 'Nhận ' + j.gold + ' 🪙')
        ]));
      });
      const s = R.stats(p);
      if (s.luck) body.appendChild(el('p', { class: 'small' }, '🍀 May mắn +' + s.luck + '%: phần thưởng vàng sẽ được cộng thêm.'));
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };

  // ---------- Tháp Thử Thách ----------
  UI.tower = async function (sp) {
    const p = EQ.game.profile; R.ensure(p);
    if (sp && !p.tower.visited) { p.tower.visited = true; await EQ.ui.dialog([{ s: 'npc', en: 'This is the Tower of Challenges. Thirty floors, thirty monsters!', vi: 'Đây là Tháp Thử Thách. Ba mươi tầng, ba mươi quái vật!' }, { s: 'pip', vi: 'Mỗi tầng có "Lực chiến đề xuất". Trang bị tốt giúp bạn mạnh hơn, nhưng vẫn phải trả lời đúng tiếng Anh mới hạ được quái vật nhé!' }], sp); }
    const body = el('div', { class: 'towerview' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      const pw = R.power(p), best = p.tower.best || 0;
      body.appendChild(el('div', { class: 'tw-head' }, [el('h2', null, '🗼 Tháp Thử Thách'), el('div', { class: 'g-power' }, ['💪 Lực chiến của bạn: ', el('b', null, String(pw))]), el('div', { class: 'small muted' }, 'Đã vượt: ' + best + '/' + R.TOWER_FLOORS + ' tầng • Mỗi 5 tầng có Trùm rơi trang bị quý')]));
      const grid = el('div', { class: 'tw-grid' });
      for (let f = R.TOWER_FLOORS; f >= 1; f--) {
        const fl = R.floor(f);
        const open = f <= best + 1, cleared = f <= best;
        const ratio = pw / fl.rec;
        const diff = ratio >= 1.1 ? 'easy' : ratio >= 0.85 ? 'ok' : 'hard';
        grid.appendChild(el('button', { class: 'tw-floor ' + (cleared ? 'cleared' : open ? 'open ' + diff : 'locked') + (fl.boss ? ' boss' : ''), disabled: !open, title: fl.def.name, onclick: () => fight(f) }, [
          el('div', { class: 'tw-n' }, (fl.boss ? '👑 ' : '') + 'Tầng ' + f),
          el('div', { class: 'tw-m' }, fl.def.name),
          el('div', { class: 'tw-r' }, cleared ? '✓ Đã vượt' : open ? '💪 Đề xuất ' + fl.rec : '🔒'),
          el('div', { class: 'tw-g' }, '🪙 ' + fl.gold + (fl.boss ? ' + 🎁' : ''))
        ]));
      }
      body.appendChild(grid);
      requestAnimationFrame(() => { const cur = grid.querySelector('.tw-floor.open'); grid.scrollTop = cur ? cur.offsetTop - grid.clientHeight / 2 : grid.scrollHeight; });
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng'), el('button', { class: 'btn', onclick: () => { close(); UI.gearScreen('mine'); } }, '🎒 Xem trang bị')]));
    }
    async function fight(f) {
      const fl = R.floor(f);
      const pw = R.power(p);
      if (pw < fl.rec * 0.8 && !(await EQ.ui.confirm('Lực chiến của bạn (' + pw + ') thấp hơn đề xuất (' + fl.rec + '). Trận này sẽ khó: quái vật nhiều máu và đánh mạnh. Vẫn thử chứ?', { yes: 'Thử sức!', no: 'Để sau' }))) return;
      close();
      const res = await EQ.battle.start({ def: fl.def, color: fl.def.color, hp: fl.hp, name: fl.def.name + ' (Tầng ' + f + ')', boss: fl.boss, matk: fl.matk, spec: {} });
      if (res === 'win') {
        const first = f > (p.tower.best || 0);
        if (first) p.tower.best = f;
        const r = { gold: first ? fl.gold : Math.round(fl.gold / 3), xp: 10 + f * 2 };
        await EQ.game.reward(p, r);
        R.count(p, 'tower');
        if (first && fl.boss) {
          const cand = R.GEAR.filter(it => it.tier === fl.dropTier && p.gear.owned[it.id] == null);
          if (cand.length) { const it = U.pick(cand); R.give(p, it.id); await EQ.ui.alert('Trùm tầng ' + f + ' để lại: <b>' + it.e + ' ' + U.esc(it.name) + '</b>!<br>Vào 🎒 Trang bị để mặc vào nhé.', { icon: '🎁', title: 'Phần thưởng quý!' }); }
          else await EQ.game.reward(p, { gold: fl.gold });
        }
        EQ.game.saveNow();
      } else if (res === 'rest') {
        await EQ.game.pip('Hãy nâng cấp trang bị ở Tiệm trang sức hoặc ôn từ trong Sổ từ vựng rồi quay lại nhé!');
      }
      UI.tower();
    }
    draw();
  };

  EQ.rpgui = UI;
})();
