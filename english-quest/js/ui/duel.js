/* ENGLISH QUEST – ĐẤU TRƯỜNG 2 BÉ & BẢNG SO SÁNH (bản 1.6)
 * Hai bé chơi chung một máy, thay nhau trả lời câu hỏi (mỗi bé nhận câu theo trình độ của mình).
 *  🆚 Đấu nhau: trả lời đúng → tung phép vào bạn. Máu, sát thương, chặn đòn, chí mạng lấy từ TRANG BỊ.
 *  🤝 Cùng đánh trùm: cả hai góp sát thương hạ một trùm khổng lồ.
 * Trả lời đúng vẫn là điều quan trọng nhất: sai thì không tấn công được, dù trang bị mạnh đến đâu.
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el, SP = EQ.sprites, R = EQ.rpg;
  const D = {};
  const profiles = () => EQ.store.data.profiles.map(p => { R.ensure(p); return p; });

  // chỉ số đấu trường (từ trang bị)
  D.stats = function (p) {
    const E = R.effects(p);
    return { maxHp: 30 + E.hp * 6, dmg: 3 + E.atk * 2, crit: E.crit, block: Math.round(E.def / 2), E };
  };

  // ---------- Bảng so sánh ----------
  D.compareTable = function (list) {
    list = list || profiles();
    const rows = [
      ['Lớp', p => p.grade || '-', false],
      ['⭐ Cấp', p => p.level, true],
      ['💪 Lực chiến', p => R.power(p), true],
      ['⚔️ Sức mạnh', p => R.stats(p).atk, true],
      ['❤️ Máu', p => R.stats(p).hp, true],
      ['🛡️ Phòng thủ', p => R.stats(p).def, true, v => v + '%'],
      ['🍀 May mắn', p => R.stats(p).luck, true, v => '+' + v + '%'],
      ['🎒 Đang mặc', p => Object.keys(R.SLOTS).map(s => { const id = p.gear.eq[s]; return id && R.GI[id] ? R.GI[id].e + (p.gear.owned[id] ? '+' + p.gear.owned[id] : '') : '·'; }).join(' '), false],
      ['📖 Từ đã học', p => EQ.learn.learnedIds(p).length, true],
      ['🗼 Tháp', p => (p.tower && p.tower.best) || 0, true, v => 'Tầng ' + v],
      ['🆚 Thắng đấu trường', p => (p.duel && p.duel.win) || 0, true],
      ['🪙 Vàng', p => p.gold, true]
    ];
    const t = el('table', { class: 'cmp-table' });
    t.appendChild(el('tr', null, [el('th', null, '')].concat(list.map(p => el('th', null, p.name)))));
    rows.forEach(r => {
      const vals = list.map(r[1]);
      const best = r[2] && list.length > 1 ? Math.max.apply(null, vals) : null;
      t.appendChild(el('tr', null, [el('td', null, el('b', null, r[0]))].concat(vals.map(v => el('td', { class: best != null && v === best && v > 0 ? 'best' : '' }, r[3] ? r[3](v) : String(v))))));
    });
    return t;
  };
  D.compare = function () {
    const list = profiles();
    const body = el('div', { class: 'duel' }, [
      el('h2', null, '📊 So sánh nhân vật'),
      el('p', { class: 'muted small' }, 'Ô màu cam là người dẫn đầu. Muốn tăng 💪 Lực chiến: làm nhiệm vụ, đánh quái để có vàng, mua & nâng cấp trang bị ở 💎 Tiệm trang sức.'),
      list.length ? D.compareTable(list) : el('p', null, 'Chưa có nhân vật nào.'),
      el('div', { class: 'row center' }, [
        list.length >= 2 ? el('button', { class: 'btn primary', onclick: () => { close(); D.setup(); } }, '🆚 Vào Đấu trường 2 bé') : null,
        el('button', { class: 'btn', onclick: () => close() }, 'Đóng')
      ])
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
  };

  // ---------- Chọn người chơi ----------
  D.setup = function () {
    const list = profiles();
    if (list.length < 2) return EQ.ui.alert('Cần ít nhất 2 nhân vật. Hãy tạo thêm nhân vật cho bé thứ hai ở mục "Chọn nhân vật".', { icon: '👥', title: 'Đấu trường 2 bé' });
    const cur = EQ.game.profile;
    let sel = [cur && list.indexOf(cur) >= 0 ? cur : list[0], list.find(p => p !== (cur || list[0]))];
    let mode = 'pvp';
    const body = el('div', { class: 'duel' });
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('h2', null, '🆚 Đấu trường 2 bé'));
      body.appendChild(el('p', { class: 'muted small' }, 'Hai bé ngồi cùng máy, thay phiên trả lời. Mỗi bé nhận câu hỏi theo trình độ của mình. Trang bị quyết định máu, sát thương, chặn đòn và chí mạng.'));
      [0, 1].forEach(k => {
        body.appendChild(el('h3', null, k ? '🔴 Người chơi 2' : '🔵 Người chơi 1'));
        body.appendChild(el('div', { class: 'pick-list' }, list.map(p => el('div', {
          class: 'pcard-s' + (sel[k] === p ? ' on' : ''),
          onclick: () => { if (sel[1 - k] === p) sel[1 - k] = sel[k]; sel[k] = p; draw(); }
        }, [EQ.screens.avatarCanvas(p.avatar, 64), el('div', null, el('b', null, p.name)), el('div', { class: 'small' }, 'Cấp ' + p.level + ' • 💪 ' + R.power(p))]))));
      });
      body.appendChild(el('h3', null, '🎮 Chế độ'));
      body.appendChild(el('div', { class: 'row center' }, [['pvp', '🆚 Đấu với nhau'], ['coop', '🤝 Cùng đánh trùm']].map(m => el('button', { class: 'btn ' + (mode === m[0] ? 'primary' : ''), onclick: () => { mode = m[0]; draw(); } }, m[1]))));
      body.appendChild(D.compareTable(sel));
      body.appendChild(el('div', { class: 'row center' }, [
        el('button', { class: 'btn primary big', disabled: sel[0] === sel[1], onclick: () => { close(); D.play(sel[0], sel[1], mode); } }, '⚔️ Bắt đầu!'),
        el('button', { class: 'btn', onclick: () => close() }, 'Đóng')
      ]));
    }
    draw();
  };

  // ---------- Trận đấu ----------
  D.play = function (pa, pb, mode) {
    const saved = EQ.game.profile;
    const P = [pa, pb].map(p => {
      const s = D.stats(p);
      return { p, s, hp: s.maxHp, src: EQ.learn.battleSource(p, {}), right: 0, wrong: 0, shield: 0, shake: 0 };
    });
    const coop = mode === 'coop';
    const bossDef = U.pick(Object.keys(EQ.BOSSES).map(k => EQ.BOSSES[k]));
    const boss = coop ? { def: bossDef, maxHp: 60 + (pa.level + pb.level) * 3, hp: 0, shake: 0 } : null;
    if (boss) boss.hp = boss.maxHp;
    let team = coop ? P[0].s.E.hp + P[1].s.E.hp : 0; // tim chung khi đánh trùm
    const teamMax = team;
    let turn = 0, over = false, closed = false, t = 0;
    const fx = [];
    const cv = el('canvas', { width: 760, height: 220, class: 'arena' });
    const ctx = cv.getContext('2d');
    const sides = P.map(() => el('div', { class: 'duel-side' }));
    const qbox = el('div', { class: 'qbox' });
    const info = el('div', { class: 'bt-gear' });
    const body = el('div', { class: 'duel' }, [
      el('div', { class: 'duel-top' }, [sides[0], el('div', { class: 'duel-vs' }, coop ? '🤝' : 'VS'), sides[1]]),
      info, cv, qbox,
      el('div', { class: 'row center' }, [el('button', { class: 'btn ghost small', onclick: () => finish(null) }, '🏳️ Dừng trận')])
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide battle-card', onEsc: () => finish(null) });
    EQ.audio.music('battle');

    function drawSides() {
      P.forEach((q, i) => {
        const S = q.s, E = S.E;
        sides[i].className = 'duel-side' + (turn === i && !over ? ' turn' : '');
        sides[i].innerHTML = '';
        sides[i].appendChild(el('b', null, (i ? '🔴 ' : '🔵 ') + q.p.name + (turn === i && !over ? '  ◀ lượt' : '')));
        if (!coop) {
          sides[i].appendChild(el('div', { class: 'duel-hp' }, el('div', { style: { width: Math.max(0, q.hp / S.maxHp * 100) + '%' } })));
          sides[i].appendChild(el('div', { class: 'small' }, '❤️ ' + Math.max(0, q.hp) + '/' + S.maxHp));
        }
        sides[i].appendChild(el('div', { class: 'duel-stats' }, (E.weapon ? E.weapon.e : '✋') + ' ⚔️' + S.dmg + ' • 🛡️' + S.block + '% • 🍀' + S.crit + '% • ✅' + q.right));
      });
      info.innerHTML = '';
      if (coop) {
        info.appendChild(el('span', null, '👑 ' + boss.def.name + ': ' + Math.max(0, boss.hp) + '/' + boss.maxHp + ' máu'));
        info.appendChild(el('span', null, '💞 Tim chung: ' + '❤️'.repeat(Math.max(0, team)) + '🤍'.repeat(Math.max(0, teamMax - team))));
      } else info.appendChild(el('span', null, '⚔️ Sát thương = 3 + 2×Sức mạnh • ❤️ Máu = 30 + 6×Máu • 🛡️ Đỡ một nửa đòn • 🍀 Chí mạng x2'));
    }
    // ----- vẽ -----
    const XS = [150, 610];
    function loop() {
      if (closed) return;
      const dt = 1 / 60; t += dt;
      const g = ctx.createLinearGradient(0, 0, 0, 220);
      g.addColorStop(0, '#ffcc80'); g.addColorStop(0.6, '#ffe0b2'); g.addColorStop(1, '#a1887f');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 760, 220);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(380, 196, 340, 20, 0, 0, 7); ctx.fill();
      if (coop) {
        const sx = boss.shake > 0 ? Math.sin(t * 70) * 6 : 0; boss.shake = Math.max(0, boss.shake - dt);
        if (boss.hp > 0) SP.monster(ctx, boss.def, 380 + sx, 190, 48, boss.def.color, t);
        P.forEach((q, i) => drawFighter(q, i ? 600 : 160, i ? 'left' : 'right', i));
      } else P.forEach((q, i) => drawFighter(q, XS[i], i ? 'left' : 'right', i));
      fx.forEach(f => {
        f.life -= dt;
        if (f.type === 'bolt') {
          f.k = Math.min(1, (f.k || 0) + dt * 2);
          const x = f.x0 + (f.x1 - f.x0) * f.k, y = 120 - Math.sin(f.k * Math.PI) * 50;
          const E = f.E, big = 1 + Math.min(1.5, (E.atk - 1) * 0.12) + (f.crit ? 0.5 : 0), dir = Math.sign(f.x1 - f.x0);
          const cols = E.weapon ? [E.weapon.col, '#fff', E.weapon.col, '#fff59d'] : ['#fff59d', '#ffd54f', '#b388ff', '#80d8ff'];
          for (let i = 0; i < 6 + E.tier * 2; i++) { ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x - dir * i * 7 * big, y, Math.max(1, (9 - i) * big), 0, 7); ctx.fill(); }
          if (E.tier >= 3) { ctx.font = Math.round(26 * big) + 'px ' + SP.EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.weapon.e, x, y); }
          if (f.k >= 1 && !f.hit) { f.hit = true; f.life = 0; f.cb(); }
        } else if (f.type === 'text') {
          f.y -= 30 * dt; ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
          ctx.font = 'bold 24px "Baloo 2", system-ui'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.c; ctx.fillText(f.text, f.x, f.y);
          ctx.globalAlpha = 1;
        }
      });
      for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);
      requestAnimationFrame(loop);
    }
    function drawFighter(q, x, dir, i) {
      const sx = q.shake > 0 ? Math.sin(t * 60) * 5 : 0; q.shake = Math.max(0, q.shake - 1 / 60);
      if (turn === i && !over) { ctx.fillStyle = 'rgba(255,193,7,.45)'; ctx.beginPath(); ctx.ellipse(x, 194, 46, 10, 0, 0, 7); ctx.fill(); }
      SP.human(ctx, x + sx, 192, SP.playerLook(q.p.avatar), dir, 0, { scale: 4 });
      const E = q.s.E;
      if (E.weapon) { ctx.font = (20 + E.tier * 3) + 'px ' + SP.EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.weapon.e, x + (dir === 'right' ? 46 : -46), 130); }
      if (q.shield > 0) {
        q.shield -= 1 / 60;
        ctx.save(); ctx.globalAlpha = Math.min(0.7, q.shield * 1.5); ctx.strokeStyle = E.neckCol || '#80d8ff'; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(128,216,255,.18)';
        ctx.beginPath(); ctx.arc(x, 150, 60, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      ctx.font = 'bold 15px "Baloo 2", system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = '#3e2723'; ctx.fillText(q.p.name, x, 214);
    }
    const say = (x, y, text, c) => fx.push({ type: 'text', x, y, text, c, life: 1.3 });
    const bolt = (q, x0, x1, crit) => new Promise(res => fx.push({ type: 'bolt', x0, x1, E: q.s.E, crit, life: 6, cb: res }));

    async function doTurn() {
      if (over) return;
      drawSides();
      const me = P[turn], foe = P[1 - turn];
      EQ.game.profile = me.p; // câu hỏi & tiến độ học ghi vào đúng hồ sơ của bé đang chơi
      qbox.innerHTML = '';
      qbox.appendChild(el('div', { class: 'note' }, (turn ? '🔴 ' : '🔵 ') + 'Lượt của ' + me.p.name + ' – các bạn khác không nhắc bài nhé!'));
      const holder = el('div'); qbox.appendChild(holder);
      const q = me.src.next();
      const r = await EQ.challenge.render(holder, q, { retry: false });
      if (over) return;
      if (r.correct) {
        me.right++;
        let dmg = me.s.dmg; const crit = Math.random() * 100 < me.s.crit; if (crit) dmg *= 2;
        EQ.audio.sfx('spell');
        if (coop) {
          await bolt(me, turn ? 600 : 160, 380, crit);
          boss.hp -= dmg; boss.shake = 0.4; EQ.audio.sfx('hit');
          say(380, 60, (crit ? '💥 ' : '-') + dmg, crit ? '#ff8a65' : '#fff59d');
        } else {
          await bolt(me, XS[turn], XS[1 - turn], crit);
          let blocked = false;
          if (Math.random() * 100 < foe.s.block) { dmg = Math.ceil(dmg / 2); blocked = true; foe.shield = 0.9; }
          foe.hp -= dmg; foe.shake = 0.4; EQ.audio.sfx('hit');
          say(XS[1 - turn], 60, (crit ? '💥 CHÍ MẠNG -' : '-') + dmg + (blocked ? ' 🛡️' : ''), crit ? '#ff8a65' : '#fff59d');
        }
        EQ.game.reward(me.p, { xp: 3 }, true);
      } else {
        me.wrong++; me.src.missed(q);
        say(turn ? 600 : 160, 70, '💨 Trượt!', '#ffffff');
        if (coop) {
          if (Math.random() * 100 < me.s.E.def) { me.shield = 0.9; say(turn ? 600 : 160, 40, '🛡️ Chặn!', '#80d8ff'); }
          else { team--; me.shake = 0.4; EQ.audio.sfx('bump'); say(turn ? 600 : 160, 40, '-1 ❤️', '#ff8a80'); }
        }
      }
      drawSides();
      await U.sleep(700);
      if (coop && boss.hp <= 0) return finish('team');
      if (coop && team <= 0) return finish('boss');
      if (!coop && foe.hp <= 0) return finish(turn);
      turn = 1 - turn;
      doTurn();
    }

    async function finish(res) {
      if (closed) return;
      over = true;
      EQ.game.profile = saved;
      if (res === null) { closed = true; close(); restore(); return; }
      EQ.audio.sfx(res === 'boss' ? 'wrong' : 'victory');
      P.forEach(q => { q.p.duel = q.p.duel || { win: 0, loss: 0 }; });
      let title, lines = [];
      if (coop) {
        title = res === 'team' ? '🎉 Cả đội hạ được ' + boss.def.name + '!' : '😮‍💨 Trùm còn mạnh quá!';
        for (const q of P) { const g = res === 'team' ? 40 : 15; await EQ.game.reward(q.p, { gold: g, xp: 15 }, true); lines.push(q.p.name + ': ✅ ' + q.right + ' câu đúng • +' + g + ' 🪙'); }
      } else {
        const w = P[res], l = P[1 - res];
        w.p.duel.win++; l.p.duel.loss++;
        title = '🏆 ' + w.p.name + ' thắng!';
        await EQ.game.reward(w.p, { gold: 35, xp: 20 }, true);
        await EQ.game.reward(l.p, { gold: 15, xp: 12 }, true);
        lines.push(w.p.name + ': ✅ ' + w.right + ' đúng • +35 🪙', l.p.name + ': ✅ ' + l.right + ' đúng • +15 🪙 (cố lên lần sau!)');
      }
      EQ.store.save();
      drawSides();
      qbox.innerHTML = '';
      qbox.appendChild(el('div', { class: 'bt-result win' }, [
        el('div', { class: 'res-big' }, title),
        el('div', null, lines.map(s => el('div', null, s))),
        el('p', { class: 'small muted' }, 'Mẹo: trả lời đúng là quan trọng nhất. Trang bị tốt giúp đòn đánh mạnh hơn và chịu đòn tốt hơn.'),
        el('div', { class: 'row center' }, [
          el('button', { class: 'btn primary', onclick: () => { closed = true; close(); restore(); D.play(pa, pb, mode); } }, '🔁 Đấu lại'),
          el('button', { class: 'btn', onclick: () => { closed = true; close(); restore(); D.compare(); } }, '📊 So sánh'),
          el('button', { class: 'btn', onclick: () => { closed = true; close(); restore(); } }, 'Thoát')
        ])
      ]));
    }
    function restore() {
      EQ.game.profile = saved;
      if (saved && EQ.ui.hudEls) EQ.ui.updateHud();
      if (saved && EQ.REGIONS[saved.region]) EQ.audio.music(EQ.REGIONS[saved.region].music); else EQ.audio.music('title');
    }
    drawSides();
    loop();
    doTurn();
    D._cur = { P, finish, boss: () => boss };
  };

  EQ.duel = D;
})();
