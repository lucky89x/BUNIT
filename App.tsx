import React, { useCallback, useEffect, useState } from 'react';
import Sidebar, { Logo } from './components/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import Toast, { ToastMsg } from './components/Toast';
import StudioPage from './pages/StudioPage';
import LibraryPage from './pages/LibraryPage';
import SettingsPage from './pages/SettingsPage';
import { generateSpeech } from './services/geminiService';
import { loadVoices, sortVoices } from './services/browserTts';
import { clearHistory, deleteHistory, listHistory, saveHistory } from './services/historyDb';
import { loadSettings, saveSettings } from './services/settings';
import { AppSettings, HistoryItem, Page, VoiceName } from './types';
import { makeTitle, slugify } from './utils/textUtils';

const TITLES: Record<Page, [string, string]> = {
  studio: ['Phòng thu', 'Soạn kịch bản và chuyển thành giọng nói tiếng Việt'],
  library: ['Thư viện', 'Các bản ghi đã tạo, lưu ngay trên máy'],
  settings: ['Cài đặt', 'API key và lựa chọn mặc định'],
};

const wavDuration = (size: number) => Math.max(0, (size - 44) / (24000 * 2));

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('studio');
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [audio, setAudio] = useState<{ url: string; name: string } | null>(null);
  const [toast, setToast] = useState<ToastMsg | null>(null);

  const notify = useCallback((kind: ToastMsg['kind'], text: string) => setToast({ id: Date.now(), kind, text }), []);
  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    loadVoices().then((v) => setVoices(sortVoices(v)));
    listHistory().then(setHistory).catch(() => notify('error', 'Không mở được thư viện lưu trữ của trình duyệt.'));
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, [notify]);

  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio.url); }, [audio]);

  const updateSettings = (s: AppSettings) => {
    setSettings(s);
    saveSettings(s);
  };

  const handleGenerate = async (text: string, voice: VoiceName, speed: number) => {
    setProgress({ done: 0, total: 1 });
    setAudio(null);
    try {
      const blob = await generateSpeech(text, voice, speed, settings.apiKey, (done, total) => setProgress({ done, total }));
      const title = makeTitle(text);
      setAudio({ url: URL.createObjectURL(blob), name: slugify(title) });
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        title,
        text,
        voice,
        engine: 'gemini',
        speed,
        duration: wavDuration(blob.size),
        size: blob.size,
        blob,
      };
      await saveHistory(item).catch(() => undefined);
      setHistory((h) => [item, ...h]);
      notify('ok', 'Đã tạo xong và lưu vào Thư viện.');
    } catch (err: any) {
      console.error(err);
      const msg = String(err?.message || err);
      notify('error', /api key|API_KEY|401|403/i.test(msg)
        ? 'API key không hợp lệ hoặc chưa nhập. Kiểm tra lại ở mục Cài đặt.'
        : `Lỗi khi tạo giọng nói: ${msg}`);
    } finally {
      setProgress(null);
    }
  };

  const [title, subtitle] = TITLES[page];

  return (
    <div className="flex min-h-full">
      <Sidebar page={page} onNavigate={setPage} online={online} historyCount={history.length} />
      <LoadingOverlay isVisible={!!progress} done={progress?.done || 0} total={progress?.total || 0} />
      <Toast toast={toast} onClose={closeToast} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/70 backdrop-blur">
          <div className="flex items-center gap-4 px-4 py-4 md:px-8">
            <div className="lg:hidden"><Logo /></div>
            <div className="hidden min-w-0 lg:block">
              <div className="flex items-center gap-2 text-[11px] text-ink-400">
                <span>VietVoice</span><span className="text-ink-600">/</span><span className="text-ink-300">{title}</span>
              </div>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight">{title}</h1>
            </div>
            <div className="ml-auto flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-[11px] font-medium">
              <span className={`h-2 w-2 rounded-full ${online ? 'bg-jade-400' : 'bg-amber-400'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 lg:pb-10">
          <p className="mb-6 text-sm text-ink-400 lg:-mt-1">
            <span className="font-semibold text-ink-100 lg:hidden">{title} · </span>{subtitle}
          </p>
          {page === 'studio' && (
            <StudioPage
              settings={settings}
              voices={voices}
              online={online}
              audioUrl={audio?.url || null}
              audioName={audio?.name || 'vietvoice'}
              onGenerate={handleGenerate}
              onError={(m) => notify('error', m)}
              onBrowserVoiceChange={(uri) => updateSettings({ ...settings, browserVoiceURI: uri })}
            />
          )}
          {page === 'library' && (
            <LibraryPage
              items={history}
              onDelete={async (id) => { await deleteHistory(id); setHistory((h) => h.filter((i) => i.id !== id)); }}
              onClear={async () => { await clearHistory(); setHistory([]); }}
              onCopy={(t) => navigator.clipboard.writeText(t).then(() => notify('ok', 'Đã chép văn bản.'), () => notify('error', 'Không chép được.'))}
            />
          )}
          {page === 'settings' && (
            <SettingsPage settings={settings} voices={voices} onSave={(s) => { updateSettings(s); notify('ok', 'Đã lưu cài đặt.'); }} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
