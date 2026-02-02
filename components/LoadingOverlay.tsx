import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Đang xử lý âm thanh...</h3>
        <p className="text-slate-400 text-sm">
          Gemini đang đọc kịch bản của bạn. Vui lòng đợi trong giây lát.
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
