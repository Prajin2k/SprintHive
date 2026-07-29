import { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import useOrg from '../../hooks/useOrg';
import { switchActiveOrg } from '../../store/slices/orgSlice';

const ROLE_COLORS = {
  owner: 'text-amber-400',
  manager: 'text-blue-400',
  teamlead: 'text-purple-400',
  developer: 'text-green-400',
  tester: 'text-pink-400',
};

function OrgAvatar({ org, size = 'sm' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  const letter = org?.name?.[0]?.toUpperCase() || '?';

  // Generate a consistent color from the org name
  const colors = ['bg-brand-500', 'bg-purple-600', 'bg-blue-600', 'bg-emerald-600', 'bg-pink-600'];
  const colorIndex = (org?.name?.charCodeAt(0) || 0) % colors.length;

  return (
    <div className={`${dim} ${colors[colorIndex]} rounded-lg flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}>
      {org?.avatar ? (
        <img src={org.avatar} alt={org.name} className="w-full h-full object-cover" />
      ) : (
        letter
      )}
    </div>
  );
}

export default function OrgSwitcher() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myOrgs, activeOrg, userOrgRole } = useOrg();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = (org) => {
    dispatch(switchActiveOrg(org));
    setIsOpen(false);
  };

  if (!activeOrg) {
    return (
      <button
        onClick={() => navigate('/app/onboarding')}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-700 transition-colors text-sm text-brand-400"
      >
        <span className="text-base">＋</span>
        <span>Create Organization</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        id="org-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface-700 transition-colors group"
      >
        <OrgAvatar org={activeOrg} />
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-white truncate">{activeOrg.name}</p>
          <p className={`text-[10px] capitalize truncate ${ROLE_COLORS[userOrgRole] || 'text-slate-500'}`}>
            {userOrgRole}
          </p>
        </div>
        <span className={`text-slate-500 text-xs transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-surface-800 border border-surface-600 rounded-xl shadow-2xl overflow-hidden animate-slide-down">
          {/* Org list */}
          <div className="max-h-52 overflow-y-auto p-1">
            {myOrgs.map((org) => (
              <button
                key={org._id}
                onClick={() => handleSwitch(org)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all duration-100 ${
                  org._id === activeOrg._id
                    ? 'bg-brand-500/10 text-white'
                    : 'text-slate-300 hover:bg-surface-700 hover:text-white'
                }`}
              >
                <OrgAvatar org={org} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <p className={`text-[10px] capitalize ${ROLE_COLORS[org.userRole] || 'text-slate-500'}`}>
                    {org.userRole}
                  </p>
                </div>
                {org._id === activeOrg._id && (
                  <span className="text-brand-400 text-sm flex-shrink-0">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Create new org */}
          <div className="border-t border-surface-700 p-1">
            <button
              onClick={() => { navigate('/app/onboarding'); setIsOpen(false); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-400 hover:text-brand-400 hover:bg-surface-700 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-xs">＋</span>
              <span>New Organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
