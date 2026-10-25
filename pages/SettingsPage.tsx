import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Save, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';
import { AppSettings, Engine, VOICE_OPTIONS, VoiceName } from '../types';

interface SettingsPageProps {
  settings: AppSettings;
  voices: SpeechSynthesisVoice[];
  onSave: (s: AppSettings) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ settings, voices, onSave }) => {
  const [draft, setDraft] = useState(settings);
  const [show, setShow] = useState(false);
  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const viCount = voices.filter((v) => v.lang.toLowerCase().startsWith('vi')).length;
  const offlineCount = voices.filter((v) => v.localService).length;

  return (
    <div className="grid max-w-5xl grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blade-500/10"><KeyRound className="h-5 w-5 text-blade-400" /></div>
          <div>
            <h2 className="text-sm font-semibold">Khóa API Gemini</h2>
            <p className="text-xs text-ink-400">Dùng cho bộ đọc chất lượng cao</p>
          </div>
        </div>
        <label className="panel-title">API key</label>
        <div className="relative mt-2">
          <input
            className="field pr-11 font-mono"
            type={show ? 'text' : 'password'}
            placeholder="AIza…"
            value={draft.apiKey}
            onChange={(e) => set('apiKey', e.target.value.trim())}
            autoComplete="off"
          />
          <button className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-400 hover:text-ink-100" onClick={() => setShow(!show)} aria-label="Hiện/ẩn">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-blade-300 hover:text-blade-400">
          Lấy key miễn phí tại Google AI Studio <ExternalLink className="h-3 w-3" />
        </a>
        <div className="mt-5 flex gap-2 rounded-lg border border-ink-700 bg-ink-850 p-3 text-[11px] leading-relaxed text-ink-300">
          <ShieldCheck className="h-4 w-4 shrink-0 text-jade-400" />
          Key chỉ lưu trong trình duyệt của máy này (localStorage), không gửi đi đâu ngoài máy chủ Google khi tạo giọng.
        </div>
      </div>

      <div className="panel p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blade-500/10"><Cpu className="h-5 w-5 text-blade-400" /></div>
          <div>
            <h2 className="text-sm font-semibold">Mặc định</h2>
            <p className="text-xs text-ink-400">Áp dụng khi mở Phòng thu</p>
          </div>
        </div>
        <label className="panel-title">Bộ đọc mặc định</label>
        <select className="field mt-2" value={draft.defaultEngine} onChange={(e) => set('defaultEngine', e.target.value as Engine)}>
          <option value="gemini">Gemini AI (cần Internet)</option>
          <option value="browser">Giọng của máy (offline)</option>
        </select>

        <label className="panel-title mt-5 block">Giọng Gemini mặc định</label>
        <select className="field mt-2" value={draft.defaultVoice} onChange={(e) => set('defaultVoice', e.target.value as VoiceName)}>
          {VOICE_OPTIONS.map((v) => <option key={v.id} value={v.id}>{v.name} — {v.gender}, {v.description}</option>)}
        </select>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl border border-ink-700 bg-ink-850 p-3">
            <div className="text-lg font-bold">{viCount}</div>
            <div className="text-[11px] text-ink-400">giọng tiếng Việt trên máy</div>
          </div>
          <div className="rounded-xl border border-ink-700 bg-ink-850 p-3">
            <div className="text-lg font-bold">{offlineCount}</div>
            <div className="text-[11px] text-ink-400">giọng chạy offline</div>
          </div>
        </div>
      </div>

      <div className="xl:col-span-2">
        <button className="btn-primary" onClick={() => onSave(draft)}>
          <Save className="h-4 w-4" /> Lưu cài đặt
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
