import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi, statsApi, profileApi } from '../api';
import ProjectCard from '../components/ui/ProjectCard';
import type { Project, VisitorStats, Profile } from '../types';

export default function Home() {
  const [featured, setFeatured] = useState<Project[]>([]);
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    profileApi.get().then(setProfile).catch(() => {});
    projectsApi.list().then(p => setFeatured(p.filter(x => x.is_featured).slice(0, 3)));
    statsApi.get().then(setStats).catch(() => {});
  }, []);

  return (
    <main className="pt-16">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        {profile?.avatar_url && (
          <img
            src={profile.avatar_url}
            alt={profile.name}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-6 border-4 border-white shadow"
          />
        )}
        <p className="text-sm font-semibold tracking-widest text-[#e94560] uppercase mb-4">
          Welcome
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold text-[#1a1a2e] mb-4 leading-tight">
          {profile?.name ? `안녕하세요,\n${profile.name}입니다.` : '안녕하세요!'}
        </h1>
        {profile?.tagline && (
          <p className="text-xl text-gray-500 mb-4">{profile.tagline}</p>
        )}
        <p className="text-gray-600 text-lg max-w-xl mx-auto mb-10 leading-relaxed whitespace-pre-line">
          {profile?.bio || ''}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/projects" className="px-8 py-3 bg-[#1a1a2e] text-white font-medium rounded hover:bg-[#0f3460] transition-colors">
            프로젝트 보기
          </Link>
          <Link to="/contact" className="px-8 py-3 border border-[#1a1a2e] text-[#1a1a2e] font-medium rounded hover:bg-gray-50 transition-colors">
            연락하기
          </Link>
          {profile?.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
              className="px-8 py-3 border border-[#e94560] text-[#e94560] font-medium rounded hover:bg-red-50 transition-colors">
              포트폴리오 →
            </a>
          )}
        </div>
        {stats && (
          <p className="text-xs text-gray-400 mt-10">
            오늘 방문자 {stats.today}명 · 누적 {stats.total}명
          </p>
        )}
      </section>

      <div className="max-w-5xl mx-auto px-6">
        <hr className="border-gray-200" />
      </div>

      {/* Featured Projects */}
      {featured.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">Works</p>
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
      {profile?.skill_groups && profile.skill_groups.length > 0 && (
        <section className="bg-white border-y border-gray-200 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">Skills</p>
              <h2 className="font-serif text-3xl font-bold text-[#1a1a2e]">기술 스택</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {profile.skill_groups.map(({ category, skills }) => (
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
      )}
    </main>
  );
}
