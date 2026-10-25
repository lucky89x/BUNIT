import React, { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, Download, Library, Clock, HardDrive, Copy } from 'lucide-react';
import AudioPlayer from '../components/AudioPlayer';
import StatCard from '../components/StatCard';
import { HistoryItem } from '../types';
import { formatBytes, formatTime, slugify } from '../utils/textUtils';

interface LibraryPageProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClear: () => void;
  onCopy: (text: string) => void;
}

const Row: React.FC<{ item: HistoryItem; onDelete: () => void; onCopy: () => void }> = ({ item, onDelete, onCopy }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(item.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [item.blob]);

  return (
    <div className="panel rise p-4 md:p-5">
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold">{item.title}</h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-400">
            <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
            <span>Giọng {item.voice}</span>
            <span>{item.speed}x</span>
            <span>{formatTime(item.duration)}</span>
            <span>{formatBytes(item.size)}</span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button className="btn-ghost px-2.5 py-2" title="Chép văn bản" onClick={onCopy}><Copy className="h-4 w-4" /></button>
          {url && (
            <a className="btn-ghost px-2.5 py-2" title="Tải .wav" href={url} download={`${slugify(item.title)}.wav`}>
              <Download className="h-4 w-4" />
            </a>
          )}
          <button className="btn-ghost px-2.5 py-2 hover:border-blade-500/50 hover:text-blade-300" title="Xóa" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {url && <AudioPlayer audioUrl={url} fileName={slugify(item.title)} compact />}
    </div>
  );
};

const LibraryPage: React.FC<LibraryPageProps> = ({ items, onDelete, onClear, onCopy }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? items.filter((i) => i.text.toLowerCase().includes(k) || i.voice.toLowerCase().includes(k)) : items;
  }, [items, q]);

  const totalDur = items.reduce((s, i) => s + i.duration, 0);
  const totalSize = items.reduce((s, i) => s + i.size, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Library} label="Bản ghi" value={items.length.toString()} hint="Lưu trên máy này" />
        <StatCard icon={Clock} label="Tổng thời lượng" value={formatTime(totalDur)} />
        <StatCard icon={HardDrive} label="Dung lượng" value={formatBytes(totalSize)} hint="IndexedDB trình duyệt" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input className="field pl-10" placeholder="Tìm theo nội dung hoặc giọng đọc…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {items.length > 0 && (
          <button className="btn-ghost" onClick={() => { if (confirm('Xóa toàn bộ thư viện? Không thể hoàn tác.')) onClear(); }}>
            <Trash2 className="h-4 w-4" /> Xóa tất cả
          </button>
        )}
      </div>

      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
          {filtered.map((it) => (
            <Row key={it.id} item={it} onDelete={() => onDelete(it.id)} onCopy={() => onCopy(it.text)} />
          ))}
        </div>
      ) : (
        <div className="panel grid place-items-center px-6 py-16 text-center">
          <Library className="h-10 w-10 text-ink-600" />
          <p className="mt-4 text-sm font-medium">{items.length ? 'Không có kết quả phù hợp' : 'Thư viện trống'}</p>
          <p className="mt-1 text-xs text-ink-400">Các file tạo bằng Gemini sẽ tự động lưu ở đây, dùng được cả khi offline.</p>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
