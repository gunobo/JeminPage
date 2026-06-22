import { useEffect, useState } from 'react';
import { projectsApi } from '../api';
import ProjectCard from '../components/ui/ProjectCard';
import type { Project } from '../types';

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.list()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="pt-16">
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2">Portfolio</p>
          <h1 className="font-serif text-4xl font-bold text-[#1a1a2e]">프로젝트</h1>
          <p className="text-gray-600 mt-4 max-w-md mx-auto">
            개발하면서 만든 프로젝트들을 소개합니다.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            아직 등록된 프로젝트가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
