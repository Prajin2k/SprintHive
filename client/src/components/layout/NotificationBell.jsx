import React, { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { fetchNotifications, fetchUnreadCount, markRead, markAllRead, addNotification } from '../../store/slices/notificationSlice';
import { socket } from '../../services/socket';
import useAuth from '../../hooks/useAuth';

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, accessToken } = useAuth();
  const { notifications, unreadCount } = useSelector(state => state.notification);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Only fetch after auth session is confirmed with a usable access token
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
        className="w-10 h-10 rounded-full flex items-center justify-center text-surface-400 hover:text-surface-100 hover:bg-surface-800 transition-colors relative"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg border-2 border-surface-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-800 rounded-xl shadow-2xl border border-surface-700 z-50 overflow-hidden flex flex-col max-h-96">
          <div className="p-3 border-b border-surface-700 flex justify-between items-center bg-surface-900">
            <h3 className="font-bold text-surface-50">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => dispatch(markAllRead())}
                className="text-xs text-brand-500 hover:text-brand-400 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-surface-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif._id}
                  onClick={() => !notif.read && dispatch(markRead(notif._id))}
                  className={`p-3 border-b border-surface-700/50 flex gap-3 hover:bg-surface-700 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-surface-700/20'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-surface-600 flex items-center justify-center shrink-0 overflow-hidden text-lg">
                    {notif.actor?.avatar ? <img src={notif.actor.avatar} className="w-full h-full object-cover" /> : '🐝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-surface-200 leading-tight">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-surface-500 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt))} ago
                    </p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1"></div>
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
