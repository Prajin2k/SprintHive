import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import BugTable from './BugTable';
import ReportBugForm from './ReportBugForm';

const BugTracker = ({ projectId }) => {
  const [bugs, setBugs] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/bugs`);
        setBugs(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBugs();
  }, [projectId]);

  const handleStatusChange = async (bugId, newStatus) => {
    try {
      const res = await api.patch(`/projects/${projectId}/bugs/${bugId}`, { status: newStatus });
      const updatedBug = res.data?.data || res.data;
      setBugs(bugs.map(b => b._id === bugId ? updatedBug : b));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBugs = filter === 'all' ? bugs : bugs.filter(b => b.status === filter);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {['all', 'open', 'in-progress', 'fixed', 'verified', 'closed'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full capitalize transition-colors ${filter === f ? 'bg-brand-500 text-white' : 'bg-surface-800 text-surface-400 hover:text-surface-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowReportForm(!showReportForm)} 
          className="btn-danger btn-sm"
        >
          {showReportForm ? 'Cancel' : 'Report Bug'}
        </button>
      </div>

      {showReportForm && (
        <ReportBugForm 
          projectId={projectId} 
          onCancel={() => setShowReportForm(false)} 
          onSubmitted={(newBug) => {
            setBugs([newBug, ...bugs]);
            setShowReportForm(false);
          }}
        />
      )}

      <BugTable bugs={filteredBugs} onStatusChange={handleStatusChange} />
    </div>
  );
};

export default BugTracker;
