/* Trận đấu kiến thức: trả lời đúng → tung phép thuật; sai → được giải thích, mất 1 trái tim (không bị phạt nặng) */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el, SP = EQ.sprites;
  const B = {};

  // chỉ số lấy từ cấp độ + trang bị (xem js/data/gear.js)
  B.power = p => EQ.rpg.stats(p).atk;
  B.maxHearts = p => EQ.rpg.stats(p).hp;

  // o: {def, color, hp, name, spec, boss, hard}
  B.start = function (o) {
    const p = EQ.game.profile;
    return new Promise(resolve => {
      const st = { hp: o.hp, maxHp: o.hp, hearts: B.maxHearts(p), maxHearts: B.maxHearts(p), combo: 0, fx: [], shake: 0, mShake: 0, mJump: 0, t: 0, over: false };
      const src = EQ.learn.battleSource(p, o.spec || {});
      EQ.audio.music('battle');
      const cv = el('canvas', { width: 720, height: 210, class: 'arena' });
      const ctx = cv.getContext('2d');
      const heartsEl = el('div', { class: 'bt-hearts' });
      const hpFill = el('div', { class: 'hp-fill' });
      const hpText = el('div', { class: 'hp-text' });
      const comboEl = el('div', { class: 'bt-combo' });
      const qbox = el('div', { class: 'qbox' });
      const pieBtn = el('button', { class: 'btn small' });
      const fleeBtn = el('button', { class: 'btn ghost small' }, '🏃 Rời trận');
      const body = el('div', { class: 'battle' }, [
        el('div', { class: 'bt-top' }, [
          el('div', { class: 'bt-side' }, [el('b', null, p.name), heartsEl]),
          comboEl,
          el('div', { class: 'bt-side right' }, [el('b', null, (o.boss ? '👑 ' : '') + o.name), el('div', { class: 'hp-bar' }, [hpFill, hpText])])
        ]),
        cv,
        qbox,
        el('div', { class: 'row bt-actions' }, [pieBtn, el('span', { class: 'bt-tip' }, 'Không giới hạn thời gian – cứ bình tĩnh suy nghĩ nhé!'), fleeBtn])
      ]);
      const close = EQ.ui.modal(body, { cls: 'wide battle-card', onEsc: () => fleeBtn.click() });
      function drawBars() {
        heartsEl.innerHTML = '';
        for (let i = 0; i < st.maxHearts; i++) heartsEl.appendChild(el('span', { class: 'heart' + (i < st.hearts ? '' : ' empty') }, i < st.hearts ? '❤️' : '🤍'));
        hpFill.style.width = Math.max(0, st.hp / st.maxHp * 100) + '%';
        hpText.textContent = Math.max(0, st.hp) + ' / ' + st.maxHp;
        comboEl.textContent = st.combo >= 2 ? '🔥 Combo x' + st.combo : '';
        const n = p.items.pie || 0;
        pieBtn.textContent = '🥧 Bánh táo (' + n + ')';
        pieBtn.disabled = n <= 0 || st.hearts >= st.maxHearts;
      }
      pieBtn.onclick = () => {
        if (!(p.items.pie > 0) || st.hearts >= st.maxHearts) return;
        p.items.pie--; st.hearts = Math.min(st.maxHearts, st.hearts + 2);
        EQ.audio.sfx('heal'); fxText(170, 70, '+2 ❤️', '#ff8a80'); drawBars();
      };
      fleeBtn.onclick = () => { if (st.over) return; end('flee'); };

      // ----- vẽ đấu trường -----
      const themes = { village: ['#9be7ff', '#bff3a7', '#7cc35a'], forest: ['#7fd1b9', '#5fae6e', '#3f8f46'], castle: ['#b39ddb', '#9fa8da', '#8e88a3'] };
      function fxText(x, y, text, color) { st.fx.push({ type: 'text', x, y, text, color, life: 1.2 }); }
      function loop() {
        if (st.closed) return;
        const dt = 1 / 60; st.t += dt;
        const th = themes[p.region] || themes.village;
        const g = ctx.createLinearGradient(0, 0, 0, 210);
        g.addColorStop(0, th[0]); g.addColorStop(0.6, th[1]); g.addColorStop(1, th[2]);
        ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 210);
        ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.ellipse(170, 178, 90, 14, 0, 0, 7); ctx.ellipse(540, 178, 120, 18, 0, 0, 7); ctx.fill();
        const sx = st.shake > 0 ? Math.sin(st.t * 60) * 4 : 0; st.shake = Math.max(0, st.shake - dt);
        SP.human(ctx, 170 + sx, 180, SP.playerLook(p.avatar), 'right', Math.floor(st.t * 4), { scale: 4, moving: false });
        // đũa phép
        ctx.fillStyle = '#8d6e63'; ctx.fillRect(205 + sx, 120, 18, 4);
        ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(225 + sx, 122, 5 + Math.sin(st.t * 8), 0, 7); ctx.fill();
        if (st.hp > 0 || st.mFade > 0) {
          const mx = 540 + (st.mShake > 0 ? Math.sin(st.t * 70) * 6 : 0);
          const my = 182 - (st.mJump > 0 ? Math.sin((1 - st.mJump) * Math.PI) * 30 : 0);
          st.mShake = Math.max(0, st.mShake - dt); st.mJump = Math.max(0, st.mJump - dt * 2);
          ctx.globalAlpha = st.hp > 0 ? 1 : Math.max(0, st.mFade);
          SP.monster(ctx, o.def, mx, my, 26 * (o.def.size || 1.4) * (o.boss ? 1 : 0.9), o.color || o.def.color, st.t);
          ctx.globalAlpha = 1;
          if (st.hp <= 0) st.mFade -= dt;
        }
        st.fx.forEach(f => {
          f.life -= dt;
          if (f.type === 'bolt') {
            f.k = Math.min(1, (f.k || 0) + dt * 2.2);
            const x = 230 + (520 - 230) * f.k, y = 120 - Math.sin(f.k * Math.PI) * 50;
            for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#fff59d', '#ffd54f', '#b388ff', '#80d8ff'][i % 4]; ctx.beginPath(); ctx.arc(x - i * 7, y + Math.sin(st.t * 30 + i) * 3, 9 - i, 0, 7); ctx.fill(); }
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
          EQ.audio.sfx('spell');
          await new Promise(res => st.fx.push({ type: 'bolt', life: 5, onHit: res }));
          st.hp -= dmg; st.mShake = 0.4;
          EQ.audio.sfx('hit');
          sparks(540, 120, 18);
          fxText(540, 70, '-' + dmg + (st.combo >= 3 ? ' 🔥' : ''), '#fff59d');
          EQ.game.reward(p, { xp: r.hint ? 2 : 4 }, true);
        } else {
          st.combo = 0;
          src.missed(q);
          st.mJump = 1;
          await new Promise(res => st.fx.push({ type: 'puff', life: 5, onHit: res }));
          // phòng thủ: có cơ hội chặn đòn
          if (Math.random() * 100 < EQ.rpg.stats(p).def) {
            EQ.audio.sfx('heal'); fxText(170, 70, '🛡️ Chặn!', '#80d8ff');
          } else {
            const lose = o.matk || 1;
            st.hearts = Math.max(0, st.hearts - lose); st.shake = 0.4;
            EQ.audio.sfx('bump');
            fxText(170, 70, '-' + lose + ' ❤️', '#ff8a80');
          }
        }
        drawBars();
        if (st.hp <= 0) return win();
        if (st.hearts <= 0) return tired();
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
      function tired() {
        st.over = true;
        qbox.innerHTML = '';
        qbox.appendChild(el('div', { class: 'bt-result' }, [
          el('div', { class: 'res-big' }, '😮‍💨 Bạn hơi mệt rồi!'),
          el('div', { class: 'res-vi' }, 'Không sao cả! Mỗi lần sai là một lần học thêm. ' + o.name + ' đã hồi sức, nên muốn thắng bạn cần trả lời đúng nhiều hơn. Ôn lại các từ vừa sai sẽ giúp bạn mạnh hơn đấy!'),
          el('div', { class: 'row center' }, [
            el('button', { class: 'btn primary big', onclick: () => { st.over = false; st.hearts = st.maxHearts; st.hp = st.maxHp; st.combo = 0; EQ.audio.sfx('heal'); turn(); } }, '💪 Đấu lại từ đầu'),
            el('button', { class: 'btn', onclick: () => end('rest') }, '📒 Nghỉ & ôn bài')
          ])
        ]));
      }
      function end(result) {
        st.over = true; st.closed = true;
        close();
        EQ.audio.music(EQ.REGIONS[p.region].music);
        resolve(result);
      }
      B._st = st;
      turn();
    });
  };

  EQ.battle = B;
})();
