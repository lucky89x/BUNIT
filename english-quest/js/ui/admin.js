/* ENGLISH QUEST – CHẾ ĐỘ ADMIN (bản 1.6)
 * Dành cho phụ huynh / người quản trị: đăng nhập bằng mật khẩu (mặc định "admin", đổi được).
 *  🗺️ Bản đồ: xem toàn bộ từng vùng (kể cả chỗ chưa khám phá), bấm vào bản đồ để dịch chuyển tới đó
 *  📜 Nhiệm vụ: xem trạng thái, đánh dấu hoàn thành hoặc đặt lại từng nhiệm vụ
 *  👤 Nhân vật: cộng vàng, lên cấp, tặng trang bị, mở trang phục, mở cổng
 *  🔑 Đổi mật khẩu
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el, SP = EQ.sprites, R = EQ.rpg;
  const AD = { logged: false };
  const TS = 32;
  const pass = () => (EQ.store.data.adminPass || 'admin');

  AD.login = function () {
    if (AD.logged) return AD.panel();
    const inp = el('input', { type: 'password', class: 'inp', placeholder: 'Mật khẩu admin' });
    const msg = el('div', { class: 'small', style: { color: '#c62828', minHeight: '18px' } });
    const go = () => {
      if (inp.value === pass()) { AD.logged = true; close(); AD.panel(); }
      else { msg.textContent = 'Sai mật khẩu.'; inp.select(); }
    };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); e.stopPropagation(); });
    const body = el('div', { class: 'settings' }, [
      el('h2', null, '🛠️ Đăng nhập Admin'),
      el('p', { class: 'muted small' }, 'Dành cho phụ huynh để kiểm tra bản đồ, nhiệm vụ và chỉnh dữ liệu nhân vật. Mật khẩu mặc định: admin (nên đổi sau khi đăng nhập).'),
      inp, msg,
      el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: go }, 'Đăng nhập'), el('button', { class: 'btn', onclick: () => close() }, 'Hủy')])
    ]);
    const close = EQ.ui.modal(body, { onEsc: () => close() });
    setTimeout(() => inp.focus(), 50);
  };

  AD.panel = function (tab) {
    tab = tab || 'map';
    const list = EQ.store.data.profiles;
    let who = EQ.game.profile || list[0] || null;
    let region = (who && who.region) || 'village';
    const body = el('div', { class: 'admin' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('h2', null, '🛠️ Bảng điều khiển Admin'));
      const pick = el('select', { class: 'inp small', onchange: e => { who = list.find(p => p.id === e.target.value); draw(); } }, list.map(p => el('option', { value: p.id }, p.name + ' (Cấp ' + p.level + ')')));
      if (who) pick.value = who.id;
      body.appendChild(el('div', { class: 'row' }, [el('b', null, 'Nhân vật:'), list.length ? pick : el('span', null, 'Chưa có nhân vật')]));
      body.appendChild(el('div', { class: 'tabs' }, [['map', '🗺️ Bản đồ'], ['quests', '📜 Nhiệm vụ'], ['player', '👤 Nhân vật'], ['pass', '🔑 Mật khẩu']].map(t => el('button', { class: 'tab' + (tab === t[0] ? ' on' : ''), onclick: () => { tab = t[0]; draw(); } }, t[1]))));
      const box = el('div');
      body.appendChild(box);
      if (tab === 'map') mapTab(box);
      else if (tab === 'quests') questTab(box);
      else if (tab === 'player') playerTab(box);
      else passTab(box);
      body.appendChild(el('div', { class: 'row center' }, [
        el('button', { class: 'btn', onclick: () => { AD.logged = false; close(); } }, '🚪 Đăng xuất'),
        el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng')
      ]));
    }
    // ----- bản đồ đầy đủ -----
    function mapTab(box) {
      box.appendChild(el('div', { class: 'row' }, Object.keys(EQ.REGIONS).map(id => el('button', { class: 'btn small ' + (region === id ? 'primary' : ''), onclick: () => { region = id; draw(); } }, EQ.REGIONS[id].name))));
      const def = EQ.REGIONS[region];
      const rows = def._rows || (def._rows = def.build());
      const h = rows.length, w = rows[0].length;
      const cv = el('canvas', { width: w * TS, height: h * TS, class: 'adm-map', title: 'Bấm vào bản đồ để dịch chuyển nhân vật tới đó' });
      const c = cv.getContext('2d');
      const prevRegion = SP.region; SP.region = region;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) SP.drawTile(c, rows[y][x], x, y, x * TS, y * TS, 0);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (SP.isTree(rows[y][x])) SP.drawTallTree(c, rows[y][x], x, y, 0);
      SP.region = prevRegion;
      const ents = (def.entities || []).filter(e => !e.when || !who || e.when(who));
      ents.forEach(e => {
        const cx = (e.x + 0.5) * TS, cy = (e.y + 0.5) * TS;
        const col = e.kind === 'npc' ? '#ffffff' : e.kind === 'boss' ? '#ff5252' : e.kind === 'portal' ? '#80d8ff' : e.kind === 'chest' ? '#ffca28' : e.kind === 'gate' ? '#b388ff' : e.kind === 'pickup' ? '#69f0ae' : null;
        if (!col) return;
        c.fillStyle = col; c.strokeStyle = '#000'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, 9, 0, 7); c.fill(); c.stroke();
        const label = e.name || (e.kind === 'portal' ? '→ ' + (EQ.REGIONS[e.to] ? EQ.REGIONS[e.to].name : e.to) : e.kind === 'chest' ? 'Rương' : e.kind === 'gate' ? 'Cổng' : e.label || '');
        if (label) { c.font = 'bold 15px system-ui'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.8)'; c.strokeText(label, cx, cy - 14); c.fillStyle = col; c.fillText(label, cx, cy - 14); }
      });
      if (who && who.region === region && EQ.game.profile === who && EQ.world.player) { c.fillStyle = '#ff4081'; c.beginPath(); c.arc(EQ.world.player.x, EQ.world.player.y, 12, 0, 7); c.fill(); }
      cv.addEventListener('click', e => {
        const r = cv.getBoundingClientRect();
        const tx = Math.floor((e.clientX - r.left) / r.width * w), ty = Math.floor((e.clientY - r.top) / r.height * h);
        teleport(region, tx, ty);
      });
      box.appendChild(el('p', { class: 'small muted' }, '⚪ NPC  🔴 Trùm  🔵 Cổng dịch chuyển  🟡 Rương  🟣 Cổng phép  🟢 Đồ nhặt. Bấm vào chỗ bất kỳ trên bản đồ để đưa nhân vật đang chọn tới đó.'));
      box.appendChild(cv);
      box.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn small', onclick: () => teleport(region, null, null) }, '📍 Dịch chuyển tới điểm xuất phát của vùng')]));
    }
    function teleport(id, tx, ty) {
      if (!who) return;
      if (EQ.game.profile !== who || EQ.game.mode !== 'play') { document.getElementById('screen').className = 'screen hidden'; EQ.game.startProfile(who); }
      const W = EQ.world;
      W.load(id, null, null, who);
      if (tx != null) {
        // ô đi được gần chỗ bấm nhất
        let best = null;
        for (let r = 0; r < 8 && !best; r++) for (let dy = -r; dy <= r && !best; dy++) for (let dx = -r; dx <= r && !best; dx++) {
          const x = tx + dx, y = ty + dy;
          if (y >= 0 && y < W.h && x >= 0 && x < W.w && !W.solid(x, y)) best = [x, y];
        }
        if (best) W.load(id, best[0], best[1], who);
      }
      who.region = id;
      const def = EQ.REGIONS[id];
      EQ.audio.music(def.music);
      EQ.ui.banner('🛠️ ' + def.name, 'Admin dịch chuyển');
      EQ.game.saveNow();
      close();
    }
    // ----- nhiệm vụ -----
    function questTab(box) {
      if (!who) return box.appendChild(el('p', null, 'Chưa có nhân vật.'));
      const Q = EQ.Q;
      box.appendChild(el('p', { class: 'small muted' }, 'Đã xong ' + Q.doneCount(who) + '/' + EQ.QUESTS.length + ' nhiệm vụ. "Hoàn thành" chỉ đánh dấu xong (không phát thưởng); "Đặt lại" cho làm lại từ đầu.'));
      const lst = el('div', { class: 'adm-list' });
      Object.keys(EQ.REGIONS).forEach(r => {
        const qs = EQ.QUESTS.filter(q => q.region === r);
        if (!qs.length) return;
        lst.appendChild(el('h3', null, EQ.REGIONS[r].name));
        qs.forEach(q => {
          const st = who.quests[q.id];
          const status = !st ? (Q.available(who, q.id) ? '🟡 Có thể nhận' : '⚪ Chưa mở') : st.done ? '✅ Đã xong' : '🔵 Đang làm (bước ' + (st.stage + 1) + '/' + q.stages.length + ')';
          const giver = (EQ.REGIONS[q.region].entities || []).find(e => e.id === q.giver);
          lst.appendChild(el('div', { class: 'adm-q' }, [
            el('div', null, [el('b', null, (q.advanced ? '⭐ ' : '') + q.title), el('div', { class: 'small muted' }, status + (giver ? ' • Người giao: ' + giver.name : '') + (q.requires.length ? ' • Cần xong: ' + q.requires.map(id => EQ.QI[id] ? EQ.QI[id].title : id).join(', ') : ''))]),
            el('div', { class: 'row tight' }, [
              el('button', { class: 'btn small', disabled: st && st.done, onclick: () => { who.quests[q.id] = { stage: q.stages.length - 1, done: true }; save(); } }, '✓ Hoàn thành'),
              el('button', { class: 'btn small', disabled: !st, onclick: () => { delete who.quests[q.id]; save(); } }, '↺ Đặt lại')
            ])
          ]));
        });
      });
      box.appendChild(lst);
    }
    // ----- nhân vật -----
    function playerTab(box) {
      if (!who) return box.appendChild(el('p', null, 'Chưa có nhân vật.'));
      R.ensure(who);
      const act = (label, fn) => el('button', { class: 'btn small', onclick: () => { fn(); save(); EQ.ui.toast('🛠️ ' + label, 'good'); } }, label);
      box.appendChild(el('div', { class: 'adm-grid' }, [
        el('div', { class: 'adm-box' }, [el('b', null, '📋 Thông tin'),
          el('div', { class: 'small' }, 'Cấp ' + who.level + ' • ' + who.xp + ' XP • 🪙 ' + who.gold + ' • 💪 ' + R.power(who)),
          el('div', { class: 'small' }, 'Từ đã học: ' + EQ.learn.learnedIds(who).length + ' • Tháp: tầng ' + ((who.tower && who.tower.best) || 0) + ' • Vùng: ' + (EQ.REGIONS[who.region] ? EQ.REGIONS[who.region].name : who.region))]),
        el('div', { class: 'adm-box' }, [el('b', null, '🪙 Vàng & cấp'), el('div', { class: 'row tight' }, [
          act('+100 vàng', () => { who.gold += 100; }), act('+1000 vàng', () => { who.gold += 1000; }),
          act('+1 cấp', () => { who.level++; }), act('Vàng = 0', () => { who.gold = 0; })])]),
        el('div', { class: 'adm-box' }, [el('b', null, '🎒 Trang bị'), el('div', { class: 'row tight' }, [
          act('Tặng tất cả trang bị', () => { R.GEAR.forEach(it => R.give(who, it.id)); }),
          act('Nâng tất cả +5', () => { Object.keys(who.gear.owned).forEach(id => { who.gear.owned[id] = 5; }); }),
          act('Mặc đồ mạnh nhất', () => { Object.keys(R.SLOTS).forEach(s => { const best = R.GEAR.filter(it => it.slot === s && who.gear.owned[it.id] != null).sort((a, b) => b.tier - a.tier)[0]; if (best) who.gear.eq[s] = best.id; }); R.syncLook(who); }),
          act('Xóa trang bị', () => { who.gear = { owned: {}, eq: {} }; R.syncLook(who); })])]),
        el('div', { class: 'adm-box' }, [el('b', null, '👗 Trang phục & vật phẩm'), el('div', { class: 'row tight' }, [
          act('Mở mọi trang phục', () => { Object.keys(EQ.OUTFITS).forEach(k => { if (who.outfits.indexOf(k) < 0) who.outfits.push(k); }); }),
          act('+5 bánh táo', () => { who.items.pie = (who.items.pie || 0) + 5; }),
          act('Có bản đồ & đũa phép', () => { who.items.map = 1; who.items.wand = 1; })])]),
        el('div', { class: 'adm-box' }, [el('b', null, '🚪 Bản đồ'), el('div', { class: 'row tight' }, [
          act('Mở mọi cổng phép', () => { Object.keys(EQ.REGIONS).forEach(r => (EQ.REGIONS[r].entities || []).forEach(e => { if (e.kind === 'gate') who.flags['open:' + e.id] = true; })); }),
          act('Đặt lại Tháp', () => { who.tower = { best: 0 }; }),
          act('❤️ Hồi đầy máu', () => { who.life = R.maxLife(who); }),
          act('👹 Gọi Boss thế giới dậy', () => { if (who.wboss) who.wboss.next = 0; })])])
      ]));
    }
    function passTab(box) {
      const a = el('input', { type: 'password', class: 'inp', placeholder: 'Mật khẩu mới' });
      const b = el('input', { type: 'password', class: 'inp', placeholder: 'Nhập lại' });
      [a, b].forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
      box.appendChild(el('div', { class: 'settings' }, [a, b, el('button', { class: 'btn primary', onclick: () => {
        if (a.value.length < 4) return EQ.ui.toast('Mật khẩu cần ít nhất 4 ký tự', 'warn');
        if (a.value !== b.value) return EQ.ui.toast('Hai lần nhập không giống nhau', 'warn');
        EQ.store.data.adminPass = a.value; EQ.store.save(); EQ.ui.toast('🔑 Đã đổi mật khẩu admin', 'good');
      } }, 'Lưu mật khẩu')]));
    }
    function save() {
      EQ.store.save();
      if (EQ.game.profile === who && EQ.game.mode === 'play') { EQ.world.refresh(who); EQ.ui.updateHud(); }
      draw();
    }
    draw();
  };

  EQ.admin = AD;
})();
