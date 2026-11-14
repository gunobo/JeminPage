import { useEffect, useState } from 'react';
import { TOAST_EVENT as EVENT, type ToastKind } from '../../lib/toast';

type ToastItem = { id: number; text: string; kind: ToastKind };

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let seq = 0;
    const onToast = (e: Event) => {
      const { text, kind } = (e as CustomEvent<Omit<ToastItem, 'id'>>).detail;
      const id = ++seq;
      setItems(prev => [...prev, { id, text, kind }]);
      setTimeout(() => setItems(prev => prev.filter(t => t.id !== id)), 4000);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (items.length === 0) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-32px)] max-w-sm" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id}
          className={`px-5 py-3 text-sm border backdrop-blur ${t.kind === 'error'
            ? 'bg-red-950/80 border-red-400/30 text-red-200'
            : 'bg-[#111]/90 border-white/10 text-white/80'}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
