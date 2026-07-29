import React, { useState } from 'react';
import { format } from 'date-fns';

const BugTable = ({ bugs, onStatusChange }) => {
  const [expandedId, setExpandedId] = useState(null);

  const statusColors = {
    open: 'badge-red',
    'in-progress': 'badge-orange',
    fixed: 'badge-blue',
    verified: 'badge-green',
    closed: 'badge-gray'
  };

  const priorityColors = {
    low: 'badge-blue',
    medium: 'badge-amber',
    high: 'badge-orange',
    critical: 'badge-red'
  };

  return (
    <div className="overflow-x-auto bg-surface-800 rounded-xl border border-surface-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-900 text-surface-400">
          <tr>
            <th className="p-4 font-medium">ID</th>
            <th className="p-4 font-medium">Title</th>
            <th className="p-4 font-medium">Priority</th>
            <th className="p-4 font-medium">Status</th>
            <th className="p-4 font-medium">Reporter</th>
            <th className="p-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-700/50">
          {bugs.map(bug => (
            <React.Fragment key={bug._id}>
              <tr 
                className="hover:bg-surface-700/30 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === bug._id ? null : bug._id)}
              >
                <td className="p-4 font-mono text-xs text-surface-400">SHB-{bug._id.substring(0, 4)}</td>
                <td className="p-4 font-medium text-surface-200">{bug.title}</td>
                <td className="p-4"><span className={`badge ${priorityColors[bug.priority]}`}>{bug.priority}</span></td>
                <td className="p-4"><span className={`badge ${statusColors[bug.status]}`}>{bug.status}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-600 flex items-center justify-center text-xs overflow-hidden">
                      {bug.reporter?.avatar ? <img src={bug.reporter.avatar} className="w-full h-full object-cover" /> : 'U'}
                    </div>
                    <span className="text-surface-300">{bug.reporter?.name}</span>
                  </div>
                </td>
                <td className="p-4 text-surface-400">{format(new Date(bug.createdAt), 'MMM d, yyyy')}</td>
              </tr>
              {expandedId === bug._id && (
                <tr className="bg-surface-900/50">
                  <td colSpan={6} className="p-6 border-b border-surface-700">
                    <div className="max-w-3xl">
                      <h4 className="text-sm font-semibold text-surface-300 mb-2">Description</h4>
                      <p className="text-surface-100 mb-4 whitespace-pre-wrap">{bug.description}</p>
                      
                      {bug.stepsToReproduce && (
                        <>
                          <h4 className="text-sm font-semibold text-surface-300 mb-2">Steps to Reproduce</h4>
                          <p className="text-surface-100 whitespace-pre-wrap bg-surface-800 p-3 rounded">{bug.stepsToReproduce}</p>
                        </>
                      )}
                      
                      <div className="mt-6 flex gap-3">
                        {bug.status === 'open' && <button onClick={() => onStatusChange(bug._id, 'in-progress')} className="btn-sm btn-primary">Start Work</button>}
                        {bug.status === 'in-progress' && <button onClick={() => onStatusChange(bug._id, 'fixed')} className="btn-sm btn-primary">Mark Fixed</button>}
                        {bug.status === 'fixed' && <button onClick={() => onStatusChange(bug._id, 'verified')} className="btn-sm btn-primary bg-green-600 hover:bg-green-700">Verify Fix</button>}
                        {(bug.status === 'verified' || bug.status === 'open') && <button onClick={() => onStatusChange(bug._id, 'closed')} className="btn-sm btn-ghost">Close</button>}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          {bugs.length === 0 && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-surface-500">No bugs found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BugTable;
