import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Leaf, Users, ShieldCheck, Trophy, FileText, Settings as SettingsIcon, Bot } from 'lucide-react';

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
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
