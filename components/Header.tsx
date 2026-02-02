import React from 'react';
import { Mic } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
          <Mic className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">VietVoice Studio AI</h1>
          <p className="text-xs text-slate-400">Chuyển đổi văn bản thành giọng nói tiếng Việt</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
