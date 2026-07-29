import React, { useEffect, useState } from 'react';
import { useProject } from '../../hooks/useProject';
import { useOrg } from '../../hooks/useOrg';
import ProjectCard from '../../components/projects/ProjectCard';
import ProjectCreateModal from '../../components/projects/ProjectCreateModal';

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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-surface-50">Projects</h1>
          <p className="text-surface-400 mt-1">Manage and track all your organization's projects.</p>
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
        <div className="text-center py-20 bg-surface-800/50 rounded-xl border border-surface-700 border-dashed">
          <h3 className="text-xl font-medium text-surface-200 mb-2">No projects yet</h3>
          <p className="text-surface-400 mb-6">Create your first project to get started.</p>
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
