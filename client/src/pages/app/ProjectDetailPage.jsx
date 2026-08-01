import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FileDown, Calendar as CalendarIcon } from 'lucide-react';
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
      <div className="p-6 md:p-8">
        <div className="skeleton h-20 w-full mb-6" />
        <div className="skeleton h-[600px] w-full" />
      </div>
    );
  }

  const { name, status, progress, deadline, description, tags } = activeProject;

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
      <div className="px-6 py-4 border-b border-surface-600 bg-surface-800/80 backdrop-blur-md shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
              {name}
              <span className="badge badge-primary text-xs capitalize">{status}</span>
            </h1>
            {deadline && (
              <p className="text-sm text-surface-400 mt-1 flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-surface-400" />
                Deadline: {format(new Date(deadline), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="w-36">
              <div className="flex justify-between text-xs text-surface-300 mb-1 font-medium">
                <span>Progress</span>
                <span className="text-white font-bold">{progress || 0}%</span>
              </div>
              <div className="w-full bg-surface-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 border-b border-surface-600">
          {['overview', 'board', 'sprints', 'bugs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 px-1 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab ? 'text-brand-400' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'overview' && (
          <div className="p-6 md:p-8 overflow-y-auto h-full max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Project Overview</h2>
              <button onClick={handleDownloadReport} className="btn-secondary btn-sm flex items-center gap-2">
                <FileDown size={15} /> Download PDF Report
              </button>
            </div>

            <div className="card mb-6">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-surface-200 leading-relaxed whitespace-pre-wrap">{description || 'No description provided.'}</p>
            </div>

            {tags?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="badge badge-primary">{tag}</span>
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
