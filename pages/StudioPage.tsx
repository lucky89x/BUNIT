import React, { useEffect, useRef, useState } from 'react';
import { Wand2, Gauge, Sparkles, Cpu, FileText, Eraser, ClipboardPaste, Clock, Type, Square, Volume2, AlertCircle } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import { AppSettings, Engine, VOICE_OPTIONS, VoiceName } from '../types';
import { countWords, estimateSeconds, formatTime } from '../utils/textUtils';
import { isBrowserTtsSupported, pickVoice, speak, SpeakHandle } from '../services/browserTts';
import StatCard from '../components/StatCard';

const MAX_CHARS = 20000;

interface StudioPageProps {
  settings: AppSettings;
  voices: SpeechSynthesisVoice[];
  online: boolean;
  audioUrl: string | null;
  audioName: string;
  onGenerate: (text: string, voice: VoiceName, speed: number) => void;
  onError: (msg: string) => void;
  onBrowserVoiceChange: (uri: string) => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const getSpeedLabel = (val: number) => {
  if (val <= 0.5) return 'Rất chậm';
  if (val <= 0.75) return 'Chậm';
  if (val === 1) return 'Bình thường';
  if (val <= 1.25) return 'Hơi nhanh';
  if (val <= 1.5) return 'Nhanh';
  return 'Rất nhanh';
};

const StudioPage: React.FC<StudioPageProps> = ({
  settings, voices, online, audioUrl, audioName, onGenerate, onError, onBrowserVoiceChange,
}) => {
  const [text, setText] = useState('');
  const [engine, setEngine] = useState<Engine>(settings.defaultEngine);
  const [voice, setVoice] = useState<VoiceName>(settings.defaultVoice);
  const [speedIdx, setSpeedIdx] = useState(2);
  const [speaking, setSpeaking] = useState<{ done: number; total: number } | null>(null);
  const handleRef = useRef<SpeakHandle | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const speed = SPEEDS[speedIdx];

  const browserVoice = pickVoice(voices, settings.browserVoiceURI);
  const viVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('vi'));

  useEffect(() => () => handleRef.current?.stop(), []);

  const handleRun = async () => {
    if (!text.trim()) return onError('Vui lòng nhập nội dung văn bản.');
    if (engine === 'gemini') {
      if (!online) return onError('Máy đang offline. Chuyển sang "Giọng của máy" để đọc không cần mạng.');
      return onGenerate(text, voice, speed);
    }
    if (!isBrowserTtsSupported()) return onError('Trình duyệt này không hỗ trợ đọc văn bản.');
    handleRef.current?.stop();
    const h = speak(text, browserVoice, speed, (done, total) => setSpeaking({ done, total }));
    handleRef.current = h;
    try {
      await h.done;
    } catch (e: any) {
      onError(`Không đọc được: ${e?.message || e}`);
    } finally {
      if (handleRef.current === h) setSpeaking(null);
    }
  };

  const stop = () => {
    handleRef.current?.stop();
    setSpeaking(null);
  };

  const openFile = async (f: File | undefined) => {
    if (!f) return;
    setText((await f.text()).slice(0, MAX_CHARS));
  };

