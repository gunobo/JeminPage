import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCount(c => c - 1), 1000);
    const r = setTimeout(() => navigate('/'), 5000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [navigate]);

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen flex flex-col items-center justify-center px-6">
      <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase mb-6">Page Not Found</span>
      <h1 className="font-black tracking-tighter leading-none mb-6" style={{ fontSize: 'clamp(100px, 20vw, 260px)' }}>
        404
      </h1>
      <p className="text-white/30 text-sm mb-12">찾을 수 없는 페이지예요.</p>
      <div className="flex items-center gap-8">
        <Link to="/"
          className="text-xs font-black uppercase tracking-widest text-black bg-white px-8 py-4 hover:bg-white/80 transition-colors">
          홈으로 →
        </Link>
        <button onClick={() => navigate(-1)}
          className="text-xs font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors">
          ← 뒤로
        </button>
      </div>
      <p className="mt-12 text-[11px] text-white/15 tracking-widest">{count}초 후 자동으로 홈으로 이동</p>
    </main>
  );
}
