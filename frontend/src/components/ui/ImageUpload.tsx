import { useRef, useState } from 'react';
import { uploadsApi } from '../../api';
import { removeBackground } from '@imgly/background-removal';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file: File) => {
    setProgress(0);
    try {
      const url = await uploadsApi.uploadImage(file, setProgress);
      onChange(url);
    } catch {
      setError('업로드에 실패했습니다.');
    } finally {
      setProgress(null);
    }
  };

  const handleFile = async (file: File, removeBg = false) => {
    setError('');
    if (removeBg) {
      setRemovingBg(true);
      try {
        const blob = await removeBackground(file);
        const processed = new File([blob], file.name.replace(/\.[^.]+$/, '.png'), { type: 'image/png' });
        await uploadFile(processed);
      } catch {
        setError('배경 제거에 실패했습니다.');
      } finally {
        setRemovingBg(false);
      }
    } else {
      await uploadFile(file);
    }
  };

  const removeBgRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isLoading = removingBg || progress !== null;

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border border-dashed border-white/10 p-4 transition-colors text-center"
      >
        {value ? (
          <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
            <img src={value} alt="thumbnail" className="h-32 object-cover mx-auto opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs uppercase tracking-widest">Change</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-white/20 text-sm">
            <p className="text-3xl mb-2">+</p>
            <p className="text-xs uppercase tracking-widest mb-4">Drag to upload</p>
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => inputRef.current?.click()}
                disabled={isLoading}
                className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border border-white/10 text-white/40 hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
                Upload
              </button>
              <button type="button" onClick={() => removeBgRef.current?.click()}
                disabled={isLoading}
                className="text-xs font-semibold uppercase tracking-widest px-4 py-2 border border-white/10 text-white/40 hover:border-white/30 hover:text-white transition-colors disabled:opacity-30">
                Remove BG
              </button>
            </div>
          </div>
        )}

        {removingBg && (
          <p className="text-xs text-white/30 uppercase tracking-widest mt-3 animate-pulse">배경 제거 중...</p>
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
        <div className="flex gap-4">
          <button type="button" onClick={() => removeBgRef.current?.click()}
            disabled={isLoading}
            className="text-xs text-white/30 hover:text-white transition-colors uppercase tracking-widest disabled:opacity-30">
            {removingBg ? '배경 제거 중...' : 'Remove BG'}
          </button>
          <button type="button" onClick={() => onChange('')}
            className="text-xs text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-widest">
            Remove Image
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={removeBgRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={e => { if (e.target.files?.[0]) { handleFile(e.target.files[0], true); e.target.value = ''; } }} />
    </div>
  );
}
