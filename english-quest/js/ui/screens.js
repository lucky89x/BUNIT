/* Các màn hình: menu chính, hồ sơ, tạo nhân vật, cốt truyện, kiểm tra đầu vào, túi đồ, sổ từ,
 * nhiệm vụ, bản đồ, cửa hàng, đi chợ, cài đặt, thành tích, bảng phụ huynh */
window.EQ = window.EQ || {};
(function () {
  const U = EQ.U, el = U.el;
  const S = {};
  const store = () => EQ.store;

  function screen(children, cls) {
    const sc = EQ.ui.screen;
    sc.className = 'screen ' + (cls || '');
    sc.innerHTML = '';
    (Array.isArray(children) ? children : [children]).forEach(c => c && sc.appendChild(c));
  }
  function hideScreen() { EQ.ui.screen.className = 'screen hidden'; EQ.ui.screen.innerHTML = ''; S.back = null; }
  function avatarCanvas(av, size, dir) {
    const c = el('canvas', { width: size, height: size, class: 'av-cv' });
    const g = c.getContext('2d');
    EQ.sprites.human(g, size / 2, size - 4, EQ.sprites.playerLook(av), dir || 'down', 0, { scale: size / 22 });
    return c;
  }
  S.avatarCanvas = avatarCanvas;

  // ---------- Nền động của màn hình chính ----------
  S.drawTitleBg = function (ctx, t) {
    const def = EQ.REGIONS.village;
    const rows = def._rows || (def._rows = def.build());
    const TS = EQ.TILE;
    const ox = (t * 14) % (rows[0].length * TS - 960);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 960, 640);
    const x0 = Math.floor(ox / TS);
    EQ.sprites.region = 'village';
    for (let y = 0; y < 21 && y < rows.length; y++) for (let x = x0; x < x0 + 32 && x < rows[0].length; x++) EQ.sprites.drawTile(ctx, rows[y][x], x, y, x * TS - ox, y * TS, t);
    if (EQ.sprites.drawTallTree) {
      ctx.save(); ctx.translate(-ox, 0);
      for (let y = 0; y < 23 && y < rows.length; y++) for (let x = x0; x < x0 + 32 && x < rows[0].length; x++) if (EQ.sprites.isTree(rows[y][x])) EQ.sprites.drawTallTree(ctx, rows[y][x], x, y, t);
      ctx.restore();
    }
    const g = ctx.createLinearGradient(0, 0, 0, 640);
    g.addColorStop(0, 'rgba(40,20,90,.55)'); g.addColorStop(1, 'rgba(20,10,50,.75)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 960, 640);
    for (let i = 0; i < 40; i++) {
      const x = (EQ.sprites.hash(i, 1) % 960 + t * (8 + i % 5)) % 960, y = (EQ.sprites.hash(i, 2) % 640 - t * (12 + i % 7) + 6400) % 640;
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 2 + i);
      ctx.fillStyle = ['#fff59d', '#b388ff', '#80d8ff', '#ff80ab'][i % 4]; ctx.fillRect(x, y, 3, 3);
    }
    ctx.globalAlpha = 1;
  };

  // ---------- Màn hình chính ----------
  S.title = function () {
    EQ.audio.music('title');
    const d = store().data;
    const last = d.lastProfile && store().getProfile(d.lastProfile);
    screen([
      el('div', { class: 'title-wrap' }, [
        el('div', { class: 'logo' }, [el('div', { class: 'logo-top' }, '✨ ENGLISH QUEST ✨'), el('div', { class: 'logo-sub' }, 'Hành trình giải cứu Vương quốc Ngôn ngữ')]),
        el('div', { class: 'stones-row' }, ['🔴', '🟢', '🔵', '🔷', '🟡'].map((s, i) => el('span', { class: 'ts', style: { animationDelay: i * 0.2 + 's' } }, s))),
        el('div', { class: 'menu' }, [
          last ? el('button', { class: 'btn primary big', onclick: () => { hideScreen(); EQ.game.startProfile(last); } }, [el('span', null, '▶ Tiếp tục'), el('small', null, ' – ' + last.name + ' (Cấp ' + last.level + ')')]) : null,
          el('button', { class: 'btn big ' + (last ? '' : 'primary'), onclick: () => S.profiles() }, '⭐ Bắt đầu / Chọn nhân vật'),
          el('div', { class: 'row center' }, [
            el('button', { class: 'btn', onclick: () => S.settings() }, '⚙️ Cài đặt'),
            el('button', { class: 'btn', onclick: () => S.achievements() }, '🏅 Thành tích'),
            el('button', { class: 'btn', onclick: () => S.help() }, '❓ Hướng dẫn'),
            el('button', { class: 'btn', onclick: () => S.parent() }, '👨‍👩‍👧 Phụ huynh')
          ])
        ]),
        el('div', { class: 'title-foot' }, 'Không quảng cáo • Không mua bán • Dữ liệu chỉ lưu trên máy này')
      ])
    ], 'title');
    S.back = null;
    if (!store().ok) EQ.ui.toast('⚠️ ' + store().warn, 'warn', 9000);
  };

  // ---------- Chọn hồ sơ ----------
  S.profiles = function () {
    const ps = store().data.profiles;
    const cards = ps.map(p => el('div', { class: 'pcard' }, [
      avatarCanvas(p.avatar, 96),
      el('div', { class: 'pc-name' }, p.name),
      el('div', { class: 'pc-meta' }, 'Lớp ' + p.grade + ' • Cấp ' + p.level),
      el('div', { class: 'pc-meta' }, '⭐ ' + EQ.learn.learnedIds(p).length + ' từ • 🏆 ' + EQ.Q.doneCount(p) + ' nhiệm vụ'),
      el('div', { class: 'pc-meta small' }, p.lastPlayed ? 'Chơi lần cuối: ' + new Date(p.lastPlayed).toLocaleDateString('vi-VN') : 'Chưa chơi'),
      el('button', { class: 'btn primary', onclick: () => { hideScreen(); if (!p.placement.done) S.placementOffer(p); else EQ.game.startProfile(p); } }, '▶ Chơi')
    ]));
    if (ps.length < 6) cards.push(el('div', { class: 'pcard new', onclick: () => S.create() }, [el('div', { class: 'plus' }, '+'), el('div', null, 'Tạo nhân vật mới')]));
    screen([
      el('h1', null, 'Chọn nhân vật'),
      el('p', { class: 'muted' }, 'Mỗi bạn có hồ sơ và tiến độ học riêng.'),
      el('div', { class: 'pcards' }, cards),
      el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => S.title() }, '◀ Quay lại')])
    ], 'menu-screen');
    S.back = S.title;
  };

  // ---------- Tạo nhân vật ----------
  S.create = function () {
    const av = { hair: 'long', hairC: EQ.HAIR_COLORS[0], skin: EQ.SKINS[0], outfit: 'basic' };
    let grade = 6, age = 11;
    const prev = el('canvas', { width: 160, height: 160, class: 'av-big' });
    let dirI = 0;
    const dirs = ['down', 'right', 'up', 'left'];
    function drawPrev() {
      const g = prev.getContext('2d'); g.clearRect(0, 0, 160, 160);
      EQ.sprites.human(g, 80, 154, EQ.sprites.playerLook(av), dirs[dirI % 4], 0, { scale: 7 });
    }
    const spin = setInterval(() => { if (!prev.isConnected) return clearInterval(spin); dirI++; drawPrev(); }, 1200);
    const name = el('input', { class: 'inp', maxlength: 14, placeholder: 'Ví dụ: Anna, Mai, Linh...' });
    const pick = (opts, cur, fn, render) => {
      const row = el('div', { class: 'picks' });
      const draw = c => { row.innerHTML = ''; opts.forEach(o => row.appendChild(render(o, o === c, () => { fn(o); draw(o); drawPrev(); }))); };
      draw(cur); return row;
    };
    const gradeRow = pick([6, 7, 8, 9], 6, g => { grade = g; age = g + 5; ageSel.value = String(age); }, (o, on, f) => el('button', { class: 'chip' + (on ? ' on' : ''), onclick: f }, 'Lớp ' + o));
    const ageSel = el('select', { class: 'inp small', onchange: () => { age = +ageSel.value; } }, [10, 11, 12, 13, 14, 15].map(a => el('option', { value: a }, a + ' tuổi')));
    ageSel.value = '11';
    const hairRow = pick(Object.keys(EQ.HAIRS), av.hair, h => { av.hair = h; }, (o, on, f) => el('button', { class: 'chip' + (on ? ' on' : ''), onclick: f }, EQ.HAIRS[o]));
    const hcRow = pick(EQ.HAIR_COLORS, av.hairC, c => { av.hairC = c; }, (o, on, f) => el('button', { class: 'sw' + (on ? ' on' : ''), style: { background: o }, onclick: f }));
    const skRow = pick(EQ.SKINS, av.skin, c => { av.skin = c; }, (o, on, f) => el('button', { class: 'sw' + (on ? ' on' : ''), style: { background: o }, onclick: f }));
    screen([
      el('h1', null, 'Tạo nữ anh hùng của bạn'),
      el('div', { class: 'create' }, [
        el('div', { class: 'create-prev' }, [prev, el('div', { class: 'muted small' }, 'Thêm trang phục mới khi hoàn thành nhiệm vụ!')]),
        el('div', { class: 'create-form' }, [
          el('label', null, 'Tên / biệt danh'), name,
          el('label', null, 'Lớp & tuổi'), el('div', { class: 'row' }, [gradeRow, ageSel]),
          el('label', null, 'Kiểu tóc'), hairRow,
          el('label', null, 'Màu tóc'), hcRow,
          el('label', null, 'Màu da'), skRow,
          el('div', { class: 'row' }, [
            el('button', { class: 'btn', onclick: () => S.profiles() }, '◀ Quay lại'),
            el('button', { class: 'btn primary big', onclick: () => {
              const n = name.value.trim().replace(/[<>{}]/g, '');
              if (!n) { name.focus(); return EQ.ui.toast('Hãy đặt tên cho nhân vật nhé!', 'warn'); }
              const p = store().newProfile({ name: n, grade, age, avatar: av });
              S.story(p);
            } }, 'Bắt đầu phiêu lưu ▶')
          ])
        ])
      ])
    ], 'menu-screen');
    drawPrev();
    setTimeout(() => name.focus(), 100);
    S.back = S.profiles;
  };

  // ---------- Cốt truyện mở đầu ----------
  S.story = function (p) {
    const panels = [
      { e: '🏰🌈', t: 'Ngày xửa ngày xưa, ở vương quốc English Land, mọi người trò chuyện với nhau bằng những lời nói tươi đẹp.' },
      { e: '🔴🟢🔵🔷🟡', t: 'Năm Viên Đá Ngôn Ngữ giữ cho lời nói luôn sống động: Lời Chào, Từ Vựng, Ngữ Pháp, Nghe Hiểu và Giao Tiếp.' },
      { e: '🌑🤫', t: 'Một đêm nọ, Chúa tể Im Lặng đã lấy đi cả năm viên đá. Mọi người dần quên mất cách nói tiếng Anh...' },
      { e: '🧚✨', t: 'Bạn – ' + p.name + ' – là nữ anh hùng trẻ được chọn. Tinh linh Pip sẽ đi cùng và giải thích bằng tiếng Việt mỗi khi bạn cần.' },
      { e: '🗺️⚔️', t: 'Hãy khám phá làng, rừng, lâu đài... giúp đỡ mọi người và thu hồi các viên đá. Sai cũng không sao – mỗi lần sai là một lần học thêm!' }
    ];
    let i = 0;
    function draw() {
      const pn = panels[i];
      screen([
        el('div', { class: 'story' }, [
          el('div', { class: 'story-e' }, pn.e),
          el('div', { class: 'story-t' }, pn.t),
          el('div', { class: 'dots' }, panels.map((x, k) => el('span', { class: 'dot' + (k <= i ? ' done' : '') }))),
          el('div', { class: 'row center' }, [
            el('button', { class: 'btn ghost', onclick: () => S.placementOffer(p) }, 'Bỏ qua'),
            el('button', { class: 'btn primary big', onclick: () => { i++; if (i >= panels.length) S.placementOffer(p); else draw(); } }, i < panels.length - 1 ? 'Tiếp ▶' : 'Lên đường! ▶')
          ])
        ])
      ], 'menu-screen story-screen');
    }
    draw();
    S.back = null;
  };

  // ---------- Kiểm tra đầu vào (có thể bỏ qua) ----------
  S.placementOffer = function (p) {
    screen([
      el('div', { class: 'story' }, [
        el('div', { class: 'story-e' }, '🧚📝'),
        el('h2', null, 'Khởi động nhẹ nhàng'),
        el('div', { class: 'story-t' }, 'Pip muốn biết bạn đã biết những gì để chọn độ khó vừa sức. Gồm 10 câu ngắn, không tính điểm, không giới hạn thời gian. Không biết thì cứ đoán nhé!'),
        el('div', { class: 'row center' }, [
          el('button', { class: 'btn', onclick: () => { p.placement = { done: true, score: 0, skipped: true }; p.diff = 1; store().save(); hideScreen(); EQ.game.startProfile(p); } }, 'Bỏ qua – bắt đầu từ cơ bản'),
          el('button', { class: 'btn primary big', onclick: () => runPlacement(p) }, 'Làm thử ▶')
        ])
      ])
    ], 'menu-screen story-screen');
    S.back = null;
  };
  async function runPlacement(p) {
    hideScreen();
    EQ.game.profile = p; // cần cho phần hiển thị câu hỏi
    const qs = EQ.learn.placementQuestions(p);
    const r = await EQ.challenge.run(qs, { title: 'Khởi động', icon: '🧚', retry: false, cancelable: false, noRecord: true });
    const score = r.correct;
    p.diff = U.clamp(1 + score / 10 * 1.6, 1, 2.6);
    p.hist = [];
    p.placement = { done: true, score, at: Date.now() };
    store().save();
    const level = p.diff < 1.5 ? 'Khởi động (rất cơ bản)' : p.diff < 2.1 ? 'Cơ bản' : 'Khá';
    await EQ.ui.alert('Bạn trả lời đúng <b>' + score + '/10</b> câu.<br>Game sẽ bắt đầu ở mức: <b>' + level + '</b>.<br><br>Độ khó sẽ tự điều chỉnh theo cách bạn chơi. Cố lên nhé!', { icon: '🌟', title: 'Hoàn thành khởi động!', ok: 'Vào game ▶' });
    EQ.game.startProfile(p);
  }

  // ---------- Tạm dừng ----------
  S.pause = function () {
    if (EQ.ui.busy()) return;
    const body = el('div', { class: 'pause' }, [
      el('h2', null, '⏸️ Tạm dừng'),
      el('div', { class: 'menu' }, [
        el('button', { class: 'btn primary big', onclick: () => close() }, '▶ Tiếp tục chơi'),
        el('button', { class: 'btn', onclick: () => { close(); S.settings(); } }, '⚙️ Cài đặt'),
        el('button', { class: 'btn', onclick: () => { close(); S.achievements(); } }, '🏅 Thành tích'),
        el('button', { class: 'btn', onclick: () => { close(); S.help(); } }, '❓ Hướng dẫn'),
        el('button', { class: 'btn', onclick: () => { close(); EQ.game.toMenu(); } }, '💾 Lưu & về màn hình chính')
      ])
    ]);
    const close = EQ.ui.modal(body, { onEsc: () => close() });
  };

  // ---------- Cài đặt ----------
  S.settings = function () {
    const s = store().settings();
    const save = () => { store().save(); EQ.audio.applySettings(); };
    const toggle = (key, label) => el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: s[key], onchange: e => { s[key] = e.target.checked; save(); } }), el('span', null, label)]);
    const slider = (key, label, min, max, step) => el('label', { class: 'sld' }, [el('span', null, label), el('input', { type: 'range', min, max, step, value: s[key], oninput: e => { s[key] = +e.target.value; save(); } })]);
    const voiceSel = el('select', { class: 'inp small' });
    function fillVoices() {
      voiceSel.innerHTML = '';
      voiceSel.appendChild(el('option', { value: '' }, 'Tự chọn giọng phù hợp'));
      EQ.speech.listFor(s.accent).forEach(v => voiceSel.appendChild(el('option', { value: v.name }, v.name + ' (' + v.lang + ')')));
      voiceSel.value = s.voiceName || '';
    }
    voiceSel.onchange = () => { s.voiceName = voiceSel.value; save(); };
    const accSel = el('select', { class: 'inp small', onchange: e => { s.accent = e.target.value; s.voiceName = ''; save(); fillVoices(); } }, [
      el('option', { value: 'auto' }, 'Tự động'), el('option', { value: 'en-US' }, 'Anh – Mỹ'), el('option', { value: 'en-GB' }, 'Anh – Anh')
    ]);
    accSel.value = s.accent;
    fillVoices();
    const status = el('div', { class: 'note' }, EQ.speech.available()
      ? '✅ Máy có ' + EQ.speech.voices.length + ' giọng đọc tiếng Anh.'
      : '🔇 Chưa tìm thấy giọng đọc tiếng Anh. Game vẫn chơi bình thường. Cách cài: Windows → Cài đặt → Thời gian & Ngôn ngữ → Giọng nói → Thêm giọng nói → English (United States).');
    const body = el('div', { class: 'settings' }, [
      el('h2', null, '⚙️ Cài đặt'),
      el('div', { class: 'grid2' }, [
        el('div', null, [el('h3', null, '🎵 Âm thanh'), toggle('music', 'Nhạc nền'), slider('musicVol', 'Âm lượng nhạc', 0, 1, 0.1), toggle('sfx', 'Hiệu ứng âm thanh'), slider('sfxVol', 'Âm lượng hiệu ứng', 0, 1, 0.1)]),
        el('div', null, [
          el('h3', null, '🗣️ Giọng đọc tiếng Anh'),
          el('label', { class: 'sld' }, [el('span', null, 'Giọng'), accSel]),
          el('label', { class: 'sld' }, [el('span', null, 'Chọn cụ thể'), voiceSel]),
          slider('rate', 'Tốc độ đọc', 0.5, 1.2, 0.05),
          el('button', { class: 'btn small', onclick: () => EQ.speech.speak('Hello! My name is Lily. I am twelve.', { user: true }) }, '🔊 Nghe thử'),
          status
        ])
      ]),
      el('h3', null, '📖 Học tập'),
      toggle('alwaysVi', 'Luôn hiện nghĩa tiếng Việt (tắt để game tự quyết định theo trình độ)'),
      el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Xong ✓')])
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
  };

  // ---------- Hướng dẫn ----------
  S.help = function () {
    const body = el('div', { class: 'help' }, [
      el('h2', null, '❓ Cách chơi'),
      el('div', { class: 'grid2' }, [
        el('div', null, [
          el('h3', null, '🎮 Điều khiển'),
          el('ul', null, [
            el('li', null, 'W A S D hoặc phím mũi tên: di chuyển'),
            el('li', null, 'E (hoặc Space): nói chuyện, nhặt đồ, mở rương, mở cổng'),
            el('li', null, 'Chuột: chọn đáp án, bấm 🔊 để nghe'),
            el('li', null, 'Phím 1–4: chọn nhanh đáp án'),
            el('li', null, 'I: túi đồ • N: sổ từ vựng • Q: nhiệm vụ • M: bản đồ'),
            el('li', null, 'Esc: tạm dừng / đóng cửa sổ')
          ])
        ]),
        el('div', null, [
          el('h3', null, '🌟 Mẹo'),
          el('ul', null, [
            el('li', null, 'Người có dấu ❗ đang cần bạn giúp. Dấu … là đang chờ bạn quay lại.'),
            el('li', null, 'Mũi tên vàng cạnh nhân vật chỉ đường tới nhiệm vụ.'),
            el('li', null, 'Bấm 🇻🇳 để xem nghĩa, 💡 để xem gợi ý, 🐢 để nghe chậm.'),
            el('li', null, 'Trả lời sai không bị phạt nặng – Pip sẽ giải thích và cho thử lại.'),
            el('li', null, 'Trong trận đấu, ăn 🥧 bánh táo để hồi 2 trái tim.'),
            el('li', null, 'Mỗi ngày mở Sổ từ vựng → "Ôn tập nhanh" để nhớ lâu hơn.')
          ])
        ])
      ]),
      el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đã hiểu ✓')])
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
  };

  // ---------- Túi đồ & tủ đồ ----------
  S.inventory = function (tab) {
    const p = EQ.game.profile;
    tab = tab || 'items';
    const body = el('div', { class: 'inv' });
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('div', { class: 'tabs' }, [['items', '🎒 Vật phẩm'], ['wardrobe', '👗 Tủ đồ'], ['badges', '🏅 Huy hiệu']].map(t => el('button', { class: 'tab' + (tab === t[0] ? ' on' : ''), onclick: () => { tab = t[0]; draw(); } }, t[1]))));
      if (tab === 'items') {
        const ks = Object.keys(p.items).filter(k => p.items[k] > 0 && EQ.ITEMS[k]);
        body.appendChild(el('div', { class: 'gold-line' }, '🪙 ' + p.gold + ' vàng'));
        body.appendChild(ks.length ? el('div', { class: 'items' }, ks.map(k => {
          const it = EQ.ITEMS[k];
          return el('div', { class: 'item' + (it.stone ? ' stone' : '') }, [el('div', { class: 'it-e' }, it.e), el('div', { class: 'it-n' }, it.name + (p.items[k] > 1 ? ' ×' + p.items[k] : '')), el('div', { class: 'it-d' }, it.desc)]);
        })) : el('p', { class: 'muted' }, 'Túi đồ đang trống. Hãy khám phá và làm nhiệm vụ nhé!'));
      } else if (tab === 'wardrobe') {
        const prevBox = el('div', { class: 'wr-prev' }, avatarCanvas(p.avatar, 140));
        const outs = el('div', { class: 'outfits' }, Object.keys(EQ.OUTFITS).map(k => {
          const o = EQ.OUTFITS[k], have = p.outfits.indexOf(k) >= 0;
          const av = Object.assign({}, p.avatar, { outfit: k });
          return el('button', { class: 'outfit' + (p.avatar.outfit === k ? ' on' : '') + (have ? '' : ' locked'), disabled: !have, onclick: () => { p.avatar.outfit = k; store().saveSoon(); draw(); } }, [
            have ? avatarCanvas(av, 64) : el('div', { class: 'lock' }, '🔒'), el('div', { class: 'on-name' }, o.name), el('div', { class: 'on-desc' }, have ? o.desc : 'Mở khóa: ' + o.desc)
          ]);
        }));
        const hairs = el('div', { class: 'picks' }, Object.keys(EQ.HAIRS).map(h => el('button', { class: 'chip' + (p.avatar.hair === h ? ' on' : ''), onclick: () => { p.avatar.hair = h; store().saveSoon(); draw(); } }, EQ.HAIRS[h])));
        const hcs = el('div', { class: 'picks' }, EQ.HAIR_COLORS.map(c => el('button', { class: 'sw' + (p.avatar.hairC === c ? ' on' : ''), style: { background: c }, onclick: () => { p.avatar.hairC = c; store().saveSoon(); draw(); } })));
        body.appendChild(el('div', { class: 'wardrobe' }, [prevBox, el('div', null, [el('h3', null, 'Trang phục'), outs, el('h3', null, 'Kiểu tóc'), hairs, el('h3', null, 'Màu tóc'), hcs])]));
      } else {
        body.appendChild(badgeGrid(p));
      }
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };
  function badgeGrid(p) {
    return el('div', { class: 'badges' }, Object.keys(EQ.BADGES).map(k => {
      const b = EQ.BADGES[k], have = !!p.badges[k];
      return el('div', { class: 'badge' + (have ? ' on' : '') }, [el('div', { class: 'bd-e' }, have ? b.e : '🔒'), el('div', { class: 'bd-n' }, b.name), el('div', { class: 'bd-d' }, b.desc)]);
    }));
  }

  S.achievements = function () {
    const ps = store().data.profiles;
    if (!ps.length) return EQ.ui.alert('Chưa có nhân vật nào. Hãy tạo nhân vật để bắt đầu nhé!', { icon: '🏅' });
    let cur = (EQ.game.profile && ps.indexOf(EQ.game.profile) >= 0) ? EQ.game.profile : ps[0];
    const body = el('div', { class: 'ach' });
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('h2', null, '🏅 Thành tích'));
      if (ps.length > 1) body.appendChild(el('div', { class: 'tabs' }, ps.map(p => el('button', { class: 'tab' + (p === cur ? ' on' : ''), onclick: () => { cur = p; draw(); } }, p.name))));
      const s = EQ.learn.summary(cur);
      body.appendChild(el('div', { class: 'statrow' }, [
        stat('⭐', 'Cấp', cur.level), stat('📖', 'Từ đã học', s.learned), stat('🏆', 'Nhiệm vụ', EQ.Q.doneCount(cur) + '/' + EQ.QUESTS.length),
        stat('💎', 'Viên đá', ['stone_red', 'stone_green', 'stone_blue'].filter(k => cur.items[k]).length + '/5'), stat('🔥', 'Chuỗi đúng dài nhất', cur.bestStreak)
      ]));
      body.appendChild(badgeGrid(cur));
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };
  function stat(e, label, v) { return el('div', { class: 'stat' }, [el('div', { class: 'st-e' }, e), el('div', { class: 'st-v' }, String(v)), el('div', { class: 'st-l' }, label)]); }

  // ---------- Sổ từ vựng ----------
  S.notebook = function () {
    const p = EQ.game.profile;
    let filter = 'all', topic = 'all';
    const body = el('div', { class: 'notebook' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      const s = EQ.learn.summary(p);
      body.appendChild(el('div', { class: 'nb-head' }, [
        el('h2', null, '📒 Sổ từ vựng'),
        el('div', { class: 'statrow small' }, [stat('📖', 'Đã học', s.learned), stat('🆕', 'Mới học', s.fresh), stat('🔴', 'Cần ôn', s.weak), stat('🟡', 'Đang nhớ', s.learning), stat('🟢', 'Nhớ tốt', s.strong), stat('⏰', 'Đến hạn ôn', s.due)]),
        el('div', { class: 'row center tight' }, [
          el('button', { class: 'btn primary', disabled: !EQ.game.dailyAvailable(p), onclick: async () => { await EQ.game.dailyChallenge(); draw(); } }, EQ.game.dailyAvailable(p) ? '⭐ Thử thách hôm nay' : '✅ Đã xong thử thách hôm nay'),
          el('button', { class: 'btn', disabled: s.learned < 3, onclick: quick }, '🔁 Ôn tập nhanh (5 từ)'),
          (() => { const sel = el('select', { class: 'inp small' }, [el('option', { value: '' }, '📒 Luyện từ chưa thuộc...')].concat(['village', 'forest', 'castle'].filter(r => EQ.learn.regionMastery(p, r).total).map(r => { const m = EQ.learn.regionMastery(p, r); return el('option', { value: r }, EQ.REGIONS[r].name + ' (thuộc ' + m.ok + '/' + m.total + ')'); })));
            sel.onchange = async () => { const r = sel.value; if (!r) return; await EQ.game.drill(r); draw(); }; return sel; })()
        ])
      ]));
      const topics = U.uniq(EQ.learn.learnedIds(p).map(id => EQ.V[id].t));
      body.appendChild(el('div', { class: 'row' }, [
        el('div', { class: 'tabs' }, [['all', 'Tất cả'], ['fresh', 'Mới học'], ['weak', 'Cần ôn'], ['learning', 'Đang nhớ'], ['strong', 'Nhớ tốt']].map(f => el('button', { class: 'tab' + (filter === f[0] ? ' on' : ''), onclick: () => { filter = f[0]; draw(); } }, f[1]))),
        (() => { const sel = el('select', { class: 'inp small', onchange: e => { topic = e.target.value; draw(); } }, [el('option', { value: 'all' }, 'Mọi chủ đề')].concat(topics.map(t => el('option', { value: t }, EQ.TOPICS[t] || t)))); sel.value = topic; return sel; })()
      ]));
      let ids = EQ.learn.learnedIds(p);
      if (filter !== 'all') ids = ids.filter(id => EQ.learn.status(p.vocab[id]) === filter);
      if (topic !== 'all') ids = ids.filter(id => EQ.V[id].t === topic);
      ids.sort((a, b) => p.vocab[a].box - p.vocab[b].box || EQ.V[a].en.localeCompare(EQ.V[b].en));
      const list = el('div', { class: 'nb-list' });
      if (!ids.length) list.appendChild(el('p', { class: 'muted' }, EQ.learn.learnedIds(p).length ? 'Không có từ nào trong mục này.' : 'Chưa có từ nào. Hãy nói chuyện với mọi người trong làng để học từ mới nhé!'));
      ids.forEach(id => {
        const w = EQ.V[id], e = p.vocab[id], stt = EQ.learn.status(e);
        list.appendChild(el('div', { class: 'nb-row' }, [
          w.sw ? el('span', { class: 'swatch' , style: { background: w.sw } }) : el('span', { class: /^\d+$/.test(w.e) ? 'nb-num' : 'nb-e' }, w.e),
          el('div', { class: 'nb-w' }, [el('div', { class: 'nb-en' }, [w.en, EQ.challenge.speakBtn(w.en, '🔊', 'small')]), el('div', { class: 'nb-vi' }, w.vi)]),
          el('div', { class: 'nb-ex' }, [el('div', null, [w.ex, EQ.challenge.speakBtn(w.ex, '🔊', 'small')]), el('div', { class: 'muted small' }, w.exVi)]),
          el('span', { class: 'st-badge ' + stt }, EQ.learn.STATUS_VI[stt])
        ]));
      });
      body.appendChild(list);
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]));
    }
    async function quick() {
      const ws = EQ.learn.pickWords(p, 5);
      const modes = EQ.learn.wordModes(p);
      const qs = ws.map((w, i) => EQ.learn.wordQ(p, w, modes[i % modes.length]));
      const r = await EQ.challenge.run(qs, { title: 'Ôn tập nhanh', icon: '🔁', retry: true });
      if (r.completed) { p.reviews++; await EQ.game.reward(p, { xp: 10 + r.correct * 2, gold: 2 }); EQ.game.checkBadges(p); EQ.ui.toast('🔁 Ôn xong! Từ nào nhớ tốt sẽ được hỏi lại sau lâu hơn.', 'good'); }
      draw();
    }
    draw();
  };

  // ---------- Nhật ký nhiệm vụ ----------
  S.quests = function () {
    const p = EQ.game.profile, Q = EQ.Q;
    const body = el('div', { class: 'qlog' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function giverName(q) {
      for (const r in EQ.REGIONS) { const e = EQ.REGIONS[r].entities.find(x => x.id === q.giver); if (e) return e.name + ' (' + EQ.REGIONS[r].name + ')'; }
      return '';
    }
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('h2', null, '📜 Nhiệm vụ'));
      const act = Q.active(p), avail = EQ.QUESTS.filter(q => Q.available(p, q.id)), done = EQ.QUESTS.filter(q => Q.isDone(p, q.id));
      const sec = (title, arr, fn) => { body.appendChild(el('h3', null, title + ' (' + arr.length + ')')); if (!arr.length) body.appendChild(el('p', { class: 'muted small' }, '—')); arr.forEach(q => body.appendChild(fn(q))); };
      sec('🟡 Đang làm', act, q => {
        const s = Q.stage(p, q.id);
        const tracked = p.tracked === q.id;
        return el('div', { class: 'qrow active' + (tracked ? ' tracked' : '') }, [
          el('div', null, [el('b', null, q.title), el('div', { class: 'small' }, '➜ ' + (s ? s.obj : '')), el('div', { class: 'muted small' }, q.summary)]),
          el('button', { class: 'btn small', onclick: () => { p.tracked = q.id; draw(); } }, tracked ? '📍 Đang theo dõi' : 'Theo dõi')
        ]);
      });
      sec('❗ Có thể nhận', avail, q => el('div', { class: 'qrow' }, [el('div', null, [el('b', null, q.title + (q.advanced ? ' ⭐ Nâng cao' : '')), el('div', { class: 'small' }, 'Gặp: ' + giverName(q)), el('div', { class: 'muted small' }, q.summary)])]));
      sec('✅ Đã hoàn thành', done, q => el('div', { class: 'qrow done' }, [el('div', null, [el('b', null, '✓ ' + q.title), el('div', { class: 'muted small' }, q.summary)])]));
      const locked = EQ.QUESTS.filter(q => !p.quests[q.id] && !Q.available(p, q.id));
      body.appendChild(el('p', { class: 'muted small' }, '🔒 Còn ' + locked.length + ' nhiệm vụ sẽ mở khi bạn tiếp tục cuộc phiêu lưu.'));
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };

  // ---------- Bản đồ lớn ----------
  S.map = function () {
    const p = EQ.game.profile;
    if (!p.items.map) return EQ.ui.toast('🗺️ Bạn chưa có bản đồ. Hãy nói chuyện với Trưởng làng Tom!', 'warn');
    const cv = el('canvas', { width: 640, height: 448, class: 'bigmap' });
    const W = EQ.world;
    const regions = ['village', 'forest', 'castle'].map(r => {
      const ok = r === 'village' || (r === 'forest' && p.flags['boss:slimeKing']) || (r === 'castle' && p.flags['boss:mushKing']);
      const ex = p.explored[r] ? Math.round(p.explored[r].split('').filter(c => c === '1').length / p.explored[r].length * 100) : 0;
      return el('div', { class: 'reg' + (r === p.region ? ' cur' : '') + (ok ? '' : ' locked') }, [el('b', null, (ok ? '' : '🔒 ') + EQ.REGIONS[r].name), el('span', { class: 'small' }, ok ? ' khám phá ' + (r === W.id ? Math.round(W.exploredPct() * 100) : ex) + '%' : ' chưa mở')]);
    }).concat(EQ.FUTURE_REGIONS.map(f => el('div', { class: 'reg locked' }, [el('b', null, f.icon + ' ' + f.name), el('span', { class: 'small' }, ' – phiên bản sau')])));
    const body = el('div', { class: 'mapview' }, [
      el('h2', null, '🗺️ ' + EQ.REGIONS[p.region].name),
      el('div', { class: 'map-wrap' }, [cv, el('div', { class: 'map-side' }, [el('h3', null, 'Vương quốc'), ...regions, el('h3', null, 'Chú thích'),
        el('div', { class: 'small' }, '🩷 Bạn  •  🟡 Có nhiệm vụ  •  ⚪ Người dân'), el('div', { class: 'small' }, '🔴 Trùm  •  🔵 Cổng dịch chuyển  •  🟠 Rương'), el('div', { class: 'small' }, '⭕ vòng vàng: mục tiêu nhiệm vụ'), el('div', { class: 'small muted' }, 'Vùng tối là nơi chưa khám phá.')])]),
      el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng (M)')])
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    const tick = () => { if (!cv.isConnected) return; W.drawMap(cv, p, 16, { detail: true }); requestAnimationFrame(tick); };
    setTimeout(tick, 0);
    const onKey = e => { if (e.code === 'KeyM') { close(); window.removeEventListener('keydown', onKey); } };
    window.addEventListener('keydown', onKey);
  };

  // ---------- Cửa hàng (dùng vàng trong game) ----------
  S.shop = async function (e, sp) {
    const p = EQ.game.profile;
    await EQ.ui.dialog([{ s: 'npc', en: 'Welcome! What do you want?', vi: 'Chào mừng cháu! Cháu muốn mua gì?' }], sp);
    const body = el('div', { class: 'shop' });
    let closeFn;
    await new Promise(res => {
      function draw() {
        body.innerHTML = '';
        body.appendChild(el('h2', null, '🏪 Cửa hàng chú Ben'));
        body.appendChild(el('div', { class: 'gold-line' }, 'Bạn có: 🪙 ' + p.gold + ' vàng'));
        body.appendChild(el('div', { class: 'items' }, EQ.SHOP_ITEMS.map(si => {
          const it = EQ.ITEMS[si.id];
          const en = si.id === 'pie' ? 'an apple pie' : 'a hint scroll';
          const say = 'Can I have ' + en + ', please?';
          return el('div', { class: 'item' }, [el('div', { class: 'it-e' }, it.e), el('div', { class: 'it-n' }, it.name + ' (có ' + (p.items[si.id] || 0) + ')'), el('div', { class: 'it-d' }, it.desc),
            el('div', { class: 'it-d' }, [el('i', null, '"' + say + '"'), EQ.challenge.speakBtn(say, '🔊', 'small')]),
            el('button', { class: 'btn primary small', disabled: p.gold < si.price, onclick: () => { p.gold -= si.price; p.items[si.id] = (p.items[si.id] || 0) + 1; EQ.audio.sfx('coin'); EQ.speech.speak(say); EQ.ui.toast('Đã mua ' + it.e + ' ' + it.name, 'good'); store().saveSoon(); draw(); } }, 'Mua: ' + si.price + ' 🪙')]);
        })));
        body.appendChild(el('p', { class: 'muted small' }, 'Vàng chỉ có trong game, kiếm được khi làm nhiệm vụ. Không có mua bán bằng tiền thật.'));
        body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => { closeFn(); res(); } }, 'Tạm biệt 👋')]));
      }
      draw();
      closeFn = EQ.ui.modal(body, { cls: 'wide', onEsc: () => { closeFn(); res(); } });
    });
    await EQ.ui.dialog([{ s: 'npc', en: 'Thank you! Goodbye!', vi: 'Cảm ơn cháu! Tạm biệt!' }], sp);
  };

  // ---------- Nhiệm vụ đi chợ (nhiệm vụ đời sống) ----------
  S.marketQuest = function (q, s, sp) {
    const p = EQ.game.profile;
    const list = s.list;
    const basket = {};
    EQ.MARKET.forEach(m => { basket[m.id] = 0; });
    const nameOf = (m, n) => (n === 1 ? m.en : m.pl);
    const listText = Object.keys(list).map(k => { const m = EQ.MARKET.find(x => x.id === k); return U.numWord(list[k]) + ' ' + nameOf(m, list[k]); });
    const listSentence = listText.slice(0, -1).join(', ') + ' and ' + listText[listText.length - 1];
    return new Promise(resolve => {
      let first = true;
      const body = el('div', { class: 'market' });
      const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => { close(); resolve(false); } });
      const msg = el('div', { class: 'mk-msg' });
      function say(en, vi, ok) {
        msg.className = 'mk-msg ' + (ok ? 'ok' : 'bad');
        msg.innerHTML = '';
        msg.appendChild(el('div', { class: 'mk-who' }, '🧑‍🍳 Chú Ben:'));
        msg.appendChild(el('div', { class: 'dlg-line' }, [el('div', { class: 'dlg-en' }, en), EQ.challenge.speakBtn(en)]));
        msg.appendChild(el('div', { class: 'dlg-vi' }, vi));
        EQ.speech.speak(en);
      }
      function total() { return EQ.MARKET.reduce((t, m) => t + basket[m.id] * m.price, 0); }
      function draw() {
        body.innerHTML = '';
        body.appendChild(el('h2', null, '🛒 Đi chợ giúp Minh'));
        body.appendChild(el('div', { class: 'mk-top' }, [
          el('div', { class: 'mk-list' }, [el('div', { class: 'mk-paper' }, [el('b', null, '📝 Shopping list'), ...listText.map(t => el('div', null, ['• ' + t, EQ.challenge.speakBtn(t, '🔊', 'small')]))]),
            el('div', { class: 'muted small' }, EQ.learn.showVi(p) ? 'Danh sách: ' + Object.keys(list).map(k => list[k] + ' ' + (EQ.V[k] ? EQ.V[k].vi : k)).join(', ') : '')]),
          el('div', { class: 'mk-wallet' }, [el('div', null, '👛 Minh\'s coins: ' + s.budget), el('div', null, '🧺 Total: ' + total() + ' coins'), el('div', { class: 'muted small' }, U.cap(U.numWord(total())) + ' coins')])
        ]));
        body.appendChild(el('div', { class: 'mk-items' }, EQ.MARKET.map(m => el('div', { class: 'mk-item' }, [
          el('div', { class: 'it-e' }, m.e),
          el('div', { class: 'it-n' }, [m.en, EQ.challenge.speakBtn(m.en, '🔊', 'small')]),
          el('div', { class: 'it-d' }, m.price + ' coin' + (m.price > 1 ? 's' : '')),
          el('div', { class: 'qty' }, [
            el('button', { class: 'btn small', onclick: () => { if (basket[m.id] > 0) { basket[m.id]--; draw(); } } }, '−'),
            el('b', null, String(basket[m.id])),
            el('button', { class: 'btn small', onclick: () => { if (basket[m.id] < 9) { basket[m.id]++; EQ.audio.sfx('click'); draw(); } } }, '+')
          ])
        ]))));
        body.appendChild(msg);
        body.appendChild(el('div', { class: 'row center' }, [
          el('button', { class: 'btn', onclick: () => { close(); resolve(false); } }, 'Để sau'),
          el('button', { class: 'btn primary big', onclick: pay }, '💰 Pay (Trả tiền)')
        ]));
      }
      function pay() {
        const t = total();
        const wrong = [];
        EQ.MARKET.forEach(m => {
          const need = list[m.id] || 0, have = basket[m.id];
          if (need !== have) wrong.push({ m, need, have });
        });
        const ok = !wrong.length && t <= s.budget;
        if (first) { first = false; EQ.learn.record(p, { correct: ok, topic: 'number', key: 'm:shop', text: listSentence }); }
        if (!wrong.length && t > s.budget) { EQ.audio.sfx('wrong'); return say("That's " + U.numWord(t) + ' coins. You have ten coins.', 'Tổng là ' + t + ' xu, nhưng bạn chỉ có 10 xu.', false); }
        if (wrong.length) {
          EQ.audio.sfx('wrong');
          const w = wrong[0];
          if (w.need === 0) return say("We don't need " + w.m.pl + '.', 'Danh sách không có món này: ' + w.m.en + '. Hãy bớt ra nhé.', false);
          return say('You need ' + U.numWord(w.need) + ' ' + nameOf(w.m, w.need) + '. You have ' + U.numWord(w.have) + '.', 'Bạn cần ' + w.need + ' ' + (EQ.V[w.m.id] ? EQ.V[w.m.id].vi : '') + ' (' + w.m.en + '), nhưng đang chọn ' + w.have + '. Đọc lại danh sách nhé!', false);
        }
        EQ.audio.sfx('coin');
        say('Here you are! That\'s ' + U.numWord(t) + ' coins. Thank you!', 'Của cháu đây! Tổng cộng ' + t + ' xu. Cảm ơn cháu!', true);
        body.querySelector('.btn.primary.big').disabled = true;
        setTimeout(() => { close(); resolve(true); }, 2600);
      }
      draw();
      say('Hello! Do you have a shopping list?', 'Chào cháu! Cháu có danh sách mua hàng không? Hãy chọn đúng số lượng rồi bấm "Pay".', true);
      S._market = { basket, list, pay, draw };
    }).then(async ok => {
      S._market = null;
      void sp;
      return ok;
    });
  };

  // ---------- Nhắc nghỉ ----------
  S.breakTime = function () {
    const m = store().settings().breakMin;
    EQ.audio.sfx('open');
    const body = el('div', { class: 'alert' }, [
      el('div', { class: 'alert-icon' }, '⏰'),
      el('h2', null, 'Đã ' + m + ' phút rồi! Nghỉ mắt nhé'),
      el('div', { class: 'alert-body' }, 'Hãy đứng dậy vươn vai, uống nước và nhìn ra xa 20 giây. Cuộc phiêu lưu vẫn đang chờ bạn ngày mai!'),
      el('div', { class: 'row center' }, [
        el('button', { class: 'btn', onclick: () => { close(); EQ.game.session = Math.max(0, (m - 5) * 60); } }, 'Chơi thêm 5 phút'),
        el('button', { class: 'btn primary big', onclick: () => { close(); EQ.game.toMenu(); } }, '💾 Lưu & nghỉ')
      ])
    ]);
    const close = EQ.ui.modal(body);
  };

  S.comingSoon = function () {
    EQ.ui.alert('Phía sau cánh cửa là <b>⚓ Hải Cảng Nghe Hiểu</b> – nơi Chúa tể Im Lặng đang ẩn náu, và xa hơn là <b>⛰️ Núi Giao Tiếp</b>.<br><br>Hai vùng đất này sẽ mở trong <b>phiên bản tiếp theo</b>. Trong lúc chờ, hãy ôn tập Sổ từ vựng và thử thách của Nhà hiền triết Sao nhé!', { icon: '⚓', title: 'Sắp ra mắt!' });
  };

  S.chapterEnd = function () {
    const p = EQ.game.profile;
    const s = EQ.learn.summary(p);
    return EQ.ui.alert('Bạn đã thu hồi <b>3/5 Viên Đá Ngôn Ngữ</b>! 🔴🟢🔵<br><br>📖 Từ đã học: <b>' + s.learned + '</b><br>🏆 Nhiệm vụ hoàn thành: <b>' + EQ.Q.doneCount(p) + '</b><br>⏱️ Thời gian học: <b>' + U.fmtTime(p.time.total) + '</b><br><br>Chúa tể Im Lặng đang ở Hải Cảng Nghe Hiểu... Có lẽ ông ấy chỉ cần một người bạn biết lắng nghe. Hẹn gặp lại ở chương 2!', { icon: '🎊', title: 'Hoàn thành Chương 1!', ok: 'Tuyệt vời! ▶' });
  };

  // ---------- Bảng phụ huynh ----------
  S.parent = function () {
    const a = U.randi(6, 9), b = U.randi(6, 9);
    const inp = el('input', { class: 'inp', type: 'number', placeholder: 'Kết quả' });
    const check = () => { if (+inp.value === a * b) { close(); S.parentDash(); } else { inp.value = ''; EQ.ui.toast('Chưa đúng.', 'warn'); } };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    const body = el('div', { class: 'alert' }, [
      el('div', { class: 'alert-icon' }, '👨‍👩‍👧'),
      el('h2', null, 'Khu vực phụ huynh'),
      el('div', { class: 'alert-body' }, 'Để vào, vui lòng tính: ' + a + ' × ' + b + ' = ?'),
      inp,
      el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Hủy'), el('button', { class: 'btn primary', onclick: check }, 'Vào')])
    ]);
    const close = EQ.ui.modal(body, { onEsc: () => close() });
    setTimeout(() => inp.focus(), 100);
  };

  S.parentDash = function () {
    const ps = store().data.profiles;
    let cur = ps[0] || null;
    const body = el('div', { class: 'parent' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    function draw() {
      body.innerHTML = '';
      body.appendChild(el('h2', null, '👨‍👩‍👧 Bảng theo dõi dành cho phụ huynh'));
      if (ps.length) body.appendChild(el('div', { class: 'tabs' }, ps.map(p => el('button', { class: 'tab' + (p === cur ? ' on' : ''), onclick: () => { cur = p; draw(); } }, p.name + ' (lớp ' + p.grade + ')'))));
      if (cur) body.appendChild(report(cur));
      else body.appendChild(el('p', { class: 'muted' }, 'Chưa có hồ sơ nào.'));
      body.appendChild(settingsBlock());
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn primary', onclick: () => close() }, 'Đóng')]));
    }
    function report(p) {
      const s = EQ.learn.summary(p);
      const wrap = el('div', { class: 'report' });
      const today = p.time.days[U.today()] || 0;
      const levelName = p.diff < 1.5 ? 'Khởi động (Pre-A1)' : p.diff < 2.1 ? 'Cơ bản (Pre-A1 → A1)' : p.diff < 2.6 ? 'Khá (A1)' : 'Tốt (A1 → A2)';
      wrap.appendChild(el('div', { class: 'statrow' }, [
        stat('⏱️', 'Tổng thời gian', U.fmtTime(p.time.total)), stat('📅', 'Hôm nay', U.fmtTime(today)),
        stat('🏆', 'Nhiệm vụ', EQ.Q.doneCount(p) + '/' + EQ.QUESTS.length), stat('📖', 'Từ đã gặp', s.learned),
        stat('🎯', 'Tỷ lệ đúng', p.stats.answers ? Math.round(p.stats.correct / p.stats.answers * 100) + '%' : '—'), stat('📶', 'Trình độ ước tính', levelName)
      ]));
      // 7 ngày gần nhất
      const days = []; for (let i = 6; i >= 0; i--) { const d = new Date(Date.now() - i * 86400000); days.push(U.today(d)); }
      const maxS = Math.max(60, ...days.map(d => p.time.days[d] || 0));
      wrap.appendChild(el('h3', null, '📊 Thời gian chơi 7 ngày qua'));
      wrap.appendChild(el('div', { class: 'bars7' }, days.map(d => {
        const v = p.time.days[d] || 0;
        return el('div', { class: 'b7' }, [el('div', { class: 'b7-v' }, v ? Math.round(v / 60) + "'" : ''), el('div', { class: 'b7-bar', style: { height: Math.max(2, v / maxS * 90) + 'px' } }), el('div', { class: 'b7-d' }, d.slice(8) + '/' + d.slice(5, 7))]);
      })));
      const g2 = el('div', { class: 'grid2' });
      // tỷ lệ đúng theo chủ đề
      const tops = Object.keys(p.topics).map(t => ({ t, ok: p.topics[t].ok, n: p.topics[t].ok + p.topics[t].bad })).filter(x => x.n > 0).sort((a, b) => b.n - a.n);
      g2.appendChild(el('div', null, [el('h3', null, '🎯 Tỷ lệ đúng theo chủ đề'), tops.length ? el('div', { class: 'tbars' }, tops.map(x => {
        const pc = Math.round(x.ok / x.n * 100);
        return el('div', { class: 'tbar' }, [el('span', { class: 'tb-l' }, EQ.learn.topicName(x.t)), el('div', { class: 'tb-track' }, el('div', { class: 'tb-fill ' + (pc >= 80 ? 'g' : pc >= 60 ? 'y' : 'r'), style: { width: pc + '%' } })), el('span', { class: 'tb-v' }, pc + '% (' + x.n + ')')]);
      })) : el('p', { class: 'muted small' }, 'Chưa có dữ liệu.')]));
      // ngữ pháp & từ
      const lessons = Object.keys(p.lessons).filter(l => EQ.LESSONS[l]);
      const strong = EQ.learn.learnedIds(p).filter(id => EQ.learn.status(p.vocab[id]) === 'strong').map(id => EQ.V[id].en);
      const weak = EQ.learn.learnedIds(p).filter(id => EQ.learn.status(p.vocab[id]) === 'weak').sort((a, b) => p.vocab[b].bad - p.vocab[a].bad).map(id => EQ.V[id].en + ' (' + EQ.V[id].vi + ')');
      g2.appendChild(el('div', null, [
        el('h3', null, '📚 Chủ điểm ngữ pháp đã học (' + lessons.length + '/' + Object.keys(EQ.LESSONS).length + ')'),
        el('div', { class: 'small' }, lessons.length ? lessons.map(l => '✓ ' + EQ.LESSONS[l].title).join('\n') : '—'),
        el('h3', null, '🟢 Từ nhớ tốt (' + strong.length + ')'), el('div', { class: 'small words' }, strong.join(', ') || '—'),
        el('h3', null, '🔴 Từ cần ôn lại (' + weak.length + ')'), el('div', { class: 'small words' }, weak.slice(0, 30).join(', ') || '—')
      ]));
      wrap.appendChild(g2);
      const ms = Object.values(p.mistakes).sort((a, b) => b.n - a.n).slice(0, 8);
      wrap.appendChild(el('h3', null, '🗺️ Độ thuộc từ theo vùng (cần ≥ 50% để đấu trùm)'));
      wrap.appendChild(el('div', { class: 'tbars' }, ['village', 'forest', 'castle'].map(r => {
        const m = EQ.learn.regionMastery(p, r); const pc = m.total ? Math.round(m.ratio * 100) : 0;
        return el('div', { class: 'tbar' }, [el('span', { class: 'tb-l' }, EQ.REGIONS[r].name), el('div', { class: 'tb-track' }, el('div', { class: 'tb-fill ' + (pc >= 70 ? 'g' : pc >= 50 ? 'y' : 'r'), style: { width: pc + '%' } })), el('span', { class: 'tb-v' }, m.ok + '/' + m.total + ' từ')]);
      })));
      wrap.appendChild(el('p', { class: 'muted small' }, 'Thử thách hôm nay đã hoàn thành: ' + (p.dailyCount || 0) + ' lần.'));
      wrap.appendChild(el('h3', null, '⚠️ Lỗi hay gặp'));
      wrap.appendChild(ms.length ? el('ul', { class: 'small' }, ms.map(m => el('li', null, m.text + ' — sai ' + m.n + ' lần' + (m.fixed ? ', đã làm đúng lại ' + m.fixed + ' lần' : '')))) : el('p', { class: 'muted small' }, 'Chưa có.'));
      wrap.appendChild(el('h3', null, '💡 Gợi ý ôn tập'));
      wrap.appendChild(el('ul', { class: 'small' }, EQ.learn.suggestions(p).map(t => el('li', null, t))));
      wrap.appendChild(el('h3', null, '✅ Nhiệm vụ đã hoàn thành'));
      wrap.appendChild(el('div', { class: 'small' }, EQ.QUESTS.filter(q => EQ.Q.isDone(p, q.id)).map(q => q.title).join(' • ') || '—'));
      wrap.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'btn small', onclick: async () => { if (await EQ.ui.confirm('Chơi lại từ đầu với hồ sơ <b>' + U.esc(p.name) + '</b>? Toàn bộ tiến độ của bé này sẽ bị xóa (nên sao lưu trước).', { danger: true, yes: 'Chơi lại từ đầu' })) { store().resetProfile(p.id); cur = store().getProfile(p.id); if (EQ.game.profile && EQ.game.profile.id === p.id) EQ.game.profile = null; draw(); EQ.ui.toast('Đã đặt lại hồ sơ.', 'good'); } } }, '↺ Chơi lại từ đầu'),
        el('button', { class: 'btn small', onclick: () => S.customWords(p) }, '📝 Nhập từ theo sách (' + ((p.customWords || []).length) + ')'),
        (() => { const sel = el('select', { class: 'inp small', title: 'Sách đang học', onchange: e => { p.book = e.target.value; store().save(); } }, Object.keys(EQ.BOOKS).map(k => el('option', { value: k }, '📗 ' + EQ.BOOKS[k]))); sel.value = p.book || (p.grade >= 8 ? 'gs8' : 'gs6'); return sel; })(),
        el('button', { class: 'btn small danger', onclick: async () => { if (await EQ.ui.confirm('Xóa hẳn hồ sơ <b>' + U.esc(p.name) + '</b>?', { danger: true, yes: 'Xóa' })) { store().deleteProfile(p.id); cur = store().data.profiles[0] || null; draw(); } } }, '🗑️ Xóa hồ sơ')
      ]));
      return wrap;
    }
    function settingsBlock() {
      const st = store().settings();
      const sel = el('select', { class: 'inp small', onchange: e => { st.breakMin = +e.target.value; store().save(); EQ.ui.toast('Đã lưu cài đặt nhắc nghỉ.', 'good'); } },
        [0, 15, 20, 30, 45, 60].map(m => el('option', { value: m }, m ? 'Sau ' + m + ' phút' : 'Tắt nhắc nghỉ')));
      sel.value = String(st.breakMin);
      const file = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' }, onchange: e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = async () => {
          try {
            const d = JSON.parse(r.result);
            if (!(await EQ.ui.confirm('Khôi phục dữ liệu từ file này? Dữ liệu hiện tại sẽ được thay thế (bản cũ được giữ làm dự phòng).', { yes: 'Khôi phục' }))) return;
            store().importJSON(JSON.stringify(d));
            EQ.game.profile = null;
            EQ.ui.toast('✅ Đã khôi phục ' + store().data.profiles.length + ' hồ sơ.', 'good');
            close(); EQ.game.toMenu();
          } catch (err) { EQ.ui.alert('Không đọc được file: ' + U.esc(err.message), { icon: '⚠️' }); }
        };
        r.readAsText(f);
      } });
      return el('div', { class: 'psettings' }, [
        el('h3', null, '⚙️ Cài đặt & dữ liệu'),
        el('div', { class: 'row' }, [el('span', null, '⏰ Nhắc nghỉ ngơi:'), sel]),
        el('label', { class: 'tog' }, [el('input', { type: 'checkbox', checked: st.speakPractice, onchange: e => { st.speakPractice = e.target.checked; store().save(); } }),
          el('span', null, '🎤 Bật luyện nói (cần Internet & micro; giọng nói được trình duyệt gửi tới máy chủ nhận dạng của Google/Microsoft; game chỉ kiểm tra "nghe ra đúng câu", không chấm điểm phát âm)')]),
        EQ.speech.canListen() ? null : el('p', { class: 'muted small' }, '⚠️ Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge bản mới.'),
        el('div', { class: 'row' }, [
          el('button', { class: 'btn small', onclick: () => { EQ.game.saveNow(); store().download('english-quest-saoluu-' + U.today() + '.json', store().exportJSON()); } }, '💾 Sao lưu (tải file JSON)'),
          el('button', { class: 'btn small', onclick: () => file.click() }, '📂 Khôi phục từ file JSON'), file,
          el('button', { class: 'btn small', disabled: !store().hasBackup(), onclick: async () => { if (await EQ.ui.confirm('Quay về bản lưu dự phòng gần nhất trên máy?', { yes: 'Khôi phục' })) { if (store().restoreBackup()) { EQ.game.profile = null; close(); EQ.game.toMenu(); EQ.ui.toast('Đã khôi phục bản dự phòng.', 'good'); } } } }, '🛟 Dùng bản dự phòng tự động')
        ]),
        el('p', { class: 'muted small' }, 'Dữ liệu chỉ lưu trong trình duyệt trên máy này, không gửi lên Internet. Nên sao lưu file JSON mỗi tuần. ' + (store().ok ? '' : '⚠️ ' + store().warn))
      ]);
    }
    draw();
  };

  // ---------- Học theo sách Global Success ----------
  S.book = function () {
    const p = EQ.game.profile;
    if (!p.book || !EQ.CURRICULUM[p.book]) p.book = p.grade >= 8 ? 'gs8' : 'gs6';
    const body = el('div', { class: 'bookview' });
    const close = EQ.ui.modal(body, { cls: 'wide tall', onEsc: () => close() });
    const stat = ids => {
      const L = EQ.learn;
      const learned = ids.filter(id => p.vocab[id]);
      return { total: ids.length, learned: learned.length, rem: learned.filter(id => p.vocab[id].box >= 2).length, long: learned.filter(id => p.vocab[id].box >= 3).length, due: learned.filter(id => p.vocab[id].due <= L.now()).length };
    };
    function card(title, sub, ids, extra) {
      const st = stat(ids);
      const pc = st.total ? Math.round(st.long / st.total * 100) : 0;
      const left = ids.filter(id => !p.vocab[id]);
      return el('div', { class: 'ucard' + (extra && extra.cur ? ' cur' : '') }, [
        el('div', { class: 'u-title' }, title),
        el('div', { class: 'u-sub' }, sub),
        el('div', { class: 'u-bar' }, [el('div', { class: 'u-fill l', style: { width: (st.learned / Math.max(1, st.total) * 100) + '%' } }), el('div', { class: 'u-fill r', style: { width: (st.rem / Math.max(1, st.total) * 100) + '%' } }), el('div', { class: 'u-fill g', style: { width: pc + '%' } })]),
        el('div', { class: 'u-nums' }, 'Đã học ' + st.learned + '/' + st.total + ' • Đang nhớ ' + st.rem + ' • Nhớ lâu ' + st.long + (st.due ? ' • ⏰ ' + st.due + ' đến hạn' : '')),
        el('div', { class: 'row center tight' }, [
          left.length ? el('button', { class: 'btn primary small', onclick: async () => { close(); await S.learnWords(left.slice(0, 8), title); S.book(); } }, '✨ Học ' + Math.min(8, left.length) + ' từ mới') : null,
          st.learned ? el('button', { class: 'btn small', onclick: async () => { close(); await EQ.game.drillIds(ids.filter(id => p.vocab[id]), title); S.book(); } }, '🔁 Ôn') : null,
          extra && extra.focus ? el('span', { class: 'u-focus', title: 'Trọng tâm ngữ pháp (tham khảo)' }, '📐 ' + extra.focus) : null
        ])
      ]);
    }
    function draw() {
      body.innerHTML = '';
      const sel = el('select', { class: 'inp small', onchange: e => { p.book = e.target.value; EQ.store.saveSoon(); draw(); } }, Object.keys(EQ.BOOKS).map(k => el('option', { value: k }, EQ.BOOKS[k])));
      sel.value = p.book;
      const unitSel = el('select', { class: 'inp small', onchange: e => { p.schoolUnit = p.schoolUnit || {}; p.schoolUnit[p.book] = +e.target.value; EQ.store.saveSoon(); draw(); } },
        [el('option', { value: 0 }, 'Đang học Unit mấy ở lớp?')].concat(EQ.CURRICULUM[p.book].map(u => el('option', { value: u.n }, 'Unit ' + u.n))));
      const cur = (p.schoolUnit || {})[p.book] || 0;
      unitSel.value = String(cur);
      body.appendChild(el('h2', null, '📗 Học theo sách giáo khoa'));
      body.appendChild(el('div', { class: 'row' }, [sel, unitSel]));
      body.appendChild(el('p', { class: 'muted small' }, 'Mỗi Unit gồm 📘 từ trong sách (lấy từ ảnh phụ huynh chụp) và một số từ cùng chủ đề có hình minh họa. Một từ chỉ được tính "Nhớ lâu" khi bé nhớ lại được sau ít nhất 1 ngày.'));
      const grid = el('div', { class: 'ucards' });
      if ((p.customWords || []).length) grid.appendChild(card('📝 Từ phụ huynh thêm', 'Từ trong sách / trên lớp', p.customWords.map(w => w.id).filter(id => EQ.V[id]), { cur: true }));
      const units = EQ.CURRICULUM[p.book].slice();
      if (cur) units.sort((a, b) => (b.n === cur) - (a.n === cur));
      units.forEach(u => grid.appendChild(card('Unit ' + u.n + ': ' + u.en, u.vi + ((u.sgk || []).length ? ' • 📘 ' + u.sgk.length + ' từ trong sách' : ''), EQ.U.uniq((u.sgk || []).concat(u.words)), { cur: u.n === cur, focus: u.focus })));
      body.appendChild(grid);
      body.appendChild(el('div', { class: 'row center' }, [el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]));
    }
    draw();
  };

  // dạy một nhóm từ rồi luyện ngay (bắt buộc đúng lần đầu)
  S.learnWords = async function (ids, title) {
    const p = EQ.game.profile;
    const ok = await EQ.challenge.teach(p, { words: ids });
    if (ok === false) return;
    const modes = EQ.learn.wordModes(p).filter(m => m !== 'riddle');
    const qs = EQ.U.shuffle(ids).slice(0, 6).map(id => EQ.learn.wordQ(p, EQ.V[id], EQ.U.pick(modes)));
    const r = await EQ.challenge.run(qs, { title: 'Luyện ngay: ' + title, icon: '📗', mastery: true });
    if (r.completed) {
      await EQ.game.reward(p, { xp: 15 + r.correct * 2, gold: 3 });
      EQ.ui.toast('📗 Đã học xong! Ngày mai các từ này sẽ được hỏi lại để nhớ lâu hơn.', 'good', 4500);
    }
    EQ.game.saveNow();
  };

  // ---------- Phụ huynh nhập từ theo sách ----------
  S.customWords = function (p) {
    const ta = el('textarea', { class: 'inp', rows: 9, placeholder: 'Mỗi dòng một từ, ví dụ:\ncompass = com-pa\npencil case = hộp bút | I have a pink pencil case. | Mình có một hộp bút màu hồng.' });
    const list = el('div', { class: 'small' });
    function drawList() {
      list.innerHTML = '';
      (p.customWords || []).forEach((w, i) => list.appendChild(el('div', { class: 'cw-row' }, [el('b', null, w.en), ' = ' + w.vi + (w.ex ? ' — ' + w.ex : ''),
        el('button', { class: 'btn-mini', onclick: () => { p.customWords.splice(i, 1); EQ.store.save(); drawList(); } }, '✕')])));
      if (!(p.customWords || []).length) list.appendChild(el('span', { class: 'muted' }, 'Chưa có từ nào.'));
    }
    const body = el('div', { class: 'custom' }, [
      el('h2', null, '📝 Nhập từ theo sách cho ' + p.name),
      el('p', { class: 'small muted' }, 'Gõ hoặc dán từ vựng của bài đang học trên lớp. Định dạng: "từ tiếng Anh = nghĩa tiếng Việt", có thể thêm "| câu ví dụ | nghĩa câu ví dụ". Từ sẽ xuất hiện trong mục 📗 Sách, trận đấu và ôn tập hằng ngày.'),
      ta,
      el('div', { class: 'row' }, [el('button', { class: 'btn primary', onclick: () => {
        const r = EQ.learn.addCustomWords(p, ta.value);
        EQ.store.save(); ta.value = ''; drawList();
        EQ.ui.toast('Đã thêm ' + r.added + ' từ' + (r.bad ? ', bỏ qua ' + r.bad + ' dòng sai định dạng' : '') + '.', r.added ? 'good' : 'warn');
      } }, '➕ Thêm từ'), el('button', { class: 'btn', onclick: () => close() }, 'Đóng')]),
      el('h3', null, 'Danh sách từ đã nhập'), list
    ]);
    const close = EQ.ui.modal(body, { cls: 'wide', onEsc: () => close() });
    drawList();
  };

  EQ.screens = S;
})();
