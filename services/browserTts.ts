/**
 * Đọc văn bản bằng giọng có sẵn trong hệ điều hành (Web Speech API).
 * Giọng "localService" chạy hoàn toàn offline; một số giọng của Chrome/Edge cần Internet.
 * Lưu ý: trình duyệt không cho ghi lại âm thanh của chế độ này nên chỉ nghe trực tiếp.
 */
import { splitText } from "../utils/textUtils";

export const isBrowserTtsSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    if (!isBrowserTtsSupported()) return resolve([]);
    const list = speechSynthesis.getVoices();
    if (list.length) return resolve(list);
    const done = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 1500);
  });

export const sortVoices = (voices: SpeechSynthesisVoice[]) =>
  [...voices].sort((a, b) => {
    const va = a.lang.toLowerCase().startsWith('vi') ? 0 : 1;
    const vb = b.lang.toLowerCase().startsWith('vi') ? 0 : 1;
    if (va !== vb) return va - vb;
    if (a.localService !== b.localService) return a.localService ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

export const pickVoice = (voices: SpeechSynthesisVoice[], uri: string) =>
  voices.find((v) => v.voiceURI === uri) ||
  voices.find((v) => v.lang.toLowerCase().startsWith('vi') && v.localService) ||
  voices.find((v) => v.lang.toLowerCase().startsWith('vi')) ||
  null;

export interface SpeakHandle {
  stop: () => void;
  done: Promise<void>;
}

export const speak = (
  text: string,
  voice: SpeechSynthesisVoice | null,
  rate: number,
  onProgress?: (done: number, total: number) => void
): SpeakHandle => {
  speechSynthesis.cancel();
  // Chia câu ngắn để tránh lỗi Chrome tự dừng với văn bản dài
  const chunks = splitText(text, 220);
  let stopped = false;

  const done = (async () => {
    for (let i = 0; i < chunks.length && !stopped; i++) {
      onProgress?.(i, chunks.length);
      await new Promise<void>((resolve, reject) => {
        const u = new SpeechSynthesisUtterance(chunks[i]);
        if (voice) u.voice = voice;
        u.lang = voice?.lang || 'vi-VN';
        u.rate = rate;
        u.onend = () => resolve();
        u.onerror = (e) => (e.error === 'interrupted' || e.error === 'canceled' ? resolve() : reject(new Error(e.error)));
        speechSynthesis.speak(u);
      });
    }
    onProgress?.(chunks.length, chunks.length);
  })();

  return {
    stop: () => {
      stopped = true;
      speechSynthesis.cancel();
    },
    done,
  };
};
