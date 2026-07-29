import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const ProjectCard = ({ project }) => {
  const { _id, name, description, status, priority, progress, members, deadline, coverColor } = project;

  const statusColors = {
    planning: 'badge-gray',
    active: 'badge-blue',
    paused: 'badge-orange',
    completed: 'badge-green',
  };

  const priorityColors = {
    low: 'badge-blue',
    medium: 'badge-orange',
    high: 'badge-red',
  };

  return (
    <Link to={`/app/projects/${_id}`} className="block">
      <div className="card card-hover h-full flex flex-col relative overflow-hidden group">
        <div 
          className="absolute top-0 left-0 w-full h-1" 
          style={{ backgroundColor: coverColor || '#f97316' }} 
        />
        
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-surface-50 group-hover:text-brand-500 transition-colors">
            {name}
          </h3>
          <div className="flex gap-2">
            <span className={`badge ${statusColors[status] || 'badge-gray'}`}>
              {status}
            </span>
            {priority && (
              <span className={`badge ${priorityColors[priority] || 'badge-gray'}`}>
                {priority}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-surface-400 mb-6 line-clamp-2 flex-grow">
          {description || 'No description provided.'}
        </p>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between text-xs text-surface-300 mb-1">
              <span>Progress</span>
              <span>{progress || 0}%</span>
            </div>
            <div className="w-full bg-surface-700 rounded-full h-1.5">
              <div 
                className="bg-brand-500 h-1.5 rounded-full" 
                style={{ width: `${progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-surface-700">
            <div className="flex -space-x-2">
              {members?.slice(0, 4).map((member) => (
                <div 
                  key={member._id || member} 
                  className="w-7 h-7 rounded-full bg-surface-600 border border-surface-800 flex items-center justify-center text-xs font-bold"
                  title={member.name}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    member.initials || 'U'
                  )}
                </div>
              ))}
              {(members?.length || 0) > 4 && (
                <div className="w-7 h-7 rounded-full bg-surface-700 border border-surface-800 flex items-center justify-center text-xs font-bold text-surface-300">
                  +{members.length - 4}
                </div>
              )}
            </div>

            {deadline && (
              <div className="text-xs text-surface-400">
                {format(new Date(deadline), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProjectCard;
