import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

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
    medium: 'badge-yellow',
    high: 'badge-red',
  };

  return (
    <Link to={`/app/projects/${_id}`} className="block">
      <div className="card card-hover h-full flex flex-col relative overflow-hidden group">
        {/* Cover strip */}
        <div
          className="absolute top-0 left-0 w-full h-1 transition-all duration-200 group-hover:h-1.5"
          style={{ backgroundColor: coverColor || '#5B5FFF' }}
        />

        <div className="flex justify-between items-start mb-3 pt-1">
          <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors tracking-tight">
            {name}
          </h3>
          <div className="flex gap-2">
            <span className={`badge ${statusColors[status] || 'badge-gray'} capitalize`}>
              {status}
            </span>
            {priority && (
              <span className={`badge ${priorityColors[priority] || 'badge-gray'} capitalize`}>
                {priority}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-surface-300 mb-6 line-clamp-2 flex-grow leading-relaxed">
          {description || 'No description provided.'}
        </p>

        <div className="mt-auto space-y-4">
          <div>
            <div className="flex justify-between text-xs text-surface-400 mb-1.5 font-medium">
              <span>Progress</span>
              <span className="text-white font-bold">{progress || 0}%</span>
            </div>
            <div className="w-full bg-surface-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress || 0}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-surface-600">
            <div className="flex -space-x-2">
              {members?.slice(0, 4).map((member) => (
                <div
                  key={member._id || member}
                  className="w-7 h-7 rounded-full bg-brand-500/20 border-2 border-surface-700 flex items-center justify-center text-xs font-bold text-brand-300 overflow-hidden"
                  title={member.name}
                >
                  {member.avatar ? (
                    <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    member.initials || 'U'
                  )}
                </div>
              ))}
              {(members?.length || 0) > 4 && (
                <div className="w-7 h-7 rounded-full bg-surface-600 border-2 border-surface-700 flex items-center justify-center text-[10px] font-bold text-surface-300">
                  +{members.length - 4}
                </div>
              )}
            </div>

            {deadline && (
              <div className="text-xs text-surface-400 flex items-center gap-1">
                <Calendar size={12} className="text-surface-400" />
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
