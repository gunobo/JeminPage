import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { exportApi } from '../../api';
import { toast } from '../../lib/toast';
import type { ExportDoc, ExportFormat } from '../../types';

interface Props {
  /** cv_mode === 'upload' 이고 cv_url이 있으면 PDF 항목은 업로드한 CV를 연다 */
  uploadedCvUrl?: string;
  doc?: ExportDoc;
  className?: string;
  align?: 'left' | 'right';
  label?: string;
}

const ITEMS: { format: ExportFormat; label: string; hint: string }[] = [
  { format: 'pdf', label: 'PDF', hint: '제출 · 인쇄' },
  { format: 'docx', label: 'Word', hint: '수정해서 제출' },
  { format: 'md', label: 'Markdown', hint: '노션 · 깃허브' },
];

async function errorMessage(err: unknown): Promise<string> {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 429) return '요청이 너무 많아요. 1분 뒤에 다시 시도해주세요.';
    // responseType: 'blob' 이라 에러 본문도 Blob으로 온다
    const data = err.response?.data;
    if (data instanceof Blob) {
      try {
        const json = JSON.parse(await data.text());
        if (typeof json.detail === 'string') return json.detail;
      } catch { /* ignore */ }
    }
    if (status && status >= 500) return '문서 생성에 실패했어요. 잠시 후 다시 시도해주세요.';
  }
  return '다운로드에 실패했어요.';
}

export default function DownloadMenu({ uploadedCvUrl, doc = 'portfolio', className = '', align = 'right', label = 'Download' }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const run = async (format: ExportFormat) => {
    if (busy) return;
    if (format === 'pdf' && uploadedCvUrl) {
      window.open(uploadedCvUrl, '_blank', 'noopener,noreferrer');
      setOpen(false);
      return;
    }
    setBusy(format);
    try {
      await exportApi.download(format, doc);
      setOpen(false);
    } catch (err) {
      toast(await errorMessage(err), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">
        {busy && <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" aria-hidden />}
        {label} <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>↓</span>
      </button>
      {open && (
        <div role="menu"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-3 w-52 bg-[#111] border border-white/10 shadow-2xl z-50`}>
          {ITEMS.map(({ format, label, hint }) => (
            <button key={format} type="button" role="menuitem" disabled={!!busy} onClick={() => run(format)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.06] transition-colors disabled:opacity-40 border-b border-white/5 last:border-b-0">
              <span className="text-xs font-black uppercase tracking-widest text-white/80">{label}</span>
              <span className="flex items-center gap-2 text-[10px] text-white/30">
                {busy === format
                  ? <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" aria-label="생성 중" />
                  : (format === 'pdf' && uploadedCvUrl ? '업로드한 CV' : hint)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
