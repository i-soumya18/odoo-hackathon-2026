import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Leaf, Users, ShieldCheck, Trophy, FileText,
  Settings as SettingsIcon, Bot, Bell, Check, ChevronRight,
  LogOut, Zap, X
} from 'lucide-react';
import api from '../lib/api';

/* ─── Notification Bell ─────────────────────────────────────── */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch { /* silent */ }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--brand-primary)] hover:bg-[var(--surface-alt)] rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-up">
            <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-alt)]">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
              <span className="text-xs text-[var(--text-secondary)] bg-white border border-[var(--border)] px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  All caught up!
                </div>
              ) : notifications.map(n => (
                <div key={n.id} className={`p-4 text-sm flex gap-3 transition-colors ${!n.read ? 'bg-blue-50/40' : 'hover:bg-[var(--surface-alt)]'}`}>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[var(--text-primary)] leading-snug ${!n.read ? 'font-medium' : ''}`}>{n.message}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="shrink-0 p-1 text-[var(--brand-primary)] hover:bg-blue-100 rounded-full transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ─── Nav Item ───────────────────────────────────────────────── */
const NAV_ITEMS = [
  { to: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard, color: 'var(--brand-primary)' },
  { to: '/environmental', label: 'Environmental',  icon: Leaf,            color: 'var(--accent-environmental)' },
  { to: '/social',        label: 'Social',         icon: Users,           color: 'var(--accent-social)' },
  { to: '/governance',    label: 'Governance',     icon: ShieldCheck,     color: 'var(--accent-governance)' },
  { to: '/gamification',  label: 'Gamification',   icon: Trophy,          color: 'var(--accent-xp)' },
  { to: '/reports',       label: 'Reports',        icon: FileText,        color: 'var(--text-secondary)' },
  { to: '/copilot',       label: 'AI Copilot',     icon: Bot,             color: 'var(--accent-overall)' },
  { to: '/settings',      label: 'Settings',       icon: SettingsIcon,    color: 'var(--text-secondary)' },
];

/* ─── Sidebar ────────────────────────────────────────────────── */
const Sidebar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  return (
    <div className="w-60 flex flex-col h-screen bg-white border-r border-[var(--border)] shrink-0" style={{ boxShadow: '1px 0 0 var(--border)' }}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #714B67, #5C3B54)' }}>
            <Leaf size={16} className="text-white" />
          </div>
          <div>
            <span className="text-[15px] font-bold" style={{ color: 'var(--brand-primary)' }}>EcoSphere</span>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium tracking-wide leading-tight">ESG Operating System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group ${
                isActive
                  ? 'bg-[var(--brand-primary)] text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-alt)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  size={16}
                  style={{ color: isActive ? 'white' : item.color }}
                  className="shrink-0"
                />
                <span>{item.label}</span>
                {item.to === '/copilot' && !isActive && (
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-[var(--accent-overall)] text-white rounded-full">AI</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-[var(--border)] p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--surface-alt)] transition-colors group cursor-pointer">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #714B67, #5C3B54)' }}
          >
            {user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate">{user?.name || 'Admin User'}</p>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 p-1 text-[var(--text-secondary)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Topbar ─────────────────────────────────────────────────── */
const Topbar = ({ orgScore }) => {
  return (
    <div className="h-14 bg-white border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0" style={{ boxShadow: '0 1px 0 var(--border)' }}>
      {/* Left: org score chip */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[var(--surface-alt)] border border-[var(--border)] rounded-lg px-3 py-1.5">
          <Zap size={13} className="text-[var(--accent-overall)]" />
          <span className="text-xs text-[var(--text-secondary)] font-medium">Overall ESG</span>
          <span className="text-sm font-bold score-num" style={{ color: 'var(--accent-overall)' }}>
            {orgScore !== null ? orgScore.toFixed(1) : '—'}
          </span>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <NotificationBell />
        <NavLink
          to="/copilot"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:bg-[var(--surface-alt)]"
          style={{ color: 'var(--accent-overall)' }}
          title="Open AI Copilot"
        >
          <Bot size={15} />
          <span className="hidden md:inline">Copilot</span>
        </NavLink>
      </div>
    </div>
  );
};

/* ─── Toast ──────────────────────────────────────────────────── */
export const ToastContext = React.createContext({ show: (_msg: string, _type?: string) => {} });
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const show = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };
  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-fade-in-up border ${
              t.type === 'success' ? 'bg-white border-green-200 text-green-800' :
              t.type === 'error' ? 'bg-white border-red-200 text-red-800' :
              'bg-white border-[var(--border)] text-[var(--text-primary)]'
            }`}
          >
            {t.type === 'success' ? <Check size={15} className="text-green-600" /> : <X size={15} className="text-red-500" />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/* ─── Layout Root ────────────────────────────────────────────── */
export const Layout = () => {
  const [user, setUser] = useState(null);
  const [orgScore, setOrgScore] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch { /* silent */ }
    };
    const fetchOrgScore = async () => {
      try {
        const res = await api.get('/scores/organization');
        setOrgScore(res.data.total_score);
      } catch { /* silent */ }
    };
    fetchUser();
    fetchOrgScore();
  }, []);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
        <Sidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <Topbar orgScore={orgScore} />
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
