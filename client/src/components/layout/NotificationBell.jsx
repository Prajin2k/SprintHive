import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { fetchNotifications, fetchUnreadCount, markRead, markAllRead, addNotification } from '../../store/slices/notificationSlice';
import { socket } from '../../services/socket';
import useAuth from '../../hooks/useAuth';
import logoIcon from '../../assets/logo_icon.png';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useAuth();
  const { notifications, unreadCount } = useSelector(state => state.notification);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    dispatch(fetchUnreadCount());

    socket.on('notification', (notif) => {
      dispatch(addNotification(notif));
    });

    return () => socket.off('notification');
  }, [dispatch, isAuthenticated, accessToken]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (!isOpen && notifications.length === 0) {
      dispatch(fetchNotifications());
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-surface-400 hover:text-white hover:bg-surface-800 border border-transparent hover:border-surface-600 transition-all duration-150"
        title="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-surface-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-800 rounded-2xl shadow-2xl border border-surface-600 z-50 overflow-hidden flex flex-col max-h-[420px] animate-slide-down">
          <div className="px-4 py-3 border-b border-surface-700 flex justify-between items-center flex-shrink-0"
               style={{ background: 'rgba(15,23,42,0.6)' }}>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-brand-400" />
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="badge badge-primary text-[10px] px-1.5 py-0.5">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => dispatch(markAllRead())}
                className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={32} className="text-surface-600 mx-auto mb-3" />
                <p className="text-surface-400 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => !notif.read && dispatch(markRead(notif._id))}
                  className={`p-3.5 border-b border-surface-700/50 flex gap-3 hover:bg-surface-700/50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-500/15 border border-brand-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {notif.actor?.avatar
                      ? <img src={notif.actor.avatar} className="w-full h-full object-cover rounded-full" alt="" />
                      : <img src={logoIcon} alt="Sprint Hive" className="w-5 h-5 object-contain" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-100 leading-snug">{notif.message}</p>
                    <p className="text-[10px] text-surface-500 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt))} ago
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
