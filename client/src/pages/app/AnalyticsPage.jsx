import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import api from '../../services/api';
import { useOrg } from '../../hooks/useOrg';

const STATUS_LABELS = {
  backlog: 'Backlog',
  todo: 'To Do',
  'in-progress': 'In Progress',
  'code-review': 'Code Review',
  testing: 'Testing',
  completed: 'Completed',
  open: 'Open',
  fixed: 'Fixed',
  verified: 'Verified',
  closed: 'Closed',
};

const mapStatusCounts = (obj = {}) =>
  Object.entries(obj).map(([key, value]) => ({
    name: STATUS_LABELS[key] || key,
    value,
    count: value,
  }));

const AnalyticsPage = () => {
  const { activeOrg } = useOrg();
  const [activeTab, setActiveTab] = useState('tasks');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeOrg) return;

    setLoading(true);
    setError(null);
    setData(null);

    api
      .get(`/analytics?orgId=${activeOrg._id}`)
      .then((res) => {
        const raw = res.data?.data || {};
        const tasksByStatus = raw.tasksByStatus || {};
        const bugsByStatus = raw.bugsByStatus || {};
        const projectProgress = raw.projectProgress || [];
        const teamPerformance = raw.teamPerformance || [];

        setData({
          tasks: {
            distribution: mapStatusCounts(tasksByStatus).filter((d) => d.value > 0),
            perProject: projectProgress.map((p) => ({
              name: p.name,
              completed: p.completedTasks || 0,
              pending: Math.max((p.totalTasks || 0) - (p.completedTasks || 0), 0),
            })),
          },
          bugs: {
            byStatus: mapStatusCounts(bugsByStatus),
            totalOpen: (bugsByStatus.open || 0) + (bugsByStatus['in-progress'] || 0),
          },
          team: teamPerformance.map((m) => ({
            userId: m.userId,
            name: m.name || String(m.userId).slice(0, 8),
            completedTasks: m.completedTasks || 0,
            avgCompletionDays: m.avgCompletionDays || 0,
            openBugs: m.openBugs || 0,
            productivity: m.productivity || 0,
          })),
        });
      })
      .catch((err) => {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load analytics');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [activeOrg]);

  const COLORS = ['#64748b', '#3b82f6', '#f97316', '#8b5cf6', '#f59e0b', '#10b981'];

  if (loading) return <div className="p-8 text-surface-400">Loading analytics...</div>;

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-surface-50 mb-4">Analytics Overview</h1>
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-surface-50 mb-4">Analytics Overview</h1>
        <p className="text-surface-400">No analytics data available yet.</p>
      </div>
    );
  }

  const hasTaskData =
    data.tasks.distribution.length > 0 || data.tasks.perProject.length > 0;
  const hasBugData = data.bugs.byStatus.some((b) => b.count > 0);
  const hasTeamData = data.team.length > 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-surface-50 mb-8">Analytics Overview</h1>

      <div className="flex gap-6 border-b border-surface-700 mb-8">
        {['tasks', 'bugs', 'team'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-2 text-sm font-medium capitalize transition-colors relative ${
              activeTab === tab ? 'text-brand-500' : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-500" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' &&
        (!hasTaskData ? (
          <div className="card py-16 text-center text-surface-400">
            No task data yet. Create projects and tasks to see analytics.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-bold text-surface-100 mb-6">Task Distribution</h3>
              {data.tasks.distribution.length === 0 ? (
                <p className="text-surface-400 text-sm py-12 text-center">No tasks yet.</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.tasks.distribution}
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.tasks.distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div className="card">
              <h3 className="font-bold text-surface-100 mb-6">Tasks per Project</h3>
              {data.tasks.perProject.length === 0 ? (
                <p className="text-surface-400 text-sm py-12 text-center">No projects yet.</p>
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tasks.perProject}>
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#10b981" />
                      <Bar dataKey="pending" stackId="a" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        ))}

      {activeTab === 'bugs' &&
        (!hasBugData ? (
          <div className="card py-16 text-center text-surface-400">
            No bugs reported yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-bold text-surface-100 mb-2">Bug Status</h3>
              <p className="text-sm text-surface-400 mb-6">
                Total Open Bugs:{' '}
                <span className="font-bold text-red-400">{data.bugs.totalOpen}</span>
              </p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.bugs.byStatus}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}

      {activeTab === 'team' &&
        (!hasTeamData ? (
          <div className="card py-16 text-center text-surface-400">
            No team performance data yet.
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-surface-700 text-surface-400">
                <tr>
                  <th className="p-4 font-medium">Team Member</th>
                  <th className="p-4 font-medium text-right">Completed Tasks</th>
                  <th className="p-4 font-medium text-right">Avg Completion (Days)</th>
                  <th className="p-4 font-medium text-right">Open Bugs</th>
                  <th className="p-4 font-medium text-right">Productivity Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {data.team.map((member) => (
                  <tr key={member.userId} className="text-surface-200">
                    <td className="p-4 font-medium">{member.name}</td>
                    <td className="p-4 text-right">{member.completedTasks}</td>
                    <td className="p-4 text-right">
                      {(member.avgCompletionDays || 0).toFixed(1)}
                    </td>
                    <td className="p-4 text-right text-red-400">{member.openBugs}</td>
                    <td className="p-4 text-right">
                      <span className="badge badge-green">
                        {Math.round(member.productivity)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
};

export default AnalyticsPage;
