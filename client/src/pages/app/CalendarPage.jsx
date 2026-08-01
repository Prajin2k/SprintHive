import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import api from '../../services/api';
import { useOrg } from '../../hooks/useOrg';
import { useProject } from '../../hooks/useProject';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const CalendarPage = () => {
  const { activeOrg } = useOrg();
  const { projects, loadProjects } = useProject();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeOrg?._id) {
      loadProjects(activeOrg._id);
    }
  }, [activeOrg, loadProjects]);

  useEffect(() => {
    if (!activeOrg) return;

    let cancelled = false;

    const loadEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!projects.length) {
          if (!cancelled) {
            setEvents([]);
            setLoading(false);
          }
          return;
        }

        const taskLists = await Promise.all(
          projects.slice(0, 20).map((p) =>
            api
              .get(`/projects/${p._id}/tasks`)
              .then((res) =>
                (res.data?.data || [])
                  .filter((t) => t.deadline)
                  .map((t) => ({
                    title: t.title,
                    start: new Date(t.deadline),
                    end: new Date(t.deadline),
                    type: 'task',
                    resource: { projectId: p._id, taskId: t._id },
                  }))
              )
              .catch(() => [])
          )
        );

        if (!cancelled) {
          setEvents(taskLists.flat());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load calendar events');
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [activeOrg, projects]);

  const eventPropGetter = (event) => {
    let backgroundColor = '#5B5FFF';
    if (event.type === 'sprint') backgroundColor = '#3b82f6';
    return { style: { backgroundColor, border: 'none', borderRadius: '4px' } };
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <h1 className="text-2xl font-bold text-surface-50 mb-6">Calendar</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-surface-400">
          Loading calendar...
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-surface-800 rounded-xl border border-dashed border-surface-700 text-center px-6">
          <p className="text-surface-200 font-medium mb-2">No deadlines on the calendar</p>
          <p className="text-surface-400 text-sm">
            Tasks with deadlines will appear here once you create them.
          </p>
        </div>
      ) : (
        <div className="flex-1 bg-surface-800 rounded-xl p-4 border border-surface-700 overflow-hidden calendar-dark-override">
          <style
            dangerouslySetInnerHTML={{
              __html: `
          .rbc-calendar { font-family: inherit; color: #f8fafc; }
          .rbc-header { border-bottom: 1px solid #334155 !important; padding: 10px; font-weight: 600; color: #94a3b8; }
          .rbc-month-view { border: 1px solid #334155; border-radius: 8px; overflow: hidden; }
          .rbc-day-bg { border-left: 1px solid #334155; border-bottom: 1px solid #334155; }
          .rbc-off-range-bg { bg: #0f172a; }
          .rbc-today { background-color: rgba(249, 115, 22, 0.1); }
          .rbc-event { padding: 2px 6px; }
          .rbc-btn-group button { color: #f8fafc; border-color: #334155; background: #1e293b; }
          .rbc-btn-group button.rbc-active { background: #3b82f6; border-color: #3b82f6; }
          .rbc-toolbar button:active, .rbc-toolbar button:hover { background: #334155; }
        `,
            }}
          />
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventPropGetter}
            views={['month', 'week', 'day']}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
