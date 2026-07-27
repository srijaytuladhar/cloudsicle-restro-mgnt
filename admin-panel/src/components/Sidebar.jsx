import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Utensils, 
  SquareCheck, 
  ShoppingBag, 
  BarChart3, 
  ChefHat,
  ExternalLink
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/orders', label: 'Live Orders', icon: ShoppingBag },
    { to: '/menu', label: 'Menu Items', icon: Utensils },
    { to: '/tables', label: 'Tables & QR', icon: SquareCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const userAppUrl = import.meta.env.VITE_USER_APP_URL || 'http://localhost:5174';

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">Cloudsicle</h1>
            <p className="text-xs text-orange-400 font-medium">Restro Admin Hub</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-4 rounded-xl bg-slate-800/50 border border-slate-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Customer App</span>
          <a 
            href={userAppUrl} 
            target="_blank" 
            rel="noreferrer"
            className="text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            Launch <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-[11px] text-slate-500">
          Scannable table ordering platform.
        </p>
      </div>
    </aside>
  );
}
