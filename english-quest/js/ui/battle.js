/* Trận đấu kiến thức: trả lời đúng → tung phép thuật; sai → được giải thích và bị quái CẮN MẤT MÁU.
 * Bản 1.8: dùng THANH MÁU chung của nhân vật (p.life, xem EQ.rpg.maxLife). Hết máu → gục ngã:
 *   - quái ngoài bản đồ / Vùng hoang dã / Boss thế giới: rơi mất 1 món đồ đang mặc, hồi sinh ở Làng
 *   - trùm cốt truyện, Tháp Thử Thách (o.safe): chỉ ngất đi, không mất đồ */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el, SP = EQ.sprites;
  const B = {};

  // chỉ số lấy từ cấp độ + trang bị (xem js/data/gear.js)
  B.power = p => EQ.rpg.stats(p).atk;
  B.maxHearts = p => EQ.rpg.stats(p).hp;
  // sức cắn của quái mỗi lần trả lời sai
  B.bite = o => o.bite || (o.def && o.def.bite) || ((o.boss ? 14 : 8) + ((o.matk || 1) - 1) * 6);
  B.critChance = p => Math.min(40, Math.round(EQ.rpg.stats(p).luck / 4));

  // o: {def, color, hp, name, spec, boss, hard}
  B.start = function (o) {
    const p = EQ.game.profile;
    return new Promise(resolve => {
      EQ.rpg.ensure(p);
      const st = { hp: o.hp, maxHp: o.hp, life: EQ.rpg.lifeOf(p), maxLife: EQ.rpg.maxLife(p), bite: B.bite(o), combo: 0, fx: [], shake: 0, mShake: 0, mJump: 0, t: 0, over: false };
      // vào trận khi gần hết máu: hồi tối thiểu 25% để còn sức chiến đấu
      if (st.life < st.maxLife * 0.25) { st.life = Math.ceil(st.maxLife * 0.25); p.life = st.life; }
      const src = EQ.learn.battleSource(p, o.spec || {});
      EQ.audio.music('battle');
      const cv = el('canvas', { width: 720, height: 210, class: 'arena' });
      const ctx = cv.getContext('2d');
      const lifeFill = el('div', { class: 'life-fill' });
      const lifeText = el('div', { class: 'life-text' });
      const heartsEl = el('div', { class: 'life-bar' }, [lifeFill, lifeText]);
      const hpFill = el('div', { class: 'hp-fill' });
      const hpText = el('div', { class: 'hp-text' });
      const comboEl = el('div', { class: 'bt-combo' });
      const qbox = el('div', { class: 'qbox' });
      const E = EQ.rpg.effects(p);
      const painted = !!(EQ.paint && EQ.paint.on());
      const look0 = (function () { const l = SP.playerLook(p.avatar); const g0 = Object.assign({}, l.g || {}); g0.wand = null; return Object.assign({}, l, { g: g0 }); })();
      const gearEl = el('div', { class: 'bt-gear' });
      function drawGear() {
        const hits = Math.max(1, Math.ceil(Math.max(0, st.hp) / E.atk));
        gearEl.innerHTML = '';
        [
          (E.weapon ? E.weapon.e + ' ' + E.weapon.name : '✋ Tay không') + ': ⚔️ ' + E.atk + ' sát thương/câu đúng',
          '🎯 Còn cần ' + hits + ' câu đúng',
          '🛡️ Chặn đòn ' + E.def + '%',
          '🍀 Chí mạng ' + E.crit + '%',
          '🦷 Quái cắn ' + st.bite + ' máu/câu sai'
        ].forEach(t => gearEl.appendChild(el('span', null, t)));
      }
      const pieBtn = el('button', { class: 'btn small' });
      const fleeBtn = el('button', { class: 'btn ghost small' }, '🏃 Rời trận');
      const body = el('div', { class: 'battle' }, [
        el('div', { class: 'bt-top' }, [
          el('div', { class: 'bt-side' }, [el('b', null, p.name), heartsEl]),
          comboEl,
          el('div', { class: 'bt-side right' }, [el('b', null, (o.boss ? '👑 ' : '') + o.name), el('div', { class: 'hp-bar' }, [hpFill, hpText])])
        ]),
        gearEl,
        cv,
        qbox,
        el('div', { class: 'row bt-actions' }, [pieBtn, el('span', { class: 'bt-tip' }, 'Không giới hạn thời gian – cứ bình tĩnh suy nghĩ nhé!'), fleeBtn])
      ]);
      const close = EQ.ui.modal(body, { cls: 'wide battle-card', onEsc: () => fleeBtn.click() });
      function drawBars() {
        drawGear();
        lifeFill.style.width = Math.max(0, st.life / st.maxLife * 100) + '%';
        lifeFill.classList.toggle('low', st.life <= st.maxLife * 0.3);
        lifeText.textContent = '❤️ ' + Math.max(0, st.life) + ' / ' + st.maxLife;
        p.life = st.life;
        hpFill.style.width = Math.max(0, st.hp / st.maxHp * 100) + '%';
        hpText.textContent = Math.max(0, st.hp) + ' / ' + st.maxHp;
        comboEl.textContent = st.combo >= 2 ? '🔥 Combo x' + st.combo : '';
        const n = p.items.pie || 0;
        pieBtn.textContent = '🥧 Bánh táo (' + n + ')';
        pieBtn.disabled = n <= 0 || st.life >= st.maxLife;
      }
      B.PIE = 35;
      pieBtn.onclick = () => {
        if (!(p.items.pie > 0) || st.life >= st.maxLife || st.over) return;
        p.items.pie--; st.life = Math.min(st.maxLife, st.life + B.PIE);
        EQ.audio.sfx('heal'); fxText(170, 70, '+' + B.PIE + ' ❤️', '#ff8a80'); drawBars();
      };
      fleeBtn.onclick = () => { if (st.over) return; end('flee'); };

      // ----- vẽ đấu trường -----
      const themes = { village: ['#9be7ff', '#bff3a7', '#7cc35a'], forest: ['#7fd1b9', '#5fae6e', '#3f8f46'], castle: ['#b39ddb', '#9fa8da', '#8e88a3'], wild: ['#ffcc80', '#c5a76b', '#8d6e3f'] };
      function fxText(x, y, text, color) { st.fx.push({ type: 'text', x, y, text, color, life: 1.2 }); }
      function loop() {
        if (st.closed) return;
        const dt = 1 / 60; st.t += dt;
        const th = themes[p.region] || themes.village;
        if (painted) {
          // bản 2.0: phông nền và nhân vật vẽ tay kiểu Ghibli (nút 🎨 ở góc màn hình để về 2D)
          ctx.drawImage(EQ.paint.battleBG(p.region), 0, 0); EQ.paint.drawClouds(ctx, st.t);
        } else {
          const g = ctx.createLinearGradient(0, 0, 0, 210);
          g.addColorStop(0, th[0]); g.addColorStop(0.6, th[1]); g.addColorStop(1, th[2]);
          ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 210);
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(170, 178, 90, 14, 0, 0, 7); ctx.ellipse(540, 178, 120, 18, 0, 0, 7); ctx.fill();
        }
        const sx = st.shake > 0 ? Math.sin(st.t * 60) * 4 : 0; st.shake = Math.max(0, st.shake - dt);
        if (painted) {
          const cv2 = EQ.paint.human(look0, 'right', st.shake > 0 ? 1 : (Math.floor(st.t * 2) % 2) * 0);
          const hgt = 168, wd = hgt * cv2.width / cv2.height, bob = Math.sin(st.t * 3) * 2;
          ctx.drawImage(cv2, 170 + sx - wd / 2, 184 - hgt + bob, wd, hgt);
        } else SP.human(ctx, 170 + sx, 180, SP.playerLook(p.avatar), 'right', Math.floor(st.t * 4), { scale: 4, moving: false });
        // vũ khí đang cầm (trang bị) hoặc đũa gỗ mặc định
        if (E.weapon) {
          ctx.save(); ctx.translate(222 + sx, 120); ctx.rotate(-0.5 + Math.sin(st.t * 3) * 0.08);
          ctx.shadowColor = E.weapon.col; ctx.shadowBlur = 8 + E.tier * 4;
          ctx.font = (22 + E.tier * 4) + 'px ' + SP.EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.weapon.e, 0, 0);
          ctx.restore();
        } else {
          ctx.fillStyle = '#8d6e63'; ctx.fillRect(205 + sx, 120, 18, 4);
          ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(225 + sx, 122, 5 + Math.sin(st.t * 8), 0, 7); ctx.fill();
        }
        // khiên khi chặn đòn (màu dây chuyền đang đeo)
        if (st.shield > 0) {
          st.shield -= dt;
          ctx.save(); ctx.globalAlpha = Math.min(0.7, st.shield * 1.5);
          ctx.strokeStyle = E.neckCol || '#80d8ff'; ctx.lineWidth = 5; ctx.fillStyle = 'rgba(128,216,255,.18)';
          ctx.beginPath(); ctx.arc(170, 140, 62, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
        }
        if (st.hp > 0 || st.mFade > 0) {
          const mx = 540 + (st.mShake > 0 ? Math.sin(st.t * 70) * 6 : 0);
          const my = 182 - (st.mJump > 0 ? Math.sin((1 - st.mJump) * Math.PI) * 30 : 0);
          st.mShake = Math.max(0, st.mShake - dt); st.mJump = Math.max(0, st.mJump - dt * 2);
          ctx.globalAlpha = st.hp > 0 ? 1 : Math.max(0, st.mFade);
          if (painted) {
            const mc = EQ.paint.monster(o.def, o.color || o.def.color, Math.floor(st.t * 6) % 4);
            const mh = Math.min(200, 118 * ((o.def.size || 1.4) / 1.4) * (o.boss ? 1.12 : 0.95));
            ctx.drawImage(mc, mx - mh / 2, my + 6 - mh, mh, mh);
          } else SP.monster(ctx, o.def, mx, my, 26 * (o.def.size || 1.4) * (o.boss ? 1 : 0.9), o.color || o.def.color, st.t);
          ctx.globalAlpha = 1;
          if (st.hp <= 0) st.mFade -= dt;
        }
        st.fx.forEach(f => {
          f.life -= dt;
          if (f.type === 'bolt') {
            f.k = Math.min(1, (f.k || 0) + dt * 2.2);
            const x = 230 + (520 - 230) * f.k, y = 120 - Math.sin(f.k * Math.PI) * 50;
            // to và sáng hơn khi Sức mạnh cao; vũ khí quý có hình riêng
            const big = 1 + Math.min(1.5, (E.atk - 1) * 0.12) + (f.crit ? 0.5 : 0);
            const cols = E.weapon ? [E.weapon.col, '#ffffff', E.weapon.col, '#fff59d'] : ['#fff59d', '#ffd54f', '#b388ff', '#80d8ff'];
            const n = 6 + E.tier * 2;
            for (let i = 0; i < n; i++) { ctx.fillStyle = cols[i % 4]; ctx.beginPath(); ctx.arc(x - i * 7 * big, y + Math.sin(st.t * 30 + i) * 3, Math.max(1, (9 - i * 6 / n * 1.4) * big), 0, 7); ctx.fill(); }
            if (E.tier >= 3) { ctx.font = Math.round(26 * big) + 'px ' + SP.EMOJI_FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(E.weapon.e, x + 6, y); }
            if (f.k >= 1 && !f.hit) { f.hit = true; f.life = 0; f.onHit && f.onHit(); }
          } else if (f.type === 'puff') {
            f.k = Math.min(1, (f.k || 0) + dt * 2.2);
            const x = 500 - (500 - 200) * f.k, y = 110 - Math.sin(f.k * Math.PI) * 40;
            ctx.font = '30px ' + SP.EMOJI_FONT; ctx.textAlign = 'center'; ctx.fillText('💨', x, y);
            if (f.k >= 1 && !f.hit) { f.hit = true; f.life = 0; f.onHit && f.onHit(); }
          } else if (f.type === 'spark') {
            f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 200 * dt;
            ctx.globalAlpha = Math.max(0, f.life); ctx.fillStyle = f.color; ctx.fillRect(f.x, f.y, 4, 4); ctx.globalAlpha = 1;
          } else if (f.type === 'text') {
            f.y -= 30 * dt;
            ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 1.5));
            ctx.font = 'bold 26px "Baloo 2", system-ui'; ctx.textAlign = 'center';
            ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.strokeText(f.text, f.x, f.y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y);
            ctx.globalAlpha = 1;
          }
        });
        st.fx = st.fx.filter(f => f.life > 0);
        requestAnimationFrame(loop);
      }
      st.mFade = 1;
      function sparks(x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * 7; st.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * 160, vy: Math.sin(a) * 160 - 80, color: U.pick(['#fff59d', '#ffd54f', '#b388ff', '#80d8ff', '#ff80ab']), life: 0.9 }); } }
      loop();

      async function turn() {
        if (st.over) return;
        drawBars();
        const q = src.next();
        if (o.hard) q.promptVi = q.promptVi; // giữ nguyên hướng dẫn
        const r = await EQ.challenge.render(qbox, q, { retry: false, showVi: o.hard ? false : undefined });
        if (st.over) return;
        if (r.correct) {
          st.combo++;
          let dmg = B.power(p) + (st.combo >= 3 ? 1 : 0);
          // 🍀 May mắn: cơ hội đánh chí mạng gấp đôi
          const crit = Math.random() * 100 < B.critChance(p);
          if (crit) dmg *= 2;
          EQ.audio.sfx('spell');
          await new Promise(res => st.fx.push({ type: 'bolt', life: 5, crit, onHit: res }));
          if (dmg >= st.hp && st.hp > 0 && st.hp === st.maxHp) fxText(360, 40, '⚡ Hạ gục chỉ với 1 đòn!', '#ffe082');
          st.hp -= dmg; st.mShake = 0.4;
          EQ.audio.sfx('hit');
          sparks(540, 120, 18);
          fxText(540, 70, (crit ? '💥 CHÍ MẠNG -' : '-') + dmg + (st.combo >= 3 ? ' 🔥' : ''), crit ? '#ff8a65' : '#fff59d');
          EQ.game.reward(p, { xp: r.hint ? 2 : 4 }, true);
        } else {
          st.combo = 0;
          src.missed(q);
          st.mJump = 1;
          await new Promise(res => st.fx.push({ type: 'puff', life: 5, onHit: res }));
          // phòng thủ: có cơ hội chặn đòn
          if (Math.random() * 100 < EQ.rpg.stats(p).def) {
            st.shield = 0.9;
            EQ.audio.sfx('heal'); fxText(170, 70, '🛡️ Trang bị chặn đòn!', '#80d8ff');
          } else {
            // cú cắn dao động ±20%
            const lose = Math.max(1, Math.round(st.bite * (0.8 + Math.random() * 0.4)));
            st.life = Math.max(0, st.life - lose); st.shake = 0.4;
            EQ.audio.sfx('bump');
            fxText(170, 70, '🦷 -' + lose + ' ❤️', '#ff8a80');
          }
        }
        drawBars();
        if (st.hp <= 0) return win();
        if (st.life <= 0) return o.safe ? tired() : dead();
        turn();
      }

      async function win() {
        st.over = true;
        EQ.audio.sfx('victory');
        sparks(540, 120, 40);
        qbox.innerHTML = '';
        const winMsg = o.def.win || { en: 'You win!', vi: 'Bạn thắng rồi!' };
        qbox.appendChild(el('div', { class: 'bt-result win' }, [
          el('div', { class: 'res-big' }, '🎉 Chiến thắng!'),
          el('div', { class: 'res-en' }, [el('span', null, '"' + winMsg.en + '"'), EQ.challenge.speakBtn(winMsg.en)]),
          el('div', { class: 'res-vi' }, winMsg.vi),
          el('button', { class: 'btn primary big', onclick: () => end('win') }, 'Nhận thưởng ▶')
        ]));
        EQ.speech.speak(winMsg.en);
      }
      // gục ngã ngoài bản đồ: mất 1 món đồ đang mặc
      function dead() {
        st.over = true;
        const r = EQ.rpg.die(p);
        st.life = p.life;
        EQ.audio.sfx('wrong');
        qbox.innerHTML = '';
        qbox.appendChild(el('div', { class: 'bt-result dead' }, [
          el('div', { class: 'res-big' }, '💀 Bạn đã gục ngã!'),
          el('div', { class: 'res-vi' }, r.lost ? ['Trong lúc chạy trốn, bạn đánh rơi ', el('b', null, r.lost.e + ' ' + r.lost.name), '. ' + o.name + ' đã nhặt mất rồi!']
            : 'Bạn không mặc trang bị nào nên bị rơi mất ' + r.gold + ' 🪙 vàng.'),
          el('div', { class: 'res-vi small' }, 'Mẹo: ôn lại các từ hay sai, mặc 🦺 áo giáp / 👢 giày để có thêm máu, mang theo 🥧 bánh táo (+' + B.PIE + ' ❤️).'),
          el('div', { class: 'row center' }, [el('button', { class: 'btn primary big', onclick: () => end('dead') }, '🏡 Hồi sinh ở Làng')])
        ]));
      }
      function tired() {
        st.over = true;
        qbox.innerHTML = '';
        qbox.appendChild(el('div', { class: 'bt-result' }, [
          el('div', { class: 'res-big' }, '😮‍💨 Bạn hết máu rồi!'),
          el('div', { class: 'res-vi' }, 'Không sao cả, ở thử thách này bạn không bị mất đồ. Mỗi lần sai là một lần học thêm. Ôn lại các từ vừa sai sẽ giúp bạn mạnh hơn đấy!'),
          el('div', { class: 'row center' }, [
            el('button', { class: 'btn primary big', onclick: () => { st.over = false; st.life = st.maxLife; st.hp = st.maxHp; st.combo = 0; EQ.audio.sfx('heal'); turn(); } }, '💪 Đấu lại từ đầu'),
            el('button', { class: 'btn', onclick: () => end('rest') }, '📒 Nghỉ & ôn bài')
          ])
        ]));
      }
      function end(result) {
        st.over = true; st.closed = true;
        close();
        if (result === 'rest') p.life = Math.max(p.life, Math.ceil(st.maxLife * 0.5));
        EQ.audio.music(EQ.REGIONS[p.region].music);
        if (result === 'dead' && EQ.game.respawn) EQ.game.respawn(p);
        resolve(result);
      }
      B._st = st;
      turn();
    });
  };

  EQ.battle = B;
})();
