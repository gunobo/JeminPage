import type { Project } from '../../types';

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
      {project.thumbnail_url && (
        <div className="h-48 overflow-hidden">
          <img
            src={project.thumbnail_url}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        {project.is_featured && (
          <span className="text-xs font-semibold tracking-widest text-[#e94560] uppercase mb-2 block">
            Featured
          </span>
        )}
        <h3 className="font-serif text-xl font-bold text-[#1a1a2e] mb-2">{project.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">{project.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech_stack.map((tech) => (
            <span key={tech} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
              {tech}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noreferrer"
              className="text-sm font-medium text-[#1a1a2e] hover:text-[#e94560] transition-colors">
              GitHub →
            </a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noreferrer"
              className="text-sm font-medium text-[#e94560] hover:underline">
              Live Demo →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
