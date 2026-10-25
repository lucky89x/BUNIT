/* Giao diện chung: hộp thoại NPC, cửa sổ (modal), thông báo, HUD, co giãn màn hình */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const UI = { stack: [], dlgOpen: false };

  UI.init = function () {
    UI.app = document.getElementById('app');
    UI.layer = document.getElementById('modals');
    UI.toasts = document.getElementById('toasts');
    UI.hud = document.getElementById('hud');
    UI.dlg = document.getElementById('dialog');
    UI.screen = document.getElementById('screen');
    window.addEventListener('resize', UI.fit);
    UI.fit();
  };

  // co giãn toàn bộ khung game 960x640 cho vừa cửa sổ
  UI.fit = function () {
    const s = Math.min(window.innerWidth / 960, window.innerHeight / 640);
    UI.scale = s;
    UI.app.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  };

  UI.busy = () => UI.stack.length > 0 || UI.dlgOpen || !UI.screen.classList.contains('hidden');

  // ---------- Cửa sổ ----------
  UI.modal = function (content, o) {
    o = o || {};
    const back = el('div', { class: 'modal-back' });
    const card = el('div', { class: 'modal-card ' + (o.cls || '') }, content);
    back.appendChild(card);
    UI.layer.appendChild(back);
    const entry = { back, onEsc: o.onEsc };
    UI.stack.push(entry);
    requestAnimationFrame(() => back.classList.add('show'));
    let closed = false;
    return function close() {
      if (closed) return; closed = true;
      UI.stack = UI.stack.filter(x => x !== entry);
      back.classList.remove('show');
      setTimeout(() => back.remove(), 160);
    };
  };
  UI.topEsc = function () {
    const top = UI.stack[UI.stack.length - 1];
    if (top && top.onEsc) { top.onEsc(); return true; }
    return !!top;
  };

  UI.alert = function (html, o) {
    o = o || {};
    return new Promise(res => {
      const body = el('div', { class: 'alert' }, [
        o.icon ? el('div', { class: 'alert-icon' }, o.icon) : null,
        o.title ? el('h2', null, o.title) : null,
        el('div', { class: 'alert-body', html }),
        el('div', { class: 'row center' }, [el('button', { class: 'btn primary big', onclick: () => { close(); res(true); } }, o.ok || 'OK')])
      ]);
      const close = UI.modal(body, { onEsc: () => { close(); res(true); } });
    });
  };
  UI.confirm = function (html, o) {
    o = o || {};
    return new Promise(res => {
      const body = el('div', { class: 'alert' }, [
        o.title ? el('h2', null, o.title) : null,
        el('div', { class: 'alert-body', html }),
        el('div', { class: 'row center' }, [
          el('button', { class: 'btn', onclick: () => { close(); res(false); } }, o.no || 'Không'),
          el('button', { class: 'btn ' + (o.danger ? 'danger' : 'primary'), onclick: () => { close(); res(true); } }, o.yes || 'Đồng ý')
        ])
      ]);
      const close = UI.modal(body, { onEsc: () => { close(); res(false); } });
    });
  };

  UI.toast = function (msg, type, ms) {
    // tránh thông báo trùng lặp và chồng chất
    const cur = Array.from(UI.toasts.children);
    if (cur.some(x => x.textContent === msg)) return;
    if (cur.length >= 3) cur[0].remove();
    const t = el('div', { class: 'toast ' + (type || '') }, msg);
    UI.toasts.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms || 2600);
  };

  UI.banner = function (big, small, cls) {
    const b = el('div', { class: 'banner ' + (cls || '') }, [el('div', { class: 'b-big' }, big), small ? el('div', { class: 'b-small' }, small) : null]);
    UI.app.appendChild(b);
    setTimeout(() => b.classList.add('out'), 2200);
    setTimeout(() => b.remove(), 2800);
  };

  // ---------- Chân dung nhân vật ----------
  UI.portrait = function (sp) {
    if (sp && sp.look) {
      const c = el('canvas', { width: 64, height: 64, class: 'portrait-cv' });
      const g = c.getContext('2d');
      EQ.sprites.human(g, 32, 62, sp.look, 'down', 0, { scale: 2.6, noShadow: true });
      return c;
    }
    return el('span', { class: 'portrait-e' }, (sp && sp.e) || '🧚');
  };

  // ---------- Hộp thoại NPC ----------
  // script: mảng nút hội thoại, sp: {name, look|e}
  UI.dialog = function (script, sp) {
    const p = EQ.game.profile;
    return new Promise(resolve => {
      UI.dlgOpen = true;
      const box = UI.dlg;
      box.classList.remove('hidden');
      let i = 0;
      let advance = null;
      UI._dlgKey = () => { if (advance) { const f = advance; advance = null; f(); return true; } return false; };
      function finish() { UI.dlgOpen = false; box.classList.add('hidden'); box.innerHTML = ''; UI._dlgKey = null; resolve(true); }
      function show() {
        if (i >= script.length) return finish();
        const n = script[i];
        box.innerHTML = '';
        const who = n.s === 'pip' ? { name: 'Pip (tinh linh)', e: '🧚' } : n.s === 'me' ? { name: p.name, look: EQ.sprites.playerLook(p.avatar) } : sp;
        const head = el('div', { class: 'dlg-head' }, [el('div', { class: 'dlg-portrait' }, UI.portrait(who)), el('div', { class: 'dlg-name' }, who.name || '')]);
        box.appendChild(head);
        const main = el('div', { class: 'dlg-main' });
        box.appendChild(main);
        if (n.ask) return showAsk(n, main);
        const en = U.fill(n.en, p);
        const vi = U.fill(n.vi, p);
        if (n.pic) main.appendChild(el('div', { class: 'dlg-pic' }, n.pic));
        if (en) {
          const tline = el('div', { class: 'dlg-en' });
          main.appendChild(el('div', { class: 'dlg-line' }, [tline, EQ.challenge.speakBtn(en)]));
          typewrite(tline, en);
          setTimeout(() => EQ.speech.speak(en), 150);
          const viBox = el('div', { class: 'dlg-vi' });
          if (EQ.learn.showVi(p) || n.s === 'me') viBox.textContent = vi;
          else viBox.appendChild(el('button', { class: 'btn-mini', onclick: () => { viBox.textContent = vi; } }, '🇻🇳 Xem nghĩa'));
          main.appendChild(viBox);
        } else {
          main.appendChild(el('div', { class: 'dlg-pip' }, vi));
        }
        const nextBtn = el('button', { class: 'btn primary dlg-next', onclick: () => { advance = null; i++; show(); } }, i < script.length - 1 ? 'Tiếp ▶ (E)' : 'Xong ✓ (E)');
        main.appendChild(nextBtn);
        advance = () => nextBtn.click();
        EQ.audio.sfx('talk');
      }
      function showAsk(n, main) {
        advance = null;
        const ask = U.fill(n.ask, p);
        if (n.pic) main.appendChild(el('div', { class: 'dlg-pic' }, n.pic));
        main.appendChild(el('div', { class: 'dlg-line' }, [el('div', { class: 'dlg-en' }, ask), EQ.challenge.speakBtn(ask)]));
        setTimeout(() => EQ.speech.speak(ask), 150);
        const viBox = el('div', { class: 'dlg-vi' });
        if (EQ.learn.showVi(p)) viBox.textContent = n.vi; else viBox.appendChild(el('button', { class: 'btn-mini', onclick: () => { viBox.textContent = n.vi; } }, '🇻🇳 Xem nghĩa'));
        main.appendChild(viBox);
        const area = el('div', { class: 'dlg-choices' });
        main.appendChild(area);
        const fb = el('div', { class: 'dlg-fb' });
        main.appendChild(fb);
        let first = true;
        const done = (ansText) => {
          EQ.audio.sfx('correct');
          area.innerHTML = '';
          fb.className = 'dlg-fb ok';
          fb.textContent = '✨ ' + ansText;
          EQ.speech.speak(ansText);
          EQ.game.reward(p, { xp: 5 }, true);
          if (EQ.speech.listenEnabled()) {
            let spoke = false;
            fb.appendChild(el('div', { class: 'dlg-mic' }, EQ.speech.micButton(ansText, () => { if (!spoke) { spoke = true; EQ.game.reward(p, { xp: 3 }, true); } })));
          }
          const go = el('button', { class: 'btn primary dlg-next', onclick: () => { advance = null; i++; show(); } }, 'Tiếp ▶ (E)');
          main.appendChild(go);
          advance = () => go.click();
        };
        const rec = ok => { if (first) { first = false; EQ.learn.record(p, { correct: ok, topic: n.topic || 'greet', key: 'd:' + n.ask, text: U.fill(n.ask, p) + ' → ' + U.fill(n.build || (n.opts.find(o => o.ok) || {}).en, p) }); } };
        // ghép câu khi bé đã tiến bộ
        if (n.build && p.diff >= 2 && !/\s{2,}/.test(n.build)) {
          const ansText = U.fill(n.build, p);
          const q = EQ.learn.orderFrom(ansText, n.vi + ' → hãy ghép câu trả lời', n.topic || 'order', 'd:' + n.ask);
          q.promptVi = 'Ghép câu trả lời của bạn';
          const holder = el('div', { class: 'dlg-build' });
          area.appendChild(holder);
          EQ.challenge.render(holder, q, { retry: true, allowHint: true, noRecord: false }).then(() => { first = false; area.innerHTML = ''; done(ansText); });
          return;
        }
        let opts = U.shuffle(n.opts.map(o => Object.assign({}, o, { en: U.fill(o.en, p), why: U.fill(o.why, p) })));
        // sau khi chọn sai: giải thích rồi xáo lại toàn bộ lựa chọn (không loại trừ dần → phải hiểu mới chọn đúng)
        const drawChoices = () => {
          area.innerHTML = '';
          opts.forEach(o => {
            const b = el('button', { class: 'choice' }, [el('span', null, o.en), el('span', { class: 'choice-say', title: 'Nghe', onclick: e => { e.stopPropagation(); EQ.speech.speak(o.en, { user: true }); } }, '🔊')]);
            b.onclick = () => {
              if (b.disabled) return;
              if (o.ok) { rec(true); b.classList.add('right'); done(o.en); }
              else {
                rec(false); b.classList.add('wrong'); EQ.audio.sfx('wrong');
                area.querySelectorAll('.choice').forEach(x => { x.disabled = true; });
                fb.className = 'dlg-fb bad';
                fb.textContent = '🧚 Pip: ' + (o.why || 'Chưa đúng, thử câu khác nhé!');
                setTimeout(() => { opts = U.shuffle(opts); UI._dlgChoices = opts; drawChoices(); }, 1400);
              }
            };
            area.appendChild(b);
          });
        };
        drawChoices();
        UI._dlgChoices = opts;
      }
      function typewrite(node, text) {
        let k = 0;
        node.textContent = '';
        const tick = () => { if (!node.isConnected) return; k += 2; node.textContent = text.slice(0, k); if (k < text.length) setTimeout(tick, 16); };
        tick();
      }
      show();
    });
  };

  // ---------- HUD ----------
  UI.buildHud = function () {
    UI.hud.innerHTML = '';
    UI.hudEls = {};
    const H = UI.hudEls;
    H.port = el('div', { class: 'hud-port' });
    H.name = el('div', { class: 'hud-name' });
    H.lv = el('div', { class: 'hud-lv' });
    H.xpFill = el('div', { class: 'xp-fill' });
    H.xpText = el('div', { class: 'xp-text' });
    H.gold = el('div', { class: 'hud-gold' });
    H.lifeFill = el('div', { class: 'life-fill' });
    H.lifeText = el('div', { class: 'life-text' });
    H.stones = el('div', { class: 'hud-stones' });
    H.region = el('div', { class: 'hud-region' });
    H.quest = el('div', { class: 'hud-quest' });
    H.mini = el('canvas', { class: 'minimap', width: 160, height: 112, title: 'Bản đồ (M)', onclick: () => EQ.screens.map() });
    const left = el('div', { class: 'hud-left' }, [
      el('div', { class: 'hud-card' }, [H.port, el('div', { class: 'hud-info' }, [el('div', { class: 'row tight' }, [H.name, H.lv]), el('div', { class: 'life-bar hud', title: 'Thanh máu: trả lời sai khi đánh quái sẽ bị cắn mất máu. Hết máu → gục ngã, rơi 1 món đồ!' }, [H.lifeFill, H.lifeText]), el('div', { class: 'xp-bar' }, [H.xpFill, H.xpText]), H.gold])]),
      H.quest
    ]);
    const btn = (icon, label, key, fn) => el('button', { class: 'hud-btn', title: label + ' (' + key + ')', onclick: fn }, [el('span', null, icon), el('small', null, label)]);
    const right = el('div', { class: 'hud-right' }, [
      el('div', { class: 'hud-btns' }, [
        btn('🎒', 'Túi đồ', 'I', () => EQ.screens.inventory()),
        btn('📒', 'Sổ từ', 'N', () => EQ.screens.notebook()),
        btn('📗', 'Sách', 'B', () => EQ.screens.book()),
        btn('📜', 'Nhiệm vụ', 'Q', () => EQ.screens.quests()),
        btn('🗺️', 'Bản đồ', 'M', () => EQ.screens.map()),
        btn('⏸️', 'Tạm dừng', 'Esc', () => EQ.screens.pause())
      ]),
      H.mini
    ]);
    UI.hud.appendChild(left);
    UI.hud.appendChild(el('div', { class: 'hud-top' }, [H.region, H.stones]));
    UI.hud.appendChild(right);
    UI.hud.appendChild(el('button', { class: 'hud-arcade', title: 'Khu vui chơi (G)', onclick: () => EQ.arcade.open() }, [el('span', null, '🎮'), el('b', null, 'Khu vui chơi')]));
    UI.hud.appendChild(el('div', { class: 'hud-help' }, 'Di chuyển: W A S D / phím mũi tên / 🖱️ bấm chuột vào bản đồ • Tương tác: E hoặc bấm vào NPC • Tạm dừng: Esc'));
  };

  UI.updateHud = function () {
    const p = EQ.game.profile, H = UI.hudEls;
    if (!p || !H) return;
    const need = EQ.game.xpNeed(p.level);
    H.name.textContent = p.name;
    H.lv.textContent = 'Cấp ' + p.level;
    H.xpFill.style.width = Math.min(100, p.xp / need * 100) + '%';
    H.xpText.textContent = 'XP ' + p.xp + ' / ' + need;
    const life = EQ.rpg.lifeOf(p), ml = EQ.rpg.maxLife(p);
    H.lifeFill.style.width = (life / ml * 100) + '%';
    H.lifeFill.classList.toggle('low', life <= ml * 0.3);
    H.lifeText.textContent = '❤️ ' + life + ' / ' + ml;
    H.gold.textContent = '🪙 ' + p.gold + '   💪 ' + EQ.rpg.power(p) + '   ⭐ ' + EQ.learn.learnedIds(p).length + ' từ';
    if (!H.port.firstChild || H._outfit !== p.avatar.outfit + p.avatar.hair + p.avatar.hairC + p.avatar.skin) {
      H.port.innerHTML = ''; H.port.appendChild(UI.portrait({ look: EQ.sprites.playerLook(p.avatar) }));
      H._outfit = p.avatar.outfit + p.avatar.hair + p.avatar.hairC + p.avatar.skin;
    }
    const reg = EQ.REGIONS[p.region];
    H.region.textContent = reg ? reg.name + ' · ' + reg.en : '';
    const st = ['stone_red', 'stone_green', 'stone_blue', 'stone_aqua', 'stone_gold'];
    const ic = ['🔴', '🟢', '🔵', '🔷', '🟡'];
    H.stones.innerHTML = '';
    st.forEach((s, k) => H.stones.appendChild(el('span', { class: 'stone' + (p.items[s] ? ' got' : ''), title: (EQ.ITEMS[s] || {}).name || 'Viên đá chưa tìm thấy' }, p.items[s] ? ic[k] : '◇')));
    // nhiệm vụ đang theo dõi
    const info = EQ.game.trackedInfo(p);
    const key = info ? info.title + info.obj + (info.en || '') + info.progress : '';
    if (H._q !== key) {
      H._q = key;
      H.quest.innerHTML = '';
      if (info) {
        H.quest.appendChild(el('div', { class: 'hq-title' }, '📍 ' + info.title));
        H.quest.appendChild(el('div', { class: 'hq-obj' }, info.obj + (info.progress ? ' ' + info.progress : '')));
        if (info.en) H.quest.appendChild(el('div', { class: 'hq-en' }, [el('span', null, info.en), EQ.challenge.speakBtn(info.en, '🔊', 'small')]));
        H.quest.classList.remove('hidden');
      } else H.quest.classList.add('hidden');
    }
  };

  EQ.ui = UI;
})();
