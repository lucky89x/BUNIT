/* Âm thanh tự tạo bằng Web Audio (không dùng file nhạc bên ngoài → không lo bản quyền).
 * - Hiệu ứng: đúng, sai, nhặt xu, mở rương, lên cấp, phép thuật...
 * - Nhạc nền: giai điệu chiptune nhẹ nhàng tự soạn, lặp lại cho từng vùng.
 */
window.EQ = window.EQ || {};
(function () {
  const A = { ctx: null, master: null, musicGain: null, sfxGain: null, cur: null, timer: null, step: 0, nextT: 0 };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.ctx = new AC();
      A.master = A.ctx.createGain(); A.master.connect(A.ctx.destination);
      A.musicGain = A.ctx.createGain(); A.musicGain.connect(A.master);
      A.sfxGain = A.ctx.createGain(); A.sfxGain.connect(A.master);
      A.applySettings();
      if (A.cur) { A.nextT = A.ctx.currentTime + 0.1; if (!A.timer) A.timer = setInterval(schedule, 60); }
    } catch (e) { A.ctx = null; }
  };

  A.applySettings = function () {
    if (!A.ctx) return;
    const s = EQ.store.settings();
    A.musicGain.gain.value = s.music ? 0.09 * s.musicVol : 0;
    A.sfxGain.gain.value = s.sfx ? 0.35 * s.sfxVol : 0;
  };

  function tone(freq, t0, dur, type, vol, dest, slideTo) {
    const c = A.ctx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || A.sfxGain);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, vol) {
    const c = A.ctx;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource(); s.buffer = buf;
    const g = c.createGain(); g.gain.value = vol || 0.2;
    const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1200;
    s.connect(f); f.connect(g); g.connect(A.sfxGain);
    s.start(t0);
  }
  const N = n => 440 * Math.pow(2, (n - 69) / 12); // số MIDI → tần số

  const SFX = {
    correct: t => { tone(N(76), t, 0.12, 'square', 0.25); tone(N(83), t + 0.1, 0.22, 'square', 0.25); },
    wrong: t => { tone(N(60), t, 0.18, 'triangle', 0.3); tone(N(56), t + 0.14, 0.25, 'triangle', 0.3); },
    coin: t => { tone(N(88), t, 0.07, 'square', 0.2); tone(N(93), t + 0.06, 0.18, 'square', 0.2); },
    chest: t => { [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.08, 0.2, 'triangle', 0.3)); },
    level: t => { [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(N(n), t + i * 0.09, 0.22, 'square', 0.22)); },
    spell: t => { tone(N(84), t, 0.35, 'sawtooth', 0.15, null, N(96)); noise(t + 0.05, 0.25, 0.12); },
    hit: t => { noise(t, 0.15, 0.3); tone(N(50), t, 0.15, 'square', 0.2, null, N(40)); },
    bump: t => { tone(N(45), t, 0.06, 'square', 0.12); },
    talk: t => { tone(N(79 + Math.floor(Math.random() * 5)), t, 0.04, 'square', 0.08); },
    open: t => { tone(N(67), t, 0.1, 'triangle', 0.3); tone(N(74), t + 0.08, 0.15, 'triangle', 0.3); },
    pick: t => { tone(N(81), t, 0.08, 'square', 0.2); tone(N(86), t + 0.07, 0.12, 'square', 0.2); },
    portal: t => { tone(N(60), t, 0.6, 'sine', 0.3, null, N(84)); },
    victory: t => { [67, 72, 76, 79, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.12, 0.3, 'square', 0.2)); },
    click: t => { tone(N(90), t, 0.03, 'square', 0.08); },
    heal: t => { [72, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.07, 0.25, 'sine', 0.3)); }
  };

  A.sfx = function (name) {
    if (!A.ctx || !EQ.store.settings().sfx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    const f = SFX[name];
    if (f) { try { f(A.ctx.currentTime + 0.01); } catch (e) { /* bỏ qua */ } }
  };

  // ===== Nhạc nền (giai điệu tự soạn) =====
  // mỗi bài: tempo, giai điệu (MIDI, 0 = nghỉ), bè trầm theo hợp âm
  const SONGS = {
    title: { bpm: 96, mel: [72, 0, 76, 79, 81, 79, 76, 0, 74, 0, 77, 81, 79, 77, 76, 74, 72, 0, 76, 79, 84, 83, 81, 79, 77, 76, 74, 76, 72, 0, 0, 0], bass: [48, 48, 53, 53, 55, 55, 48, 48] },
    village: { bpm: 108, mel: [67, 72, 76, 72, 74, 76, 77, 76, 74, 71, 67, 71, 72, 74, 72, 0, 67, 72, 76, 79, 77, 76, 74, 72, 74, 76, 74, 71, 72, 0, 0, 0], bass: [48, 48, 43, 43, 45, 45, 43, 43] },
    forest: { bpm: 92, mel: [69, 0, 72, 76, 74, 72, 69, 0, 67, 0, 71, 74, 72, 71, 67, 0, 69, 72, 76, 79, 77, 76, 74, 72, 71, 72, 74, 71, 69, 0, 0, 0], bass: [45, 45, 41, 41, 43, 43, 40, 40] },
    castle: { bpm: 100, mel: [62, 65, 69, 74, 72, 69, 70, 69, 67, 70, 74, 72, 70, 69, 67, 65, 62, 65, 69, 72, 74, 77, 76, 74, 73, 74, 76, 73, 74, 0, 0, 0], bass: [38, 38, 46, 46, 41, 41, 45, 45] },
    battle: { bpm: 140, mel: [69, 72, 76, 72, 69, 72, 76, 79, 77, 74, 71, 74, 77, 74, 71, 67, 69, 72, 76, 81, 79, 76, 72, 76, 74, 71, 68, 71, 69, 0, 69, 0], bass: [45, 45, 43, 43, 41, 41, 40, 40] }
  };

  A.music = function (name) {
    if (A.cur === name) return;
    A.cur = name;
    A.step = 0;
    if (!A.ctx) return;
    A.nextT = A.ctx.currentTime + 0.1;
    if (!A.timer) A.timer = setInterval(schedule, 60);
  };
  A.stopMusic = function () { A.cur = null; };

  function schedule() {
    if (!A.ctx || !A.cur || !EQ.store.settings().music) return;
    const song = SONGS[A.cur];
    if (!song) return;
    const stepDur = 60 / song.bpm / 2; // nốt móc đơn
    while (A.nextT < A.ctx.currentTime + 0.25) {
      const i = A.step % song.mel.length;
      const n = song.mel[i];
      if (n) tone(N(n), A.nextT, stepDur * 0.9, 'square', 0.18, A.musicGain);
      if (i % 4 === 0) {
        const b = song.bass[(i / 4) % song.bass.length];
        tone(N(b), A.nextT, stepDur * 3.6, 'triangle', 0.35, A.musicGain);
      }
      A.nextT += stepDur;
      A.step++;
    }
  }

  EQ.audio = A;
})();
