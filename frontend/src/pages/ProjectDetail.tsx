import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { projectsApi } from '../api';
import { useLang } from '../context/LanguageContext';
import type { Project } from '../types';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (!id) return;
    projectsApi.get(Number(id))
      .then(setProject)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <main className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
    </main>
  );

  if (notFound || !project) return (
    <main className="bg-[#0a0a0a] min-h-screen flex flex-col items-center justify-center text-white gap-6">
      <p className="text-white/20 text-xs uppercase tracking-widest">404 — Not Found</p>
      <Link to="/projects" className="text-xs font-semibold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
        {t('back')}
      </Link>
    </main>
  );

  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen">
      {/* Hero image */}
      {project.thumbnail_url && (
        <div className="w-full h-[50vh] overflow-hidden">
          <img src={project.thumbnail_url} alt={project.title}
            className="w-full h-full object-cover opacity-50" />
        </div>
      )}

      <div className="px-6 md:px-16 max-w-5xl mx-auto py-16">
        {/* Back */}
        <Link to="/projects"
          className="text-[11px] font-semibold uppercase tracking-widest text-white/20 hover:text-white transition-colors mb-12 inline-block">
          {t('back')}
        </Link>

        {/* Title */}
        <div className="border-b border-white/10 pb-12 mb-12">
          <div className="flex items-center gap-4 mb-4">
            {project.is_featured && (
              <span className="text-[11px] font-semibold uppercase tracking-widest border border-white/10 px-3 py-1 text-white/30">
                {t('featured')}
              </span>
            )}
            <span className="text-[11px] text-white/20">
              {new Date(project.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <h1 className="font-black text-5xl md:text-7xl tracking-tighter leading-none">{project.title}</h1>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-16">
          <div>
            <p className="text-white/50 text-lg leading-relaxed">{project.description}</p>
          </div>

          <div className="space-y-8">
            {/* Tech stack */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20 mb-4">{t('techStack')}</p>
              <div className="flex flex-wrap gap-2">
                {project.tech_stack.map(tech => (
                  <span key={tech} className="text-xs px-3 py-1.5 border border-white/10 text-white/40">{tech}</span>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="space-y-3">
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between border border-white/10 px-5 py-4 hover:border-white/30 hover:text-white transition-colors group">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/40 group-hover:text-white">{t('github')}</span>
                  <span className="text-white/20">↗</span>
                </a>
              )}
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between bg-white px-5 py-4 hover:bg-white/80 transition-colors group">
                  <span className="text-xs font-black uppercase tracking-widest text-black">{t('live')}</span>
                  <span className="text-black">↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
