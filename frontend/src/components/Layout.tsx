import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Leaf, Users, ShieldCheck, Trophy, FileText, Settings as SettingsIcon, Bot, Bell, Check } from 'lucide-react';
import api from '../lib/api';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-alt)] rounded-full transition-colors relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-alt)]">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <span className="text-xs text-[var(--text-secondary)]">{unreadCount} unread</span>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[var(--text-secondary)]">No notifications.</div>
            ) : notifications.map(n => (
              <div key={n.id} className={`p-4 text-sm flex gap-3 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                <div className="flex-1">
                  <p className={`text-[var(--text-primary)] ${!n.read ? 'font-medium' : ''}`}>{n.message}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <button 
                    onClick={() => markAsRead(n.id)}
                    className="text-[var(--brand-primary)] hover:text-blue-700 p-1 h-fit rounded-full hover:bg-blue-100 transition-colors"
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/environmental', label: 'Environmental', icon: Leaf },
    { to: '/social', label: 'Social', icon: Users },
    { to: '/governance', label: 'Governance', icon: ShieldCheck },
    { to: '/gamification', label: 'Gamification', icon: Trophy },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/copilot', label: 'AI Copilot', icon: Bot },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border flex flex-col h-screen">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold text-brand-primary">EcoSphere</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-brand-primary text-white'
                  : 'text-text-secondary hover:bg-surface-alt hover:text-text-primary'
              }`
            }
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

const Topbar = () => {
  return (
    <div className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 shadow-sm">
      <div className="flex-1"></div>
      <div className="flex items-center space-x-4">
        <NotificationBell />
        <NavLink to="/copilot" className="p-2 text-brand-primary hover:bg-surface-alt rounded-full transition-colors" title="AI Copilot">
          <Bot size={20} />
        </NavLink>
        <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
          U
        </div>
      </div>
    </div>
  );
};

export const Layout = () => {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
