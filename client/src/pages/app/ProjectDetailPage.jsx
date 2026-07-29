import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useProject } from '../../hooks/useProject';
import { useTask } from '../../hooks/useTask';
import KanbanBoard from '../../components/kanban/KanbanBoard';
import SprintList from '../../components/sprints/SprintList';
import BugTracker from '../../components/bugs/BugTracker';
import api from '../../services/api';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { activeProject, loadProject, isLoading } = useProject();
  const { loadTasks } = useTask();
  const [activeTab, setActiveTab] = useState('board');

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
      loadTasks(projectId);
    }
  }, [projectId, loadProject, loadTasks]);

  if (isLoading || !activeProject) {
    return (
      <div className="p-6">
        <div className="skeleton h-20 w-full mb-6"></div>
        <div className="skeleton h-[600px] w-full"></div>
      </div>
    );
  }

  const { name, status, progress, members, deadline, description, tags } = activeProject;

  const handleDownloadReport = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Project_${name}_Report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Report download error:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-900">
      <div className="px-6 py-4 border-b border-surface-700 bg-surface-800 shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-3">
              {name}
              <span className="badge badge-blue text-xs font-normal">{status}</span>
            </h1>
            {deadline && (
              <p className="text-sm text-surface-400 mt-1">
                Deadline: {format(new Date(deadline), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-32">
              <div className="flex justify-between text-xs text-surface-300 mb-1">
                <span>Progress</span>
                <span>{progress || 0}%</span>
              </div>
              <div className="w-full bg-surface-700 rounded-full h-1.5">
                <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${progress || 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 border-b border-surface-700">
          {['overview', 'board', 'sprints', 'bugs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-sm font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-brand-500' : 'text-surface-400 hover:text-surface-200'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'overview' && (
          <div className="p-6 overflow-y-auto h-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-surface-100">Project Overview</h2>
              <button onClick={handleDownloadReport} className="btn-secondary btn-sm">
                Download PDF Report
              </button>
            </div>
            
            <div className="card mb-6">
              <h3 className="text-sm font-medium text-surface-300 mb-2">Description</h3>
              <p className="text-surface-100 whitespace-pre-wrap">{description}</p>
            </div>
            
            {tags?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-surface-300 mb-2">Tags</h3>
                <div className="flex gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="badge badge-gray">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'board' && (
          <KanbanBoard projectId={projectId} />
        )}
        
        {activeTab === 'sprints' && (
          <SprintList projectId={projectId} />
        )}
        
        {activeTab === 'bugs' && (
          <BugTracker projectId={projectId} />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
