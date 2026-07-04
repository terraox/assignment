import { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import api from '../utils/api';
import { AnimatedList } from './ui/animated-list';

interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-ink-muted hover:text-ink transition-colors rounded-full hover:bg-surface-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface-1" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-1 border border-surface-3 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-surface-3 flex items-center justify-between bg-surface-2">
            <h3 className="font-semibold text-sm text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-focus font-medium transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-ink-muted text-sm">
                No notifications
              </div>
            ) : (
              <AnimatedList delay={150}>
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`w-full p-3 text-sm transition-colors border border-surface-3 rounded-lg ${!notif.is_read ? 'bg-primary/5 border-primary/20' : 'bg-surface-1 hover:bg-surface-2'}`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className="flex-1">
                        <p className={`text-ink ${!notif.is_read ? 'font-medium' : ''}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-ink-muted mt-1">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-ink-muted hover:text-success p-1 h-fit rounded transition-colors shrink-0"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </AnimatedList>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
