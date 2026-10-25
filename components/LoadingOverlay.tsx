import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  done: number;
  total: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, done, total }) => {
  if (!isVisible) return null;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/80 p-4 backdrop-blur-sm">
      <div className="panel rise w-full max-w-sm p-8 text-center">
        <div className="mx-auto flex h-14 items-end justify-center gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className="w-1.5 rounded-full bg-blade-500"
              style={{ height: '100%', animation: `eq 1s ${i * 0.08}s ease-in-out infinite alternate` }}
            />
          ))}
        </div>
        <style>{`@keyframes eq{from{transform:scaleY(.2)}to{transform:scaleY(1)}}`}</style>
        <h3 className="mt-6 text-lg font-semibold">Đang tạo giọng nói…</h3>
        <p className="mt-1 text-sm text-ink-400">
          {total > 1 ? `Đoạn ${Math.min(done + 1, total)} / ${total}` : 'Gemini đang đọc kịch bản của bạn'}
        </p>
        <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-ink-700">
          <div className="slash relative h-full overflow-hidden rounded-full bg-blade-500 transition-all duration-500" style={{ width: `${Math.max(pct, 6)}%` }} />
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
