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
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-[#1a1a2e] transition-colors text-center"
      >
        {value ? (
          <div className="relative group">
            <img src={value} alt="thumbnail" className="h-32 object-cover rounded mx-auto" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
              <span className="text-white text-sm">클릭하여 변경</span>
            </div>
          </div>
        ) : (
          <div className="py-4 text-gray-400 text-sm">
            <p className="text-2xl mb-1">+</p>
            <p>클릭하거나 드래그하여 이미지 업로드</p>
            <p className="text-xs mt-1">JPG, PNG, WebP · 최대 5MB</p>
          </div>
        )}

        {progress !== null && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a1a2e] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{progress}%</p>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-red-400 hover:text-red-600"
        >
          이미지 제거
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
