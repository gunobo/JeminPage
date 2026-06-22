import { useEffect, useState } from 'react';

export default function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');
  const fullText = 'imjemin';

  useEffect(() => {
    // 로고 페이드인
    const t1 = setTimeout(() => setPhase('hold'), 300);
    // 페이드아웃 시작
    const t2 = setTimeout(() => setPhase('out'), 3200);
    // 완전히 끝
    const t3 = setTimeout(onDone, 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  // 타이핑 애니메이션
  useEffect(() => {
    if (phase !== 'hold') return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(timer);
    }, 80);
    return () => clearInterval(timer);
  }, [phase]);

  // 프로그레스 바
  useEffect(() => {
    if (phase !== 'hold') return;
    const duration = 2600;
    const interval = 16;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min((elapsed / duration) * 100, 100));
      if (elapsed >= duration) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [phase]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center"
      style={{
        opacity: phase === 'out' ? 0 : 1,
        transition: phase === 'out' ? 'opacity 0.7s ease' : 'none',
        pointerEvents: phase === 'out' ? 'none' : 'all',
      }}
    >
      {/* 배경 그리드 */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* 로고 */}
      <div
        style={{
          opacity: phase === 'in' ? 0 : 1,
          transform: phase === 'in' ? 'translateY(20px)' : 'translateY(0)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}
        className="flex flex-col items-center gap-8"
      >
        <img
          src="/favicon.svg"
          alt="logo"
          className="w-20 h-auto"
          style={{ opacity: 0.9 }}
        />

        {/* 타이핑 텍스트 */}
        <div className="h-6 flex items-center">
          <span className="font-black text-xl tracking-[0.3em] uppercase text-white/80">
            {text}
            <span
              className="inline-block w-0.5 h-5 bg-white/60 ml-0.5 align-middle"
              style={{ animation: 'blink 0.8s step-end infinite' }}
            />
          </span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-px bg-white/5">
          <div
            className="h-full bg-white/40 transition-none"
            style={{ width: `${progress}%`, transition: 'width 0.016s linear' }}
          />
        </div>
      </div>

      {/* 퍼센트 */}
      <div className="absolute bottom-4 right-6 text-[11px] font-semibold text-white/20 tracking-widest tabular-nums">
        {Math.round(progress).toString().padStart(3, '0')}
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
