import { useRef, useState } from 'react';
import { uploadsApi } from '../../api';

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border border-dashed border-white/10 p-4 cursor-pointer hover:border-white/30 transition-colors text-center"
      >
        {value ? (
          <div className="relative group">
            <img src={value} alt="thumbnail" className="h-32 object-cover mx-auto opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs uppercase tracking-widest">Change</span>
            </div>
          </div>
        ) : (
          <div className="py-6 text-white/20 text-sm">
            <p className="text-3xl mb-2">+</p>
            <p className="text-xs uppercase tracking-widest">Click or drag to upload</p>
            <p className="text-xs mt-1 text-white/10">JPG, PNG, WebP · Max 5MB</p>
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
        <button type="button" onClick={() => onChange('')}
          className="text-xs text-red-400/40 hover:text-red-400 transition-colors uppercase tracking-widest"
        >
          Remove Image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
