import React, { useEffect, useState } from 'react';
import { useOrg } from '../../hooks/useOrg';
import api from '../../services/api';
import SprintCard from './SprintCard';
import SprintCreateModal from './SprintCreateModal';

const SprintList = ({ projectId }) => {
  const [sprints, setSprints] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userOrgRole } = useOrg();
  const canManage = ['owner', 'manager'].includes(userOrgRole);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/sprints`);
        setSprints(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSprints();
  }, [projectId]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sprint?')) return;
    try {
      await api.delete(`/projects/${projectId}/sprints/${id}`);
      setSprints(sprints.filter(s => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-surface-100">Sprints</h2>
        {canManage && (
          <button onClick={() => setIsModalOpen(true)} className="btn-primary btn-sm">
            Create Sprint
          </button>
        )}
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-surface-700 rounded-xl">
          <p className="text-surface-400">No sprints yet. Create your first sprint to organize tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sprints.map(sprint => (
            <SprintCard 
              key={sprint._id} 
              sprint={sprint} 
              canManage={canManage}
              onDelete={() => handleDelete(sprint._id)}
              onEdit={() => {}} 
            />
          ))}
        </div>
      )}

      <SprintCreateModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        projectId={projectId}
        onCreated={(newSprint) => setSprints([...sprints, newSprint])}
      />
    </div>
  );
};

export default SprintList;
