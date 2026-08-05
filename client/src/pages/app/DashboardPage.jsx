import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useOrg } from '../../hooks/useOrg';
import { fetchProjects } from '../../store/slices/projectSlice';
import api from '../../services/api';
import emptyStateImg from '../../assets/empty_state.png';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { activeOrg, isLoading, hasOrgs } = useOrg();
  const projects = useSelector((state) => state.project?.projects || []);

  const [stats, setStats] = useState({
    myTasksToday: 0,
    completedToday: 0,
    overdue: 0,
    teamMembers: 0,
    projectProgress: [],
  });
  const [activities, setActivities] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait for organizations to finish loading and for an active organization to be available
    if (isLoading) return;

    if (!activeOrg) {
      // If loading finished and the user has no orgs, send them to onboarding
      if (hasOrgs === false) {
        navigate('/app/onboarding');
      }
      // Otherwise, either orgs are being restored elsewhere or an unexpected state occurred — do nothing and wait
      return;
    }

    dispatch(fetchProjects(activeOrg._id));

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [analyticsRes, activityRes, tasksRes] = await Promise.all([
          api.get(`/analytics?orgId=${activeOrg._id}`),
          api.get(`/activities?orgId=${activeOrg._id}`),
          Promise.resolve(null),
        ]);

        const analytics = analyticsRes.data?.data || {};
        const projectProgress = (analytics.projectProgress || []).map((p) => ({
          name: p.name,
          progress: p.progress ?? 0,
        }));

        const tasksByStatus = analytics.tasksByStatus || {};
        const completedToday = tasksByStatus.completed || 0;

        setStats({
          myTasksToday: 0,
          completedToday,
          overdue: 0,
          teamMembers: activeOrg.members?.length || 0,
          projectProgress,
        });
        setActivities(activityRes.data?.data || []);
        setMyTasks([]);
        void tasksRes;
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || 'Failed to load dashboard');
        setStats({
          myTasksToday: 0,
          completedToday: 0,
          overdue: 0,
          teamMembers: activeOrg.members?.length || 0,
          projectProgress: [],
        });
        setActivities([]);
        setMyTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeOrg, isLoading, hasOrgs, dispatch, navigate]);

  useEffect(() => {
    if (!activeOrg || !projects.length || !user) return;

    let cancelled = false;
    const loadMyTasks = async () => {
      try {
        const results = await Promise.all(
          projects.slice(0, 10).map((p) =>
            api
              .get(`/projects/${p._id}/tasks`, { params: { assignee: user._id || user.id } })
              .then((res) =>
                (res.data?.data || []).map((t) => ({
                  ...t,
                  project: { _id: p._id, name: p.name },
                }))
              )
              .catch(() => [])
          )
        );
        if (cancelled) return;
        const flat = results.flat().filter((t) => t.deadline || t.status !== 'completed');
        flat.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
        setMyTasks(flat.slice(0, 8));
        setStats((s) => ({
          ...s,
          myTasksToday: flat.filter((t) => {
            if (!t.deadline) return false;
            const d = new Date(t.deadline);
            const now = new Date();
            return (
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth() &&
              d.getDate() === now.getDate()
            );
          }).length,
          overdue: flat.filter(
            (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
          ).length,
        }));
      } catch (_) {}
    };
    loadMyTasks();
    return () => {
      cancelled = true;
    };
  }, [projects, activeOrg, user]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <div className="spinner mb-3" />
        <p className="text-surface-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {greeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-surface-400 mt-1 text-sm">
          Here&apos;s what&apos;s happening in <span className="text-white font-medium">{activeOrg?.name}</span> today.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="card border-l-4 border-l-brand-500 bg-surface-800/80">
          <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider">My Tasks Due Today</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.myTasksToday}</p>
        </div>
        <div className="card border-l-4 border-l-green-500 bg-surface-800/80">
          <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider">Completed (all time)</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.completedToday}</p>
        </div>
        <div className="card border-l-4 border-l-red-500 bg-surface-800/80">
          <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider">Overdue Tasks</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.overdue}</p>
        </div>
        <div className="card border-l-4 border-l-accent-500 bg-surface-800/80">
          <p className="text-surface-400 text-xs font-semibold uppercase tracking-wider">Team Members</p>
          <p className="text-3xl font-bold text-white mt-2">{stats.teamMembers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-6">Project Progress</h2>
            {stats.projectProgress.length === 0 ? (
              <div className="py-10 text-center flex flex-col items-center justify-center">
                <div className="w-44 h-36 mb-3 flex items-center justify-center">
                  <img
                    src={emptyStateImg}
                    alt="No projects"
                    className="w-full h-full object-contain mx-auto"
                  />
                </div>
                <p className="text-surface-300 text-sm font-medium mb-3">No projects yet — create your first one.</p>
                <Link to="/app/projects" className="btn-primary btn-sm">
                  Go to Projects →
                </Link>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.projectProgress}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94A3B8' }}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: '#334155', opacity: 0.2 }}
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        border: '1 border-surface-600',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={20}>
                      {stats.projectProgress.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#5B5FFF' : '#22D3EE'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">My Urgent Tasks</h2>
            <div className="space-y-3">
              {myTasks.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center justify-center">
                  <img src={emptyStateImg} alt="No tasks" className="w-32 h-24 object-contain mx-auto mb-2" />
                  <p className="text-surface-400 text-sm">No urgent tasks assigned to you right now.</p>
                </div>
              ) : (
                myTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex justify-between items-center p-3.5 bg-surface-800 rounded-xl border border-surface-600 hover:border-surface-500 transition-colors"
                  >
                    <div>
                      <p className="text-white font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-surface-400 mt-0.5">{task.project?.name}</p>
                    </div>
                    <span className="text-xs text-red-400 font-semibold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                      {task.deadline
                        ? format(new Date(task.deadline), 'MMM d')
                        : 'No deadline'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-surface-400 text-sm py-4 text-center">No activity yet for this workspace.</p>
              ) : (
                activities.slice(0, 10).map((act) => (
                  <div key={act._id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/25 shrink-0 flex items-center justify-center text-brand-400">
                      ⚡
                    </div>
                    <div>
                      <p className="text-surface-200">{act.description}</p>
                      <p className="text-xs text-surface-400 mt-1">
                        {act.timestamp
                          ? format(new Date(act.timestamp), 'MMM d, h:mm a')
                          : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card border border-brand-500/30 bg-brand-500/5">
            <h2 className="text-lg font-bold text-brand-400 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                to="/app/projects"
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-sm font-medium"
              >
                + New Project
              </Link>
              <Link
                to="/app/settings/organization"
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-sm font-medium"
              >
                + Invite Member
              </Link>
              <Link
                to="/app/settings/organization"
                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-surface-700 text-surface-200 hover:text-white transition-colors text-sm font-medium"
              >
                Workspace Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
