import React, { useEffect, useState } from 'react';
import { useProject } from '../../hooks/useProject';
import { useOrg } from '../../hooks/useOrg';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectCreateModal from '../../components/projects/ProjectCreateModal';
import emptyStateImg from '../../assets/empty_state.png';

const ProjectListPage = () => {
  const { projects, loadProjects, isLoading } = useProject();
  const { activeOrg } = useOrg();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeOrg?._id) {
      loadProjects(activeOrg._id);
    }
  }, [activeOrg, loadProjects]);

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
          <p className="text-surface-400 mt-1 text-sm">Manage and track all your organization's projects.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          + New Project
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card skeleton h-48 w-full"></div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 px-6 bg-surface-800/50 rounded-2xl border border-surface-600 border-dashed flex flex-col items-center justify-center">
          <div className="w-48 h-36 mb-4 flex items-center justify-center">
            <img
              src={emptyStateImg}
              alt="No projects"
              className="w-full h-full object-contain mx-auto"
            />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
          <p className="text-surface-400 text-sm max-w-sm mb-6 leading-relaxed">
            Create your first project to organize tasks, plan sprints, and collaborate with your team.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      <ProjectCreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ProjectListPage;
