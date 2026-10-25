/* ENGLISH QUEST – VÙNG HOANG DÃ (bản 1.8)
 *  👹 Boss thế giới "Quỷ Một Mắt": máu nhiều, cắn rất đau. Thắng → nhiều vàng, XP và 1 TRANG BỊ NGẪU NHIÊN.
 *     Thua (hết máu) → gục ngã, rơi 1 món đồ đang mặc như khi thua quái thường.
 *     Hạ xong Boss nghỉ 5 phút rồi mới xuất hiện lại; mỗi lần thắng Boss mạnh thêm và rơi đồ xịn hơn.
 *  ⛲ Suối hồi máu: hồi đầy thanh máu miễn phí.
 */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el, SP = EQ.sprites, R = EQ.rpg;
  const WB = {};
  WB.REST = 5 * 60 * 1000;
  WB.def = { name: 'Quỷ Một Mắt', draw: 'golem', color: '#7e57c2', crown: true, size: 2.3,
    win: { en: 'Argh... You are too strong for me!', vi: 'Áaa... Ngươi mạnh quá, ta thua rồi!' } };
  function st(p) { p.wboss = p.wboss || { wins: 0, next: 0 }; return p.wboss; }
  // chỉ số Boss tăng theo cấp nhân vật và số lần đã thắng
  WB.stats = function (p) {
    const w = st(p).wins;
    const hp = 40 + p.level * 4 + w * 10;
    const bite = 26 + w * 3;
    return { hp, bite, matk: 3, rec: EQ.world.monsterRec({ hp, bite, matk: 3 }),
      gold: 150 + p.level * 10 + w * 25, xp: 150 + p.level * 10, tier: [2, Math.min(5, 3 + Math.floor(w / 2))] };
  };
  WB.resting = p => Math.max(0, st(p).next - Date.now());

  WB.boss = async function (e) {
    const p = EQ.game.profile;
    const rest = WB.resting(p);
    if (rest > 0) {
      return EQ.ui.alert('👹 Quỷ Một Mắt đang ngủ hồi sức sau trận thua. Quay lại sau <b>' + Math.ceil(rest / 60000) + ' phút</b> nữa nhé!<br>Trong lúc chờ, hãy săn quái quanh đây để kiếm vàng & XP.', { icon: '💤', title: 'Boss đang nghỉ' });
    }
    const s = WB.stats(p), pw = R.power(p), life = R.lifeOf(p), ml = R.maxLife(p);
    const hits = R.hitsToKill(p, s.hp);
    const ok = await new Promise(res => {
      const cv = el('canvas', { width: 200, height: 150 });
      const ctx = cv.getContext('2d'); let t = 0, alive = true;
      (function loop() { if (!alive) return; t += 1 / 60; ctx.clearRect(0, 0, 200, 150); SP.monster(ctx, WB.def, 100, 145, 50, WB.def.color, t); requestAnimationFrame(loop); })();
      const body = el('div', { class: 'wb-card' }, [
        el('h2', null, '👹 Boss thế giới: Quỷ Một Mắt'),
        cv,
        el('div', { class: 'wb-stats' }, [
          el('span', null, '❤️ Máu Boss ' + s.hp),
          el('span', null, '🦷 Cắn ' + s.bite + ' máu/câu sai'),
          el('span', null, '💪 Đề xuất ' + s.rec),
          el('span', null, '⚔️ Cần ~' + hits + ' câu đúng')
        ]),
        el('p', null, ['Lực chiến của bạn: ', el('b', { style: { color: pw >= s.rec ? '#2e7d32' : '#c62828' } }, String(pw)), ' • Máu: ', el('b', null, life + ' / ' + ml)]),
        el('p', { class: 'small' }, '🏆 Thắng: +' + s.gold + ' 🪙, +' + s.xp + ' XP và 1 trang bị ngẫu nhiên (bậc ' + R.TIERS[s.tier[0]] + ' → ' + R.TIERS[s.tier[1]] + ').'),
        el('p', { class: 'small', style: { color: '#c62828' } }, '⚠️ Hết máu là gục ngã và RƠI 1 MÓN ĐỒ đang mặc! Nên hồi đầy máu ở ⛲ Suối trước khi đánh.'),
        el('div', { class: 'row center' }, [
          el('button', { class: 'btn primary big', onclick: () => { alive = false; close(); res(true); } }, '⚔️ Thách đấu!'),
          el('button', { class: 'btn', onclick: () => { alive = false; close(); res(false); } }, 'Để sau')
        ])
      ]);
      const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => { alive = false; close(); res(false); } });
    });
    if (!ok) return;
    const res = await EQ.battle.start({ def: WB.def, color: WB.def.color, hp: s.hp, name: '👹 ' + WB.def.name, boss: true, bite: s.bite, matk: s.matk, spec: {} });
    if (res !== 'win') return;
    const w = st(p);
    w.wins++; w.next = Date.now() + WB.REST;
    const c = EQ.world.entCenter(e);
    EQ.world.burst(c.x, c.y - 20, ['#b388ff', '#ffd54f', '#ff80ab', '#ffffff'], 50);
    await EQ.game.reward(p, { gold: s.gold, xp: s.xp });
    const it = R.randomDrop(p, s.tier[0], s.tier[1]);
    const had = p.gear.owned[it.id] != null;
    if (had) { p.gear.owned[it.id] = Math.min(5, p.gear.owned[it.id] + 1); }
    else R.give(p, it.id);
    R.count(p, 'kill');
    EQ.game.saveNow();
    await EQ.ui.alert('Quỷ Một Mắt để lại: <b style="color:' + R.TIER_COL[it.tier] + '">' + it.e + ' ' + U.esc(it.name) + '</b> (' + R.TIERS[it.tier] + ')' +
      (had ? '<br>Bạn đã có món này nên nó được <b>nâng cấp +1</b>!' : '<br>Vào 🎒 Trang bị để mặc vào nhé.'), { icon: '🎁', title: 'Hạ Boss thế giới!' });
  };

  WB.heal = async function () {
    const p = EQ.game.profile;
    const ml = R.maxLife(p);
    if (R.lifeOf(p) >= ml) return EQ.ui.toast('⛲ Máu của bạn đang đầy rồi (' + ml + ').', 'good');
    p.life = ml;
    EQ.audio.sfx('heal');
    EQ.world.burst(EQ.world.player.x, EQ.world.player.y - 20, ['#80d8ff', '#b9f6ca', '#ffffff'], 30);
    EQ.world.atPlayer('❤️ Hồi đầy máu!', '#ff8a80');
    EQ.ui.toast('⛲ Nước suối mát lạnh: hồi đầy ' + ml + ' máu.', 'good');
  };

  // vẽ Boss trên bản đồ (đang ngủ thì hiện Zz)
  const baseDeco = SP.deco;
  SP.deco = function (ctx, kind, cx, by, t, e) {
    if (kind !== 'wboss') return baseDeco(ctx, kind, cx, by, t, e);
    const p = EQ.game.profile, rest = p ? WB.resting(p) : 0;
    ctx.save();
    if (rest > 0) ctx.globalAlpha = 0.55;
    SP.monster(ctx, WB.def, cx, by + 4, 22, WB.def.color, rest > 0 ? 0 : t);
    ctx.restore();
    if (rest > 0) SP.emoji(ctx, '💤', cx + 22, by - 50 - Math.sin(t * 2) * 4, 14);
    else { ctx.globalAlpha = 0.3 + 0.2 * Math.sin(t * 4); ctx.fillStyle = '#e040fb'; ctx.beginPath(); ctx.ellipse(cx, by, 34, 9, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
  };

  EQ.wild = WB;
})();
