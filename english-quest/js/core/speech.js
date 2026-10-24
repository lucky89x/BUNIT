/* Đọc tiếng Anh bằng giọng có sẵn của trình duyệt (Speech Synthesis).
 * Nếu máy không có giọng tiếng Anh, game vẫn chạy bình thường và báo rõ cho người chơi.
 */
window.EQ = window.EQ || {};
(function () {
  const SP = { supported: 'speechSynthesis' in window, voices: [], ready: false, warned: false };

  SP.init = function () {
    if (!SP.supported) return;
    const load = () => {
      SP.voices = window.speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang));
      SP.ready = SP.voices.length > 0;
    };
    load();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', load);
    } else {
      window.speechSynthesis.onvoiceschanged = load;
    }
    // một số trình duyệt nạp giọng chậm
    setTimeout(load, 500); setTimeout(load, 2000);
  };

  SP.available = () => SP.supported && SP.voices.length > 0;

  SP.listFor = function (accent) {
    if (accent === 'en-US') return SP.voices.filter(v => /en[-_]US/i.test(v.lang));
    if (accent === 'en-GB') return SP.voices.filter(v => /en[-_]GB/i.test(v.lang));
    return SP.voices;
  };

  SP.pickVoice = function () {
    const s = EQ.store.settings();
    if (s.voiceName) {
      const v = SP.voices.find(x => x.name === s.voiceName);
      if (v) return v;
    }
    let pool = SP.listFor(s.accent);
    if (!pool.length) pool = SP.voices;
    // ưu tiên giọng tự nhiên, sau đó giọng chạy offline
    const pref = pool.find(v => /natural|online/i.test(v.name) && /en[-_](US|GB)/i.test(v.lang)) ||
      pool.find(v => /Google/i.test(v.name)) ||
      pool.find(v => /Zira|Aria|Jenny|Hazel|Susan|Libby|Sonia/i.test(v.name)) ||
      pool.find(v => v.localService) || pool[0];
    return pref || null;
  };

  // speak(text, {rate}) → Promise (resolve khi đọc xong hoặc lỗi)
  SP.speak = function (text, opt) {
    return new Promise(resolve => {
      if (!SP.available()) {
        if (!SP.warned || (opt && opt.user)) {
          SP.warned = true;
          if (EQ.ui && EQ.ui.toast) EQ.ui.toast('🔇 Máy chưa có giọng đọc tiếng Anh, nên chưa nghe được. Game vẫn chơi bình thường. (Xem cách cài giọng đọc trong file HUONG-DAN.)', 'warn', 5000);
        }
        resolve(false);
        return;
      }
      try {
        const s = EQ.store.settings();
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text).replace(/_/g, ' '));
        const v = SP.pickVoice();
        if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
        u.rate = (opt && opt.rate) || s.rate || 0.85;
        u.pitch = 1.05;
        let done = false;
        const fin = ok => { if (!done) { done = true; resolve(ok); } };
        u.onend = () => fin(true);
        u.onerror = () => fin(false);
        setTimeout(() => fin(true), 8000);
        window.speechSynthesis.speak(u);
      } catch (e) { resolve(false); }
    });
  };

  SP.stop = function () { try { if (SP.supported) window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ } };

  // ---------- Luyện nói (tùy chọn, cần Internet) ----------
  // Chỉ kiểm tra trình duyệt "nghe ra" đúng các từ của câu; KHÔNG chấm điểm phát âm.
  SP.canListen = () => !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  SP.listenEnabled = () => SP.canListen() && !!EQ.store.settings().speakPractice;
  const NUM = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  const norm = t => String(t || '').toLowerCase().replace(/[’]/g, "'")
    .replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'s\b/g, ' is').replace(/'ll\b/g, ' will')
    .replace(/\b(\d{1,2})\b/g, (m, d) => NUM[+d] || d)
    .replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  SP.match = function (expected, heardList) {
    const exp = norm(expected);
    let best = { score: 0, heard: heardList[0] || '' };
    heardList.forEach(h => {
      const got = norm(h);
      const hit = exp.filter(w => got.indexOf(w) >= 0).length;
      const score = exp.length ? hit / exp.length : 0;
      if (score > best.score) best = { score, heard: h };
    });
    return best;
  };
  // trả về Promise<{ok, heard, score, error}>
  SP.listen = function (expected) {
    return new Promise(resolve => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!R) return resolve({ ok: false, error: 'unsupported' });
      SP.stop();
      let done = false;
      const fin = r => { if (!done) { done = true; resolve(r); } };
      try {
        const rec = new R();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 5;
        rec.onresult = e => {
          const alts = Array.from(e.results[0]).map(a => a.transcript);
          const m = SP.match(expected, alts);
          fin({ ok: m.score >= 0.7, heard: m.heard, score: m.score });
        };
        rec.onerror = e => fin({ ok: false, error: e.error || 'error' });
        rec.onend = () => fin({ ok: false, error: 'no-speech' });
        rec.start();
        setTimeout(() => { try { rec.stop(); } catch (x) { /* bỏ qua */ } }, 7000);
      } catch (e) { fin({ ok: false, error: 'error' }); }
    });
  };
  // nút 🎤 dùng chung
  SP.micButton = function (expected, onOk) {
    const U = EQ.U;
    const out = U.el('span', { class: 'mic-out' });
    const btn = U.el('button', { class: 'btn-mic', title: 'Nói câu này' }, '🎤 Nói thử');
    btn.onclick = async e => {
      e.stopPropagation();
      btn.disabled = true; btn.textContent = '🎙️ Đang nghe...'; out.textContent = '';
      const r = await SP.listen(expected);
      btn.disabled = false; btn.textContent = '🎤 Nói lại';
      if (r.error === 'not-allowed' || r.error === 'service-not-allowed') out.textContent = 'Chưa được phép dùng micro. Hãy bấm "Cho phép" khi trình duyệt hỏi.';
      else if (r.error === 'network') out.textContent = 'Cần kết nối Internet để luyện nói.';
      else if (r.error) out.textContent = 'Chưa nghe thấy gì. Bấm 🎤 rồi nói to, rõ nhé!';
      else if (r.ok) { out.textContent = '👍 Game nghe được: "' + r.heard + '"'; out.className = 'mic-out ok'; EQ.audio.sfx('correct'); if (onOk) onOk(); }
      else { out.textContent = 'Game nghe được: "' + r.heard + '" – thử nói lại chậm và rõ hơn nhé!'; out.className = 'mic-out'; }
    };
    return U.el('span', { class: 'mic' }, [btn, out]);
  };

  EQ.speech = SP;
})();
