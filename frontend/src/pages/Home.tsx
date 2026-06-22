import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, statsApi } from '../api';
import ProjectCard from '../components/ui/ProjectCard';
import type { Project, VisitorStats } from '../types';

export default function Home() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    projectsApi.list().then(projects => setFeatured(projects.filter(p => p.is_featured).slice(0, 3)));
    statsApi.get().then(setStats).catch(() => {});
  }, []);

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-semibold tracking-widest text-[#e94560] uppercase mb-4">
          Welcome
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#1a1a2e] mb-6 leading-tight">
          안녕하세요,<br />임제민입니다.
        </h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          백엔드 개발자로, 견고하고 확장 가능한 시스템을 만드는 것을 좋아합니다.
          아이디어를 현실로 구현하는 것에 열정을 가지고 있습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/projects"
            className="px-8 py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors"
          >
            프로젝트 보기
          </Link>
          <Link
            to="/contact"
            className="px-8 py-3 border border-[#1a1a2e] text-[#1a1a2e] font-medium rounded hover:bg-gray-50 transition-colors"
          >
            연락하기
          </Link>
        </div>
        {stats && (
          <p className="text-xs text-gray-400 mt-8">
            오늘 방문자 {stats.today}명 · 누적 {stats.total}명
          </p>
        )}
      </section>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-gray-200" />
      </div>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">
                Works
              </p>
              <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">주요 프로젝트</h2>
            </div>
            <Link to="/projects" className="text-sm text-gray-500 hover:text-[#1a1a2e] transition-colors">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      <section className="bg-white border-y border-gray-200 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">Skills</p>
            <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">기술 스택</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { category: 'Backend', skills: ['Python', 'FastAPI', 'Node.js'] },
              { category: 'Database', skills: ['MySQL', 'PostgreSQL', 'Redis'] },
              { category: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind'] },
              { category: 'DevOps', skills: ['Docker', 'Git', 'Linux'] },
            ].map(({ category, skills }) => (
              <div key={category} className="text-center">
                <h3 className="font-semibold text-[#1a1a2e] mb-3">{category}</h3>
                <ul className="space-y-1">
                  {skills.map(s => (
                    <li key={s} className="text-sm text-gray-600">{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
