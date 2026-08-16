import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { adminFetch } from '../utils/api';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await adminFetch('/api/user/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore background errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Polling every 60s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await adminFetch(`/api/user/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await adminFetch('/api/user/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-control border border-border text-muted hover:text-fg hover:bg-subtle transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-600 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-border rounded-panel shadow-2xl z-50 overflow-hidden font-sans">
          <div className="p-3 border-b border-border flex items-center justify-between bg-bg/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-600" />
              <h3 className="text-xs font-bold text-fg">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-[10px] font-mono font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-mono text-violet-600 hover:text-violet-700 font-bold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border/60">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted font-mono">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markAsRead(n.id)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 ${
                    n.isRead ? 'bg-white opacity-70' : 'bg-violet-500/5 font-semibold'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    {n.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                     n.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600" /> :
                     n.type === 'error' ? <XCircle className="w-4 h-4 text-red-600" /> :
                     <Info className="w-4 h-4 text-violet-600" />}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <p className="text-fg text-xs font-bold leading-snug">{n.title}</p>
                    <p className="text-muted text-[11px] font-normal leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted/80 font-mono pt-1">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {!n.isRead && (
                    <div className="shrink-0">
                      <span className="w-2 h-2 rounded-full bg-violet-600 block mt-1" />
                    </div>
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
