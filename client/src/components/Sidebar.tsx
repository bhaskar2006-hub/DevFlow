import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users, Layers, Sparkles, Sliders } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/projects', label: 'Projects', icon: FolderKanban },
    { to: '/team', label: 'Team', icon: Users },
    { to: '/settings', label: 'Integrations', icon: Sliders },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 space-x-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-lg text-slate-900 tracking-tight">DevFlow</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
            PRO
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Promo Card */}
      <div className="p-4 m-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/70">
        <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Real-time Sync</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Manage issues, sprint kanban boards, and audit history seamlessly.
        </p>
      </div>
    </aside>
  );
};
