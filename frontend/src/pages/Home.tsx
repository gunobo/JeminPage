import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, statsApi, profileApi, organizationsApi, certificationsApi } from '../api';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useLang } from '../context/LanguageContext';
import type { Project, VisitorStats, Profile, Organization, Certification } from '../types';
import { normalizeSkill } from '../types';

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useScrollAnimation();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function SlideIn({ children, delay = 0, from = 'left', className = '' }: { children: React.ReactNode; delay?: number; from?: 'left' | 'right'; className?: string }) {
  const { ref, visible } = useScrollAnimation();
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : `translateX(${from === 'left' ? '-60px' : '60px'})`,
      transition: `opacity 0.9s ease ${delay}s, transform 0.9s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative bg-[#111] border border-white/10 max-w-lg w-full p-10 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-5 right-5 text-white/20 hover:text-white transition-colors text-lg">✕</button>
        {children}
      </div>
    </div>
  );
}

function GoalsSection({ goals }: { goals: import('../types').YearlyGoal[] }) {
  const { t } = useLang();
  const years = [...new Set(goals.map(g => g.year ?? 2026))].sort((a, b) => a - b);
  const currentYear = new Date().getFullYear();
  const [activeIdx, setActiveIdx] = useState(() => {
    const ci = years.indexOf(currentYear);
    return ci >= 0 ? ci : Math.floor(years.length / 2);
  });
  const dragStartX = useRef<number | null>(null);

  const prev = () => setActiveIdx(i => Math.max(0, i - 1));
  const next = () => setActiveIdx(i => Math.min(years.length - 1, i + 1));

  const getStyle = (i: number) => {
    const offset = i - activeIdx;
    const absOff = Math.abs(offset);
    if (absOff > 2) return { display: 'none' };
    const scale = absOff === 0 ? 1 : absOff === 1 ? 0.78 : 0.62;
    const translateX = offset * 72;
    const opacity = absOff === 0 ? 1 : absOff === 1 ? 0.5 : 0.2;
    const zIndex = 10 - absOff;
    return {
      transform: `translateX(${translateX}%) scale(${scale})`,
      opacity, zIndex,
      transition: 'transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.5s ease',
    };
  };

  return (
    <section className="border-t border-white/10 py-20 md:py-40 overflow-hidden">
      <FadeUp>
        <div className="px-6 md:px-16 max-w-7xl mx-auto mb-16">
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">{t('goalsYear')}</span>
          <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">{t('goals')}</h2>
        </div>
      </FadeUp>

      <div
        className="relative flex items-center justify-center select-none"
        style={{ height: '420px' }}
        onMouseDown={e => { dragStartX.current = e.clientX; }}
        onMouseUp={e => {
          if (dragStartX.current === null) return;
          const diff = dragStartX.current - e.clientX;
          if (diff > 40) next();
          else if (diff < -40) prev();
          dragStartX.current = null;
        }}
        onTouchStart={e => { dragStartX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (dragStartX.current === null) return;
          const diff = dragStartX.current - e.changedTouches[0].clientX;
          if (diff > 40) next();
          else if (diff < -40) prev();
          dragStartX.current = null;
        }}
      >
        {years.map((year, i) => {
          const yearGoals = goals.filter(g => (g.year ?? 2026) === year);
          const done = yearGoals.filter(g => g.done).length;
          const pct = yearGoals.length > 0 ? Math.round((done / yearGoals.length) * 100) : 0;
          const isActive = i === activeIdx;
          const style = getStyle(i);
          if (style.display === 'none') return null;
          return (
            <div
              key={year}
              onClick={() => setActiveIdx(i)}
              className="absolute flex flex-col gap-5 border p-8 cursor-pointer"
              style={{
                width: 'min(340px, 85vw)', minHeight: '360px',
                borderColor: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)',
                background: isActive ? 'rgba(255,255,255,0.04)' : '#0a0a0a',
                ...style,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-5xl tracking-tighter">{year}</span>
                {year === currentYear && <span className="text-[10px] font-black uppercase tracking-widest text-white/30 border border-white/10 px-2 py-1">Now</span>}
              </div>
              <div className="h-px bg-white/10 w-full overflow-hidden">
                <div className="h-full bg-white/40 transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
              <div className="space-y-3 flex-1">
                {yearGoals.map((goal, gi) => (
                  <div key={gi} className={`flex items-start gap-3 ${goal.done ? 'opacity-30' : ''}`}>
                    <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-white/30 shrink-0" />
                    <span className={`text-sm leading-relaxed ${goal.done ? 'line-through text-white/30' : 'text-white/70'}`}>{goal.text}</span>
                  </div>
                ))}
              </div>
              <div className="text-[11px] font-black text-white/30 uppercase tracking-widest">{done}/{yearGoals.length} · {pct}%</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-6 mt-8">
        <button onClick={prev} disabled={activeIdx === 0}
          className="text-white/30 hover:text-white disabled:opacity-10 transition-colors text-xl px-2">←</button>
        <div className="flex gap-2">
          {years.map((_, i) => (
            <button key={i} onClick={() => setActiveIdx(i)} className="transition-all duration-300"
              style={{ width: i === activeIdx ? '24px' : '6px', height: '6px', borderRadius: '3px', background: i === activeIdx ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
        <button onClick={next} disabled={activeIdx === years.length - 1}
          className="text-white/30 hover:text-white disabled:opacity-10 transition-colors text-xl px-2">→</button>
      </div>
    </section>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const { t } = useLang();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [count, setCount] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // 모달 상태
  const [selectedSkillGroup, setSelectedSkillGroup] = useState<import('../types').SkillGroup | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  // Process 확장
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => {});
    organizationsApi.list().then(setOrgs).catch(() => {});
    certificationsApi.list().then(setCerts).catch(() => {});
    projectsApi.list().then(p => setFeatured(p.filter(x => x.is_featured).slice(0, 4)));
    if (!localStorage.getItem('visited')) {
      statsApi.visit();
      localStorage.setItem('visited', '1');
    }
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

  const processItems = [
    { num: '01', title: 'Research', desc: t('researchDesc') },
    { num: '02', title: 'Design', desc: t('designDesc') },
    { num: '03', title: 'Develop', desc: t('developDesc') },
    { num: '04', title: 'Deploy', desc: t('deployDesc') },
  ];

  return (
    <main className="bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-between px-6 md:px-16 pt-20 md:pt-24 pb-8 md:pb-12 overflow-hidden">
        <div className="pointer-events-none fixed w-[800px] h-[800px] rounded-full opacity-[0.06] blur-3xl z-0"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
            left: mousePos.x - 400, top: mousePos.y - 400,
            transition: 'left 0.4s ease, top 0.4s ease',
          }} />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            transform: `translateY(${scrollY * 0.2}px)`,
          }} />

        <div className="relative flex justify-between items-start max-w-7xl mx-auto w-full gap-4">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-white/30 uppercase shrink-0">Portfolio 2026</span>
          {profile?.tagline && (
            <span className="text-[11px] md:text-sm font-semibold tracking-widest text-white/50 uppercase text-right line-clamp-2">{profile.tagline}</span>
          )}
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="flex items-start justify-between gap-6">
            <h1 className="font-black leading-[0.85] tracking-tighter uppercase"
              style={{ fontSize: 'clamp(80px, 14vw, 200px)', transform: `translateY(${scrollY * 0.15}px)` }}>
              {profile?.name
                ? profile.name.split(' ').map((w, i) => <span key={i} className="block">{w}</span>)
                : <><span className="block">Im</span><span className="block text-white/10">Jemin</span></>}
            </h1>
            {profile?.avatar_url && (
              <div className="shrink-0 mt-2" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
                <img
                  src={profile.avatar_url}
                  alt="profile"
                  className="rounded-full object-cover ring-1 ring-white/10"
                  style={{ width: 'clamp(100px, 14vw, 220px)', height: 'clamp(100px, 14vw, 220px)' }}
                />
              </div>
            )}
          </div>
          <div className="mt-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-white/50 text-base md:text-lg max-w-sm leading-relaxed">
              {profile?.bio || '개발자이자 디자이너로서\n창의적인 디지털 경험을 만듭니다.'}
            </p>
            <div className="flex gap-6 items-center flex-wrap">
              <Link to="/projects"
                className="group flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-white border border-white/20 px-7 py-4 hover:bg-white hover:text-black transition-all duration-300">
                Projects <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              {profile?.cv_url && (
                <a href={profile.cv_url} download target="_blank" rel="noreferrer"
                  className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">CV ↓</a>
              )}
              <Link to="/contact"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>

        <div className="relative flex justify-between items-end text-[11px] text-white/20 tracking-widest uppercase max-w-7xl mx-auto w-full">
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
          {Array(3).fill(
            (profile?.marquee_items?.length ? profile.marquee_items : ['Development', 'Design', 'React', 'FastAPI', 'Docker', 'Portfolio', 'Creative'])
          ).flat().map((t, i) => (
            <span key={i} className="text-xs font-black uppercase tracking-[0.3em] text-white/25 shrink-0">
              {t} <span className="text-white/10 mx-4">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── ABOUT ── */}
      <section className="px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <SlideIn from="left">
            <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">About</span>
            <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-4 leading-none">
              Who<br /><span className="text-white/20">I Am</span>
            </h2>
          </SlideIn>
          <SlideIn from="right" delay={0.15}>
            <p className="text-white/60 text-lg leading-relaxed mb-8">
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
        <section className="px-6 md:px-16 pb-20 md:pb-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-16 border-t border-white/10 pt-12">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">Selected Projects</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Projects</h2>
              </div>
              <Link to="/projects" className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors">
                All Projects →
              </Link>
            </div>
          </FadeUp>

          <div className="space-y-px bg-white/5">
            {featured.map((project, i) => (
              <FadeUp key={project.id} delay={i * 0.1}>
                <div className="group bg-[#0a0a0a] grid grid-cols-1 md:grid-cols-[2fr_3fr] overflow-hidden">
                  <div className="flex items-center justify-center p-6 md:p-8 bg-white/[0.02] h-64 md:h-80">
                    {project.thumbnail_url ? (
                      <div className="w-full rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10 transition-all duration-500 group-hover:shadow-white/10 group-hover:ring-white/20 group-hover:-translate-y-1">
                        <div className="flex items-center gap-1.5 px-3 h-7 bg-[#1a1a1a] border-b border-white/10 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                          <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                          <div className="flex-1 mx-2 h-3.5 rounded bg-white/5 text-[9px] text-white/20 flex items-center px-2 truncate">
                            {project.demo_url || 'imjemin.co.kr'}
                          </div>
                        </div>
                        <img src={project.thumbnail_url} alt={project.title}
                          className="w-full object-cover transition-all duration-500 grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100" />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-white/[0.03] flex items-center justify-center rounded-lg ring-1 ring-white/10">
                        <span className="font-black text-[100px] text-white/5">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between mb-6">
                        <span className="text-[11px] font-semibold tracking-widest text-white/30">{String(i + 1).padStart(2, '0')}</span>
                        {project.is_featured && <span className="text-[11px] font-semibold tracking-widest text-white/30 uppercase border border-white/10 px-3 py-1">Featured</span>}
                      </div>
                      <h3 className="font-black text-3xl md:text-4xl tracking-tight mb-4 group-hover:text-white/80 transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-white/50 leading-relaxed mb-8 line-clamp-3">{project.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {project.tech_stack.slice(0, 5).map(tech => (
                          <span key={tech} className="text-[11px] px-3 py-1 border border-white/10 text-white/40">{tech}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-6 mt-8 pt-6 border-t border-white/10">
                      {project.github_url && (
                        <a href={project.github_url} target="_blank" rel="noreferrer"
                          className="text-[11px] font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">GitHub ↗</a>
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
        <section className="border-t border-white/10 px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">Expertise</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Skills</h2>
              </div>
            </div>
            <p className="text-white/30 text-sm mb-16">카테고리를 클릭하면 자세한 내용을 볼 수 있어요.</p>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
            {profile.skill_groups.map(({ category, skills }, i) => (
              <FadeUp key={category} delay={i * 0.1}>
                <button
                  onClick={() => setSelectedSkillGroup({ category, skills })}
                  className="bg-[#0a0a0a] p-10 h-full w-full text-left hover:bg-white/[0.05] transition-colors group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-8">
                    <h3 className="text-sm font-black tracking-[0.15em] text-white/50 uppercase group-hover:text-white/80 transition-colors">{category}</h3>
                    <span className="text-white/20 group-hover:text-white/60 transition-colors text-xs mt-0.5">↗</span>
                  </div>
                  <ul className="space-y-3">
                    {skills.slice(0, 5).map((s, j) => {
                      const item = normalizeSkill(s);
                      return (
                        <li key={j} className="flex items-center gap-3 text-sm text-white/60 font-medium">
                          <span className="w-1 h-1 bg-white/30 rounded-full shrink-0" />
                          {item.name}
                        </li>
                      );
                    })}
                    {skills.length > 5 && (
                      <li className="text-[11px] text-white/25 uppercase tracking-widest pl-4">+{skills.length - 5}개 더보기</li>
                    )}
                  </ul>
                </button>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── ORGANIZATIONS ── */}
      {orgs.length > 0 && (
        <section className="border-t border-white/10 px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-6">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">Activities</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Organizations</h2>
              </div>
            </div>
            <p className="text-white/30 text-sm mb-16">항목을 클릭하면 자세한 내용을 볼 수 있어요.</p>
          </FadeUp>
          <div className="space-y-px bg-white/5">
            {orgs.map((org, i) => (
              <FadeUp key={org.id} delay={i * 0.08}>
                <button
                  onClick={() => setSelectedOrg(org)}
                  className="group bg-[#0a0a0a] flex items-center gap-6 md:gap-10 px-8 py-7 hover:bg-white/[0.04] transition-colors w-full text-left cursor-pointer"
                >
                  <img
                    src={org.logo_url || '/favicon.svg'}
                    alt={org.name}
                    className={`w-12 h-12 rounded opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ${org.logo_url ? 'object-cover' : 'object-contain p-1'}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                      <div>
                        <h3 className="font-black text-lg md:text-xl tracking-tight text-white/70 group-hover:text-white transition-colors">
                          {org.name}
                        </h3>
                        {org.institution && (
                          <p className="text-[11px] font-semibold tracking-widest text-white/25 uppercase mt-0.5">{org.institution}</p>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold tracking-widest text-white/25 uppercase shrink-0">{org.period}</span>
                    </div>
                    {org.role && (
                      <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mt-1">{org.role}</p>
                    )}
                  </div>
                  <span className="text-white/20 group-hover:text-white/60 transition-colors shrink-0 text-lg">↗</span>
                </button>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── CERTIFICATIONS ── */}
      {certs.length > 0 && (
        <section className="border-t border-white/10 px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto">
          <FadeUp>
            <div className="flex items-end justify-between mb-20">
              <div>
                <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">Qualifications</span>
                <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2">Certifications</h2>
              </div>
            </div>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
            {certs.map((cert, i) => (
              <FadeUp key={cert.id} delay={i * 0.07}>
                <div className="group bg-[#0a0a0a] p-8 h-full hover:bg-white/[0.03] transition-colors">
                  <div className="flex flex-col h-full">
                    <p className="text-[11px] font-semibold tracking-[0.25em] text-white/30 uppercase mb-4">
                      {cert.acquired_date
                        ? new Date(cert.acquired_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
                        : '—'}
                    </p>
                    <h3 className="font-black text-xl tracking-tight text-white/80 group-hover:text-white transition-colors flex-1">
                      {cert.name}
                    </h3>
                    {cert.issuer && (
                      <p className="text-sm text-white/40 mt-3">{cert.issuer}</p>
                    )}
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-white/30 hover:text-white transition-colors self-start">
                        확인 ↗
                      </a>
                    )}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── PROCESS ── */}
      <section className="border-t border-white/10 px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">How I Work</span>
          <h2 className="font-black text-5xl md:text-7xl tracking-tighter mt-2 mb-20">Process</h2>
        </FadeUp>
        <div className="space-y-px bg-white/5">
          {processItems.map(({ num, title, desc }, i) => {
            const isOpen = expandedProcess === i;
            return (
              <SlideIn key={num} from="left" delay={i * 0.1}>
                <div
                  className="group bg-[#0a0a0a] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setExpandedProcess(isOpen ? null : i)}
                >
                  <div className="flex items-center gap-4 md:gap-12 p-6 md:p-10">
                    <span className="font-black text-3xl md:text-5xl text-white/10 group-hover:text-white/30 transition-colors shrink-0 w-10 md:w-16">{num}</span>
                    <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
                      <h3 className="font-black text-xl md:text-3xl tracking-tight group-hover:text-white transition-colors">{title}</h3>
                      {!isOpen && <p className="text-white/40 text-sm max-w-sm hidden md:block">{desc}</p>}
                    </div>
                    <span
                      className="text-white/30 group-hover:text-white transition-all duration-300 text-lg shrink-0"
                      style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                    >→</span>
                  </div>
                  {isOpen && (
                    <div className="px-6 md:px-10 pb-6 md:pb-10 pl-[calc(2.5rem+1rem)] md:pl-[calc(4rem+3rem)]">
                      <p className="text-white/60 text-sm md:text-base leading-relaxed border-l border-white/10 pl-4 md:pl-6">{desc}</p>
                    </div>
                  )}
                </div>
              </SlideIn>
            );
          })}
        </div>
      </section>

      {/* ── GOALS ── */}
      {profile?.yearly_goals && profile.yearly_goals.length > 0 && (
        <GoalsSection goals={profile.yearly_goals} />
      )}

      {/* ── CTA ── */}
      <section className="border-t border-white/10 px-6 md:px-16 py-20 md:py-40 max-w-7xl mx-auto text-center">
        <FadeUp>
          <span className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase">Let's Talk</span>
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

      {/* ── SKILL MODAL ── */}
      {selectedSkillGroup && (
        <Modal onClose={() => setSelectedSkillGroup(null)}>
          <p className="text-[11px] font-semibold tracking-[0.3em] text-white/30 uppercase mb-2">Expertise</p>
          <h2 className="font-black text-3xl tracking-tight mb-8">{selectedSkillGroup.category}</h2>
          <div className="space-y-2">
            {selectedSkillGroup.skills.map((s, i) => {
              const item = normalizeSkill(s);
              return (
                <div key={i} className="py-4 border-b border-white/5">
                  <div className="flex items-center gap-4 mb-1">
                    <span className="text-[11px] font-black text-white/20 w-6 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-white/90 font-semibold">{item.name}</span>
                  </div>
                  {item.desc && (
                    <p className="text-white/40 text-sm leading-relaxed pl-10">{item.desc}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* ── ORG MODAL ── */}
      {selectedOrg && (
        <Modal onClose={() => setSelectedOrg(null)}>
          <div className="flex items-center gap-5 mb-8">
            <img
              src={selectedOrg.logo_url || '/favicon.svg'}
              alt={selectedOrg.name}
              className={`w-16 h-16 rounded ${selectedOrg.logo_url ? 'object-cover' : 'object-contain p-2 bg-white/5'}`}
            />
            <div>
              <h2 className="font-black text-2xl tracking-tight">{selectedOrg.name}</h2>
              {selectedOrg.institution && (
                <p className="text-[11px] font-semibold tracking-widest text-white/30 uppercase mt-1">{selectedOrg.institution}</p>
              )}
            </div>
          </div>
          <div className="space-y-5">
            {selectedOrg.role && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-white/25 uppercase mb-1">Role</p>
                <p className="text-white/70 font-medium">{selectedOrg.role}</p>
              </div>
            )}
            {selectedOrg.period && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-white/25 uppercase mb-1">Period</p>
                <p className="text-white/70 font-medium">{selectedOrg.period}</p>
              </div>
            )}
            {selectedOrg.description && (
              <div>
                <p className="text-[11px] font-semibold tracking-widest text-white/25 uppercase mb-2">Description</p>
                <p className="text-white/60 leading-relaxed">{selectedOrg.description}</p>
              </div>
            )}
            {selectedOrg.link_url && (
              <a href={selectedOrg.link_url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-xs font-black uppercase tracking-widest text-white border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all">
                방문하기 ↗
              </a>
            )}
          </div>
        </Modal>
      )}

    </main>
  );
}
