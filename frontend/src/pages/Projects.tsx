import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api';
import { useLang } from '../context/LanguageContext';
import type { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    projectsApi.list().then(setProjects).finally(() => setLoading(false));
  }, []);

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      <div className="px-6 md:px-12 pt-32 pb-16 max-w-7xl mx-auto">
        <div className="border-b border-white/10 pb-12 mb-16">
          <span className="text-xs font-semibold tracking-[0.3em] text-white/30 uppercase">Portfolio</span>
          <h1 className="font-black text-[10vw] tracking-tighter leading-none mt-2">{t('projects')}</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-32 text-white/20 text-sm uppercase tracking-widest">No projects yet.</div>
        ) : (
          <div className="space-y-px bg-white/10">
            {projects.map((project, i) => (
              <div key={project.id} className="group bg-[#0a0a0a] grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-0">
                <div className="relative flex items-center justify-center overflow-hidden h-72 md:h-full min-h-[280px]">
                  {project.thumbnail_url ? (
                    <>
                      {/* 배경 블러 레이어 */}
                      <div className="absolute inset-0 scale-110"
                        style={{ backgroundImage: `url(${project.thumbnail_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(20px) brightness(0.2)' }} />
                      {/* 메인 이미지 */}
                      <div className="relative z-10 w-[80%] transition-all duration-500 ease-out"
                        style={{ transform: i % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)', filter: 'drop-shadow(0 25px 40px rgba(0,0,0,0.8))' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0deg) scale(1.04)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = i % 2 === 0 ? 'rotate(-2deg)' : 'rotate(2deg)')}>
                        <div className="relative rounded-sm overflow-hidden ring-1 ring-white/20">
                          <img
                            src={project.thumbnail_url}
                            alt={project.title}
                            className="w-full transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-70 group-hover:opacity-30 transition-opacity duration-500" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <span className="text-7xl font-black text-white/10">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                  )}
                </div>

                <div className="p-8 md:p-12 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xs font-semibold tracking-widest text-white/20 uppercase">{String(i + 1).padStart(2, '0')}</span>
                      {project.is_featured && (
                        <span className="text-xs font-semibold tracking-widest text-white/30 uppercase border border-white/10 px-3 py-1">{t('featured')}</span>
                      )}
                    </div>
                    <h2 className="font-black text-3xl md:text-4xl tracking-tight mb-4">{project.title}</h2>
                    <p className="text-white/40 leading-relaxed mb-8 line-clamp-3">{project.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack.map(tech => (
                        <span key={tech} className="text-xs px-3 py-1 border border-white/10 text-white/30">{tech}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-6 mt-8 pt-8 border-t border-white/10">
                    <Link to={`/projects/${project.id}`}
                      className="text-xs font-semibold uppercase tracking-widest text-white hover:text-white/60 transition-colors">
                      {t('viewProject')}
                    </Link>
                    {project.github_url && (
                      <a href={project.github_url} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        {t('github')} ↗
                      </a>
                    )}
                    {project.demo_url && (
                      <a href={project.demo_url} target="_blank" rel="noreferrer"
                        className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                        {t('live')} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
