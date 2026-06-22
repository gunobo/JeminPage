import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, statsApi, profileApi } from '../api';
import type { Project, VisitorStats, Profile } from '../types';

export default function Home() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => {});
    projectsApi.list().then(p => setFeatured(p.filter(x => x.is_featured).slice(0, 4)));
    statsApi.get().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Hero - Fullscreen */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col justify-between px-6 md:px-12 pt-24 pb-12 overflow-hidden">
        {/* Cursor glow */}
        <div
          className="pointer-events-none fixed w-[600px] h-[600px] rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #ffffff 0%, transparent 70%)',
            left: mousePos.x - 300,
            top: mousePos.y - 300,
            transition: 'left 0.3s ease, top 0.3s ease',
          }}
        />

        {/* Top row */}
        <div className="flex justify-between items-start text-xs font-semibold tracking-widest text-white/30 uppercase max-w-7xl mx-auto w-full">
          <span>Portfolio 2026</span>
          <span>{profile?.tagline || 'Developer & Designer'}</span>
        </div>

        {/* Main title */}
        <div className="max-w-7xl mx-auto w-full">
          <div className="overflow-hidden mb-4">
            <p className="text-xs font-semibold tracking-[0.3em] text-white/40 uppercase mb-8">
              ✦ {profile?.name || 'imjemin'}
            </p>
          </div>
          <h1 className="font-black text-[13vw] leading-[0.9] tracking-tighter uppercase text-white mix-blend-difference">
            {(profile?.name || 'Im\nJemin').split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h1>
          <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p className="text-white/50 text-lg max-w-md leading-relaxed">
              {profile?.bio || '개발자이자 디자이너로서\n창의적인 디지털 경험을 만듭니다.'}
            </p>
            <div className="flex gap-6 items-center">
              <Link
                to="/projects"
                className="group flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-white border border-white/20 px-6 py-3 hover:bg-white hover:text-black transition-all duration-300"
              >
                Works
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/contact"
                className="text-sm font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex justify-between items-end text-xs text-white/20 max-w-7xl mx-auto w-full">
          {stats && (
            <span>Visitors — {stats.total.toLocaleString()}</span>
          )}
          <span className="animate-bounce">↓ Scroll</span>
        </div>
      </section>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section className="px-6 md:px-12 pb-32 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 border-t border-white/10 pt-12">
            <div>
              <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Selected Works</span>
              <h2 className="font-black text-5xl md:text-6xl tracking-tighter mt-2">Projects</h2>
            </div>
            <Link to="/projects" className="text-xs font-semibold tracking-widest uppercase text-white/40 hover:text-white transition-colors">
              All Works →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
            {featured.map((project, i) => (
              <div key={project.id} className="group bg-[#0a0a0a] relative overflow-hidden">
                {project.thumbnail_url ? (
                  <div className="h-72 overflow-hidden">
                    <img
                      src={project.thumbnail_url}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                    />
                  </div>
                ) : (
                  <div className="h-72 bg-white/5 flex items-center justify-center">
                    <span className="text-8xl font-black text-white/10">{String(i + 1).padStart(2, '0')}</span>
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {project.is_featured && (
                      <span className="text-xs font-semibold tracking-widest text-white/30 uppercase">Featured</span>
                    )}
                  </div>
                  <h3 className="font-black text-2xl tracking-tight mb-3">{project.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed mb-6 line-clamp-2">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech_stack.slice(0, 4).map(tech => (
                      <span key={tech} className="text-xs px-3 py-1 border border-white/10 text-white/40">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-6">
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        GitHub ↗
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold uppercase tracking-widest text-white hover:text-white/60 transition-colors">
                        Live ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {profile?.skill_groups && profile.skill_groups.length > 0 && (
        <section className="border-t border-white/10 px-6 md:px-12 py-32 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16">
            <div>
              <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Expertise</span>
              <h2 className="font-black text-5xl md:text-6xl tracking-tighter mt-2">Skills</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
            {profile.skill_groups.map(({ category, skills }) => (
              <div key={category} className="bg-[#0a0a0a] p-8">
                <h3 className="text-xs font-semibold tracking-widest text-white/30 uppercase mb-6">{category}</h3>
                <ul className="space-y-3">
                  {skills.map(s => (
                    <li key={s} className="text-sm text-white/70 font-medium">{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="border-t border-white/10 px-6 md:px-12 py-32 max-w-7xl mx-auto text-center">
        <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Let's Talk</span>
        <h2 className="font-black text-[8vw] tracking-tighter mt-4 mb-12 leading-none">
          Work Together?
        </h2>
        <Link
          to="/contact"
          className="inline-flex items-center gap-4 text-sm font-semibold uppercase tracking-widest text-black bg-white px-10 py-5 hover:bg-white/80 transition-colors"
        >
          Get In Touch →
        </Link>
      </section>
    </main>
  );
}
