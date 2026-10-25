import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastMsg {
  id: number;
  kind: 'ok' | 'error';
  text: string;
}

const Toast: React.FC<{ toast: ToastMsg | null; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, toast.kind === 'error' ? 7000 : 3500);
    return () => clearTimeout(t);
  }, [toast, onClose]);

  if (!toast) return null;
  const ok = toast.kind === 'ok';
  return (
    <div className="fixed right-4 bottom-20 z-50 max-w-sm lg:bottom-6" role="status">
      <div className={`panel rise flex items-start gap-3 p-4 ${ok ? 'border-jade-400/30' : 'border-blade-500/40'}`}>
        {ok ? <CheckCircle2 className="h-5 w-5 shrink-0 text-jade-400" /> : <AlertTriangle className="h-5 w-5 shrink-0 text-blade-400" />}
        <p className="flex-1 text-sm leading-relaxed">{toast.text}</p>
        <button onClick={onClose} className="text-ink-400 hover:text-ink-100" aria-label="Đóng"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};

export default Toast;
