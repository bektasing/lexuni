import { NavLink } from 'react-router-dom';
import { Home, Play, BookOpen, Import, History as HistoryIcon } from 'lucide-react';

export default function Navigation() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/import', icon: Import, label: 'Import' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50 sm:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
