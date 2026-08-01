import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { useOrg } from '../../hooks/useOrg';

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ projects: [], tasks: [], people: [] });
  const [loading, setLoading] = useState(false);
  const { activeOrg } = useOrg();
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!query.trim() || !activeOrg) {
      setResults({ projects: [], tasks: [], people: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(
          `/search?q=${encodeURIComponent(query)}&orgId=${activeOrg._id}`
        );
        const payload = res.data?.data || {};
        setResults({
          projects: payload.projects || [],
          tasks: payload.tasks || [],
          people: payload.users || payload.people || [],
        });
      } catch (err) {
        // Never invent results — show empty + allow "No results found"
        setResults({ projects: [], tasks: [], people: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeOrg]);

  const handleResultClick = (type, item) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'project') navigate(`/app/projects/${item._id}`);
    if (type === 'task') {
      // In a real app we'd open the task modal or go to the project board
      navigate(`/app/projects/${item.project}`);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-800 border border-transparent hover:border-surface-600 transition-all duration-150"
          title="Search (Ctrl+K)"
        >
          <Search size={17} />
        </button>
      ) : (
        <div className="flex items-center bg-surface-800 rounded-xl border border-brand-500/40 w-64 md:w-80 px-3.5 shadow-glow-sm transition-all duration-300">
          <Search size={15} className="text-surface-400 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            className="bg-transparent border-none focus:ring-0 text-white w-full py-2.5 px-3 text-sm placeholder-surface-500 outline-none"
            placeholder="Search projects, tasks, people…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && <div className="spinner-sm flex-shrink-0" />}
        </div>
      )}

      {isOpen && query.trim() && (
        <div className="absolute top-12 right-0 md:left-0 md:right-auto w-80 bg-surface-800 rounded-2xl shadow-2xl border border-surface-600 z-50 overflow-hidden max-h-[80vh] overflow-y-auto animate-slide-down">
          {(!results.projects?.length && !results.tasks?.length && !results.people?.length) ? (
            <div className="p-4 text-center text-surface-400 text-sm">
              {loading ? 'Searching...' : 'No results found'}
            </div>
          ) : (
            <>
              {results.projects?.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider px-4 py-2 bg-surface-900/50">Projects</h4>
                  {results.projects.map(p => (
                    <div key={p._id} onClick={() => handleResultClick('project', p)} className="px-4 py-2 hover:bg-surface-700 cursor-pointer flex justify-between items-center group">
                      <span className="text-sm text-surface-200 group-hover:text-brand-400 transition-colors">{p.name}</span>
                      <span className="text-[10px] bg-surface-600 px-1.5 rounded text-surface-300">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.tasks?.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider px-4 py-2 bg-surface-900/50">Tasks</h4>
                  {results.tasks.map(t => (
                    <div key={t._id} onClick={() => handleResultClick('task', t)} className="px-4 py-2 hover:bg-surface-700 cursor-pointer flex items-center gap-2 group">
                      <span className="text-[10px] text-surface-500 shrink-0">SH-{t._id.substring(0,4)}</span>
                      <span className="text-sm text-surface-200 group-hover:text-brand-400 truncate">{t.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {results.people?.length > 0 && (
                <div className="mb-2">
                  <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-wider px-4 py-2 bg-surface-900/50">People</h4>
                  {results.people.map(u => (
                    <div key={u._id} onClick={() => handleResultClick('person', u)} className="px-4 py-2 hover:bg-surface-700 cursor-pointer flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-surface-600 flex items-center justify-center text-[10px] shrink-0">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full rounded-full" /> : (u.name?.[0] || 'U')}
                      </div>
                      <span className="text-sm text-surface-200">{u.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