  const paste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      setText((t) => (t + clip).slice(0, MAX_CHARS));
    } catch {
      onError('Trình duyệt không cho đọc clipboard. Hãy dùng Ctrl+V.');
    }
  };

  const est = estimateSeconds(text, speed);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Type} label="Ký tự" value={text.length.toLocaleString('vi-VN')} hint={`Tối đa ${MAX_CHARS.toLocaleString('vi-VN')}`} />
        <StatCard icon={FileText} label="Số từ" value={countWords(text).toLocaleString('vi-VN')} hint="Tiếng Việt có dấu" />
        <StatCard icon={Clock} label="Thời lượng ước tính" value={formatTime(est)} hint={`Ở tốc độ ${speed}x`} />
        <StatCard icon={engine === 'gemini' ? Sparkles : Cpu} label="Bộ đọc" value={engine === 'gemini' ? 'Gemini AI' : 'Giọng máy'} hint={engine === 'gemini' ? 'Cần Internet' : 'Chạy offline'} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Soạn thảo */}
        <div className="space-y-6 xl:col-span-2">
          <div className="panel overflow-hidden transition-shadow focus-within:border-blade-500/40">
            <div className="flex flex-wrap items-center gap-2 border-b border-ink-700/70 px-4 py-3">
              <span className="panel-title mr-auto">Kịch bản</span>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => fileRef.current?.click()}>
                <FileText className="h-3.5 w-3.5" /> Mở .txt
              </button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={paste}>
                <ClipboardPaste className="h-3.5 w-3.5" /> Dán
              </button>
              <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setText('')} disabled={!text}>
                <Eraser className="h-3.5 w-3.5" /> Xóa
              </button>
              <input ref={fileRef} type="file" accept=".txt,.md,text/plain" className="hidden" onChange={(e) => { openFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>
            <textarea
              className="h-[22rem] w-full resize-none bg-transparent p-5 text-[15px] leading-relaxed text-ink-100 placeholder:text-ink-400 focus:outline-none md:h-[26rem]"
              placeholder="Nhập hoặc dán nội dung kịch bản cần lồng tiếng vào đây…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between border-t border-ink-700/70 px-5 py-2.5 text-[11px] text-ink-400">
              <span>Mẹo: dùng dấu chấm, phẩy để ngắt nghỉ tự nhiên. Văn bản dài sẽ tự chia đoạn.</span>
              <span className="tabular-nums">{text.length} / {MAX_CHARS}</span>
            </div>
            <div className="h-0.5 bg-ink-800">
              <div className="h-full bg-blade-500 transition-all" style={{ width: `${(text.length / MAX_CHARS) * 100}%` }} />
            </div>
          </div>

          {engine === 'gemini' && audioUrl && <AudioPlayer audioUrl={audioUrl} fileName={audioName} />}

          {engine === 'browser' && speaking && (
            <div className="panel rise flex items-center gap-4 p-5">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-blade-500/15">
                <Volume2 className="h-6 w-6 animate-pulse text-blade-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">Đang đọc bằng giọng của máy…</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full bg-blade-500 transition-all" style={{ width: `${speaking.total ? (speaking.done / speaking.total) * 100 : 0}%` }} />
                </div>
                <div className="mt-1 text-[11px] text-ink-400">Đoạn {Math.min(speaking.done + 1, speaking.total)} / {speaking.total}</div>
              </div>
              <button className="btn-ghost" onClick={stop}><Square className="h-4 w-4 fill-current" /> Dừng</button>
            </div>
          )}
        </div>

        {/* Bảng điều khiển */}
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="panel-title mb-3">Bộ đọc</div>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-850 p-1">
              {([
                ['gemini', 'Gemini AI', Sparkles],
                ['browser', 'Giọng máy', Cpu],
              ] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => setEngine(id)}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                    engine === id ? 'bg-ink-700 text-white shadow' : 'text-ink-400 hover:text-ink-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${engine === id ? 'text-blade-400' : ''}`} /> {label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
              {engine === 'gemini'
                ? 'Chất lượng cao, xuất file .wav. Cần Internet và API key.'
                : 'Dùng giọng tiếng Việt cài sẵn trong Windows/macOS. Không cần mạng, chỉ nghe trực tiếp.'}
            </p>
            {engine === 'gemini' && !settings.apiKey && !process.env.API_KEY && (
              <div className="mt-3 flex gap-2 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-[11px] text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> Chưa có API key — vào Cài đặt để nhập.
              </div>
            )}
          </div>

          <div className="panel p-5">
            <div className="panel-title mb-3">Giọng đọc</div>
            {engine === 'gemini' ? (
              <div className="grid grid-cols-1 gap-2">
                {VOICE_OPTIONS.map((v) => {
                  const active = voice === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active ? 'border-blade-500/50 bg-blade-500/10' : 'border-ink-700 bg-ink-850 hover:border-ink-600'
                      }`}
                    >
                      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold ${active ? 'bg-blade-500 text-white' : 'bg-ink-700 text-ink-300'}`}>
                        {v.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-100'}`}>{v.name}</span>
                          <span className="rounded bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-300">{v.gender}</span>
                        </div>
                        <p className="truncate text-xs text-ink-400">{v.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <select className="field" value={browserVoice?.voiceURI || ''} onChange={(e) => onBrowserVoiceChange(e.target.value)}>
                  {!voices.length && <option value="">Không tìm thấy giọng nào</option>}
                  {voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} · {v.lang}{v.localService ? ' · offline' : ' · cần mạng'}
                    </option>
                  ))}
                </select>
                {!viVoices.length && (
                  <div className="rounded-lg border border-amber-400/30 bg-amber-400/5 p-3 text-[11px] leading-relaxed text-amber-400">
                    Máy chưa có giọng tiếng Việt. Windows: <b>Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng</b>, chọn Tiếng Việt (giọng "An"), rồi mở lại trình duyệt.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="panel-title flex items-center gap-2"><Gauge className="h-4 w-4" /> Tốc độ</span>
              <span className="rounded-md bg-ink-800 px-2 py-1 font-mono text-xs text-blade-300">{speed}x · {getSpeedLabel(speed)}</span>
            </div>
            <input type="range" className="slider" min={0} max={SPEEDS.length - 1} step={1} value={speedIdx} onChange={(e) => setSpeedIdx(+e.target.value)} />
            <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-400">
              {SPEEDS.map((s) => <span key={s}>{s}x</span>)}
            </div>
          </div>

          {speaking ? (
            <button className="btn-ghost w-full py-4 text-base" onClick={stop}>
              <Square className="h-5 w-5 fill-current" /> Dừng đọc
            </button>
          ) : (
            <button className="btn-primary group w-full py-4 text-base font-semibold" onClick={handleRun} disabled={!text.trim()}>
              <Wand2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
              {engine === 'gemini' ? 'Tạo giọng nói' : 'Đọc ngay'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioPage;
