import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, statsApi, profileApi } from '../api';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import type { Project, VisitorStats, Profile } from '../types';

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0, from = 'left', className = '' }: { children: React.ReactNode; delay?: number; from?: 'left' | 'right'; className?: string }) {
  const { ref, visible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : `translateX(${from === 'left' ? '-60px' : '60px'})`,
        transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [count, setCount] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => {});
    projectsApi.list().then(p => setFeatured(p.filter(x => x.is_featured).slice(0, 4)));
    statsApi.visit();
    statsApi.get().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Counter animation for stats
  useEffect(() => {
    if (!stats) return;
    const target = stats.total;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      setCount(prev => {
        if (prev >= target) { clearInterval(timer); return target; }
        return prev + step;
      });
    }, 16);
    return () => clearInterval(timer);
  }, [stats]);

  return (
    <main className="bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-between px-6 md:px-16 pt-24 pb-12 overflow-hidden">
        {/* Cursor glow */}
        <div
          className="pointer-events-none fixed w-[800px] h-[800px] rounded-full opacity-[0.06] blur-3xl z-0"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
            left: mousePos.x - 400,
            top: mousePos.y - 400,
            transition: 'left 0.4s ease, top 0.4s ease',
          }}
        />

        {/* Parallax grid bg */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            transform: `translateY(${scrollY * 0.2}px)`,
          }}
        />

        {/* Top meta */}
        <div className="relative flex justify-between items-start text-[11px] font-semibold tracking-[0.25em] text-white/20 uppercase max-w-7xl mx-auto w-full">
          <span>Portfolio 2026</span>
          <span>{profile?.tagline || 'Developer & Designer'}</span>
        </div>

        {/* Big title */}
        <div className="relative max-w-7xl mx-auto w-full">
          <p
            className="text-[11px] font-semibold tracking-[0.35em] text-white/30 uppercase mb-6"
            style={{ opacity: 1, transform: `translateY(${-scrollY * 0.1}px)` }}
          >
            ✦ {profile?.name || 'imjemin'}
          </p>
          <h1
            className="font-black leading-[0.85] tracking-tighter uppercase"
            style={{
              fontSize: 'clamp(80px, 14vw, 200px)',
              transform: `translateY(${scrollY * 0.15}px)`,
            }}
          >
            {profile?.name
              ? profile.name.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)
              : <><span className="block">Im</span><span className="block text-white/10">Jemin</span></>
            }
          </h1>
          <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-white/40 text-base md:text-lg max-w-sm leading-relaxed">
              {profile?.bio || '개발자이자 디자이너로서\n창의적인 디지털 경험을 만듭니다.'}
            </p>
            <div className="flex gap-6 items-center flex-wrap">
              <Link to="/projects"
                className="group flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-white border border-white/20 px-7 py-4 hover:bg-white hover:text-black transition-all duration-300">
                Projects <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a href="/cv.pdf" download
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors">
                CV ↓
              </a>
              <Link to="/contact"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative flex justify-between items-end text-[11px] text-white/15 tracking-widest uppercase max-w-7xl mx-auto w-full">
          {stats && <span>Visitors — {count.toLocaleString()}</span>}
          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-12 bg-white/20 animate-pulse" />
            <span>Scroll</span>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="border-y border-white/10 py-5 overflow-hidden">
        <div className="flex gap-12 animate-[marquee_20s_linear_infinite] whitespace-nowrap">
          {Array(3).fill(['Development', 'Design', 'React', 'FastAPI', 'Docker', 'Portfolio', 'Creative']).flat().map((t, i) => (
            <span key={i} className="text-xs font-black uppercase tracking-[0.3em] text-white/20 shrink-0">
              {t} <span className="text-white/10 mx-4">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section className="px-6 md:px-16 py-40 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <SlideIn from="left">
            <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">About</span>
            <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-4 leading-none">
              Who<br /><span className="text-white/20">I Am</span>
            </h2>
          </SlideIn>
          <SlideIn from="right" delay={0.15}>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              {profile?.bio || '안녕하세요! 저는 임제민입니다. 개발과 디자인을 모두 아우르는 풀스택 개발자로서, 사용자 경험을 최우선으로 생각합니다.'}
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Projects', value: `${featured.length}+` },
                { label: 'Visitors', value: `${stats?.total ?? 0}+` },
              ].map(({ label, value }) => (
                <div key={label} className="border border-white/10 p-6">
                  <p className="font-black text-4xl">{value}</p>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </SlideIn>
        </div>
      </section>

      {/* ── FEATURED PROJECTS ── */}
      {featured.length > 0 && (
        <section className="px-6 md:px-16 pb-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-16 border-t border-white/10 pt-12">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Selected Projects</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Projects</h2>
              </div>
              <Link to="/projects" className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/30 hover:text-white transition-colors">
                All Projects →
              </Link>
            </div>
          </FadeUp>

          <div className="space-y-px bg-white/5">
            {featured.map((project, i) => (
              <FadeUp key={project.id} delay={i * 0.1}>
                <div className="group bg-[#0a0a0a] grid grid-cols-1 md:grid-cols-[2fr_3fr] overflow-hidden">
                  <div className="overflow-hidden h-64 md:h-80">
                    {project.thumbnail_url ? (
                      <img src={project.thumbnail_url} alt={project.title}
                        className="w-full h-full object-cover opacity-50 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700" />
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                        <span className="font-black text-[100px] text-white/5">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between mb-6">
                        <span className="text-[11px] font-semibold tracking-widest text-white/20">{String(i + 1).padStart(2, '0')}</span>
                        {project.is_featured && <span className="text-[11px] font-semibold tracking-widest text-white/20 uppercase border border-white/10 px-3 py-1">Featured</span>}
                      </div>
                      <h3 className="font-black text-3xl md:text-4xl tracking-tight mb-4 group-hover:text-white/80 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-white/30 leading-relaxed mb-8 line-clamp-3">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.slice(0, 5).map(tech => (
                          <span key={tech} className="text-[11px] px-3 py-1 border border-white/10 text-white/25">{tech}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-6 mt-8 pt-6 border-t border-white/10">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noreferrer"
                          className="text-[11px] font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors">GitHub ↗</a>
                      )}
                      {project.demo_url && (
                        <a href={project.demo_url} target="_blank" rel="noreferrer"
                          className="text-[11px] font-semibold uppercase tracking-widest text-white hover:text-white/50 transition-colors">Live ↗</a>
                      )}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── SKILLS ── */}
      {profile?.skill_groups && profile.skill_groups.length > 0 && (
        <section className="border-t border-white/10 px-6 md:px-16 py-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-20">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Expertise</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Skills</h2>
              </div>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {profile.skill_groups.map(({ category, skills }, i) => (
              <FadeUp key={category} delay={i * 0.1}>
                <div className="bg-[#0a0a0a] p-10 h-full hover:bg-white/[0.03] transition-colors">
                  <h3 className="text-[11px] font-semibold tracking-[0.25em] text-white/20 uppercase mb-8">{category}</h3>
                  <ul className="space-y-4">
                    {skills.map((s, j) => (
                      <li key={s} className="flex items-center gap-3 text-sm text-white/60 font-medium"
                        style={{ transitionDelay: `${j * 0.05}s` }}>
                        <span className="w-1 h-1 bg-white/20 rounded-full shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── PROCESS ── */}
      <section className="border-t border-white/10 px-6 md:px-16 py-40 max-w-7xl mx-auto">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">How I Work</span>
          <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2 mb-20">Process</h2>
        </FadeUp>
        <div className="space-y-px bg-white/5">
          {[
            { num: '01', title: 'Research', desc: '문제를 정의하고 사용자 요구사항을 분석합니다.' },
            { num: '02', title: 'Design', desc: 'UI/UX 설계와 프로토타이핑을 통해 최적의 경험을 설계합니다.' },
            { num: '03', title: 'Develop', desc: '최신 기술 스택으로 안정적이고 빠른 서비스를 구현합니다.' },
            { num: '04', title: 'Deploy', desc: 'Docker와 클라우드 인프라로 안정적인 배포와 운영을 합니다.' },
          ].map(({ num, title, desc }, i) => (
            <SlideIn key={num} from="left" delay={i * 0.1}>
              <div className="group bg-[#0a0a0a] flex items-center gap-12 p-10 hover:bg-white/[0.02] transition-colors cursor-default">
                <span className="font-black text-5xl text-white/10 group-hover:text-white/20 transition-colors shrink-0 w-16">{num}</span>
                <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <h3 className="font-black text-2xl md:text-3xl tracking-tight group-hover:translate-x-2 transition-transform">{title}</h3>
                  <p className="text-white/30 text-sm max-w-sm">{desc}</p>
                </div>
                <span className="text-white/10 group-hover:text-white/40 transition-colors text-xl">→</span>
              </div>
            </SlideIn>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/10 px-6 md:px-16 py-40 max-w-7xl mx-auto text-center">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/20 uppercase">Let's Talk</span>
          <h2 className="font-black tracking-tighter mt-4 mb-12 leading-none"
            style={{ fontSize: 'clamp(60px, 9vw, 140px)' }}>
            Work<br />Together?
          </h2>
          <Link to="/contact"
            className="inline-flex items-center gap-4 text-xs font-black uppercase tracking-[0.2em] text-black bg-white px-12 py-6 hover:bg-white/80 transition-colors">
            Get In Touch →
          </Link>
        </FadeUp>
      </section>
    </main>
  );
}
