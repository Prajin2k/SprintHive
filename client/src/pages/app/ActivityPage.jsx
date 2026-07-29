import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useOrg } from '../../hooks/useOrg';

const ActivityPage = () => {
  const { activeOrg } = useOrg();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrg) {
      api
        .get(`/activities?orgId=${activeOrg._id}`)
        .then((res) => setActivities(res.data?.data || []))
        .catch((err) => {
          console.error(err);
          setActivities([]);
        })
        .finally(() => setLoading(false));
    }
  }, [activeOrg]);

  if (loading) return <div className="p-8 text-surface-400">Loading activity...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-surface-50">Activity Timeline</h1>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-20 card border-dashed">
          <span className="text-4xl mb-4 block">🕐</span>
          <h3 className="text-xl font-medium text-surface-200 mb-2">No activity yet</h3>
          <p className="text-surface-400">
            Actions across your workspace will show up here as an audit log.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => (
            <div key={act._id} className="card py-4 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center shrink-0 overflow-hidden">
                {act.user?.avatar ? (
                  <img src={act.user.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  act.user?.name?.[0] || '⚡'
                )}
              </div>
              <div>
                <p className="text-surface-100">
                  <span className="font-semibold text-brand-400">
                    {act.user?.name || 'Someone'}
                  </span>{' '}
                  {act.description}
                </p>
                <p className="text-sm text-surface-500 mt-1">
                  {new Date(act.timestamp || act.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
