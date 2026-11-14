import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { projectsApi, awardsApi, profileApi } from '../api';
import { useLang } from '../context/LanguageContext';
import type { Award, Project } from '../types';

/** "## 제목" 단위로 트러블슈팅 항목 분리 */
function parseTroubleshooting(text?: string | null): { title: string; body: string }[] {
  if (!text?.trim()) return [];
  const items: { title: string; body: string }[] = [];
  let title: string | null = null;
  let body: string[] = [];
  const flush = () => {
    if (title !== null || body.some(l => l.trim())) items.push({ title: title ?? '트러블슈팅', body: body.join('\n').trim() });
  };
  for (const line of text.split('\n')) {
    const m = /^##\s+(.+)$/.exec(line);
    if (m) { flush(); title = m[1].trim(); body = []; }
    else body.push(line);
  }
  flush();
  return items;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20 mb-4">{children}</p>;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    projectsApi.get(Number(id))
      .then(setProject)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    awardsApi.list().then(list => setAwards(list.filter(a => a.project_id === Number(id)))).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!project) return;
    const prev = document.title;
    profileApi.get()
      .then(p => { document.title = `${project.title} — ${p.name || '임제민'}`; })
      .catch(() => { document.title = `${project.title} — 임제민`; });
    return () => { document.title = prev; };
  }, [project]);

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

  const meta = ([['Period', project.period], ['Team', project.team], ['Role', project.role]] as const)
    .filter(([, v]) => v && v.trim());
  const troubles = parseTroubleshooting(project.troubleshooting);
  const results = (project.results ?? []).filter(r => r.trim());

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
        <button onClick={() => navigate(-1)}
          className="group flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/20 hover:text-white transition-colors mb-12">
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          {t('back')}
        </button>

        {/* Title */}
        <div className="border-b border-white/10 pb-12 mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {project.is_featured && (
              <span className="text-[11px] font-semibold uppercase tracking-widest border border-white/10 px-3 py-1 text-white/30">
                {t('featured')}
              </span>
            )}
            {awards.map(a => (
              <span key={a.id} title={a.competition}
                className="text-[11px] font-semibold tracking-widest border border-amber-300/30 bg-amber-300/5 px-3 py-1 text-amber-200/80">
                🏆 {a.title}
              </span>
            ))}
            <span className="text-[11px] text-white/20">
              {new Date(project.created_at).toLocaleDateString('ko-KR')}
            </span>
          </div>
          <h1 className="font-black text-5xl md:text-7xl tracking-tighter leading-none break-keep">{project.title}</h1>

          {meta.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/5 mt-10">
              {meta.map(([label, value]) => (
                <div key={label} className="bg-[#0a0a0a] py-4 sm:pr-6">
                  <dt className="text-[11px] font-semibold uppercase tracking-widest text-white/20 mb-1">{label}</dt>
                  <dd className="text-white/70 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-16">
          <div className="space-y-14 min-w-0">
            <p className="text-white/50 text-lg leading-relaxed whitespace-pre-line">{project.description}</p>

            {project.problem?.trim() && (
              <section>
                <SectionLabel>Problem</SectionLabel>
                <p className="text-white/60 leading-relaxed whitespace-pre-line border-l border-white/10 pl-5">{project.problem}</p>
              </section>
            )}

            {troubles.length > 0 && (
              <section>
                <SectionLabel>Troubleshooting</SectionLabel>
                <div className="space-y-px bg-white/5">
                  {troubles.map((item, i) => (
                    <details key={i} open={i === 0} className="group bg-[#0a0a0a]">
                      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 pr-1 [&::-webkit-details-marker]:hidden">
                        <span className="font-bold text-white/80 group-open:text-white">{item.title}</span>
                        <span className="text-white/30 transition-transform group-open:rotate-90 shrink-0">→</span>
                      </summary>
                      {item.body && (
                        <p className="pb-6 text-sm text-white/50 leading-relaxed whitespace-pre-line font-mono">{item.body}</p>
                      )}
                    </details>
                  ))}
                </div>
              </section>
            )}

            {results.length > 0 && (
              <section>
                <SectionLabel>Results</SectionLabel>
                <ul className="space-y-3">
                  {results.map((r, i) => (
                    <li key={i} className="flex gap-3 text-white/70">
                      <span className="mt-2.5 w-1 h-1 rounded-full bg-white/40 shrink-0" />
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="space-y-8">
            {/* Tech stack */}
            <div>
              <SectionLabel>{t('techStack')}</SectionLabel>
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
