import React from 'react';
import { AudioLines, Library, Settings, WifiOff, Wifi } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  page: Page;
  onNavigate: (p: Page) => void;
  online: boolean;
  historyCount: number;
}

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'studio', label: 'Phòng thu', icon: AudioLines },
  { id: 'library', label: 'Thư viện', icon: Library },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
];

export const Logo: React.FC = () => (
  <div className="flex items-center gap-3">
    <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-blade-500 to-blade-600 shadow-lg shadow-blade-600/30">
      {/* Phi tiêu ninja */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor" aria-hidden>
        <path d="M12 1l2.2 7.8L22 12l-7.8 2.2L12 23l-2.2-8.8L1 12l8.8-3.2z" />
        <circle cx="12" cy="12" r="1.8" className="text-blade-600" fill="currentColor" />
      </svg>
    </div>
    <div className="leading-tight">
      <div className="text-[15px] font-bold tracking-tight">VietVoice<span className="text-blade-400"> Studio</span></div>
      <div className="text-[11px] text-ink-400">Văn bản → Giọng nói</div>
    </div>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ page, onNavigate, online, historyCount }) => (
  <>
    {/* Máy tính: thanh bên */}
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-900/70 px-4 py-6 backdrop-blur lg:flex">
      <div className="px-2"><Logo /></div>

      <div className="mt-8 px-3 panel-title">Điều hướng</div>
      <nav className="mt-3 space-y-1">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? 'bg-blade-500/10 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100'
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-blade-500" />}
              <Icon className={`h-[18px] w-[18px] ${active ? 'text-blade-400' : 'text-ink-400 group-hover:text-ink-300'}`} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'library' && historyCount > 0 && (
                <span className="rounded-md bg-ink-700 px-1.5 py-0.5 text-[10px] font-semibold text-ink-300">{historyCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-ink-700/70 bg-ink-850 p-4">
        <div className="flex items-center gap-2 text-xs font-medium">
          {online ? <Wifi className="h-4 w-4 text-jade-400" /> : <WifiOff className="h-4 w-4 text-amber-400" />}
          <span className={online ? 'text-jade-400' : 'text-amber-400'}>{online ? 'Đang có mạng' : 'Đang offline'}</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
          {online
            ? 'Dùng được cả Gemini AI và giọng đọc của máy.'
            : 'Gemini tạm ngưng. Giọng đọc của máy vẫn hoạt động.'}
        </p>
      </div>
    </aside>

    {/* Điện thoại: thanh dưới */}
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-800 bg-ink-900/95 backdrop-blur lg:hidden">
      {NAV.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${page === id ? 'text-blade-400' : 'text-ink-400'}`}
        >
          <Icon className="h-5 w-5" />
          {label}
        </button>
      ))}
    </nav>
  </>
);

export default Sidebar;
