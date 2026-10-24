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

  EQ.speech = SP;
})();
