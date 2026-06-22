import { useRef, useState } from 'react';
import { uploadsApi } from '../../api';

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
}

export default function FileUpload({ value, onChange, accept = 'application/pdf', label = '파일 업로드' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    setProgress(0);
    try {
      const url = await uploadsApi.upload(file, setProgress);
      onChange(url);
    } catch {
      setError('업로드에 실패했습니다.');
    } finally {
      setProgress(null);
    }
  };

  const filename = value ? value.split('/').pop() : null;

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-white/10 p-6 cursor-pointer hover:border-white/30 transition-colors"
      >
        {value ? (
          <div className="flex items-center gap-3">
            <span className="text-white/20 text-2xl">📄</span>
            <div>
              <p className="text-sm text-white/60 font-medium truncate max-w-xs">{filename}</p>
              <p className="text-xs text-white/20 mt-0.5 uppercase tracking-widest">Click to replace</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-white/20">
            <p className="text-2xl mb-2">+</p>
            <p className="text-xs uppercase tracking-widest">{label}</p>
          </div>
        )}

        {progress !== null && (
          <div className="mt-3">
            <div className="h-px bg-white/10 overflow-hidden">
              <div className="h-full bg-white transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/20 mt-1">{progress}%</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs uppercase tracking-widest">{error}</p>}

      {value && (
        <div className="flex items-center gap-4">
          <a href={value} target="_blank" rel="noreferrer"
            className="text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest">
            미리보기 ↗
          </a>
          <button type="button" onClick={() => onChange('')}
            className="text-xs text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-widest">
            Remove
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}
